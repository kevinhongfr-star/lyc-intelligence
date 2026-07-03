import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'ok', message: 'data/health endpoint reached!', query: req.query, url: req.url });
}
