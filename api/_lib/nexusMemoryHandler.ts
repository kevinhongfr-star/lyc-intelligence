/**
 * api/_lib/nexusMemoryHandler.ts — S7-T02 (N2)
 *
 * Three-tier memory system per spec DEX_AI_NEXUS_PHASE1_TICKETS.md (N2):
 *   1. Working memory: last 20 messages in the conversation context window
 *   2. Episodic memory: per-conversation summaries stored in nexus_memory
 *   3. Semantic memory: durable user insights (goals, strengths, preferences)
 *
 * Retrieval: RAG-style keyword + recency + importance-decay ranking.
 * Decay: older memories have their effective importance reduced over time.
 *
 * Routes (via nexusHandler):
 *   GET  /api/nexus/memory?userId=X&query=...&limit=10  → retrieve relevant memories
 *   POST /api/nexus/memory/extract                       → extract & store memories from a conversation
 *   POST /api/nexus/memory/summarize                     → generate episodic summary for a conversation
 *   POST /api/nexus/memory/decay                         → apply decay to a user's memories (admin/cron)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// ── Working memory: spec mandates last 20 messages ──
export const WORKING_MEMORY_WINDOW = 20;

// ── Decay constants ──
// Effective importance = base_importance * decay_factor(age_days)
// where decay_factor = max(0.1, 1 - age_days * DECAY_RATE)
// So a memory is at 10% of its base importance after 90 days.
const DECAY_RATE = 0.01; // 1% per day
const MIN_DECAY_FACTOR = 0.1;

export interface NexusMemoryRow {
  id: string;
  user_id: string;
  conversation_id: string | null;
  memory_type:
  | 'goal' | 'pain_point' | 'strength' | 'experience' | 'preference' | 'insight'
  | 'episodic_summary' | 'semantic_profile' | 'milestone';
  content: string;
  source: string;
  importance: number;
  confidence: number;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string;
}

export interface RetrievedMemory extends NexusMemoryRow {
  effective_importance: number; // after decay
  retrieval_score: number;      // combined relevance + importance + recency
  age_days: number;
}

/**
 * Compute the decay factor for a memory based on its age in days.
 */
export function decayFactor(ageDays: number): number {
  return Math.max(MIN_DECAY_FACTOR, 1 - ageDays * DECAY_RATE);
}

function ageInDays(isoTimestamp: string): number {
  const ts = new Date(isoTimestamp).getTime();
  if (Number.isNaN(ts)) return 0;
  return Math.max(0, (Date.now() - ts) / (24 * 60 * 60 * 1000));
}

/**
 * Retrieve the top-N most relevant memories for a user + query.
 * RAG-style: combines keyword overlap, importance decay, and recency.
 *
 * This is the keyword + scoring fallback for retrieval. True vector search
 * is added in S7-T04 (RAG Content Library) when pgvector is enabled.
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit: number = 8,
): Promise<RetrievedMemory[]> {
  if (!isSupabaseConfigured() || !userId) return [];

  try {
    // Fetch all active memories for the user (capped — typical users have < 200).
    const rows = await selectMany(
      'nexus_memory',
      {
        select: 'id,user_id,conversation_id,memory_type,content,source,importance,confidence,is_active,created_at,last_accessed_at',
        where: [
          { column: 'user_id', value: userId },
          { column: 'is_active', value: true, op: 'eq' },
        ],
        orderBy: { column: 'created_at', ascending: false },
        limit: 200,
      },
      8000,
    );

    if (!rows || rows.length === 0) return [];

    const queryTokens = tokenize(query);
    const scored: RetrievedMemory[] = (rows as NexusMemoryRow[]).map((row) => {
      const ageDays = ageInDays(row.created_at);
      const decay = decayFactor(ageDays);
      const effectiveImportance = Number(row.importance) * decay;

      // Keyword overlap score (0..1).
      const contentTokens = tokenize(row.content);
      const overlap = queryTokens.filter((t) => contentTokens.includes(t));
      const keywordScore = queryTokens.length > 0 ? overlap.length / queryTokens.length : 0.3;

      // Recency boost: memories from the last 7 days get up to +0.2.
      const recencyBoost = ageDays < 7 ? (1 - ageDays / 7) * 0.2 : 0;

      // Combined retrieval score.
      const retrievalScore =
        keywordScore * 0.5 + effectiveImportance * 0.4 + recencyBoost;

      return {
        ...row,
        effective_importance: effectiveImportance,
        retrieval_score: retrievalScore,
        age_days: ageDays,
      };
    });

    // Sort by retrieval score, take top N.
    return scored
      .sort((a, b) => b.retrieval_score - a.retrieval_score)
      .slice(0, limit);
  } catch (e) {
    console.warn('[nexusMemoryHandler] retrieveRelevantMemories failed (non-blocking):', e);
    return [];
  }
}

/**
 * Refresh `last_accessed_at` for retrieved memories so they stay "warm".
 */
