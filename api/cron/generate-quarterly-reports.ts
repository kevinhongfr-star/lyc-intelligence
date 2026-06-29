import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { generateQuarterlyReport } from '../../_lib/intelligenceHandler';

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

  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const year = now.getFullYear();

  const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const prevYear = currentQuarter === 1 ? year - 1 : year;

  const periodStart = new Date(prevYear, (prevQuarter - 1) * 3, 1);
  const periodEnd = new Date(prevYear, prevQuarter * 3, 0);

  const { data: subscriptions } = await supabase
    .from('client_market_subscriptions')
    .select('*, clients(id, name)')
    .eq('subscription_type', 'quarterly_landscape')
    .eq('is_active', true);

  let generated = 0;
  let errors = 0;

  for (const sub of subscriptions || []) {
    try {
      const { data: existing } = await supabase
        .from('client_intelligence_reports')
        .select('id')
        .eq('client_id', sub.client_id)
        .eq('report_type', 'quarterly_landscape')
        .eq('period_start', periodStart.toISOString().split('T')[0])
        .limit(1);

      if (existing && existing.length > 0) continue;

      await generateQuarterlyReport(supabase, {
        clientId: sub.client_id,
        clientName: sub.clients?.name || 'Unknown',
        industrySectors: sub.industry_sectors || [],
        jobFunctions: sub.job_functions || [],
        geographies: sub.geographies || [],
        periodStart,
        periodEnd,
      });
      generated++;
    } catch (err) {
      console.error(`Quarterly report failed for client ${sub.client_id}:`, err);
      errors++;
    }
  }

  return res.status(200).json({
    quarter: `Q${prevQuarter} ${prevYear}`,
    generated,
    errors,
    total_subscriptions: subscriptions?.length || 0,
    timestamp: new Date().toISOString(),
  });
}
