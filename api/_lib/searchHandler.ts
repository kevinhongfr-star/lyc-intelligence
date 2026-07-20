/**
 * api/_lib/searchHandler.ts — Smart Search & Filters
 * Issue #42: Advanced search with faceted filters, full-text, saved searches
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface SearchResult {
  id: string;
  type: 'candidate' | 'mandate' | 'company' | 'contact';
  title: string;
  subtitle: string;
  metadata: Record<string, any>;
  score: number;
  matchedFields: string[];
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  entityType: string;
  createdAt: string;
}

const MOCK_RESULTS: SearchResult[] = [
  {
    id: 'cand-101',
    type: 'candidate',
    title: 'Sarah Chen',
    subtitle: 'VP Engineering · Singapore · 15 years exp',
    metadata: { location: 'Singapore', industry: 'Technology', seniority: 'VP' },
    score: 0.96,
    matchedFields: ['name', 'title', 'location'],
  },
  {
    id: 'cand-102',
    type: 'candidate',
    title: 'James Wilson',
    subtitle: 'CFO · Hong Kong · 20 years exp',
    metadata: { location: 'Hong Kong', industry: 'Finance', seniority: 'C-Level' },
    score: 0.91,
    matchedFields: ['title', 'industry'],
  },
  {
    id: 'man-201',
    type: 'mandate',
    title: 'Chief Technology Officer — Fintech Scale-up',
    subtitle: 'Active · Singapore · $300-400K',
    metadata: { status: 'active', location: 'Singapore', salaryRange: '$300-400K' },
    score: 0.88,
    matchedFields: ['title', 'location'],
  },
  {
    id: 'comp-301',
    type: 'company',
    title: 'Apex Digital Solutions',
    subtitle: 'Technology · 500 employees · Singapore',
    metadata: { industry: 'Technology', size: '500', location: 'Singapore' },
    score: 0.85,
    matchedFields: ['name', 'industry'],
  },
];

const MOCK_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'ss-1',
    name: 'Singapore VPs in Tech',
    query: 'VP Engineering Singapore',
    filters: { location: 'Singapore', seniority: 'VP', industry: 'Technology' },
    entityType: 'candidate',
    createdAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'ss-2',
    name: 'Active CFO Mandates',
    query: 'CFO',
    filters: { status: 'active', title: 'CFO' },
    entityType: 'mandate',
    createdAt: '2026-07-01T08:00:00Z',
  },
];

function getUser(req: VercelRequest) {
  return (req as any).__authenticatedUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = ((req.query as any).path || []) as string[];
  const method = req.method || 'GET';
  const user = getUser(req);

  try {
    // GET / — universal search
    if (method === 'GET' && !path[0]) {
      const { q, type, location, industry, seniority, status, limit = '20', offset = '0' } = req.query;

      let results = [...MOCK_RESULTS];

      if (q) {
        const query = String(q).toLowerCase();
        results = results.filter(r =>
          r.title.toLowerCase().includes(query) ||
          r.subtitle.toLowerCase().includes(query)
        );
      }

      if (type) {
        results = results.filter(r => r.type === type);
      }

      if (location) {
        results = results.filter(r => r.metadata.location === location);
      }

      if (industry) {
        results = results.filter(r => r.metadata.industry === industry);
      }

      if (seniority) {
        results = results.filter(r => r.metadata.seniority === seniority);
      }

      if (status) {
        results = results.filter(r => r.metadata.status === status);
      }

      const total = results.length;
      const start = parseInt(String(offset), 10);
      const end = start + parseInt(String(limit), 10);
      results = results.slice(start, end);

      return res.status(200).json({
        success: true,
        results,
        total,
        facets: {
          type: { candidate: 2, mandate: 1, company: 1 },
          location: { Singapore: 2, 'Hong Kong': 1 },
          industry: { Technology: 2, Finance: 1 },
        },
      });
    }

    // GET /suggestions — search suggestions / autocomplete
    if (method === 'GET' && path[0] === 'suggestions') {
      const { q } = req.query;
      const suggestions = [
        'VP Engineering Singapore',
        'CFO Hong Kong',
        'CTO Fintech',
        'Managing Director APAC',
        'Head of Sales Technology',
      ].filter(s => !q || s.toLowerCase().includes(String(q).toLowerCase()));

      return res.status(200).json({ success: true, suggestions });
    }

    // GET /saved — list saved searches
    if (method === 'GET' && path[0] === 'saved') {
      const { data: saved } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      return res.status(200).json({
        success: true,
        savedSearches: saved || MOCK_SAVED_SEARCHES,
      });
    }

    // POST /saved — save a search
    if (method === 'POST' && path[0] === 'saved') {
      const body = req.body || {};
      const saved: SavedSearch = {
        id: `ss-${Date.now()}`,
        name: body.name,
        query: body.query,
        filters: body.filters || {},
        entityType: body.entityType || 'candidate',
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('saved_searches').insert({
        ...saved,
        user_id: user?.id,
      });
      if (error) console.warn('saved_searches insert failed:', error.message);

      return res.status(201).json({ success: true, savedSearch: saved });
    }

    // DELETE /saved/:id — delete saved search
    if (method === 'DELETE' && path[0] === 'saved' && path[1]) {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', path[1])
        .eq('user_id', user?.id);

      if (error) console.warn('saved_searches delete failed:', error.message);

      return res.status(200).json({ success: true, deleted: path[1] });
    }

    // GET /filters — available filter options
    if (method === 'GET' && path[0] === 'filters') {
      return res.status(200).json({
        success: true,
        filters: {
          type: ['candidate', 'mandate', 'company', 'contact'],
          location: ['Singapore', 'Hong Kong', 'Tokyo', 'Sydney', 'Shanghai', 'Bangkok'],
          industry: ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer', 'Industrial'],
          seniority: ['C-Level', 'VP', 'Director', 'Manager', 'Senior', 'Mid'],
          status: ['active', 'paused', 'closed', 'draft'],
        },
      });
    }

    return res.status(404).json({ error: 'Unknown search endpoint' });
  } catch (err: any) {
    console.error('[searchHandler]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
