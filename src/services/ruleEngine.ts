// Phase 3.10: Workflow Automation Rules Engine

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AutomationRule,
  RuleCondition,
  RuleAction,
  TriggerContext,
  RuleExecution,
} from '@/types/automation';

const MAX_ACTIONS_PER_RULE = 5;
const MAX_CONDITIONS_PER_RULE = 10;
const RULE_EXECUTION_TIMEOUT_MS = 10000;

/**
 * Evaluate and execute all matching rules for a trigger event
 */
export async function evaluateAndExecuteRules(
  supabase: SupabaseClient,
  context: TriggerContext
): Promise<{ executed: number; failed: number }> {
  const startTime = Date.now();
  let executed = 0;
  let failed = 0;

  try {
    // Find matching active rules
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('org_id', context.orgId)
      .eq('is_active', true)
      .eq('trigger_type', context.triggerType);

    if (rulesError || !rules || rules.length === 0) {
      return { executed: 0, failed: 0 };
    }

    for (const rule of rules as AutomationRule[]) {
      // Check timeout
      if (Date.now() - startTime > RULE_EXECUTION_TIMEOUT_MS) {
        console.warn(`[ruleEngine] Execution timeout reached after ${executed} rules`);
        break;
      }

      try {
        // Check trigger config match
        if (!matchesTrigger(rule, context)) continue;

        // Evaluate conditions
        const conditionsMet = await evaluateConditions(supabase, rule, context);
        if (!conditionsMet) {
          await logExecution(supabase, rule, context, 'skipped', [], undefined);
          continue;
        }

        // Execute actions
        const actionsExecuted = await executeActions(supabase, rule, context);
        executed++;

        await logExecution(supabase, rule, context, 'success', actionsExecuted, undefined);
      } catch (ruleError) {
        failed++;
        const errorMessage = ruleError instanceof Error ? ruleError.message : 'Unknown error';
        await logExecution(supabase, rule, context, 'failed', [], errorMessage);
        console.error(`[ruleEngine] Rule "${rule.name}" failed:`, ruleError);
      }
    }
  } catch (error) {
    console.error('[ruleEngine] Error evaluating rules:', error);
  }

  return { executed, failed };
}

/**
 * Check if trigger configuration matches the context
 */
export function matchesTrigger(
  rule: AutomationRule,
  context: TriggerContext
): boolean {
  const config = rule.trigger_config;

  switch (rule.trigger_type) {
    case 'stage_change': {
      const fromMatch = !config.from_stage || context.triggerData.from_stage === config.from_stage;
      const toMatch = !config.to_stage || context.triggerData.to_stage === config.to_stage;
      return fromMatch && toMatch;
    }

    case 'score_threshold': {
      return !config.assessment_type || context.triggerData.assessment_type === config.assessment_type;
    }

    case 'status_change': {
      const fieldMatch = !config.field || context.triggerData.field === config.field;
      const valueMatch = !config.value || context.triggerData.new_value === config.value;
      return fieldMatch && valueMatch;
    }

    case 'candidate_created':
    case 'mandate_created':
    case 'manual':
      return true;

    case 'time_elapsed':
      return false;

    default:
      return false;
  }
}

/**
 * Evaluate all conditions for a rule
 */
export async function evaluateConditions(
  supabase: SupabaseClient,
  rule: AutomationRule,
  context: TriggerContext
): Promise<boolean> {
  const conditions = rule.conditions;
  if (!conditions || conditions.length === 0) return true;

  // Fetch entity data for condition evaluation
  const table = context.entityType === 'candidate' ? 'contacts' : 'mandates';
  const { data: entity, error: entityError } = await supabase
    .from(table)
    .select('*')
    .eq('id', context.entityId)
    .single();

  if (entityError || !entity) return false;

  const results = conditions.map(condition =>
    evaluateCondition(condition, entity as Record<string, unknown>, context)
  );

  return rule.condition_logic === 'AND'
    ? results.every(r => r)
    : results.some(r => r);
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: RuleCondition,
  entity: Record<string, unknown>,
  context: TriggerContext
): boolean {
  const fieldValue = resolveFieldValue(condition.field, entity, context);
  const targetValue = condition.value;

  switch (condition.operator) {
    case '=':
      return fieldValue === targetValue;

    case '!=':
      return fieldValue !== targetValue;

    case '>':
      return Number(fieldValue) > Number(targetValue);

    case '>=':
      return Number(fieldValue) >= Number(targetValue);

    case '<':
      return Number(fieldValue) < Number(targetValue);

    case '<=':
      return Number(fieldValue) <= Number(targetValue);

    case 'contains':
      return String(fieldValue).includes(String(targetValue));

    case 'is_empty':
      return !fieldValue || fieldValue === '';

    case 'is_not_empty':
      return !!fieldValue && fieldValue !== '';

    default:
      return false;
  }
}

/**
 * Resolve field value, supporting nested fields via dot notation
 */
