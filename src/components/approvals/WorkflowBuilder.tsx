// Phase 3.11: Workflow Builder Component
'use client';

import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Clock,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select } from '@/components/ui';
import { Textarea } from '@/components/ui';

interface WorkflowStepInput {
  step_order: number;
  approver_role: string;
  approver_id: string | null;
  escalation_hours: number;
  escalation_approver_role: string;
  is_parallel: boolean;
}

interface WorkflowBuilderProps {
  orgId: string;
  userId: string;
  onSave: (workflow: any) => void;
  onCancel: () => void;
  initialWorkflow?: any;
}

const APPROVAL_TYPES = [
  { value: 'candidate_submission', label: 'Candidate Submission' },
  { value: 'fee_change', label: 'Fee Change' },
  { value: 'offer_approval', label: 'Offer Approval' },
  { value: 'mandate_creation', label: 'Mandate Creation' },
  { value: 'budget_exception', label: 'Budget Exception' },
  { value: 'data_export', label: 'Data Export' },
  { value: 'custom', label: 'Custom' },
];

const ROLES = [
  'consultant',
  'senior_consultant',
  'principal',
  'partner',
  'managing_partner',
  'finance',
  'compliance',
  'admin',
];

export function WorkflowBuilder({ orgId, userId, onSave, onCancel, initialWorkflow }: WorkflowBuilderProps) {
  const [name, setName] = useState(initialWorkflow?.name || '');
  const [approvalType, setApprovalType] = useState(initialWorkflow?.approval_type || 'custom');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  const [steps, setSteps] = useState<WorkflowStepInput[]>(
    initialWorkflow?.steps || [
      {
        step_order: 1,
        approver_role: 'partner',
        approver_id: null,
        escalation_hours: 24,
        escalation_approver_role: 'managing_partner',
        is_parallel: false,
      },
    ]
  );
  const [isSaving, setIsSaving] = useState(false);

  const addStep = () => {
    const newStep: WorkflowStepInput = {
      step_order: steps.length + 1,
      approver_role: 'partner',
      approver_id: null,
      escalation_hours: 24,
      escalation_approver_role: 'managing_partner',
      is_parallel: false,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    newSteps.forEach((s, i) => (s.step_order = i + 1));
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    newSteps.forEach((s, i) => (s.step_order = i + 1));
    setSteps(newSteps);
  };

  const updateStep = (index: number, updates: Partial<WorkflowStepInput>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const method = initialWorkflow?.id ? 'PUT' : 'POST';
      const url = initialWorkflow?.id
        ? `/api/approvals/workflows?id=${initialWorkflow.id}`
        : '/api/approvals/workflows';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          name,
          approval_type: approvalType,
          description,
          steps,
          conditions: {},
          created_by: userId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSave(result.data);
      }
    } catch (err) {
      console.error('Failed to save workflow:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-primary" />
          <h2 className="font-semibold text-text-primary">
            {initialWorkflow ? 'Edit Workflow' : 'New Workflow'}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Basic Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-text-muted">Workflow Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Candidate Submission Approval"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted">Approval Type *</label>
            <Select
              value={approvalType}
              onValueChange={(value) => setApprovalType(value)}
              className="mt-1"
            >
              {APPROVAL_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this workflow..."
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-text-primary">Approval Steps</h3>
          <Button variant="outline" size="sm" onClick={addStep} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Step
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="p-4 bg-bg-alt rounded-none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {step.step_order}
                  </div>
                  <span className="font-medium text-text-primary">Step {step.step_order}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Approver Role
                  </label>
                  <Select
                    value={step.approver_role}
                    onValueChange={(value) => updateStep(index, { approver_role: value })}
                    className="mt-1"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Escalation (hours)
                  </label>
                  <Input
                    type="number"
                    value={step.escalation_hours}
                    onChange={(e) => updateStep(index, { escalation_hours: parseInt(e.target.value) || 24 })}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-text-muted">Escalation Role</label>
                  <Select
                    value={step.escalation_approver_role}
                    onValueChange={(value) => updateStep(index, { escalation_approver_role: value })}
                    className="mt-1"
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className="flex-1 gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Workflow'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export default WorkflowBuilder;
