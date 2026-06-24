// Phase 0.6: NEXUS Reconciliation Cron Job
// Runs every 5 minutes via Vercel Cron to retry failed events

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { reconcileOutbox, getOutboxStats } from '@/services/nexusReconciliation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('[NEXUS Cron] Starting NEXUS outbox reconciliation...');

    const statsBefore = await getOutboxStats(supabase);

    const result = await reconcileOutbox(supabase);

    const statsAfter = await getOutboxStats(supabase);

    console.log('[NEXUS Cron] Reconciliation complete:', {
      processed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      skipped: result.skipped,
      pending_before: statsBefore.pending,
      pending_after: statsAfter.pending,
      failed_before: statsBefore.failed,
      failed_after: statsAfter.failed,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      stats: {
        before: statsBefore,
        after: statsAfter,
      },
    });
  } catch (err) {
    console.error('[NEXUS Cron] Error:', err);
    return NextResponse.json(
      {
        error: 'NEXUS reconciliation failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