export function resolveFieldValue(
  field: string,
  entity: Record<string, unknown>,
  context: TriggerContext
): unknown {
  // Support nested fields via dot notation
  if (field.includes('.')) {
    const parts = field.split('.');
    let current: unknown = entity;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Also check trigger data
  if (field in context.triggerData) {
    return context.triggerData[field];
  }

  return entity[field];
}

/**
 * Execute all actions for a rule
 */
export async function executeActions(
  supabase: SupabaseClient,
  rule: AutomationRule,
  context: TriggerContext,
  dryRun: boolean = false
): Promise<string[]> {
  const actions = rule.actions;
  if (!actions || actions.length === 0) return [];

  // Enforce max actions limit
  const limitedActions = actions.slice(0, MAX_ACTIONS_PER_RULE);
  const executedActions: string[] = [];

  for (const action of limitedActions) {
    if (dryRun) {
      executedActions.push(action.type);
    } else {
      await executeAction(supabase, action, context);
      executedActions.push(action.type);
    }
  }

  if (!dryRun) {
    // Update rule execution count
    await supabase
      .from('automation_rules')
      .update({
        execution_count: rule.execution_count + 1,
        last_executed_at: new Date().toISOString(),
      })
      .eq('id', rule.id);
  }

  return executedActions;
}

/**
 * Execute a single action
 */
export async function executeAction(
  supabase: SupabaseClient,
  action: RuleAction,
  context: TriggerContext
): Promise<void> {
  switch (action.type) {
    case 'advance_stage': {
      if (!action.target_stage) return;

      const table = context.entityType === 'candidate' ? 'contacts' : 'mandates';
      await supabase
        .from(table)
        .update({
          pipeline_stage: action.target_stage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.entityId);
      break;
    }

    case 'send_notification': {
      if (!action.target_user_id) return;

      try {
        await supabase.from('notifications').insert({
          org_id: context.orgId,
          user_id: action.target_user_id,
          type: action.notification_type ?? 'info',
          title: action.title || 'Automation Rule',
          message: action.message || 'Automation rule triggered',
          entity_type: context.entityType,
          entity_id: context.entityId,
        });
      } catch (notifyError) {
        console.warn('[ruleEngine] Notification send failed:', notifyError);
      }
      break;
    }

    case 'create_task': {
      if (!action.assigned_to || !action.task_title) return;

      try {
        await supabase.from('tasks').insert({
          org_id: context.orgId,
          assigned_to: action.assigned_to,
          title: action.task_title,
          description: action.task_description,
          priority: action.priority ?? 'medium',
          due_at: action.due_at,
          entity_type: context.entityType,
          entity_id: context.entityId,
          status: 'pending',
        });
      } catch (taskError) {
        console.warn('[ruleEngine] Task creation failed:', taskError);
      }
      break;
    }

    case 'trigger_assessment': {
      // Would integrate with assessment system
      console.log(`[ruleEngine] Triggering assessment: ${action.trigger_assessment_type}`);
      break;
    }

    case 'flag_for_review': {
      const table = context.entityType === 'candidate' ? 'contacts' : 'mandates';
      await supabase
        .from(table)
        .update({
          flag: 'review_required',
          flag_reason: action.reason ?? 'Flagged by automation rule',
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.entityId);
      break;
    }

    case 'update_field': {
      if (!action.field_name) return;

      const table = context.entityType === 'candidate' ? 'contacts' : 'mandates';
      const updates: Record<string, unknown> = {
        [action.field_name]: action.field_value,
        updated_at: new Date().toISOString(),
      };

      await supabase.from(table).update(updates).eq('id', context.entityId);
      break;
    }

    case 'send_webhook': {
      if (!action.webhook_url) return;

      try {
        await fetch(action.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'rule_executed',
            entity_type: context.entityType,
            entity_id: context.entityId,
            trigger_data: context.triggerData,
            rule_id: context.orgId,
          }),
        });
      } catch (webhookError) {
        console.warn('[ruleEngine] Webhook send failed:', webhookError);
      }
      break;
    }
  }
}

/**
 * Log rule execution
 */
async function logExecution(
  supabase: SupabaseClient,
  rule: AutomationRule,
  context: TriggerContext,
  status: 'success' | 'failed' | 'skipped',
  actionsExecuted: string[],
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('rule_executions').insert({
      org_id: context.orgId,
      rule_id: rule.id,
      entity_type: context.entityType,
      entity_id: context.entityId,
      trigger_data: context.triggerData,
      status,
      actions_executed: actionsExecuted,
      error_message: errorMessage,
    });
  } catch (logError) {
    console.error('[ruleEngine] Failed to log execution:', logError);
  }
}

/**
 * Dry run a rule against an entity (no actual actions)
 */
export async function dryRunRule(
  supabase: SupabaseClient,
  rule: AutomationRule,
  context: TriggerContext
): Promise<{
  wouldExecute: boolean;
  conditionsMet: boolean;
  actionsWouldRun: string[];
}> {
  // Check trigger config match
  if (!matchesTrigger(rule, context)) {
    return { wouldExecute: false, conditionsMet: false, actionsWouldRun: [] };
  }

  // Evaluate conditions
  const conditionsMet = await evaluateConditions(supabase, rule, context);
  if (!conditionsMet) {
    return { wouldExecute: false, conditionsMet: false, actionsWouldRun: [] };
  }

  // Return actions that would run
  const actionsWouldRun = (rule.actions || []).map(a => a.type);
  return { wouldExecute: true, conditionsMet: true, actionsWouldRun };
}

export default {
  evaluateAndExecuteRules,
  matchesTrigger,
  evaluateConditions,
  evaluateCondition,
  resolveFieldValue,
  executeActions,
  executeAction,
  dryRunRule,
};
