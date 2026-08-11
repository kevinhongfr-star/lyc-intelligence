import type { VercelRequest, VercelResponse } from '@vercel/node';
import { greet } from './helper-inline';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, message: greet() });
}
