/**
 * nexusMemoryService — Nexus Phase 1 N2 Memory System
 * Issue #40 (N2): Nexus Memory System (Working + Episodic + Semantic)
 *
 * Provides 3 tiers of memory for the Nexus companion (#39 N1 conversation engine):
 *  - WORKING:  short-context session buffer (user expressions, last-asked, scratchpad)
 *  - EPISODIC: user-level narrative history (past conversations, decisions, key events)
 *  - SEMANTIC: long-term structured facts (profile, preferences, role, org, relationships)
 *
 * Used by:
 *  - #41 N3: User Context Assembly (tier gating + memory -> prompt context)
 *  - #43 N5: Proactive Suggestion Engine (reads episodic/semantic signals to surface cards)
 *  - #42 N4: RAG Content Library (semantic memory + vector hits → unified context)
 */
import { useAuthStore } from '@/stores/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────
export type MemoryTier = 'working' | 'episodic' | 'semantic';

export interface WorkingMemoryItem {
  id: string;
  tier: 'working';
  key: string;
  value: string;
  expiresAt: number | null;
  touchedAt: number;
  createdAt: number;
  conversationId?: string;
}

export interface EpisodicMemoryItem {
  id: string;
  tier: 'episodic';
  title: string;
  summary: string;
  happenedAt: number;
  participants: string[];
  tags: string[];
  embedding?: number[];
  referencedEntities?: { type: string; id: string; name?: string }[];
  source?: string;
}

export interface SemanticFact {
  id: string;
  tier: 'semantic';
  domain: 'profile' | 'preferences' | 'role' | 'organization' | 'relationship' | 'context' | 'skills';
  key: string;
  value: unknown;
  confidence: number; // 0-1
  source: string;
  updatedAt: number;
  createdAt: number;
  isExplicit: boolean; // true if user told us directly vs inferred
}

export type MemoryItem = WorkingMemoryItem | EpisodicMemoryItem | SemanticFact;

export interface NexusMemorySnapshot {
  userId: string;
  conversationId?: string;
  working: WorkingMemoryItem[];
  episodic: EpisodicMemoryItem[];
  semantic: SemanticFact[];
  generatedAt: number;
}

export interface MemoryWriteOpts {
  ttlSeconds?: number; // working memory only
  source?: string;
  confidence?: number;
}

const STORAGE_PREFIX = 'nexus_memory::';
const DEFAULT_WORKING_TTL = 30 * 60 * 1000; // 30 min

// ─── Low-level storage helpers ──────────────────────────────────────────────
function bucket(userId: string, tier: MemoryTier): string {
  return `${STORAGE_PREFIX}${userId}::${tier}`;
}

