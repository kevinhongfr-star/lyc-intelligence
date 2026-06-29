/**
 * Agent Actions handler — DEX Platform Foundation T1
 *
 * Routes:
 *   POST   /api/agent-actions              — Submit a new agent action (draft/pending)
 *   GET    /api/agent-actions?status=pending — List agent actions by status
 *   PATCH  /api/agent-actions/:id/review    — Approve/reject an action (L2 review)
 *   PATCH  /api/agent-actions/:id/execute   — Mark as executed
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, selectMany, selectOne, update, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const VALID_AGENTS = ['trident', 'canvas', 'grid', 'sweep', 'alessio'];
const VALID_ACTION_TYPES = ['score', 'narrate', 'map', 'research', 'notify', 'draft', 'enrich', 'parse'];
const VALID_STATUSES = ['pending', 'approved', 'executed', 'rejected', 'failed'];

/**
 * Router: POST/GET on /api/agent-actions, PATCH on /api/agent-actions/:id/*
 */
export async function handleAgentActions(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    // Extract action from path
    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0]; // e.g. "review", "execute"
    const id = pathArr[1];    // e.g. UUID after "review/"

    // PATCH /api/agent-actions/:id/review or /api/agent-actions/:id/execute
    if (req.method === 'PATCH' && action && id) {
      if (action === 'review') {
        return await handleReview(req, res, id);
      }
      if (action === 'execute') {
        return await handleExecute(req, res, id);
      }
      return res.status(400).json({ success: false, error: 'Unknown sub-action' });
    }

    // GET /api/agent-actions — list by status
    if (req.method === 'GET') {
      return await handleList(req, res);
    }

    // POST /api/agent-actions — create pending action
    if (req.method === 'POST') {
      return await handleCreate(req, res);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'agent_actions', err);
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { status, agent_id, contact_id, limit = '50' } = req.query as Record<string, string>;
  const profile = await selectOne('profiles', {
    column: 'id',
    value: user.id,
    select: 'role',
  });
  const isTeamLeadOrAdmin = profile?.role === 'admin' || profile?.role === 'team_lead';

  const where: Array<{ column: string; value: string | number | boolean }> = [];

  // Non-admins can only see their own triggered actions
  if (!isTeamLeadOrAdmin) {
    where.push({ column: 'triggered_by', value: user.id });
  } else if (status) {
    where.push({ column: 'status', value: status });
  }

  if (agent_id) {
    where.push({ column: 'agent_id', value: agent_id });
  }
  if (contact_id) {
    where.push({ column: 'contact_id', value: contact_id });
  }

  const actions = await selectMany('agent_actions', {
    select: '*',
    where: where.length > 0 ? where : undefined,
    orderBy: { column: 'created_at', ascending: false },
    limit: parseInt(limit),
  }, 15000);

  return res.status(200).json({ success: true, data: actions });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const {
    agent_id,
    action_type,
    contact_id,
    mandate_id,
    company_id,
    input_data = {},
    output_data = {},
    confidence,
    trigger_signal_id,
    metadata = {},
  } = req.body || {};

  // Validate agent_id
  if (!agent_id || !VALID_AGENTS.includes(agent_id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid agent_id. Must be one of: ${VALID_AGENTS.join(', ')}`,
    });
  }

  // Validate action_type
  if (!action_type || !VALID_ACTION_TYPES.includes(action_type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`,
    });
  }

  // Status is always 'pending' on creation (L2)
  const action = await insert('agent_actions', {
    agent_id,
    action_type,
    triggered_by: user.id,
    contact_id: contact_id || null,
    mandate_id: mandate_id || null,
    company_id: company_id || null,
    input_data,
    output_data,
    confidence: confidence || null,
    status: 'pending',
    trigger_signal_id: trigger_signal_id || null,
    metadata,
  }, 15000);

  return res.status(201).json({
    success: true,
    id: action.id,
    status: 'pending',
    created_at: action.created_at,
  });
}

