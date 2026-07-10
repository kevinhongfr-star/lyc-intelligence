import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Executive Summary Generator ─── */
async function generateExecutiveSummary() {
  const [mandates, consultants, flags, forecasts] = await Promise.all([
    selectMany('mandates', { where: [{ column: 'is_deleted', value: false }] }),
    selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] }),
    selectMany('auto_flags', { where: [{ column: 'status', value: 'active' }] }),
    selectMany('revenue_forecasts', { orderBy: { column: 'generated_at', ascending: false }, limit: 1 }),
  ]);

  const activeMandates = mandates.filter((m: any) => !['closed_won', 'closed_lost'].includes(m.status));
  const thisMonthRevenue = mandates
    .filter((m: any) => m.status === 'closed_won')
    .reduce((sum: number, m: any) => sum + (m.fee || 0), 0);

  const forecast = forecasts[0];
  const expectedForecast = forecast?.expected_total || 0;

  const criticalFlags = flags.filter((f: any) => f.severity === 'critical');
  const highFlags = flags.filter((f: any) => f.severity === 'high');

  return {
    summary_text: `EXECUTIVE SUMMARY\n\n` +
      `Headline Metrics:\n` +
      `- ${activeMandates.length} active mandates in pipeline\n` +
      `- ${thisMonthRevenue} actual revenue this month\n` +
      `- ${expectedForecast} expected forecast\n\n` +
      `Critical Issues: ${criticalFlags.length} critical, ${highFlags.length} high priority flags require attention.`,
    headline_metrics: {
      active_mandates: activeMandates.length,
      this_month_revenue: thisMonthRevenue,
      expected_forecast: expectedForecast,
    },
    key_wins: [
      `${mandates.filter((m: any) => m.status === 'onboarded').length} placements this month`,
      `${mandates.filter((m: any) => m.status === 'offer').length} offers extended`,
    ],
    risks: criticalFlags.slice(0, 3).map((f: any) => f.description || f.rule_name),
    actions: [
      'Review critical flags daily',
      'Accelerate offer-stage mandates',
      'Rebalance consultant workloads',
    ],
    forward_look: `Next 30 days: ${activeMandates.filter((m: any) => m.priority_tier === 'Tier 1').length} Tier 1 mandates closing`,
  };
}

/* ─── Portfolio Health Overview ─── */
async function getPortfolioHealth() {
  const mandates = await selectMany('mandates', { where: [{ column: 'is_deleted', value: false }] });

  const tierCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  let totalFee = 0;
  let overdueCount = 0;

  for (const m of mandates) {
    tierCounts[m.priority_tier || 'unassigned'] = (tierCounts[m.priority_tier || 'unassigned'] || 0) + 1;
    statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    totalFee += m.fee || 0;

    if (m.deadline) {
      const deadline = new Date(m.deadline);
      if (deadline < new Date() && !['closed_won', 'closed_lost'].includes(m.status)) {
        overdueCount++;
      }
    }
  }

  // Health score: 100 - penalties
  let healthScore = 100;
  healthScore -= overdueCount * 5;
  healthScore -= (tierCounts['Tier 3'] || 0) * 2;
  healthScore = Math.max(0, healthScore);

  const trends = {
    mandates: mandates.length > 20 ? 'up' : 'stable',
    pipeline_value: totalFee > 500000 ? 'up' : 'stable',
    health: healthScore > 80 ? 'up' : healthScore > 60 ? 'stable' : 'down',
  };

  return {
    health_score: healthScore,
    by_tier: tierCounts,
    by_status: statusCounts,
    trends,
    risk_summary: {
      overdue_mandates: overdueCount,
      pipeline_value: totalFee,
      critical_tier1: tierCounts['Tier 1'] || 0,
    },
    anomalies: overdueCount > 3 ? [`${overdueCount} mandates are past deadline`] : [],
  };
}

