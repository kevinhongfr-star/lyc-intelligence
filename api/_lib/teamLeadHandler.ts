/**
 * api/_lib/teamLeadHandler.ts
 * Team Lead Portal backend
 *
 * Routes:
 *   GET  /api/team-lead/dashboard          → aggregate stats, team, pending, SLA
 *   GET  /api/team-lead/team               → team members with utilization
 *   GET  /api/team-lead/approvals          → pending approvals list
 *   GET  /api/team-lead/approvals/:id      → single approval detail
 *   POST /api/team-lead/approvals/:id/decide → approve / reject
 *   GET  /api/team-lead/mandates           → mandate portfolio
 *   GET  /api/team-lead/sla                → SLA status for all mandates
 *   GET  /api/team-lead/revenue            → revenue dashboard
 *   GET  /api/team-lead/clients            → client overview
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const id = pathArr[1] || '';
  const subResource = pathArr[2] || '';
  const method = req.method || 'GET';
  const user = (req as any).__authenticatedUser;

  try {
    const org_id = user?.organization_id || req.query.org_id;

    // ── Dashboard ──
    if (resource === 'dashboard' && method === 'GET') {
      return handleDashboard(req, res, org_id);
    }

    // ── Team ──
    if (resource === 'team' && method === 'GET') {
      return handleTeam(req, res, org_id);
    }

    // ── Approvals ──
    if (resource === 'approvals') {
      if (method === 'GET' && !id) return handleApprovalsList(req, res, org_id);
      if (method === 'GET' && id && subResource === '') return handleApprovalDetail(req, res, id);
      if (method === 'POST' && id && subResource === 'decide') return handleApprovalDecide(req, res, id, user);
    }

    // ── Mandates ──
    if (resource === 'mandates' && method === 'GET') {
      return handleMandates(req, res, org_id);
    }

    // ── SLA ──
    if (resource === 'sla' && method === 'GET') {
      return handleSLA(req, res, org_id);
    }

    // ── Revenue ──
    if (resource === 'revenue' && method === 'GET') {
      return handleRevenue(req, res, org_id);
    }

    // ── Clients ──
    if (resource === 'clients' && method === 'GET') {
      return handleClients(req, res, org_id);
    }

    return res.status(404).json({ error: `Team Lead route not found: /api/team-lead/${resource}` });
  } catch (err: any) {
    console.error('[teamLeadHandler]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}

// ─── Dashboard ───────────────────────────────────────────────
async function handleDashboard(req: VercelRequest, res: VercelResponse, org_id: string) {
  try {
    // Parallel fetch all dashboard data
    const [mandates, approvals, teamMembers] = await Promise.all([
      // Active mandates
      org_id
        ? db.selectMany('mandates', {
            select: 'id,title,status,target_fill_date,deadline_date,fee_percentage',
            where: [
              { column: 'org_id', value: org_id },
              { column: 'status', value: 'active' },
            ],
          })
        : Promise.resolve([]),
      // Pending approvals
      org_id
        ? db.selectMany('tl_approvals', {
            select: 'id,title,requester_name,type,status,submitted_at',
            where: [
              { column: 'org_id', value: org_id },
              { column: 'status', value: 'pending' },
            ],
            orderBy: { column: 'submitted_at', ascending: false },
            limit: 10,
          })
        : Promise.resolve([]),
      // Team members with mandate counts
      org_id
        ? db.selectMany('org_memberships', {
            select: 'id,user_id,role',
            where: [
              { column: 'org_id', value: org_id },
              { column: 'status', value: 'active' },
            ],
          })
        : Promise.resolve([]),
    ]);

    // Calculate SLA compliance
    const now = new Date();
    let slaCompliant = 0;
    let slaTotal = mandates.length;
    const slaItems: Array<{ mandate: string; status: string; remaining_days: number }> = [];

    for (const m of mandates as any[]) {
      const deadline = m.deadline_date || m.target_fill_date;
      if (deadline) {
        const daysLeft = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const status = daysLeft < 0 ? 'breached' : daysLeft <= 7 ? 'at_risk' : 'healthy';
        if (status !== 'breached') slaCompliant++;
        slaItems.push({
          mandate: m.title || 'Untitled',
          status,
          remaining_days: daysLeft,
        });
      }
    }

    const slaCompliance = slaTotal > 0 ? (slaCompliant / slaTotal) * 100 : 100;

    // Calculate team utilization (mandates per member)
    const teamWithMandates: Array<{ id: string; name: string; utilization: number; mandates: number }> = [];
    for (const member of teamMembers as any[]) {
      // Count mandates assigned to this user
      let mandateCount = 0;
      try {
        mandateCount = await db.countRows('mandate_candidates', {
          where: [{ column: 'consultant_id', value: member.user_id }],
        });
      } catch {
        mandateCount = 0;
      }
      const utilization = Math.min(Math.round((mandateCount / 5) * 100), 150);
      teamWithMandates.push({
        id: member.user_id || member.id,
        name: member.role || 'Consultant',
        utilization,
        mandates: mandateCount,
      });
    }

    const teamUtilization = teamWithMandates.length > 0
      ? teamWithMandates.reduce((sum, t) => sum + t.utilization, 0) / teamWithMandates.length
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        active_mandates: mandates.length,
        pending_approvals: approvals.length,
        sla_compliance: Math.round(slaCompliance),
        team_utilization: Math.round(teamUtilization),
        team: teamWithMandates,
        pending: (approvals as any[]).map((a) => ({
          id: a.id,
          title: a.title,
          requester: a.requester_name || 'Unknown',
          type: a.type || 'general',
        })),
        sla: slaItems.sort((a, b) => a.remaining_days - b.remaining_days),
      },
    });
  } catch (err: any) {
    // Graceful fallback — return empty dashboard instead of crashing
    console.error('[teamLeadHandler/dashboard]', err);
    return res.status(200).json({
      success: true,
      data: {
        active_mandates: 0,
        pending_approvals: 0,
        sla_compliance: 100,
        team_utilization: 0,
        team: [],
        pending: [],
        sla: [],
      },
    });
  }
}

// ─── Team ────────────────────────────────────────────────────
async function handleTeam(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const members = await db.selectMany('org_memberships', {
    select: 'id,user_id,role,status',
    where: [
      { column: 'org_id', value: org_id },
      { column: 'status', value: 'active' },
    ],
  });

  const team: any[] = [];
  for (const m of members as any[]) {
    let mandateCount = 0;
    try {
      mandateCount = await db.countRows('mandates', {
        where: [
          { column: 'org_id', value: org_id },
          { column: 'created_by', value: m.user_id },
          { column: 'status', value: 'active' },
        ],
      });
    } catch {}

    team.push({
      id: m.user_id || m.id,
      name: m.role || 'Consultant',
      role: m.role,
      mandates: mandateCount,
      utilization: Math.min(Math.round((mandateCount / 5) * 100), 150),
    });
  }

  return res.status(200).json({ success: true, team });
}

// ─── Approvals List ──────────────────────────────────────────
async function handleApprovalsList(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const { status, type, limit = '50' } = req.query as Record<string, string>;
  const filters: any[] = [{ column: 'org_id', value: org_id }];
  if (status) filters.push({ column: 'status', value: status });
  if (type) filters.push({ column: 'type', value: type });

  const rows = await db.selectMany('tl_approvals', {
    select: '*',
    where: filters,
    orderBy: { column: 'submitted_at', ascending: false },
    limit: parseInt(limit),
  });

  return res.status(200).json({ success: true, approvals: rows });
}

// ─── Approval Detail ─────────────────────────────────────────
async function handleApprovalDetail(req: VercelRequest, res: VercelResponse, id: string) {
  const approval = await db.selectOne('tl_approvals', {
    select: '*',
    where: [{ column: 'id', value: id }],
  });

  if (!approval) return res.status(404).json({ error: 'Approval not found' });
  return res.status(200).json({ success: true, approval });
}

// ─── Approval Decision ───────────────────────────────────────
async function handleApprovalDecide(req: VercelRequest, res: VercelResponse, id: string, user: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { decision, note } = req.body || {};
  if (!decision || !['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }

  const result = await db.update('tl_approvals', {
    status: decision,
    decided_by: user?.id || null,
    decided_at: new Date().toISOString(),
    decision_note: note || null,
    updated_at: new Date().toISOString(),
  }, id);

  return res.status(200).json({ success: true, approval: result });
}

// ─── Mandates Portfolio ──────────────────────────────────────
async function handleMandates(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const { status, team, limit = '100' } = req.query as Record<string, string>;
  const filters: any[] = [{ column: 'org_id', value: org_id }];
  if (status) filters.push({ column: 'status', value: status });

  const rows = await db.selectMany('mandates', {
    select: 'id,title,status,company_id,created_by,target_fill_date,deadline_date,fee_percentage,fee_min,priority',
    where: filters,
    orderBy: { column: 'updated_at', ascending: false },
    limit: parseInt(limit),
  });

  // Enrich with SLA info
  const now = new Date();
  const enriched = (rows as any[]).map((m) => {
    const deadline = m.deadline_date || m.target_fill_date;
    const daysRemaining = deadline
      ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const slaStatus = daysRemaining === null ? 'on_track'
      : daysRemaining < 0 ? 'breached'
      : daysRemaining <= 7 ? 'at_risk'
      : 'on_track';

    return {
      ...m,
      days_remaining: daysRemaining,
      sla_status: slaStatus,
    };
  });

  return res.status(200).json({ success: true, mandates: enriched });
}

// ─── SLA Dashboard ───────────────────────────────────────────
async function handleSLA(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const mandates = await db.selectMany('mandates', {
    select: 'id,title,status,target_fill_date,deadline_date,priority',
    where: [
      { column: 'org_id', value: org_id },
      { column: 'status', value: 'active' },
    ],
    orderBy: { column: 'deadline_date', ascending: true },
  });

  const now = new Date();
  let compliant = 0;
  const items = (mandates as any[]).map((m) => {
    const deadline = m.deadline_date || m.target_fill_date;
    const daysRemaining = deadline
      ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    const status = daysRemaining < 0 ? 'breached' : daysRemaining <= 7 ? 'at_risk' : 'on_track';
    if (status !== 'breached') compliant++;

    return {
      id: m.id,
      mandate: m.title,
      status,
      remaining_days: daysRemaining,
      priority: m.priority,
    };
  });

  const total = items.length;
  return res.status(200).json({
    success: true,
    sla: items,
    summary: {
      total,
      compliant,
      compliance_rate: total > 0 ? Math.round((compliant / total) * 100) : 100,
      breached: items.filter(i => i.status === 'breached').length,
      at_risk: items.filter(i => i.status === 'at_risk').length,
    },
  });
}

// ─── Revenue Dashboard ───────────────────────────────────────
async function handleRevenue(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  // Aggregate fees from mandates
  const mandates = await db.selectMany('mandates', {
    select: 'id,title,status,fee_percentage,fee_min,salary_min,salary_max',
    where: [{ column: 'org_id', value: org_id }],
  });

  let totalPipelineValue = 0;
  let totalCollected = 0;
  const byStatus: Record<string, number> = {};

  for (const m of mandates as any[]) {
    const estimatedFee = m.fee_min || ((m.salary_max || m.salary_min || 100000) * (m.fee_percentage || 20) / 100);
    totalPipelineValue += estimatedFee;

    if (m.status === 'filled' || m.status === 'completed') {
      totalCollected += estimatedFee;
    }

    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
  }

  return res.status(200).json({
    success: true,
    revenue: {
      total_pipeline_value: totalPipelineValue,
      total_collected: totalCollected,
      by_status: byStatus,
      mandate_count: mandates.length,
    },
  });
}

// ─── Client Overview ─────────────────────────────────────────
async function handleClients(req: VercelRequest, res: VercelResponse, org_id: string) {
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const companies = await db.selectMany('companies', {
    select: 'id,name,industry,health_score,nps_score,lifetime_value',
    where: [{ column: 'org_id', value: org_id }],
    orderBy: { column: 'name', ascending: true },
  });

  // For each company, count active mandates
  const enriched: any[] = [];
  for (const c of companies as any[]) {
    let activeMandates = 0;
    try {
      activeMandates = await db.countRows('mandates', {
        where: [
          { column: 'company_id', value: c.id },
          { column: 'status', value: 'active' },
        ],
      });
    } catch {}

    enriched.push({
      id: c.id,
      name: c.name,
      industry: c.industry || 'Unknown',
      health_score: c.health_score,
      nps: c.nps_score,
      active_mandates: activeMandates,
      total_revenue_ytd: c.lifetime_value || 0,
    });
  }

  return res.status(200).json({ success: true, clients: enriched });
}
