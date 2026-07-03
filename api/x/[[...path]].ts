/**
 * api/x/[[...path]].ts — Catch-all for /api/x/* dispatcher routes
 * Vercel filesystem routing requires a file at this path to match /api/x/* URLs.
 * Delegates to the main mega-router which handles the 'x' case internally.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import mainHandler from '../[[...path]].js';

export const config = {
  maxDuration: 300,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return mainHandler(req, res);
}
