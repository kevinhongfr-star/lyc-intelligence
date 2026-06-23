// Phase 3.12: SLA Check Cron Job
// Runs hourly to check all active mandates for SLA compliance

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runSLAHealthCheck } from '@/lib/sla/escalation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('[SLA Cron] Starting hourly SLA health check...');

    const result = await runSLAHealthCheck(supabase);

    console.log('[SLA Cron] Check completed:', {
      orgsChecked: result.totalOrgsChecked,
      mandatesChecked: result.totalMandatesChecked,
      updates: result.totalUpdates,
      escalations: result.totalEscalations,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (err) {
    console.error('[SLA Cron] Error:', err);
    return NextResponse.json(
      { error: 'SLA check failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}