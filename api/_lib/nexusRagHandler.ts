/**
 * api/_lib/nexusRagHandler.ts — S7-T04 (N4)
 *
 * RAG Content Library Integration for the Nexus conversation engine.
 *
 * Spec (TRAEE_NEXT_SPRINTS.md — S7-T04):
 *   - Index content library into vector embeddings:
 *     career guides, industry reports, market intelligence,
 *     LYC assessment frameworks, public market data (APAC exec market)
 *   - Embedding model: text-embedding-3-small (or compatible)
 *   - Retrieval: top-k relevant chunks injected into system prompt
 *   - Content management: admin can add/update/remove documents
 *   - Acceptance: Nexus responses reference indexed content, citations shown
 *
 * Design:
 *   - Primary retrieval: keyword overlap + TF-IDF-style scoring (works without
 *     pgvector or an embedding API).
 *   - Enhanced retrieval: cosine similarity over stored embeddings when an
 *     embedding API is configured (OPENAI_API_KEY or compatible).
 *   - Chunking: documents are split into ~500-token chunks with 50-token overlap.
 *   - Citations: retrieved chunks include document title + source for attribution.
 *
 * Routes (via nexusHandler → /api/nexus/rag):
 *   GET    /api/nexus/rag                     → list documents (admin)
 *   POST   /api/nexus/rag                     → create document + chunk + embed (admin)
 *   GET    /api/nexus/rag/:id                 → get document detail (admin)
 *   PUT    /api/nexus/rag/:id                 → update document (admin)
 *   DELETE /api/nexus/rag/:id                 → delete document (admin)
 *   POST   /api/nexus/rag/search              → search chunks (internal + admin)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, insert, update, delete as dbDelete, isSupabaseConfigured } from './supabaseRest.js';

// ── Configuration ──
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS || 1536);

// Chunking parameters.
const CHUNK_SIZE_CHARS = 2000;   // ~500 tokens
const CHUNK_OVERLAP_CHARS = 200;  // ~50 tokens overlap

// ── Types ──

export interface ContentDocument {
  id: string;
  title: string;
  source: string | null;
  category: string;
  description: string | null;
  content: string;
  chunk_count: number;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding: number[] | null;
  token_count: number;
  keywords: string[];
}

export interface RetrievedChunk {
  id: string;
  document_id: string;
  chunk_text: string;
  chunk_index: number;
  retrieval_score: number;
  // Joined document metadata for citations
  document_title: string;
  document_source: string | null;
  document_category: string;
}

export interface RagResult {
  chunks: RetrievedChunk[];
  formattedContext: string;
  citations: Array<{
    title: string;
    source: string | null;
    category: string;
    score: number;
  }>;
}

// ── Chunking ──

/**
 * Split a document into overlapping chunks of ~CHUNK_SIZE_CHARS.
 * Splits on paragraph boundaries when possible for cleaner context.
 */
export function chunkDocument(text: string): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= CHUNK_SIZE_CHARS) return [text];

  const chunks: string[] = [];
  // Split on paragraph boundaries first.
  const paragraphs = text.split(/\n\n+/);
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length <= CHUNK_SIZE_CHARS) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) chunks.push(current);
      // If a single paragraph exceeds the chunk size, hard-split it.
      if (para.length > CHUNK_SIZE_CHARS) {
        for (let i = 0; i < para.length; i += CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS) {
          chunks.push(para.slice(i, i + CHUNK_SIZE_CHARS));
        }
        current = '';
      } else {
        current = para;
      }
    }
  }
  if (current) chunks.push(current);

  // Add overlap: prepend the last ~CHUNK_OVERLAP_CHARS of each chunk to the next.
  const withOverlap: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0 && chunks[i - 1].length > CHUNK_OVERLAP_CHARS) {
      const overlap = chunks[i - 1].slice(-CHUNK_OVERLAP_CHARS);
      withOverlap.push(`${overlap}...${chunks[i]}`);
    } else {
      withOverlap.push(chunks[i]);
    }
  }

  return withOverlap;
}

/**
 * Extract keywords from a chunk for fast keyword-based retrieval.
 * Uses simple tokenization + frequency ranking (TF-based).
 */
