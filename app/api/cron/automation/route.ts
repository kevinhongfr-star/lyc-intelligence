// Phase 3.10: Workflow Automation Cron - Run scheduled checks

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runScheduledChecks } from '@/services/ruleScheduler';

export async function GET() {
  const supabase = createClient();

  try {
    console.log('[cron] Starting rule scheduler...');

    const result = await runScheduledChecks(supabase, 100);

    console.log(`[cron] Scheduler complete: ${result.executed} executed, ${result.failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Rule scheduler executed',
      results: result,
    });
  } catch (error) {
    console.error('[cron] Error running rule scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to run rule scheduler' },
      { status: 500 }
    );
  }
}
