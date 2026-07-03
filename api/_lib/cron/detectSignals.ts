import * as db from '../supabaseRest.js';
import { detectMovementSignals } from '../careerIntelligenceHandler.js';

export async function handleDetectSignals() {
  const candidates = await db.selectMany('contacts', {
    select: 'id',
    where: [
      { column: 'career_tier', value: ['ALPHA', 'BETA'], op: 'in' },
      { column: 'is_archived', value: false },
    ],
    limit: 200,
  });

  let totalSignals = 0;
  let checked = 0;

  for (const c of candidates || []) {
    try {
      const signals = await detectMovementSignals(c.id);
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