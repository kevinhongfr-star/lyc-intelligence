/**
 * /api/assessments/share — Assessment share link management.
 * Ticket #1337 — share link generation (7-day expiry, revocable, no PII).
 *
 * POST   /api/assessments/share     — create share link (auth required)
 *   Body: { result_id, assessment_code, payload (sanitized, no PII), max_views? }
 *   Returns: { ok, share_token, share_url, expires_at }
 *
 * GET    /api/assessments/share     — list user's share links (auth required)
 *   Returns: { ok, data: AssessmentShare[] }
 *
 * GET    /api/assessments/share/:token — fetch shared result (PUBLIC, no auth)
 *   Returns: { ok, payload: SharedAssessmentPayload }
 *
 * DELETE /api/assessments/share     — revoke share link (auth required)
 *   Body: { share_id }
 *   Returns: { ok }
 *
 * Security:
 *   - Create/List/Delete require authentication
 *   - Public read by token is allowed (capability URL pattern)
 *   - RLS enforces owner_id = auth.uid() on management operations
 *   - Public read policy checks: not revoked, not expired, under view limit
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // #1314: reject oversized URLs before any processing.
  try {
    assertUrlLength(req);
  } catch (e) {
    handleApiError(res, e, 'api/assessments/share url-length', req);
    return;
  }

  const supabase = createClient();

  // ── Public read by token: GET /api/assessments/share?token=xxx ──
  // This is the capability-URL pattern — the token IS the auth.
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

      // Increment view count (fire-and-forget)
      supabase
        .from('assessment_shares')
        .update({ view_count: data.view_count + 1 })
        .eq('share_token', token)
        .then(() => {});

      return res.status(200).json({ ok: true, payload: data.shared_payload });
    } catch (err: any) {
      logServerError('api/assessments/share GET by token', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to fetch shared result' });
    }
  }

  // ── All other operations require authentication ──────────────
  let ctx;
  try {
    // #1309: getAuthorizedContext takes (req, allowAnonymous:boolean).
    // Previously called with `{ requireAuth: true }` which is truthy
    // and thus treated as allowAnonymous=true — a real auth bypass.
    ctx = await getAuthorizedContext(req, false);
  } catch (err) {
    if (err instanceof RequestAuthError) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    throw err;
  }

  const userId = ctx.userId;

  // ── GET: list user's share links ─────────────────────────────
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
      logServerError('api/assessments/share GET list', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to list share links' });
    }
  }

  // ── POST: create share link ──────────────────────────────────
  if (req.method === 'POST') {
    // V3-7 / #1346 Rate limit: 20 writes / 60s per user
    const rl = rateLimit(req, userId);
    setRateLimitHeaders(res, rl, 20);
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many share link requests — please retry in a moment',
      });
    }

    // #1309 + #1314: body size + parse + sanitize. parseJsonBody throws
    // 400 on malformed JSON. The shared payload is stored as jsonb and
    // rendered publicly — strip control chars and cap size.
    assertBodySize(req.body, DEFAULT_BODY_LIMIT);
    const rawBody = parseJsonBody<{
      result_id?: string;
      assessment_code?: string;
      payload?: unknown;
      max_views?: number;
    }>(req);

    // V3-7 / #1346 Zod write-schema validation
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
    // Validate result_id is a UUID — anything else would either be a
    // bad request or an attempt to probe other rows.
    try {
      assertUuid(String(result_id), 'result_id');
    } catch (e: any) {
      return res.status(422).json({ ok: false, error: e.message });
    }
    // Assessment code: uppercase + length cap.
    const code = String(assessment_code).toUpperCase().slice(0, 32);

    try {
      // Generate opaque token
      const token = generateShareToken();

      const { data, error } = await supabase
        .from('assessment_shares')
        .insert({
          share_token: token,
          owner_id: userId,
          result_id,
          assessment_code: code,
          shared_payload: payload,  // already sanitized above
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
      logServerError('api/assessments/share POST', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to create share link' });
    }
  }

  // ── DELETE: revoke share link ────────────────────────────────
  if (req.method === 'DELETE') {
    // V3-7 / #1346 Rate limit
    const rl = rateLimit(req, userId);
    setRateLimitHeaders(res, rl, 20);
    if (!rl.allowed) {
      return res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        error: 'Too many share revocation requests',
      });
    }
    // #1314: parseJsonBody throws 400 on malformed JSON.
    const rawDel = parseJsonBody<{ share_id?: string }>(req);

    // V3-7 / #1346 Zod delete-schema validation
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
        .eq('owner_id', userId);  // RLS double-check

      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      logServerError('api/assessments/share DELETE', err, req);
      return res.status(500).json({ ok: false, error: 'Failed to revoke share link' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < 43; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}
