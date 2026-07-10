import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectOne, selectMany, insert, isSupabaseConfigured } from './supabaseRest.js';

async function handleSnapshot(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const snapshotDate = path[0];

  try {
    if (req.method === 'POST') {
      const [mandates, candidates, pipeline, consultants, flags] = await Promise.all([
        selectMany('mandates', { is_deleted: false }),
        selectMany('candidates', {}),
        selectMany('mandate_candidates', {}),
        selectMany('consultants', {}),
        selectMany('auto_flags', { status: { neq: 'resolved' } }),
      ]);

      const byTier: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byConsultant: Record<string, number> = {};
      const revenuePipeline: Record<string, number> = {};

      for (const m of mandates) {
        byTier[m.priority_tier] = (byTier[m.priority_tier] || 0) + 1;
        byStatus[m.status] = (byStatus[m.status] || 0) + 1;
        if (m.consultant_id) {
          byConsultant[m.consultant_id] = (byConsultant[m.consultant_id] || 0) + 1;
        }
        if (m.salary_range_min && m.salary_range_max) {
          const mid = (m.salary_range_min + m.salary_range_max) / 2;
          const fee = mid * 0.2;
          revenuePipeline[m.status] = (revenuePipeline[m.status] || 0) + fee;
        }
      }

      const healthScore = calculateHealthScore(mandates, pipeline, consultants, flags);

      const result = await insert('dashboard_snapshots', {
        snapshot_date: new Date().toISOString().split('T')[0],
        generated_by: 'manual',
        total_mandates: mandates.length,
        by_tier: byTier,
        by_status: byStatus,
        by_consultant: byConsultant,
        revenue_pipeline: revenuePipeline,
        auto_flags: flags.map(f => ({
          id: f.id,
          type: f.flag_type,
          severity: f.severity,
        })),
        health_score: healthScore,
        changes_from_previous: {},
        raw_data_hash: generateHash(JSON.stringify({ mandates, pipeline })),
      });

      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === 'GET') {
      if (snapshotDate) {
        const snapshot = await selectOne('dashboard_snapshots', { snapshot_date: snapshotDate });
        if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });
        return res.status(200).json(snapshot);
      }

      const snapshots = await selectMany('dashboard_snapshots', {}, 30);
      return res.status(200).json(snapshots);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Dashboard Snapshot] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function calculateHealthScore(mandates: any[], pipeline: any[], consultants: any[], flags: any[]): number {
  let score = 100;

  const overdueMandates = mandates.filter(m => m.deadline && new Date(m.deadline) < new Date()).length;
  score -= overdueMandates * 10;

  const zeroPipeline = mandates.filter(m => !pipeline.some(p => p.mandate_id === m.id)).length;
  score -= zeroPipeline * 15;

  const overloadedConsultants = consultants.filter(c => c.current_load >= c.max_capacity).length;
  score -= overloadedConsultants * 8;

  const criticalFlags = flags.filter(f => f.severity === 'critical').length;
  score -= criticalFlags * 12;

  const highFlags = flags.filter(f => f.severity === 'high').length;
  score -= highFlags * 6;

  return Math.max(0, Math.min(100, score));
}

function generateHash(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 32);
}

