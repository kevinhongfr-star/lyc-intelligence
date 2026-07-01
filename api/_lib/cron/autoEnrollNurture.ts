import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function handleAutoEnrollNurture() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find S8 candidates with non-comp reasons
  const { data: s8Candidates } = await supabase
    .from('contacts')
    .select('id')
    .eq('pipeline_stage', 'S8_Not_Interested')
    .neq('not_interested_reason', 'conflict_of_interest')
    .eq('nurture_enrolled', false)
    .limit(50);

  let enrolled = 0;

  for (const c of s8Candidates || []) {
    try {
      await supabase.from('nurture_sequences').insert({
        contact_id: c.id,
        sequence_type: 'S8_NOT_INTERESTED',
        total_steps: 6,
        cadence_days: 14,
        next_touch_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await supabase.from('contacts').update({ nurture_enrolled: true }).eq('id', c.id);
      enrolled++;
    } catch (e) {
      console.error(`Enroll failed for ${c.id}:`, e);
    }
  }

  return {
    success: true,
    candidates_found: s8Candidates?.length || 0,
    enrolled,
    timestamp: new Date().toISOString(),
  };
}