import * as db from '../supabaseRest.js';

export async function handleProcessNurture() {
  const now = new Date().toISOString();

  const due = await db.selectMany('nurture_sequences', {
    select: 'id, contact_id, current_step, total_steps, sequence_type',
    where: [
      { column: 'status', value: 'ACTIVE' },
      { column: 'next_touch_at', value: now, op: 'lte' },
    ],
    limit: 50,
  });

  let processed = 0;
  let advanced = 0;

  for (const seq of due) {
    try {
      await db.insert('career_intelligence_log', {
        contact_id: seq.contact_id,
        intelligence_type: 'nurture_touch',
        direction: 'outbound',
        channel: 'email',
        content_summary: `Nurture touch #${seq.current_step} for ${seq.sequence_type}`,
      });

      const nextStep = seq.current_step + 1;
      const isComplete = nextStep > seq.total_steps;

      await db.update(
        'nurture_sequences',
        { column: 'id', value: seq.id },
        {
          current_step: nextStep,
          touch_count: seq.current_step,
          last_touch_at: now,
          status: isComplete ? 'COMPLETED' : 'ACTIVE',
          next_touch_at: isComplete
            ? null
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }
      );

      processed++;
      if (!isComplete) advanced++;
    } catch (e) {
      console.error(`Nurture failed for ${seq.id}:`, e);
    }
  }

  return {
    success: true,
    sequences_due: due.length,
    processed,
    advanced,
    timestamp: new Date().toISOString(),
  };
}
