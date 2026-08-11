import type { VercelRequest, VercelResponse } from '@vercel/node';
import { add } from '../lib/simple';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, result: add(2, 3) });
}
