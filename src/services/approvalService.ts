// Phase 3.11: Approval Service - Core Approval Logic

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface WorkflowStep {
  step_order: number;
  approver_role: string;
  approver_id: string | null;
  escalation_hours: number;
  escalation_approver_role: string;
  is_parallel: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  org_id: string;
  name: string;
  approval_type: string;
  description: string | null;
  is_active: boolean;
  steps: WorkflowStep[];
  conditions: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  org_id: string;
  workflow_id: string;
  approval_type: string;
  entity_type: string;
  entity_id: string;
  request_data: Record<string, unknown>;
  requested_by: string;
  requested_at: string;
  current_step: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  final_decision: 'approved' | 'rejected' | null;
  final_comment: string | null;
  decided_at: string | null;
  sla_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStepRecord {
  id: string;
  org_id: string;
  request_id: string;
  step_order: number;
  approver_id: string;
  approver_role: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'delegated' | 'escalated';
  decision: 'approved' | 'rejected' | null;
  comment: string | null;
  decided_at: string | null;
  delegated_from: string | null;
  delegated_at: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  created_at: string;
}

export interface ApprovalDelegation {
  id: string;
  org_id: string;
  delegator_id: string;
  delegate_id: string;
  approval_type: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateApprovalRequestInput {
  orgId: string;
  approvalType: string;
  entityType: string;
  entityId: string;
  requestData: Record<string, unknown>;
  requestedBy: string;
}

export interface ApproveStepInput {
  requestId: string;
  stepOrder: number;
  approverId: string;
  decision: 'approved' | 'rejected';
  comment?: string;
}

// ═══════════════════════════════════════════════════════════════
// CORE APPROVAL LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new approval request
 */
export async function createApprovalRequest(
  supabase: SupabaseClient,
  input: CreateApprovalRequestInput
): Promise<{ request_id: string; error?: string }> {
  const { orgId, approvalType, entityType, entityId, requestData, requestedBy } = input;

  // Find matching workflow
  const { data: workflows, error: workflowError } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('org_id', orgId)
    .eq('approval_type', approvalType)
    .eq('is_active', true);

  if (workflowError) {
    return { request_id: '', error: workflowError.message };
  }

  if (!workflows || workflows.length === 0) {
    return { request_id: '', error: 'No active workflow for this approval type' };
  }

  // Find matching workflow based on conditions
  const workflow = workflows.find((wf: ApprovalWorkflow) =>
    matchesConditions(wf.conditions, requestData)
  ) ?? workflows[0];

  // Calculate SLA deadline
  const slaHours = getMaxSlaHours(workflow);
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

  // Create request
  const { data: request, error: requestError } = await supabase
    .from('approval_requests')
    .insert({
      org_id: orgId,
      workflow_id: workflow.id,
      approval_type: approvalType,
      entity_type: entityType,
      entity_id: entityId,
      request_data: requestData,
      requested_by: requestedBy,
      current_step: 1,
      status: 'pending',
      sla_deadline: slaDeadline,
    })
    .select()
    .single();

  if (requestError || !request) {
    return { request_id: '', error: requestError?.message ?? 'Failed to create request' };
  }

  // Create step records for each approval step
  const steps = workflow.steps as WorkflowStep[];
  for (const step of steps) {
    const approverId = await resolveApprover(supabase, orgId, step, requestedBy, approvalType);

    await supabase.from('approval_step_records').insert({
      org_id: orgId,
      request_id: request.id,
      step_order: step.step_order,
      approver_id: approverId,
      approver_role: step.approver_role,
      status: 'pending',
    });
  }

  // Audit log
  await supabase.from('approval_audit_log').insert({
    org_id: orgId,
    request_id: request.id,
    action: 'requested',
    actor_id: requestedBy,
    details: {
      approval_type: approvalType,
      entity_type: entityType,
      entity_id: entityId,
    },
  });

  // Notify first approver
  await notifyApprover(supabase, orgId, request.id, 1);

  // Update request status to in_review
  await supabase
    .from('approval_requests')
    .update({ status: 'in_review' })
    .eq('id', request.id);

  return { request_id: request.id };
}

/**
 * Resolve approver for a step, checking delegations
 */
export async function resolveApprover(
  supabase: SupabaseClient,
  orgId: string,
  step: WorkflowStep,
  requestedBy: string,
  approvalType: string
): Promise<string> {
  // If specific user assigned, use them
  if (step.approver_id) {
    // Check if this user has delegated
    const delegatedTo = await checkDelegation(supabase, orgId, step.approver_id, approvalType);
    return delegatedTo ?? step.approver_id;
  }

  // Find the user with the matching role in this org
  const { data: users } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('role', step.approver_role);

  if (!users || users.length === 0) {
    // Fallback to org owner
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .single();

    const fallbackId = org?.owner_id ?? requestedBy;
    const delegatedTo = await checkDelegation(supabase, orgId, fallbackId, approvalType);
    return delegatedTo ?? fallbackId;
  }

  const primaryApprover = users[0].id;
  const delegatedTo = await checkDelegation(supabase, orgId, primaryApprover, approvalType);
  return delegatedTo ?? primaryApprover;
}

/**
 * Check if user has active delegation for this approval type
 */
export async function checkDelegation(
  supabase: SupabaseClient,
  orgId: string,
  delegatorId: string,
  approvalType: string
): Promise<string | null> {
  const now = new Date().toISOString();

  const { data: delegations } = await supabase
    .from('approval_delegations')
    .select('delegate_id')
    .eq('org_id', orgId)
    .eq('delegator_id', delegatorId)
    .eq('approval_type', approvalType)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .limit(1);

  if (!delegations || delegations.length === 0) return null;
  return delegations[0].delegate_id;
}

/**
 * Check if request data matches workflow conditions
 */
export function matchesConditions(
  conditions: Record<string, unknown> | null,
  data: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, value] of Object.entries(conditions)) {
    if (key.startsWith('min_')) {
      const field = key.replace('min_', '');
      if (Number(data[field]) < Number(value)) return false;
    } else if (key.startsWith('max_')) {
      const field = key.replace('max_', '');
      if (Number(data[field]) > Number(value)) return false;
    } else {
      if (data[key] !== value) return false;
    }
  }

  return true;
}

