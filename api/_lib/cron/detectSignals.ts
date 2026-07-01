import { createClient } from '@supabase/supabase-js';
import { detectMovementSignals } from '../careerIntelligenceHandler';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function handleDetectSignals() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  return {
    candidates_checked: checked,
    signals_detected: totalSignals,
    timestamp: new Date().toISOString(),
  };
}