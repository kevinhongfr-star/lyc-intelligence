import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '../_lib/supabase-rest';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email')
      .limit(1);
    return res.status(200).json({ ok: true, count: data?.length ?? 0, error: error?.message ?? null });
  } catch (e: any) {
    return res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 5) });
  }
}
