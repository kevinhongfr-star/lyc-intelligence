// Phase 3.10: Rule Builder Component - Visual rule creation
'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Zap,
  Filter,
  Play,
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  TRIGGER_TYPE_LABELS,
  ACTION_TYPE_LABELS,
  CONDITION_OPERATOR_LABELS,
} from '@/types/automation';
import type {
  AutomationTriggerType,
  RuleCondition,
  RuleAction,
  ActionType,
  ConditionOperator,
  AutomationRule,
} from '@/types/automation';

interface RuleBuilderProps {
  orgId: string;
  userId: string;
  initialRule?: AutomationRule;
  onSave: (rule: AutomationRule) => void;
  onCancel: () => void;
}

const TRIGGER_TYPES: AutomationTriggerType[] = [
  'stage_change',
  'score_threshold',
  'time_elapsed',
  'status_change',
  'candidate_created',
  'mandate_created',
  'manual',
];

const CONDITION_OPERATORS: ConditionOperator[] = [
  '=', '!=', '>', '>=', '<', '<=', 'contains', 'is_empty', 'is_not_empty',
];

const ACTION_TYPES: ActionType[] = [
  'advance_stage',
  'send_notification',
  'create_task',
  'trigger_assessment',
  'flag_for_review',
  'update_field',
  'send_webhook',
];

const selectClassName = 'w-full px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent';
const textareaClassName = 'w-full px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-y min-h-[60px]';

