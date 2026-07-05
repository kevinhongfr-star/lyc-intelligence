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
  'mandates': () => import('./_lib/mandatesHandler.js'),
  'consultants': () => import('./_lib/mandatesHandler.js'),
  'admin': () => import('./_lib/mandatesHandler.js'),
  'analytics': () => import('./_lib/analyticsHandler.js').then(m => ({ handler: m.handleAnalytics })),
  'clients': () => import('./_lib/clientHandler.js'),
  'contacts': () => import('./_lib/communicationsHandler.js'),
  'channels': () => import('./_lib/communicationsHandler.js'),
  'upload': () => import('./_lib/companiesUploadHandler.js').then(m => ({ handler: m.handler })),
  'share': () => import('./_lib/shareHandler.js').then(m => ({ handler: m.default || m.handler })),
  'lead-capture': () => import('./_lib/leadCaptureHandler.js').then(m => ({ handler: m.default || m.handler })),
  'agents': () => import('./_lib/agentsHandler.js'),
  'agent-actions': () => import('./_lib/agentActionsHandler.js'),
  'linkedin': () => import('./_lib/linkedinHandler.js'),
  'matching': () => import('./_lib/matchingHandler.js'),
  'score': () => import('./_lib/scoreHandler.js'),
  'signals': () => import('./_lib/signalsHandler.js'),
  'trident': () => import('./_lib/tridentHandler.js'),
  'rbac': () => import('./_lib/rbacHandler.js').then(m => ({ handler: m.handleRbac })),
  'credits': () => import('./_lib/creditsHandler.js'),
  'enrichment': () => import('./_lib/enrichmentHandler.js'),
  'career': () => import('./_lib/careerIntelligenceHandler.js').then(m => ({ handler: m.default })),
  'canvas': () => import('./_lib/canvasHandler.js'),
  'grid': () => import('./_lib/gridReportsGenerateHandler.js').then(m => ({ handler: m.handler })),
  'scoring': () => import('./_lib/scoringComputeHandler.js'),
  'dashboard': () => import('./_lib/dashboardHandler.js').then(m => ({ handler: m.default || m.handler })),
  'wechat': () => import('./_lib/communicationsHandler.js').then(m => ({ handler: m.handleWechat })),
};

// Modules whose handlers expect the full path (including module name) in req.query.path
const FULL_PATH_MODULES = new Set(['mandates', 'consultants', 'admin']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Read module and sub-path from query params (set by vercel.json rewrite)
  const mod = (req.query as any).__mod as string || '';
  const subPath = (req.query as any).__sub as string || '';
  
  // Clean up our internal query params
  delete (req.query as any).__mod;
  delete (req.query as any).__sub;
  
  // Set req.query.path for downstream handlers
  const segments = subPath ? subPath.split('/').filter(Boolean) : [];
  if (FULL_PATH_MODULES.has(mod)) {
    (req.query as any).path = [mod, ...segments];
  } else {
    (req.query as any).path = segments;
  }
  
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
