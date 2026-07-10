import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, isSupabaseConfigured } from './supabaseRest.js';

interface SearchFilter {
  field: string;
  op: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'contains' | 'starts_with' | 'ends_with' | 'is_null' | 'is_not_null';
  value: any;
}

interface SearchOptions {
  query: string;
  filters: SearchFilter[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

function buildFilterConditions(filters: SearchFilter[]): { conditions: string[]; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const filter of filters) {
    const { field, op, value } = filter;
    const param = `$${idx++}`;

    switch (op) {
      case 'eq':
        conditions.push(`${field} = ${param}`);
        params.push(value);
        break;
      case 'neq':
        conditions.push(`${field} != ${param}`);
        params.push(value);
        break;
      case 'in':
        conditions.push(`${field} IN (${value.map((_, i) => `$${idx++}`).join(', ')})`);
        params.push(...value);
        break;
      case 'not_in':
        conditions.push(`${field} NOT IN (${value.map((_, i) => `$${idx++}`).join(', ')})`);
        params.push(...value);
        break;
      case 'gt':
        conditions.push(`${field} > ${param}`);
        params.push(value);
        break;
      case 'gte':
        conditions.push(`${field} >= ${param}`);
        params.push(value);
        break;
      case 'lt':
        conditions.push(`${field} < ${param}`);
        params.push(value);
        break;
      case 'lte':
        conditions.push(`${field} <= ${param}`);
        params.push(value);
        break;
      case 'between':
        conditions.push(`${field} BETWEEN $${idx} AND $${idx + 1}`);
        params.push(value[0], value[1]);
        idx += 2;
        break;
      case 'contains':
        conditions.push(`${field} LIKE ${param}`);
        params.push(`%${value}%`);
        break;
      case 'starts_with':
        conditions.push(`${field} LIKE ${param}`);
        params.push(`${value}%`);
        break;
      case 'ends_with':
        conditions.push(`${field} LIKE ${param}`);
        params.push(`%${value}`);
        break;
      case 'is_null':
        conditions.push(`${field} IS NULL`);
        break;
      case 'is_not_null':
        conditions.push(`${field} IS NOT NULL`);
        break;
    }
  }

  return { conditions, params };
}

async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const entityType = path[0];

  try {
    const options: SearchOptions = {
      query: (req.query as any).q || '',
      filters: parseFilters(req.query),
      sortBy: (req.query as any).sort_by || 'created_at',
      sortOrder: ((req.query as any).sort_order || 'desc') as 'asc' | 'desc',
      page: Math.max(1, parseInt((req.query as any).page || '1')),
      pageSize: Math.min(200, parseInt((req.query as any).page_size || '50')),
    };

    const results = await performSearch(entityType, options);

    return res.status(200).json({
      success: true,
      query: options.query,
      total: results.total,
      page: options.page,
      page_size: options.pageSize,
      total_pages: Math.ceil(results.total / options.pageSize),
      results: results.data,
    });
  } catch (err: any) {
    console.error('[Search] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function parseFilters(query: any): SearchFilter[] {
  const filters: SearchFilter[] = [];
  const filterKeys = Object.keys(query).filter((k) => k.startsWith('filter['));

  for (const key of filterKeys) {
    const match = key.match(/filter\[([^\]]+)\]\[([^\]]+)\]/);
    if (match) {
      const field = match[1];
      const op = match[2] as SearchFilter['op'];
      const value = parseValue(query[key]);
      filters.push({ field, op, value });
    }
  }

  return filters;
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value.startsWith('[') && value.endsWith(']')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((v: string) => v.trim());
    }
  }
  if (!isNaN(parseFloat(value))) {
    return parseFloat(value);
  }
  return value;
}

