/**
 * library.ts — RAG Content Library retrieval engine skeleton (#42).
 *
 * Provides tier-aware content access over nexus_content_library +
 * nexus_content_chunks. Implements the retrieval half of the RAG
 * pipeline: tier filtering, keyword heuristic search, combined
 * retrieveTopK, and prompt-context formatting with source citations.
 *
 * NOTE: This is an in-memory skeleton. Production implementations
 * should hydrate from Supabase via the tables in
 *   supabase/migrations/20260812_nexus_rag.sql
 * and run pgvector cosine similarity for the semantic path.
 */

import { TierKey, TIER_META, tierMeets, normalizeTier } from '@/config/tierConfig';

// ─────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────

export type NexusContentSourceType =
  | 'article'
  | 'guide'
  | 'whitepaper'
  | 'playbook'
  | 'template'
  | 'faq'
  | 'case_study'
  | 'curated';

export interface ContentChunk {
  id: string;
  content_id: string;
  chunk_index: number;
  content: string;
  embedding?: number[];
}

export interface ContentSource {
  id: string;
  source_title: string;
  source_url?: string;
  source_type: NexusContentSourceType;
  audience_tier?: TierKey | string;
  summary?: string;
  chunks?: ContentChunk[];
}

// ─────────────────────────────────────────────────────────────────────
//  In-memory store (skeleton — prod: replace with Supabase queries)
// ─────────────────────────────────────────────────────────────────────

const SOURCES: ContentSource[] = [];
const CHUNKS: Map<string, ContentChunk[]> = new Map();

// ─────────────────────────────────────────────────────────────────────
//  Tier hierarchy helper
// ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if a source's audience_tier is visible to the given user tier.
 *
 * Hierarchy (low → high):
 *   executive_introduction < professional < executive < council < enterprise
 *
 * A user at tier T can see any content with audience_tier ≤ T.
 *   - executive_introduction sees ONLY executive_introduction content
 *   - professional sees EI + professional
 *   - executive sees EI + professional + executive
 *   - council sees EI + professional + executive + council
 *   - enterprise sees everything
 */
function sourceVisibleToTier(
  sourceAudienceTier: TierKey | string | undefined | null,
  userTierKey: TierKey | string
): boolean {
  if (!sourceAudienceTier) return true;
  const canonicalAudience = normalizeTier(sourceAudienceTier);
  if (!canonicalAudience) return true;
  return tierMeets(userTierKey, canonicalAudience);
}

// ─────────────────────────────────────────────────────────────────────
//  Class
// ─────────────────────────────────────────────────────────────────────

export class ContentLibrary {
  private sources: ContentSource[];
  private chunksBySource: Map<string, ContentChunk[]>;

  constructor(
    seedSources?: ContentSource[],
    seedChunks?: Map<string, ContentChunk[]>
  ) {
    this.sources = seedSources ?? SOURCES;
    this.chunksBySource = seedChunks ?? CHUNKS;
  }

  // ── 1. getAllForTier ──────────────────────────────────────────────

  /**
   * Returns all content sources whose audience_tier is ≤ the given
   * user tier (council sees EI/professional/executive/council content;
   * EI sees only EI content).
   */
  getAllForTier(tierKey: TierKey | string): ContentSource[] {
    const canonicalUserTier = normalizeTier(tierKey);
    if (!canonicalUserTier) return [];
    return this.sources.filter((s) =>
      sourceVisibleToTier(s.audience_tier, canonicalUserTier)
    );
  }

  // ── 2. searchByKeyword ────────────────────────────────────────────

  /**
   * Heuristic keyword search over content chunks (case-insensitive,
   * partial token overlap). Returns the top-K matching chunks
   * filtered by the user's tier, scored by keyword hit density.
   *
   * Production note: this is the keyword baseline path. The semantic
   * path uses pgvector cosine on nexus_content_chunks.embedding and
   * combines scores in retrieveTopK.
   */
  searchByKeyword(
    query: string,
    tierKey: TierKey | string,
    topK: number = 10
  ): ContentChunk[] {
    if (!query || !query.trim()) return [];
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length >= 2);
    if (tokens.length === 0) return [];

