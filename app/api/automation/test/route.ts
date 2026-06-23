// Phase 3.10: Rule Dry Run / Test API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dryRunRule } from '@/services/ruleEngine';
import type { AutomationRule, TriggerContext } from '@/types/automation';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const { rule, context } = body;

    if (!rule || !context) {
      return NextResponse.json(
        { error: 'rule and context are required' },
        { status: 400 }
      );
    }

    if (!context.entityType || !context.entityId || !context.orgId || !context.triggerType) {
      return NextResponse.json(
        { error: 'Missing required context fields' },
        { status: 400 }
      );
    }

    const result = await dryRunRule(
      supabase,
      rule as AutomationRule,
      context as TriggerContext
    );

    return NextResponse.json({
      success: true,
      data: {
        would_execute: result.wouldExecute,
        conditions_met: result.conditionsMet,
        actions_would_run: result.actionsWouldRun,
      },
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    return NextResponse.json(
      { error: 'Failed to test rule' },
      { status: 500 }
    );
  }
}