async function handleReview(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  // Check reviewer role
  const profile = await selectOne('profiles', {
    column: 'id',
    value: user.id,
    select: 'role',
  });
  if (profile?.role !== 'admin' && profile?.role !== 'team_lead') {
    return res.status(403).json({ success: false, error: 'Forbidden: team_lead or admin required' });
  }

  const { status, review_notes } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  // Get the action
  const action = await selectOne('agent_actions', {
    column: 'id',
    value: id,
    select: '*',
  });

  if (!action) {
    return res.status(404).json({ success: false, error: 'Agent action not found' });
  }

  // Update the action record
  const updates: Record<string, any> = {
    status,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };
  if (review_notes) {
    updates.review_notes = review_notes;
  }

  await update('agent_actions', { column: 'id', value: id }, updates, 15000);

  // If approved, apply output_data to target entity and advance enrichment
  if (status === 'approved' && action.output_data && Object.keys(action.output_data).length > 0) {
    await applyApprovedOutput(action, user.id);
  }

  return res.status(200).json({
    success: true,
    id,
    status,
    reviewed_by: user.id,
    reviewed_at: updates.reviewed_at,
  });
}

async function applyApprovedOutput(action: any, reviewerId: string) {
  try {
    // Apply based on action_type
    if (action.action_type === 'score' && action.contact_id) {
      // Write trident_scores to contacts
      await update('contacts', { column: 'id', value: action.contact_id }, {
        trident_scores: action.output_data,
        updated_at: new Date().toISOString(),
      }, 15000);

      // Auto-advance enrichment
      await callAutoAdvanceEnrichment(action.contact_id);
    }

    if (action.action_type === 'narrate' && action.contact_id) {
      // Write canvas_profile to contacts
      await update('contacts', { column: 'id', value: action.contact_id }, {
        canvas_profile: action.output_data,
        updated_at: new Date().toISOString(),
      }, 15000);

      await callAutoAdvanceEnrichment(action.contact_id);
    }

    if (action.action_type === 'map' && action.contact_id) {
      // Write grid_metadata to contacts
      await update('contacts', { column: 'id', value: action.contact_id }, {
        grid_metadata: action.output_data,
        updated_at: new Date().toISOString(),
      }, 15000);
    }
  } catch (e) {
    console.error('[agent_actions] Failed to apply approved output:', e);
  }
}

async function callAutoAdvanceEnrichment(contactId: string) {
  try {
    // Call the PostgreSQL function via a dummy update that triggers it
    // The function fn_auto_advance_enrichment is called via a raw SQL approach
    // For now, we directly update enrichment_status based on conditions
    const contact = await selectOne('contacts', {
      column: 'id',
      value: contactId,
      select: 'enrichment_status, trident_scores, canvas_profile, linkedin_url',
    });

    if (!contact) return;

    let newStatus = contact.enrichment_status || 'raw';
    const hasLinkedIn = Boolean(contact.linkedin_url);
    const hasTrident = Boolean(
      contact.trident_scores && Object.keys(contact.trident_scores).length > 0
    );
    const hasCanvas = Boolean(
      contact.canvas_profile && Object.keys(contact.canvas_profile).length > 0
    );

    if (newStatus === 'raw' && hasLinkedIn) {
      newStatus = 'linkedin_parsed';
    }
    if (newStatus === 'linkedin_parsed' && hasTrident) {
      newStatus = 'scored';
    }
    if (newStatus === 'scored' && hasCanvas) {
      newStatus = 'narrated';
    }

    if (newStatus !== contact.enrichment_status) {
      await update('contacts', { column: 'id', value: contactId }, {
        enrichment_status: newStatus,
        updated_at: new Date().toISOString(),
      }, 15000);

      // Log enrichment advance signal
      await insert('signals', {
        type: 'enrichment_advance',
        source: 'platform',
        contact_id: contactId,
        actor_id: reviewerId,
        title: `Enrichment: ${contact.enrichment_status} → ${newStatus}`,
        metadata: { from: contact.enrichment_status, to: newStatus },
        insights: {},
        action_required: false,
        action_status: 'none',
      }, 15000);
    }
  } catch (e) {
    console.error('[agent_actions] auto-advance enrichment failed:', e);
  }
}

async function handleExecute(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  // Get the action first
  const action = await selectOne('agent_actions', {
    column: 'id',
    value: id,
    select: '*',
  });

  if (!action) {
    return res.status(404).json({ success: false, error: 'Agent action not found' });
  }

  if (action.status !== 'approved') {
    return res.status(400).json({
      success: false,
      error: 'Action must be approved before execution',
    });
  }

  await update('agent_actions', { column: 'id', value: id }, {
    status: 'executed',
    executed_at: new Date().toISOString(),
  }, 15000);

  return res.status(200).json({
    success: true,
    id,
    status: 'executed',
    executed_at: new Date().toISOString(),
  });
}
