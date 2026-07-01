/**
 * Candidates handler — DEX AI Candidate Tracking (Technical Blueprint 01)
 *
 * Routes:
 *   GET    /api/candidates              — List candidates (paginated, filterable)
 *   GET    /api/candidates/:id          — Get candidate detail
 *   POST   /api/candidates              — Quick Add candidate
 *   PUT    /api/candidates/:id          — Update candidate
 *   PATCH  /api/candidates/:id/stage    — Change pipeline stage (with S2→S3 gate)
 *   PATCH  /api/candidates/bulk-stage   — Bulk stage change
 *   DELETE /api/candidates/:id          — Archive candidate
 *
 * Outreach:
 *   GET    /api/candidates/:id/outreach — Get outreach log
 *   POST   /api/candidates/:id/outreach — Add outreach entry
 *
 * Motivation (GRID v2.0):
 *   GET    /api/candidates/:id/motivation — Get motivation assessment
 *   POST   /api/candidates/:id/motivation — Submit motivation screening
 *
 * Reachability (GRID v2.0):
 *   GET    /api/candidates/:id/reachability — Get reachability validation
 *   POST   /api/candidates/:id/reachability — Submit reachability validation
 *
 * Gate Check (GRID v2.0):
 *   POST   /api/candidates/:id/gate-check — Run S2→S3 gate check
 *
 * Mandate Links:
 *   GET    /api/candidates/:id/mandates  — Get mandate associations
 *   POST   /api/candidates/:id/mandates  — Link to mandate
 *   PATCH  /api/candidates/:id/mandates/:mandate_id — Update link
 *   DELETE /api/candidates/:id/mandates/:mandate_id — Unlink
 *
 * Pipeline Analytics (GRID v2.0):
 *   GET    /api/candidates/pipeline/funnel           — Pipeline funnel counts
 *   GET    /api/candidates/pipeline/metrics          — Quality metrics
 *   GET    /api/candidates/pipeline/transitions/:id  — Transition history
 *   GET    /api/candidates/pipeline/decline-analysis — Decline analysis
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

// 19-stage pipeline order for validation
const PIPELINE_STAGES = [
  'S1_Sourced', 'S2_Screened', 'S3_Contacted', 'S4_No_Response',
  'S5_Responded', 'S6_WeChat_Added', 'S7_Interested', 'S8_Not_Interested',
  'S9_Call_Positive', 'S10_Call_Negative', 'S11_Internal_Interview',
  'S12_Presented_to_Client', 'S13_Client_Int_Scheduled', 'S14_Client_Interviewed',
  'S15_Client_2nd_Interview', 'S16_Offer_Extended', 'S17_Offer_Accepted',
  'S18_Offer_Declined', 'S19_Closed',
];

const VALID_MOTIVATION_FACTORS = ['career_trajectory', 'comp_realism', 'geographic_flexibility', 'mobility_signals', 'timing_signals'];
const VALID_MOTIVATION_VALUES = ['GREEN', 'YELLOW', 'RED', 'UNKNOWN'];
const VALID_DECLINE_REASONS = ['COMPENSATION', 'ROLE_TOO_JUNIOR', 'LOCATION', 'TIMING', 'OTHER_OFFER', 'NOT_INTERESTED', 'OTHER'];
const VALID_CONTACT_CHANNELS = ['LINKEDIN', 'EMAIL', 'WECHAT', 'NONE'];

/**
 * Main router
 */