    const allowedSources = new Set(
      this.getAllForTier(tierKey).map((s) => s.id)
    );

    const scored: Array<{ chunk: ContentChunk; score: number }> = [];

    for (const [contentId, chunks] of this.chunksBySource.entries()) {
      if (!allowedSources.has(contentId)) continue;
      for (const chunk of chunks) {
        const lower = chunk.content.toLowerCase();
        let hits = 0;
        for (const tok of tokens) {
          if (lower.includes(tok)) hits++;
        }
        if (hits > 0) {
          const density = hits / tokens.length;
          scored.push({ chunk, score: density });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map((s) => s.chunk);
  }

  // ── 3. retrieveTopK ───────────────────────────────────────────────

  /**
   * Primary RAG retrieval entry point. Combines:
   *   (a) audience_tier filter
   *   (b) keyword heuristic search
   *
   * Returns the top-K matching chunks plus their parent source records
   * (deduplicated by source id, preserving order).
   *
   * Production note: this method should merge keyword scores with
   * pgvector cosine similarity scores (e.g. reciprocal rank fusion)
   * once embeddings are populated in nexus_content_chunks.
   */
  retrieveTopK(
    query: string,
    tierKey: TierKey | string,
    topK: number = 5
  ): { chunks: ContentChunk[]; sources: ContentSource[] } {
    const chunks = this.searchByKeyword(query, tierKey, topK);

    const sourceIdsInOrder: string[] = [];
    const seenSourceIds = new Set<string>();
    for (const c of chunks) {
      if (!seenSourceIds.has(c.content_id)) {
        seenSourceIds.add(c.content_id);
        sourceIdsInOrder.push(c.content_id);
      }
    }

    const sourceById = new Map(this.sources.map((s) => [s.id, s]));
    const sources: ContentSource[] = sourceIdsInOrder
      .map((id) => sourceById.get(id))
      .filter((s): s is ContentSource => Boolean(s));

    return { chunks, sources };
  }

  // ── 4. formatForPrompt ────────────────────────────────────────────

  /**
   * Render the retrieved chunks + sources into a single "[RAG CONTEXT]"
   * block suitable for injection into a system / user prompt.
   *
   * Format:
   *   [RAG CONTEXT]
   *   Chunk 1 · "Source Title" (type) — source_url
   *   Chunk text body …
   *
   *   Source 1: "Source Title" — type — link (if url present)
   *   Source 2: …
   *   [/RAG CONTEXT]
   */
  formatForPrompt(
    chunks: ContentChunk[],
    sources: ContentSource[]
  ): string {
    if (chunks.length === 0) return '';

    const sourceById = new Map(sources.map((s) => [s.id, s]));

    const chunkLines: string[] = [];
    chunks.forEach((chunk, i) => {
      const src = sourceById.get(chunk.content_id);
      const head = src
        ? `Chunk ${i + 1} · "${src.source_title}" (${src.source_type})${src.source_url ? ` — ${src.source_url}` : ''}`
        : `Chunk ${i + 1} · content_id=${chunk.content_id}`;
      chunkLines.push(`${head}\n${chunk.content}`);
    });

    const srcLines: string[] = sources.map((s, i) => {
      const link = s.source_url ? ` — ${s.source_url}` : '';
      return `Source ${i + 1}: "${s.source_title}" — ${s.source_type}${link}`;
    });

    return [
      '[RAG CONTEXT]',
      chunkLines.join('\n\n'),
      '',
      ...srcLines,
      '[/RAG CONTEXT]',
    ].join('\n');
  }

  // ── In-memory helpers (for tests / seeding) ───────────────────────

  addSource(source: ContentSource): void {
    this.sources.push(source);
  }

  addChunks(contentId: string, chunks: ContentChunk[]): void {
    const existing = this.chunksBySource.get(contentId) ?? [];
    this.chunksBySource.set(contentId, [...existing, ...chunks]);
  }
}
