/**
 * /api/auth/me — Authorized self lookup.
 *
 * Returns: { user, profile } — the canonical identity view for the caller
 * (user is Supabase auth.user, profile is public.profiles row).
 *
 * Security:
 *   - Authorization: Bearer <supabase JWT>  (required)
 *   - Always returns YOUR OWN identity (no id parameter accepted)
 *   - Role + org are what's in the `profiles` table (source of truth)
 *
 * Used by frontend to hydrate authStore without leaking role info via
 * client-app_metadata (which is settable by JWT unless verified server-side).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../_lib/supabase-rest.js';
import { getAuthorizedContext, RequestAuthError } from '../_lib/auth.js';
import {
  assertUrlLength,
  getClientIp,
  handleApiError,
  logServerError,
  RateLimiter,
  setRateLimitHeaders,
} from '../_lib/validate.js';

// #1314: Rate limit — 60 requests per minute per IP.
// Prevents user enumeration and brute-force token probing.
// Supabase Auth handles rate limiting for signup/login/reset internally.
const AUTH_RATE_LIMITER = new RateLimiter(60_000, 60);
const AUTH_RATE_MAX = 60;

// #1315: Safe profile columns — explicitly allowlist what we return
// from /api/auth/me. Never select '*' which could leak internal fields
// added by future migrations (e.g. internal_notes, flags, tokens).
const SAFE_PROFILE_COLUMNS = [
  'id',
  'email',
  'name',
  'role',
  'tier',
  'organization_id',
  'icp',
  'active_surface',
  'onboarded_at',
  'avatar_url',
  'bio',
  'title',
  'company',
  'created_at',
  'updated_at',
].join(',');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight — this endpoint is called cross-origin only by ourselves,
  // but set conservative headers to avoid browser preflight hangs.
  res.setHeader('Vary', 'Origin, Authorization');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed', allow: 'GET, HEAD, OPTIONS' });
  }

  try {
    // #1314: reject oversized URLs before processing.
    assertUrlLength(req);

    // #1314: Rate limit check — per-IP sliding window.
    const clientIp = getClientIp(req);
    const rl = AUTH_RATE_LIMITER.check(clientIp);
    setRateLimitHeaders(res, rl, AUTH_RATE_MAX);
    if (!rl.allowed) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const ctx = await getAuthorizedContext(req, false);
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient();

    // #1315: Select only safe columns — never '*' on profiles.
    const { data: profile } = await supabase
      .from('profiles')
      .select(SAFE_PROFILE_COLUMNS)
      .eq('id', ctx.userId)
      .limit(1)
      .maybeSingle();

    return res.status(200).json({
      ok: true,
      user: {
        id: ctx.userId,
        email: ctx.email,
      },
      profile: profile ?? null,
      context: {
        role: ctx.role,
        organization_id: ctx.organizationId,
        tier: ctx.tier,
      },
      server_time: new Date().toISOString(),
    });
  } catch (e: any) {
    // #1314: centralized error handling — never leaks stack traces.
    handleApiError(res, e, 'api/auth/me unexpected', req);
    return;
  }
}