export async function handleCandidates(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // "pipeline" or contact_id
    const subResource = pathArr[1]; // "outreach", "motivation", "reachability", "gate-check", "mandates"
    const subId = pathArr[2]; // mandate_id for mandate links

    // Pipeline analytics routes (C-28/29/30/31)
    if (resource === 'pipeline') {
      if (subResource === 'funnel') return handlePipelineFunnel(req, res);
      if (subResource === 'metrics') return handlePipelineMetrics(req, res);
      if (subResource === 'transitions') return handleTransitionHistory(req, res, subId);
      if (subResource === 'decline-analysis') return handleDeclineAnalysis(req, res);
      return res.status(400).json({ success: false, error: 'Invalid pipeline route' });
    }

    // Contact-specific routes
    if (resource) {
      // GET /api/candidates/:id
      if (req.method === 'GET' && !subResource) {
        return handleGetDetail(req, res, resource);
      }

      // PUT /api/candidates/:id
      if (req.method === 'PUT' && !subResource) {
        return handleUpdate(req, res, resource);
      }

      // PATCH /api/candidates/:id/stage
      if (req.method === 'PATCH' && subResource === 'stage') {
        return handleStageChange(req, res, resource);
      }

      // DELETE /api/candidates/:id
      if (req.method === 'DELETE' && !subResource) {
        return handleArchive(req, res, resource);
      }

      // Outreach routes (C-13/14)
      if (subResource === 'outreach') {
        if (req.method === 'GET') return handleGetOutreach(req, res, resource);
        if (req.method === 'POST') return handleAddOutreach(req, res, resource);
      }

      // Motivation routes (C-23/24)
      if (subResource === 'motivation') {
        if (req.method === 'GET') return handleGetMotivation(req, res, resource);
        if (req.method === 'POST') return handleSubmitMotivation(req, res, resource);
      }

      // Reachability routes (C-25/26)
      if (subResource === 'reachability') {
        if (req.method === 'GET') return handleGetReachability(req, res, resource);
        if (req.method === 'POST') return handleSubmitReachability(req, res, resource);
      }

      // Gate check (C-27)
      if (subResource === 'gate-check' && req.method === 'POST') {
        return handleGateCheck(req, res, resource);
      }

      // Mandate links (C-19/20/21/22)
      if (subResource === 'mandates') {
        if (req.method === 'GET') return handleGetMandates(req, res, resource);
        if (req.method === 'POST') return handleLinkMandate(req, res, resource);
        if (req.method === 'PATCH' && subId) return handleUpdateMandateLink(req, res, resource, subId);
        if (req.method === 'DELETE' && subId) return handleUnlinkMandate(req, res, resource, subId);
      }

      return res.status(400).json({ success: false, error: 'Invalid candidate route' });
    }

    // List routes
    if (req.method === 'GET') return handleList(req, res);
    if (req.method === 'POST') return handleQuickAdd(req, res);
    if (req.method === 'PATCH') {
      // Bulk stage change
      const { action } = req.query;
      if (action === 'bulk-stage') return handleBulkStageChange(req, res);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'candidates', err);
  }
}

