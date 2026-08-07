/**
 * webSearchHandler.ts — Web search integration with result ranking
 *
 * Endpoints:
 *   POST /api/web-search/search    — Execute web search
 *   GET  /api/web-search/history   — Get search history
 *   DELETE /api/web-search/history/:id — Delete history item
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  insert,
  remove,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

const MAX_QUERY_LENGTH = 500;
const MAX_RESULTS = 20;
const SEARCH_TIMEOUT_MS = 10000;

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_at?: string;
  rank_score?: number;
}

function rankResults(results: SearchQueryResult[], query: string): SearchQueryResult[] {
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(t => t.length > 2);

  return results
    .map(r => {
      let score = 0;
      const titleLower = r.title.toLowerCase();
      const snippetLower = r.snippet.toLowerCase();

      if (titleLower.includes(queryLower)) score += 10;
      if (snippetLower.includes(queryLower)) score += 5;

      for (const term of terms) {
        if (titleLower.includes(term)) score += 3;
        if (snippetLower.includes(term)) score += 1;
      }

      if (r.source === 'official') score += 3;
      if (r.published_at) {
        const age = Date.now() - new Date(r.published_at).getTime();
        const daysOld = age / (24 * 60 * 60 * 1000);
        if (daysOld < 7) score += 5;
        else if (daysOld < 30) score += 3;
        else if (daysOld < 90) score += 1;
      }

      return { ...r, rank_score: score };
    })
    .sort((a, b) => (b.rank_score || 0) - (a.rank_score || 0));
}

interface SearchQueryResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  published_at?: string;
  rank_score?: number;
}

async function performWebSearch(query: string): Promise<SearchQueryResult[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${MAX_RESULTS}`,
      {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          X_Subscription_Tier: 'free',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];
    const data = await response.json();
    return (data.web?.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.description || '',
      source: r.meta?.url?.host || '',
      published_at: r.age ? new Date(Date.now() - r.age * 86400000).toISOString() : undefined,
    }));
  } catch {
    return [];
  }
}

export async function handleWebSearch(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server not configured' });
    }

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0];

    if (req.method === 'POST' && action === 'search') {
      return handleSearch(req, res, user.id);
    }
    if (req.method === 'GET' && action === 'history') {
      return handleHistory(req, res, user.id);
    }
    if (req.method === 'DELETE' && action === 'history') {
      const id = pathArr[1];
      if (id) return handleDeleteHistory(req, res, id, user.id);
    }

    return res.status(404).json({ success: false, error: 'Search route not found' });
  } catch (err) {
    return handleError(res, 'webSearch', err);
  }
}

async function handleSearch(req: VercelRequest, res: VercelResponse, userId: string) {
  const body = req.body as any;
  const query = body?.query?.trim();

  if (!query) {
    return res.status(400).json({ success: false, error: 'Query required' });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return res.status(400).json({ success: false, error: `Query exceeds ${MAX_QUERY_LENGTH} chars` });
  }

  const rawResults = await performWebSearch(query);
  const ranked = rankResults(rawResults, query);

  const saved = await insert('search_history', {
    user_id: userId,
    query,
    results_count: ranked.length,
    created_at: new Date().toISOString(),
  });

  return res.json({
    success: true,
    results: ranked,
    total: ranked.length,
    saved_id: saved?.id,
  });
}

async function handleHistory(_req: VercelRequest, res: VercelResponse, userId: string) {
  const history = await selectMany(
    'search_history',
    { user_id: userId },
    ['created_at DESC'],
    50,
    0,
    'id,query,results_count,created_at'
  );
  return res.json({ success: true, history });
}

async function handleDeleteHistory(_req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  await remove('search_history', { column: 'id', value: id, extra: { user_id: userId } });
  return res.json({ success: true, id, deleted: true });
}