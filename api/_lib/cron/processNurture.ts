import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function handleProcessNurture() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get due nurture sequences
  const now = new Date().toISOString();

  const { data: due } = await supabase
    .from('nurture_sequences')
    .select('id, contact_id, current_step, total_steps, sequence_type')
    .eq('status', 'ACTIVE')
    .lte('next_touch_at', now)
    .limit(50);

  let processed = 0;
  let advanced = 0;

  for (const seq of due || []) {
    try {
      // Create intelligence log entry
      await supabase.from('career_intelligence_log').insert({
        contact_id: seq.contact_id,
        intelligence_type: 'nurture_touch',
        direction: 'outbound',
        channel: 'email',
        content_summary: `Nurture touch #${seq.current_step} for ${seq.sequence_type}`,
      });

      // Advance sequence
      const nextStep = seq.current_step + 1;
      const isComplete = nextStep > seq.total_steps;

      await supabase
        .from('nurture_sequences')
        .update({
          current_step: nextStep,
          touch_count: seq.current_step,
          last_touch_at: now,
          status: isComplete ? 'COMPLETED' : 'ACTIVE',
          next_touch_at: isComplete
            ? null
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', seq.id);

      processed++;
      if (!isComplete) advanced++;
    } catch (e) {
      console.error(`Nurture failed for ${seq.id}:`, e);
    }
  }

  return {
    success: true,
    sequences_due: due?.length || 0,
    processed,
    advanced,
    timestamp: new Date().toISOString(),
  };
}