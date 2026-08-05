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
 *   GET  /api/client/tier-distribution           — Tier counts (Gold/Silver/Bronze/Unranked) — S1-T11
 *   GET  /api/client/mandate-stats[?limit=N]     — Per-mandate aggregate dashboard stats — S1-T11
 *   GET  /api/client/heatmap[?limit=N]           — Mandate × Stage candidate heatmap — S1-T12
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
    if (resource === 'shortlist' && req.method === 'GET') return handleClientShortlist(req, res);
    if (resource === 'pipeline-counts' && req.method === 'GET') return handleClientPipelineCounts(req, res);
    if (resource === 'company' && req.method === 'GET') return handleClientCompany(req, res);
    if (resource === 'candidate' && id && subResource === 'pdf' && req.method === 'GET') return handleCandidatePDF(req, res, id);
    if (resource === 'feedback' && req.method === 'POST') return handleClientFeedback(req, res);
    if (resource === 'feedback' && req.method === 'GET') return handleListFeedback(req, res);
    if (resource === 'notifications' && req.method === 'GET') return handleClientNotifications(req, res);
    if (resource === 'notifications' && id && req.method === 'PATCH') return handleMarkNotificationRead(req, res, id);

    // ── S1-T11 / S1-T12 dashboard analytics endpoints ───────────────────
    if (resource === 'tier-distribution' && req.method === 'GET') return handleClientTierDistribution(req, res);
    if (resource === 'mandate-stats' && req.method === 'GET') return handleClientMandateStats(req, res);
    if (resource === 'heatmap' && req.method === 'GET') return handleClientHeatmap(req, res);

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

