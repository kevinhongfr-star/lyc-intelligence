import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Micro-Learning Module Recommender ─── */
async function recommendModules(consultantId: string) {
  const metrics = await selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] });
  const gaps = await identifySkillGapsFromMetrics(metrics);

  const modules: any[] = [];
  const moduleLibrary: Record<string, any> = {
    sourcing: { name: 'Advanced Sourcing Techniques', duration_min: 20, type: 'video' },
    cv_writing: { name: 'CV Optimization', duration_min: 15, type: 'interactive' },
    interview_prep: { name: 'Interview Coaching', duration_min: 25, type: 'video' },
    closing: { name: 'Closing Techniques', duration_min: 30, type: 'simulation' },
    client_comm: { name: 'Client Communication', duration_min: 20, type: 'interactive' },
    negotiation: { name: 'Offer Negotiation', duration_min: 25, type: 'simulation' },
  };

  for (const gap of gaps) {
    const moduleKey = mapGapToModule(gap);
    if (moduleKey && moduleLibrary[moduleKey]) {
      modules.push({
        ...moduleLibrary[moduleKey],
        module_id: moduleKey,
        reason: `Improve ${gap.skill}`,
        priority: gap.priority,
      });
    }
  }

  return { consultant_id: consultantId, recommended_modules: modules.slice(0, 5) };
}

async function identifySkillGapsFromMetrics(metrics: any[]): any[] {
  const avg = {
    new_candidates: metrics.reduce((s: number, m: any) => s + (m.new_candidates_added || 0), 0) / Math.max(metrics.length, 1),
    cv_submitted: metrics.reduce((s: number, m: any) => s + (m.cv_submitted || 0), 0) / Math.max(metrics.length, 1),
    interviews: metrics.reduce((s: number, m: any) => s + (m.interviews_scheduled || 0), 0) / Math.max(metrics.length, 1),
    placements: metrics.reduce((s: number, m: any) => s + (m.placements || 0), 0) / Math.max(metrics.length, 1),
  };

  const gaps: any[] = [];
  if (avg.new_candidates < 3) gaps.push({ skill: 'sourcing', priority: 'high' });
  if (avg.cv_submitted < 2) gaps.push({ skill: 'cv_writing', priority: 'medium' });
  if (avg.interviews < 1) gaps.push({ skill: 'interview_prep', priority: 'medium' });
  if (avg.placements < 0.25) gaps.push({ skill: 'closing', priority: 'high' });

  return gaps;
}

function mapGapToModule(gap: any): string | null {
  const map: Record<string, string> = {
    sourcing: 'sourcing',
    cv_writing: 'cv_writing',
    interview_prep: 'interview_prep',
    closing: 'closing',
    client_comm: 'client_comm',
    negotiation: 'negotiation',
  };
  return map[gap.skill] || null;
}

/* ─── Performance Trend Visualizer ─── */
async function visualizePerformanceTrend(consultantId: string, period: string) {
  const metrics = await selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] });

  const weeks = period === '12w' ? 12 : period === '8w' ? 8 : 4;
  const recent = metrics.slice(-weeks);

  const trendData = recent.map((m: any, idx: number) => ({
    week: idx + 1,
    week_start: m.week_start,
    new_candidates: m.new_candidates_added || 0,
    cv_submitted: m.cv_submitted || 0,
    interviews: m.interviews_scheduled || 0,
    offers: m.offers_extended || 0,
    placements: m.placements || 0,
    composite_score: (m.new_candidates_added || 0) * 1 + (m.cv_submitted || 0) * 2 + (m.interviews_scheduled || 0) * 3 + (m.offers_extended || 0) * 4 + (m.placements || 0) * 10,
  }));

  const avgComposite = trendData.reduce((s: number, w: any) => s + w.composite_score, 0) / Math.max(trendData.length, 1);
  const firstHalf = trendData.slice(0, Math.floor(weeks / 2));
  const secondHalf = trendData.slice(Math.floor(weeks / 2));
  const firstAvg = firstHalf.reduce((s: number, w: any) => s + w.composite_score, 0) / Math.max(firstHalf.length, 1);
  const secondAvg = secondHalf.reduce((s: number, w: any) => s + w.composite_score, 0) / Math.max(secondHalf.length, 1);
  const trendDirection = secondAvg > firstAvg * 1.1 ? 'improving' : secondAvg < firstAvg * 0.9 ? 'declining' : 'stable';

  return {
    consultant_id: consultantId,
    period,
    trend_data: trendData,
    summary: {
      avg_composite_score: Math.round(avgComposite * 10) / 10,
      trend_direction: trendDirection,
      peak_week: trendData.reduce((max: any, w: any) => w.composite_score > max.composite_score ? w : max, trendData[0] || {}),
    },
  };
}

