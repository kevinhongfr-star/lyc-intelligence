/**
 * /api/assessments/meta — Consolidated assessment-support endpoint.
 *
 * Vercel Hobby plan caps serverless functions at 12 per deployment.
 * Merges three former endpoints into one handler to reduce count:
 *
 *   api/assessments/catalog.ts  (GET list/single — public)
 *   api/assessments/progress.ts (GET/POST/PATCH — authenticated)
 *   api/assessments/share.ts    (GET/POST/DELETE — auth, except token-fetch public)
 *
 * Routing by query param:
 *   ?action=catalog[&code=CPI]                 → catalog logic
 *   ?action=progress[&code=CPI]                → progress logic
 *   ?action=share                               → share list/create/revoke
 *   ?action=share&token=<token>                → public share fetch (no auth)
 *
 * The request METHOD combined with the action routes to the original behavior.
 * All original contracts (HTTP status codes, auth requirements, error messages,
 * response shapes, Zod validation, rate limits) are preserved VERBATIM.
 *
 * DO NOT import /api/assessments/run.ts here — it stays separate (big engine).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import { getAuthorizedContext, RequestAuthError } from '../lib/auth.js';
import {
  assertBodySize,
  assertUrlLength,
  assertUuid,
  clampInt,
  handleApiError,
  logServerError,
  parseJsonBody,
  DEFAULT_BODY_LIMIT,
  rateLimit,
  setRateLimitHeaders,
} from '../lib/validate.js';
import { z } from 'zod';
import { getAssessmentRequiredTier } from '../../src/config/miles';
import { normalizeTier, tierMeets, DEFAULT_TIER } from '../../src/config/tiers';

// ================================================================
// ACTION: catalog (public, GET only)
// ================================================================
async function runCatalog(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabase = createClient();
  const code = (req.query.code as string)?.toUpperCase();

  // P1-1: resolve the viewer OPTIONALLY so the public catalog stays
  // browsable without login (no 401). When a bearer token is present we
  // compute per-assessment `can_access` against the viewer's tier;
  // otherwise we use the explorer floor so locked/unlocked states render
  // sensibly for anonymous visitors.
  let viewerTier: string = DEFAULT_TIER;
  try {
    const ctx = await getAuthorizedContext(req, true);
    if (ctx?.tier) viewerTier = ctx.tier;
  } catch {
    // Malformed/expired token — treat as anonymous explorer (not a 401).
  }
  const canonicalViewer = normalizeTier(viewerTier) ?? DEFAULT_TIER;

  // Annotate a catalog row with server-side access metadata.
  const annotate = (row: any) => {
    if (!row) return row;
    const requiredTier = getAssessmentRequiredTier(String(row.code ?? ''));
    return {
      ...row,
      required_tier: requiredTier,
      can_access: tierMeets(canonicalViewer, requiredTier),
    };
  };

  try {
    if (code) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('code', code)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ ok: false, error: 'Assessment not found' });
      }
      return res.status(200).json({ ok: true, data: annotate(data) });
    }

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ ok: true, data: (data || []).map(annotate) });
  } catch (err: any) {
    logServerError('api/assessments/meta?action=catalog', err, req);
    return res.status(500).json({ ok: false, error: 'Failed to fetch assessment catalog' });
  }
}

// ================================================================
// ACTION: progress (authenticated, GET/POST/PATCH)
// ================================================================
async function runProgress(req: VercelRequest, res: VercelResponse, userId: string) {
  const supabase = createClient();

  // ── GET: fetch progress ──
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
      logServerError('api/assessments/meta?action=progress GET', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to fetch progress' });
    }
  }

  // ── POST: start or resume ──
  if (req.method === 'POST') {
    const { assessment_code, total_questions, assessment_id } = parseJsonBody<{
      assessment_code?: string;
      total_questions?: number;
      assessment_id?: string;
    }>(req);
    if (!assessment_code) {
      return res.status(400).json({ ok: false, error: 'assessment_code is required' });
    }

    try {
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
      logServerError('api/assessments/meta?action=progress POST', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to start assessment' });
    }
  }

  // ── PATCH: save answer / advance / complete ──
  if (req.method === 'PATCH') {
    const body = parseJsonBody<{
      assessment_code?: string;
      question_id?: string;
      answer?: unknown;
      current_question?: number;
      status?: string;
      result_id?: string;
      miles_spent?: number;
    }>(req);
    const { assessment_code, question_id, answer, current_question, status, result_id, miles_spent } = body;
    if (!assessment_code) {
      return res.status(400).json({ ok: false, error: 'assessment_code is required' });
    }

    try {
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
      logServerError('api/assessments/meta?action=progress PATCH', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to update progress' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// ================================================================
// ACTION: share (public token fetch, rest authenticated)
// ================================================================
async function runShare(
  req: VercelRequest,
  res: VercelResponse,
  userId: string | null,
) {
  const supabase = createClient();

  // ── Public read by token: GET + ?token=xxx ──
  if (req.method === 'GET' && req.query.token) {
    const token = req.query.token as string;
    try {
      const { data, error } = await supabase
        .from('assessment_shares')
        .select('shared_payload, expires_at, revoked_at, view_count, max_views')
        .eq('share_token', token)
        .maybeSingle();

      if (error) throw error;
      if (!data) return res.status(404).json({ ok: false, error: 'Share link not found' });
      if (data.revoked_at) return res.status(410).json({ ok: false, error: 'Share link has been revoked' });
      if (new Date(data.expires_at) < new Date()) {
        return res.status(410).json({ ok: false, error: 'Share link has expired' });
      }
      if (data.max_views !== null && data.view_count >= data.max_views) {
        return res.status(429).json({ ok: false, error: 'Share link view limit reached' });
      }

      supabase
        .from('assessment_shares')
        .update({ view_count: data.view_count + 1 })
        .eq('share_token', token)
        .then(() => {});

      return res.status(200).json({ ok: true, payload: data.shared_payload });
    } catch (err: any) {
      logServerError('api/assessments/meta?action=share GET by token', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to fetch shared result' });
    }
  }

  // ── All other share operations require auth ──
  if (userId === null) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // ── GET: list user's share links ──
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('assessment_shares')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ ok: true, data: data || [] });
    } catch (err: any) {
      logServerError('api/assessments/meta?action=share GET list', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to list share links' });
    }
  }

  // ── POST: create share link ──
  if (req.method === 'POST') {
    const rl = rateLimit(req, userId);
    setRateLimitHeaders(res, rl, 20);
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many share link requests — please retry in a moment',
      });
    }

    assertBodySize(req.body, DEFAULT_BODY_LIMIT);
    const rawBody = parseJsonBody<{
      result_id?: string;
      assessment_code?: string;
      payload?: unknown;
      max_views?: number;
    }>(req);

    const ShareCreateSchema = z.object({
      result_id: z.string().uuid(),
      assessment_code: z.string().min(1).max(32),
      payload: z.record(z.string(), z.any()).or(z.array(z.any())),
      max_views: z.number().int().min(0).max(1_000_000).optional(),
    });
    let body: typeof rawBody;
    try {
      body = ShareCreateSchema.parse(rawBody);
    } catch (zErr: any) {
      const first = zErr?.issues?.[0];
      const msg = first
        ? `Invalid input at ${first.path.join('.')}: ${first.message}`
        : 'Invalid share body';
      return res.status(422).json({ ok: false, error: msg.slice(0, 200) });
    }

    const { result_id, assessment_code, payload, max_views } = body;

    if (!result_id || !assessment_code || !payload) {
      return res.status(400).json({ ok: false, error: 'result_id, assessment_code, and payload are required' });
    }
    try {
      assertUuid(String(result_id), 'result_id');
    } catch (e: any) {
      return res.status(422).json({ ok: false, error: e.message });
    }
    const code = String(assessment_code).toUpperCase().slice(0, 32);

    try {
      const token = generateShareToken();

      const { data, error } = await supabase
        .from('assessment_shares')
        .insert({
          share_token: token,
          owner_id: userId,
          result_id,
          assessment_code: code,
          shared_payload: payload,
          max_views: clampInt(max_views, 0, 1_000_000, 0) || null,
        })
        .select()
        .single();

      if (error) throw error;

      const origin = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'https://lyc-partners.ai';
      const share_url = `${origin}/share/${token}`;

      return res.status(201).json({
        ok: true,
        share_token: token,
        share_url,
        expires_at: data.expires_at,
      });
    } catch (err: any) {
      logServerError('api/assessments/meta?action=share POST', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to create share link' });
    }
  }

  // ── DELETE: revoke share link ──
  if (req.method === 'DELETE') {
    const rl = rateLimit(req, userId);
    setRateLimitHeaders(res, rl, 20);
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many share revocation requests',
      });
    }
    const rawDel = parseJsonBody<{ share_id?: string }>(req);

    const ShareDeleteSchema = z.object({ share_id: z.string().uuid() });
    let shareDelBody: { share_id?: string };
    try {
      shareDelBody = ShareDeleteSchema.parse(rawDel);
    } catch (_zErr) {
      return res.status(422).json({ ok: false, error: 'Invalid share_id (expected UUID)' });
    }
    const { share_id } = shareDelBody;
    if (!share_id) {
      return res.status(400).json({ ok: false, error: 'share_id is required' });
    }
    try {
      assertUuid(String(share_id), 'share_id');
    } catch (e: any) {
      return res.status(422).json({ ok: false, error: e.message });
    }

    try {
      const { error } = await supabase
        .from('assessment_shares')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', share_id)
        .eq('owner_id', userId);

      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      logServerError('api/assessments/meta?action=share DELETE', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to revoke share link' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

// ================================================================
// Dispatcher
// ================================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Shared URL-length assert (applies to all actions).
  try {
    assertUrlLength(req);
  } catch (e) {
    handleApiError(res, e, 'api/assessments/meta url-length', req);
    return;
  }

  const actionRaw = req.query.action as string | undefined;
  const action = actionRaw?.toLowerCase();

  if (action === 'catalog') {
    return runCatalog(req, res);
  }

  // Progress and share MAY need auth context; share?token=xxx is public.
  const publicShareFetch = action === 'share' && req.method === 'GET' && req.query.token;

  let userId: string | null = null;
  if (action === 'progress' || (action === 'share' && !publicShareFetch)) {
    let ctx;
    try {
      ctx = await getAuthorizedContext(req, false);
    } catch (err) {
      if (err instanceof RequestAuthError) {
        return res.status(err.status).json({ ok: false, error: err.message });
      }
      throw err;
    }
    userId = ctx.userId;
  }

  if (action === 'progress') {
    return runProgress(req, res, userId!);
  }
  if (action === 'share') {
    return runShare(req, res, userId);
  }

  return res.status(400).json({
    ok: false,
    error: 'Missing or invalid ?action query parameter',
    available: ['catalog', 'progress', 'share'],
    examples: [
      'GET  /api/assessments/meta?action=catalog',
      'GET  /api/assessments/meta?action=catalog&code=CPI',
      'GET  /api/assessments/meta?action=progress',
      'POST /api/assessments/meta?action=progress',
      'PATCH /api/assessments/meta?action=progress',
      'GET  /api/assessments/meta?action=share&token=<token>',
      'GET  /api/assessments/meta?action=share',
      'POST /api/assessments/meta?action=share',
      'DELETE /api/assessments/meta?action=share',
    ],
  });
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < 43; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
