import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCandidates } from '../_lib/candidatesHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleCandidates(req, res);
}