import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Test catch-all reached!',
    url: req.url,
    query: req.query,
    pathSegments: (req.query as any).path,
  });
}
