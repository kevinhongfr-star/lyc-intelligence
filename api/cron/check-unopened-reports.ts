import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: unopened } = await supabase
    .from('client_intelligence_reports')
    .select('id, client_id, title, status, delivered_at')
    .eq('status', 'delivered')
    .eq('follow_up_sent', false)
    .lte('delivered_at', sevenDaysAgo)
    .is('opened_at', null);

  let followUps = 0;

  for (const report of unopened || []) {
    try {
      const { data: mandates } = await supabase
        .from('mandates')
        .select('lead_consultant_id')
        .eq('client_id', report.client_id)
        .limit(1);

      const consultantId = mandates?.[0]?.lead_consultant_id;

      if (consultantId) {
        try {
          await supabase.from('notifications').insert({
            type: 'report_followup',
            recipient_id: consultantId,
            title: `Follow up: Unopened report`,
            body: `"${report.title}" was delivered 7+ days ago. Consider following up with the client.`,
            channel: 'in_app',
            metadata: { report_id: report.id },
            action_url: `/intelligence/reports/${report.id}`,
          });
        } catch (e) {
          // notification table may not exist
        }
      }

      await supabase
        .from('client_intelligence_reports')
        .update({ follow_up_sent: true })
        .eq('id', report.id);

      followUps++;
    } catch (e) {
      console.error(`Follow-up failed for report ${report.id}:`, e);
    }
  }

  return res.status(200).json({
    follow_ups_triggered: followUps,
    total_unopened: unopened?.length || 0,
    timestamp: new Date().toISOString(),
  });
}
