import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler } from '../_lib/dataHandler.js';

export const maxDuration = 60;

export default async function wrapper(req: VercelRequest, res: VercelResponse) {
  // Debug: log the query params to see what Vercel passes
  console.log('[data route] query:', JSON.stringify(req.query), 'url:', req.url);
  return handler(req, res);
}
