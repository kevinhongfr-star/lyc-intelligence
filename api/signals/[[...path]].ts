import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleSignals } from '../_lib/signalsHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleSignals(req, res);
}
