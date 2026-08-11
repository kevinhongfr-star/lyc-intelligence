import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../lib/supabase-rest';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    return res.status(200).json({ ok: true, rows: data?.length ?? 0, error: error?.message ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 3) });
  }
}
