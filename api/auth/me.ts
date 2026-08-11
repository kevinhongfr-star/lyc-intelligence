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
import { createClient } from '../lib/supabase-rest.js';
import { getAuthorizedContext, RequestAuthError } from '../lib/auth.js';

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
    const ctx = await getAuthorizedContext(req, false);
    if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = createClient();

    // Get the auth.user struct (verified by getUser) + profile row
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
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
    if (e instanceof RequestAuthError) {
      return res.status(e.status).json({ error: e.message });
    }
    console.error('[api/auth/me] unexpected:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
