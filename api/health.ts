import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const status: any = {
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      supabase: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
      deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
      coze: process.env.COZE_API_KEY ? 'configured' : 'missing',
      resend: process.env.RESEND_API_KEY ? 'configured' : 'missing',
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'missing',
      posthog: process.env.VITE_POSTHOG_KEY ? 'configured' : 'missing'
    }
  };

  return res.status(200).json(status);
}
