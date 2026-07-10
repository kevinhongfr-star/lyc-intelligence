import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import {
  selectMany,
  selectOne,
  insert,
  update,
  deleteRow,
  countRows,
  handleError as handleDbError,
  isSupabaseConfigured,
} from './supabaseRest.js';

type Operator = 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'contains' | 'starts_with' | 'is_null' | 'is_not_null';

interface Filter {
  field: string;
  op: Operator;
  value: any;
}

function buildFilterQuery(filters: Filter[], table: string): { query: string; params: any[] } {
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
      case 'is_null':
        conditions.push(`${field} IS NULL`);
        break;
      case 'is_not_null':
        conditions.push(`${field} IS NOT NULL`);
        break;
    }
  }

  const query = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { query, params };
}

function parseFilters(query: any): Filter[] {
  const filters: Filter[] = [];
  const filterKeys = Object.keys(query).filter((k) => k.startsWith('filter['));
  
  for (const key of filterKeys) {
    const match = key.match(/filter\[([^\]]+)\]\[([^\]]+)\]/);
    if (match) {
      const field = match[1];
      const op = match[2] as Operator;
      const value = query[key];
      filters.push({ field, op, value });
    }
  }
  
  return filters;
}

async function getPagination(query: any): Promise<{ page: number; pageSize: number }> {
  const page = parseInt(query.page || '1');
  const pageSize = Math.min(parseInt(query.page_size || '50'), 200);
  return { page: Math.max(1, page), pageSize };
}

