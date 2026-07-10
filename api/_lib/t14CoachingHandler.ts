import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Growth Plan Generator ─── */
async function generateGrowthPlan(consultantId: string) {
  const metrics = await selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] });
  const consultant = await selectOne('consultants', { where: [{ column: 'id', value: consultantId }] });

  if (!consultant) return { error: 'Consultant not found' };

  // Calculate 12-week trends
  const recentMetrics = metrics.slice(-12);
  const avg = {
    new_candidates: recentMetrics.reduce((s: number, m: any) => s + (m.new_candidates_added || 0), 0) / Math.max(recentMetrics.length, 1),
    cv_submitted: recentMetrics.reduce((s: number, m: any) => s + (m.cv_submitted || 0), 0) / Math.max(recentMetrics.length, 1),
    interviews: recentMetrics.reduce((s: number, m: any) => s + (m.interviews_scheduled || 0), 0) / Math.max(recentMetrics.length, 1),
    offers: recentMetrics.reduce((s: number, m: any) => s + (m.offers_extended || 0), 0) / Math.max(recentMetrics.length, 1),
    placements: recentMetrics.reduce((s: number, m: any) => s + (m.placements || 0), 0) / Math.max(recentMetrics.length, 1),
  };

  // Identify strengths and gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (avg.new_candidates >= 5) strengths.push('Strong candidate sourcing');
  else gaps.push('Candidate sourcing volume');

  if (avg.cv_submitted >= 3) strengths.push('Consistent CV submission rate');
  else gaps.push('CV submission rate');

  if (avg.interviews >= 2) strengths.push('Good interview conversion');
  else gaps.push('Interview scheduling');

  if (avg.placements >= 0.5) strengths.push('Strong closing rate');
  else gaps.push('Placement conversion');

  const goals = [
    {
      goal: `Increase ${gaps[0] || 'overall productivity'} by 25%`,
      metric: gaps[0] || 'productivity',
      target: '25% improvement',
      milestones: [
        { week: 2, milestone: 'Audit current process', target: 0 },
        { week: 4, milestone: 'Implement new tactics', target: 10 },
        { week: 8, milestone: 'Mid-point review', target: 15 },
        { week: 12, milestone: 'Goal achievement', target: 25 },
      ],
    },
    {
      goal: 'Improve conversion rate from CV to Interview',
      metric: 'cv_to_interview',
      target: '40% conversion',
      milestones: [
        { week: 3, milestone: 'Review CV quality', target: 30 },
        { week: 6, milestone: 'Implement feedback loop', target: 35 },
        { week: 12, milestone: 'Achieve target', target: 40 },
      ],
    },
    {
      goal: 'Expand network in target industry',
      metric: 'network_growth',
      target: '50 new connections',
      milestones: [
        { week: 4, milestone: 'Identify key events', target: 10 },
        { week: 8, milestone: 'Attend 2 events', target: 25 },
        { week: 12, milestone: 'Reach target', target: 50 },
      ],
    },
  ];

  return {
    consultant_id: consultantId,
    consultant_name: consultant.name,
    strengths,
    gaps,
    goals,
    resources: gaps.map((g: string) => ({ gap: g, resource: `Training module: ${g}` })),
    success_criteria: 'Measurable improvement in 5-metric dashboard within 90 days',
  };
}

/* ─── Session Summarizer ─── */
function summarizeSession(sessionNotes: string, sessionType: string) {
  const notes = sessionNotes || '';

  // Extract action items (lines with verbs)
  const actionItems: any[] = [];
  const lines = notes.split('\n');
  for (const line of lines) {
    const actionMatch = line.match(/(?:action|todo|task|follow.up|next step):?\s*(.+)/i);
    if (actionMatch) {
      actionItems.push({
        item: actionMatch[1].trim(),
        owner: 'consultant',
      });
    }
  }

  // Simple sentiment analysis
  const positiveWords = ['great', 'excellent', 'good', 'progress', 'improved', 'success'];
  const negativeWords = ['struggle', 'difficult', 'challenge', 'concern', 'issue', 'problem'];
  let sentiment = 'neutral';
  const posCount = positiveWords.filter(w => notes.toLowerCase().includes(w)).length;
  const negCount = negativeWords.filter(w => notes.toLowerCase().includes(w)).length;
  if (posCount > negCount) sentiment = 'positive';
  else if (negCount > posCount) sentiment = 'negative';

  return {
    takeaways: [
      'Key discussion points captured',
      sessionType === 'coaching' ? 'Growth areas identified' : 'Feedback recorded',
    ],
    action_items: actionItems.length > 0 ? actionItems : [{ item: 'Schedule follow-up', owner: 'consultant' }],
    follow_up_dates: [],
    sentiment,
  };
}

