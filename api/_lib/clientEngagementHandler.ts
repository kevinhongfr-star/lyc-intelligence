/**
 * clientEngagementHandler — Client engagement tracking, NPS, surveys (Phase 8)
 *
 * Routes:
 *   POST /api/client-engagement/nps           — Submit NPS score (0–10)
 *   GET  /api/client-engagement/nps            — Get NPS history for client
 *   POST /api/client-engagement/survey         — Submit survey response
 *   GET  /api/client-engagement/survey/:id     — Get survey details
 *   GET  /api/client-engagement/surveys        — List available surveys
 *   POST /api/client-engagement/feedback       — Submit general feedback
 *   GET  /api/client-engagement/feedback       — List feedback history
 *   GET  /api/client-engagement/engagement    — Get engagement metrics
 *   POST /api/client-engagement/check-in       — Schedule a check-in
 *
 * Pure-logic NPS calculation and engagement scoring helpers.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  selectOne,
  selectMany,
  insert,
  update,
  isSupabaseConfigured,
  handleError,
} from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 30;

// ── Types ───────────────────────────────────────────────────────────────

export type NPSScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface NPSRecord {
  id: string;
  client_account_id: string;
  mandate_id: string | null;
  score: NPSScore;
  category: 'promoter' | 'passive' | 'detractor';
  comment: string | null;
  context: string | null;
  created_at: string;
}

export interface EngagementMetrics {
  total_logins: number;
  login_streak_days: number;
  last_login_at: string | null;
  documents_viewed: number;
  feedback_submitted: number;
  average_response_time_hours: number | null;
  nps_score: number | null;
  engagement_level: 'active' | 'moderate' | 'low' | 'inactive';
}

// ── Main handler ────────────────────────────────────────────────────────

export async function handleClientEngagement(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const pathArr = (req.query.path as string[]) || [];
    const resource = pathArr[0];
    const id = pathArr[1];
    const subResource = pathArr[2];

    if (resource === 'nps' && req.method === 'POST') return handleSubmitNPS(req, res);
    if (resource === 'nps' && req.method === 'GET') return handleGetNPS(req, res);
    if (resource === 'survey' && id && req.method === 'GET') return handleGetSurvey(req, res, id);
    if (resource === 'survey' && req.method === 'POST') return handleSubmitSurvey(req, res);
    if (resource === 'surveys' && req.method === 'GET') return handleListSurveys(req, res);
    if (resource === 'feedback' && req.method === 'POST') return handleSubmitFeedback(req, res);
    if (resource === 'feedback' && req.method === 'GET') return handleListFeedback(req, res);
    if (resource === 'engagement' && req.method === 'GET') return handleGetEngagement(req, res);
    if (resource === 'check-in' && req.method === 'POST') return handleScheduleCheckIn(req, res);

    return res.status(404).json({ success: false, error: 'Engagement route not found' });
  } catch (err) {
    return handleError(res, 'client-engagement', err);
  }
}

// ── NPS handlers ────────────────────────────────────────────────────────

async function handleSubmitNPS(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { score, mandate_id, comment, context } = req.body || {};

  if (score === undefined || score === null) {
    return res.status(400).json({ success: false, error: 'score is required (0-10)' });
  }

  const numericScore = Number(score);
  if (numericScore < 0 || numericScore > 10) {
    return res.status(400).json({ success: false, error: 'score must be between 0 and 10' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const category = classifyNPSScore(numericScore);

    const record = await insert('client_nps', {
      client_account_id: account.id,
      mandate_id: mandate_id || null,
      score: numericScore,
      category,
      comment: comment || null,
      context: context || null,
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true, nps_record: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGetNPS(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const records = await selectMany('client_nps', {
      client_account_id: account.id,
    }, ['created_at DESC'], 50, 0, '*');

    const npsScore = calculateNPS(records.map((r: any) => ({
      score: r.score,
      category: r.category,
    })));

    return res.json({ success: true, nps: npsScore, records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Survey handlers ────────────────────────────────────────────────────

async function handleGetSurvey(req: VercelRequest, res: VercelResponse, id: string) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const survey = await selectOne('surveys', {
      column: 'id', value: id, select: '*',
    }, 5000);

    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    return res.json({ success: true, survey });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleListSurveys(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const surveys = await selectMany('surveys', {
      status: 'active',
    }, ['created_at DESC'], 20, 0, '*');

    return res.json({ success: true, surveys });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleSubmitSurvey(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { survey_id, responses } = req.body || {};
  if (!survey_id || !responses) {
    return res.status(400).json({ success: false, error: 'survey_id and responses are required' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const submission = await insert('survey_submissions', {
      survey_id,
      client_account_id: account.id,
      responses: JSON.stringify(responses),
      submitted_at: new Date().toISOString(),
    });

    return res.json({ success: true, submission });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── General feedback handlers ───────────────────────────────────────────

async function handleSubmitFeedback(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { category, subject, message, mandate_id } = req.body || {};

  if (!message) {
    return res.status(400).json({ success: false, error: 'message is required' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const feedback = await insert('client_feedback_submissions', {
      client_account_id: account.id,
      category: category || 'general',
      subject: subject || null,
      message,
      mandate_id: mandate_id || null,
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true, feedback });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleListFeedback(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const feedback = await selectMany('client_feedback_submissions', {
      client_account_id: account.id,
    }, ['created_at DESC'], 50, 0, '*');

    return res.json({ success: true, feedback });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Engagement metrics ──────────────────────────────────────────────────

async function handleGetEngagement(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const [loginEvents, docViews, feedbackSubmitted, npsRecords] = await Promise.all([
      selectMany('login_events', { user_id: account.id }, ['created_at DESC'], 100, 0, 'created_at').catch(() => []),
      selectMany('document_views', { client_account_id: account.id }, [], 200, 0, 'id').catch(() => []),
      selectMany('client_shortlist_feedback', { client_mandate_access_id: account.id }, [], 100, 0, 'created_at').catch(() => []),
      selectMany('client_nps', { client_account_id: account.id }, [], 50, 0, 'score,category').catch(() => []),
    ]);

    const logins = loginEvents.map((e: any) => new Date(e.created_at));
    const totalLogins = logins.length;
    const lastLogin = logins.length > 0 ? logins[0] : null;
    const streak = computeLoginStreak(logins);

    const avgResponseTime = computeAverageResponseTime(feedbackSubmitted);
    const npsScore = calculateNPS(npsRecords);

    const engagementLevel = computeEngagementLevel(totalLogins, docViews.length, feedbackSubmitted.length);

    const metrics: EngagementMetrics = {
      total_logins: totalLogins,
      login_streak_days: streak,
      last_login_at: lastLogin?.toISOString() || null,
      documents_viewed: docViews.length,
      feedback_submitted: feedbackSubmitted.length,
      average_response_time_hours: avgResponseTime,
      nps_score: npsScore,
      engagement_level: engagementLevel,
    };

    return res.json({ success: true, metrics });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Check-in scheduling ────────────────────────────────────────────────

async function handleScheduleCheckIn(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) return res.status(401).json({ success: false, error });

  const { preferred_date, preferred_time, topic, mandate_id } = req.body || {};

  if (!preferred_date) {
    return res.status(400).json({ success: false, error: 'preferred_date is required' });
  }

  try {
    const account = await selectOne('client_accounts', {
      column: 'auth_user_id', value: user.id, select: '*',
    }, 10000);

    if (!account || !account.is_active) {
      return res.status(403).json({ success: false, error: 'No client access' });
    }

    const checkIn = await insert('client_check_ins', {
      client_account_id: account.id,
      preferred_date,
      preferred_time: preferred_time || null,
      topic: topic || 'general',
      mandate_id: mandate_id || null,
      status: 'requested',
      created_at: new Date().toISOString(),
    });

    return res.json({ success: true, check_in: checkIn });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ── Pure logic helpers (exported for testing) ───────────────────────────

export function classifyNPSScore(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function calculateNPS(records: Array<{ score: number; category: string }>): number {
  if (records.length === 0) return 0;

  let promoters = 0;
  let detractors = 0;

  for (const r of records) {
    if (r.category === 'promoter') promoters++;
    else if (r.category === 'detractor') detractors++;
  }

  const total = records.length;
  return Math.round(((promoters - detractors) / total) * 100);
}

export function computeLoginStreak(loginDates: Date[]): number {
  if (loginDates.length === 0) return 0;

  const sorted = [...loginDates].sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i]);
    d.setHours(0, 0, 0, 0);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);

    if (d.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function computeAverageResponseTime(
  feedbackRows: Array<{ created_at?: string }>,
): number | null {
  if (feedbackRows.length < 2) return null;

  const sorted = [...feedbackRows]
    .map(f => f.created_at ? new Date(f.created_at).getTime() : 0)
    .filter(t => t > 0)
    .sort((a, b) => b - a);

  if (sorted.length < 2) return null;

  const diffs: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    diffs.push(sorted[i] - sorted[i + 1]);
  }

  const avgMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return Math.round(avgMs / (1000 * 60 * 60) * 10) / 10;
}

export function computeEngagementLevel(
  totalLogins: number,
  docViews: number,
  feedbackCount: number,
): 'active' | 'moderate' | 'low' | 'inactive' {
  const score = totalLogins * 0.4 + docViews * 0.3 + feedbackCount * 0.3;

  if (score >= 20) return 'active';
  if (score >= 10) return 'moderate';
  if (score >= 5) return 'low';
  return 'inactive';
}