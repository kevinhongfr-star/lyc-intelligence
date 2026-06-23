// Phase 3.10: Workflow Automation Scheduler
// Time-based rule scheduling and execution

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateAndExecuteRules } from './ruleEngine';
import type { AutomationRule } from '@/types/automation';

/**
 * When a rule with trigger_type='time_elapsed' is created,
 * schedule checks for all matching entities.
 */
export async function scheduleTimeChecks(
  supabase: SupabaseClient,
  ruleId: string,
  orgId: string
): Promise<number> {
  const { data: rule, error: ruleError } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (ruleError || !rule) {
    console.error('[scheduler] Rule not found:', ruleError);
    return 0;
  }

  const automationRule = rule as AutomationRule;
  if (automationRule.trigger_type !== 'time_elapsed') {
    return 0;
  }

  const config = automationRule.trigger_config;
  const days = config.days_without_activity as number || 7;
  const stage = config.stage as string | undefined;

  // Find candidates matching criteria
  let query = supabase
    .from('contacts')
    .select('id')
    .eq('org_id', orgId);

  if (stage) {
    query = query.eq('pipeline_stage', stage);
  }

  const { data: candidates, error: candidatesError } = await query;

  if (candidatesError || !candidates || candidates.length === 0) {
    return 0;
  }

  // Schedule checks
  const checkAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const checks = candidates.map(c => ({
    org_id: orgId,
    rule_id: ruleId,
    entity_type: 'candidate' as const,
    entity_id: c.id,
    check_at: checkAt,
  }));

  // Insert in batches to avoid too large queries
  const batchSize = 100;
  let scheduled = 0;

  for (let i = 0; i < checks.length; i += batchSize) {
    const batch = checks.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('rule_scheduled_checks')
      .insert(batch);

    if (insertError) {
      console.error('[scheduler] Failed to insert scheduled checks:', insertError);
    } else {
      scheduled += batch.length;
    }
  }

  console.log(`[scheduler] Scheduled ${scheduled} checks for rule ${ruleId}`);
  return scheduled;
}

/**
 * Cancel all scheduled checks for a rule
 */
export async function cancelScheduledChecks(
  supabase: SupabaseClient,
  ruleId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('rule_scheduled_checks')
    .update({ status: 'cancelled' })
    .eq('rule_id', ruleId)
    .eq('status', 'pending')
    .select('id');

  if (error) {
    console.error('[scheduler] Failed to cancel checks:', error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Schedule a check for a single entity
 */
export async function scheduleEntityCheck(
  supabase: SupabaseClient,
  ruleId: string,
  orgId: string,
  entityType: 'candidate' | 'mandate',
  entityId: string,
  days: number
): Promise<void> {
  const checkAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from('rule_scheduled_checks').insert({
    org_id: orgId,
    rule_id: ruleId,
    entity_type: entityType,
    entity_id: entityId,
    check_at: checkAt,
  });
}

/**
 * Runs pending scheduled checks. Called by Vercel Cron every hour.
 */
export async function runScheduledChecks(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<{ executed: number; failed: number }> {
  const now = new Date().toISOString();

  const { data: pending, error: pendingError } = await supabase
    .from('rule_scheduled_checks')
    .select('*')
    .eq('status', 'pending')
    .lte('check_at', now)
    .order('check_at', { ascending: true })
    .limit(limit);

  if (pendingError || !pending || pending.length === 0) {
    console.log('[scheduler] No pending checks to run');
    return { executed: 0, failed: 0 };
  }

  let executed = 0;
  let failed = 0;

  for (const check of pending) {
    try {
      const result = await evaluateAndExecuteRules(supabase, {
        entityType: check.entity_type as 'candidate' | 'mandate',
        entityId: check.entity_id,
        orgId: check.org_id,
        triggerType: 'time_elapsed',
        triggerData: {
          scheduled_check_id: check.id,
          rule_id: check.rule_id,
        },
      });

      // Mark as executed
      await supabase
        .from('rule_scheduled_checks')
        .update({ status: 'executed' })
        .eq('id', check.id);

      if (result.executed > 0) {
        executed++;
      }
    } catch (error) {
      failed++;
      console.error(`[scheduler] Failed to run check ${check.id}:`, error);
    }
  }

  console.log(`[scheduler] Run complete: ${executed} executed, ${failed} failed`);
  return { executed, failed };
}

/**
 * Reschedule time-based checks for all active rules
 * Run daily to ensure new entities get checked
 */
export async function rescheduleAllTimeRules(
  supabase: SupabaseClient
): Promise<number> {
  const { data: rules, error: rulesError } = await supabase
    .from('automation_rules')
    .select('id, org_id, trigger_type, trigger_config')
    .eq('is_active', true)
    .eq('trigger_type', 'time_elapsed');

  if (rulesError || !rules) {
    return 0;
  }

  let totalScheduled = 0;

  for (const rule of rules) {
    // Cancel existing pending checks
    await cancelScheduledChecks(supabase, rule.id);

    // Schedule new ones
    const scheduled = await scheduleTimeChecks(supabase, rule.id, rule.org_id);
    totalScheduled += scheduled;
  }

  return totalScheduled;
}

export default {
  scheduleTimeChecks,
  cancelScheduledChecks,
  scheduleEntityCheck,
  runScheduledChecks,
  rescheduleAllTimeRules,
};
