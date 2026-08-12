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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      console.error('[api/assessments/share] GET by token error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to fetch shared result' });
    }
  }

  // ── All other operations require authentication ──────────────
  let ctx;
  try {
    ctx = await getAuthorizedContext(req, { requireAuth: true });
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
      console.error('[api/assessments/share] GET list error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to list share links' });
    }
  }

  // ── POST: create share link ──────────────────────────────────
  if (req.method === 'POST') {
    const { result_id, assessment_code, payload, max_views } = req.body || {};
    if (!result_id || !assessment_code || !payload) {
      return res.status(400).json({ ok: false, error: 'result_id, assessment_code, and payload are required' });
    }

    try {
      // Generate opaque token
      const token = generateShareToken();

      const { data, error } = await supabase
        .from('assessment_shares')
        .insert({
          share_token: token,
          owner_id: userId,
          result_id,
          assessment_code: assessment_code.toUpperCase(),
          shared_payload: payload,  // caller must sanitize (strip PII) before sending
          max_views: max_views ?? null,
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
      console.error('[api/assessments/share] POST error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to create share link' });
    }
  }

  // ── DELETE: revoke share link ────────────────────────────────
  if (req.method === 'DELETE') {
    const { share_id } = req.body || {};
    if (!share_id) {
      return res.status(400).json({ ok: false, error: 'share_id is required' });
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
      console.error('[api/assessments/share] DELETE error:', err);
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