/* ─── Assessment Interpreter ─── */
function interpretAssessment(assessmentType: string, scores: Record<string, number>) {
  const interpretations: Record<string, any> = {
    disc: {
      strengths: scores.d > 70 ? ['Decisive', 'Results-oriented'] : scores.i > 70 ? ['Enthusiastic', 'Persuasive'] : scores.s > 70 ? ['Patient', 'Supportive'] : ['Analytical', 'Precise'],
      communication_prefs: scores.d > 70 ? 'Direct, brief, bottom-line' : scores.i > 70 ? 'Expressive, social, interactive' : scores.s > 70 ? 'Steady, listener, consensus' : 'Detailed, written, factual',
      team_fit: scores.d > 70 ? 'Thrives in competitive environments' : scores.i > 70 ? 'Excels in collaborative teams' : scores.s > 70 ? 'Best in stable, supportive teams' : 'Prefers structured, methodical teams',
      development_areas: scores.d < 30 ? ['Patience with process', 'Active listening'] : scores.i < 30 ? ['Detail orientation', 'Follow-through'] : scores.s < 30 ? ['Adaptability to change', 'Assertiveness'] : ['Speed of decision', 'Risk tolerance'],
    },
    default: {
      strengths: ['Adaptable', 'Quick learner'],
      communication_prefs: 'Adaptive based on context',
      team_fit: 'Versatile across team types',
      development_areas: ['Continuous skill development'],
    },
  };

  return interpretations[assessmentType.toLowerCase()] || interpretations.default;
}

/* ─── Skill Gap Analyzer ─── */
async function analyzeSkillGaps(consultantId: string) {
  const metrics = await selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] });
  const allMetrics = await selectMany('five_metrics', {});

  // Calculate firm benchmarks
  const benchmarks: Record<string, number> = {};
  const keys = ['new_candidates_added', 'cv_submitted', 'interviews_scheduled', 'offers_extended', 'placements'];
  for (const key of keys) {
    const values = allMetrics.map((m: any) => m[key] || 0).sort((a: number, b: number) => a - b);
    benchmarks[key] = values[Math.floor(values.length * 0.5)] || 0;
  }

  // Consultant averages
  const avg: Record<string, number> = {};
  for (const key of keys) {
    avg[key] = metrics.reduce((s: number, m: any) => s + (m[key] || 0), 0) / Math.max(metrics.length, 1);
  }

  const gaps = [];
  const skillNames: Record<string, string> = {
    new_candidates_added: 'Candidate Sourcing',
    cv_submitted: 'CV Submission',
    interviews_scheduled: 'Interview Scheduling',
    offers_extended: 'Offer Extension',
    placements: 'Placement Closing',
  };

  for (const key of keys) {
    const current = avg[key] || 0;
    const target = benchmarks[key] || 1;
    const gap = target - current;
    if (gap > 0.5) {
      gaps.push({
        skill: skillNames[key],
        current_level: Math.round(current * 10) / 10,
        target_level: Math.round(target * 10) / 10,
        priority: gap > target * 0.5 ? 'high' : 'medium',
        learning_path: `Module: ${skillNames[key]} Best Practices`,
        estimated_weeks: Math.ceil(gap / Math.max(current, 1)),
      });
    }
  }

  return { consultant_id: consultantId, gaps };
}

/* ─── Progress Tracker ─── */
async function trackProgress(consultantId: string, planId?: string) {
  const metrics = await selectMany('five_metrics', { where: [{ column: 'consultant_id', value: consultantId }] });
  const recent = metrics.slice(-4);

  const goals = [
    { goal: 'Candidate Sourcing', metric: 'new_candidates_added', target: 5 },
    { goal: 'CV Submission', metric: 'cv_submitted', target: 3 },
    { goal: 'Interview Conversion', metric: 'interviews_scheduled', target: 2 },
    { goal: 'Placement Rate', metric: 'placements', target: 1 },
  ];

  const goalProgress = goals.map(g => {
    const current = recent.reduce((s: number, m: any) => s + (m[g.metric] || 0), 0) / Math.max(recent.length, 1);
    const progressPct = Math.min(Math.round((current / g.target) * 100), 100);
    return {
      goal: g.goal,
      progress_pct: progressPct,
      status: progressPct >= 80 ? 'on_track' : progressPct >= 50 ? 'at_risk' : 'behind',
      next_milestone: `${g.target} ${g.metric.replace(/_/g, ' ')} per week`,
      celebration_points: progressPct >= 100 ? ['Goal achieved!'] : [],
    };
  });

  return { consultant_id: consultantId, plan_id: planId, goals: goalProgress };
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
  const consultantId = path[1];

  try {
    if (resource === 'growth-plan' && req.method === 'POST') {
      const { consultant_id } = req.body;
      const plan = await generateGrowthPlan(consultant_id);
      return res.status(200).json({ success: true, plan });
    }

    if (resource === 'session-summary' && req.method === 'POST') {
      const { session_notes, session_type } = req.body;
      const summary = summarizeSession(session_notes, session_type);
      return res.status(200).json({ success: true, ...summary });
    }

    if (resource === 'assessment-interpret' && req.method === 'POST') {
      const { assessment_type, scores } = req.body;
      const interpretation = interpretAssessment(assessment_type, scores);
      return res.status(200).json({ success: true, ...interpretation });
    }

    if (resource === 'skill-gaps' && req.method === 'GET' && consultantId) {
      const gaps = await analyzeSkillGaps(consultantId);
      return res.status(200).json({ success: true, ...gaps });
    }

    if (resource === 'progress' && req.method === 'GET' && consultantId) {
      const planId = req.query.plan_id as string;
      const progress = await trackProgress(consultantId, planId);
      return res.status(200).json({ success: true, ...progress });
    }

    return res.status(404).json({ error: `Unknown resource: /api/v14/${resource}` });
  } catch (err: any) {
    console.error('[Coaching] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}