// ── C-1: List Candidates ──────────────────────────────────────────────
async function handleList(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const {
    page = '1',
    limit = '50',
    sort = 'last_contacted',
    order = 'desc',
    pipeline_stage,
    tier,
    classification,
    motivation_overall,
    industry,
    location,
    confidence,
    created_by,
    mandate_id,
    search,
    is_archived = 'false',
  } = req.query as Record<string, string>;

  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 50, 200);
  const offset = (pageNum - 1) * limitNum;

  const where: Array<{ column: string; value: string | number | boolean; op?: string }> = [];

  // Filters
  if (is_archived === 'false') {
    where.push({ column: 'is_archived', value: false });
  }

  if (pipeline_stage) {
    const stages = pipeline_stage.split(',');
    for (const s of stages) {
      if (PIPELINE_STAGES.includes(s)) {
        where.push({ column: 'pipeline_stage', value: s });
      }
    }
  }

  if (tier && ['A', 'B', 'C'].includes(tier)) {
    where.push({ column: 'tier', value: tier });
  }

  if (classification) {
    where.push({ column: 'classification', value: classification });
  }

  if (motivation_overall && VALID_MOTIVATION_VALUES.includes(motivation_overall)) {
    where.push({ column: 'motivation_overall', value: motivation_overall });
  }

  if (industry) {
    where.push({ column: 'industry', value: industry, op: 'ilike' });
  }

  if (location) {
    where.push({ column: 'city', value: location, op: 'ilike' });
  }

  if (created_by) {
    where.push({ column: 'created_by', value: created_by });
  }

  if (mandate_id) {
    // Filter by mandate association via candidate_mandate_links
    const links = await selectMany('candidate_mandate_links', {
      select: 'contact_id',
      where: [{ column: 'mandate_id', value: mandate_id }],
    }, 15000);
    const contactIds = links.map(l => l.contact_id);
    if (contactIds.length > 0) {
      where.push({ column: 'id', value: `(${contactIds.join(',')})`, op: 'in' });
    } else {
      return res.status(200).json({ data: [], pagination: { page: pageNum, limit: limitNum, total: 0, total_pages: 0 } });
    }
  }

  // Confidence filter
  if (confidence === 'low') {
    where.push({ column: 'data_confidence', value: 50, op: 'lt' });
  } else if (confidence === 'medium') {
    where.push({ column: 'data_confidence', value: 50, op: 'gte' });
    where.push({ column: 'data_confidence', value: 80, op: 'lt' });
  } else if (confidence === 'high') {
    where.push({ column: 'data_confidence', value: 80, op: 'gte' });
  }

  // Select fields
  const selectFields = 'id, name, current_title, company_id, pipeline_stage, pipeline_status, tier, classification, motivation_overall, data_confidence, last_contacted, created_by, trident_composite, trident_d1, trident_d2, trident_d3, enrichment_status, created_at';

  const contacts = await selectMany('contacts', {
    select: selectFields,
    where: where.length > 0 ? where : undefined,
    orderBy: { column: sort, ascending: order === 'asc' },
    limit: limitNum,
    offset,
  }, 15000);

  // Get total count (approximate)
  const allContacts = await selectMany('contacts', {
    select: 'id',
    where: where.length > 0 ? where : undefined,
    limit: 10000,
  }, 15000);
  const total = allContacts.length;

  // Fetch company names
  const companyIds = contacts.filter(c => c.company_id).map(c => c.company_id);
  const companies = companyIds.length > 0
    ? await selectMany('companies', {
        select: 'id, name',
        where: [{ column: 'id', value: `(${companyIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const companyMap = new Map(companies.map(c => [c.id, c.name]));

  // Enrich with mandate count
  const enriched = contacts.map(c => ({
    ...c,
    company: c.company_id ? { id: c.company_id, name: companyMap.get(c.company_id) || 'Unknown' } : null,
    mandate_count: 0, // Would need separate query for accurate count
  }));

  return res.status(200).json({
    success: true,
    data: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum),
    },
  });
}

// ── C-2: Get Candidate Detail ─────────────────────────────────────────
async function handleGetDetail(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: '*',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  // Fetch related data
  const outreachLog = await selectMany('candidate_outreach_log', {
    select: 'id, interaction_type, summary, outcome, created_at, created_by',
    where: [{ column: 'contact_id', value: contactId }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 20,
  }, 15000);

  const mandateLinks = await selectMany('candidate_mandate_links', {
    select: 'id, mandate_id, status, priority, notes, market_position',
    where: [{ column: 'contact_id', value: contactId }],
  }, 15000);

  // Get mandate details
  const mandateIds = mandateLinks.map(l => l.mandate_id);
  const mandates = mandateIds.length > 0
    ? await selectMany('mandates', {
        select: 'id, title, status',
        where: [{ column: 'id', value: `(${mandateIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const mandateMap = new Map(mandates.map(m => [m.id, m]));

  const transitions = await selectMany('pipeline_transitions', {
    select: 'id, from_stage, to_stage, changed_by, changed_at, reason, is_backward',
    where: [{ column: 'contact_id', value: contactId }],
    orderBy: { column: 'changed_at', ascending: false },
    limit: 50,
  }, 15000);

  // Get company
  const company = contact.company_id
    ? await selectOne('companies', {
        column: 'id',
        value: contact.company_id,
        select: 'id, name, industry',
      }, 15000)
    : null;

  return res.status(200).json({
    success: true,
    data: {
      ...contact,
      company,
      outreach_log: outreachLog,
      mandate_links: mandateLinks.map(l => ({
        ...l,
        mandate: mandateMap.get(l.mandate_id) || null,
      })),
      transitions,
      scores: {
        trident_composite: contact.trident_composite,
        trident_d1: contact.trident_d1,
        trident_d2: contact.trident_d2,
        trident_d3: contact.trident_d3,
        trident_scores: contact.trident_scores,
        canvas_profile: contact.canvas_profile,
      },
      motivation: {
        overall: contact.motivation_overall,
        assessment: contact.motivation_assessment,
      },
      reachability: {
        verified: contact.reachability_verified,
        unknowns: contact.reachability_unknowns,
        channel: contact.contact_channel,
        details: contact.reachability_details,
      },
    },
  });
}

// ── C-3: Quick Add Candidate ───────────────────────────────────────────
async function handleQuickAdd(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const {
    name,
    company_name,
    current_title,
    source = 'platform',
    email,
    city,
    country,
    industry,
    tier,
    classification,
    linkedin_url,
    skills,
    languages,
    notes,
  } = req.body || {};

  // Required fields
  if (!name) {
    return res.status(400).json({ success: false, error: 'name is required' });
  }

  // Find or create company
  let companyId = null;
  if (company_name) {
    const existingCompany = await selectOne('companies', {
      column: 'name',
      value: company_name,
      select: 'id',
    }, 15000);

    if (existingCompany) {
      companyId = existingCompany.id;
    } else {
      const newCompany = await insert('companies', {
        name: company_name,
        industry: industry || null,
        created_at: new Date().toISOString(),
      }, 15000);
      companyId = newCompany.id;
    }
  }

  // Create contact
  const contact = await insert('contacts', {
    name,
    current_title: current_title || null,
    company_id: companyId,
    email: email || null,
    city: city || null,
    country: country || null,
    industry: industry || null,
    tier: tier || null,
    classification: classification || null,
    linkedin_url: linkedin_url || null,
    skills: skills ? JSON.stringify(skills) : null,
    languages: languages ? JSON.stringify(languages) : null,
    candidate_notes: notes || null,
    source,
    created_by: user.id,
    pipeline_stage: 'S1_Sourced',
    pipeline_status: 'S1_Sourced',
    enrichment_status: 'raw',
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, 15000);

  // Create signal
  const signal = await insert('signals', {
    type: 'status_change',
    source: 'platform',
    contact_id: contact.id,
    actor_id: user.id,
    title: 'Candidate created: S1_Sourced',
    metadata: { action: 'quick_add', source },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(201).json({
    success: true,
    data: contact,
    data_confidence: contact.data_confidence,
    signal_id: signal.id,
  });
}

// ── C-4: Update Candidate ─────────────────────────────────────────────
async function handleUpdate(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const existing = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'id',
  }, 15000);

  if (!existing) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  const updates = req.body || {};
  delete updates.id;
  delete updates.pipeline_stage; // Use stage endpoint for this
  delete updates.created_at;
  updates.updated_at = new Date().toISOString();

  const result = await update('contacts', { column: 'id', value: contactId }, updates, 15000);

  return res.status(200).json({
    success: true,
    data: result[0] || null,
  });
}

// ── C-5: Pipeline Stage Change ────────────────────────────────────────
async function handleStageChange(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const {
    pipeline_stage,
    reason,
    decline_reason,
    decline_notes,
  } = req.body || {};

  // Validate target stage
  if (!pipeline_stage || !PIPELINE_STAGES.includes(pipeline_stage)) {
    return res.status(400).json({
      success: false,
      error: `Invalid pipeline_stage. Must be one of: ${PIPELINE_STAGES.join(', ')}`,
    });
  }

  // Get current contact
  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'id, pipeline_stage, motivation_overall, reachability_verified, reachability_unknowns, contact_channel',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  // S2 → S3 gate check (GRID v2.0)
  if (contact.pipeline_stage === 'S2_Screened' && pipeline_stage === 'S3_Contacted') {
    // Check motivation
    if (contact.motivation_overall === 'RED') {
      return res.status(422).json({
        success: false,
        error: 'GATE_BLOCKED',
        block_reason: 'Motivation is RED — do not contact',
        motivation_overall: contact.motivation_overall,
        reachability_unknowns: contact.reachability_unknowns,
        action_required: 'Complete motivation screening and reachability validation before contacting',
      });
    }

    if (contact.motivation_overall === 'UNKNOWN') {
      return res.status(422).json({
        success: false,
        error: 'GATE_BLOCKED',
        block_reason: 'Motivation not yet assessed — complete motivation screening first',
        motivation_overall: contact.motivation_overall,
        reachability_unknowns: contact.reachability_unknowns,
        action_required: 'Complete 5-factor motivation assessment before contacting',
      });
    }

    // Check reachability unknowns
    if (contact.reachability_unknowns >= 2) {
      return res.status(422).json({
        success: false,
        error: 'GATE_BLOCKED',
        block_reason: `Reachability: ${contact.reachability_unknowns} unknowns (max 1 allowed)`,
        motivation_overall: contact.motivation_overall,
        reachability_unknowns: contact.reachability_unknowns,
        action_required: 'Resolve reachability unknowns before contacting',
      });
    }

    // Check contact channel
    if (!contact.contact_channel || contact.contact_channel === 'NONE') {
      return res.status(422).json({
        success: false,
        error: 'GATE_BLOCKED',
        block_reason: 'No contact channel available',
        motivation_overall: contact.motivation_overall,
        reachability_unknowns: contact.reachability_unknowns,
        action_required: 'Verify contact channel (LinkedIn/Email/WeChat) before contacting',
      });
    }
  }

  // S8 requires decline_reason
  if (pipeline_stage === 'S8_Not_Interested' && !decline_reason) {
    return res.status(400).json({
      success: false,
      error: 'decline_reason is required for S8_Not_Interested',
      valid_reasons: VALID_DECLINE_REASONS,
    });
  }

  if (decline_reason && !VALID_DECLINE_REASONS.includes(decline_reason)) {
    return res.status(400).json({
      success: false,
      error: `Invalid decline_reason. Must be one of: ${VALID_DECLINE_REASONS.join(', ')}`,
    });
  }

  // Update contact (trigger will log to pipeline_transitions)
  const updates: Record<string, any> = {
    pipeline_stage,
    stage_changed_by: user.id,
    candidate_notes: reason || null,
  };

  if (decline_reason) {
    updates.decline_reason = decline_reason;
    updates.decline_notes = decline_notes || null;
  }

  const result = await update('contacts', { column: 'id', value: contactId }, updates, 15000);

  // Get the transition record that was just created
  const transition = await selectOne('pipeline_transitions', {
    column: 'contact_id',
    value: contactId,
    select: '*',
  }, 15000);

  // Create signal
  await insert('signals', {
    type: 'status_change',
    source: 'platform',
    contact_id: contactId,
    actor_id: user.id,
    title: `Pipeline stage changed: ${contact.pipeline_stage} → ${pipeline_stage}`,
    metadata: { from: contact.pipeline_stage, to: pipeline_stage, reason },
    insights: {},
    action_required: false,
    action_status: 'none',
  }, 15000);

  return res.status(200).json({
    success: true,
    data: result[0] || null,
    transition: {
      id: transition?.id,
      from_stage: contact.pipeline_stage,
      to_stage: pipeline_stage,
      is_backward: transition?.is_backward || false,
      changed_at: transition?.changed_at || new Date().toISOString(),
    },
  });
}

// ── C-6: Bulk Stage Change ────────────────────────────────────────────
async function handleBulkStageChange(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { contact_ids, pipeline_stage, reason } = req.body || {};

  if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'contact_ids array is required' });
  }

  if (!pipeline_stage || !PIPELINE_STAGES.includes(pipeline_stage)) {
    return res.status(400).json({
      success: false,
      error: `Invalid pipeline_stage. Must be one of: ${PIPELINE_STAGES.join(', ')}`,
    });
  }

  // Process in batches
  const results = [];
  for (const contactId of contact_ids) {
    try {
      await update('contacts', { column: 'id', value: contactId }, {
        pipeline_stage,
        stage_changed_by: user.id,
        candidate_notes: reason || null,
      }, 15000);
      results.push({ id: contactId, success: true });
    } catch (e) {
      results.push({ id: contactId, success: false, error: String(e) });
    }
  }

  return res.status(200).json({
    success: true,
    results,
    updated_count: results.filter(r => r.success).length,
    failed_count: results.filter(r => !r.success).length,
  });
}

// ── C-7: Archive Candidate ────────────────────────────────────────────
async function handleArchive(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  // Check admin role
  const profile = await selectOne('profiles', {
    column: 'id',
    value: user.id,
    select: 'role',
  }, 15000);

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Admin role required to archive' });
  }

  const result = await update('contacts', { column: 'id', value: contactId }, {
    is_archived: true,
    archived_at: new Date().toISOString(),
    archived_by: user.id,
  }, 15000);

  if (!result || result.length === 0) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Candidate archived',
    data: result[0],
  });
}

