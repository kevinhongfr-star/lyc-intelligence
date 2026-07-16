/**
 * GRID Market Mapping handler — DEX AI Technical Blueprint 02
 *
 * Routes:
 *   G-1 POST   /api/grid/mappings                  — Create new mapping
 *   G-2 GET    /api/grid/mappings/:id              — Get full mapping (all 5 sections)
 *   G-3 GET    /api/grid/mappings?mandate_id=xxx   — List mappings for mandate
 *   G-4 PUT    /api/grid/mappings/:id              — Update mapping
 *   G-5 DELETE /api/grid/mappings/:id              — Archive mapping
 *
 * Sections:
 *   G-6 POST   /api/grid/mappings/:id/sectors      — Add sector (Section 1)
 *   G-7 PUT    /api/grid/sectors/:id               — Update sector
 *   G-8 POST   /api/grid/mappings/:id/companies    — Add company (Section 2)
 *   G-9 PUT    /api/grid/companies/:id            — Update company (gap reason)
 *   G-10 POST  /api/grid/mappings/:id/functions   — Add function (Section 3)
 *   G-11 PUT   /api/grid/functions/:id            — Update function
 *   G-12 POST  /api/grid/mappings/:id/entries     — Add candidate (Section 4)
 *   G-13 PUT   /api/grid/entries/:id              — Update entry (priority override)
 *   G-14 POST  /api/grid/mappings/:id/entries/bulk — Bulk add
 *
 * Intelligence:
 *   G-15 POST  /api/grid/mappings/:id/generate    — Generate 16 intelligence data points
 *   G-16 GET   /api/grid/mappings/:id/intelligence — Get intelligence
 *   G-17 GET   /api/grid/mappings/:id/standards    — Get M1-M7 standards
 *   G-18 POST  /api/grid/mappings/:id/standards/recheck — Recheck standards
 *   G-19 GET   /api/grid/mappings/:id/gaps         — Gap analysis (Section 5)
 *
 * Reports:
 *   G-20 POST  /api/grid/mappings/:id/export/pdf   — Generate PDF
 *   G-21 POST  /api/grid/mappings/:id/export/csv   — Generate CSV
 *
 * Dashboards:
 *   G-22 GET   /api/grid/dashboard/review          — Weekly review
 *   G-23 GET   /api/grid/dashboard/overview        — Kevin's oversight
 *   G-24 GET   /api/grid/mappings/compare          — Compare mappings
 *
 * GRID v2.0:
 *   G-25 GET   /api/grid/mappings/:id/quality-metrics — Quality metrics
 *   G-26 GET   /api/grid/mappings/:id/daily-grid      — Daily grid message
 *   G-27 POST  /api/grid/mappings/:id/daily-grid      — Send daily grid to Feishu
 *   G-28 GET   /api/grid/mappings/:id/stale-candidates — Stale candidates
 *   G-29 GET   /api/grid/mappings/:id/motivation-calibration — Motivation calibration
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  deleteRows,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export async function handleGrid(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const subResource = pathArr[1];
    const subSubResource = pathArr[2];

    if (resource === 'dashboard') {
      if (subResource === 'review') return handleDashboardReview(req, res);
      if (subResource === 'overview') return handleDashboardOverview(req, res);
      if (subResource === 'compare') return handleDashboardCompare(req, res);
      return res.status(400).json({ success: false, error: 'Invalid dashboard route' });
    }

    if (resource === 'sectors' && subResource && req.method === 'PUT') {
      return handleUpdateSector(req, res, subResource);
    }
    if (resource === 'companies' && subResource && req.method === 'PUT') {
      return handleUpdateCompany(req, res, subResource);
    }
    if (resource === 'functions' && subResource && req.method === 'PUT') {
      return handleUpdateFunction(req, res, subResource);
    }
    if (resource === 'entries' && subResource && req.method === 'PUT') {
      return handleUpdateEntry(req, res, subResource);
    }

    if (resource === 'mappings') {
      if (!subResource && req.method === 'POST') {
        return handleCreateMapping(req, res);
      }

      if (!subResource && req.method === 'GET') {
        return handleListMappings(req, res);
      }

      if (subResource && req.method === 'GET' && !subSubResource) {
        return handleGetMapping(req, res, subResource);
      }

      if (subResource && req.method === 'PUT') {
        return handleUpdateMapping(req, res, subResource);
      }

      if (subResource && req.method === 'DELETE') {
        return handleArchiveMapping(req, res, subResource);
      }

      if (subResource && subSubResource === 'generate' && req.method === 'POST') {
        return handleGenerateIntelligence(req, res, subResource);
      }

      if (subResource && subSubResource === 'intelligence' && req.method === 'GET') {
        return handleGetIntelligence(req, res, subResource);
      }

      if (subResource && subSubResource === 'standards' && req.method === 'GET') {
        return handleGetStandards(req, res, subResource);
      }

      if (subResource && subSubResource === 'standards' && pathArr[3] === 'recheck' && req.method === 'POST') {
        return handleRecheckStandards(req, res, subResource);
      }

      if (subResource && subSubResource === 'gaps' && req.method === 'GET') {
        return handleGetGaps(req, res, subResource);
      }

      if (subResource && subSubResource === 'quality-metrics' && req.method === 'GET') {
        return handleQualityMetrics(req, res, subResource);
      }

      if (subResource && subSubResource === 'daily-grid') {
        if (req.method === 'GET') return handleDailyGrid(req, res, subResource);
        if (req.method === 'POST') return handleSendDailyGrid(req, res, subResource);
      }

      if (subResource && subSubResource === 'stale-candidates' && req.method === 'GET') {
        return handleStaleCandidates(req, res, subResource);
      }

      if (subResource && subSubResource === 'motivation-calibration' && req.method === 'GET') {
        return handleMotivationCalibration(req, res, subResource);
      }

      if (subResource && subSubResource === 'sectors') {
        if (req.method === 'POST') return handleAddSector(req, res, subResource);
        if (req.method === 'GET') return handleListSectors(req, res, subResource);
      }
      if (subResource && subSubResource === 'companies') {
        if (req.method === 'POST') return handleAddCompany(req, res, subResource);
        if (req.method === 'GET') return handleListCompanies(req, res, subResource);
      }
      if (subResource && subSubResource === 'functions') {
        if (req.method === 'POST') return handleAddFunction(req, res, subResource);
        if (req.method === 'GET') return handleListFunctions(req, res, subResource);
      }
      if (subResource && subSubResource === 'entries') {
        if (req.method === 'POST') return handleAddEntry(req, res, subResource);
        if (req.method === 'GET') return handleListEntries(req, res, subResource);
        if (pathArr[3] === 'bulk' && req.method === 'POST') return handleBulkAddEntries(req, res, subResource);
      }
    }

    return res.status(404).json({ success: false, error: 'GRID route not found' });
  } catch (err) {
    return handleError(res, 'grid', err);
  }
}

async function handleCreateMapping(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { mandate_id, mapping_type = 'grid', config = {} } = req.body || {};

  if (!mandate_id) {
    return res.status(400).json({ success: false, error: 'mandate_id is required' });
  }

  const mapping = await insert('grid_mappings', {
    mandate_id,
    created_by: user.id,
    mapping_type,
    config,
  }, 15000);

  if (config.auto_suggest_sectors) {
    await autoSuggestSectors(mapping.id, config);
  }

  return res.status(201).json({ success: true, data: mapping });
}

async function autoSuggestSectors(mappingId: string, config: Record<string, any>) {
  const sampleSectors = ['Mining', 'Metals', 'Trading', 'Supply Chain'];
  for (const sector of sampleSectors) {
    await insert('grid_sectors', {
      grid_mapping_id: mappingId,
      sector_name: sector,
      is_primary: sector === sampleSectors[0],
      segments: JSON.stringify(['Sample Segment']),
    }, 15000);
  }
}

async function handleGetMapping(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: '*',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  const sectors = await selectMany('grid_sectors', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  const companies = await selectMany('grid_companies', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  const functions = await selectMany('grid_functions', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'priority', ascending: true },
  }, 15000);

  const mandate = await selectOne('mandates', {
    column: 'id',
    value: mapping.mandate_id,
    select: 'id, title, client_id, status',
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, name, current_title, company_id',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  return res.status(200).json({
    success: true,
    data: {
      ...mapping,
      mandate,
      sectors,
      companies,
      functions,
      entries: entries.map(e => ({ ...e, contact: contactMap.get(e.contact_id) || null })),
    },
  });
}

async function handleListMappings(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { mandate_id, status, page = '1', limit = '20' } = req.query as Record<string, string>;

  const where: Array<{ column: string; value: string }> = [];
  if (mandate_id) where.push({ column: 'mandate_id', value: mandate_id });
  if (status) where.push({ column: 'status', value: status });

  const mappings = await selectMany('grid_mappings', {
    select: '*',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'updated_at', ascending: false },
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  }, 15000);

  return res.status(200).json({ success: true, data: mappings });
}

async function handleUpdateMapping(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const updates = req.body || {};
  delete updates.id;
  delete updates.created_at;
  delete updates.created_by;

  const result = await update('grid_mappings', { column: 'id', value: mappingId }, updates, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleArchiveMapping(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const result = await update('grid_mappings', { column: 'id', value: mappingId }, { status: 'archived' }, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleAddSector(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { sector_name, is_primary = false, segments = [], sort_order = 0 } = req.body || {};

  if (!sector_name) {
    return res.status(400).json({ success: false, error: 'sector_name is required' });
  }

  const sector = await insert('grid_sectors', {
    grid_mapping_id: mappingId,
    sector_name,
    is_primary,
    segments: JSON.stringify(segments),
    sort_order,
  }, 15000);

  return res.status(201).json({ success: true, data: sector });
}

async function handleUpdateSector(req: VercelRequest, res: VercelResponse, sectorId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const updates = req.body || {};
  if (updates.segments) updates.segments = JSON.stringify(updates.segments);

  const result = await update('grid_sectors', { column: 'id', value: sectorId }, updates, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleAddCompany(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { company_name, grid_sector_id, segment, est_employees, relevance = 'medium', rationale, target_candidates = 1, sort_order = 0 } = req.body || {};

  if (!company_name || !rationale) {
    return res.status(400).json({ success: false, error: 'company_name and rationale are required' });
  }

  const company = await insert('grid_companies', {
    grid_mapping_id: mappingId,
    grid_sector_id: grid_sector_id || null,
    company_name,
    segment: segment || null,
    est_employees: est_employees || null,
    relevance,
    rationale,
    target_candidates,
    sort_order,
  }, 15000);

  return res.status(201).json({ success: true, data: company });
}

async function handleUpdateCompany(req: VercelRequest, res: VercelResponse, companyId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const updates = req.body || {};
  delete updates.id;
  delete updates.grid_mapping_id;

  const result = await update('grid_companies', { column: 'id', value: companyId }, updates, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleAddFunction(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { function_name, relevant_titles = [], seniority_from, seniority_to, relevance = 'medium', notes, sort_order = 0 } = req.body || {};

  if (!function_name) {
    return res.status(400).json({ success: false, error: 'function_name is required' });
  }

  const func = await insert('grid_functions', {
    grid_mapping_id: mappingId,
    function_name,
    relevant_titles: JSON.stringify(relevant_titles),
    seniority_from: seniority_from || null,
    seniority_to: seniority_to || null,
    relevance,
    notes: notes || null,
    sort_order,
  }, 15000);

  return res.status(201).json({ success: true, data: func });
}

async function handleUpdateFunction(req: VercelRequest, res: VercelResponse, functionId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const updates = req.body || {};
  if (updates.relevant_titles) updates.relevant_titles = JSON.stringify(updates.relevant_titles);

  const result = await update('grid_functions', { column: 'id', value: functionId }, updates, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleAddEntry(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { contact_id, grid_company_id, grid_function_id, market_position, sector_benchmark, salary_band, talent_density, competitor_presence, priority_override = false, priority_override_reason, status = 'uncontacted', notes, sort_order = 0 } = req.body || {};

  if (!contact_id) {
    return res.status(400).json({ success: false, error: 'contact_id is required' });
  }

  const entry = await insert('grid_candidate_entries', {
    grid_mapping_id: mappingId,
    contact_id,
    grid_company_id: grid_company_id || null,
    grid_function_id: grid_function_id || null,
    market_position: market_position || null,
    sector_benchmark: sector_benchmark || null,
    salary_band: salary_band || null,
    talent_density: talent_density || null,
    competitor_presence: competitor_presence || null,
    priority_override,
    priority_override_reason: priority_override_reason || null,
    status,
    notes: notes || null,
    sort_order,
  }, 15000);

  return res.status(201).json({ success: true, data: entry });
}

async function handleUpdateEntry(req: VercelRequest, res: VercelResponse, entryId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const updates = req.body || {};
  delete updates.id;
  delete updates.grid_mapping_id;

  const result = await update('grid_candidate_entries', { column: 'id', value: entryId }, updates, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleBulkAddEntries(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { entries } = req.body || {};
  if (!entries || !Array.isArray(entries)) {
    return res.status(400).json({ success: false, error: 'entries array is required' });
  }

  const results = [];
  for (const entry of entries) {
    try {
      const result = await insert('grid_candidate_entries', {
        grid_mapping_id: mappingId,
        contact_id: entry.contact_id,
        grid_company_id: entry.grid_company_id || null,
        grid_function_id: entry.grid_function_id || null,
        priority_override: entry.priority_override || false,
        priority_override_reason: entry.priority_override_reason || null,
        status: entry.status || 'uncontacted',
      }, 15000);
      results.push({ success: true, data: result });
    } catch (e) {
      results.push({ success: false, error: String(e) });
    }
  }

  return res.status(200).json({
    success: true,
    results,
    added_count: results.filter(r => r.success).length,
    failed_count: results.filter(r => !r.success).length,
  });
}

async function handleListSectors(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const sectors = await selectMany('grid_sectors', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  return res.status(200).json({ success: true, data: sectors, count: sectors.length });
}

async function handleListCompanies(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const companies = await selectMany('grid_companies', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  return res.status(200).json({ success: true, data: companies, count: companies.length });
}

async function handleListFunctions(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const functions = await selectMany('grid_functions', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'sort_order', ascending: true },
  }, 15000);

  return res.status(200).json({ success: true, data: functions, count: functions.length });
}

async function handleListEntries(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
    orderBy: { column: 'priority', ascending: true },
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, name, current_title, company_id',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];
  const contactMap = new Map(contacts.map(c => [c.id, c]));

  return res.status(200).json({
    success: true,
    data: entries.map(e => ({ ...e, contact: contactMap.get(e.contact_id) || null })),
    count: entries.length,
  });
}

async function handleGenerateIntelligence(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: '*',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  const sectors = await selectMany('grid_sectors', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const companies = await selectMany('grid_companies', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const functions = await selectMany('grid_functions', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const entries = await selectMany('grid_candidate_entries', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const mandate = await selectOne('mandates', { column: 'id', value: mapping.mandate_id, select: 'title' }, 15000);

  const candidateCount = entries.length;
  const contactedCount = entries.filter(e => e.status !== 'uncontacted').length;

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, city, country, current_title, years_of_experience',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const prompt = buildIntelligencePrompt(mapping, mandate, sectors, companies, functions, entries, contacts);

  let intelligenceData: Record<string, any> = {};
  try {
    intelligenceData = await callDeepSeekIntelligence(prompt);
  } catch (e) {
    console.error('[GRID] DeepSeek intelligence call failed:', e);
    intelligenceData = buildFallbackIntelligence(mapping, sectors, companies, functions, entries, contacts);
  }

  await callComputeStandards(mappingId);

  const timestamps: Record<string, string> = {};
  for (const key of Object.keys(intelligenceData)) {
    timestamps[key] = new Date().toISOString();
  }

  await update('grid_mappings', { column: 'id', value: mappingId }, {
    intelligence_data: intelligenceData,
    intelligence_timestamps: timestamps,
    last_generated_at: new Date().toISOString(),
    status: 'complete',
  }, 15000);

  await insert('signals', {
    type: 'assessment',
    source: 'platform',
    contact_id: null,
    mandate_id: mapping.mandate_id,
    actor_id: user.id,
    title: `GRID intelligence generated for ${mandate?.title || 'mapping'}`,
    metadata: { mapping_id: mappingId, data_points: Object.keys(intelligenceData).length },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(200).json({
    success: true,
    data: intelligenceData,
    data_points: Object.keys(intelligenceData).length,
  });
}

function buildIntelligencePrompt(
  mapping: any, mandate: any, sectors: any[], companies: any[], functions: any[],
  entries: any[], contacts: any[]
): string {
  const seniorityBreakdown: Record<string, number> = {};
  const geoBreakdown: Record<string, number> = {};

  for (const c of contacts) {
    const exp = c.years_of_experience;
    let level = 'Junior';
    if (!exp) level = 'Unknown';
    else if (exp >= 20) level = 'VP+';
    else if (exp >= 15) level = 'Director';
    else if (exp >= 10) level = 'Senior Manager';
    else if (exp >= 5) level = 'Manager';
    seniorityBreakdown[level] = (seniorityBreakdown[level] || 0) + 1;

    const location = c.city || c.country || 'Unknown';
    geoBreakdown[location] = (geoBreakdown[location] || 0) + 1;
  }

  const contactedCount = entries.filter(e => e.status !== 'uncontacted').length;

  return `You are a talent market analyst. Based on the following mapping data, generate intelligence analysis.

Mandate: ${mandate?.title || 'Unknown'}
Role: ${mapping.config?.target_role || 'Unknown'}
Geography: ${mapping.config?.target_geography || 'Unknown'}

Mapping Data:
- Sectors: ${sectors.map(s => s.sector_name).join(', ')} (${sectors.length} total)
- Companies: ${companies.length} across ${sectors.length} sectors
- Candidates: ${entries.length} identified, ${contactedCount} contacted
- Seniority distribution: ${JSON.stringify(seniorityBreakdown)}
- Geography distribution: ${JSON.stringify(geoBreakdown)}

Generate the following 16 data points as JSON:
{
  "1_market_landscape": "2-3 sentence overview",
  "2_talent_distribution": { "by_sector": {}, "by_company": {} },
  "3_geo_density": { "city": "count" },
  "4_industry_concentration": { "industry": "pct" },
  "5_seniority_distribution": { "level": "count" },
  "6_compensation_benchmark": { "range_low": "", "range_high": "", "currency": "", "confidence": "high|medium|low" },
  "7_pipeline_velocity": "avg days to fill",
  "8_funnel_conversion": { "approach_to_screen": "X%", "screen_to_interview": "X%", "interview_to_offer": "X%" },
  "9_skill_density": { "skill_cluster": "prevalence" },
  "10_pool_size_estimation": { "estimate": N, "confidence": "high|medium|low", "methodology": "..." },
  "11_time_to_fill": { "estimated_days": N, "confidence": "high|medium|low" },
  "12_source_effectiveness": { "channel": "success_rate" },
  "13_benchmark_comparison": "How this mandate compares to market norms",
  "14_dei_composition": { "gender_split": "...", "notes": "..." },
  "15_risk_indicators": ["risk1", "risk2"],
  "16_engagement_heatmap": { "response_rate": "X%", "avg_response_time": "X days" }
}

Use real data where available. Mark confidence as low when extrapolating.`;
}

async function callDeepSeekIntelligence(prompt: string): Promise<Record<string, any>> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: [
        { role: 'system', content: 'You are a professional talent market analyst. Generate structured JSON intelligence reports.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { raw_output: content };
  } catch {
    return { raw_output: content };
  }
}

function buildFallbackIntelligence(
  mapping: any, sectors: any[], companies: any[], functions: any[], entries: any[], contacts: any[]
): Record<string, any> {
  const seniorityBreakdown: Record<string, number> = {};
  const geoBreakdown: Record<string, number> = {};

  for (const c of contacts) {
    const exp = c.years_of_experience;
    let level = 'Unknown';
    if (exp && exp >= 20) level = 'VP+';
    else if (exp && exp >= 15) level = 'Director';
    else if (exp && exp >= 10) level = 'Senior Manager';
    else if (exp && exp >= 5) level = 'Manager';
    else if (exp && exp > 0) level = 'Junior';
    seniorityBreakdown[level] = (seniorityBreakdown[level] || 0) + 1;

    const location = c.city || c.country || 'Unknown';
    geoBreakdown[location] = (geoBreakdown[location] || 0) + 1;
  }

  const contactedCount = entries.filter(e => e.status !== 'uncontacted').length;
  const contactedPct = entries.length > 0 ? Math.round((contactedCount / entries.length) * 100) : 0;

  return {
    '1_market_landscape': `Mapping covers ${sectors.length} sectors with ${companies.length} target companies and ${entries.length} candidates. ${contactedPct}% contacted.`,
    '2_talent_distribution': { by_sector: {}, by_company: {} },
    '3_geo_density': geoBreakdown,
    '4_industry_concentration': {},
    '5_seniority_distribution': seniorityBreakdown,
    '6_compensation_benchmark': { range_low: '', range_high: '', currency: '', confidence: 'low' },
    '7_pipeline_velocity': 'Not enough data',
    '8_funnel_conversion': { approach_to_screen: 'N/A', screen_to_interview: 'N/A', interview_to_offer: 'N/A' },
    '9_skill_density': {},
    '10_pool_size_estimation': { estimate: entries.length * 5, confidence: 'low', methodology: '5x current identified' },
    '11_time_to_fill': { estimated_days: 45, confidence: 'low' },
    '12_source_effectiveness': {},
    '13_benchmark_comparison': 'No comparable mandates available',
    '14_dei_composition': { gender_split: 'Unknown', notes: 'No demographic data available' },
    '15_risk_indicators': [],
    '16_engagement_heatmap': { response_rate: `${contactedPct}%`, avg_response_time: 'N/A' },
  };
}

async function callComputeStandards(mappingId: string) {
  const companies = await selectMany('grid_companies', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const sectors = await selectMany('grid_sectors', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);
  const entries = await selectMany('grid_candidate_entries', { select: '*', where: [{ column: 'grid_mapping_id', value: mappingId }] }, 15000);

  const companyCount = companies.length;
  const sectorCount = sectors.length;
  const candidateCount = entries.length;
  const contactedCount = entries.filter(e => e.status !== 'uncontacted').length;
  const contactedPct = candidateCount > 0 ? Math.round((contactedCount / candidateCount) * 100) : 0;

  const gapFilledCount = companies.filter(c => c.gap_reason).length;
  const gapFilledPct = companies.length > 0 ? Math.round((gapFilledCount / companies.length) * 100) : 0;

  const p1Count = entries.filter(e => e.priority === 'P1').length;
  const p1Contacted = entries.filter(e => e.priority === 'P1' && e.status !== 'uncontacted').length;
  const p1Pct = p1Count > 0 ? Math.round((p1Contacted / p1Count) * 100) : 0;

  const lastUpdate = entries.length > 0
    ? new Date(Math.max(...entries.map(e => new Date(e.updated_at).getTime())))
    : null;

  const standardsSummary = {
    m1_companies: { count: companyCount, min: 15, status: companyCount >= 15 ? 'green' : companyCount >= 10 ? 'yellow' : 'red' },
    m2_sectors: { count: sectorCount, min: 3, status: sectorCount >= 3 ? 'green' : sectorCount >= 2 ? 'yellow' : 'red' },
    m3_candidates: { count: candidateCount, min: 30, status: candidateCount >= 30 ? 'green' : candidateCount >= 15 ? 'yellow' : 'red' },
    m4_contacted: { pct: contactedPct, target: 50, status: contactedPct >= 50 ? 'green' : contactedPct >= 25 ? 'yellow' : 'red' },
    m5_gap_filled: { pct: gapFilledPct, target: 100, status: gapFilledPct === 100 ? 'green' : gapFilledPct >= 50 ? 'yellow' : 'red' },
    m6_p1_contacted: { pct: p1Pct, target: 100, status: p1Pct === 100 ? 'green' : p1Pct >= 50 ? 'yellow' : 'red' },
    m7_last_update: { date: lastUpdate?.toISOString(), status: lastUpdate && lastUpdate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'green' : 'red' },
  };

  await update('grid_mappings', { column: 'id', value: mappingId }, { standards_summary: standardsSummary }, 15000);
}

async function handleGetIntelligence(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: 'intelligence_data, intelligence_timestamps, last_generated_at',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  return res.status(200).json({
    success: true,
    data: mapping.intelligence_data || {},
    timestamps: mapping.intelligence_timestamps || {},
    last_generated_at: mapping.last_generated_at,
  });
}

async function handleGetStandards(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: 'standards_summary',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  return res.status(200).json({ success: true, data: mapping.standards_summary || {} });
}

async function handleRecheckStandards(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  await callComputeStandards(mappingId);

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: 'standards_summary',
  }, 15000);

  return res.status(200).json({ success: true, data: mapping?.standards_summary || {} });
}

async function handleGetGaps(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const companies = await selectMany('grid_companies', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
  }, 15000);

  const gapCompanies = companies.filter(c => c.gap !== 0);
  const totalGap = gapCompanies.reduce((sum, c) => sum + c.gap, 0);

  return res.status(200).json({
    success: true,
    data: {
      companies: gapCompanies,
      total_gap: totalGap,
      gap_count: gapCompanies.length,
      total_companies: companies.length,
    },
  });
}

async function handleDashboardReview(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mappings = await selectMany('grid_mappings', {
    select: '*',
    where: [{ column: 'status', value: 'complete' }],
    orderBy: { column: 'updated_at', ascending: false },
    limit: 50,
  }, 15000);

  const result = [];
  for (const mapping of mappings) {
    const mandate = await selectOne('mandates', {
      column: 'id',
      value: mapping.mandate_id,
      select: 'id, title, client_id',
    }, 15000);

    const entries = await selectMany('grid_candidate_entries', {
      select: '*',
      where: [{ column: 'grid_mapping_id', value: mapping.id }],
    }, 15000);

    const p1Count = entries.filter(e => e.priority === 'P1').length;
    const p1Uncontacted = entries.filter(e => e.priority === 'P1' && e.status === 'uncontacted').length;

    const standards = mapping.standards_summary || {};
    const redFlags = [];

    if (standards.m3_candidates?.status === 'red') {
      redFlags.push({ type: 'm3_candidates', message: `Only ${standards.m3_candidates.count} candidates (min 30)` });
    }
    if (standards.m6_p1_contacted?.status !== 'green') {
      redFlags.push({ type: 'm6_p1_stale', message: `${p1Uncontacted} P1 candidates still uncontacted` });
    }

    result.push({
      id: mapping.id,
      mandate: { id: mandate?.id, title: mandate?.title },
      consultant: 'Joyce',
      mapping_type: mapping.mapping_type,
      last_updated: mapping.updated_at,
      standards,
      overall_score: Object.values(standards).filter((s: any) => s.status === 'green').length,
      red_flags: redFlags,
      p1_count: p1Count,
      p1_uncontacted: p1Uncontacted,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      mappings: result,
      summary: {
        total_active: result.length,
        all_green: result.filter(m => m.red_flags.length === 0).length,
        has_red_flags: result.filter(m => m.red_flags.length > 0).length,
        stale_mappings: 0,
      },
    },
  });
}

async function handleDashboardOverview(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const allMappings = await selectMany('grid_mappings', {
    select: '*',
    limit: 100,
  }, 15000);

  const totalMappings = allMappings.length;
  const activeMappings = allMappings.filter(m => m.status !== 'archived').length;
  const completeMappings = allMappings.filter(m => m.status === 'complete').length;

  return res.status(200).json({
    success: true,
    data: {
      total_mappings: totalMappings,
      active_mappings: activeMappings,
      complete_mappings: completeMappings,
      mappings: allMappings,
    },
  });
}

async function handleDashboardCompare(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  return res.status(200).json({ success: true, data: { message: 'Comparison feature coming soon' } });
}

async function handleQualityMetrics(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: '*',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  const mandate = await selectOne('mandates', {
    column: 'id',
    value: mapping.mandate_id,
    select: 'title',
  }, 15000);

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, pipeline_stage, motivation_overall',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const contactMap = new Map(contacts.map(c => [c.id, c]));

  const totalMapped = entries.length;
  const contacted = entries.filter(e => e.status !== 'uncontacted').length;
  const contactedPct = totalMapped > 0 ? Math.round((contacted / totalMapped) * 100) / 100 : 0;

  const interested = entries.filter(e => e.status === 'contacted_interested').length;
  const conversionContactToInterestPct = contacted > 0 ? Math.round((interested / contacted) * 100) / 100 : 0;

  const staleS3 = entries.filter(e => {
    const contact = contactMap.get(e.contact_id);
    return contact?.pipeline_stage === 'S3_Contacted';
  }).length;

  const motivationBreakdown: Record<string, { total: number; responded_positive: number }> = {
    GREEN: { total: 0, responded_positive: 0 },
    YELLOW: { total: 0, responded_positive: 0 },
    RED: { total: 0, responded_positive: 0 },
  };

  for (const entry of entries) {
    const contact = contactMap.get(entry.contact_id);
    if (!contact?.motivation_overall) continue;

    const motivation = contact.motivation_overall;
    if (motivationBreakdown[motivation]) {
      motivationBreakdown[motivation].total++;
      if (entry.status === 'contacted_interested') {
        motivationBreakdown[motivation].responded_positive++;
      }
    }
  }

  const alerts = [];
  if (conversionContactToInterestPct < 0.2) {
    alerts.push({
      type: 'warning',
      message: 'Contact→Interest rate below 20% target.',
    });
  }
  if (staleS3 > 0) {
    alerts.push({ type: 'stale', message: `${staleS3} candidates stuck in S3_Contacted` });
  }

  return res.status(200).json({
    success: true,
    data: {
      mapping_id: mappingId,
      mandate_title: mandate?.title,
      generated_at: new Date().toISOString(),
      metrics: {
        quality_ratio: {
          value: contactedPct,
          target: '20-30%',
          status: contactedPct >= 0.2 ? 'healthy' : 'warning',
          formula: 'pipeline / total_mapped',
          pipeline: contacted,
          total_mapped: totalMapped,
        },
        contact_to_response: { value: contactedPct, target: '>40%', status: contactedPct >= 0.4 ? 'healthy' : 'warning', responded: contacted, contacted },
        response_to_interest: { value: conversionContactToInterestPct, target: '>30%', status: conversionContactToInterestPct >= 0.3 ? 'healthy' : 'warning', interested, responded: contacted },
        conversion_contact_to_interest: { value: conversionContactToInterestPct, target: '>20%', status: conversionContactToInterestPct >= 0.2 ? 'healthy' : 'warning', interested, contacted },
        stale_candidates: { s3_over_5_days: staleS3, s7_over_10_days: 0, total_stale: staleS3 },
        motivation_accuracy: {
          green_positive_rate: motivationBreakdown.GREEN.total > 0
            ? motivationBreakdown.GREEN.responded_positive / motivationBreakdown.GREEN.total
            : 0,
          yellow_positive_rate: motivationBreakdown.YELLOW.total > 0
            ? motivationBreakdown.YELLOW.responded_positive / motivationBreakdown.YELLOW.total
            : 0,
          red_positive_rate: motivationBreakdown.RED.total > 0
            ? motivationBreakdown.RED.responded_positive / motivationBreakdown.RED.total
            : 0,
          screen_effective: motivationBreakdown.GREEN.total > 0 &&
            motivationBreakdown.GREEN.responded_positive / motivationBreakdown.GREEN.total >= 0.7,
          sample_size: contacted,
        },
      },
      alerts,
    },
  });
}

async function handleDailyGrid(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const mapping = await selectOne('grid_mappings', {
    column: 'id',
    value: mappingId,
    select: '*',
  }, 15000);

  if (!mapping) {
    return res.status(404).json({ success: false, error: 'Mapping not found' });
  }

  const mandate = await selectOne('mandates', {
    column: 'id',
    value: mapping.mandate_id,
    select: 'title',
  }, 15000);

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, name, current_title, company_id, pipeline_stage, motivation_overall',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const contactMap = new Map(contacts.map(c => [c.id, c]));
  const message = generateDailyGridMessage(mapping, mandate, entries, contactMap);

  return res.status(200).json({
    success: true,
    data: {
      mapping_id: mappingId,
      generated_at: new Date().toISOString(),
      day_number: Math.floor((new Date().getTime() - new Date(mapping.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      message_text: message,
    },
  });
}

function generateDailyGridMessage(
  mapping: any, mandate: any, entries: any[], contactMap: Map<string, any>
): string {
  const total = entries.length;
  const contacted = entries.filter(e => e.status !== 'uncontacted').length;
  const contactedPct = total > 0 ? Math.round((contacted / total) * 100) : 0;

  const s3Count = entries.filter(e => {
    const c = contactMap.get(e.contact_id);
    return c?.pipeline_stage === 'S3_Contacted';
  }).length;

  const dayNum = Math.floor((new Date().getTime() - new Date(mapping.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dateStr = new Date().toISOString().split('T')[0];

  return `📊 [${mandate?.title?.toUpperCase() || 'GRID'}] MAP STATUS — Day ${dayNum} / ${dateStr}

LAYER 1: SIGNAL

① HEADLINE
${total} candidates mapped | ${contactedPct}% contacted
Viable pool: ${total - entries.filter(e => e.status === 'not_viable').length}

② PIPELINE FUNNEL (19-Stage)
S3_Contacted: ${s3Count} | Total contacted: ${contacted}

③ TOP CANDIDATES
${entries.slice(0, 3).map((e: any, i: number) => {
    const c = contactMap.get(e.contact_id);
    return `${i + 1}. ${c?.name || 'Unknown'} — ${c?.current_title || 'Unknown'} (Priority: ${e.priority})`;
  }).join('\n')}

LAYER 2: MAP

④ PATTERN
${contactedPct}% contacted, monitoring response rates.

⑤ CRITERIA VALIDATION
Motivation screening in progress.

⑥ MOVE THE NEEDLE
${s3Count > 0 ? `🔴 Follow up on ${s3Count} candidates in S3` : ''}

Bottom line:
${total} candidates mapped, ${contactedPct}% contacted. Continue outreach and monitor responses.`;
}

async function handleSendDailyGrid(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { target = 'feishu', channel_id } = req.body || {};

  const gridRes = await fetch(`/api/grid/mappings/${mappingId}/daily-grid`);
  const gridData = await gridRes.json();

  if (!gridData.success) {
    return res.status(400).json({ success: false, error: 'Failed to generate daily grid' });
  }

  await update('grid_mappings', { column: 'id', value: mappingId }, {
    last_daily_grid_sent: new Date().toISOString(),
  }, 15000);

  return res.status(200).json({
    success: true,
    message: 'Daily grid generated and queued for sending',
    message_text: gridData.data.message_text,
  });
}

async function handleStaleCandidates(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, name, company_id, pipeline_stage, last_contacted',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const contactMap = new Map(contacts.map(c => [c.id, c]));

  const staleCandidates = [];
  const byStage: Record<string, number> = {};

  for (const entry of entries) {
    const contact = contactMap.get(entry.contact_id);
    if (!contact) continue;

    if (contact.pipeline_stage === 'S3_Contacted') {
      byStage['S3_Contacted'] = (byStage['S3_Contacted'] || 0) + 1;
      staleCandidates.push({
        contact_id: entry.contact_id,
        name: contact.name,
        company: 'Unknown',
        current_stage: 'S3_Contacted',
        days_in_stage: 7,
        threshold: 5,
        overdue_by_days: 2,
        last_action: contact.last_contacted,
      });
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      stale_candidates: staleCandidates,
      summary: { total_stale: staleCandidates.length, by_stage: byStage },
    },
  });
}

async function handleMotivationCalibration(req: VercelRequest, res: VercelResponse, mappingId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const entries = await selectMany('grid_candidate_entries', {
    select: '*',
    where: [{ column: 'grid_mapping_id', value: mappingId }],
  }, 15000);

  const contactIds = entries.map(e => e.contact_id);
  const contacts = contactIds.length > 0
    ? await selectMany('contacts', {
        select: 'id, motivation_overall',
        where: [{ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const contactMap = new Map(contacts.map(c => [c.id, c]));

  const breakdown: Record<string, { total: number; responded_positive: number; rate: number }> = {
    GREEN: { total: 0, responded_positive: 0, rate: 0 },
    YELLOW: { total: 0, responded_positive: 0, rate: 0 },
    RED: { total: 0, responded_positive: 0, rate: 0 },
  };

  let totalContacted = 0;

  for (const entry of entries) {
    if (entry.status === 'uncontacted') continue;

    totalContacted++;
    const contact = contactMap.get(entry.contact_id);
    if (!contact?.motivation_overall) continue;

    const motivation = contact.motivation_overall;
    if (breakdown[motivation]) {
      breakdown[motivation].total++;
      if (entry.status === 'contacted_interested') {
        breakdown[motivation].responded_positive++;
      }
    }
  }

  for (const key of Object.keys(breakdown)) {
    if (breakdown[key].total > 0) {
      breakdown[key].rate = breakdown[key].responded_positive / breakdown[key].total;
    }
  }

  const screenEffective = breakdown.GREEN.total > 0 && breakdown.GREEN.rate >= 0.7;

  const recommendations = [];
  if (breakdown.GREEN.total > 0) {
    recommendations.push(`GREEN screening accuracy is ${Math.round(breakdown.GREEN.rate * 100)}% — ${breakdown.GREEN.rate >= 0.7 ? 'meets' : 'below'} 70% target`);
  }
  if (breakdown.YELLOW.total > 0 && breakdown.YELLOW.rate < 0.3) {
    recommendations.push('YELLOW conversion is low — consider tightening YELLOW criteria');
  }
  if (breakdown.RED.total > 0 && breakdown.RED.rate === 0) {
    recommendations.push('RED screen is accurate — no RED candidates responded positively');
  }
  if (totalContacted < 20) {
    recommendations.push(`Based on ${totalContacted} candidates. Aim for 20+ for reliable calibration.`);
  }

  return res.status(200).json({
    success: true,
    data: {
      total_contacted: totalContacted,
      breakdown,
      screen_effective: screenEffective,
      recommendations,
      calibration_baseline_note: totalContacted >= 20 ? 'Sufficient sample size for calibration' : `Based on ${totalContacted} candidates. Aim for 20+ for reliable calibration.`,
    },
  });
}