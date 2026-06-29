import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMatching } from '../_lib/matchingHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleMatching(req, res);
}
