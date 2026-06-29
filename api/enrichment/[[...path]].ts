import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleEnrichment } from '../_lib/enrichmentHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleEnrichment(req, res);
}
