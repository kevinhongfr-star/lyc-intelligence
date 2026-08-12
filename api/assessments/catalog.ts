/**
 * /api/assessments/catalog — Public assessment catalog listing.
 * Ticket #1334 — API endpoint for public listing.
 *
 * GET /api/assessments/catalog
 *   Returns all published assessments, ordered by sort_order.
 *   No authentication required — RLS allows public SELECT on published rows.
 *
 * GET /api/assessments/catalog?code=CPI
 *   Returns a single published assessment by code.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest.js';
import { logServerError } from '../lib/validate.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabase = createClient();
  const code = (req.query.code as string)?.toUpperCase();

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
      return res.status(200).json({ ok: true, data });
    }

    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ ok: true, data: data || [] });
  } catch (err: any) {
    logServerError('api/assessments/catalog', err, req);
    return res.status(500).json({ ok: false, error: 'Failed to fetch assessment catalog' });
  }
}
