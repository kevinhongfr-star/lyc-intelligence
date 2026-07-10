import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';
import { selectMany, selectOne, insert, update, isSupabaseConfigured } from './supabaseRest.js';

/* ─── Interview Scheduling Assistant ─── */
async function scheduleInterview(candidateId: string, mandateId: string, interviewType: string, proposedTimes: string[]) {
  const [candidate, mandate] = await Promise.all([
    selectOne('candidates', { where: [{ column: 'id', value: candidateId }] }),
    selectOne('mandates', { where: [{ column: 'id', value: mandateId }] }),
  ]);

  if (!candidate || !mandate) return { error: 'Candidate or mandate not found' };

  const scheduled = await insert('interview_schedule', {
    candidate_id: candidateId,
    mandate_id: mandateId,
    interview_type: interviewType,
    proposed_times: proposedTimes,
    status: 'pending_confirmation',
    created_at: new Date().toISOString(),
  });

  return {
    success: true,
    interview_id: scheduled.id,
    candidate_name: `${candidate.first_name} ${candidate.last_name}`,
    position: mandate.position_title,
    interview_type,
    proposed_times,
    status: 'pending_confirmation',
    next_steps: 'Awaiting candidate confirmation',
  };
}

/* ─── Reference Tracker ─── */
async function trackReferences(candidateId: string) {
  const candidate = await selectOne('candidates', { where: [{ column: 'id', value: candidateId }] });
  if (!candidate) return { error: 'Candidate not found' };

  // Simulated reference tracking
  const references = [
    { type: 'professional', name: 'Previous Manager', status: 'pending', requested_at: new Date().toISOString() },
    { type: 'professional', name: 'Colleague', status: 'pending', requested_at: new Date().toISOString() },
  ];

  return {
    candidate_id: candidateId,
    candidate_name: `${candidate.first_name} ${candidate.last_name}`,
    references,
    completion_pct: 0,
    notes: 'Reference requests initiated',
  };
}

/* ─── Document Checklist ─── */
async function generateDocumentChecklist(candidateId: string, mandateId: string) {
  const [candidate, mandate] = await Promise.all([
    selectOne('candidates', { where: [{ column: 'id', value: candidateId }] }),
    selectOne('mandates', { where: [{ column: 'id', value: mandateId }] }),
  ]);

  if (!candidate || !mandate) return { error: 'Candidate or mandate not found' };

  const checklist = [
    { item: 'Updated CV', status: candidate.cv_file_url ? 'received' : 'pending', required: true },
    { item: 'Portfolio/Work Samples', status: 'pending', required: false },
    { item: 'ID Document', status: 'pending', required: true },
    { item: 'Education Certificates', status: 'pending', required: true },
    { item: 'Employment Certificates', status: 'pending', required: true },
    { item: 'Reference Letters', status: 'pending', required: false },
  ];

  const received = checklist.filter(c => c.status === 'received').length;
  const completionPct = Math.round((received / checklist.length) * 100);

  return {
    candidate_id: candidateId,
    mandate_id: mandateId,
    checklist,
    completion_pct: completionPct,
    missing_items: checklist.filter(c => c.status === 'pending' && c.required),
  };
}

/* ─── Salary Calculator ─── */
function calculateSalaryExpectations(currentSalary: number, targetRole: string, experience: number, location: string) {
  // Simplified salary bands
  const locationMultiplier: Record<string, number> = {
    'Hong Kong': 1.0,
    'Shanghai': 0.9,
    'Singapore': 0.95,
    'Bangkok': 0.6,
    'Jakarta': 0.5,
  };

  const baseMultiplier = 1 + (experience * 0.02);
  const locMult = locationMultiplier[location] || 0.8;

  const expectedMin = Math.round(currentSalary * baseMultiplier * locMult * 0.95);
  const expectedMax = Math.round(currentSalary * baseMultiplier * locMult * 1.15);
  const marketAvg = Math.round(currentSalary * baseMultiplier * locMult);

  return {
    current_salary: currentSalary,
    location,
    experience_years: experience,
    expected_range: { min: expectedMin, max: expectedMax },
    market_average: marketAvg,
    negotiation_tips: [
      'Research company compensation philosophy',
      'Highlight unique value proposition',
      'Consider total compensation (bonus, equity, benefits)',
    ],
  };
}

