import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hello } from '../_lib/helper';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, message: hello() });
}
