// Phase 5.7: Consent Expiry Cron Job
// Runs daily to deactivate expired PIPL consents

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { expireConsents } from '@/services/consentExpiryJob';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('[Consent Expiry Cron] Starting daily consent expiry check...');

    const expiredCount = await expireConsents(supabase);

    console.log('[Consent Expiry Cron] Completed:', {
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expired_count: expiredCount,
    });
  } catch (err) {
    console.error('[Consent Expiry Cron] Error:', err);
    return NextResponse.json(
      {
        error: 'Consent expiry check failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
