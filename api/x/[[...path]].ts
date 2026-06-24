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
 *   /api/x/cron/*            → cronHandler
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
};

export default async function dispatcher(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const module = pathArr[0] || '';

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
