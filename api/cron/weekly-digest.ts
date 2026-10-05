/**
 * /api/cron/weekly-digest.ts — LYC Partners weekly digest cron endpoint.
 *
 * Trigger: Monday 09:00 local per user. In production this is invoked by
 * Vercel Cron Jobs or an external scheduler (e.g. GitHub Actions).
 *
 * Security: requires CRON_SECRET or WORKER_SHARED_SECRET header.
 *
 * Response:
 *   200 { ok: true, summary: WeeklyDigestSummary }
 *   401/403 on missing/invalid secret
 *   500 on unexpected error
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  runWeeklyDigest,
  type WeeklyDigestSummary,
  type DeliveryWindow,
} from '../_lib/weeklyDigestPipeline.js';

const CRON_SECRET =
  process.env.CRON_SECRET || process.env.WORKER_SHARED_SECRET || '';

function requireCronSecret(req: VercelRequest): boolean {
  if (!CRON_SECRET) return true; // dev / hobby default
  const header =
    (req.headers['x-cron-secret'] as string) ||
    (req.headers['x-worker-secret'] as string) ||
    (req.headers['authorization'] as string)?.replace(/^Bearer\s+/i, '');
  return !!header && header === CRON_SECRET;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Cron-Secret, X-Worker-Secret');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method not allowed' });
    return;
  }

  if (!requireCronSecret(req)) {
    res.status(401).json({ ok: false, error: 'cron-secret required' });
    return;
  }

  try {
    const now = req.body?.now ? new Date(req.body.now) : undefined;
    const appUrl = req.body?.app_url ? String(req.body.app_url) : undefined;
    const batchSize = req.body?.batch_size
      ? Math.min(Number(req.body.batch_size), 500)
      : undefined;

    let deliveryWindow: DeliveryWindow | undefined;
    const dw = req.body?.delivery_window;
    if (
      dw &&
      typeof dw.weekday === 'number' &&
      typeof dw.hour === 'number'
    ) {
      deliveryWindow = { weekday: dw.weekday, hour: dw.hour };
    }

    const summary: WeeklyDigestSummary = await runWeeklyDigest({
      now,
      appUrl,
      batchSize,
      deliveryWindow,
    });

    res.status(200).json({ ok: true, summary });
  } catch (e: any) {
    console.error('[cron/weekly-digest] fatal:', e);
    res.status(500).json({
      ok: false,
      error: e?.message || 'weekly digest pipeline failed',
    });
  }
}
