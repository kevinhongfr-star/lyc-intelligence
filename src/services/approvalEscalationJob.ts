// Phase 3.11: Approval Escalation Job
// Runs hourly via Vercel Cron to escalate overdue approvals

import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveApprover } from './approvalService';
import type { WorkflowStep } from './approvalService';

/**
 * Escalate overdue approval requests
 * @returns Number of escalated requests
 */
export async function escalateOverdueApprovals(
  supabase: SupabaseClient
): Promise<number> {
  // Find steps past their escalation deadline (24+ hours old)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: overdueSteps, error } = await supabase
    .from('approval_step_records')
    .select(`
      id,
      request_id,
      step_order,
      approver_id,
      org_id,
      created_at,
      approval_requests:approval_requests(
        sla_deadline,
        workflow_id,
        approval_type
      )
    `)
    .eq('status', 'pending')
    .lte('created_at', twentyFourHoursAgo);

  if (error || !overdueSteps || overdueSteps.length === 0) {
    console.log('[escalation] No overdue approval steps found');
    return 0;
  }

  let escalated = 0;

  for (const step of overdueSteps) {
    try {
      const requestData = step.approval_requests as unknown as {
        sla_deadline: string;
        workflow_id: string;
        approval_type: string;
      };

      if (!requestData?.workflow_id) continue;

      // Get workflow to find escalation approver
      const { data: workflow } = await supabase
        .from('approval_workflows')
        .select('steps')
        .eq('id', requestData.workflow_id)
        .single();

      if (!workflow?.steps) continue;

      const steps = workflow.steps as WorkflowStep[];
      const currentStepConfig = steps.find(s => s.step_order === step.step_order);

      if (!currentStepConfig?.escalation_approver_role) continue;

      // Find escalation approver
      const escalationApproverId = await resolveApprover(
        supabase,
        step.org_id,
        {
          step_order: step.step_order,
          approver_role: currentStepConfig.escalation_approver_role,
          approver_id: null,
          escalation_hours: 24,
          escalation_approver_role: '',
          is_parallel: false,
        },
        step.approver_id,
        requestData.approval_type
      );

      if (!escalationApproverId || escalationApproverId === step.approver_id) {
        continue;
      }

      // Update original step to escalated
      await supabase
        .from('approval_step_records')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          escalated_to: escalationApproverId,
        })
        .eq('id', step.id);

      // Create new step for escalator
      await supabase.from('approval_step_records').insert({
        org_id: step.org_id,
        request_id: step.request_id,
        step_order: step.step_order,
        approver_id: escalationApproverId,
        approver_role: currentStepConfig.escalation_approver_role,
        status: 'pending',
        delegated_from: step.approver_id,
      });

      // Update request status to escalated
      await supabase
        .from('approval_requests')
        .update({
          status: 'escalated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', step.request_id);

      // Audit log
      await supabase.from('approval_audit_log').insert({
        org_id: step.org_id,
        request_id: step.request_id,
        action: 'escalated',
        actor_id: step.approver_id,
        details: {
          step_order: step.step_order,
          escalated_to: escalationApproverId,
          reason: 'SLA breach (24+ hours overdue)',
        },
      });

      // Notify escalation approver
      try {
        await supabase.from('notifications').insert({
          org_id: step.org_id,
          user_id: escalationApproverId,
          type: 'approval_escalated',
          title: 'Escalated Approval',
          message: `An approval has been escalated to you due to SLA breach`,
          entity_type: 'approval_request',
          entity_id: step.request_id,
        });
      } catch (notifyErr) {
        console.warn('[escalation] Failed to send notification:', notifyErr);
      }

      escalated++;
      console.log(`[escalation] Escalated step ${step.id} to ${escalationApproverId}`);
    } catch (err) {
      console.error(`[escalation] Error processing step ${step.id}:`, err);
    }
  }

  console.log(`[escalation] Total escalated: ${escalated}`);
  return escalated;
}

/**
 * Send SLA warning reminders for approaching deadlines
 * @returns Number of warnings sent
 */
export async function sendSlaWarnings(
  supabase: SupabaseClient
): Promise<number> {
  // Find steps with SLA deadline within next 12 hours
  const twelveHoursFromNow = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: approachingSteps, error } = await supabase
    .from('approval_step_records')
    .select(`
      id,
      approver_id,
      request_id,
      org_id,
      approval_requests:approval_requests(
        sla_deadline
      )
    `)
    .eq('status', 'pending')
    .lte('approval_requests.sla_deadline', twelveHoursFromNow)
    .gte('approval_requests.sla_deadline', now);

  if (error || !approachingSteps || approachingSteps.length === 0) {
    console.log('[sla-warning] No approaching SLA deadlines');
    return 0;
  }

  let warnings = 0;

  for (const step of approachingSteps) {
    try {
      const requestData = step.approval_requests as unknown as {
        sla_deadline: string;
      };

      // Send warning notification
      try {
        await supabase.from('notifications').insert({
          org_id: step.org_id,
          user_id: step.approver_id,
          type: 'sla_warning',
          title: 'Approval SLA Approaching',
          message: `Approval request is due within 12 hours`,
          entity_type: 'approval_request',
          entity_id: step.request_id,
        });
        warnings++;
      } catch (notifyErr) {
        console.warn('[sla-warning] Failed to send notification:', notifyErr);
      }
    } catch (err) {
      console.error(`[sla-warning] Error processing step ${step.id}:`, err);
    }
  }

  console.log(`[sla-warning] Total warnings: ${warnings}`);
  return warnings;
}

/**
 * Run full escalation check (warnings + escalations)
 */
export async function runEscalationCheck(
  supabase: SupabaseClient
): Promise<{ escalated: number; warnings: number }> {
  console.log('[escalation] Starting escalation check...');

  const warnings = await sendSlaWarnings(supabase);
  const escalated = await escalateOverdueApprovals(supabase);

  console.log(`[escalation] Check complete: ${escalated} escalated, ${warnings} warnings`);
  return { escalated, warnings };
}

export default {
  escalateOverdueApprovals,
  sendSlaWarnings,
  runEscalationCheck,
};
