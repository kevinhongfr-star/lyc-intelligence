import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMandates } from '../_lib/mandatesHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleMandates(req, res);
}