export async function touchMemories(memoryIds: string[]): Promise<void> {
  if (!isSupabaseConfigured() || memoryIds.length === 0) return;
  const now = new Date().toISOString();
  // Supabase REST has no native batch update; fire individual updates in parallel.
  await Promise.all(
    memoryIds.map((id) =>
      update('nexus_memory', { last_accessed_at: now }, id).catch(() => {}),
    ),
  );
}

/**
 * Extract memories from a conversation using DeepSeek and persist them.
 * Best-effort: failures are logged but do not block the chat response.
 *
 * @returns the number of memories successfully stored.
 */
export async function extractAndStoreMemories(params: {
  userId: string;
  conversationId?: string;
  messages: Array<{ role: string; content: string }>;
}): Promise<number> {
  const { userId, conversationId, messages } = params;
  if (!isSupabaseConfigured() || !userId || messages.length === 0) return 0;
  if (!DEEPSEEK_API_KEY) {
    console.warn('[nexusMemoryHandler] DEEPSEEK_API_KEY missing — skipping extraction');
    return 0;
  }

  try {
    const conversationText = messages
      .slice(-20) // limit input window
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const extracted = await callDeepSeekExtract(conversationText);
    if (!extracted || extracted.length === 0) return 0;

    let stored = 0;
    for (const mem of extracted) {
      try {
        await insert('nexus_memory', {
          user_id: userId,
          conversation_id: conversationId || null,
          memory_type: mem.memory_type,
          content: mem.content,
          source: 'conversation_extraction',
          importance: mem.importance,
          confidence: mem.confidence,
          is_active: true,
        });
        stored++;
      } catch (e) {
        // Skip duplicates / failed inserts.
        console.warn('[nexusMemoryHandler] memory insert failed:', e);
      }
    }
    return stored;
  } catch (e) {
    console.warn('[nexusMemoryHandler] extractAndStoreMemories failed (non-blocking):', e);
    return 0;
  }
}

interface ExtractedMemory {
  memory_type: NexusMemoryRow['memory_type'];
  content: string;
  importance: number; // 0..1
  confidence: number; // 0..1
}

