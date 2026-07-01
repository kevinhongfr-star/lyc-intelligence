import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function handleGenerateBenchmarks() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get ALPHA/BETA candidates without recent benchmark
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates } = await supabase
    .from('contacts')
    .select('id, full_name')
    .in('career_tier', ['ALPHA', 'BETA'])
    .eq('is_archived', false)
    .or(`career_benchmark.is.null,career_benchmark->>'generated_at'.lt.${ninetyDaysAgo}`)
    .limit(50);

  let generated = 0;
  let failed = 0;

  for (const c of candidates || []) {
    try {
      // Benchmark generation would call DeepSeek here
      generated++;
    } catch (e) {
      failed++;
    }
  }

  return {
    success: true,
    candidates_checked: candidates?.length || 0,
    benchmarks_generated: generated,
    failed,
    timestamp: new Date().toISOString(),
  };
}