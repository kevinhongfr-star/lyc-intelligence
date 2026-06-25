import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler } from '../_lib/dataHandler.js';

export const maxDuration = 60;

export default async function wrapper(req: VercelRequest, res: VercelResponse) {
  // Debug: inject query info into the handler
  if (!req.query.path || req.query.path.length === 0) {
    // Try to extract path from URL manually
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    const pathParts = url.pathname.replace(/^\/api\/data\/?/, '').split('/').filter(Boolean);
    if (pathParts.length > 0) {
      req.query.path = pathParts;
    }
  }
  return handler(req, res);
}
