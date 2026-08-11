import type { VercelRequest, VercelResponse } from '@vercel/node';
// Import a simple utility from src/ to test if cross-dir imports work

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, message: 'src import test' });
}