/* ─── Revenue Forecast Dashboard ─── */
async function getRevenueDashboard(period: string) {
  const forecasts = await selectMany('revenue_forecasts', {
    where: [{ column: 'period', value: period }],
    orderBy: { column: 'forecast_date', ascending: false },
    limit: 1,
  });

  const forecast = forecasts[0];
  if (!forecast) {
    return { error: 'No forecast available for this period' };
  }

  const details = await selectMany('revenue_forecast_details', {
    where: [{ column: 'forecast_id', value: forecast.id }],
  });

  const topContributors = details
    .filter((d: any) => d.scenario === 'expected')
    .sort((a: any, b: any) => b.fee_amount - a.fee_amount)
    .slice(0, 5)
    .map((d: any) => ({
      mandate_id: d.mandate_id,
      fee_amount: d.fee_amount,
      probability: d.probability,
    }));

  return {
    forecast_3_scenarios: {
      conservative: forecast.conservative_total,
      expected: forecast.expected_total,
      optimistic: forecast.optimistic_total,
    },
    monthly_rollup: forecast.monthly_rollup,
    top_contributors: topContributors,
    confidence: forecast.confidence_level,
    mandate_count: forecast.mandate_count,
  };
}

/* ─── Team Performance Rankings ─── */
async function getTeamRankings(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const cutoffDate = new Date(Date.now() - days * 86400000).toISOString();

  const metrics = await selectMany('five_metrics', {
    where: [{ column: 'week_start', value: cutoffDate.split('T')[0], op: 'gte' }],
  });

  const consultantScores: Record<string, any> = {};

  for (const m of metrics) {
    const cid = m.consultant_id;
    if (!consultantScores[cid]) {
      consultantScores[cid] = {
        consultant_id: cid,
        new_candidates: 0,
        cv_submitted: 0,
        interviews: 0,
        offers: 0,
        placements: 0,
        weeks: 0,
      };
    }
    consultantScores[cid].new_candidates += m.new_candidates_added || 0;
    consultantScores[cid].cv_submitted += m.cv_submitted || 0;
    consultantScores[cid].interviews += m.interviews_scheduled || 0;
    consultantScores[cid].offers += m.offers_extended || 0;
    consultantScores[cid].placements += m.placements || 0;
    consultantScores[cid].weeks++;
  }

  const rankings = [];
  for (const [cid, data] of Object.entries(consultantScores)) {
    const consultant = await selectOne('consultants', { where: [{ column: 'id', value: cid }] });
    const compositeScore = (
      (data as any).new_candidates * 1 +
      (data as any).cv_submitted * 2 +
      (data as any).interviews * 3 +
      (data as any).offers * 4 +
      (data as any).placements * 10
    );

    rankings.push({
      consultant: consultant?.name || 'Unknown',
      consultant_id: cid,
      metrics: {
        new_candidates: (data as any).new_candidates,
        cv_submitted: (data as any).cv_submitted,
        interviews: (data as any).interviews,
        offers: (data as any).offers,
        placements: (data as any).placements,
      },
      composite_score: compositeScore,
      trend: compositeScore > 50 ? 'up' : compositeScore > 20 ? 'stable' : 'down',
    });
  }

  rankings.sort((a, b) => b.composite_score - a.composite_score);

  return { period, rankings };
}

/* ─── API Handlers ─── */
export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const resource = path[0];

  try {
    if (resource === 'executive-summary' && req.method === 'POST') {
      const summary = await generateExecutiveSummary();
      return res.status(200).json({ success: true, ...summary });
    }

    if (resource === 'portfolio-health' && req.method === 'GET') {
      const health = await getPortfolioHealth();
      return res.status(200).json({ success: true, ...health });
    }

    if (resource === 'revenue-dashboard' && req.method === 'GET') {
      const period = req.query.period as string || 'quarter';
      const dashboard = await getRevenueDashboard(period);
      return res.status(200).json({ success: true, ...dashboard });
    }

    if (resource === 'team-rankings' && req.method === 'GET') {
      const period = req.query.period as string || '30d';
      const rankings = await getTeamRankings(period);
      return res.status(200).json({ success: true, ...rankings });
    }

    return res.status(404).json({ error: `Unknown resource: /api/v16/${resource}` });
  } catch (err: any) {
    console.error('[Leader] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}