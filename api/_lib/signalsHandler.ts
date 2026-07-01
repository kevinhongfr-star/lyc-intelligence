/**
 * Signals handler — DEX Platform Foundation T1
 *
 * Routes:
 *   POST /api/signals              — Create a new signal
 *   GET  /api/signals?contact_id=X — List signals for a contact
 *   GET  /api/signals?mandate_id=X — List signals for a mandate
 *   GET  /api/signals/stats        — Signal distribution stats
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, selectMany, selectOne, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const VALID_TYPES = [
  'email','meeting','comment','assessment','status_change',
  'feedback','upload','linkedin','outreach','grid_report',
  'mandate_phase','enrichment_advance',
];

const VALID_SOURCES = [
  'platform','linkedin','email','feishu','notion','agent','import',
];

export async function handleSignals(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    // GET — list signals
    if (req.method === 'GET') {
      return await handleGetSignals(req, res);
    }

    // POST — create signal
    if (req.method === 'POST') {
      return await handleCreateSignal(req, res);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'signals', err);
  }
}

async function handleGetSignals(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const { contact_id, mandate_id, stats } = req.query as Record<string, string>;

  // Stats endpoint
  if (stats === 'true') {
    const rows = await selectMany('signals', {
      select: 'type, source, action_required, action_status',
    }, 15000);

    const distribution: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byActionStatus: Record<string, number> = {};
    let actionRequired = 0;

    for (const row of rows) {
      distribution[row.type] = (distribution[row.type] || 0) + 1;
      bySource[row.source] = (bySource[row.source] || 0) + 1;
      byActionStatus[row.action_status] = (byActionStatus[row.action_status] || 0) + 1;
      if (row.action_required) actionRequired++;
    }

    return res.status(200).json({
      success: true,
      total: rows.length,
      distribution,
      bySource,
      byActionStatus,
      actionRequired,
    });
  }

  // Filter by contact_id
  if (contact_id) {
    const signals = await selectMany('signals', {
      select: '*',
      where: [{ column: 'contact_id', value: contact_id }],
      orderBy: { column: 'created_at', ascending: false },
      limit: 100,
    }, 15000);
    return res.status(200).json({ success: true, data: signals });
  }

  // Filter by mandate_id
  if (mandate_id) {
    const signals = await selectMany('signals', {
      select: '*',
      where: [{ column: 'mandate_id', value: mandate_id }],
      orderBy: { column: 'created_at', ascending: false },
      limit: 100,
    }, 15000);
    return res.status(200).json({ success: true, data: signals });
  }

  // List recent signals for the user (actor_id = current user)
  const signals = await selectMany('signals', {
    select: '*',
    where: [{ column: 'actor_id', value: user.id }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 50,
  }, 15000);

  return res.status(200).json({ success: true, data: signals });
}

async function handleCreateSignal(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const {
    type,
    source = 'platform',
    contact_id,
    mandate_id,
    company_id,
    title,
    content,
    metadata = {},
    insights = {},
    action_required = false,
  } = req.body || {};

  // Validate type
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
    });
  }

  // Validate source
  if (!VALID_SOURCES.includes(source)) {
    return res.status(400).json({
      success: false,
      error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`,
    });
  }

  // Validate contact_id if provided
  if (contact_id) {
    const contact = await selectOne('contacts', {
      column: 'id',
      value: contact_id,
      select: 'id',
    });
    if (!contact) {
      return res.status(400).json({ success: false, error: 'contact_id not found' });
    }
  }

  const signal = await insert('signals', {
    type,
    source,
    actor_id: user.id,
    contact_id: contact_id || null,
    mandate_id: mandate_id || null,
    company_id: company_id || null,
    title: title || null,
    content: content || null,
    metadata,
    insights,
    action_required,
    action_status: 'none',
  }, 15000);

  return res.status(201).json({
    success: true,
    id: signal.id,
    type: signal.type,
    created_at: signal.created_at,
    contact_id: signal.contact_id,
    signal_count_updated: true,  // trigger handles this
  });
}
