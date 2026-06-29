import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAgentActions } from '../_lib/agentActionsHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleAgentActions(req, res);
}