async function performSearch(entityType: string, options: SearchOptions) {
  const { query, filters, sortBy, sortOrder, page, pageSize } = options;
  const offset = (page - 1) * pageSize;

  switch (entityType) {
    case 'mandates':
      return searchMandates(query, filters, sortBy, sortOrder, pageSize, offset);
    case 'candidates':
      return searchCandidates(query, filters, sortBy, sortOrder, pageSize, offset);
    case 'organizations':
      return searchOrganizations(query, filters, sortBy, sortOrder, pageSize, offset);
    case 'consultants':
      return searchConsultants(query, filters, sortBy, sortOrder, pageSize, offset);
    case 'all':
      return searchAll(query, filters, pageSize, offset);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

async function searchMandates(query: string, filters: SearchFilter[], sortBy: string, sortOrder: string, pageSize: number, offset: number) {
  const { conditions, params } = buildFilterConditions(filters);
  conditions.push('is_deleted = false');

  let searchCondition = '';
  if (query) {
    searchCondition = `(position_title ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
    params.push(`%${query}%`);
  }

  const whereClause = [...conditions, searchCondition].filter(Boolean).join(' AND ');

  const mandates = await selectMany('mandates', {}, pageSize, offset, sortBy, sortOrder, whereClause, params);
  const total = await countWithFilters('mandates', whereClause, params);

  return { data: mandates, total };
}

async function searchCandidates(query: string, filters: SearchFilter[], sortBy: string, sortOrder: string, pageSize: number, offset: number) {
  const { conditions, params } = buildFilterConditions(filters);

  let searchCondition = '';
  if (query) {
    searchCondition = `(first_name ILIKE $${params.length + 1} OR last_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1} OR current_title ILIKE $${params.length + 1})`;
    params.push(`%${query}%`);
  }

  const whereClause = [...conditions, searchCondition].filter(Boolean).join(' AND ');

  const candidates = await selectMany('candidates', {}, pageSize, offset, sortBy, sortOrder, whereClause, params);
  const total = await countWithFilters('candidates', whereClause, params);

  return { data: candidates, total };
}

async function searchOrganizations(query: string, filters: SearchFilter[], sortBy: string, sortOrder: string, pageSize: number, offset: number) {
  const { conditions, params } = buildFilterConditions(filters);
  conditions.push('is_deleted = false');

  let searchCondition = '';
  if (query) {
    searchCondition = `(name ILIKE $${params.length + 1} OR industry ILIKE $${params.length + 1} OR headquarters ILIKE $${params.length + 1})`;
    params.push(`%${query}%`);
  }

  const whereClause = [...conditions, searchCondition].filter(Boolean).join(' AND ');

  const orgs = await selectMany('organizations', {}, pageSize, offset, sortBy, sortOrder, whereClause, params);
  const total = await countWithFilters('organizations', whereClause, params);

  return { data: orgs, total };
}

async function searchConsultants(query: string, filters: SearchFilter[], sortBy: string, sortOrder: string, pageSize: number, offset: number) {
  const { conditions, params } = buildFilterConditions(filters);

  let searchCondition = '';
  if (query) {
    searchCondition = `(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
    params.push(`%${query}%`);
  }

  const whereClause = [...conditions, searchCondition].filter(Boolean).join(' AND ');

  const consultants = await selectMany('consultants', {}, pageSize, offset, sortBy, sortOrder, whereClause, params);
  const total = await countWithFilters('consultants', whereClause, params);

  return { data: consultants, total };
}

async function searchAll(query: string, filters: SearchFilter[], pageSize: number, offset: number) {
  const [mandates, candidates, orgs, consultants] = await Promise.all([
    selectMany('mandates', {}, Math.floor(pageSize / 4), 0, 'created_at', 'desc'),
    selectMany('candidates', {}, Math.floor(pageSize / 4), 0, 'created_at', 'desc'),
    selectMany('organizations', {}, Math.floor(pageSize / 4), 0, 'created_at', 'desc'),
    selectMany('consultants', {}, Math.floor(pageSize / 4), 0, 'created_at', 'desc'),
  ]);

  const allResults = [
    ...mandates.map((m: any) => ({ type: 'mandate', ...m })),
    ...candidates.map((c: any) => ({ type: 'candidate', ...c })),
    ...orgs.map((o: any) => ({ type: 'organization', ...o })),
    ...consultants.map((c: any) => ({ type: 'consultant', ...c })),
  ];

  if (query) {
    const q = query.toLowerCase();
    const filtered = allResults.filter((r: any) => {
      const text = `${r.name || ''} ${r.first_name || ''} ${r.last_name || ''} ${r.position_title || ''} ${r.email || ''}`.toLowerCase();
      return text.includes(q);
    });
    return { data: filtered.slice(0, pageSize), total: filtered.length };
  }

  return { data: allResults.slice(0, pageSize), total: allResults.length };
}

async function countWithFilters(table: string, whereClause: string, params: any[]): Promise<number> {
  try {
    const supabase = require('./supabaseRest.js').createClient();
    const query = supabase.from(table).select('id', { count: 'exact' });
    
    if (whereClause) {
      const result = await query.rpc('count_with_filters', {
        table_name: table,
        where_clause: whereClause,
        params: params,
      });
      return result.data?.count || 0;
    }
    
    const result = await query;
    return result.count || 0;
  } catch {
    return 0;
  }
}

async function handleAutocomplete(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const entityType = path[0];
  const query = (req.query as any).q || '';
  const limit = Math.min(20, parseInt((req.query as any).limit || '10'));

  try {
    let results: any[] = [];

    switch (entityType) {
      case 'mandates':
        results = await selectMany('mandates', { is_deleted: false }, limit);
        results = results.filter((m: any) => 
          m.position_title.toLowerCase().includes(query.toLowerCase())
        );
        break;
      case 'candidates':
        results = await selectMany('candidates', {}, limit);
        results = results.filter((c: any) => 
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(query.toLowerCase())
        );
        break;
      case 'organizations':
        results = await selectMany('organizations', { is_deleted: false }, limit);
        results = results.filter((o: any) => 
          o.name.toLowerCase().includes(query.toLowerCase())
        );
        break;
      case 'all':
        const [mandates, candidates, orgs] = await Promise.all([
          selectMany('mandates', { is_deleted: false }, 5),
          selectMany('candidates', {}, 5),
          selectMany('organizations', { is_deleted: false }, 5),
        ]);
        results = [
          ...mandates.map((m: any) => ({ type: 'mandate', label: m.position_title, id: m.id })),
          ...candidates.map((c: any) => ({ type: 'candidate', label: `${c.first_name} ${c.last_name}`, id: c.id })),
          ...orgs.map((o: any) => ({ type: 'organization', label: o.name, id: o.id })),
        ];
        if (query) {
          const q = query.toLowerCase();
          results = results.filter((r: any) => r.label.toLowerCase().includes(q));
        }
        break;
      default:
        return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
    }

    const formatted = results.map((r: any) => ({
      type: r.type || entityType,
      id: r.id,
      label: r.position_title || `${r.first_name} ${r.last_name}` || r.name || r.title,
      value: r.id,
    }));

    return res.status(200).json({
      success: true,
      results: formatted.slice(0, limit),
    });
  } catch (err: any) {
    console.error('[Autocomplete] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSuggestions(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const query = (req.query as any).q || '';

  try {
    const suggestions: string[] = [];

    if (query.length >= 2) {
      const [mandates, candidates, orgs] = await Promise.all([
        selectMany('mandates', { is_deleted: false }, 5),
        selectMany('candidates', {}, 5),
        selectMany('organizations', { is_deleted: false }, 5),
      ]);

      mandates.forEach((m: any) => {
        if (m.position_title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(`"${m.position_title}" (mandate)`);
        }
      });

      candidates.forEach((c: any) => {
        const name = `${c.first_name} ${c.last_name}`;
        if (name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(`${name} (candidate)`);
        }
      });

      orgs.forEach((o: any) => {
        if (o.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.push(`${o.name} (organization)`);
        }
      });
    }

    return res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 10),
    });
  } catch (err: any) {
    console.error('[Suggestions] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'search':
      return handleSearch(req, res);
    case 'autocomplete':
      return handleAutocomplete(req, res);
    case 'suggestions':
      return handleSuggestions(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v4/${resource}` });
  }
}