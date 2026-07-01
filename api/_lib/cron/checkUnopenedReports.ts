import {
  selectMany,
  update,
  insert,
  isSupabaseConfigured,
} from '../supabaseRest.js';

export async function handleCheckUnopenedReports() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Server configuration error' };
  }

  // Find delivered but unopened reports older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const unopened = await selectMany(
    'client_intelligence_reports',
    { status: 'delivered' },
    [],
    50,
    0,
    '*'
  );

  const staleReports = (unopened || []).filter(
    (r: any) => r.delivered_at && r.delivered_at < sevenDaysAgo && !r.opened_at
  );

  let followUpsSent = 0;

  for (const report of staleReports) {
    if (!report.follow_up_sent) {
      try {
        // Send follow-up notification
        await insert('notifications', {
          user_id: report.client_id,
          type: 'report_reminder',
          title: 'Unopened Report Reminder',
          message: `Your report "${report.title}" hasn't been opened yet.`,
        });
        await update('client_intelligence_reports', report.id, {
          follow_up_sent: true,
        });
        followUpsSent++;
      } catch (e) {
        console.error(`Follow-up failed for ${report.id}:`, e);
      }
    }
  }

  return {
    success: true,
    unopened_count: staleReports.length,
    follow_ups_sent: followUpsSent,
    timestamp: new Date().toISOString(),
  };
}