/**
 * Get maximum SLA hours from workflow steps
 */
export function getMaxSlaHours(workflow: { steps: WorkflowStep[] }): number {
  return workflow.steps.reduce((max, s) => Math.max(max, s.escalation_hours ?? 24), 0);
}

/**
 * Approve or reject a step
 */
export async function approveStep(
  supabase: SupabaseClient,
  input: ApproveStepInput
): Promise<{ success: boolean; error?: string }> {
  const { requestId, stepOrder, approverId, decision, comment } = input;

  // Update step record
  const { error: stepError, data: updatedStep } = await supabase
    .from('approval_step_records')
    .update({
      status: decision,
      decision,
      comment,
      decided_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .eq('step_order', stepOrder)
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .select()
    .single();

  if (stepError || !updatedStep) {
    return { success: false, error: stepError?.message ?? 'Step not found or already decided' };
  }

  // Get request
  const { data: request, error: requestError } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    return { success: false, error: 'Request not found' };
  }

  // Audit log
  await supabase.from('approval_audit_log').insert({
    org_id: request.org_id,
    request_id: requestId,
    action: decision === 'approved' ? 'step_approved' : 'step_rejected',
    actor_id: approverId,
    details: { step_order: stepOrder, comment },
  });

  if (decision === 'rejected') {
    // Reject entire request
    await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        final_decision: 'rejected',
        final_comment: comment,
        decided_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return { success: true };
  }

  // Check if this was the last step
  const { data: allSteps } = await supabase
    .from('approval_step_records')
    .select('step_order')
    .eq('request_id', requestId);

  const maxStep = Math.max(...(allSteps?.map((s: ApprovalStepRecord) => s.step_order) ?? [0]));

  if (stepOrder >= maxStep) {
    // All steps approved
    await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        final_decision: 'approved',
        final_comment: 'All steps approved',
        decided_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Audit log for final approval
    await supabase.from('approval_audit_log').insert({
      org_id: request.org_id,
      request_id: requestId,
      action: 'fully_approved',
      actor_id: approverId,
      details: { final_step: stepOrder },
    });
  } else {
    // Advance to next step
    await supabase
      .from('approval_requests')
      .update({
        current_step: stepOrder + 1,
        status: 'in_review',
      })
      .eq('id', requestId);

    // Notify next approver
    await notifyApprover(supabase, request.org_id, requestId, stepOrder + 1);
  }

  return { success: true };
}

/**
 * Send notification to approver
 */
export async function notifyApprover(
  supabase: SupabaseClient,
  orgId: string,
  requestId: string,
  stepOrder: number
): Promise<void> {
  const { data: step } = await supabase
    .from('approval_step_records')
    .select('approver_id')
    .eq('request_id', requestId)
    .eq('step_order', stepOrder)
    .single();

  if (!step) return;

  // Check if notifications table exists and send notification
  try {
    await supabase.from('notifications').insert({
      org_id: orgId,
      user_id: step.approver_id,
      type: 'approval_required',
      title: 'Approval Required',
      message: `You have a pending approval request (#${requestId.slice(0, 8)})`,
      entity_type: 'approval_request',
      entity_id: requestId,
    });
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}

/**
 * Get pending approvals for a user
 */
export async function getMyPendingApprovals(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<ApprovalRequest[]> {
  const { data: steps } = await supabase
    .from('approval_step_records')
    .select(`
      request_id,
      approval_requests!inner(*)
    `)
    .eq('approver_id', userId)
    .eq('status', 'pending')
    .eq('approval_requests.org_id', orgId)
    .order('created_at', { ascending: false });

  if (!steps) return [];

  return steps.map((s: any) => s.approval_requests);
}

/**
 * Get approval request with step details
 */
export async function getApprovalRequestDetail(
  supabase: SupabaseClient,
  requestId: string
): Promise<{ request: ApprovalRequest; steps: ApprovalStepRecord[]; audit: any[] } | null> {
  const { data: request } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) return null;

  const { data: steps } = await supabase
    .from('approval_step_records')
    .select('*')
    .eq('request_id', requestId)
    .order('step_order', { ascending: true });

  const { data: audit } = await supabase
    .from('approval_audit_log')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  return {
    request: request as ApprovalRequest,
    steps: (steps ?? []) as ApprovalStepRecord[],
    audit: audit ?? [],
  };
}

/**
 * Cancel an approval request
 */
export async function cancelApprovalRequest(
  supabase: SupabaseClient,
  requestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: request } = await supabase
    .from('approval_requests')
    .select('requested_by, org_id, status')
    .eq('id', requestId)
    .single();

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  if (request.requested_by !== userId) {
    return { success: false, error: 'Only the requester can cancel' };
  }

  if (['approved', 'rejected', 'cancelled'].includes(request.status)) {
    return { success: false, error: 'Cannot cancel a completed request' };
  }

  await supabase
    .from('approval_requests')
    .update({
      status: 'cancelled',
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  // Cancel all pending steps
  await supabase
    .from('approval_step_records')
    .update({ status: 'cancelled' })
    .eq('request_id', requestId)
    .eq('status', 'pending');

  // Audit log
  await supabase.from('approval_audit_log').insert({
    org_id: request.org_id,
    request_id: requestId,
    action: 'cancelled',
    actor_id: userId,
    details: {},
  });

  return { success: true };
}

export default {
  createApprovalRequest,
  approveStep,
  resolveApprover,
  checkDelegation,
  matchesConditions,
  getMaxSlaHours,
  getMyPendingApprovals,
  getApprovalRequestDetail,
  cancelApprovalRequest,
  notifyApprover,
};
