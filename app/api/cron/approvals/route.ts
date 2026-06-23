// Phase 3.11: Approval Escalation Cron - Runs hourly

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runEscalationCheck } from '@/services/approvalEscalationJob';

export async function GET() {
  const supabase = createClient();

  try {
    console.log('[cron] Starting approval escalation check...');

    const result = await runEscalationCheck(supabase);

    console.log(`[cron] Escalation check complete: ${result.escalated} escalated, ${result.warnings} warnings`);

    return NextResponse.json({
      success: true,
      message: 'Approval escalation check completed',
      results: result,
    });
  } catch (error) {
    console.error('[cron] Error running escalation check:', error);
    return NextResponse.json(
      { error: 'Failed to run escalation check' },
      { status: 500 }
    );
  }
}
