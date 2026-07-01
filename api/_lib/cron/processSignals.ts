import {
  selectMany,
  insert,
  isSupabaseConfigured,
} from '../supabaseRest.js';

export async function handleProcessSignals() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Server configuration error' };
  }

  // Get pending market signals
  const signals = await selectMany(
    'market_signals',
    {},
    ['detected_at DESC'],
    50,
    0,
    '*'
  );

  // Get client subscriptions that match signals
  const subscriptions = await selectMany(
    'client_market_subscriptions',
    { subscription_type: 'market_alerts', is_active: true },
    [],
    20,
    0,
    '*'
  );

  let alertsCreated = 0;

  for (const signal of signals || []) {
    for (const sub of subscriptions || []) {
      // Check if signal matches subscription filters
      const industries = sub.industry_sectors || [];
      const geographies = sub.geographies || [];

      const matchesIndustry =
        industries.length === 0 ||
        (signal.affected_industries || []).some((i: string) => industries.includes(i));
      const matchesGeo =
        geographies.length === 0 ||
        (signal.affected_geographies || []).some((g: string) => geographies.includes(g));

      if (matchesIndustry && matchesGeo) {
        try {
          await insert('client_intelligence_reports', {
            client_id: sub.client_id,
            report_type: 'market_alert',
            title: `Market Alert: ${signal.title}`,
            status: 'draft',
            content: { signal_id: signal.id },
          });
          alertsCreated++;
        } catch (e) {
          console.error(`Alert creation failed:`, e);
        }
      }
    }
  }

  return {
    success: true,
    signals_processed: signals?.length || 0,
    subscriptions_checked: subscriptions?.length || 0,
    alerts_created: alertsCreated,
    timestamp: new Date().toISOString(),
  };
}