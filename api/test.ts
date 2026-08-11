import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ 
    ok: true, 
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasViteAnon: !!process.env.VITE_SUPABASE_ANON_KEY,
    }
  });
}
