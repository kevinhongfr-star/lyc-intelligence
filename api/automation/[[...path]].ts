import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from '../_lib/adminAuth.js';

export const config = { maxDuration: 300 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized', success: false });
    (req as any).__authenticatedUser = user;

    // Parse sub-path from URL
    const cleanUrl = (req.url || '').split('?')[0].replace(/^\//, '');
    const pathArr = cleanUrl.split('/').filter(Boolean);
    if (pathArr[0] === 'api') pathArr.shift();
    // pathArr[0] is the module name (e.g. 'kpis'), pathArr.slice(1) is the sub-path
    (req.query as any).path = pathArr.slice(1);

    const mod = await import('../_lib/automationHandler.js');
    return mod.handler(req, res);
  } catch (err: any) {
    console.error('[/automation]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
