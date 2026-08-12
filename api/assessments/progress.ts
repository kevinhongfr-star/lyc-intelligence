/**
 * /api/assessments/progress — Authenticated assessment progress tracking.
 * Ticket #1334 — API endpoint for authenticated progress.
 *
 * GET  /api/assessments/progress
 *   Returns all progress rows for the authenticated user.
 * GET  /api/assessments/progress?code=CPI
 *   Returns a single progress row for the given assessment.
 * POST /api/assessments/progress
 *   Body: { assessment_code, total_questions, assessment_id? }
 *   Starts or resumes an assessment. Returns the progress row.
 * PATCH /api/assessments/progress
 *   Body: { assessment_code, question_id?, answer?, current_question?, status?, result_id?, miles_spent? }
 *   Updates progress (saves answer, advances question, or completes).
 *
 * Security:
 *   - Authorization: Bearer <supabase JWT> required
 *   - RLS enforces user_id = auth.uid() on all operations
 *   - user_id is set server-side from JWT — never trusted from client
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import { getAuthorizedContext, RequestAuthError } from '../lib/auth.js';
import { logServerError } from '../lib/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let ctx;
  try {
    // #1309: getAuthorizedContext takes (req, allowAnonymous:boolean).
    // Previously called with `{ requireAuth: true }` which is truthy
    // and thus treated as allowAnonymous=true — auth bypass.
    ctx = await getAuthorizedContext(req, false);
  } catch (err) {
    if (err instanceof RequestAuthError) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    throw err;
  }

  const supabase = createClient();
  const userId = ctx.userId;

  // ── GET: fetch progress ──────────────────────────────────────
  if (req.method === 'GET') {
    const code = (req.query.code as string)?.toUpperCase();
    try {
      if (code) {
        const { data, error } = await supabase
          .from('user_assessment_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('assessment_code', code)
          .maybeSingle();
        if (error) throw error;
        return res.status(200).json({ ok: true, data });
      }

      const { data, error } = await supabase
        .from('user_assessment_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ ok: true, data: data || [] });
    } catch (err: any) {
      logServerError('api/assessments/progress GET', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to fetch progress' });
    }
  }

  // ── POST: start or resume ────────────────────────────────────
  if (req.method === 'POST') {
    const { assessment_code, total_questions, assessment_id } = req.body || {};
    if (!assessment_code) {
      return res.status(400).json({ ok: false, error: 'assessment_code is required' });
    }

    try {
      // Check if progress already exists
      const { data: existing } = await supabase
        .from('user_assessment_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_code', assessment_code.toUpperCase())
        .maybeSingle();

      if (existing && existing.status === 'in_progress') {
        return res.status(200).json({ ok: true, data: existing });
      }

      const { data, error } = await supabase
        .from('user_assessment_progress')
        .upsert({
          user_id: userId,
          assessment_code: assessment_code.toUpperCase(),
          assessment_id: assessment_id || null,
          status: 'in_progress',
          current_question: 0,
          total_questions: total_questions || 0,
          answers: {},
          started_at: new Date().toISOString(),
          completed_at: null,
          miles_spent: 0,
        }, { onConflict: 'user_id,assessment_code' })
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    } catch (err: any) {
      logServerError('api/assessments/progress POST', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to start assessment' });
    }
  }

  // ── PATCH: save answer / advance / complete ──────────────────
  if (req.method === 'PATCH') {
    const { assessment_code, question_id, answer, current_question, status, result_id, miles_spent } = req.body || {};
    if (!assessment_code) {
      return res.status(400).json({ ok: false, error: 'assessment_code is required' });
    }

    try {
      // Fetch current progress to merge answers
      const { data: progress, error: fetchErr } = await supabase
        .from('user_assessment_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('assessment_code', assessment_code.toUpperCase())
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!progress) {
        return res.status(404).json({ ok: false, error: 'No progress found for this assessment' });
      }

      const update: any = { updated_at: new Date().toISOString() };
      if (question_id !== undefined && answer !== undefined) {
        update.answers = { ...progress.answers, [question_id]: answer };
      }
      if (current_question !== undefined) update.current_question = current_question;
      if (status) {
        update.status = status;
        if (status === 'completed') update.completed_at = new Date().toISOString();
      }
      if (result_id) update.result_id = result_id;
      if (miles_spent !== undefined) update.miles_spent = miles_spent;

      const { data, error } = await supabase
        .from('user_assessment_progress')
        .update(update)
        .eq('id', progress.id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ ok: true, data });
    } catch (err: any) {
      logServerError('api/assessments/progress PATCH', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to update progress' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
