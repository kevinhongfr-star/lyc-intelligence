import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ status: 'ok', version: '2.0.0', supabase: process.env.VITE_SUPABASE_URL ? 'configured' : 'missing', deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing', resend: process.env.RESEND_API_KEY ? 'configured' : 'missing', timestamp: new Date().toISOString() });
}