async function callDeepSeekExtract(conversationText: string): Promise<ExtractedMemory[] | null> {
  const prompt = `Analyze this Nexus conversation and extract durable executive career intelligence.
Return a JSON object: {"memories": [{"memory_type": "...", "content": "...", "importance": 0..1, "confidence": 0..1}]}

memory_type must be one of:
- goal (career objective)
- pain_point (challenge / friction)
- strength (demonstrated capability)
- experience (past role / project)
- preference (style / approach preference)
- insight (key learning / mental model)
- semantic_profile (stable user attribute, e.g. "Senior CFO, APAC-focused")

Rules:
- Extract only durable, reusable insights (NOT transient chat details).
- importance: 0.9+ for explicit goals/strengths, 0.5-0.8 for inferred insights.
- confidence: how clearly the user stated it (1.0 explicit, 0.6 inferred).
- Skip if nothing durable. Return empty array.
- Max 5 memories per extraction.
- Write content in third person, e.g. "User wants to transition to APAC CFO role".

Conversation:
${conversationText.slice(0, 8000)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[nexusMemoryHandler] DeepSeek extract failed:', res.status);
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '{"memories":[]}';
    const parsed = JSON.parse(content);
    const memories = Array.isArray(parsed.memories) ? parsed.memories : [];
    const ALLOWED: ExtractedMemory['memory_type'][] = [
      'goal', 'pain_point', 'strength', 'experience', 'preference', 'insight', 'semantic_profile',
    ];
    return memories
      .filter((m: any) =>
        m.memory_type && ALLOWED.includes(m.memory_type) && m.content && typeof m.content === 'string',
      )
      .slice(0, 5)
      .map((m: any) => ({
        memory_type: m.memory_type,
        content: String(m.content).slice(0, 500),
        importance: clamp(Number(m.importance) || 0.5, 0, 1),
        confidence: clamp(Number(m.confidence) || 0.7, 0, 1),
      }));
  } catch (e) {
    console.warn('[nexusMemoryHandler] DeepSeek extract error:', e);
    return null;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Generate an episodic summary for a conversation and store it as an
 * episodic_summary memory. Useful for cross-session recall.
 */
export async function summarizeConversation(
  userId: string,
  conversationId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured() || !DEEPSEEK_API_KEY) return null;

  try {
    const conv = await selectOne('nexus_conversations', {
      column: 'id',
      value: conversationId,
      select: 'id,user_id,messages',
    });
    if (!conv || conv.user_id !== userId) return null;
    const messages: Array<{ role: string; content: string }> = Array.isArray(conv.messages)
      ? conv.messages
      : [];
    if (messages.length < 4) return null; // not enough to summarize

    const convoText = messages
      .slice(-30)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const prompt = `Summarize this Nexus conversation in 2-3 sentences. Focus on:
- What the user was working on / exploring
- Key decisions or insights reached
- Open action items

Conversation:
${convoText.slice(0, 6000)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const summary: string = (data.choices?.[0]?.message?.content || '').trim();
    if (!summary) return null;

    // Persist the summary as an episodic_summary memory.
    await insert('nexus_memory', {
      user_id: userId,
      conversation_id: conversationId,
      memory_type: 'episodic_summary',
      content: summary,
      source: 'conversation_summary',
      importance: 0.7,
      confidence: 0.9,
      is_active: true,
    });

    // Also write the summary back to the conversation row.
    await update('nexus_conversations', {
      session_summary: summary,
      updated_at: new Date().toISOString(),
    }, conversationId);

    return summary;
  } catch (e) {
    console.warn('[nexusMemoryHandler] summarizeConversation failed (non-blocking):', e);
    return null;
  }
}

/**
 * Apply time-based decay to a user's memories by writing the decayed importance
 * back to the row. Idempotent — safe to call from a daily cron.
 *
 * Note: we re-derive effective_importance on every retrieval, so this is mostly
 * a housekeeping step that archives very-stale memories.
 */
export async function applyDecay(userId: string, archiveThreshold = 0.05): Promise<number> {
  if (!isSupabaseConfigured() || !userId) return 0;
  try {
    const rows = await selectMany(
      'nexus_memory',
      {
        select: 'id,importance,created_at,is_active',
        where: [
          { column: 'user_id', value: userId },
          { column: 'is_active', value: true },
        ],
        limit: 500,
      },
      10000,
    );
    if (!rows || rows.length === 0) return 0;

    let archived = 0;
    for (const row of rows) {
      const ageDays = ageInDays(row.created_at);
      const decayed = Number(row.importance) * decayFactor(ageDays);
      if (decayed < archiveThreshold) {
        await update('nexus_memory', {
          is_active: false,
          importance: decayed,
        }, row.id).catch(() => {});
        archived++;
      }
    }
    return archived;
  } catch (e) {
    console.warn('[nexusMemoryHandler] applyDecay failed (non-blocking):', e);
    return 0;
  }
}

/**
 * Format retrieved memories into a system-prompt-friendly string.
 * Groups by memory_type and sorts by retrieval_score.
 */
