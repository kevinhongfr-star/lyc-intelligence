import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleKevinOversight } from '../_lib/kevinHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleKevinOversight(req, res);
}