export function extractKeywords(text: string, maxKeywords: number = 15): string[] {
  const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'i', 'you', 'we', 'they', 'is', 'are',
    'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'to',
    'of', 'in', 'on', 'at', 'for', 'with', 'about', 'my', 'your', 'our', 'this',
    'that', 'these', 'those', 'it', 'as', 'by', 'from', 'me', 'what', 'how', 'why',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must',
    'not', 'no', 'nor', 'so', 'than', 'too', 'very', 'just', 'also', 'only',
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3 && !STOP.has(t));

  const freq: Record<string, number> = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// ── Embedding generation ──

/**
 * Generate an embedding for a text chunk using OpenAI's text-embedding-3-small
 * (or compatible API). Returns null if no API key is configured.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY || !text) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_EMBEDDING_MODEL,
        input: text.slice(0, 8000),
        dimensions: EMBEDDING_DIMENSIONS,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[nexusRagHandler] embedding API failed:', res.status);
      return null;
    }
    const data = await res.json();
    const embedding = data?.data?.[0]?.embedding;
    return Array.isArray(embedding) ? embedding : null;
  } catch (e) {
    console.warn('[nexusRagHandler] generateEmbedding failed (non-blocking):', e);
    return null;
  }
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

// ── Document ingestion (chunk + embed + store) ──

/**
 * Ingest a document: chunk it, generate embeddings, extract keywords,
 * and persist everything to the database.
 *
 * @returns the number of chunks stored.
 */
export async function ingestDocument(params: {
  documentId: string;
  content: string;
}): Promise<number> {
  const { documentId, content } = params;
  if (!isSupabaseConfigured() || !documentId || !content) return 0;

  const chunks = chunkDocument(content);
  let stored = 0;

  // Delete existing chunks for this document (re-ingestion support).
  try {
    await dbDelete('nexus_content_chunks', { column: 'document_id', value: documentId });
  } catch (e) {
    // Table may be empty — ignore.
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const keywords = extractKeywords(chunkText);
    const tokenCount = Math.ceil(chunkText.length / 4);

    // Generate embedding (best-effort — null if no API key).
    const embedding = await generateEmbedding(chunkText);

    try {
      await insert('nexus_content_chunks', {
        document_id: documentId,
        chunk_index: i,
        chunk_text: chunkText,
        embedding: embedding,
        token_count: tokenCount,
        keywords: keywords,
      });
      stored++;
    } catch (e) {
      console.warn(`[nexusRagHandler] chunk ${i} insert failed:`, e);
    }
  }

  // Update the document's chunk_count.
  try {
    await update('nexus_content_library', { chunk_count: stored }, documentId);
  } catch (e) {
    // Non-critical.
  }

  return stored;
}

// ── Retrieval ──

/**
 * Retrieve the top-k most relevant content chunks for a user query.
 *
 * Primary method: keyword overlap scoring (works without embeddings).
 * Enhanced method: cosine similarity over stored embeddings (when available).
 *
 * @param query  - the user's message
 * @param limit  - max chunks to return (default 5)
 * @param userId - optional, for citation tracking
 */
