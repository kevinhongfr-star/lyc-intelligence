import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Market Intelligence Aggregator ─── */
async function aggregateMarketIntelligence(industry: string, geography: string) {
  const mandates = await selectMany('mandates', {
    where: [{ column: 'is_deleted', value: false }],
  });

  const industryMandates = mandates.filter((m: any) => m.industry === industry);
  const geoMandates = mandates.filter((m: any) => (m.location || '').toLowerCase().includes(geography.toLowerCase()));

  // Salary trends
  const salaries = mandates
    .filter((m: any) => m.salary_range_min && m.salary_range_max)
    .map((m: any) => ({ min: m.salary_range_min, max: m.salary_range_max, title: m.position_title }));

  const avgMin = salaries.length > 0 ? salaries.reduce((s, m) => s + m.min, 0) / salaries.length : 0;
  const avgMax = salaries.length > 0 ? salaries.reduce((s, m) => s + m.max, 0) / salaries.length : 0;

  // Time to fill trends
  const closedMandates = mandates.filter((m: any) => ['closed_won', 'onboarded'].includes(m.status));
  const timeToFills = closedMandates.map((m: any) => {
    const start = new Date(m.created_at);
    const end = new Date(m.closed_at || m.updated_at);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });
  const avgTimeToFill = timeToFills.length > 0 ? timeToFills.reduce((a, b) => a + b, 0) / timeToFills.length : 0;

  // Top hiring roles
  const roleCounts: Record<string, number> = {};
  for (const m of mandates) {
    const title = m.position_title || 'Unknown';
    roleCounts[title] = (roleCounts[title] || 0) + 1;
  }
  const topRoles = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([role, count]) => ({ role, count }));

  return {
    industry,
    geography,
    mandates_in_industry: industryMandates.length,
    mandates_in_geography: geoMandates.length,
    salary_trends: {
      avg_min: Math.round(avgMin),
      avg_max: Math.round(avgMax),
      range: `${Math.round(avgMin)} - ${Math.round(avgMax)}`,
    },
    time_to_fill: {
      avg_days: Math.round(avgTimeToFill),
      sample_size: timeToFills.length,
    },
    top_hiring_roles: topRoles,
    trends: {
      demand_trend: mandates.length > 20 ? 'increasing' : 'stable',
      salary_trend: avgMax > 200000 ? 'rising' : 'stable',
    },
  };
}

