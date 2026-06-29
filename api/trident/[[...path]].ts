import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleTrident } from '../_lib/tridentHandler.js';

export const maxDuration = 120;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleTrident(req, res);
}