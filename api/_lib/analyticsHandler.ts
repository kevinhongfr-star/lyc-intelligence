/**
 * Dashboard & Analytics Handler — DEX AI Technical Blueprint 11
 *
 * Endpoints:
 *   GET /api/analytics/pipeline       — A-1: Pipeline funnel + conversions
 *   GET /api/analytics/velocity       — A-2: Velocity metrics
 *   GET /api/analytics/consultants    — A-3: Consultant performance (admin/lead)
 *   GET /api/analytics/consultants/:id— A-4: Individual consultant detail
 *   GET /api/analytics/mandates       — A-5: Mandate health overview
 *   GET /api/analytics/mandates/:id   — A-6: Single mandate deep-dive
 *   GET /api/analytics/revenue        — A-7: Revenue pipeline (admin/lead)
 *   GET /api/analytics/activity       — A-8: Activity feed
 *   GET /api/analytics/kpis           — A-9: KPI targets vs actuals
 *   POST /api/analytics/kpis          — A-10: Create/update KPIs (admin)
 *   GET /api/analytics/snapshot       — A-11: Latest snapshot
 *   GET /api/analytics/export         — A-12: Export CSV (admin/lead)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectMany,
  selectOne,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest, getUserRole, isAdmin, isTeamLead } from './adminAuth.js';

export const maxDuration = 30;

// LYC Pipeline Stages (from candidates_pipeline.stage)
const PIPELINE_STAGES = ['GRID', 'LENS', 'SWEEP', 'CANVA', 'PLACED'];

const STAGE_LABELS: Record<string, string> = {
  'GRID': 'Grid (Talent Map)',
  'LENS': 'Lens (Deep Dive)',
  'SWEEP': 'Sweep (Outreach)',
  'CANVA': 'Canva (Shortlist)',
  'PLACED': 'Placed',
};

function formatStage(stage: string): string {
  return STAGE_LABELS[stage] || stage.replace(/_/g, ' ');
}

// ── Pipeline Funnel ───────────────────────────────────────────────────
async function computePipelineFunnel(filters: Record<string, any> = {}) {
  try {
    // Query candidates_pipeline table (actual pipeline data)
    const pipelineEntries = await selectMany(
      'candidates_pipeline',
      {},
      [],
      2000,
      0,
      'stage'
    );

    const funnel: Record<string, number> = {};
    for (const stage of PIPELINE_STAGES) {
      funnel[stage] = 0;
    }
    for (const entry of pipelineEntries || []) {
      if (entry.stage) {
        funnel[entry.stage] = (funnel[entry.stage] || 0) + 1;
      }
    }

    // Conversion rates
    const conversions: Record<string, number> = {};
    for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
      const fromCount = funnel[PIPELINE_STAGES[i]];
      const toCount = funnel[PIPELINE_STAGES[i + 1]];
      if (fromCount > 0) {
        conversions[`${PIPELINE_STAGES[i]}_to_${PIPELINE_STAGES[i + 1]}`] =
          Math.round((toCount / fromCount) * 1000) / 1000;
      }
    }

    const totalActive = Object.values(funnel).reduce((a, b) => a + b, 0);
    // Engaged = actively in process (not GRID which is initial mapping)
    const engaged = (funnel['LENS'] || 0) + (funnel['SWEEP'] || 0) + (funnel['CANVA'] || 0);
    const advanced = (funnel['CANVA'] || 0) + (funnel['PLACED'] || 0);
    const closed = funnel['PLACED'] || 0;

    return {
      funnel,
      conversions,
      summary: {
        total_active: totalActive,
        engaged,
        engagement_rate: totalActive > 0 ? Math.round((engaged / totalActive) * 100) : 0,
        advanced,
        advancement_rate: totalActive > 0 ? Math.round((advanced / totalActive) * 100) : 0,
        closed,
        placement_rate: totalActive > 0 ? Math.round((closed / totalActive) * 100 * 10) / 10 : 0,
      },
    };
  } catch (e) {
    return {
      funnel: {},
      conversions: {},
      summary: {
        total_active: 0, engaged: 0, engagement_rate: 0,
        advanced: 0, advancement_rate: 0, closed: 0, placement_rate: 0,
      },
    };
  }
}

// ── Velocity ──────────────────────────────────────────────────────────
async function computeVelocity(consultantId?: string) {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const allTransitions = await selectMany(
      'pipeline_transitions',
      {},
      ['changed_at DESC'],
      500, 0, '*'
    );

    const transitions = allTransitions.filter((t: any) => {
      if (consultantId && t.changed_by !== consultantId) return false;
      return new Date(t.changed_at) >= new Date(ninetyDaysAgo);
    });

    // Group by contact
    const byContact: Record<string, any[]> = {};
    for (const t of transitions || []) {
      if (!byContact[t.contact_id]) byContact[t.contact_id] = [];
      byContact[t.contact_id].push(t);
    }

    const stageDurations: Record<string, number[]> = {};

    for (const contactTransitions of Object.values(byContact)) {
      contactTransitions.sort(
        (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
      );
      for (let i = 1; i < contactTransitions.length; i++) {
        const prev = contactTransitions[i - 1];
        const curr = contactTransitions[i];
        if (curr.is_backward) continue;
        const days =
          (new Date(curr.changed_at).getTime() - new Date(prev.changed_at).getTime()) /
          (24 * 60 * 60 * 1000);
        const key = `${prev.to_stage}_to_${curr.to_stage}`;
        if (!stageDurations[key]) stageDurations[key] = [];
        if (days > 0 && days < 180) stageDurations[key].push(days);
      }
    }

    const avgDurations: Record<string, number> = {};
    for (const [key, durations] of Object.entries(stageDurations)) {
      avgDurations[key] = Math.round(
        (durations.reduce((a, b) => a + b, 0) / durations.length) * 10
      ) / 10;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentAdvances = (transitions || []).filter(
      (t: any) => !t.is_backward && new Date(t.changed_at) >= sevenDaysAgo
    ).length;

    const backwardCount = (transitions || []).filter((t: any) => t.is_backward).length;

    return {
      avg_days_per_transition: avgDurations,
      candidates_advancing_per_week: recentAdvances,
      total_transitions_90d: transitions?.length || 0,
      backward_rate: transitions?.length
        ? Math.round((backwardCount / transitions.length) * 100)
        : 0,
    };
  } catch (e) {
    return {
      avg_days_per_transition: {},
      candidates_advancing_per_week: 0,
      total_transitions_90d: 0,
      backward_rate: 0,
    };
  }
}

// ── Consultant Performance ────────────────────────────────────────────
async function computeConsultantPerformance() {
  try {
    const profiles = await selectMany('profiles', {}, [], 100, 0, 'id, full_name, role');
    const consultants = profiles.filter((p: any) =>
      ['consultant', 'team_lead'].includes(p.role)
    );

    const results = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const consultant of consultants) {
      // Query pipeline entries for this consultant's candidates
      const pipelineEntries = await selectMany(
        'candidates_pipeline',
        { consultant_id: consultant.id },
        [], 2000, 0, 'stage'
      );

      const pipelineCount = pipelineEntries?.length || 0;
      const distribution: Record<string, number> = {};
      for (const entry of pipelineEntries || []) {
        if (entry.stage) {
          distribution[entry.stage] = (distribution[entry.stage] || 0) + 1;
        }
      }

      const outreach = await selectMany(
        'candidate_outreach_log',
        { created_by: consultant.id },
        [], 500, 0, 'id'
      );
      const outreachCount = outreach.filter((o: any) =>
        new Date(o.created_at) >= new Date(thirtyDaysAgo)
      ).length;

      const placements = contacts?.filter((c: any) =>
        entry.stage === 'PLACED'
      ).length || 0;

      const engaged = contacts?.filter((c: any) =>
        ['LENS', 'SWEEP', 'CANVA'].includes(
          entry.stage
        )
      ).length || 0;

      results.push({
        consultant_id: consultant.id,
        name: consultant.full_name,
        role: consultant.role,
        pipeline_count: pipelineCount,
        stage_distribution: distribution,
        engaged_count: engaged,
        engagement_rate: pipelineCount > 0
          ? Math.round((engaged / pipelineCount) * 100)
          : 0,
        activity_30d: {
          outreach: outreachCount,
          outreach_per_day: Math.round((outreachCount / 30) * 10) / 10,
        },
        placements,
      });
    }

    return results.sort(
      (a, b) => b.activity_30d.outreach - a.activity_30d.outreach
    );
  } catch (e) {
    return [];
  }
}

// ── Mandate Health ────────────────────────────────────────────────────
async function computeMandateHealth(mandateId?: string) {
  try {
    let mandates = await selectMany(
      'mandates',
      {},
      [], 100, 0, '*'
    );

    if (mandateId) {
      mandates = mandates.filter((m: any) => m.id === mandateId);
    }

    mandates = mandates.filter((m: any) =>
      ['active', 'in_progress'].includes(m.status)
    );

    const results = [];
    for (const mandate of mandates) {
      const links = await selectMany(
        'candidate_mandate_links',
        { mandate_id: mandate.id },
        [], 200, 0, 'status, contact_id'
      );

      const pipelineByStatus: Record<string, number> = {};
      for (const link of links || []) {
        pipelineByStatus[link.status] = (pipelineByStatus[link.status] || 0) + 1;
      }

      const daysInPhase = mandate.phase_entered_at
        ? Math.floor(
            (Date.now() - new Date(mandate.phase_entered_at).getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : 0;

      const totalCandidates = links?.length || 0;
      const presented =
        (pipelineByStatus['presented'] || 0) +
        (pipelineByStatus['client_interview'] || 0) +
        (pipelineByStatus['interview'] || 0) +
        (pipelineByStatus['offer'] || 0) +
        (pipelineByStatus['placed'] || 0);
      const interviews =
        (pipelineByStatus['interview'] || 0) +
        (pipelineByStatus['offer'] || 0) +
        (pipelineByStatus['placed'] || 0);

      let healthScore = 50;
      if (totalCandidates >= 10) healthScore += 15;
      else if (totalCandidates >= 5) healthScore += 10;
      else if (totalCandidates < 3) healthScore -= 20;
      if (presented > 0) healthScore += 15;
      if (interviews > 0) healthScore += 15;
      if (daysInPhase > 30) healthScore -= 15;
      else if (daysInPhase > 14) healthScore -= 5;
      healthScore = Math.max(0, Math.min(100, healthScore));

      const alerts: string[] = [];
      if (totalCandidates < 3) alerts.push('Low candidate pipeline — need more sourcing');
      if (daysInPhase > 21 && presented === 0)
        alerts.push('No presentations after 3 weeks — review sourcing strategy');
      if (healthScore < 30) alerts.push('Mandate health critical — immediate attention needed');
      if (daysInPhase > 45) alerts.push('Phase stalled > 45 days — consider client check-in');

      results.push({
        mandate_id: mandate.id,
        title: mandate.title,
        phase: mandate.phase,
        days_in_phase: daysInPhase,
        lead_consultant_id: mandate.lead_consultant_id,
        fee_amount: mandate.fee_amount || 0,
        candidate_pipeline: pipelineByStatus,
        total_candidates: totalCandidates,
        presented_count: presented,
        interview_count: interviews,
        health_score: healthScore,
        health_label:
          healthScore >= 75
            ? 'healthy'
            : healthScore >= 50
            ? 'at_risk'
            : healthScore >= 25
            ? 'stalled'
            : 'critical',
        alerts,
      });
    }

    return results.sort((a, b) => b.health_score - a.health_score);
  } catch (e) {
    return [];
  }
}

// ── Revenue Pipeline ──────────────────────────────────────────────────
async function computeRevenuePipeline() {
  try {
    const mandates = await selectMany(
      'mandates',
      {},
      [], 100, 0, '*'
    );

    const activeMandates = mandates.filter((m: any) =>
      ['active', 'in_progress'].includes(m.status)
    );

    const byPhase: Record<string, { count: number; total_fee: number }> = {};
    for (const m of activeMandates || []) {
      if (!byPhase[m.phase]) byPhase[m.phase] = { count: 0, total_fee: 0 };
      byPhase[m.phase].count++;
      byPhase[m.phase].total_fee += m.fee_amount || 0;
    }

    const totalPipelineValue = (activeMandates || []).reduce(
      (sum: number, m: any) => sum + (m.fee_amount || 0), 0
    );

    // Placements this quarter
    const now = new Date();
    const quarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1
    );

    const closedContacts = await selectMany(
      'contacts',
      { stage: 'PLACED' },
      [], 100, 0, 'id, stage_change_date'
    );
    const placementsThisQuarter = closedContacts.filter((c: any) =>
      c.stage_change_date && new Date(c.stage_change_date) >= quarterStart
    ).length;

    return {
      active_mandates: activeMandates?.length || 0,
      pipeline_by_phase: byPhase,
      total_pipeline_value: totalPipelineValue,
      placements_this_quarter: placementsThisQuarter,
      avg_fee_per_mandate: activeMandates?.length
        ? Math.round(totalPipelineValue / activeMandates.length)
        : 0,
    };
  } catch (e) {
    return {
      active_mandates: 0,
      pipeline_by_phase: {},
      total_pipeline_value: 0,
      placements_this_quarter: 0,
      avg_fee_per_mandate: 0,
    };
  }
}

// ── Activity Feed ─────────────────────────────────────────────────────
async function getActivityFeed(
  userId: string,
  userRole: string,
  limit: number = 50
) {
  try {
    const feed: any[] = [];

    // Outreach
    const outreach = await selectMany(
      'candidate_outreach_log',
      {},
      ['created_at DESC'],
      30, 0, '*'
    );
    for (const item of outreach || []) {
      if (userRole === 'consultant' && item.created_by !== userId) continue;
      feed.push({
        type: 'outreach',
        timestamp: item.created_at,
        actor_id: item.created_by,
        title: `${item.interaction_type}`,
        detail: item.summary,
        outcome: item.outcome,
        contact_id: item.contact_id,
        id: `outreach-${item.id}`,
      });
    }

    // Pipeline transitions
    const transitions = await selectMany(
      'pipeline_transitions',
      {},
      ['changed_at DESC'],
      30, 0, '*'
    );
    for (const item of transitions || []) {
      if (userRole === 'consultant' && item.changed_by !== userId) continue;
      feed.push({
        type: 'pipeline_change',
        timestamp: item.changed_at,
        actor_id: item.changed_by,
        title: `${formatStage(item.from_stage)} → ${formatStage(item.to_stage)}`,
        contact_id: item.contact_id,
        is_backward: item.is_backward,
        id: `transition-${item.id}`,
      });
    }

    // LinkedIn imports
    const imports = await selectMany(
      'linkedin_imports',
      {},
      ['created_at DESC'],
      10, 0, '*'
    );
    for (const item of imports || []) {
      if (userRole === 'consultant' && item.created_by !== userId) continue;
      feed.push({
        type: 'import',
        timestamp: item.created_at,
        actor_id: item.created_by,
        title: `LinkedIn Import: ${item.import_type}`,
        detail: `${item.created_count || 0} created, ${item.updated_count || 0} updated`,
        status: item.status,
        id: `import-${item.id}`,
      });
    }

    // Sort
    feed.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      items: feed.slice(0, limit),
      total: feed.length,
    };
  } catch (e) {
    return { items: [], total: 0 };
  }
}

// ── Bottleneck Detection ──────────────────────────────────────────────
function detectBottlenecks(
  funnel: Record<string, number>,
  avgDurations: Record<string, number>
) {
  const bottlenecks: {
    stage: string;
    count: number;
    avg_days: number;
    severity: string;
  }[] = [];

  for (let i = 0; i < PIPELINE_STAGES.length - 1; i++) {
    const stage = PIPELINE_STAGES[i];
    const nextStage = PIPELINE_STAGES[i + 1];
    const count = funnel[stage] || 0;
    const nextCount = funnel[nextStage] || 0;

    if (count > nextCount * 3 && count > 5) {
      const transitionKey = `${stage}_to_${nextStage}`;
      const avgDays = avgDurations[transitionKey] || 0;
      const severity =
        avgDays > 14 ? 'critical' : avgDays > 7 ? 'warning' : 'info';
      bottlenecks.push({ stage, count, avg_days: avgDays, severity });
    }
  }

  return bottlenecks.sort((a, b) => b.count - a.count);
}

// ── Main Handler ───────────────────────────────────────────────────────
export async function handleAnalytics(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0]; // pipeline | velocity | consultants | mandates | revenue | activity | kpis | snapshot | export
    const id = pathArr[1];

    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ success: false, error });

    const userRole = await getUserRole(user.id);

    // A-1: GET /api/analytics/pipeline
    if (resource === 'pipeline' && req.method === 'GET') {
      return handlePipeline(req, res, user.id, userRole);
    }

    // A-2: GET /api/analytics/velocity
    if (resource === 'velocity' && req.method === 'GET') {
      return handleVelocity(req, res, user.id, userRole);
    }

    // A-3: GET /api/analytics/consultants
    if (resource === 'consultants' && req.method === 'GET' && !id) {
      return handleConsultants(req, res, userRole);
    }

    // A-4: GET /api/analytics/consultants/:id
    if (resource === 'consultants' && id && req.method === 'GET') {
      return handleConsultantDetail(req, res, id, user.id, userRole);
    }

    // A-5: GET /api/analytics/mandates
    if (resource === 'mandates' && req.method === 'GET' && !id) {
      return handleMandates(req, res, user.id, userRole);
    }

    // A-6: GET /api/analytics/mandates/:id
    if (resource === 'mandates' && id && req.method === 'GET') {
      return handleMandateDetail(req, res, id);
    }

    // A-7: GET /api/analytics/revenue
    if (resource === 'revenue' && req.method === 'GET') {
      return handleRevenue(req, res, userRole);
    }

    // A-8: GET /api/analytics/activity
    if (resource === 'activity' && req.method === 'GET') {
      return handleActivity(req, res, user.id, userRole);
    }

    // A-9: GET /api/analytics/kpis
    if (resource === 'kpis' && req.method === 'GET') {
      return handleGetKPIs(req, res);
    }

    // A-10: POST /api/analytics/kpis
    if (resource === 'kpis' && req.method === 'POST') {
      return handleCreateKPI(req, res, user.id, userRole);
    }

    // A-11: GET /api/analytics/snapshot
    if (resource === 'snapshot' && req.method === 'GET') {
      return handleSnapshot(req, res, user.id, userRole);
    }

    return res.status(404).json({ success: false, error: 'Analytics route not found' });
  } catch (err) {
    return handleError(res, 'analytics', err);
  }
}

// ── Handler Implementations ────────────────────────────────────────────

async function handlePipeline(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  const { scope = 'platform' } = req.query as Record<string, string>;

  let filters: Record<string, any> = {};
  if (scope === 'personal' || userRole === 'consultant') {
    filters.assigned_to = userId;
  }

  const funnel = await computePipelineFunnel(filters);
  return res.json({ success: true, ...funnel });
}

async function handleVelocity(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  const consultantId = userRole === 'consultant' ? userId : undefined;
  const velocity = await computeVelocity(consultantId);

  const funnel = await computePipelineFunnel(
    userRole === 'consultant' ? { assigned_to: userId } : {}
  );
  const bottlenecks = detectBottlenecks(funnel.funnel, velocity.avg_days_per_transition);

  return res.json({ success: true, ...velocity, bottlenecks });
}

async function handleConsultants(req: VercelRequest, res: VercelResponse, userRole: string) {
  if (userRole !== 'admin' && userRole !== 'team_lead') {
    return res.status(403).json({ success: false, error: 'Admin or team lead only' });
  }

  const performance = await computeConsultantPerformance();
  return res.json({ success: true, consultants: performance });
}

async function handleConsultantDetail(
  req: VercelRequest,
  res: VercelResponse,
  consultantId: string,
  userId: string,
  userRole: string
) {
  if (userRole === 'consultant' && consultantId !== userId) {
    return res.status(403).json({ success: false, error: 'Not your data' });
  }

  const funnel = await computePipelineFunnel({ assigned_to: consultantId });
  const velocity = await computeVelocity(consultantId);

  const profiles = await selectMany('profiles', {}, [], 100, 0, 'id, full_name, role');
  const profile = profiles.find((p: any) => p.id === consultantId);

  return res.json({
    success: true,
    consultant_id: consultantId,
    name: profile?.full_name || '',
    ...funnel,
    velocity,
  });
}

async function handleMandates(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  let mandates = await computeMandateHealth();

  if (userRole === 'consultant') {
    mandates = mandates.filter((m: any) => m.lead_consultant_id === userId);
  }

  return res.json({ success: true, mandates });
}

async function handleMandateDetail(req: VercelRequest, res: VercelResponse, mandateId: string) {
  const mandates = await computeMandateHealth(mandateId);
  const mandate = mandates[0];

  if (!mandate) return res.status(404).json({ success: false, error: 'Mandate not found' });

  return res.json({ success: true, mandate });
}

async function handleRevenue(req: VercelRequest, res: VercelResponse, userRole: string) {
  if (userRole !== 'admin' && userRole !== 'team_lead') {
    return res.status(403).json({ success: false, error: 'Admin or team lead only' });
  }

  const revenue = await computeRevenuePipeline();
  return res.json({ success: true, ...revenue });
}

async function handleActivity(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  const { limit = '50' } = req.query as Record<string, string>;
  const feed = await getActivityFeed(userId, userRole, parseInt(limit));
  return res.json({ success: true, ...feed });
}

async function handleGetKPIs(req: VercelRequest, res: VercelResponse) {
  const kpis = await selectMany('kpis', { is_active: true }, ['category', 'name'], 100, 0, '*');

  // Compute current values for each KPI
  const funnel = await computePipelineFunnel();
  const velocity = await computeVelocity();
  const revenue = await computeRevenuePipeline();
  const consultants = await computeConsultantPerformance();

  const enrichedKPIs = kpis.map((kpi: any) => {
    let currentValue = 0;
    switch (kpi.name) {
      case 'Engagement Rate':
        currentValue = funnel.summary.engagement_rate;
        break;
      case 'Advancement Rate':
        currentValue = funnel.summary.advancement_rate;
        break;
      case 'Placement Rate':
        currentValue = funnel.summary.placement_rate;
        break;
      case 'Daily Outreach':
        const avgOutreach = consultants.length
          ? consultants.reduce((sum: number, c: any) => sum + c.activity_30d.outreach_per_day, 0) /
            consultants.length
          : 0;
        currentValue = Math.round(avgOutreach * 10) / 10;
        break;
      case 'Source to Contact':
        currentValue = velocity.avg_days_per_transition['GRID_to_LENS'] || 0;
        break;
      case 'Offer to Close':
        currentValue = velocity.avg_days_per_transition['S16_Offer_Extended_to_S17_Offer_Accepted'] || 0;
        break;
      case 'Revenue per Consultant':
        currentValue = consultants.length
          ? Math.round(revenue.total_pipeline_value / consultants.length)
          : 0;
        break;
      default:
        currentValue = kpi.current_value || 0;
    }

    const progress = kpi.target_value > 0
      ? Math.round((currentValue / kpi.target_value) * 100)
      : 0;

    return {
      ...kpi,
      current_value: currentValue,
      progress_percent: Math.min(progress, 100),
      status: progress >= 100 ? 'met' : progress >= 70 ? 'on_track' : 'at_risk',
    };
  });

  return res.json({ success: true, kpis: enrichedKPIs });
}

async function handleCreateKPI(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  if (userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin only' });
  }

  const { name, description, category, target_value, target_period, applies_to } = req.body || {};

  if (!name || !category || target_value === undefined) {
    return res.status(400).json({ success: false, error: 'name, category, target_value required' });
  }

  const kpi = await insert('kpis', {
    name,
    description: description || null,
    category,
    target_value,
    target_period: target_period || 'monthly',
    applies_to: applies_to || 'platform',
    created_by: userId,
    is_active: true,
  });

  return res.json({ success: true, kpi });
}

async function handleSnapshot(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  userRole: string
) {
  const { scope = 'platform' } = req.query as Record<string, string>;

  // Return real-time computed data instead of cached snapshots
  const funnel = await computePipelineFunnel(
    userRole === 'consultant' ? { assigned_to: userId } : {}
  );
  const velocity = await computeVelocity(userRole === 'consultant' ? userId : undefined);

  return res.json({
    success: true,
    scope,
    computed_at: new Date().toISOString(),
    pipeline: funnel,
    velocity,
  });
}