/* ─── Offer Status Tracker ─── */
async function trackOfferStatus(candidateId: string, mandateId: string) {
  const pipeline = await selectOne('mandate_candidates', {
    where: [{ column: 'candidate_id', value: candidateId }, { column: 'mandate_id', value: mandateId }],
  });

  if (!pipeline) return { error: 'Pipeline entry not found' };

  const stages = ['offer_extended', 'offer_negotiation', 'offer_accepted', 'onboarding'];
  const currentStage = pipeline.stage || 'offer_extended';

  const statusFlow = stages.map((stage, idx) => ({
    stage,
    label: stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    status: stages.indexOf(currentStage) >= idx ? 'completed' : stages.indexOf(currentStage) === idx - 1 ? 'current' : 'upcoming',
  }));

  return {
    candidate_id: candidateId,
    mandate_id: mandateId,
    current_stage: currentStage,
    status_flow: statusFlow,
    next_steps: currentStage === 'offer_extended' ? 'Awaiting candidate response' : currentStage === 'offer_negotiation' ? 'Negotiation in progress' : 'Proceed to onboarding',
  };
}

/* ─── Onboarding Timeline ─── */
function generateOnboardingTimeline(startDate: string, mandateId: string) {
  const start = new Date(startDate);
  const timeline: any[] = [
    { day: -7, task: 'Send welcome package', status: 'upcoming' },
    { day: -3, task: 'IT setup request', status: 'upcoming' },
    { day: 0, task: 'First day orientation', status: 'upcoming' },
    { day: 1, task: 'Team introductions', status: 'upcoming' },
    { day: 7, task: 'Week 1 check-in', status: 'upcoming' },
    { day: 30, task: '30-day review', status: 'upcoming' },
    { day: 90, task: '90-day probation review', status: 'upcoming' },
  ];

  const timelineWithDates = timeline.map(t => ({
    ...t,
    date: new Date(start.getTime() + t.day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));

  return {
    start_date: startDate,
    mandate_id: mandateId,
    timeline: timelineWithDates,
    total_days: 90,
  };
}

/* ─── Candidate Experience Survey ─── */
async function submitSurvey(candidateId: string, mandateId: string, ratings: Record<string, number>, feedback: string) {
  const survey = await insert('candidate_surveys', {
    candidate_id: candidateId,
    mandate_id: mandateId,
    ratings,
    feedback,
    submitted_at: new Date().toISOString(),
  });

  const avgRating = Object.values(ratings).reduce((a: number, b: number) => a + b, 0) / Object.values(ratings).length;

  return {
    success: true,
    survey_id: survey.id,
    avg_rating: Math.round(avgRating * 10) / 10,
    sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative',
  };
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
    if (resource === 'interview-schedule' && req.method === 'POST') {
      const { candidate_id, mandate_id, interview_type, proposed_times } = req.body;
      const result = await scheduleInterview(candidate_id, mandate_id, interview_type, proposed_times);
      return res.status(201).json(result);
    }

    if (resource === 'references' && req.method === 'GET') {
      const candidateId = path[1];
      if (!candidateId) return res.status(400).json({ error: 'candidate_id required' });
      const result = await trackReferences(candidateId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'document-checklist' && req.method === 'GET') {
      const candidateId = path[1];
      const mandateId = req.query.mandate_id as string;
      if (!candidateId || !mandateId) return res.status(400).json({ error: 'candidate_id and mandate_id required' });
      const result = await generateDocumentChecklist(candidateId, mandateId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'salary-calculator' && req.method === 'POST') {
      const { current_salary, target_role, experience, location } = req.body;
      const result = calculateSalaryExpectations(current_salary, target_role, experience, location);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'offer-status' && req.method === 'GET') {
      const candidateId = path[1];
      const mandateId = req.query.mandate_id as string;
      if (!candidateId || !mandateId) return res.status(400).json({ error: 'candidate_id and mandate_id required' });
      const result = await trackOfferStatus(candidateId, mandateId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'onboarding-timeline' && req.method === 'GET') {
      const startDate = req.query.start_date as string;
      const mandateId = req.query.mandate_id as string;
      if (!startDate || !mandateId) return res.status(400).json({ error: 'start_date and mandate_id required' });
      const result = generateOnboardingTimeline(startDate, mandateId);
      return res.status(200).json({ success: true, ...result });
    }

    if (resource === 'survey' && req.method === 'POST') {
      const { candidate_id, mandate_id, ratings, feedback } = req.body;
      const result = await submitSurvey(candidate_id, mandate_id, ratings, feedback);
      return res.status(201).json(result);
    }

    return res.status(404).json({ error: `Unknown resource: /api/v22/${resource}` });
  } catch (err: any) {
    console.error('[CandidateP2] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}