// ── C-13/14: Outreach Log ─────────────────────────────────────────────
async function handleGetOutreach(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const log = await selectMany('candidate_outreach_log', {
    select: '*',
    where: [{ column: 'contact_id', value: contactId }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 100,
  }, 15000);

  return res.status(200).json({ success: true, data: log });
}

async function handleAddOutreach(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { interaction_type, summary, outcome, next_step, next_step_date, notes } = req.body || {};

  if (!interaction_type || !summary) {
    return res.status(400).json({ success: false, error: 'interaction_type and summary are required' });
  }

  const entry = await insert('candidate_outreach_log', {
    contact_id: contactId,
    created_by: user.id,
    interaction_type,
    summary,
    outcome: outcome || null,
    next_step: next_step || null,
    next_step_date: next_step_date || null,
    notes: notes || null,
  }, 15000);

  return res.status(201).json({ success: true, data: entry });
}

// ── C-23/24: Motivation Screening ─────────────────────────────────────
async function handleGetMotivation(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'motivation_overall, motivation_assessment',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      overall: contact.motivation_overall,
      assessment: contact.motivation_assessment || {},
    },
  });
}

async function handleSubmitMotivation(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { assessment } = req.body || {};

  if (!assessment) {
    return res.status(400).json({ success: false, error: 'assessment is required' });
  }

  // Validate each factor
  for (const factor of VALID_MOTIVATION_FACTORS) {
    if (assessment[factor] && !VALID_MOTIVATION_VALUES.includes(assessment[factor])) {
      return res.status(400).json({
        success: false,
        error: `Invalid value for ${factor}. Must be GREEN, YELLOW, RED, or UNKNOWN`,
      });
    }
  }

  // Calculate overall
  let overall = 'GREEN';
  if (Object.values(assessment).some(v => v === 'RED')) {
    overall = 'RED';
  } else if (Object.values(assessment).some(v => v === 'YELLOW')) {
    overall = 'YELLOW';
  } else if (Object.values(assessment).every(v => v === 'GREEN')) {
    overall = 'GREEN';
  }

  const assessmentData = {
    ...assessment,
    assessed_by: user.id,
    assessed_at: new Date().toISOString(),
  };

  // Get current classification
  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'classification',
  }, 15000);

  // If RED and not CLIENT_SHORTLIST, set classification to MOTIVATION_RISK
  let classificationUpdate = {};
  if (overall === 'RED' && contact?.classification !== 'CLIENT_SHORTLIST') {
    classificationUpdate = { classification: 'MOTIVATION_RISK' };
  }

  await update('contacts', { column: 'id', value: contactId }, {
    motivation_overall: overall,
    motivation_assessment: assessmentData,
    ...classificationUpdate,
    updated_at: new Date().toISOString(),
  }, 15000);

  // Create signal
  await insert('signals', {
    type: 'assessment',
    source: 'platform',
    contact_id: contactId,
    actor_id: user.id,
    title: `Motivation screening: ${overall}`,
    metadata: { assessment: assessmentData, overall },
    insights: {},
    action_required: overall === 'RED',
    action_status: overall === 'RED' ? 'pending' : 'none',
  }, 15000);

  return res.status(200).json({
    success: true,
    data: {
      overall,
      assessment: assessmentData,
    },
  });
}