export async function retrieveRelevantContent(
  query: string,
  limit: number = 5,
  userId?: string,
): Promise<RagResult> {
  if (!isSupabaseConfigured() || !query) {
    return { chunks: [], formattedContext: '', citations: [] };
  }

  try {
    // Fetch active chunks joined with their document metadata.
    // We fetch chunks from active documents only.
    const chunks = await selectMany(
      'nexus_content_chunks',
      {
        select: 'id,document_id,chunk_index,chunk_text,embedding,token_count,keywords',
        orderBy: { column: 'document_id', ascending: true },
        limit: 500,
      },
      8000,
    );

    if (!chunks || chunks.length === 0) {
      return { chunks: [], formattedContext: '', citations: [] };
    }

    // Fetch active documents for filtering + citation metadata.
    const docs = await selectMany(
      'nexus_content_library',
      {
        select: 'id,title,source,category,is_active',
        where: [{ column: 'is_active', value: true }],
        limit: 200,
      },
      5000,
    );

    const activeDocIds = new Set((docs || []).map((d: any) => d.id));
    const docMeta = new Map<string, { title: string; source: string | null; category: string }>();
    for (const d of docs || []) {
      docMeta.set(d.id, { title: d.title, source: d.source, category: d.category });
    }

    // Filter chunks to active documents only.
    const activeChunks = (chunks as any[]).filter((c) => activeDocIds.has(c.document_id));
    if (activeChunks.length === 0) {
      return { chunks: [], formattedContext: '', citations: [] };
    }

    // Generate query embedding (for vector similarity, if available).
    const queryEmbedding = await generateEmbedding(query);

    const queryTokens = tokenize(query);

    // Score each chunk.
    const scored: RetrievedChunk[] = activeChunks.map((chunk) => {
      const meta = docMeta.get(chunk.document_id) || { title: 'Unknown', source: null, category: 'other' };

      // Keyword overlap score.
      const chunkKeywords: string[] = Array.isArray(chunk.keywords) ? chunk.keywords : [];
      const chunkTokens = tokenize(chunk.chunk_text);
      const overlap = queryTokens.filter((t) => chunkKeywords.includes(t) || chunkTokens.includes(t));
      const keywordScore = queryTokens.length > 0 ? overlap.length / queryTokens.length : 0;

      // Vector similarity score (if embeddings available).
      let vectorScore = 0;
      if (queryEmbedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0) {
        vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding as number[]);
      }

      // Combined score: vector similarity weighted higher when available.
      const retrievalScore = queryEmbedding
        ? vectorScore * 0.65 + keywordScore * 0.35
        : keywordScore;

      return {
        id: chunk.id,
        document_id: chunk.document_id,
        chunk_text: chunk.chunk_text,
        chunk_index: chunk.chunk_index,
        retrieval_score: Math.round(retrievalScore * 10000) / 10000,
        document_title: meta.title,
        document_source: meta.source,
        document_category: meta.category,
      };
    });

    // Filter: only return chunks with some relevance.
    const minScore = queryEmbedding ? 0.15 : 0.1;
    const relevant = scored
      .filter((c) => c.retrieval_score >= minScore)
      .sort((a, b) => b.retrieval_score - a.retrieval_score)
      .slice(0, limit);

    if (relevant.length === 0) {
      return { chunks: [], formattedContext: '', citations: [] };
    }

    // Track citations (best-effort, non-blocking).
    if (userId) {
      trackCitations(userId, query, relevant).catch(() => {});
    }

    return {
      chunks: relevant,
      formattedContext: formatChunksForPrompt(relevant),
      citations: relevant.map((c) => ({
        title: c.document_title,
        source: c.document_source,
        category: c.document_category,
        score: c.retrieval_score,
      })),
    };
  } catch (e) {
    console.warn('[nexusRagHandler] retrieveRelevantContent failed (non-blocking):', e);
    return { chunks: [], formattedContext: '', citations: [] };
  }
}

/**
 * Persist citation records for analytics (which content is most useful).
 */
async function trackCitations(
  userId: string,
  query: string,
  chunks: RetrievedChunk[],
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  for (const chunk of chunks) {
    try {
      await insert('nexus_content_citations', {
        user_id: userId,
        chunk_id: chunk.id,
        document_id: chunk.document_id,
        query_text: query.slice(0, 500),
        retrieval_score: chunk.retrieval_score,
      });
    } catch (e) {
      // Non-critical.
    }
  }
}

/**
 * Format retrieved chunks into a system-prompt-friendly context block.
 * Includes citation markers so Nexus can attribute sources.
 */
export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';

  const sections = chunks.map((chunk, i) => {
    const source = chunk.document_source || chunk.document_title;
    return `[${i + 1}] Source: ${chunk.document_title} (${chunk.document_category})
Reference: ${source}
Relevance: ${(chunk.retrieval_score * 100).toFixed(0)}%

${chunk.chunk_text}`;
  });

  return `## Retrieved Knowledge Base Content
The following content was retrieved from the LYC content library based on relevance to the user's query. Use this to ground your response. Cite sources using [1], [2], etc. when referencing specific content.

${sections.join('\n\n---\n\n')}`;
}

// ── Tokenization helper ──
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

