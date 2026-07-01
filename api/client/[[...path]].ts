import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleClient } from '../_lib/clientHandler';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return handleClient(req, res);
}