// ── C-25/26: Reachability Validation ───────────────────────────────────
async function handleGetReachability(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'reachability_verified, reachability_unknowns, contact_channel, reachability_details',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      verified: contact.reachability_verified,
      unknowns: contact.reachability_unknowns,
      channel: contact.contact_channel,
      details: contact.reachability_details || {},
    },
  });
}

async function handleSubmitReachability(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { details, contact_channel } = req.body || {};

  if (!details) {
    return res.status(400).json({ success: false, error: 'details is required' });
  }

  if (contact_channel && !VALID_CONTACT_CHANNELS.includes(contact_channel)) {
    return res.status(400).json({
      success: false,
      error: `Invalid contact_channel. Must be one of: ${VALID_CONTACT_CHANNELS.join(', ')}`,
    });
  }

  // Count unknowns
  let unknowns = 0;
  if (details.location_confirmed === 'unknown') unknowns++;
  if (details.language_confirmed === 'unknown') unknowns++;
  if (details.openness_signals === 'unknown') unknowns++;

  const verified = unknowns <= 1;

  const detailsData = {
    ...details,
    checked_by: user.id,
    checked_at: new Date().toISOString(),
  };

  await update('contacts', { column: 'id', value: contactId }, {
    reachability_verified: verified,
    reachability_unknowns: unknowns,
    contact_channel: contact_channel || 'NONE',
    reachability_details: detailsData,
    updated_at: new Date().toISOString(),
  }, 15000);

  // Create signal
  await insert('signals', {
    type: 'assessment',
    source: 'platform',
    contact_id: contactId,
    actor_id: user.id,
    title: `Reachability validated: ${verified ? 'PASS' : 'FAIL'} (${unknowns} unknowns)`,
    metadata: { details: detailsData, unknowns, verified },
    insights: {},
    action_required: !verified,
    action_status: !verified ? 'pending' : 'none',
  }, 15000);

  return res.status(200).json({
    success: true,
    data: {
      verified,
      unknowns,
      channel: contact_channel,
      details: detailsData,
    },
  });
}

