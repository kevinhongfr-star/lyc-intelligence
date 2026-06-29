/**
 * Client Visibility Portal handler — DEX AI Technical Blueprint 05
 *
 * Routes:
 *   POST /api/client-auth/login                   — Magic link login
 *   GET  /api/client/mandates                    — Client mandate list
 *   GET  /api/client/mandate/:id                 — Client mandate dashboard
 *   GET  /api/client/candidate/:id/pdf           — Candidate PDF (client view)
 *   POST /api/client/feedback                    — Submit feedback
 *   GET  /api/client/feedback?mandate_id=        — List feedback
 *   GET  /api/client/notifications               — Client notifications
 *   PATCH /api/client/notifications/:id/read     — Mark notification as read
 *
 * Key security: Clients see ONLY approved profiles with NO internal scores
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 30;

export async function handleClient(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    if (resource === 'auth' && req.method === 'POST') return handleClientAuth(req, res);
    if (resource === 'mandates' && req.method === 'GET') return handleClientMandates(req, res);
    if (resource === 'mandate' && id && req.method === 'GET') return handleClientMandate(req, res, id);
    if (resource === 'candidate' && id && subResource === 'pdf' && req.method === 'GET') return handleCandidatePDF(req, res, id);
    if (resource === 'feedback' && req.method === 'POST') return handleClientFeedback(req, res);
    if (resource === 'feedback' && req.method === 'GET') return handleListFeedback(req, res);
    if (resource === 'notifications' && req.method === 'GET') return handleClientNotifications(req, res);
    if (resource === 'notifications' && id && req.method === 'PATCH') return handleMarkNotificationRead(req, res, id);

    return res.status(404).json({ success: false, error: 'Client route not found' });
  } catch (err) {
    return handleError(res, 'client', err);
  }
}

// ── Client Auth (Magic Link) ───────────────────────────────────────────
async function handleClientAuth(req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  let clientAccount = await selectOne('client_accounts', { column: 'email', value: email, select: '*' }, 10000);

  if (!clientAccount) {
    clientAccount = await insert('client_accounts', {
      email,
      name: email.split('@')[0],
      organization: email.split('@')[1]?.split('.')[0] || 'Unknown',
    });
  }

  return res.json({
    success: true,
    message: 'Magic link sent to your email',
    client_id: clientAccount.id,
  });
}

// ── Verify Client Access ───────────────────────────────────────────────
async function verifyClientAccess(userId: string, mandateId?: string) {
  const account = await selectOne('client_accounts', {
    column: 'auth_user_id', value: userId, select: '*',
  }, 10000);

  if (!account || !account.is_active) {
    throw new Error('No client access');
  }

  if (account.access_expires && new Date(account.access_expires) < new Date()) {
    throw new Error('Access expired');
  }

  if (mandateId) {
    const access = await selectOne('client_mandate_access', {
      column: 'client_account_id', value: account.id, select: '*',
    }, 10000);

    if (!access || access.mandate_id !== mandateId) {
      throw new Error('No access to this mandate');
    }
  }

  return { account };
}

// ── Client Mandate List ────────────────────────────────────────────────
async function handleClientMandates(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);

    const accessRecords = await selectMany('client_mandate_access', {
      client_account_id: account.id,
    }, ['created_at DESC'], 50, 0, '*');

    const mandates = await Promise.all(accessRecords.map(async (access: any) => {
      const mandate = await selectOne('mandates', {
        column: 'id', value: access.mandate_id, select: '*',
      }, 10000);

      if (!mandate || !mandate.client_visible) return null;

      const consultant = await selectOne('profiles', {
        column: 'id', value: mandate.lead_consultant_id, select: 'full_name',
      }, 10000);

      const contacts = await selectMany('contacts', { mandate_id: mandate.id }, [], 100, 0, 'pipeline_stage');

      const pipelineSummary = {
        sourced: contacts.filter((c: any) => c.pipeline_stage === 'S1_Sourced').length,
        screened: contacts.filter((c: any) => c.pipeline_stage === 'S2_Screened').length,
        shortlisted: contacts.filter((c: any) => c.pipeline_stage === 'S12_Presented_to_Client').length,
        interview: contacts.filter((c: any) => c.pipeline_stage === 'S13_Client_Int_Scheduled').length,
        offer: contacts.filter((c: any) => c.pipeline_stage === 'S16_Offer_Extended').length,
        placed: contacts.filter((c: any) => c.pipeline_stage === 'S19_Closed').length,
      };

      const feedback = await selectMany('client_feedback', {
        mandate_id: mandate.id, status: 'new',
      }, [], 50, 0, 'id');

      return {
        mandate_id: mandate.id,
        title: mandate.role_title,
        status: mandate.phase === 'close' ? 'Completed' : mandate.phase === 'paused' ? 'On Hold' : 'Active',
        lead_consultant_name: consultant?.full_name || 'Unknown',
        kevin_as_sponsor: true,
        days_since_kickoff: Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        pipeline_summary: pipelineSummary,
        last_activity_at: mandate.updated_at,
        open_feedback_count: feedback.length,
      };
    }));

    return res.json({ success: true, mandates: mandates.filter(Boolean) });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Client Mandate Dashboard ───────────────────────────────────────────
async function handleClientMandate(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id, id);

    const mandate = await selectOne('mandates', {
      column: 'id', value: id, select: '*',
    }, 10000);

    if (!mandate || !mandate.client_visible) {
      return res.status(404).json({ success: false, error: 'Mandate not found or not visible' });
    }

    const consultant = await selectOne('profiles', {
      column: 'id', value: mandate.lead_consultant_id, select: 'full_name',
    }, 10000);

    const contacts = await selectMany('contacts', { mandate_id: id }, [], 100, 0, 'pipeline_stage');

    const pipelineStages = [
      { stage: 'S1_Sourced', count: contacts.filter((c: any) => c.pipeline_stage === 'S1_Sourced').length, label: 'Sourced' },
      { stage: 'S2_Screened', count: contacts.filter((c: any) => c.pipeline_stage === 'S2_Screened').length, label: 'Screened' },
      { stage: 'S12_Presented_to_Client', count: contacts.filter((c: any) => c.pipeline_stage === 'S12_Presented_to_Client').length, label: 'Shortlisted' },
      { stage: 'S13_Client_Int_Scheduled', count: contacts.filter((c: any) => c.pipeline_stage === 'S13_Client_Int_Scheduled').length, label: 'Interview' },
      { stage: 'S16_Offer_Extended', count: contacts.filter((c: any) => c.pipeline_stage === 'S16_Offer_Extended').length, label: 'Offer' },
      { stage: 'S19_Closed', count: contacts.filter((c: any) => c.pipeline_stage === 'S19_Closed').length, label: 'Placed' },
    ];

    const presentedContacts = await selectMany('contacts', {
      mandate_id: id, client_presented: true,
    }, ['client_presented_at DESC'], 50, 0, '*');

    const candidates = await Promise.all(presentedContacts.map(async (contact: any) => {
      const canvas = await selectOne('canvas_profiles', {
        column: 'contact_id', value: contact.id, select: 'pdf_url, review_status',
      }, 10000);

      const lastFeedback = await selectMany('client_feedback', {
        mandate_id: id, contact_id: contact.id,
      }, ['created_at DESC'], 1, 0, '*');

      return {
        contact_id: contact.id,
        full_name: contact.full_name,
        title: contact.title,
        company_name: contact.company_name,
        photo_url: contact.photo_url,
        composite_score: contact.trident_composite,
        verdict_label: contact.trident_verdict,
        canvas_grade: contact.canvas_grade,
        pipeline_stage: contact.pipeline_stage,
        canvas_pdf_url: canvas?.review_status === 'approved' ? canvas.pdf_url : null,
        feedback_status: lastFeedback[0]?.feedback_type || null,
      };
    }));

    const timeline = [
      { date: new Date(mandate.created_at).toISOString().split('T')[0], event: 'Kick-off', status: 'completed' },
      { date: mandate.target_close_date || '', event: 'Target close', status: mandate.target_close_date && new Date(mandate.target_close_date) > new Date() ? 'future' : 'upcoming' },
    ];

    return res.json({
      success: true,
      mandate: {
        id: mandate.id,
        title: mandate.role_title,
        status: mandate.phase === 'close' ? 'Completed' : mandate.phase === 'paused' ? 'On Hold' : 'Active',
        client_summary: mandate.client_summary || 'Your executive search is underway. We will present qualified candidates as they are identified.',
        lead_consultant_name: consultant?.full_name || 'Unknown',
        kevin_as_sponsor: true,
        days_since_kickoff: Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        target_close_date: mandate.target_close_date,
      },
      pipeline: { stages: pipelineStages },
      timeline,
      candidates,
      market_intelligence: {
        summary: 'Market intelligence data will be available here.',
        grid_report_url: null,
        last_grid_run_date: null,
      },
      recent_activity: [],
    });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Candidate PDF (Client View) ────────────────────────────────────────
async function handleCandidatePDF(req: VercelRequest, res: VercelResponse, contactId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);

    const contact = await selectOne('contacts', {
      column: 'id', value: contactId, select: '*',
    }, 10000);

    if (!contact || !contact.client_presented) {
      return res.status(404).json({ success: false, error: 'Candidate not found or not presented' });
    }

    const canvas = await selectOne('canvas_profiles', {
      column: 'contact_id', value: contactId, select: 'pdf_url, review_status',
    }, 10000);

    if (!canvas || canvas.review_status !== 'approved') {
      return res.status(404).json({ success: false, error: 'Profile not available' });
    }

    return res.redirect(canvas.pdf_url);
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Client Feedback ────────────────────────────────────────────────────
async function handleClientFeedback(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { mandate_id, contact_id, feedback_type, reason, additional_info } = req.body || {};

  if (!mandate_id || !contact_id || !feedback_type) {
    return res.status(400).json({ success: false, error: 'mandate_id, contact_id, and feedback_type are required' });
  }

  if (!['interested', 'not_interested', 'need_more_info', 'hold'].includes(feedback_type)) {
    return res.status(400).json({ success: false, error: 'Invalid feedback type' });
  }

  if ((feedback_type === 'not_interested' || feedback_type === 'need_more_info') && !reason) {
    return res.status(400).json({ success: false, error: 'Reason is required for not_interested or need_more_info' });
  }

  try {
    const { account } = await verifyClientAccess(user.id, mandate_id);

    const feedback = await insert('client_feedback', {
      client_account_id: account.id,
      mandate_id,
      contact_id,
      feedback_type,
      reason,
      additional_info,
    });

    if (feedback_type === 'interested') {
      await update('contacts', contact_id, {
        pipeline_stage: 'S13_Client_Int_Scheduled',
      });
    }

    await insert('signals', {
      contact_id,
      type: 'feedback',
      agent_id: 'client',
      metadata: JSON.stringify({ action: feedback_type, mandate_id }),
    });

    return res.json({ success: true, feedback });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── List Feedback ──────────────────────────────────────────────────────
async function handleListFeedback(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { mandate_id } = req.query as Record<string, string>;

  try {
    const { account } = await verifyClientAccess(user.id, mandate_id);

    const feedback = await selectMany('client_feedback', {
      client_account_id: account.id,
      ...(mandate_id && { mandate_id }),
    }, ['created_at DESC'], 50, 0, '*');

    const enriched = await Promise.all(feedback.map(async (fb: any) => {
      const contact = await selectOne('contacts', {
        column: 'id', value: fb.contact_id, select: 'full_name',
      }, 10000);
      return { ...fb, full_name: contact?.full_name || 'Unknown' };
    }));

    return res.json({ success: true, feedback: enriched });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Client Notifications ───────────────────────────────────────────────
async function handleClientNotifications(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);

    const notifications = await selectMany('client_notifications', {
      client_account_id: account.id,
    }, ['created_at DESC'], 50, 0, '*');

    const unreadCount = notifications.filter((n: any) => !n.read).length;

    return res.json({ success: true, notifications, unread_count: unreadCount });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Mark Notification Read ─────────────────────────────────────────────
async function handleMarkNotificationRead(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);

    const notification = await selectOne('client_notifications', {
      column: 'id', value: id, select: '*',
    }, 10000);

    if (!notification || notification.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await update('client_notifications', id, { read: true });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}
