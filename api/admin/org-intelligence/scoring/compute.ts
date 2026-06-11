/**
 * POST /api/admin/org-intelligence/scoring/compute
 *
 * 5-criteria scoring engine for individuals in the org talent pool.
 *
 * STUB - implementation pending v1.2 scoring spec sign-off.
 * See docs/org_intelligence_scoring_spec_v1.2.md for the full algorithm.
 *
 * Auth: verified via `verifyAdmin` (T2). Non-admins get 401.
 *
 * Planned behavior (per v1.2 spec):
 *   Request:  { individual_ids: string[], criteria?: string[] }
 *   Response: { scored: N, skipped: M, token_total: T, cost_estimate_usd: X }
 *   Each individual: 5 LLM calls (one per criterion) -> scores written to
 *   org_evaluation_scores with full evidence + source URLs.
 *
 * This stub returns 501 Not Implemented until T4 is built.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleError, isSupabaseConfigured } from '../../../_lib/supabaseRest.js';
import { verifyAdmin } from '../../../_lib/adminAuth.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(500).json({ success: false, error: 'Supabase not configured' });
    }

    const { user, error } = await verifyAdmin(req);
    if (error || !user) {
      return res.status(401).json({ success: false, error: error || 'Unauthorized' });
    }

    // Spec sign-off pending - Kevin to confirm the 5 criteria in
    // docs/org_intelligence_scoring_spec_v1.2.md before implementation.
    return res.status(501).json({
      success: false,
      error: 'T4 scoring engine not yet implemented',
      blocker: 'v1.2 scoring spec sign-off required (see docs/org_intelligence_scoring_spec_v1.2.md)',
      requested_by: user.email,
    });
  } catch (err: any) {
    return handleError(res, 'org-intelligence/scoring/compute', err);
  }
}
