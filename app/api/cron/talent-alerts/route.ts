// Phase 2.7: Daily Talent Alert Cron

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runTalentAlertGeneration, sendAlertNotifications, getAllAlerts } from '@/lib/saved-searches/alerts';

export async function GET() {
  const supabase = createClient();

  try {
    console.log('Starting talent alert generation...');

    // Run alert generation for all organizations
    const { totalAlertsGenerated, searchesChecked } = await runTalentAlertGeneration(supabase);

    console.log(`Checked ${searchesChecked} saved searches`);
    console.log(`Generated ${totalAlertsGenerated} new alerts`);

    // Send notifications for new alerts
    if (totalAlertsGenerated > 0) {
      // Get newly created alerts (from today)
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAlerts, error } = await supabase
        .from('talent_alerts')
        .select('*')
        .gte('created_at', `${today}T00:00:00Z`)
        .eq('notification_sent', false);

      if (!error && todayAlerts && todayAlerts.length > 0) {
        await sendAlertNotifications(supabase, todayAlerts as any[]);
        console.log(`Sent notifications for ${todayAlerts.length} alerts`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Talent alert generation completed',
      results: {
        searchesChecked,
        totalAlertsGenerated,
      },
    });
  } catch (error) {
    console.error('Error running talent alert cron:', error);
    return NextResponse.json({ error: 'Failed to run talent alert cron' }, { status: 500 });
  }
}