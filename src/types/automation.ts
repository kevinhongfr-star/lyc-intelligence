// Phase 3.10: Workflow Automation Type Definitions

export interface AutomationRule {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  trigger_type: AutomationTriggerType;
  trigger_config: Record<string, unknown>;
  conditions: RuleCondition[];
  condition_logic: 'AND' | 'OR';
  actions: RuleAction[];
  execution_count: number;
  last_executed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AutomationTriggerType =
  | 'stage_change'
  | 'score_threshold'
  | 'time_elapsed'
  | 'status_change'
  | 'manual'
  | 'candidate_created'
  | 'mandate_created';

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export type ConditionOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'contains'
  | 'is_empty'
  | 'is_not_empty';

export interface RuleAction {
  type: ActionType;
  target_stage?: string;
  target_user_id?: string;
  notification_type?: string;
  title?: string;
  message?: string;
  assigned_to?: string;
  task_title?: string;
  task_description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_at?: string;
  reason?: string;
  field_name?: string;
  field_value?: unknown;
  webhook_url?: string;
  trigger_assessment_type?: string;
}

export type ActionType =
  | 'advance_stage'
  | 'send_notification'
  | 'create_task'
  | 'trigger_assessment'
  | 'flag_for_review'
  | 'update_field'
  | 'send_webhook';

export interface RuleExecution {
  id: string;
  org_id: string;
  rule_id: string;
  entity_type: 'candidate' | 'mandate';
  entity_id: string;
  trigger_data: Record<string, unknown>;
  status: 'success' | 'failed' | 'skipped';
  actions_executed: string[];
  error_message?: string;
  executed_at: string;
}

export interface TriggerContext {
  entityType: 'candidate' | 'mandate';
  entityId: string;
  orgId: string;
  triggerType: AutomationTriggerType;
  triggerData: Record<string, unknown>;
}

export interface ScheduledCheck {
  id: string;
  org_id: string;
  rule_id: string;
  entity_type: string;
  entity_id: string;
  check_at: string;
  status: 'pending' | 'executed' | 'cancelled';
  created_at: string;
}

export const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  stage_change: 'Stage Change',
  score_threshold: 'Score Threshold',
  time_elapsed: 'Time Elapsed',
  status_change: 'Status Change',
  manual: 'Manual Trigger',
  candidate_created: 'Candidate Created',
  mandate_created: 'Mandate Created',
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  advance_stage: 'Advance Stage',
  send_notification: 'Send Notification',
  create_task: 'Create Task',
  trigger_assessment: 'Trigger Assessment',
  flag_for_review: 'Flag for Review',
  update_field: 'Update Field',
  send_webhook: 'Send Webhook',
};

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '=': 'equals',
  '!=': 'not equals',
  '>': 'greater than',
  '>=': 'greater or equal',
  '<': 'less than',
  '<=': 'less or equal',
  'contains': 'contains',
  'is_empty': 'is empty',
  'is_not_empty': 'is not empty',
};