// ── HTTP handler: /api/nexus/rag ──
export async function handleNexusRag(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const action = pathArr[1] || ''; // pathArr[0] = 'rag'
  const method = req.method || 'GET';

  // Auth is enforced by the dispatcher. The verified user is attached.
  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  const isAdmin = authUser.role === 'super_admin' || authUser.role === 'lyc_admin';

  try {
    // GET /api/nexus/rag — list all documents (admin only)
    if (action === '' && method === 'GET') {
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required', success: false });
      const docs = await selectMany(
        'nexus_content_library',
        {
          select: 'id,title,source,category,description,chunk_count,is_active,created_at,updated_at',
          orderBy: { column: 'updated_at', ascending: false },
          limit: 200,
        },
        8000,
      );
      return res.status(200).json({ success: true, documents: docs || [] });
    }

    // POST /api/nexus/rag — create a new document + ingest chunks (admin only)
    if (action === '' && method === 'POST') {
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required', success: false });
      const { title, source, category, description, content, metadata } = req.body || {};
      if (!title || !content || !category) {
        return res.status(400).json({ error: 'Missing required fields: title, content, category', success: false });
      }

      const VALID_CATEGORIES = ['career_guide', 'industry_report', 'market_intel', 'assessment_framework', 'public_data', 'other'];
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, success: false });
      }

      const doc = await insert('nexus_content_library', {
        title: title.slice(0, 500),
        source: source ? String(source).slice(0, 1000) : null,
        category,
        description: description ? String(description).slice(0, 1000) : null,
        content,
        chunk_count: 0,
        metadata: metadata || {},
        is_active: true,
        created_by: authUser.id,
      });

      if (!doc || !doc.id) {
        return res.status(500).json({ error: 'Failed to create document', success: false });
      }

      // Ingest chunks + embeddings (may take a few seconds for large documents).
      const chunkCount = await ingestDocument({ documentId: doc.id, content });

      return res.status(201).json({
        success: true,
        document: {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          chunk_count: chunkCount,
        },
      });
    }

    // GET /api/nexus/rag/:id — get document detail (admin only)
    if (action && method === 'GET' && action !== 'search') {
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required', success: false });
      const doc = await selectOne('nexus_content_library', {
        column: 'id',
        value: action,
        select: '*',
      }, 5000);
      if (!doc) return res.status(404).json({ error: 'Document not found', success: false });
      return res.status(200).json({ success: true, document: doc });
    }

    // PUT /api/nexus/rag/:id — update document (admin only)
    if (action && method === 'PUT' && action !== 'search') {
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required', success: false });
      const { title, source, category, description, content, is_active, metadata } = req.body || {};

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = String(title).slice(0, 500);
      if (source !== undefined) updates.source = source ? String(source).slice(0, 1000) : null;
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description ? String(description).slice(0, 1000) : null;
      if (is_active !== undefined) updates.is_active = Boolean(is_active);
      if (metadata !== undefined) updates.metadata = metadata;

      await update('nexus_content_library', updates, action);

      // If content changed, re-ingest chunks.
      if (content) {
        const chunkCount = await ingestDocument({ documentId: action, content });
        return res.status(200).json({ success: true, chunk_count: chunkCount });
      }

      return res.status(200).json({ success: true });
    }

    // DELETE /api/nexus/rag/:id — delete document (admin only)
    if (action && method === 'DELETE' && action !== 'search') {
      if (!isAdmin) return res.status(403).json({ error: 'Admin access required', success: false });
      await dbDelete('nexus_content_library', { column: 'id', value: action });
      return res.status(200).json({ success: true });
    }

    // POST /api/nexus/rag/search — search chunks (available to all authenticated users)
    if (action === 'search' && method === 'POST') {
      const { query, limit } = req.body || {};
      if (!query) return res.status(400).json({ error: 'Missing query', success: false });
      const result = await retrieveRelevantContent(
        query,
        Math.min(Number(limit) || 5, 20),
        authUser.id,
      );
      return res.status(200).json({
        success: true,
        chunks: result.chunks,
        citations: result.citations,
      });
    }

    return res.status(404).json({ error: `Unknown RAG action: ${method} ${action || '(root)'}` });
  } catch (err: any) {
    console.error('[nexusRagHandler] error:', err);
    return res.status(500).json({
      error: 'RAG operation failed',
      details: err?.message,
      success: false,
    });
  }
}