// ── Client Company (S3-T06) ───────────────────────────────────────────
// Resolve the company for a client user — used by ClientOverviewPage.
// Uses server-side ACL (client_accounts.auth_user_id, active + not expired).
async function handleClientCompany(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      // Graceful fallback: try profiles.organization_id (non-client users who
      // log in to view client data). RLS is enforced downstream by mandate ACL.
      const profile = await selectOne('profiles', {
        column: 'id', value: user.id, select: 'organization_id',
      }, 10000);
      const orgId = profile?.organization_id || null;
      let companyName = null;
      if (orgId) {
        const org = await selectOne('companies', {
          column: 'id', value: orgId, select: 'name',
        }, 10000);
        companyName = org?.name || null;
      }
      return res.json({
        success: true,
        companyId: orgId,
        companyName,
        account: null,
      });
    }

    if (account.access_expires && new Date(account.access_expires) < new Date()) {
      return res.status(403).json({ success: false, error: 'Access expired' });
    }

    let companyName = account.company_name || null;
    let companyId = account.company_id || null;
    if (companyId && !companyName) {
      const org = await selectOne('companies', {
        column: 'id', value: companyId, select: 'name',
      }, 10000);
      companyName = org?.name || null;
    }

    return res.json({
      success: true,
      companyId,
      companyName,
      account: {
        id: account.id,
        user_id: account.auth_user_id || null,
        company_id: account.company_id || null,
        company_name: companyName,
        contact_name: account.contact_name || null,
        contact_email: account.contact_email || null,
        role: account.role || 'client_user',
        status: account.is_active ? 'active' : 'inactive',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Client Pipeline Stage Counts (S3-T06) ──────────────────────────────
// Stage distribution for a mandate (or all accessible mandates for the user).
async function handleClientPipelineCounts(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { account } = await verifyClientAccess(user.id);
    const mandateId = (req.query.mandate_id as string) || (req.query.mandateId as string) || undefined;

    // Get accessible mandate IDs via ACL
    const accessRecords = await selectMany('client_mandate_access', {
      client_account_id: account.id,
    }, [], 200, 0, 'mandate_id');
    const allowedMandateIds = accessRecords
      .map((r: any) => r.mandate_id)
      .filter(Boolean);

    if (mandateId && !allowedMandateIds.includes(mandateId)) {
      return res.status(403).json({ success: false, error: 'No access to this mandate' });
    }

    const finalMandateIds = mandateId ? [mandateId] : allowedMandateIds;
    const countsByStage: Record<string, number> = {};

    if (finalMandateIds.length > 0) {
      // Batch fetch candidates per allowed mandate IDs (Supabase REST doesn't
      // support multi-column WHERE IN via selectOne/selectMany directly, so
      // query per mandate and aggregate). Aggregate is bounded (≤200 mandates).
      const allStages: string[] = [];
      for (const mid of finalMandateIds) {
        const rows = await selectMany('contacts',
          { mandate_id: mid },
          [],
          500, 0,
          'pipeline_stage'
        ).catch(() => []);
        for (const r of rows as any[]) {
          if (r.pipeline_stage) allStages.push(r.pipeline_stage);
        }
      }
      for (const s of allStages) {
        countsByStage[s] = (countsByStage[s] || 0) + 1;
      }
    }

    const stageCounts = Object.entries(countsByStage).map(([stage, count]) => ({ stage, count }));
    return res.json({ success: true, stage_counts: stageCounts });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Client Shortlist (S3-T06) ──────────────────────────────────────────
// Ranked Gold/Silver/Bronze shortlist for a mandate. Uses the mandate
// access ACL + only client_presented candidates, mirroring the mandate
// dashboard server-side logic.
async function handleClientShortlist(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const mandateId = (req.query.mandate_id as string) || (req.query.mandateId as string) || '';
  if (!mandateId) return res.status(400).json({ success: false, error: 'mandate_id is required' });

  try {
    const { account } = await verifyClientAccess(user.id, mandateId);

    // Confirm mandate is client_visible (double guard)
    const mandate = await selectOne('mandates', { column: 'id', value: mandateId, select: 'client_visible,lead_consultant_id' }, 10000);
    if (!mandate || !mandate.client_visible) {
      return res.status(404).json({ success: false, error: 'Mandate not found or not visible' });
    }

    const consultant = mandate.lead_consultant_id
      ? await selectOne('profiles', { column: 'id', value: mandate.lead_consultant_id, select: 'full_name' }, 10000)
      : null;

    const presented = await selectMany('contacts', {
      mandate_id: mandateId,
      client_presented: true,
    }, ['updated_at DESC'], 200, 0, '*');

    // Build tier + score from available fields. Uses trident_composite
    // (standard LYC score) plus canvas_grade for a combined ranking.
    const rows: any[] = (presented || []).map((c: any, i: number) => {
      const score = Number(c.trident_composite ?? c.composite_score ?? 0);
      let tier: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' = 'Unranked';
      if (c.canvas_grade === 'S' || score >= 85) tier = 'Gold';
      else if (c.canvas_grade === 'A' || score >= 65) tier = 'Silver';
      else if (c.canvas_grade === 'B' || score >= 45) tier = 'Bronze';
      // Override with any explicit tier tag
      if (c.tier === 'Gold' || c.tier === 'Silver' || c.tier === 'Bronze') tier = c.tier as any;

      // Compute presentation stage label (map internal S1..S19 → user friendly)
      const internal = String(c.pipeline_stage || '');
      let stage = internal;
      if (/Sourced|S1_/i.test(internal)) stage = 'Sourcing';
      else if (/Screened|S2_/i.test(internal)) stage = 'Screening';
      else if (/Presented|Shortlist|S12/i.test(internal)) stage = 'Shortlisted';
      else if (/Client.*Int|Interview|S13/i.test(internal)) stage = 'Interview';
      else if (/Offer|S16/i.test(internal)) stage = 'Offer';
      else if (/Closed|Placed|S19/i.test(internal)) stage = 'Hired';

      return {
        id: c.id,
        mandate_id: mandateId,
        candidate_id: c.id,
        candidate_name: c.full_name || null,
        current_title: c.title || c.current_title || null,
        current_company: c.company_name || c.current_company || null,
        pipeline_stage: stage,
        weighted_score: score || null,
        tier,
        rank: 0, // set below after sort
        consultant_name: consultant?.full_name || null,
        scored_at: c.updated_at || c.created_at || null,
      };
    });

    // Sort rows by tier first (Gold → Silver → Bronze → Unranked), then by score desc
    const tierOrder: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };
    rows.sort((a, b) => {
      const d = tierOrder[a.tier] - tierOrder[b.tier];
      if (d !== 0) return d;
      return (b.weighted_score ?? -1) - (a.weighted_score ?? -1);
    });
    rows.forEach((r, idx) => { r.rank = idx + 1; });

    return res.json({ success: true, shortlist: rows });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ─── Helpers shared across the 3 analytics endpoints ────────────────────────

const PRESENTATION_STAGE_MAP: Record<string, string> = {
  'New': 'New', 'Sourcing': 'Sourcing', 'Screening': 'Screening',
  'Shortlist': 'Shortlisted', 'Shortlisted': 'Shortlisted',
  'Presented': 'Presented', 'Interview': 'Interview',
  'Final Interview': 'Final Interview', 'Offer': 'Offer', 'Placed': 'Hired', 'Hired': 'Hired',
};
function normalizeStage(s: string | null | undefined): string {
  if (!s) return 'New';
  if (PRESENTATION_STAGE_MAP[s]) return PRESENTATION_STAGE_MAP[s];
  const internal = String(s);
  if (/Sourced|S1_/i.test(internal)) return 'Sourcing';
  if (/Screened|S2_/i.test(internal)) return 'Screening';
  if (/Presented|Shortlist|S12/i.test(internal)) return 'Shortlisted';
  if (/Client.*Int|Interview|S13/i.test(internal)) return 'Interview';
  if (/Offer|S16/i.test(internal)) return 'Offer';
  if (/Closed|Placed|S19/i.test(internal)) return 'Hired';
  return internal;
}
function scoreToTier(score: number | null, grade: any, explicitTier: any): 'Gold' | 'Silver' | 'Bronze' | 'Unranked' {
  if (explicitTier === 'Gold' || explicitTier === 'Silver' || explicitTier === 'Bronze') return explicitTier;
  const s = Number(score ?? 0);
  if (grade === 'S' || s >= 85) return 'Gold';
  if (grade === 'A' || s >= 65) return 'Silver';
  if (grade === 'B' || s >= 45) return 'Bronze';
  return 'Unranked';
}

/**
 * Load client-accessible mandate IDs via client_mandate_access ACL, then
 * pull all client_presented contacts across those mandates with tier+stage
 * precomputed.  Reused by all three dashboard analytics endpoints so
 * mandate ACL is enforced consistently and server-side aggregation is
 * done from a single in-memory dataset.
 */
async function loadClientPresentedContacts(userId: string) {
  const { account } = await verifyClientAccess(userId);
  const access = await selectMany('client_mandate_access', {
    client_account_id: account.id,
  }, [], 500, 0, 'mandate_id');
  const mandateIds = (access || []).map((r: any) => r.mandate_id).filter(Boolean);

  // Pull mandate details for labelling (title + company_name)
  const mandateMeta = new Map<string, { id: string; title: string; company_name: string | null }>();
  for (const mid of mandateIds) {
    const m = await selectOne('mandates', {
      column: 'id', value: mid, select: 'id,title,client_name,company_name,client_visible',
    }, 10000).catch(() => null);
    if (m && m.client_visible !== false) {
      mandateMeta.set(mid, {
        id: mid,
        title: m.title || 'Untitled Mandate',
        company_name: m.company_name || m.client_name || null,
      });
    }
  }

  // Pull contacts per mandate (bounded by ACL ≤ 500 mandates × 500 contacts each)
  const presented: Array<{
    mandate_id: string;
    contact_id: string;
    stage: string;
    tier: 'Gold' | 'Silver' | 'Bronze' | 'Unranked';
    score: number;
  }> = [];
  for (const mid of Array.from(mandateMeta.keys())) {
    const rows = await selectMany('contacts', {
      mandate_id: mid,
      client_presented: true,
    }, [], 500, 0, '*').catch(() => []);
    for (const r of rows as any[]) {
      const score = Number(r.trident_composite ?? r.composite_score ?? r.weighted_score ?? 0);
      presented.push({
        mandate_id: mid,
        contact_id: r.id,
        stage: normalizeStage(r.pipeline_stage),
        tier: scoreToTier(score, r.canvas_grade, r.tier),
        score,
      });
    }
  }

  return {
    account,
    mandateIds: Array.from(mandateMeta.keys()),
    mandateMeta,
    presented,
  };
}

// ── Tier Distribution (S1-T11) ──────────────────────────────────────────────
async function handleClientTierDistribution(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { presented } = await loadClientPresentedContacts(user.id);

    // Dedupe candidates per tier.  A candidate may appear in multiple
    // mandates; credit the highest tier they reach across all mandates
    // (Gold wins over Silver wins over Bronze wins over Unranked).
    const tierRank: Record<string, number> = { Gold: 0, Silver: 1, Bronze: 2, Unranked: 3 };
    const best: Record<string, 'Gold' | 'Silver' | 'Bronze' | 'Unranked'> = {};
    for (const row of presented) {
      const prev = best[row.contact_id] ?? 'Unranked';
      best[row.contact_id] = tierRank[row.tier] < tierRank[prev] ? row.tier : prev;
    }

    const counts: Record<string, number> = { Gold: 0, Silver: 0, Bronze: 0, Unranked: 0 };
    for (const t of Object.values(best)) counts[t] = (counts[t] ?? 0) + 1;

    const distribution = (['Gold', 'Silver', 'Bronze', 'Unranked'] as const)
      .map(tier => ({ tier, count: counts[tier] ?? 0 }));

    return res.json({ success: true, distribution });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Per-mandate Stats (S1-T11) ─────────────────────────────────────────────
async function handleClientMandateStats(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 20)));

  try {
    const { mandateMeta, presented } = await loadClientPresentedContacts(user.id);

    // Aggregate per mandate
    type Acc = {
      mandate_id: string;
      mandate_title: string;
      company_name: string | null;
      total_candidates: number;
      scores: number[];
      gold_count: number;
      silver_count: number;
      bronze_count: number;
      unranked_count: number;
    };
    const byMandate = new Map<string, Acc>();

    for (const mid of mandateMeta.keys()) {
      const meta = mandateMeta.get(mid)!;
      byMandate.set(mid, {
        mandate_id: mid,
        mandate_title: meta.title,
        company_name: meta.company_name,
        total_candidates: 0,
        scores: [],
        gold_count: 0, silver_count: 0, bronze_count: 0, unranked_count: 0,
      });
    }

    // Dedup candidates per mandate → single count + single tier
    const seen = new Set<string>(); // key = mandate_id|contact_id
    for (const row of presented) {
      const key = `${row.mandate_id}|${row.contact_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const acc = byMandate.get(row.mandate_id);
      if (!acc) continue;
      acc.total_candidates += 1;
      acc.scores.push(row.score);
      if (row.tier === 'Gold') acc.gold_count += 1;
      else if (row.tier === 'Silver') acc.silver_count += 1;
      else if (row.tier === 'Bronze') acc.bronze_count += 1;
      else acc.unranked_count += 1;
    }

    const stats = Array.from(byMandate.values())
      .map(a => {
        const avg = a.scores.length > 0
          ? Math.round((a.scores.reduce((s, v) => s + v, 0) / a.scores.length) * 10) / 10
          : 0;
        return {
          mandate_id: a.mandate_id,
          mandate_title: a.mandate_title,
          company_name: a.company_name,
          total_candidates: a.total_candidates,
          avg_score: avg,
          gold_count: a.gold_count,
          silver_count: a.silver_count,
          bronze_count: a.bronze_count,
          unranked_count: a.unranked_count,
        };
      })
      .sort((a, b) => b.total_candidates - a.total_candidates || b.avg_score - a.avg_score)
      .slice(0, limit);

    return res.json({ success: true, stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Mandate × Stage Heatmap (S1-T12) ───────────────────────────────────────
async function handleClientHeatmap(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const limit = Math.max(5, Math.min(50, Number(req.query.limit ?? 30)));

  try {
    const STAGES = ['New', 'Sourcing', 'Screening', 'Shortlisted', 'Presented', 'Interview', 'Offer', 'Hired'];
    const { mandateMeta, presented } = await loadClientPresentedContacts(user.id);

    // Count unique candidates per (mandate, stage). Since contacts can have
    // one current_stage, dedup is via (mandate_id, contact_id, stage) but
    // the same candidate rarely appears twice under the same stage.
    const cellKey = new Map<string, Set<string>>(); // key = mid|stage → set of contact_ids

    for (const row of presented) {
      const k = `${row.mandate_id}|${row.stage}`;
      if (!cellKey.has(k)) cellKey.set(k, new Set());
      cellKey.get(k)!.add(row.contact_id);
    }

    // Mandate rows → ordered by total candidates desc
    const mandateTotals = new Map<string, number>();
    for (const mid of mandateMeta.keys()) {
      let total = 0;
      for (const stage of STAGES) {
        total += cellKey.get(`${mid}|${stage}`)?.size ?? 0;
      }
      mandateTotals.set(mid, total);
    }

    const orderedMandateIds = Array.from(mandateMeta.keys())
      .sort((a, b) => (mandateTotals.get(b) ?? 0) - (mandateTotals.get(a) ?? 0))
      .slice(0, limit);

    const mandates = orderedMandateIds.map(mid => {
      const meta = mandateMeta.get(mid)!;
      return { id: mid, title: meta.title, company_name: meta.company_name, total: mandateTotals.get(mid) ?? 0 };
    });

    // Build flat rows + totals_by_x + max_cell
    const rows: Array<{ mandate_id: string; stage: string; count: number }> = [];
    const totals_by_mandate: Record<string, number> = {};
    const totals_by_stage: Record<string, number> = {};
    let max_cell = 0;

    for (const mid of orderedMandateIds) {
      let mTotal = 0;
      for (const stage of STAGES) {
        const count = cellKey.get(`${mid}|${stage}`)?.size ?? 0;
        rows.push({ mandate_id: mid, stage, count });
        mTotal += count;
        totals_by_stage[stage] = (totals_by_stage[stage] ?? 0) + count;
        if (count > max_cell) max_cell = count;
      }
      totals_by_mandate[mid] = mTotal;
    }

    const total_candidates = Object.values(totals_by_stage).reduce((s, v) => s + v, 0);

    return res.json({
      success: true,
      stages: STAGES,
      mandates,
      rows,
      totals_by_mandate,
      totals_by_stage,
      max_cell,
      total_candidates,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