/* ─── Peer Benchmarking ─── */
async function benchmarkAgainstPeers(consultantId: string) {
  const [myMetrics, allMetrics] = await Promise.all([
    selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] }),
    selectMany('five_metrics', {}),
  ]);

  const myAvg = {
    new_candidates: myMetrics.reduce((s: number, m: any) => s + (m.new_candidates_added || 0), 0) / Math.max(myMetrics.length, 1),
    cv_submitted: myMetrics.reduce((s: number, m: any) => s + (m.cv_submitted || 0), 0) / Math.max(myMetrics.length, 1),
    interviews: myMetrics.reduce((s: number, m: any) => s + (m.interviews_scheduled || 0), 0) / Math.max(myMetrics.length, 1),
    placements: myMetrics.reduce((s: number, m: any) => s + (m.placements || 0), 0) / Math.max(myMetrics.length, 1),
  };

  const firmAvg = {
    new_candidates: allMetrics.reduce((s: number, m: any) => s + (m.new_candidates_added || 0), 0) / Math.max(allMetrics.length, 1),
    cv_submitted: allMetrics.reduce((s: number, m: any) => s + (m.cv_submitted || 0), 0) / Math.max(allMetrics.length, 1),
    interviews: allMetrics.reduce((s: number, m: any) => s + (m.interviews_scheduled || 0), 0) / Math.max(allMetrics.length, 1),
    placements: allMetrics.reduce((s: number, m: any) => s + (m.placements || 0), 0) / Math.max(allMetrics.length, 1),
  };

  const percentile = {
    new_candidates: calculatePercentile(myAvg.new_candidates, allMetrics.map((m: any) => m.new_candidates_added || 0)),
    cv_submitted: calculatePercentile(myAvg.cv_submitted, allMetrics.map((m: any) => m.cv_submitted || 0)),
    interviews: calculatePercentile(myAvg.interviews, allMetrics.map((m: any) => m.interviews_scheduled || 0)),
    placements: calculatePercentile(myAvg.placements, allMetrics.map((m: any) => m.placements || 0)),
  };

  return {
    consultant_id: consultantId,
    my_performance: myAvg,
    firm_average: firmAvg,
    percentile_rankings: percentile,
    overall_percentile: Math.round(Object.values(percentile).reduce((a: number, b: number) => a + b, 0) / 4),
  };
}

function calculatePercentile(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return Math.round((below / sorted.length) * 100);
}

/* ─── Success Library ─── */
async function getSuccessStories(skillArea: string) {
  const cases: any[] = [
    { id: 'case_1', title: 'Closing a Tier-1 Search in 21 Days', skill: 'closing', read_time_min: 5 },
    { id: 'case_2', title: 'Sourcing Strategy for Niche Role', skill: 'sourcing', read_time_min: 4 },
    { id: 'case_3', title: 'Negotiating Counter-Offers', skill: 'negotiation', read_time_min: 3 },
    { id: 'case_4', title: 'Client Relationship Deep Dive', skill: 'client_comm', read_time_min: 5 },
    { id: 'case_5', title: 'Interview Preparation Checklist', skill: 'interview_prep', read_time_min: 2 },
  ];

  const filtered = skillArea ? cases.filter(c => c.skill === skillArea) : cases;
  return { success_stories: filtered };
}

/* ─── Leaderboard ─── */
async function getLeaderboard(category: string, period: string) {
  const metrics = await selectMany('five_metrics', {});
  const consultantScores: Record<string, any> = {};

  for (const m of metrics) {
    const cid = m.consultant_id;
    if (!consultantScores[cid]) consultantScores[cid] = { total: 0, count: 0 };
    consultantScores[cid].total += (m[category] || 0);
    consultantScores[cid].count++;
  }

  const leaderboard = [];
  for (const [cid, data] of Object.entries(consultantScores)) {
    const consultant = await selectOne('consultants', { where: [{ column: 'id', value: cid }] });
    leaderboard.push({
      consultant_id: cid,
      name: consultant?.name || 'Unknown',
      total: (data as any).total,
      avg_per_week: Math.round(((data as any).total / Math.max((data as any).count, 1)) * 10) / 10,
    });
  }

  leaderboard.sort((a, b) => b.total - a.total);

  return { category, period, leaderboard: leaderboard.slice(0, 10) };
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
    if (resource === 'learning-recommend' && req.method === 'GET') {
      const consultantId = path[1];
      if (!consultantId) return res.status(400).json({ error: 'consultant_id required' });
      const result = await recommendModules(consultantId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'performance-trend' && req.method === 'GET') {
      const consultantId = path[1];
      if (!consultantId) return res.status(400).json({ error: 'consultant_id required' });
      const period = req.query.period as string || '8w';
      const result = await visualizePerformanceTrend(consultantId, period);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'benchmark' && req.method === 'GET') {
      const consultantId = path[1];
      if (!consultantId) return res.status(400).json({ error: 'consultant_id required' });
      const result = await benchmarkAgainstPeers(consultantId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'success-stories' && req.method === 'GET') {
      const skillArea = req.query.skill as string;
      const result = await getSuccessStories(skillArea);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'leaderboard' && req.method === 'GET') {
      const category = req.query.category as string || 'placements';
      const period = req.query.period as string || '30d';
      const result = await getLeaderboard(category, period);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(404).json({ error: `Unknown resource: /api/v21/${resource}` });
  } catch (err: any) {
    console.error('[CoachingP2] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}