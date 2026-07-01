import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateCareerBenchmark } from '../../_lib/careerIntelligenceHandler';

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

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: candidates } = await supabase
    .from('contacts')
    .select('id, full_name, current_role, current_company, industry, location, skills, trident_scores, career_benchmark')
    .in('career_tier', ['ALPHA', 'BETA'])
    .eq('is_archived', false)
    .limit(50);

  let processed = 0;
  let errors = 0;

  for (const candidate of candidates || []) {
    try {
      const benchmark = candidate.career_benchmark;
      if (benchmark?.generated_at && new Date(benchmark.generated_at) > new Date(ninetyDaysAgo)) {
        continue;
      }
      await generateCareerBenchmark(supabase, candidate.id);
      processed++;
    } catch (err) {
      console.error(`Benchmark failed for ${candidate.id}:`, err);
      errors++;
    }
  }

  return res.status(200).json({
    processed,
    errors,
    total_candidates: candidates?.length || 0,
    timestamp: new Date().toISOString(),
  });
}
