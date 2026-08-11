import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Echo back all headers (redact auth value for safety)
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === 'authorization' && typeof v === 'string') {
      headers[k] = v.substring(0, 20) + '...(truncated)';
    } else {
      headers[k] = String(v);
    }
  }
  return res.status(200).json({
    method: req.method,
    url: req.url,
    headers,
    hasAuth: !!req.headers['authorization'] || !!req.headers['Authorization'],
  });
}