// ── C-27: Gate Check ──────────────────────────────────────────────────
async function handleGateCheck(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'motivation_overall, reachability_verified, reachability_unknowns, contact_channel',
  }, 15000);

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Candidate not found' });
  }

  // Run gate validation logic
  let canProceed = true;
  let blockReason = null;

  if (contact.motivation_overall === 'RED') {
    canProceed = false;
    blockReason = 'Motivation is RED — do not contact';
  } else if (contact.motivation_overall === 'UNKNOWN') {
    canProceed = false;
    blockReason = 'Motivation not yet assessed — complete motivation screening first';
  } else if (contact.reachability_unknowns >= 2) {
    canProceed = false;
    blockReason = `Reachability: ${contact.reachability_unknowns} unknowns (max 1 allowed)`;
  } else if (!contact.contact_channel || contact.contact_channel === 'NONE') {
    canProceed = false;
    blockReason = 'No contact channel available';
  }

  return res.status(200).json({
    success: true,
    data: {
      can_proceed: canProceed,
      block_reason: blockReason,
      motivation_overall: contact.motivation_overall,
      reachability_unknowns: contact.reachability_unknowns,
      contact_channel: contact.contact_channel,
    },
  });
}

// ── C-19/20/21/22: Mandate Links ──────────────────────────────────────
async function handleGetMandates(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const links = await selectMany('candidate_mandate_links', {
    select: '*',
    where: [{ column: 'contact_id', value: contactId }],
  }, 15000);

  // Get mandate details
  const mandateIds = links.map(l => l.mandate_id);
  const mandates = mandateIds.length > 0
    ? await selectMany('mandates', {
        select: 'id, title, status, organization_id',
        where: [{ column: 'id', value: `(${mandateIds.join(',')})`, op: 'in' }],
      }, 15000)
    : [];

  const mandateMap = new Map(mandates.map(m => [m.id, m]));

  return res.status(200).json({
    success: true,
    data: links.map(l => ({
      ...l,
      mandate: mandateMap.get(l.mandate_id) || null,
    })),
  });
}

