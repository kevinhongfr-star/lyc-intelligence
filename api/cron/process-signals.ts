import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { processMarketSignal } from '../../_lib/intelligenceHandler';

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

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: newSignals } = await supabase
    .from('market_signals')
    .select('id')
    .gte('detected_at', twentyFourHoursAgo)
    .eq('alerts_generated', '[]');

  let processed = 0;
  let alertsGenerated = 0;

  for (const signal of newSignals || []) {
    try {
      const result = await processMarketSignal(supabase, signal.id);
      if (result) {
        alertsGenerated += result.length;
      }
      processed++;
    } catch (e) {
      console.error(`Signal processing failed for ${signal.id}:`, e);
    }
  }

  return res.status(200).json({
    signals_processed: processed,
    alerts_generated: alertsGenerated,
    timestamp: new Date().toISOString(),
  });
}
