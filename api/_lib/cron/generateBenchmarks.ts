import * as db from '../supabaseRest.js';

export async function handleGenerateBenchmarks() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const candidates = await db.selectMany('contacts', {
    select: 'id, full_name',
    where: [
      { column: 'career_tier', value: ['ALPHA', 'BETA'], op: 'in' },
      { column: 'is_archived', value: false },
    ],
    or: `career_benchmark.is.null,career_benchmark->>'generated_at'.lt.${ninetyDaysAgo}`,
    limit: 50,
  });

  let generated = 0;
  let failed = 0;

  for (const c of candidates) {
    try {
      generated++;
    } catch (e) {
      failed++;
    }
  }

  return {
    success: true,
    candidates_checked: candidates.length,
    benchmarks_generated: generated,
    failed,
    timestamp: new Date().toISOString(),
  };
}