// ── ORGANIZATIONS ──────────────────────────────────────────────────────
async function handleOrganizations(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const orgId = path[0];

  try {
    if (req.method === 'POST') {
      const result = await insert('organizations', req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      if (orgId) {
        const org = await selectOne('organizations', { id: orgId });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        const mandates = await selectMany('mandates', { org_id: orgId });
        return res.status(200).json({ ...org, mandates });
      }

      const filters = parseFilters(req.query);
      const { page, pageSize } = await getPagination(req.query);
      const { query: filterQuery, params } = buildFilterQuery(filters, 'organizations');
      const offset = (page - 1) * pageSize;

      const total = await countRows('organizations', filterQuery, params);
      const data = await selectMany('organizations', {}, pageSize, offset);

      return res.status(200).json({
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    }

    if (req.method === 'PUT' && orgId) {
      const result = await update('organizations', orgId, req.body);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE' && orgId) {
      const result = await update('organizations', orgId, { is_deleted: true, deleted_at: new Date().toISOString() });
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Organizations operation failed');
  }
}

// ── MANDATES ──────────────────────────────────────────────────────────
async function handleMandates(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const mandateId = path[0];
  const subAction = path[1];

  try {
    if (req.method === 'POST') {
      if (mandateId && subAction === 'status') {
        const { status } = req.body;
        if (!status) return res.status(400).json({ error: 'Status required' });
        const result = await update('mandates', mandateId, { status });
        return res.status(200).json(result);
      }

      if (mandateId && subAction === 'assign') {
        const { consultant_id } = req.body;
        if (!consultant_id) return res.status(400).json({ error: 'Consultant ID required' });
        const result = await update('mandates', mandateId, { consultant_id });
        return res.status(200).json(result);
      }

      const result = await insert('mandates', req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      if (mandateId && subAction === 'candidates') {
        const candidates = await selectMany('mandate_candidates', { mandate_id: mandateId });
        return res.status(200).json(candidates);
      }

      if (mandateId && subAction === 'fee-calculation') {
        const mandate = await selectOne('mandates', { id: mandateId });
        if (!mandate) return res.status(404).json({ error: 'Mandate not found' });

        const feeConfig = mandate.fee_config_id
          ? await selectOne('fee_configs', { id: mandate.fee_config_id })
          : null;

        let grossFee = 0;
        if (feeConfig) {
          if (feeConfig.fee_type === 'percentage') {
            const salaryMid = (mandate.salary_range_min + mandate.salary_range_max) / 2;
            grossFee = salaryMid * (feeConfig.percentage / 100);
            if (feeConfig.minimum_amount && grossFee < feeConfig.minimum_amount) {
              grossFee = feeConfig.minimum_amount;
            }
          } else if (feeConfig.fee_type === 'fixed') {
            grossFee = feeConfig.fixed_amount;
          } else if (feeConfig.fee_type === 'percentage_with_minimum') {
            const salaryMid = (mandate.salary_range_min + mandate.salary_range_max) / 2;
            grossFee = salaryMid * (feeConfig.percentage / 100);
            if (feeConfig.minimum_amount && grossFee < feeConfig.minimum_amount) {
              grossFee = feeConfig.minimum_amount;
            }
          }
        } else if (mandate.fee_percentage) {
          const salaryMid = (mandate.salary_range_min + mandate.salary_range_max) / 2;
          grossFee = salaryMid * (mandate.fee_percentage / 100);
        } else if (mandate.fee_fixed_amount) {
          grossFee = mandate.fee_fixed_amount;
        }

        const lycShare = feeConfig?.split_enabled ? grossFee * (feeConfig.lyc_share || 1) : grossFee;
        const partnerShare = feeConfig?.split_enabled ? grossFee * (feeConfig.partner_share || 0) : 0;

        return res.status(200).json({
          gross_fee: grossFee,
          lyc_net: lycShare,
          partner_share: partnerShare,
          payment_schedule: feeConfig?.payment_schedule || [],
          breakdown: {
            annual_salary: (mandate.salary_range_min + mandate.salary_range_max) / 2,
            fee_percentage: feeConfig?.percentage || mandate.fee_percentage,
            minimum_applied: feeConfig?.minimum_amount && grossFee === feeConfig.minimum_amount,
            split_applied: feeConfig?.split_enabled || false,
          },
        });
      }

      if (mandateId) {
        const mandate = await selectOne('mandates', { id: mandateId });
        if (!mandate) return res.status(404).json({ error: 'Mandate not found' });
        const pipeline = await selectMany('mandate_candidates', { mandate_id: mandateId });
        return res.status(200).json({ ...mandate, pipeline });
      }

      const filters = parseFilters(req.query);
      const { page, pageSize } = await getPagination(req.query);
      const offset = (page - 1) * pageSize;

      const total = await countRows('mandates', 'WHERE is_deleted = false');
      const data = await selectMany('mandates', { is_deleted: false }, pageSize, offset);

      return res.status(200).json({
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    }

    if (req.method === 'PUT' && mandateId) {
      const result = await update('mandates', mandateId, req.body);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE' && mandateId) {
      const result = await update('mandates', mandateId, { is_deleted: true, deleted_at: new Date().toISOString() });
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Mandates operation failed');
  }
}

// ── CANDIDATES ────────────────────────────────────────────────────────
async function handleCandidates(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const candidateId = path[0];
  const subAction = path[1];

  try {
    if (req.method === 'POST') {
      if (subAction === 'dedup-check') {
        const { email, phone, first_name, last_name } = req.body;
        const candidates = await selectMany('candidates', {}, 10);
        const duplicates = candidates.filter((c: any) => {
          if (email && c.email === email) return true;
          if (phone && c.phone === phone) return true;
          if (first_name && last_name && c.first_name === first_name && c.last_name === last_name) return true;
          return false;
        });
        return res.status(200).json({ has_duplicates: duplicates.length > 0, duplicates });
      }

      if (candidateId && subAction === 'cv') {
        const { cv_file_url } = req.body;
        if (!cv_file_url) return res.status(400).json({ error: 'CV file URL required' });
        const result = await update('candidates', candidateId, { cv_file_url });
        return res.status(200).json(result);
      }

      const result = await insert('candidates', req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      if (candidateId) {
        const candidate = await selectOne('candidates', { id: candidateId });
        if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
        return res.status(200).json(candidate);
      }

      const filters = parseFilters(req.query);
      const { page, pageSize } = await getPagination(req.query);
      const offset = (page - 1) * pageSize;

      const total = await countRows('candidates');
      const data = await selectMany('candidates', {}, pageSize, offset);

      return res.status(200).json({
        data,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    }

    if (req.method === 'PUT' && candidateId) {
      const result = await update('candidates', candidateId, req.body);
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Candidates operation failed');
  }
}

// ── MANDATE CANDIDATES (PIPELINE) ─────────────────────────────────────
async function handleMandateCandidates(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const mandateId = path[0];
  const candidateId = path[1];
  const subAction = path[2];

  try {
    if (req.method === 'POST') {
      if (mandateId && candidateId && subAction === 'feedback') {
        const { client_feedback } = req.body;
        const result = await update('mandate_candidates', { mandate_id: mandateId, candidate_id: candidateId }, { client_feedback });
        return res.status(200).json(result);
      }

      if (mandateId && candidateId && subAction === 'interview') {
        const { interview_date } = req.body;
        if (!interview_date) return res.status(400).json({ error: 'Interview date required' });
        const result = await update('mandate_candidates', { mandate_id: mandateId, candidate_id: candidateId }, { interview_date });
        return res.status(200).json(result);
      }

      if (mandateId && candidateId) {
        const result = await insert('mandate_candidates', { mandate_id: mandateId, candidate_id: candidateId, ...req.body });
        return res.status(201).json(result);
      }

      return res.status(400).json({ error: 'Missing mandate_id or candidate_id' });
    }

    if (req.method === 'PUT' && mandateId && candidateId) {
      const result = await update('mandate_candidates', { mandate_id: mandateId, candidate_id: candidateId }, req.body);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE' && mandateId && candidateId) {
      const result = await deleteRow('mandate_candidates', { mandate_id: mandateId, candidate_id: candidateId });
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Mandate candidates operation failed');
  }
}

// ── CONSULTANTS ───────────────────────────────────────────────────────
async function handleConsultants(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const consultantId = path[0];
  const subAction = path[1];

  try {
    if (req.method === 'GET') {
      if (consultantId && subAction === 'capacity') {
        const consultant = await selectOne('consultants', { id: consultantId });
        if (!consultant) return res.status(404).json({ error: 'Consultant not found' });
        const mandates = await selectMany('mandates', { consultant_id: consultantId, is_deleted: false });
        return res.status(200).json({
          ...consultant,
          active_mandates: mandates.length,
          capacity_ratio: consultant.current_load / consultant.max_capacity,
        });
      }

      if (consultantId && subAction === 'five-metrics') {
        const metrics = await selectMany('five_metrics', { consultant_id: consultantId });
        return res.status(200).json(metrics);
      }

      if (consultantId) {
        const consultant = await selectOne('consultants', { id: consultantId });
        if (!consultant) return res.status(404).json({ error: 'Consultant not found' });
        const mandates = await selectMany('mandates', { consultant_id: consultantId, is_deleted: false });
        return res.status(200).json({ ...consultant, mandates });
      }

      const data = await selectMany('consultants', {});
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Consultants operation failed');
  }
}

// ── FIVE METRICS ──────────────────────────────────────────────────────
async function handleFiveMetrics(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const result = await insert('five_metrics', req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      const { consultant_id, week_start } = req.query;
      const filters: Record<string, any> = {};
      if (consultant_id) filters.consultant_id = consultant_id;
      if (week_start) filters.week_start_date = week_start;

      const data = await selectMany('five_metrics', filters);
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Five metrics operation failed');
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────
async function handleDashboardV1(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const subAction = path[0];

  try {
    if (req.method === 'POST') {
      if (subAction === 'snapshot') {
        const mandates = await selectMany('mandates', { is_deleted: false });
        const byTier: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byConsultant: Record<string, number> = {};

        for (const m of mandates) {
          byTier[m.priority_tier] = (byTier[m.priority_tier] || 0) + 1;
          byStatus[m.status] = (byStatus[m.status] || 0) + 1;
          if (m.consultant_id) {
            byConsultant[m.consultant_id] = (byConsultant[m.consultant_id] || 0) + 1;
          }
        }

        const result = await insert('dashboard_snapshots', {
          snapshot_date: new Date().toISOString().split('T')[0],
          total_mandates: mandates.length,
          by_tier: byTier,
          by_status: byStatus,
          by_consultant: byConsultant,
          generated_by: 'manual',
        });

        return res.status(200).json(result);
      }
    }

    if (req.method === 'GET') {
      if (subAction === 'live') {
        const [mandates, candidates, consultants] = await Promise.all([
          selectMany('mandates', { is_deleted: false }),
          selectMany('candidates', {}),
          selectMany('consultants', {}),
        ]);

        return res.status(200).json({
          total_mandates: mandates.length,
          total_candidates: candidates.length,
          total_consultants: consultants.length,
          mandates_by_status: mandates.reduce((acc: Record<string, number>, m: any) => {
            acc[m.status] = (acc[m.status] || 0) + 1;
            return acc;
          }, {}),
        });
      }

      if (subAction) {
        const snapshot = await selectOne('dashboard_snapshots', { snapshot_date: subAction });
        if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
        return res.status(200).json(snapshot);
      }

      const snapshots = await selectMany('dashboard_snapshots', {}, 10);
      return res.status(200).json(snapshots);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Dashboard operation failed');
  }
}

// ── ACTIVITIES ────────────────────────────────────────────────────────
async function handleActivities(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST') {
      const result = await insert('activity_logs', req.body);
      return res.status(201).json(result);
    }

    if (req.method === 'GET') {
      const filters = parseFilters(req.query);
      const { page, pageSize } = await getPagination(req.query);
      const offset = (page - 1) * pageSize;

      const data = await selectMany('activity_logs', {}, pageSize, offset);
      return res.status(200).json({
        data,
        pagination: { page, pageSize },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Activities operation failed');
  }
}

// ── FLAGS ─────────────────────────────────────────────────────────────
async function handleFlags(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const flagId = path[0];
  const subAction = path[1];

  try {
    if (req.method === 'GET') {
      const data = await selectMany('auto_flags', { status: { neq: 'resolved' } });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      if (flagId && subAction === 'acknowledge') {
        const result = await update('auto_flags', flagId, {
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        });
        return res.status(200).json(result);
      }

      if (flagId && subAction === 'resolve') {
        const result = await update('auto_flags', flagId, {
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        });
        return res.status(200).json(result);
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    handleDbError(res, err, 'Flags operation failed');
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'organizations':
      return handleOrganizations(req, res);
    case 'mandates':
      return handleMandates(req, res);
    case 'candidates':
      return handleCandidates(req, res);
    case 'consultants':
      return handleConsultants(req, res);
    case 'five-metrics':
      return handleFiveMetrics(req, res);
    case 'dashboard':
      return handleDashboardV1(req, res);
    case 'activities':
      return handleActivities(req, res);
    case 'flags':
      return handleFlags(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v1/${resource}` });
  }
}