async function handleLive(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const [mandates, candidates, pipeline, consultants, flags] = await Promise.all([
      selectMany('mandates', { is_deleted: false }),
      selectMany('candidates', {}),
      selectMany('mandate_candidates', {}),
      selectMany('consultants', {}),
      selectMany('auto_flags', { status: { neq: 'resolved' } }),
    ]);

    const stats = {
      overview: {
        total_mandates: mandates.length,
        total_candidates: candidates.length,
        total_pipeline_entries: pipeline.length,
        total_consultants: consultants.length,
        active_flags: flags.length,
      },
      mandates: {
        by_status: mandates.reduce((acc: Record<string, number>, m: any) => {
          acc[m.status] = (acc[m.status] || 0) + 1;
          return acc;
        }, {}),
        by_tier: mandates.reduce((acc: Record<string, number>, m: any) => {
          acc[m.priority_tier] = (acc[m.priority_tier] || 0) + 1;
          return acc;
        }, {}),
        by_consultant: consultants.map(c => ({
          id: c.id,
          name: c.name,
          count: mandates.filter((m: any) => m.consultant_id === c.id).length,
        })),
      },
      pipeline: {
        by_stage: pipeline.reduce((acc: Record<string, number>, p: any) => {
          acc[p.stage] = (acc[p.stage] || 0) + 1;
          return acc;
        }, {}),
        avg_days_in_stage: pipeline.length > 0
          ? Math.round(pipeline.reduce((sum: number, p: any) => sum + (p.days_in_stage || 0), 0) / pipeline.length)
          : 0,
      },
      candidates: {
        by_status: candidates.reduce((acc: Record<string, number>, c: any) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {}),
        by_source: candidates.reduce((acc: Record<string, number>, c: any) => {
          acc[c.source] = (acc[c.source] || 0) + 1;
          return acc;
        }, {}),
      },
      consultants: {
        capacity: consultants.map(c => ({
          id: c.id,
          name: c.name,
          current_load: c.current_load,
          max_capacity: c.max_capacity,
          ratio: c.current_load / c.max_capacity,
        })),
        overloaded: consultants.filter(c => c.current_load >= c.max_capacity).length,
        at_capacity: consultants.filter(c => c.current_load >= c.max_capacity * 0.8 && c.current_load < c.max_capacity).length,
      },
      flags: {
        by_severity: flags.reduce((acc: Record<string, number>, f: any) => {
          acc[f.severity] = (acc[f.severity] || 0) + 1;
          return acc;
        }, {}),
        by_type: flags.reduce((acc: Record<string, number>, f: any) => {
          acc[f.flag_type] = (acc[f.flag_type] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    return res.status(200).json(stats);
  } catch (err: any) {
    console.error('[Dashboard Live] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleAnalytics(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  const path = (req.query as any).path || [];
  const metric = path[0];

  try {
    const [mandates, pipeline, fiveMetrics] = await Promise.all([
      selectMany('mandates', { is_deleted: false }),
      selectMany('mandate_candidates', {}),
      selectMany('five_metrics', {}),
    ]);

    const response: Record<string, any> = {};

    if (metric === 'conversion' || !metric) {
      const totalSubmitted = pipeline.filter(p => p.stage === 'submitted').length;
      const totalScreened = pipeline.filter(p => p.stage === 'screening').length;
      const totalInterviewed = pipeline.filter(p => p.stage === 'first_interview' || p.stage === 'second_interview' || p.stage === 'final_interview').length;
      const totalOffered = pipeline.filter(p => p.stage === 'offer_pending').length;
      const totalAccepted = pipeline.filter(p => p.stage === 'offer_accepted').length;

      response.conversion = {
        submission_to_screening: totalSubmitted > 0 ? Math.round((totalScreened / totalSubmitted) * 100) : 0,
        screening_to_interview: totalScreened > 0 ? Math.round((totalInterviewed / totalScreened) * 100) : 0,
        interview_to_offer: totalInterviewed > 0 ? Math.round((totalOffered / totalInterviewed) * 100) : 0,
        offer_to_acceptance: totalOffered > 0 ? Math.round((totalAccepted / totalOffered) * 100) : 0,
      };
    }

    if (metric === 'time_to_fill' || !metric) {
      const closedWon = mandates.filter(m => m.status === 'closed_won' && m.created_at && m.target_start_date);
      const avgDays = closedWon.length > 0
        ? Math.round(closedWon.reduce((sum, m) => {
          const created = new Date(m.created_at);
          const target = new Date(m.target_start_date);
          return sum + Math.floor((target.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }, 0) / closedWon.length)
        : 0;

      response.time_to_fill = {
        avg_days: avgDays,
        closed_won_count: closedWon.length,
      };
    }

    if (metric === 'productivity' || !metric) {
      const weeklyData: Record<string, any[]> = {};
      for (const m of fiveMetrics) {
        const week = m.week_start_date;
        if (!weeklyData[week]) weeklyData[week] = [];
        weeklyData[week].push(m);
      }

      response.productivity = {
        weekly_data: Object.entries(weeklyData).map(([week, entries]) => ({
          week,
          new_candidates: entries.reduce((sum, e) => sum + (e.new_candidates_added || 0), 0),
          cv_submitted: entries.reduce((sum, e) => sum + (e.cv_submitted || 0), 0),
          interviews: entries.reduce((sum, e) => sum + (e.interviews_scheduled || 0), 0),
          offers: entries.reduce((sum, e) => sum + (e.offers_extended || 0), 0),
          placements: entries.reduce((sum, e) => sum + (e.placements || 0), 0),
        })),
      };
    }

    if (metric === 'revenue' || !metric) {
      let totalPipelineValue = 0;
      for (const m of mandates) {
        if (m.salary_range_min && m.salary_range_max) {
          const mid = (m.salary_range_min + m.salary_range_max) / 2;
          totalPipelineValue += mid * 0.2;
        }
      }

      response.revenue = {
        pipeline_value: totalPipelineValue,
        recognized: fiveMetrics.reduce((sum, m) => sum + (m.revenue_recognized || 0), 0),
      };
    }

    return res.status(200).json(response);
  } catch (err: any) {
    console.error('[Analytics] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleActivity(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const activities = await selectMany('activity_logs', {}, 50);

    const recent = activities.slice(0, 20).map(a => ({
      id: a.id,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      action: a.action,
      actor_id: a.actor_id,
      from_value: a.from_value,
      to_value: a.to_value,
      created_at: a.created_at,
      metadata: a.metadata,
    }));

    const byAction = activities.reduce((acc: Record<string, number>, a: any) => {
      acc[a.action] = (acc[a.action] || 0) + 1;
      return acc;
    }, {});

    const byEntity = activities.reduce((acc: Record<string, number>, a: any) => {
      acc[a.entity_type] = (acc[a.entity_type] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      recent,
      summary: {
        by_action: byAction,
        by_entity: byEntity,
        total: activities.length,
      },
    });
  } catch (err: any) {
    console.error('[Activity] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const path = (req.query as any).path || [];
  const resource = path[0];

  switch (resource) {
    case 'snapshot':
      return handleSnapshot(req, res);
    case 'live':
      return handleLive(req, res);
    case 'analytics':
      return handleAnalytics(req, res);
    case 'activity':
      return handleActivity(req, res);
    default:
      return res.status(404).json({ error: `Unknown resource: /api/v3/${resource}` });
  }
}