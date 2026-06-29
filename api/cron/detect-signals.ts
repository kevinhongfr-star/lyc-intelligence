import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { detectMovementSignals } from '../../_lib/careerIntelligenceHandler';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: candidates } = await supabase
    .from('contacts')
    .select('id')
    .in('career_tier', ['ALPHA', 'BETA'])
    .eq('is_archived', false)
    .limit(200);

  let totalSignals = 0;
  let checked = 0;

  for (const c of candidates || []) {
    try {
      const signals = await detectMovementSignals(supabase, c.id);
      totalSignals += signals.length;
      checked++;
    } catch (e) {
      console.error(`Signal detection failed for ${c.id}:`, e);
    }
  }

  return res.status(200).json({
    candidates_checked: checked,
    signals_detected: totalSignals,
    timestamp: new Date().toISOString(),
  });
}
