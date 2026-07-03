/**
 * api/_dispatch.ts — Universal sub-module dispatcher
 * Receives rewritten requests from vercel.json with __mod and __sub query params
 * Delegates to the appropriate handler in _lib/
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './_lib/adminAuth.js';

export const maxDuration = 300;

const handlers: Record<string, () => Promise<any>> = {
  'data': () => import('./_lib/dataHandler.js'),
  'bd': () => import('./_lib/bdHandler.js'),
  'approvals': () => import('./_lib/approvalsHandler.js'),
  'automation': () => import('./_lib/automationHandler.js'),
  'sla': () => import('./_lib/slaHandler.js'),
  'alumni': () => import('./_lib/alumniHandler.js'),
  'saved-searches': () => import('./_lib/savedSearchesHandler.js'),
  'talent-alerts': () => import('./_lib/talentAlertsHandler.js'),
  'consents': () => import('./_lib/consentsHandler.js'),
  'data-subject-requests': () => import('./_lib/dsrHandler.js'),
  'kpis': () => import('./_lib/kpisHandler.js'),
  'nexus': () => import('./_lib/nexusHandler.js'),
  'benchmark': () => import('./_lib/benchmarkHandler.js'),
  'shift': () => import('./_lib/shiftHandler.js'),
  'ai': () => import('./_lib/aiHandler.js'),
  'compensation': () => import('./_lib/compensationHandler.js'),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Read module and sub-path from query params (set by vercel.json rewrite)
  const mod = (req.query as any).__mod as string || '';
  const subPath = (req.query as any).__sub as string || '';
  
  // Clean up our internal query params
  delete (req.query as any).__mod;
  delete (req.query as any).__sub;
  
  // Set req.query.path for downstream handlers
  const segments = subPath ? subPath.split('/').filter(Boolean) : [];
  (req.query as any).path = segments;
  
  // Auth check (all sub-modules require authentication)
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }
  (req as any).__authenticatedUser = user;
  
  const loader = handlers[mod];
  if (!loader) {
    return res.status(404).json({ error: `Unknown module: ${mod}` });
  }
  
  try {
    const handlerMod = await loader();
    return handlerMod.handler(req, res);
  } catch (err: any) {
    console.error(`[_dispatch/${mod}]`, err);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
