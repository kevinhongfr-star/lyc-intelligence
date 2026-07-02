import * as db from '../supabaseRest.js';

export async function handleAutoEnrollNurture() {
  const s8Candidates = await db.selectMany('contacts', {
    select: 'id',
    where: [
      { column: 'pipeline_stage', value: 'S8_Not_Interested' },
      { column: 'not_interested_reason', value: 'conflict_of_interest', op: 'neq' },
      { column: 'nurture_enrolled', value: false },
    ],
    limit: 50,
  });

  let enrolled = 0;

  for (const c of s8Candidates) {
    try {
      await db.insert('nurture_sequences', {
        contact_id: c.id,
        sequence_type: 'S8_NOT_INTERESTED',
        total_steps: 6,
        cadence_days: 14,
        next_touch_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await db.update('contacts', { column: 'id', value: c.id }, { nurture_enrolled: true });
      enrolled++;
    } catch (e) {
      console.error(`Enroll failed for ${c.id}:`, e);
    }
  }

  return {
    success: true,
    candidates_found: s8Candidates.length,
    enrolled,
    timestamp: new Date().toISOString(),
  };
}
