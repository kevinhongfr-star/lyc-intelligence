/**
 * Enrichment handler — DEX Platform Foundation T1
 *
 * Routes:
 *   GET /api/enrichment/status/:contact_id — Get enrichment status for a contact
 *   GET /api/enrichment/dashboard           — Distribution across all contacts
 *   POST /api/enrichment/trigger/:contact_id — Manually trigger enrichment pipeline
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectOne, selectMany, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';
import { insert } from './supabaseRest.js';

export const maxDuration = 60;

export async function handleEnrichment(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    const pathArr = (req.query.path as string[]) || [];
    const action = pathArr[0]; // "status", "dashboard", "trigger"
    const param = pathArr[1]; // contact_id for status/trigger

    if (req.method === 'GET' && action === 'dashboard') {
      return await handleDashboard(req, res);
    }

    if (req.method === 'GET' && action === 'status' && param) {
      return await handleStatus(req, res, param);
    }

    if (req.method === 'POST' && action === 'trigger' && param) {
      return await handleTrigger(req, res, param);
    }

    return res.status(400).json({ success: false, error: 'Invalid enrichment route' });
  } catch (err) {
    return handleError(res, 'enrichment', err);
  }
}

async function handleStatus(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'id, name, enrichment_status, trident_scores, canvas_profile, grid_metadata, signal_count, last_signal_at',
  });

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: contact.id,
      name: contact.name,
      enrichment_status: contact.enrichment_status || 'raw',
      has_trident: Boolean(contact.trident_scores && Object.keys(contact.trident_scores).length > 0),
      has_canvas: Boolean(contact.canvas_profile && Object.keys(contact.canvas_profile).length > 0),
      has_grid: Boolean(contact.grid_metadata && Object.keys(contact.grid_metadata).length > 0),
      signal_count: contact.signal_count || 0,
      last_signal_at: contact.last_signal_at,
      trident_scores: contact.trident_scores,
      canvas_profile: contact.canvas_profile,
    },
  });
}

async function handleDashboard(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  // Get distribution from contacts
  const allContacts = await selectMany('contacts', {
    select: 'id, enrichment_status',
  }, 30000);

  const distribution: Record<string, number> = {
    raw: 0,
    linkedin_parsed: 0,
    scored: 0,
    narrated: 0,
    complete: 0,
  };

  let totalContacts = 0;
  for (const c of allContacts) {
    totalContacts++;
    const status = c.enrichment_status || 'raw';
    if (distribution[status] !== undefined) {
      distribution[status]++;
    }
  }

  // Get recent advances (last 10 enrichment_advance signals)
  const recentAdvances = await selectMany('signals', {
    select: 'id, contact_id, title, metadata, created_at',
    where: [{ column: 'type', value: 'enrichment_advance' }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 10,
  }, 15000);

  return res.status(200).json({
    success: true,
    data: {
      total_contacts: totalContacts,
      distribution,
      recent_advances: recentAdvances.map((s: any) => ({
        contact_id: s.contact_id,
        from: s.metadata?.from,
        to: s.metadata?.to,
        at: s.created_at,
      })),
    },
  });
}

async function handleTrigger(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ success: false, error: error || 'Unauthorized' });
  }

  // Verify contact exists
  const contact = await selectOne('contacts', {
    column: 'id',
    value: contactId,
    select: 'id, name, enrichment_status',
  });

  if (!contact) {
    return res.status(404).json({ success: false, error: 'Contact not found' });
  }

  // Create a signal to trigger enrichment pipeline
  const signal = await insert('signals', {
    type: 'enrichment_advance',
    source: 'platform',
    contact_id: contactId,
    actor_id: user.id,
    title: `Manual enrichment trigger for ${contact.name || contactId}`,
    metadata: { triggered_by: 'manual', current_status: contact.enrichment_status || 'raw' },
    insights: {},
    action_required: true,
    action_status: 'pending',
  }, 15000);

  return res.status(200).json({
    success: true,
    message: 'Enrichment pipeline triggered',
    signal_id: signal.id,
    contact_id: contactId,
  });
}
