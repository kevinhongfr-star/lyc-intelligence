/**
 * clientPortalHandler — B2B Client Portal API (Phase 8)
 *
 * Routes:
 *   POST   /api/client-portal/invite                     — Internal user invites a client contact
 *   POST   /api/client-portal/accept-invite              — Client accepts invite, sets password
 *   POST   /api/client-portal/magic-link                 — Request magic link for passwordless login
 *   GET    /api/client-portal/profile                    — Get client's own profile
 *   PATCH  /api/client-portal/profile                    — Update client profile
 *   GET    /api/client-portal/mandate-access             — List mandates client has access to
 *   GET    /api/client-portal/mandates                   — List client's mandates with summary
 *   GET    /api/client-portal/mandates/:id               — Mandate detail (overview + health)
 *   GET    /api/client-portal/mandates/:id/pipeline      — Pipeline stage breakdown
 *   GET    /api/client-portal/mandates/:id/activity      — Activity feed
 *   GET    /api/client-portal/candidates/:id            — Candidate detail (client-scoped)
 *   GET    /api/client-portal/mandates/:id/shortlist     — Shortlisted candidates
 *   POST   /api/client-portal/candidates/:id/feedback   — Submit shortlist feedback
 *   POST   /api/client-portal/mandates/:id/approve      — Approve / request changes to shortlist
 *   GET    /api/client-portal/interviews                 — List client interviews
 *   GET    /api/client-portal/interviews/:id            — Interview detail
 *   POST   /api/client-portal/interviews/:id/feedback   — Submit interview feedback
 *   POST   /api/client-portal/interviews/:id/confirm    — Confirm interview time
 *   GET    /api/client-portal/documents                  — List shared documents
 *   GET    /api/client-portal/documents/:id              — Document metadata + download
 *   GET    /api/client-portal/notifications             — List in-app notifications
 *   POST   /api/client-portal/notifications/:id/read     — Mark as read
 *   POST   /api/client-portal/notifications/read-all    — Mark all as read
 *   GET    /api/client-portal/preferences                — Get notification preferences
 *   PATCH  /api/client-portal/preferences                — Update preferences
 *   GET    /api/client-portal/billing                    — Billing overview
 *   GET    /api/client-portal/invoices                  — Invoice history
 *   GET    /api/client-portal/team                       — Client contacts
 *   POST   /api/client-portal/team/invite               — Invite new client contact
 *   PATCH  /api/client-portal/team/:id/role             — Change contact role
 *
 * Security: Clients see ONLY data scoped by client_mandate_access ACL.
 * Internal columns (TRIDENT scores, recruiter comments) are never leaked.
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

// ── Types ───────────────────────────────────────────────────────────────

export type ClientRole = 'client_owner' | 'client_interviewer' | 'client_viewer';

export interface ClientAccount {
  id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  company_name: string | null;
  is_active: boolean;
  access_expires: string | null;
}

export interface MandateAccess {
  id: string;
  client_account_id: string;
  mandate_id: string;
  role: ClientRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface ShortlistFeedback {
  id: string;
  client_mandate_access_id: string;
  candidate_id: string;
  mandate_id: string;
  decision: 'interested' | 'not_interested' | 'want_to_interview';
  comments: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  submitted_at: string;
}

// ── Main handler ────────────────────────────────────────────────────────

export async function handleClientPortal(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    // ── Auth & Onboarding ──────────────────────────────────────────
    if (resource === 'invite' && req.method === 'POST') return handleInvite(req, res);
    if (resource === 'accept-invite' && req.method === 'POST') return handleAcceptInvite(req, res);
    if (resource === 'magic-link' && req.method === 'POST') return handleMagicLink(req, res);
    if (resource === 'profile' && req.method === 'GET') return handleGetProfile(req, res);
    if (resource === 'profile' && req.method === 'PATCH') return handleUpdateProfile(req, res);
    if (resource === 'mandate-access' && req.method === 'GET') return handleMandateAccess(req, res);

    // ── Mandates & Pipeline ────────────────────────────────────────
    if (resource === 'mandates' && !id && req.method === 'GET') return handleListMandates(req, res);
    if (resource === 'mandates' && id && !subResource && req.method === 'GET') return handleGetMandate(req, res, id);
    if (resource === 'mandates' && id && subResource === 'pipeline' && req.method === 'GET') return handlePipeline(req, res, id);
    if (resource === 'mandates' && id && subResource === 'activity' && req.method === 'GET') return handleActivity(req, res, id);
    if (resource === 'candidates' && id && !subResource && req.method === 'GET') return handleGetCandidate(req, res, id);

    // ── Shortlist & Feedback ────────────────────────────────────────
    if (resource === 'mandates' && id && subResource === 'shortlist' && req.method === 'GET') return handleGetShortlist(req, res, id);
    if (resource === 'candidates' && id && subResource === 'feedback' && req.method === 'POST') return handleSubmitFeedback(req, res, id);
    if (resource === 'mandates' && id && subResource === 'approve' && req.method === 'POST') return handleApproveShortlist(req, res, id);

    // ── Interviews ─────────────────────────────────────────────────
    if (resource === 'interviews' && !id && req.method === 'GET') return handleListInterviews(req, res);
    if (resource === 'interviews' && id && !subResource && req.method === 'GET') return handleGetInterview(req, res, id);
    if (resource === 'interviews' && id && subResource === 'feedback' && req.method === 'POST') return handleInterviewFeedback(req, res, id);
    if (resource === 'interviews' && id && subResource === 'confirm' && req.method === 'POST') return handleConfirmInterview(req, res, id);

    // ── Documents ──────────────────────────────────────────────────
    if (resource === 'documents' && !id && req.method === 'GET') return handleListDocuments(req, res);
    if (resource === 'documents' && id && req.method === 'GET') return handleGetDocument(req, res, id);

    // ── Notifications ──────────────────────────────────────────────
    if (resource === 'notifications' && !id && req.method === 'GET') return handleListNotifications(req, res);
    if (resource === 'notifications' && id && req.method === 'POST') return handleMarkNotificationRead(req, res, id);
    if (resource === 'notifications' && subResource === 'read-all' && req.method === 'POST') return handleMarkAllRead(req, res);

    // ── Preferences ────────────────────────────────────────────────
    if (resource === 'preferences' && req.method === 'GET') return handleGetPreferences(req, res);
    if (resource === 'preferences' && req.method === 'PATCH') return handleUpdatePreferences(req, res);

    // ── Billing & Account ──────────────────────────────────────────
    if (resource === 'billing' && req.method === 'GET') return handleGetBilling(req, res);
    if (resource === 'invoices' && req.method === 'GET') return handleListInvoices(req, res);
    if (resource === 'team' && !id && req.method === 'GET') return handleListTeam(req, res);
    if (resource === 'team' && subResource === 'invite' && req.method === 'POST') return handleInviteTeamMember(req, res);
    if (resource === 'team' && id && subResource === 'role' && req.method === 'PATCH') return handleChangeRole(req, res, id);

    return res.status(404).json({ success: false, error: 'Client portal route not found' });
  } catch (err) {
    return handleError(res, 'client-portal', err);
  }
}

// ── Auth helpers ────────────────────────────────────────────────────────

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
    return { account, access: access as MandateAccess };
  }

  return { account };
}

async function verifyInternal(user: any) {
  const role = await getUserRole(user.id);
  if (!['admin', 'lyc_admin', 'super_admin', 'lyc_consultant', 'team_lead'].includes(role)) {
    throw new Error('Internal access required');
  }
}

// ── Auth & Onboarding handlers ──────────────────────────────────────────

async function handleInvite(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyInternal(user);
    const { email, name, company_name, mandate_ids, role = 'client_viewer' } = req.body || {};

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'email and name are required' });
    }

    let clientAccount = await selectOne('client_accounts', {
      column: 'email', value: email, select: '*',
    }, 10000);

    if (!clientAccount) {
      clientAccount = await insert('client_accounts', {
        email, name, company_name, is_active: true,
      });
    }

    if (Array.isArray(mandate_ids)) {
      for (const mandateId of mandate_ids) {
        const existing = await selectOne('client_mandate_access', {
          column: 'client_account_id', value: clientAccount.id, select: '*',
        }, 5000);
        if (!existing || existing.mandate_id !== mandateId) {
          await insert('client_mandate_access', {
            client_account_id: clientAccount.id,
            mandate_id: mandateId,
            role,
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            accepted_at: null,
          });
        }
      }
    }

    return res.json({ success: true, client_account: clientAccount });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleAcceptInvite(req: VercelRequest, res: VercelResponse) {
  const { token, password } = req.body || {};
  if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

  try {
    const invite = await selectOne('client_invites', {
      column: 'token', value: token, select: '*',
    }, 5000);

    if (!invite) return res.status(404).json({ success: false, error: 'Invalid invite' });
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Invite expired' });
    }

    await update('client_mandate_access', invite.access_id, {
      accepted_at: new Date().toISOString(),
    });

    if (password) {
      await update('client_accounts', invite.client_account_id, {
        is_active: true,
      });
    }

    return res.json({ success: true, client_account_id: invite.client_account_id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleMagicLink(req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  try {
    const account = await selectOne('client_accounts', {
      column: 'email', value: email, select: '*',
    }, 5000);

    if (!account) {
      return res.status(404).json({ success: false, error: 'No client account found' });
    }

    return res.json({ success: true, message: 'Magic link sent', client_id: account.id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetProfile(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    return res.json({ success: true, profile: account });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleUpdateProfile(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const { name, title, timezone, notification_preferences } = req.body || {};

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (title !== undefined) updateData.title = title;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (notification_preferences !== undefined) updateData.notification_preferences = JSON.stringify(notification_preferences);

    const updated = await update('client_accounts', account.id, updateData);
    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleMandateAccess(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const records = await selectMany('client_mandate_access', {
      client_account_id: account.id,
    }, ['created_at DESC'], 100, 0, '*');

    const enriched = await Promise.all(records.map(async (r: any) => {
      const mandate = await selectOne('mandates', {
        column: 'id', value: r.mandate_id, select: 'id,title,phase,client_visible',
      }, 5000);
      return { ...r, mandate_title: mandate?.title || 'Unknown', mandate_status: mandate?.phase };
    }));

    return res.json({ success: true, mandate_access: enriched });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Mandates & Pipeline handlers ────────────────────────────────────────

async function handleListMandates(req: VercelRequest, res: VercelResponse) {
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
      }, 5000);

      const contacts = await selectMany('contacts', { mandate_id: mandate.id }, [], 500, 0, 'pipeline_stage');
      const pipelineSummary = {
        sourced: contacts.filter((c: any) => c.pipeline_stage === 'S1_Sourced').length,
        screened: contacts.filter((c: any) => c.pipeline_stage === 'S2_Screened').length,
        shortlisted: contacts.filter((c: any) => c.pipeline_stage === 'S12_Presented_to_Client').length,
        interview: contacts.filter((c: any) => c.pipeline_stage === 'S13_Client_Int_Scheduled').length,
        offer: contacts.filter((c: any) => c.pipeline_stage === 'S16_Offer_Extended').length,
        placed: contacts.filter((c: any) => c.pipeline_stage === 'S19_Closed').length,
      };

      return {
        id: mandate.id,
        title: mandate.role_title || mandate.title,
        status: mandate.phase === 'close' ? 'Completed' : mandate.phase === 'paused' ? 'On Hold' : 'Active',
        health: computeHealthIndicator(mandate, pipelineSummary),
        lead_consultant_name: consultant?.full_name || 'Unknown',
        days_since_kickoff: Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        pipeline_summary: pipelineSummary,
        last_activity_at: mandate.updated_at,
        role: access.role,
      };
    }));

    return res.json({ success: true, mandates: mandates.filter(Boolean) });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleGetMandate(req: VercelRequest, res: VercelResponse, id: string) {
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
    }, 5000);

    return res.json({
      success: true,
      mandate: {
        id: mandate.id,
        title: mandate.role_title,
        client_summary: mandate.client_summary,
        status: mandate.phase,
        lead_consultant_name: consultant?.full_name || 'Unknown',
        target_close_date: mandate.target_close_date,
        created_at: mandate.created_at,
        health: 'on_track',
      },
    });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handlePipeline(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id, id);
    const contacts = await selectMany('contacts', { mandate_id: id }, [], 500, 0, 'pipeline_stage');

    const stageLabels: Record<string, string> = {
      'S1_Sourced': 'Sourcing',
      'S2_Screened': 'Screening',
      'S12_Presented_to_Client': 'Shortlisted',
      'S13_Client_Int_Scheduled': 'Interview',
      'S16_Offer_Extended': 'Offer',
      'S19_Closed': 'Placed',
    };

    const counts: Record<string, number> = {};
    for (const c of contacts) {
      const stage = (c as any).pipeline_stage;
      const label = stageLabels[stage] || stage || 'New';
      counts[label] = (counts[label] || 0) + 1;
    }

    const stages = Object.entries(counts).map(([label, count]) => ({
      label,
      count,
    }));

    return res.json({ success: true, stages });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleActivity(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id, id);
    const [feedback, interviews, documents] = await Promise.all([
      selectMany('client_feedback', { mandate_id: id }, ['created_at DESC'], 20, 0, '*').catch(() => []),
      selectMany('interviews', { mandate_id: id }, ['created_at DESC'], 20, 0, '*').catch(() => []),
      selectMany('document_shares', { target_id: id }, ['created_at DESC'], 20, 0, '*').catch(() => []),
    ]);

    const activity = [
      ...feedback.map((f: any) => ({
        type: 'feedback',
        description: `Feedback submitted: ${f.feedback_type}`,
        created_at: f.created_at,
      })),
      ...interviews.map((i: any) => ({
        type: 'interview',
        description: `Interview scheduled: ${i.candidate_name || 'Unknown'}`,
        created_at: i.created_at,
      })),
      ...documents.map((d: any) => ({
        type: 'document',
        description: `Document shared: ${d.file_name || 'Unknown'}`,
        created_at: d.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ success: true, activity: activity.slice(0, 30) });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleGetCandidate(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const contact = await selectOne('contacts', {
      column: 'id', value: id, select: '*',
    }, 10000);

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const accessRecords = await selectMany('client_mandate_access', {
      client_account_id: account.id,
    }, [], 50, 0, 'mandate_id');
    const allowedMandateIds = accessRecords.map((r: any) => r.mandate_id);

    if (!allowedMandateIds.includes(contact.mandate_id)) {
      return res.status(403).json({ success: false, error: 'No access to this candidate' });
    }

    if (!contact.client_presented) {
      return res.status(403).json({ success: false, error: 'Candidate not presented to client' });
    }

    const canvas = await selectOne('canvas_profiles', {
      column: 'contact_id', value: id, select: 'pdf_url, review_status',
    }, 5000);

    return res.json({
      success: true,
      candidate: {
        id: contact.id,
        full_name: contact.full_name,
        title: contact.title,
        company_name: contact.company_name,
        tier: scoreToTier(contact.trident_composite, contact.canvas_grade, contact.tier),
        pipeline_stage: contact.pipeline_stage,
        summary: contact.client_summary || '',
        one_pager_url: canvas?.review_status === 'approved' ? canvas.pdf_url : null,
      },
    });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Shortlist & Feedback handlers ───────────────────────────────────────

async function handleGetShortlist(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id, id);
    const presented = await selectMany('contacts', {
      mandate_id: id, client_presented: true,
    }, ['updated_at DESC'], 200, 0, '*');

    const rows = presented.map((c: any) => {
      const score = Number(c.trident_composite ?? c.composite_score ?? 0);
      let tier: 'Gold' | 'Silver' | 'Bronze' | 'Unranked' = scoreToTier(score, c.canvas_grade, c.tier);
      return {
        id: c.id,
        candidate_name: c.full_name,
        current_title: c.title,
        current_company: c.company_name,
        tier,
        score,
        pipeline_stage: c.pipeline_stage,
      };
    });

    return res.json({ success: true, shortlist: rows });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleSubmitFeedback(req: VercelRequest, res: VercelResponse, candidateId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { mandate_id, decision, comments, strengths, concerns } = req.body || {};

  if (!mandate_id || !decision) {
    return res.status(400).json({ success: false, error: 'mandate_id and decision are required' });
  }

  if (!['interested', 'not_interested', 'want_to_interview'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'Invalid decision value' });
  }

  try {
    const { account, access } = await verifyClientAccess(user.id, mandate_id);

    const feedback = await insert('client_shortlist_feedback', {
      client_mandate_access_id: access.id,
      candidate_id: candidateId,
      mandate_id,
      decision,
      comments: comments || null,
      strengths: strengths || null,
      concerns: concerns || null,
      submitted_at: new Date().toISOString(),
    });

    if (decision === 'interested' || decision === 'want_to_interview') {
      await update('contacts', candidateId, { pipeline_stage: 'S13_Client_Int_Scheduled' });
    }

    return res.json({ success: true, feedback });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

async function handleApproveShortlist(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { action, comments } = req.body || {};

  if (!action || !['approve', 'request_changes'].includes(action)) {
    return res.status(400).json({ success: false, error: 'action (approve or request_changes) is required' });
  }

  try {
    const { account, access } = await verifyClientAccess(user.id, id);
    if (access.role !== 'client_owner') {
      return res.status(403).json({ success: false, error: 'Only client owners can approve shortlists' });
    }

    const approval = await insert('shortlist_approvals', {
      mandate_id: id,
      client_mandate_access_id: access.id,
      action,
      comments: comments || null,
      approved_at: new Date().toISOString(),
    });

    return res.json({ success: true, approval });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Interview handlers ─────────────────────────────────────────────────

async function handleListInterviews(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const assignments = await selectMany('client_interview_assignments', {
      client_account_id: account.id,
    }, ['scheduled_at DESC'], 50, 0, '*');

    const enriched = await Promise.all(assignments.map(async (a: any) => {
      const contact = await selectOne('contacts', {
        column: 'id', value: a.candidate_id, select: 'full_name,title,company_name',
      }, 5000);
      return { ...a, candidate_name: contact?.full_name, candidate_title: contact?.title };
    }));

    return res.json({ success: true, interviews: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetInterview(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const assignment = await selectOne('client_interview_assignments', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!assignment || assignment.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    return res.json({ success: true, interview: assignment });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleInterviewFeedback(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { rating, strengths, concerns, hire_recommendation, notes } = req.body || {};

  if (!rating || !hire_recommendation) {
    return res.status(400).json({ success: false, error: 'rating and hire_recommendation are required' });
  }

  try {
    const { account } = await verifyClientAccess(user.id);
    const assignment = await selectOne('client_interview_assignments', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!assignment || assignment.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const feedback = await insert('interview_feedback', {
      interview_assignment_id: id,
      client_account_id: account.id,
      rating,
      strengths: strengths || null,
      concerns: concerns || null,
      hire_recommendation,
      notes: notes || null,
      submitted_at: new Date().toISOString(),
    });

    await update('client_interview_assignments', id, { feedback_submitted: true });

    return res.json({ success: true, feedback });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleConfirmInterview(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { proposed_time } = req.body || {};

  try {
    const { account } = await verifyClientAccess(user.id);
    const assignment = await selectOne('client_interview_assignments', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!assignment || assignment.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Interview not found' });
    }

    const updateData: Record<string, any> = { status: 'confirmed' };
    if (proposed_time) updateData.scheduled_at = proposed_time;

    const updated = await update('client_interview_assignments', id, updateData);
    return res.json({ success: true, interview: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Document handlers ───────────────────────────────────────────────────

async function handleListDocuments(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const { mandate_id, doc_type } = req.query as Record<string, string>;

    const where: Record<string, any> = { target_type: 'client', target_id: account.id };
    if (mandate_id) where.mandate_id = mandate_id;
    if (doc_type) where.doc_type = doc_type;

    const docs = await selectMany('document_shares', where, ['created_at DESC'], 100, 0, '*');
    return res.json({ success: true, documents: docs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetDocument(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const doc = await selectOne('document_shares', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!doc || doc.target_type !== 'client' || doc.target_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    return res.json({ success: true, document: doc });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Notification handlers ───────────────────────────────────────────────

async function handleListNotifications(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const notifications = await selectMany('client_notifications', {
      client_account_id: account.id,
    }, ['created_at DESC'], 50, 0, '*');

    const unreadCount = notifications.filter((n: any) => !n.read_at).length;
    return res.json({ success: true, notifications, unread_count: unreadCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleMarkNotificationRead(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const notification = await selectOne('client_notifications', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!notification || notification.client_account_id !== account.id) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await update('client_notifications', id, { read_at: new Date().toISOString() });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleMarkAllRead(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const notifications = await selectMany('client_notifications', {
      client_account_id: account.id, read_at: null,
    }, [], 200, 0, 'id');

    for (const n of notifications) {
      await update('client_notifications', n.id, { read_at: new Date().toISOString() });
    }

    return res.json({ success: true, marked_count: notifications.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Preferences handlers ────────────────────────────────────────────────

async function handleGetPreferences(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    return res.json({
      success: true,
      preferences: {
        notification_preferences: account.notification_preferences || {},
        timezone: account.timezone || 'UTC',
        language: 'en',
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleUpdatePreferences(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const { notification_preferences, timezone } = req.body || {};

    const updateData: Record<string, any> = {};
    if (notification_preferences !== undefined) updateData.notification_preferences = JSON.stringify(notification_preferences);
    if (timezone !== undefined) updateData.timezone = timezone;

    const updated = await update('client_accounts', account.id, updateData);
    return res.json({ success: true, preferences: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Billing & Account handlers ──────────────────────────────────────────

async function handleGetBilling(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account, access } = await verifyClientAccess(user.id);
    if (access.role !== 'client_owner') {
      return res.status(403).json({ success: false, error: 'Only client owners can view billing' });
    }

    const mandates = await selectMany('mandates', { client_id: account.id }, [], 50, 0, 'id,title,phase');
    return res.json({ success: true, mandates });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleListInvoices(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const invoices = await selectMany('invoices', { client_id: account.id }, ['created_at DESC'], 50, 0, '*');
    return res.json({ success: true, invoices });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleListTeam(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const { account } = await verifyClientAccess(user.id);
    const mandates = await selectMany('client_mandate_access', {
      client_account_id: account.id,
    }, [], 50, 0, 'mandate_id');
    const mandateIds = mandates.map((m: any) => m.mandate_id);

    const teamMembers = await selectMany('client_mandate_access', {
      mandate_id: mandateIds[0] || '',
    }, [], 50, 0, '*').catch(() => []);

    return res.json({ success: true, team: teamMembers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleInviteTeamMember(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { email, name, role, mandate_ids } = req.body || {};
  if (!email || !name || !role) {
    return res.status(400).json({ success: false, error: 'email, name, and role are required' });
  }

  try {
    const { account, access } = await verifyClientAccess(user.id);
    if (access.role !== 'client_owner') {
      return res.status(403).json({ success: false, error: 'Only client owners can invite team members' });
    }

    let newAccount = await selectOne('client_accounts', {
      column: 'email', value: email, select: '*',
    }, 5000);

    if (!newAccount) {
      newAccount = await insert('client_accounts', {
        email, name, is_active: true,
      });
    }

    const mandatesToAdd = mandate_ids || [access.mandate_id];
    for (const mid of mandatesToAdd) {
      await insert('client_mandate_access', {
        client_account_id: newAccount.id,
        mandate_id: mid,
        role,
        invited_by: account.id,
        invited_at: new Date().toISOString(),
        accepted_at: null,
      });
    }

    return res.json({ success: true, client_account: newAccount });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleChangeRole(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { role } = req.body || {};
  if (!role || !['client_owner', 'client_interviewer', 'client_viewer'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Valid role is required' });
  }

  try {
    const { account, access } = await verifyClientAccess(user.id);
    if (access.role !== 'client_owner') {
      return res.status(403).json({ success: false, error: 'Only client owners can change roles' });
    }

    const updated = await update('client_mandate_access', id, { role });
    return res.json({ success: true, access: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Utility functions ───────────────────────────────────────────────────

export function computeHealthIndicator(mandate: any, pipelineSummary: Record<string, number>): 'on_track' | 'at_risk' | 'behind' {
  const totalCandidates = Object.values(pipelineSummary).reduce((a, b) => a + b, 0);
  const daysSinceKickoff = mandate.created_at
    ? Math.floor((Date.now() - new Date(mandate.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (totalCandidates === 0 && daysSinceKickoff > 14) return 'at_risk';
  if (pipelineSummary.shortlisted === 0 && daysSinceKickoff > 30) return 'at_risk';
  if (pipelineSummary.interview > 0 && pipelineSummary.offer === 0 && daysSinceKickoff > 60) return 'behind';
  return 'on_track';
}

function scoreToTier(score: number | null, grade: any, explicitTier: any): 'Gold' | 'Silver' | 'Bronze' | 'Unranked' {
  if (explicitTier === 'Gold' || explicitTier === 'Silver' || explicitTier === 'Bronze') return explicitTier;
  const s = Number(score ?? 0);
  if (grade === 'S' || s >= 85) return 'Gold';
  if (grade === 'A' || s >= 65) return 'Silver';
  if (grade === 'B' || s >= 45) return 'Bronze';
  return 'Unranked';
}