async function handleLinkMandate(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { mandate_id, status, priority, notes } = req.body || {};

  if (!mandate_id) {
    return res.status(400).json({ success: false, error: 'mandate_id is required' });
  }

  // Check for existing link
  const existing = await selectOne('candidate_mandate_links', {
    column: 'contact_id',
    value: contactId,
    select: 'id, mandate_id',
  }, 15000);

  if (existing && existing.mandate_id === mandate_id) {
    return res.status(409).json({ success: false, error: 'Candidate already linked to this mandate' });
  }

  const link = await insert('candidate_mandate_links', {
    contact_id: contactId,
    mandate_id,
    created_by: user.id,
    status: status || 'identified',
    priority: priority || null,
    notes: notes || null,
  }, 15000);

  return res.status(201).json({ success: true, data: link });
}

async function handleUpdateMandateLink(req: VercelRequest, res: VercelResponse, contactId: string, mandateId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { status, priority, notes, market_position, sector_benchmark, salary_band, talent_density, competitor_presence } = req.body || {};

  const result = await update('candidate_mandate_links',
    { column: 'contact_id', value: contactId },
    {
      status: status || undefined,
      priority: priority || undefined,
      notes: notes || undefined,
      market_position: market_position || undefined,
      sector_benchmark: sector_benchmark || undefined,
      salary_band: salary_band || undefined,
      talent_density: talent_density || undefined,
      competitor_presence: competitor_presence || undefined,
      updated_at: new Date().toISOString(),
    }, 15000);

  return res.status(200).json({ success: true, data: result[0] || null });
}

async function handleUnlinkMandate(req: VercelRequest, res: VercelResponse, contactId: string, mandateId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  await deleteRows('candidate_mandate_links', { column: 'contact_id', value: contactId }, 15000);

  return res.status(200).json({ success: true, message: 'Mandate link removed' });
}

// ── C-28: Pipeline Funnel ─────────────────────────────────────────────
async function handlePipelineFunnel(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contacts = await selectMany('contacts', {
    select: 'pipeline_stage',
    where: [{ column: 'is_archived', value: false }],
    limit: 20000,
  }, 30000);

  const funnel: Record<string, number> = {};
  for (const stage of PIPELINE_STAGES) {
    funnel[stage] = 0;
  }

  for (const c of contacts) {
    if (funnel[c.pipeline_stage] !== undefined) {
      funnel[c.pipeline_stage]++;
    }
  }

  // Calculate summary
  const upstream = funnel.S1_Sourced + funnel.S2_Screened;
  const activePipeline = Object.entries(funnel).slice(2, 16).reduce((sum, [, count]) => sum + count, 0);
  const dead = funnel.S8_Not_Interested + funnel.S10_Call_Negative + funnel.S18_Offer_Declined;

  return res.status(200).json({
    success: true,
    data: {
      funnel,
      summary: {
        active_pipeline: activePipeline,
        dead,
        upstream,
      },
    },
  });
}