/* ─── Client Health Dashboard ─── */
async function generateClientHealth(orgId: string) {
  const org = await selectOne('organizations', { where: [{ column: 'id', value: orgId }] });
  if (!org) return { error: 'Organization not found' };

  const mandates = await selectMany('mandates', { where: [{ column: 'org_id', value: orgId }] });

  const active = mandates.filter((m: any) => !['closed_won', 'closed_lost'].includes(m.status));
  const won = mandates.filter((m: any) => m.status === 'closed_won' || m.status === 'onboarded');
  const lost = mandates.filter((m: any) => m.status === 'closed_lost');

  const totalRevenue = won.reduce((sum: number, m: any) => sum + (m.fee || 0), 0);
  const avgFee = won.length > 0 ? totalRevenue / won.length : 0;

  // Engagement score
  const recentMandates = mandates.filter((m: any) => {
    const created = new Date(m.created_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return created > sixMonthsAgo;
  });

  const healthScore = calculateClientHealthScore(active.length, won.length, lost.length, recentMandates.length);

  return {
    org_id: orgId,
    org_name: org.name,
    summary: {
      total_mandates: mandates.length,
      active: active.length,
      won: won.length,
      lost: lost.length,
      win_rate: mandates.length > 0 ? Math.round((won.length / mandates.length) * 100) : 0,
    },
    revenue: {
      total: totalRevenue,
      avg_fee_per_placement: Math.round(avgFee),
    },
    health: {
      score: healthScore,
      status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'needs_attention' : 'at_risk',
      signals: generateHealthSignals(active.length, won.length, lost.length, recentMandates.length),
    },
    active_mandates: active.map((m: any) => ({ id: m.id, title: m.position_title, status: m.status })),
  };
}

function calculateClientHealthScore(active: number, won: number, lost: number, recent: number): number {
  let score = 50;
  score += won * 10;
  score -= lost * 5;
  score += recent * 5;
  score += active * 3;
  return Math.min(100, Math.max(0, score));
}

function generateHealthSignals(active: number, won: number, lost: number, recent: number): string[] {
  const signals: string[] = [];
  if (won >= 3) signals.push('Strong placement history');
  if (active >= 2) signals.push('Active engagement');
  if (recent >= 2) signals.push('Recent collaboration');
  if (lost > won) signals.push('More lost mandates than won — investigate');
  if (active === 0 && recent === 0) signals.push('No recent activity — re-engage');
  return signals;
}

/* ─── Competitive Landscape Mapper ─── */
async function mapCompetitiveLandscape(industry: string) {
  const orgs = await selectMany('organizations', {
    where: [{ column: 'industry', value: industry }, { column: 'is_deleted', value: false }],
  });

  const landscape: any[] = [];
  for (const org of orgs) {
    const mandates = await selectMany('mandates', { where: [{ column: 'org_id', value: org.id }] });
    const active = mandates.filter((m: any) => !['closed_won', 'closed_lost'].includes(m.status)).length;
    const total = mandates.length;

    landscape.push({
      org_id: org.id,
      name: org.name,
      mandate_count: total,
      active_mandates: active,
      engagement_level: active > 3 ? 'high' : active > 1 ? 'medium' : 'low',
    });
  }

  landscape.sort((a, b) => b.mandate_count - a.mandate_count);

  return {
    industry,
    total_orgs: landscape.length,
    top_clients: landscape.slice(0, 10),
    distribution: {
      high_engagement: landscape.filter(l => l.engagement_level === 'high').length,
      medium_engagement: landscape.filter(l => l.engagement_level === 'medium').length,
      low_engagement: landscape.filter(l => l.engagement_level === 'low').length,
    },
  };
}

/* ─── Predictive Alert Engine ─── */
async function generatePredictiveAlerts() {
  const [mandates, consultants, flags] = await Promise.all([
    selectMany('mandates', { where: [{ column: 'is_deleted', value: false }] }),
    selectMany('consultants', { where: [{ column: 'is_deleted', value: false }] }),
    selectMany('auto_flags', { where: [{ column: 'status', value: 'active' }] }),
  ]);

  const alerts: any[] = [];

  // Stale mandates
  for (const m of mandates) {
    const lastActivity = new Date(m.updated_at || m.created_at);
    const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14 && !['closed_won', 'closed_lost', 'on_hold'].includes(m.status)) {
      alerts.push({
        type: 'stale_mandate',
        severity: daysSince > 30 ? 'high' : 'medium',
        mandate_id: m.id,
        title: m.position_title,
        message: `No activity for ${daysSince} days`,
        recommended_action: 'Schedule follow-up with client or internal review',
      });
    }
  }

  // Overloaded consultants
  const consultantLoads: Record<string, number> = {};
  for (const m of mandates) {
    if (m.consultant_id) {
      consultantLoads[m.consultant_id] = (consultantLoads[m.consultant_id] || 0) + 1;
    }
  }
  for (const [cid, load] of Object.entries(consultantLoads)) {
    if (load > 8) {
      const consultant = consultants.find((c: any) => c.id === cid);
      alerts.push({
        type: 'consultant_overloaded',
        severity: load > 12 ? 'high' : 'medium',
        consultant_id: cid,
        name: consultant?.name || 'Unknown',
        message: `${load} active mandates — above recommended capacity`,
        recommended_action: 'Rebalance workloads or assign additional support',
      });
    }
  }

  // Critical flags unresolved
  const criticalFlags = flags.filter((f: any) => f.severity === 'critical');
  for (const f of criticalFlags) {
    alerts.push({
      type: 'critical_flag_unresolved',
      severity: 'critical',
      flag_id: f.id,
      rule_name: f.rule_name,
      message: f.description || 'Critical flag requires attention',
      recommended_action: 'Review and resolve immediately',
    });
  }

  return { total_alerts: alerts.length, alerts: alerts.slice(0, 20) };
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
    if (resource === 'market-intelligence' && req.method === 'GET') {
      const industry = req.query.industry as string || 'all';
      const geography = req.query.geography as string || 'all';
      const result = await aggregateMarketIntelligence(industry, geography);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'client-health' && req.method === 'GET') {
      const orgId = path[1];
      if (!orgId) return res.status(400).json({ error: 'org_id required' });
      const result = await generateClientHealth(orgId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'competitive-landscape' && req.method === 'GET') {
      const industry = req.query.industry as string;
      if (!industry) return res.status(400).json({ error: 'industry required' });
      const result = await mapCompetitiveLandscape(industry);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'predictive-alerts' && req.method === 'GET') {
      const result = await generatePredictiveAlerts();
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(404).json({ error: `Unknown resource: /api/v20/${resource}` });
  } catch (err: any) {
    console.error('[Strategic] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}