function readBucket<T extends MemoryItem>(userId: string, tier: MemoryTier): T[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(bucket(userId, tier)) : null;
    if (!raw) return [];
    const arr = JSON.parse(raw) as T[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeBucket<T extends MemoryItem>(userId: string, tier: MemoryTier, items: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(bucket(userId, tier), JSON.stringify(items));
  } catch {
    // Storage full / disabled — silently drop
  }
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Working Memory ─────────────────────────────────────────────────────────
export function workingGet(userId: string, conversationId?: string): WorkingMemoryItem[] {
  const all = readBucket<WorkingMemoryItem>(userId, 'working');
  const now = Date.now();
  const alive = all.filter(m => !m.expiresAt || m.expiresAt > now);
  if (alive.length !== all.length) {
    writeBucket(userId, 'working', alive);
  }
  if (conversationId) return alive.filter(m => !m.conversationId || m.conversationId === conversationId);
  return alive;
}

export function workingSet(
  userId: string,
  key: string,
  value: string,
  opts: MemoryWriteOpts & { conversationId?: string } = {}
): WorkingMemoryItem {
  const items = workingGet(userId, opts.conversationId);
  const now = Date.now();
  const existing = items.find(i => i.key === key && (!opts.conversationId || i.conversationId === opts.conversationId));
  const item: WorkingMemoryItem = existing
    ? { ...existing, value, touchedAt: now, expiresAt: opts.ttlSeconds ? now + opts.ttlSeconds * 1000 : existing.expiresAt }
    : {
        id: uid('wm'),
        tier: 'working',
        key,
        value,
        expiresAt: opts.ttlSeconds ? now + opts.ttlSeconds * 1000 : now + DEFAULT_WORKING_TTL,
        touchedAt: now,
        createdAt: now,
        conversationId: opts.conversationId,
      };
  const next = existing
    ? items.map(i => (i.id === existing.id ? item : i))
    : [...items, item];
  writeBucket(userId, 'working', next);
  return item;
}

export function workingDelete(userId: string, key: string, conversationId?: string): boolean {
  const items = readBucket<WorkingMemoryItem>(userId, 'working');
  const filtered = items.filter(i => !(i.key === key && (!conversationId || i.conversationId === conversationId)));
  const removed = filtered.length !== items.length;
  if (removed) writeBucket(userId, 'working', filtered);
  return removed;
}

// ─── Episodic Memory ────────────────────────────────────────────────────────
export function episodicList(userId: string, opts: { limit?: number; tag?: string; before?: number } = {}): EpisodicMemoryItem[] {
  const items = readBucket<EpisodicMemoryItem>(userId, 'episodic');
  const sorted = items
    .filter(e => !opts.tag || e.tags.includes(opts.tag))
    .filter(e => !opts.before || e.happenedAt < opts.before)
    .sort((a, b) => b.happenedAt - a.happenedAt);
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}

export function episodicRecord(userId: string, ep: Omit<EpisodicMemoryItem, 'id' | 'tier'> & { id?: string }): EpisodicMemoryItem {
  const items = readBucket<EpisodicMemoryItem>(userId, 'episodic');
  const item: EpisodicMemoryItem = {
    id: ep.id ?? uid('ep'),
    tier: 'episodic',
    title: ep.title,
    summary: ep.summary,
    happenedAt: ep.happenedAt,
    participants: ep.participants ?? [],
    tags: ep.tags ?? [],
    embedding: ep.embedding,
    referencedEntities: ep.referencedEntities,
    source: ep.source,
  };
  items.push(item);
  writeBucket(userId, 'episodic', items.slice(-500)); // cap at last 500 episodes
  return item;
}

export function episodicSearch(userId: string, query: string, limit = 10): EpisodicMemoryItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return episodicList(userId, { limit });
  const items = readBucket<EpisodicMemoryItem>(userId, 'episodic');
  const scored = items.map(e => {
    const hay = `${e.title} ${e.summary} ${e.tags.join(' ')}`.toLowerCase();
    let score = 0;
    for (const term of q.split(/\s+/)) {
      if (!term) continue;
      if (hay.includes(term)) score += 3;
      const occurrences = hay.split(term).length - 1;
      score += occurrences;
    }
    return { e, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || b.e.happenedAt - a.e.happenedAt)
    .slice(0, limit)
    .map(s => s.e);
}

// ─── Semantic Memory ────────────────────────────────────────────────────────
export function semanticFacts(userId: string, domain?: SemanticFact['domain']): SemanticFact[] {
  const facts = readBucket<SemanticFact>(userId, 'semantic');
  return domain ? facts.filter(f => f.domain === domain) : facts;
}

export function semanticUpsert(
  userId: string,
  domain: SemanticFact['domain'],
  key: string,
  value: unknown,
  opts: MemoryWriteOpts & { isExplicit?: boolean } = {}
): SemanticFact {
  const facts = semanticFacts(userId);
  const now = Date.now();
  const existing = facts.find(f => f.domain === domain && f.key === key);
  const fact: SemanticFact = existing
    ? { ...existing, value, confidence: opts.confidence ?? existing.confidence, updatedAt: now, isExplicit: opts.isExplicit ?? existing.isExplicit, source: opts.source ?? existing.source }
    : {
        id: uid('sf'),
        tier: 'semantic',
        domain,
        key,
        value,
        confidence: opts.confidence ?? 0.8,
        source: opts.source ?? 'nexus-infer',
        updatedAt: now,
        createdAt: now,
        isExplicit: opts.isExplicit ?? false,
      };
  const next = existing ? facts.map(f => (f.id === existing.id ? fact : f)) : [...facts, fact];
  writeBucket(userId, 'semantic', next);
  return fact;
}

export function semanticGet(userId: string, domain: SemanticFact['domain'], key: string): SemanticFact | undefined {
  return semanticFacts(userId, domain).find(f => f.key === key);
}

// ─── Snapshot (used by N3 user context assembly) ────────────────────────────
export function assembleMemorySnapshot(userId: string, conversationId?: string, maxEpisodic = 12): NexusMemorySnapshot {
  return {
    userId,
    conversationId,
    working: workingGet(userId, conversationId),
    episodic: episodicList(userId, { limit: maxEpisodic }),
    semantic: semanticFacts(userId),
    generatedAt: Date.now(),
  };
}

export function assemblePromptContext(snap: NexusMemorySnapshot, opts: { includeWorking?: boolean; includeEpisodic?: boolean; includeSemantic?: boolean } = {}): string {
  const lines: string[] = [];
  const include = { includeWorking: true, includeEpisodic: true, includeSemantic: true, ...opts };

  if (include.includeWorking && snap.working.length) {
    lines.push('## Working Memory (short-term scratchpad)');
    for (const w of snap.working) lines.push(`- ${w.key}: ${w.value}`);
    lines.push('');
  }
  if (include.includeEpisodic && snap.episodic.length) {
    lines.push('## Episodic Memory (recent events)');
    for (const ep of snap.episodic) {
      const when = new Date(ep.happenedAt).toISOString().slice(0, 10);
      lines.push(`- [${when}] ${ep.title} — ${ep.summary}`);
    }
    lines.push('');
  }
  if (include.includeSemantic && snap.semantic.length) {
    lines.push('## Semantic Memory (structured facts)');
    for (const sf of snap.semantic) {
      const v = typeof sf.value === 'string' ? sf.value : JSON.stringify(sf.value);
      lines.push(`- ${sf.domain}:${sf.key} = ${v}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ─── Hook-friendly convenience ──────────────────────────────────────────────
export function useCurrentUserId(): string {
  try {
    return useAuthStore.getState().profile?.id ?? 'anon';
  } catch {
    return 'anon';
  }
}

export function seedDemoMemory(userId: string, profile?: { name?: string; role?: string; tier?: string }): void {
  const now = Date.now();
  if (semanticFacts(userId, 'profile').length === 0) {
    semanticUpsert(userId, 'profile', 'name', profile?.name ?? 'Nexus User', { confidence: 1, isExplicit: true, source: 'demo-seed' });
    semanticUpsert(userId, 'role', 'primaryRole', profile?.role ?? 'consultant', { confidence: 0.9, isExplicit: true, source: 'demo-seed' });
    semanticUpsert(userId, 'preferences', 'theme', 'light', { confidence: 0.6, isExplicit: false, source: 'demo-seed' });
  }
  if (episodicList(userId, { limit: 1 }).length === 0) {
    episodicRecord(userId, {
      title: 'First Nexus greeting',
      summary: 'Nexus companion welcomed user and described 3-tier memory system.',
      happenedAt: now - 86400_000,
      participants: [userId, 'nexus'],
      tags: ['onboarding', 'intro'],
      source: 'demo-seed',
    });
  }
  workingSet(userId, 'last_seed', 'demo', { ttlSeconds: 60 });
}
