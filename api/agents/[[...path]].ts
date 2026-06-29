import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAgentsInvoke } from '../_lib/agentsHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAgentsInvoke(req, res);
}
