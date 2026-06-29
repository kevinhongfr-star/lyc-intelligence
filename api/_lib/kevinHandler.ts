/**
 * Kevin's Oversight Dashboard handler — DEX AI Technical Blueprint 05
 *
 * Routes:
 *   GET /api/kevin/oversight                      — Main oversight dashboard
 *   GET /api/kevin/oversight/client/:id           — Drill-down into client view
 *
 * Kevin sees everything: engagement metrics, at-risk mandates, pending feedback
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole } from './adminAuth.js';

export const maxDuration = 30;

export async function handleKevinOversight(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const subResource = pathArr[1];
    const id = pathArr[2];

    if (resource === 'oversight' && req.method === 'GET') {
      if (subResource === 'client' && id) {
        return handleClientDrilldown(req, res, id);
      }
      return handleOversight(req, res);
    }

    return res.status(404).json({ success: false, error: 'Kevin route not found' });
  } catch (err) {
    return handleError(res, 'kevin', err);
  }
}

// ── Verify Admin (Kevin) ────────────────────────────────────────────────
async function verifyAdmin(user: any) {
  const role = await getUserRole(user.id);
  if (role !== 'admin') {
    throw new Error('Admin access required');
  }
}

// ── Oversight Dashboard ─────────────────────────────────────────────────
async function handleOversight(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyAdmin(user);

    const activeMandates = await selectMany('mandates', {
      phase: { operator: 'NOT IN', value: ['close'] },
    }, [], 100, 0, '*');

    const activeClients = await selectMany('client_accounts', { is_active: true }, [], 100, 0, '*');

    const allMandates = await Promise.all(activeMandates.map(async (mandate: any) => {
      const consultant = await selectOne('profiles', {
        column: 'id', value: mandate.lead_consultant_id, select: 'full_name',
      }, 10000);

      const access = await selectMany('client_mandate_access', { mandate_id: mandate.id }, [], 5, 0, '*');
      const clientAccounts = await Promise.all(access.map(async (a: any) => {
        return selectOne('client_accounts', { column: 'id', value: a.client_account_id, select: '*' }, 10000);
      }));

      const contacts = await selectMany('contacts', { mandate_id: mandate.id }, [], 100, 0, 'pipeline_stage');

      const pipelineSummary = {
        sourced: contacts.filter((c: any) => c.pipeline_stage === 'S1_Sourced').length,
        screened: contacts.filter((c: any) => c.pipeline_stage === 'S2_Screened').length,
        shortlisted: contacts.filter((c: any) => c.pipeline_stage === 'S12_Presented_to_Client').length,
        interview: contacts.filter((c: any) => c.pipeline_stage === 'S13_Client_Int_Scheduled').length,
        offer: contacts.filter((c: any) => c.pipeline_stage === 'S16_Offer_Extended').length,
      };

      const feedback = await selectMany('client_feedback', {
        mandate_id: mandate.id, status: 'new',
      }, [], 50, 0, 'id');

      const daysSinceLastActivity = Math.floor((Date.now() - new Date(mandate.updated_at).getTime()) / (1000 * 60 * 60 * 24));

      const riskFlags: string[] = [];
      if (daysSinceLastActivity > 14) {
        riskFlags.push(`No activity in ${daysSinceLastActivity} days`);
      }
      if (feedback.length > 3) {
        riskFlags.push(`${feedback.length} pending feedback items`);
      }

      const engagementScore = Math.max(0, 100 - daysSinceLastActivity * 5);

      return {
        mandate_id: mandate.id,
        mandate_title: mandate.role_title,
        client_name: clientAccounts[0]?.name || 'Unknown',
        client_org: clientAccounts[0]?.organization || 'Unknown',
        consultant_name: consultant?.full_name || 'Unknown',
        pipeline_summary: `S:${pipelineSummary.sourced}→SC:${pipelineSummary.screened}→SH:${pipelineSummary.shortlisted}→I:${pipelineSummary.interview}→O:${pipelineSummary.offer}`,
        days_since_last_client_activity: daysSinceLastActivity,
        open_feedback_count: feedback.length,
        risk_flags: riskFlags,
        client_engagement_score: engagementScore,
      };
    }));

    const atRisk = allMandates.filter(m => m.risk_flags.length > 0);

    const pendingFeedback = await selectMany('client_feedback', { status: 'new' }, ['created_at DESC'], 50, 0, '*');
    const enrichedFeedback = await Promise.all(pendingFeedback.map(async (fb: any) => {
      const mandate = await selectOne('mandates', { column: 'id', value: fb.mandate_id, select: 'role_title' }, 10000);
      const contact = await selectOne('contacts', { column: 'id', value: fb.contact_id, select: 'full_name' }, 10000);
      return {
        mandate_id: fb.mandate_id,
        mandate_title: mandate?.role_title || 'Unknown',
        contact_id: fb.contact_id,
        contact_name: contact?.full_name || 'Unknown',
        presented_date: fb.created_at,
        days_waiting: Math.floor((Date.now() - new Date(fb.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      };
    }));

    return res.json({
      success: true,
      summary: {
        total_active_mandates: activeMandates.length,
        total_active_clients: activeClients.length,
        at_risk_count: atRisk.length,
        pending_feedback_count: pendingFeedback.length,
      },
      mandates: allMandates,
      at_risk: atRisk,
      pending_feedback: enrichedFeedback,
    });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}

// ── Client Drilldown ───────────────────────────────────────────────────
async function handleClientDrilldown(req: VercelRequest, res: VercelResponse, clientAccountId: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    await verifyAdmin(user);

    const clientAccount = await selectOne('client_accounts', {
      column: 'id', value: clientAccountId, select: '*',
    }, 10000);

    if (!clientAccount) {
      return res.status(404).json({ success: false, error: 'Client account not found' });
    }

    const accessRecords = await selectMany('client_mandate_access', {
      client_account_id: clientAccountId,
    }, [], 50, 0, '*');

    const mandates = await Promise.all(accessRecords.map(async (access: any) => {
      const mandate = await selectOne('mandates', {
        column: 'id', value: access.mandate_id, select: '*',
      }, 10000);
      return mandate;
    })).then(m => m.filter(Boolean));

    const notifications = await selectMany('client_notifications', {
      client_account_id: clientAccountId,
    }, ['created_at DESC'], 30, 0, '*');

    const feedback = await selectMany('client_feedback', {
      client_account_id: clientAccountId,
    }, ['created_at DESC'], 30, 0, '*');

    const feedbackResponseTimes = feedback.map((fb: any) => {
      const processed = fb.processed_at ? new Date(fb.processed_at).getTime() : Date.now();
      return (processed - new Date(fb.created_at).getTime()) / (1000 * 60 * 60);
    });

    const avgResponseHours = feedbackResponseTimes.length > 0
      ? Math.round(feedbackResponseTimes.reduce((a: number, b: number) => a + b, 0) / feedbackResponseTimes.length)
      : 0;

    return res.json({
      success: true,
      client: {
        id: clientAccount.id,
        name: clientAccount.name,
        email: clientAccount.email,
        organization: clientAccount.organization,
        is_active: clientAccount.is_active,
        last_login: clientAccount.last_login_at,
      },
      mandates,
      recent_activity: notifications.slice(0, 10).map((n: any) => ({
        date: n.created_at,
        event: n.type,
        details: n.message,
      })),
      engagement_metrics: {
        total_logins: 0,
        last_login: clientAccount.last_login_at,
        feedback_response_avg_hours: avgResponseHours,
        portal_visits_last_30d: 0,
      },
    });
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }
}
