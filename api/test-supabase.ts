import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../../src/lib/supabase/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient();
    return res.status(200).json({ ok: true, hasClient: !!supabase });
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) });
  }
}
