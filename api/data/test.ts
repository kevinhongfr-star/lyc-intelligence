import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'data test works', query: req.query, url: req.url });
}