export function formatMemoriesForPrompt(memories: RetrievedMemory[]): string {
  if (memories.length === 0) {
    return 'No prior user memory available.';
  }

  const byType: Record<string, RetrievedMemory[]> = {};
  for (const m of memories) {
    if (!byType[m.memory_type]) byType[m.memory_type] = [];
    byType[m.memory_type].push(m);
  }

  const sections: string[] = [];
  const typeLabels: Record<string, string> = {
    goal: 'Career Goals',
    pain_point: 'Challenges',
    strength: 'Strengths',
    experience: 'Experiences',
    preference: 'Preferences',
    insight: 'Key Insights',
    semantic_profile: 'User Profile',
    episodic_summary: 'Past Conversations',
    milestone: 'Milestones',
  };

  for (const [type, items] of Object.entries(byType)) {
    const label = typeLabels[type] || type;
    const bullets = items
      .slice(0, 3)
      .map((m) => `- ${m.content}${m.age_days < 7 ? ' (recent)' : ''}`)
      .join('\n');
    sections.push(`**${label}:**\n${bullets}`);
  }

  return `Retrieved user memory (ranked by relevance + decayed importance):\n${sections.join('\n\n')}`;
}

// ── Tokenization helper (keyword retrieval) ──
function tokenize(text: string): string[] {
  if (!text) return [];
  const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'i', 'you', 'we', 'they', 'is', 'are',
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'to',
    'of', 'in', 'on', 'at', 'for', 'with', 'about', 'my', 'your', 'our', 'this',
    'that', 'these', 'those', 'it', 'as', 'by', 'from', 'me', 'what', 'how', 'why',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

// ── HTTP handler: /api/nexus/memory[/extract|/summarize|/decay] ──
export async function handleNexusMemory(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const action = pathArr[1] || ''; // pathArr[0] = 'memory'
  const method = req.method || 'GET';

  // Auth is enforced by the dispatcher (`case 'nexus'`). The verified user is
  // attached to req.__authenticatedUser.
  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  try {
    // GET /api/nexus/memory?query=...&limit=8 — retrieve relevant memories for the authenticated user.
    if (action === '' && method === 'GET') {
      const query = (req.query.query as string) || '';
      const limit = Math.min(Number(req.query.limit) || 8, 30);
      const memories = await retrieveRelevantMemories(authUser.id, query, limit);
      // Touch retrieved memories to keep them warm.
      touchMemories(memories.map((m) => m.id)).catch(() => {});
      return res.status(200).json({
        success: true,
        memories: memories.map((m) => ({
          id: m.id,
          memory_type: m.memory_type,
          content: m.content,
          importance: Number(m.importance),
          effective_importance: m.effective_importance,
          retrieval_score: m.retrieval_score,
          age_days: m.age_days,
          created_at: m.created_at,
        })),
        formatted: formatMemoriesForPrompt(memories),
      });
    }

    // POST /api/nexus/memory/extract — extract memories from a conversation.
    if (action === 'extract' && method === 'POST') {
      const { conversationId, messages } = req.body || {};
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages array required', success: false });
      }
      const stored = await extractAndStoreMemories({
        userId: authUser.id,
        conversationId,
        messages,
      });
      return res.status(200).json({ success: true, memories_extracted: stored });
    }

    // POST /api/nexus/memory/summarize — generate episodic summary.
    if (action === 'summarize' && method === 'POST') {
      const { conversationId } = req.body || {};
      if (!conversationId) {
        return res.status(400).json({ error: 'conversationId required', success: false });
      }
      const summary = await summarizeConversation(authUser.id, conversationId);
      return res.status(200).json({ success: true, summary });
    }

    // POST /api/nexus/memory/decay — apply decay (admin/cron only).
    if (action === 'decay' && method === 'POST') {
      if (authUser.role !== 'super_admin' && authUser.role !== 'lyc_admin') {
        return res.status(403).json({ error: 'Admin access required', success: false });
      }
      const { userId: targetUserId } = req.body || {};
      const archived = await applyDecay(targetUserId || authUser.id);
      return res.status(200).json({ success: true, archived });
    }

    return res.status(404).json({ error: `Unknown memory action: ${method} ${action || '(root)'}` });
  } catch (err: any) {
    console.error('[nexusMemoryHandler] error:', err);
    return res.status(500).json({
      error: 'Memory operation failed',
      details: err?.message,
      success: false,
    });
  }
}
