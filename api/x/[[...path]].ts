/**
 * api/x/[[...path]].ts — Universal dispatcher for all new API routes
 *
 * This is ONE Vercel Function that routes to internal handler modules based on pathArr[0].
 * Lazy imports ensure only the needed handler is loaded per request.
 *
 * Routes served:
 *   /api/x/bd/*              → bdHandler
 *   /api/x/compensation/*     → compensationHandler
 *   /api/x/approvals/*       → approvalsHandler
 *   /api/x/automation/*      → automationHandler
 *   /api/x/sla/*             → slaHandler
 *   /api/x/alumni/*          → alumniHandler
 *   /api/x/saved-searches/* → savedSearchesHandler
 *   /api/x/talent-alerts/*   → talentAlertsHandler
 *   /api/x/consents/*        → consentsHandler
 *   /api/x/data-subject-requests/* → dsrHandler
 *   /api/x/kpis/*            → kpisHandler
 *   /api/x/nexus/*           → nexusHandler
 *   /api/x/cron/*            → cronHandler (uses CRON_SECRET instead of JWT)
 *   /api/x/benchmark/*       → benchmarkHandler (Coze workflow)
 *   /api/x/shift/*           → shiftHandler (DeepSeek analysis)
 *   /api/x/email/*           → email (public, signup only, rate limited)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/adminAuth.js';
import { sendEmail } from '../_lib/email.js';

export const maxDuration = 60;

type HandlerModule = { handler: (req: VercelRequest, res: VercelResponse) => Promise<void> };

// Lazy imports — only load the handler needed for this request
const handlers: Record<string, () => Promise<HandlerModule>> = {
  'bd': () => import('../_lib/bdHandler.js'),
  'compensation': () => import('../_lib/compensationHandler.js'),
  'approvals': () => import('../_lib/approvalsHandler.js'),
  'automation': () => import('../_lib/automationHandler.js'),
  'sla': () => import('../_lib/slaHandler.js'),
  'alumni': () => import('../_lib/alumniHandler.js'),
  'saved-searches': () => import('../_lib/savedSearchesHandler.js'),
  'talent-alerts': () => import('../_lib/talentAlertsHandler.js'),
  'consents': () => import('../_lib/consentsHandler.js'),
  'data-subject-requests': () => import('../_lib/dsrHandler.js'),
  'kpis': () => import('../_lib/kpisHandler.js'),
  'nexus': () => import('../_lib/nexusHandler.js'),
  'cron': () => import('../_lib/cronHandler.js'),
  'benchmark': () => import('../_lib/benchmarkHandler.js'),
  'shift': () => import('../_lib/shiftHandler.js'),
};

// Modules that use shared secret instead of JWT (cron jobs, etc.)
const PUBLIC_MODULES = ['cron', 'email'];

const emailRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default async function dispatcher(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const module = pathArr[0] || '';

  // ── SPECIAL: Email public module (signup only, rate limited) ──
  if (module === 'email') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, data } = req.body || {};

    if (type !== 'signup') {
      return res.status(400).json({ error: 'Only signup emails supported via this endpoint' });
    }

    // Rate limit: 3 per minute per IP
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const entry = emailRateLimitMap.get(ip);
    if (entry && now < entry.resetAt && entry.count >= 3) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    emailRateLimitMap.set(ip, { count: (entry?.count || 0) + 1, resetAt: now + 60000 });

    try {
      const result = await sendEmail(type, data);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[x/email]', err);
      return res.status(500).json({
        error: 'Failed to send email',
        details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
      });
    }
  }

  // ── AUTH CHECK ──
  if (!PUBLIC_MODULES.includes(module)) {
    // All protected modules require JWT authentication
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }
    // Attach user to request for downstream handlers
    (req as any).__authenticatedUser = user;
  } else {
    // For cron, verify shared secret instead of JWT
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized', success: false });
    }
  }

  const loader = handlers[module];
  if (!loader) {
    return res.status(404).json({ error: `Unknown module: ${module}` });
  }

  try {
    const mod = await loader();
    return await mod.handler(req, res);
  } catch (err: any) {
    console.error(`[x/dispatcher] Handler error for module ${module}:`, err);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
