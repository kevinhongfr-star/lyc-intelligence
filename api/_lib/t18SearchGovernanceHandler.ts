import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Entity Deduplication ─── */
interface DuplicateCandidate {
  entity_type: string;
  entity_id: string;
  duplicates: any[];
  merge_strategy: string;
  confidence: number;
}

async function detectDuplicates(entityType: string, entityId: string) {
  const entity = await selectOne(entityType, { where: [{ column: 'id', value: entityId }] });
  if (!entity) return { error: 'Entity not found' };

  const allEntities = await selectMany(entityType, { where: [{ column: 'is_deleted', value: false }] }, 1000);
  const candidates: any[] = [];

  for (const other of allEntities) {
    if (other.id === entityId) continue;
    const score = calculateSimilarity(entity, other, entityType);
    if (score >= 0.75) {
      candidates.push({
        entity_id: other.id,
        entity: other,
        similarity_score: score,
        match_fields: getMatchFields(entity, other, entityType),
      });
    }
  }

  candidates.sort((a, b) => b.similarity_score - a.similarity_score);

  return {
    entity_id: entityId,
    entity_type: entityType,
    potential_duplicates: candidates.slice(0, 10),
    total_found: candidates.length,
  };
}

function calculateSimilarity(a: any, b: any, entityType: string): number {
  let score = 0;
  let maxScore = 0;

  if (entityType === 'candidates') {
    if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) return 1.0;
    if (a.first_name && b.first_name) { score += stringSimilarity(a.first_name, b.first_name) * 2; maxScore += 2; }
    if (a.last_name && b.last_name) { score += stringSimilarity(a.last_name, b.last_name) * 2; maxScore += 2; }
    if (a.current_company && b.current_company) { score += stringSimilarity(a.current_company, b.current_company); maxScore += 1; }
    if (a.current_title && b.current_title) { score += stringSimilarity(a.current_title, b.current_title); maxScore += 1; }
  } else if (entityType === 'organizations') {
    if (a.name && b.name) { score += stringSimilarity(a.name, b.name) * 3; maxScore += 3; }
    if (a.industry && b.industry && a.industry === b.industry) { score += 1; maxScore += 1; }
    if (a.headquarters && b.headquarters) { score += stringSimilarity(a.headquarters, b.headquarters); maxScore += 1; }
  } else if (entityType === 'mandates') {
    if (a.position_title && b.position_title) { score += stringSimilarity(a.position_title, b.position_title) * 2; maxScore += 2; }
    if (a.org_id && b.org_id && a.org_id === b.org_id) { score += 2; maxScore += 2; }
  }

  return maxScore > 0 ? score / maxScore : 0;
}