export function RuleBuilder({ orgId, userId, initialRule, onSave, onCancel }: RuleBuilderProps) {
  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>(
    initialRule?.trigger_type || 'stage_change'
  );
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    initialRule?.trigger_config || {}
  );
  const [conditions, setConditions] = useState<RuleCondition[]>(
    initialRule?.conditions || []
  );
  const [conditionLogic, setConditionLogic] = useState<'AND' | 'OR'>(
    initialRule?.condition_logic || 'AND'
  );
  const [actions, setActions] = useState<RuleAction[]>(
    initialRule?.actions || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const addCondition = () => {
    if (conditions.length >= 10) return;
    setConditions([...conditions, { field: '', operator: '=', value: '' }]);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = () => {
    if (actions.length >= 5) return;
    setActions([...actions, { type: 'advance_stage' }]);
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const method = initialRule?.id ? 'PUT' : 'POST';
      const url = initialRule?.id
        ? `/api/x/automation/rules/${initialRule.id}`
        : '/api/x/automation/rules';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name,
          description,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          conditions,
          condition_logic: conditionLogic,
          actions,
          created_by: userId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSave(result.data);
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTriggerConfig = () => {
    switch (triggerType) {
      case 'stage_change':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">From Stage</label>
              <Input
                value={(triggerConfig.from_stage as string) || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, from_stage: e.target.value })}
                placeholder="e.g., screening"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">To Stage</label>
              <Input
                value={(triggerConfig.to_stage as string) || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, to_stage: e.target.value })}
                placeholder="e.g., interview"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'score_threshold':
        return (
          <div>
            <label className="text-sm font-medium text-text-muted">Assessment Type</label>
            <Input
              value={(triggerConfig.assessment_type as string) || ''}
              onChange={(e) => setTriggerConfig({ ...triggerConfig, assessment_type: e.target.value })}
              placeholder="e.g., SHIFT_LEAP"
              className="mt-1"
            />
          </div>
        );

      case 'time_elapsed':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Days Without Activity</label>
              <Input
                type="number"
                value={(triggerConfig.days_without_activity as number) || 7}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, days_without_activity: parseInt(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Stage (optional)</label>
              <Input
                value={(triggerConfig.stage as string) || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, stage: e.target.value })}
                placeholder="e.g., screening"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'status_change':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Field</label>
              <Input
                value={(triggerConfig.field as string) || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, field: e.target.value })}
                placeholder="e.g., offer_status"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">New Value</label>
              <Input
                value={(triggerConfig.value as string) || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, value: e.target.value })}
                placeholder="e.g., accepted"
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionConfig = (action: RuleAction, index: number) => {
    switch (action.type) {
      case 'advance_stage':
        return (
          <div>
            <label className="text-sm font-medium text-text-muted">Target Stage</label>
            <Input
              value={action.target_stage || ''}
              onChange={(e) => updateAction(index, { target_stage: e.target.value })}
              placeholder="e.g., client_presented"
              className="mt-1"
            />
          </div>
        );

      case 'send_notification':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Target User ID</label>
              <Input
                value={action.target_user_id || ''}
                onChange={(e) => updateAction(index, { target_user_id: e.target.value })}
                placeholder="user id"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Title</label>
              <Input
                value={action.title || ''}
                onChange={(e) => updateAction(index, { title: e.target.value })}
                placeholder="Notification title"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-text-muted">Message</label>
              <textarea
                value={action.message || ''}
                onChange={(e) => updateAction(index, { message: e.target.value })}
                placeholder="Notification message"
                rows={2}
                className={cn(textareaClassName, 'mt-1')}
              />
            </div>
          </div>
        );

      case 'create_task':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Assigned To</label>
              <Input
                value={action.assigned_to || ''}
                onChange={(e) => updateAction(index, { assigned_to: e.target.value })}
                placeholder="user id"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Priority</label>
              <select
                value={action.priority || 'medium'}
                onChange={(e) => updateAction(index, { priority: e.target.value as any })}
                className={cn(selectClassName, 'mt-1')}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-text-muted">Task Title</label>
              <Input
                value={action.task_title || ''}
                onChange={(e) => updateAction(index, { task_title: e.target.value })}
                placeholder="Task title"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'flag_for_review':
        return (
          <div>
            <label className="text-sm font-medium text-text-muted">Reason</label>
            <Input
              value={action.reason || ''}
              onChange={(e) => updateAction(index, { reason: e.target.value })}
              placeholder="Reason for flag"
              className="mt-1"
            />
          </div>
        );

      case 'update_field':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text-muted">Field Name</label>
              <Input
                value={action.field_name || ''}
                onChange={(e) => updateAction(index, { field_name: e.target.value })}
                placeholder="field name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted">Field Value</label>
              <Input
                value={(action.field_value as string) || ''}
                onChange={(e) => updateAction(index, { field_value: e.target.value })}
                placeholder="field value"
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'trigger_assessment':
        return (
          <div>
            <label className="text-sm font-medium text-text-muted">Assessment Type</label>
            <Input
              value={action.trigger_assessment_type || ''}
              onChange={(e) => updateAction(index, { trigger_assessment_type: e.target.value })}
              placeholder="e.g., SHIFT_LEAP"
              className="mt-1"
            />
          </div>
        );

      case 'send_webhook':
        return (
          <div>
            <label className="text-sm font-medium text-text-muted">Webhook URL</label>
            <Input
              value={action.webhook_url || ''}
              onChange={(e) => updateAction(index, { webhook_url: e.target.value })}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-accent" />
          <h2 className="font-serif font-semibold text-lg text-text-primary">
            {initialRule ? 'Edit Rule' : 'New Automation Rule'}
          </h2>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors">
          <X className="w-5 h-5 text-text-secondary" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-text-muted">Rule Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Auto-advance high scorers"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-muted">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this rule do?"
            rows={2}
            className={cn(textareaClassName, 'mt-1')}
          />
        </div>
      </div>

      {/* Trigger */}
      <div className="mb-6 p-4 bg-bg-secondary rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h3 className="font-medium text-text-primary">WHEN: Trigger</h3>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-text-muted">Trigger Type</label>
          <select
            value={triggerType}
            onChange={(e) => {
              setTriggerType(e.target.value as AutomationTriggerType);
              setTriggerConfig({});
            }}
            className={cn(selectClassName, 'mt-1')}
          >
            {TRIGGER_TYPES.map(type => (
              <option key={type} value={type}>
                {TRIGGER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {renderTriggerConfig()}
      </div>

      {/* Conditions */}
      <div className="mb-6 p-4 bg-bg-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium text-text-primary">IF: Conditions</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={conditionLogic}
              onChange={(e) => setConditionLogic(e.target.value as 'AND' | 'OR')}
              className={cn(selectClassName, 'w-24')}
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <Button variant="outline" size="sm" onClick={addCondition} disabled={conditions.length >= 10}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {conditions.length === 0 ? (
          <p className="text-sm text-text-muted">No conditions - rule runs on every trigger</p>
        ) : (
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={condition.field}
                  onChange={(e) => updateCondition(index, { field: e.target.value })}
                  placeholder="Field name"
                  className="flex-1"
                />
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, { operator: e.target.value as ConditionOperator })}
                  className={cn(selectClassName, 'w-36')}
                >
                  {CONDITION_OPERATORS.map(op => (
                    <option key={op} value={op}>
                      {CONDITION_OPERATOR_LABELS[op]}
                    </option>
                  ))}
                </select>
                <Input
                  value={condition.value as string}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder="Value"
                  className="w-32"
                />
                <button
                  onClick={() => removeCondition(index)}
                  className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 p-4 bg-bg-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-500" />
            <h3 className="font-medium text-text-primary">THEN: Actions</h3>
          </div>
          <Button variant="outline" size="sm" onClick={addAction} disabled={actions.length >= 5}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {actions.length === 0 ? (
          <p className="text-sm text-text-muted">No actions defined</p>
        ) : (
          <div className="space-y-4">
            {actions.map((action, index) => (
              <div key={index} className="p-3 bg-bg-base rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, { type: e.target.value as ActionType })}
                    className="flex-1 mr-2"
                    style={{ appearance: 'none' }}
                  >
                    {ACTION_TYPES.map(type => (
                      <option key={type} value={type}>
                        {ACTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeAction(index)}
                    className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {renderActionConfig(action, index)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Toggle */}
      <div className="mb-6">
        <button
          className="flex items-center gap-2 text-sm text-accent hover:underline"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide' : 'Show'} Preview
          {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showPreview && (
          <div className="mt-3 p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-text-primary">
              <span className="font-medium">WHEN</span> {TRIGGER_TYPE_LABELS[triggerType]}
              {conditions.length > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">IF</span> {conditions.length} condition(s) ({conditionLogic})
                </>
              )}
              <span className="mx-2">•</span>
              <span className="font-medium">THEN</span> {actions.length} action(s)
            </p>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className="flex-1"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Rule'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export default RuleBuilder;
