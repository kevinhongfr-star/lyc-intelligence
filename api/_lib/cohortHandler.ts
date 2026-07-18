/**
 * Cohort Analytics handler — Aggregate SHIFT assessment reporting
 * Issue #21: Cohort Analytics Dashboard
 *
 * Routes:
 *   GET /api/cohort/overview           — Aggregate stats across all assessments
 *   GET /api/cohort/dimensions         — Average scores by dimension
 *   GET /api/cohort/distribution       — Score distribution histograms
 *   GET /api/cohort/benchmarks         — Norm group comparisons
 *   GET /api/cohort/trends             — Score trends over time
 *   GET /api/cohort/leaderboard        — Top performers by dimension
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, selectOne, handleError, isSupabaseConfigured } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const handler = handleCohortAnalytics;

async function handleCohortAnalytics(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const { user, error: authError } = await getUserFromRequest(req);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: authError || 'Unauthorized' });
    }

    const path = (req.query as any).path || [];
    const resource = path[0];

    if (resource === 'overview' && req.method === 'GET') return handleOverview(req, res);
    if (resource === 'dimensions' && req.method === 'GET') return handleDimensions(req, res);
    if (resource === 'distribution' && req.method === 'GET') return handleDistribution(req, res);
    if (resource === 'benchmarks' && req.method === 'GET') return handleBenchmarks(req, res);
    if (resource === 'trends' && req.method === 'GET') return handleTrends(req, res);
    if (resource === 'leaderboard' && req.method === 'GET') return handleLeaderboard(req, res);

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    return handleError(res, 'cohort', err);
  }
}

async function handleOverview(req: VercelRequest, res: VercelResponse) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const period = searchParams.get('period') || '30d';

  const now = new Date();
  let startDate = new Date(0);
  if (period === '7d') startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  else if (period === '30d') startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  else if (period === '90d') startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  else if (period === '365d') startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  // Get all completed instances in period
  const instances = await selectMany(
    'shift_assessment_instances',
    {
      select: 'id,user_id,completed_at,template_id',
      where: [
        { column: 'status', value: 'completed' },
      ],
    },
    ['completed_at DESC'],
    1000,
    0,
    '*',
  );

  const filteredInstances = (instances || []).filter((i: any) => {
    if (!i.completed_at) return false;
    return new Date(i.completed_at) >= startDate;
  });

  const uniqueUsers = new Set(filteredInstances.map((i: any) => i.user_id));

  // Get composite profiles for averages
  const profiles = await selectMany(
    'shift_composite_profiles',
    { select: 'composite_score,is_valid', where: [{ column: 'is_valid', value: true }] },
    ['created_at DESC'],
    500,
    0,
    '*',
  );

  const validProfiles = (profiles || []).filter((p: any) => {
    if (!p.created_at) return false;
    return new Date(p.created_at) >= startDate;
  });

  const scores = validProfiles.map((p: any) => p.composite_score || 0).filter((s: number) => s > 0);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;

  // Completion rate
  const allInstances = await selectMany(
    'shift_assessment_instances',
    { select: 'id,status', where: [] },
    [],
    2000,
    0,
    '*',
  );
  const totalStarted = (allInstances || []).filter((i: any) =>
    i.created_at && new Date(i.created_at) >= startDate
  ).length;
  const completionRate = totalStarted > 0 ? (filteredInstances.length / totalStarted) * 100 : 0;

  return res.status(200).json({
    success: true,
    overview: {
      total_assessments: filteredInstances.length,
      unique_users: uniqueUsers.size,
      avg_composite_score: avgScore.toFixed(2),
      max_score: maxScore.toFixed(2),
      min_score: minScore.toFixed(2),
      completion_rate: completionRate.toFixed(1),
      period,
    },
  });
}

async function handleDimensions(req: VercelRequest, res: VercelResponse) {
  // Get all dimension scores with their instance info
  const dimensionScores = await selectMany(
    'shift_dimension_scores',
    { select: 'dimension,raw_score,percentile,stanine', where: [] },
    ['dimension ASC'],
    5000,
    0,
    '*',
  );

  // Group by dimension
  const dimensionMap: Record<string, { scores: number[]; percentiles: number[]; stanines: number[] }> = {};

  for (const ds of dimensionScores || []) {
    const dim = ds.dimension;
    if (!dimensionMap[dim]) {
      dimensionMap[dim] = { scores: [], percentiles: [], stanines: [] };
    }
    if (ds.raw_score != null) dimensionMap[dim].scores.push(ds.raw_score);
    if (ds.percentile != null) dimensionMap[dim].percentiles.push(ds.percentile);
    if (ds.stanine != null) dimensionMap[dim].stanines.push(ds.stanine);
  }

  const dimensions = Object.entries(dimensionMap).map(([name, data]) => {
    const avg = data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0;
    const min = data.scores.length > 0 ? Math.min(...data.scores) : 0;
    const max = data.scores.length > 0 ? Math.max(...data.scores) : 0;
    const stdDev = data.scores.length > 0
      ? Math.sqrt(data.scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / data.scores.length)
      : 0;
    const avgPercentile = data.percentiles.length > 0
      ? data.percentiles.reduce((a, b) => a + b, 0) / data.percentiles.length
      : 0;
    return {
      dimension: name,
      avg_score: avg.toFixed(2),
      min_score: min.toFixed(2),
      max_score: max.toFixed(2),
      std_dev: stdDev.toFixed(2),
      avg_percentile: avgPercentile.toFixed(1),
      sample_size: data.scores.length,
    };
  });

  return res.status(200).json({ success: true, dimensions });
}

async function handleDistribution(req: VercelRequest, res: VercelResponse) {
  const profiles = await selectMany(
    'shift_composite_profiles',
    { select: 'composite_score,is_valid', where: [{ column: 'is_valid', value: true }] },
    [],
    1000,
    0,
    '*',
  );

  const scores = (profiles || []).map((p: any) => p.composite_score || 0).filter((s: number) => s > 0);

  // Build histogram buckets (0-10, 10-20, ..., 90-100)
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${(i + 1) * 10}`,
    count: 0,
    label: `${i * 10}`,
  }));

  for (const score of scores) {
    const bucketIndex = Math.min(Math.floor(score / 10), 9);
    buckets[bucketIndex].count++;
  }

  // Stanine distribution
  const stanineBuckets = Array.from({ length: 9 }, (_, i) => ({
    stanine: i + 1,
    count: 0,
  }));

  const dimensionScores = await selectMany(
    'shift_dimension_scores',
    { select: 'stanine', where: [] },
    [],
    5000,
    0,
    '*',
  );

  for (const ds of dimensionScores || []) {
    if (ds.stanine && ds.stanine >= 1 && ds.stanine <= 9) {
      stanineBuckets[ds.stanine - 1].count++;
    }
  }

  return res.status(200).json({
    success: true,
    distribution: {
      score_histogram: buckets,
      stanine_distribution: stanineBuckets,
      total_samples: scores.length,
    },
  });
}

async function handleBenchmarks(req: VercelRequest, res: VercelResponse) {
  const normGroups = await selectMany(
    'shift_norm_groups',
    { select: '*', where: [{ column: 'is_active', value: true }] },
    ['name ASC'],
    20,
    0,
    '*',
  );

  return res.status(200).json({
    success: true,
    benchmarks: normGroups || [],
  });
}

async function handleTrends(req: VercelRequest, res: VercelResponse) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const months = parseInt(searchParams.get('months') || '6');

  const profiles = await selectMany(
    'shift_composite_profiles',
    { select: 'composite_score,created_at,is_valid', where: [{ column: 'is_valid', value: true }] },
    ['created_at ASC'],
    2000,
    0,
    '*',
  );

  const now = new Date();
  const trends: { month: string; avg_score: number; count: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short' });

    const monthProfiles = (profiles || []).filter((p: any) => {
      const created = new Date(p.created_at);
      return created >= monthDate && created <= monthEnd;
    });

    const scores = monthProfiles.map((p: any) => p.composite_score || 0).filter((s: number) => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    trends.push({
      month: monthLabel,
      avg_score: parseFloat(avg.toFixed(2)),
      count: scores.length,
    });
  }

  return res.status(200).json({ success: true, trends });
}

async function handleLeaderboard(req: VercelRequest, res: VercelResponse) {
  const { searchParams } = new URL(req.url || '', 'http://localhost');
  const dimension = searchParams.get('dimension');
  const limit = parseInt(searchParams.get('limit') || '20');

  let query = {
    select: 'user_id,composite_score,leadership_style,strengths,benchmark_percentile,created_at',
    where: [{ column: 'is_valid', value: true }],
  };

  const profiles = await selectMany(
    'shift_composite_profiles',
    query,
    ['composite_score DESC'],
    limit,
    0,
    '*',
  );

  return res.status(200).json({
    success: true,
    leaderboard: profiles || [],
  });
}