function stringSimilarity(a: string, b: string): number {
  const s1 = (a || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = (b || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.includes(shorter)) return shorter.length / longer.length;

  const editDist = levenshtein(s1, s2);
  return 1 - editDist / Math.max(s1.length, s2.length);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[m][n];
}

function getMatchFields(a: any, b: any, entityType: string): string[] {
  const fields: string[] = [];
  if (entityType === 'candidates') {
    if (a.email === b.email) fields.push('email');
    if (a.first_name === b.first_name && a.last_name === b.last_name) fields.push('name');
    if (a.current_company === b.current_company) fields.push('company');
  } else if (entityType === 'organizations') {
    if (a.name === b.name) fields.push('name');
    if (a.industry === b.industry) fields.push('industry');
  }
  return fields;
}

async function mergeEntities(keepId: string, mergeIds: string[], entityType: string) {
  const results: any[] = [];
  for (const mergeId of mergeIds) {
    await update(entityType, mergeId, { is_deleted: true, merged_into: keepId });
    results.push({ merged_id: mergeId, kept_id: keepId });
  }
  return { success: true, merged_count: results.length, results };
}

/* ─── Field Governance ─── */
const FIELD_GOVERNANCE = {
  candidates: {
    required: ['first_name', 'last_name', 'email'],
    validated: { email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, phone: /^[\d\s\-\+\(\)]{7,}$/ },
    pii: ['email', 'phone', 'current_salary'],
  },
  organizations: {
    required: ['name'],
    validated: {},
    pii: [],
  },
  mandates: {
    required: ['position_title', 'org_id'],
    validated: {},
    pii: [],
  },
};

async function validateEntity(entityType: string, entity: any) {
  const rules = FIELD_GOVERNANCE[entityType as keyof typeof FIELD_GOVERNANCE] || { required: [], validated: {}, pii: [] };
  const issues: any[] = [];

  for (const field of rules.required) {
    if (!entity[field] || String(entity[field]).trim() === '') {
      issues.push({ field, issue: 'required_field_empty', severity: 'error' });
    }
  }

  for (const [field, pattern] of Object.entries(rules.validated)) {
    if (entity[field] && !pattern.test(entity[field])) {
      issues.push({ field, issue: 'validation_failed', severity: 'warning' });
    }
  }

  for (const field of rules.pii) {
    if (entity[field]) {
      issues.push({ field, issue: 'pii_present', severity: 'info' });
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    score: Math.max(0, 100 - issues.reduce((s, i) => s + (i.severity === 'error' ? 20 : i.severity === 'warning' ? 10 : 0), 0)),
  };
}

/* ─── Bulk Validation ─── */
async function bulkValidate(entityType: string) {
  const entities = await selectMany(entityType, { where: [{ column: 'is_deleted', value: false }] }, 1000);
  const results: any[] = [];
  let validCount = 0;
  let issueCount = 0;

  for (const entity of entities) {
    const validation = await validateEntity(entityType, entity);
    results.push({ id: entity.id, valid: validation.valid, issues: validation.issues });
    if (validation.valid) validCount++;
    else issueCount++;
  }

  return {
    entity_type: entityType,
    total: entities.length,
    valid: validCount,
    with_issues: issueCount,
    results: results.slice(0, 100),
  };
}

/* ─── Search Query Builder ─── */
interface SearchQuery {
  entity_type: string;
  filters: any[];
  sort?: any;
  limit?: number;
}

function buildQuery(query: SearchQuery) {
  const { entity_type, filters, sort, limit } = query;

  const sql: string[] = [];
  const params: any[] = [];

  sql.push(`SELECT * FROM ${entity_type}`);
  sql.push('WHERE is_deleted = false');

  for (const filter of filters) {
    const { field, operator, value } = filter;
    sql.push(`AND ${field} ${operatorToSQL(operator)} ?`);
    params.push(transformValue(value, operator));
  }

  if (sort) {
    sql.push(`ORDER BY ${sort.field} ${sort.direction || 'ASC'}`);
  }

  sql.push(`LIMIT ${limit || 100}`);

  return { query: sql.join(' '), params };
}

function operatorToSQL(op: string): string {
  const map: Record<string, string> = {
    eq: '=',
    neq: '!=',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    contains: 'ILIKE',
    starts_with: 'ILIKE',
    in: 'IN',
  };
  return map[op] || '=';
}

function transformValue(value: any, operator: string): any {
  if (operator === 'contains') return `%${value}%`;
  if (operator === 'starts_with') return `${value}%`;
  return value;
}

/* ─── Saved Searches ─── */
async function handleSavedSearches(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const searches = await selectMany('saved_searches', { where: [{ column: 'user_id', value: user.id }] }, 50);
      return res.status(200).json({ success: true, searches });
    }

    if (req.method === 'POST') {
      const { name, entity_type, filters, sort } = req.body;
      const saved = await insert('saved_searches', {
        user_id: user.id,
        name,
        entity_type,
        filters,
        sort,
        created_at: new Date().toISOString(),
      });
      return res.status(201).json({ success: true, saved });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[SavedSearches] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── API Handlers ─── */
async function handleDedup(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST' && (req.query as any).path[1] === 'detect') {
      const { entity_type, entity_id } = req.body;
      const result = await detectDuplicates(entity_type, entity_id);
      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === 'POST' && (req.query as any).path[1] === 'merge') {
      const { keep_id, merge_ids, entity_type } = req.body;
      const result = await mergeEntities(keep_id, merge_ids, entity_type);
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Dedup] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleValidation(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const { entity_type, entity } = req.body;
      const result = await validateEntity(entity_type, entity);
      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === 'GET') {
      const entityType = (req.query as any).path[1];
      if (!entityType) return res.status(400).json({ error: 'entity_type required' });
      const result = await bulkValidate(entityType);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Validation] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/* ─── Main Router ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'dedup':
      return handleDedup(req, res);
    case 'validation':
      return handleValidation(req, res);
    case 'saved-searches':
      return handleSavedSearches(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v18/${resource}` });
  }
}