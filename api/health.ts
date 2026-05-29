import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only expose status, not which services are configured/unconfigured
  const hasCore = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) && !!process.env.DEEPSEEK_API_KEY;
  
  return res.status(200).json({
    status: hasCore ? 'ok' : 'degraded',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
}