// ── C-29: Pipeline Metrics ────────────────────────────────────────────
async function handlePipelineMetrics(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contacts = await selectMany('contacts', {
    select: 'pipeline_stage, motivation_overall, enrichment_status',
    where: [{ column: 'is_archived', value: false }],
    limit: 20000,
  }, 30000);

  const transitions = await selectMany('pipeline_transitions', {
    select: 'from_stage, to_stage, motivation_overall',
    orderBy: { column: 'changed_at', ascending: false },
    limit: 5000,
  }, 30000);

  const totalMapped = contacts.length;
  const viablePool = contacts.filter(c => c.motivation_overall !== 'RED').length;

  // Quality ratio: S7+ / total mapped
  const qualityCount = contacts.filter(c =>
    ['S7_Interested', 'S9_Call_Positive', 'S11_Internal_Interview', 'S12_Presented_to_Client',
     'S13_Client_Int_Scheduled', 'S14_Client_Interviewed', 'S15_Client_2nd_Interview',
     'S16_Offer_Extended', 'S17_Offer_Accepted', 'S19_Closed'].includes(c.pipeline_stage)
  ).length;
  const qualityRatio = totalMapped > 0 ? qualityCount / totalMapped : 0;

  // Contact → Response rate
  const contactedTransitions = transitions.filter(t => t.from_stage === 'S3_Contacted');
  const respondedTransitions = transitions.filter(t => t.to_stage === 'S5_Responded');
  const contactToResponseRate = contactedTransitions.length > 0
    ? respondedTransitions.length / contactedTransitions.length : 0;

  // Motivation accuracy
  const greenContacted = transitions.filter(t => t.motivation_overall === 'GREEN' && t.to_stage === 'S5_Responded');
  const greenTotal = transitions.filter(t => t.motivation_overall === 'GREEN');
  const greenPositiveRate = greenTotal.length > 0 ? greenContacted.length / greenTotal.length : 0;

  const screenEffective = greenPositiveRate >= 0.7;

  return res.status(200).json({
    success: true,
    data: {
      quality_ratio: Math.round(qualityRatio * 100) / 100,
      quality_ratio_status: qualityRatio >= 0.25 ? 'healthy' : 'warning',
      contact_to_response_rate: Math.round(contactToResponseRate * 100) / 100,
      contact_to_response_status: contactToResponseRate >= 0.4 ? 'healthy' : 'warning',
      stale_count: {
        S3_stale_over_5_days: 0, // Would need date calculations
        S7_stale_over_10_days: 0,
      },
      motivation_accuracy: {
        green_positive_response_rate: Math.round(greenPositiveRate * 100) / 100,
        screen_effective: screenEffective,
      },
      total_mapped: totalMapped,
      viable_pool: viablePool,
    },
  });
}

// ── C-30: Transition History ──────────────────────────────────────────
async function handleTransitionHistory(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const transitions = await selectMany('pipeline_transitions', {
    select: 'id, from_stage, to_stage, changed_by, changed_at, reason, motivation_overall, reachability_verified, reachability_unknowns, decline_reason, is_backward',
    where: [{ column: 'contact_id', value: contactId }],
    orderBy: { column: 'changed_at', ascending: false },
    limit: 100,
  }, 15000);

  return res.status(200).json({
    success: true,
    data: {
      contact_id: contactId,
      transitions: transitions.map(t => ({
        id: t.id,
        from_stage: t.from_stage,
        to_stage: t.to_stage,
        changed_at: t.changed_at,
        reason: t.reason,
        is_backward: t.is_backward,
        gate_passed: t.motivation_overall && t.reachability_unknowns !== null ? {
          motivation_overall: t.motivation_overall,
          reachability_unknowns: t.reachability_unknowns,
        } : null,
        decline_reason: t.decline_reason,
      })),
    },
  });
}

// ── C-31: Decline Analysis ────────────────────────────────────────────
async function handleDeclineAnalysis(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const declinedContacts = await selectMany('contacts', {
    select: 'decline_reason, motivation_overall',
    where: [{ column: 'pipeline_stage', value: 'S8_Not_Interested' }],
  }, 15000);

  const reasonDistribution: Record<string, number> = {};
  for (const reason of VALID_DECLINE_REASONS) {
    reasonDistribution[reason] = 0;
  }

  for (const c of declinedContacts) {
    if (c.decline_reason && reasonDistribution[c.decline_reason] !== undefined) {
      reasonDistribution[c.decline_reason]++;
    }
  }

  const transitions = await selectMany('pipeline_transitions', {
    select: 'motivation_overall, to_stage',
    where: [{ column: 'to_stage', value: 'S5_Responded' }],
  }, 15000);

  const greenResponded = transitions.filter(t => t.motivation_overall === 'GREEN').length;
  const redResponded = transitions.filter(t => t.motivation_overall === 'RED').length;

  return res.status(200).json({
    success: true,
    data: {
      total_declines: declinedContacts.length,
      reason_distribution: reasonDistribution,
      motivation_calibration: {
        green_responded_positive: greenResponded,
        green_positive_rate: transitions.length > 0 ? greenResponded / transitions.length : 0,
        red_responded_positive: redResponded,
        red_positive_rate: transitions.length > 0 ? redResponded / transitions.length : 0,
        screen_effective: greenResponded > redResponded * 3,
      },
    },
  });
}