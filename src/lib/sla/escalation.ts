// Phase 3.12: SLA Escalation Logic

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getSLAConfiguration,
  getMandateTimeline,
  updateMilestoneStatus,
  findApplicableEscalations,
  createEscalation,
  createOrUpdateTimeline,
  calculateHealthStatus,
  calculateProgress,
  calculateDaysRemaining,
} from './engine';
import type { MandateTimeline, SLAEscalation } from './engine';

// ═══════════════════════════════════════════════════════════════
// ESCALATION SERVICE
// ═══════════════════════════════════════════════════════════════

/**
 * Check and trigger escalations for a single mandate
 */
export async function checkMandateEscalations(
  supabase: SupabaseClient,
  mandateId: string
): Promise<{
  updated: boolean;
  escalationsCreated: SLAEscalation[];
  timeline: MandateTimeline | null;
}> {
  const escalationsCreated: SLAEscalation[] = [];

  // Get current timeline
  const timeline = await getMandateTimeline(supabase, mandateId);
  if (!timeline) {
    return { updated: false, escalationsCreated, timeline: null };
  }

  // Get SLA configuration
  const config = await getSLAConfiguration(
    supabase,
    timeline.org_id,
    'executive_search' // TODO: Get actual mandate type
  );
  if (!config) {
    return { updated: false, escalationsCreated, timeline };
  }

  // Update milestone statuses
  let updatedMilestones = updateMilestoneStatus(timeline.milestones, timeline.current_stage);

  // Check for applicable escalations
  const applicableEscalations = findApplicableEscalations(updatedMilestones, config.escalation_rules);

  // Create escalations if needed
  for (const { milestone, rule } of applicableEscalations) {
    // Check if escalation already exists for this milestone and action type
    const existingEscalation = await checkExistingEscalation(
      supabase,
      timeline.id,
      milestone.stage,
      rule.action
    );

    if (!existingEscalation) {
      const message = generateEscalationMessage(milestone, rule, timeline);
      const escalation = await createEscalation(
        supabase,
        timeline.mandate_id,
        timeline.org_id,
        timeline.id,
        rule.action,
        milestone.stage,
        message,
        rule.notify_roles
      );

      if (escalation) {
        escalationsCreated.push(escalation);
      }
    }
  }

  // Calculate new health status
  const healthStatus = calculateHealthStatus(updatedMilestones);
  const progress = calculateProgress(updatedMilestones);
  const daysRemaining = calculateDaysRemaining(updatedMilestones, timeline.start_date);

  // Update timeline if status changed
  const statusChanged =
    timeline.health_status !== healthStatus ||
    timeline.overall_progress_pct !== progress ||
    timeline.days_remaining !== daysRemaining;

  if (statusChanged) {
    const updatedTimeline = await createOrUpdateTimeline(
      supabase,
      timeline.mandate_id,
      timeline.org_id,
      timeline.sla_config_id,
      new Date(timeline.start_date),
      timeline.current_stage,
      updatedMilestones
    );

    return {
      updated: true,
      escalationsCreated,
      timeline: updatedTimeline,
    };
  }

  return {
    updated: false,
    escalationsCreated,
    timeline,
  };
}

/**
 * Check if escalation already exists
 */
async function checkExistingEscalation(
  supabase: SupabaseClient,
  timelineId: string,
  milestoneStage: string,
  actionType: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('sla_escalations')
    .select('id', { count: 'exact', head: true })
    .eq('timeline_id', timelineId)
    .eq('milestone_stage', milestoneStage)
    .eq('escalation_type', actionType);

  if (error) return false;
  return count > 0;
}

/**
 * Generate escalation message
 */
function generateEscalationMessage(
  milestone: { stage: string; target_date: string },
  rule: { action: string; threshold_pct: number },
  timeline: MandateTimeline
): string {
  const targetDate = new Date(milestone.target_date);
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const actionLabels: Record<string, string> = {
    warning: 'Warning',
    critical: 'Critical Alert',
    breach: 'SLA Breach',
  };

  return `${actionLabels[rule.action]}: The "${milestone.stage}" milestone for mandate ${timeline.mandate_id} is at ${rule.threshold_pct}% of its target duration. Target date: ${formattedDate}.`;
}

/**
 * Check all mandates in an organization
 */
export async function checkAllMandatesForOrganization(
  supabase: SupabaseClient,
  orgId: string
): Promise<{
  totalChecked: number;
  updatedCount: number;
  escalationsCreated: number;
}> {
  const { data: timelines, error } = await supabase
    .from('mandate_timelines')
    .select('mandate_id')
    .eq('org_id', orgId)
    .not('health_status', 'eq', 'completed');

  if (error || !timelines) {
    return { totalChecked: 0, updatedCount: 0, escalationsCreated: 0 };
  }

  let updatedCount = 0;
  let escalationsCreated = 0;

  for (const timeline of timelines) {
    const result = await checkMandateEscalations(supabase, timeline.mandate_id);
    if (result.updated) updatedCount++;
    escalationsCreated += result.escalationsCreated.length;
  }

  return {
    totalChecked: timelines.length,
    updatedCount,
    escalationsCreated,
  };
}

/**
 * Check all active mandates system-wide
 */
export async function runSLAHealthCheck(
  supabase: SupabaseClient
): Promise<{
  totalOrgsChecked: number;
  totalMandatesChecked: number;
  totalUpdates: number;
  totalEscalations: number;
}> {
  // Get all organizations with active mandates
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id');

  if (error || !orgs) {
    return {
      totalOrgsChecked: 0,
      totalMandatesChecked: 0,
      totalUpdates: 0,
      totalEscalations: 0,
    };
  }

  let totalMandatesChecked = 0;
  let totalUpdates = 0;
  let totalEscalations = 0;

  for (const org of orgs) {
    const result = await checkAllMandatesForOrganization(supabase, org.id);
    totalMandatesChecked += result.totalChecked;
    totalUpdates += result.updatedCount;
    totalEscalations += result.escalationsCreated;
  }

  return {
    totalOrgsChecked: orgs.length,
    totalMandatesChecked,
    totalUpdates,
    totalEscalations,
  };
}

/**
 * Send escalation notifications
 */
export async function sendEscalationNotifications(
  supabase: SupabaseClient,
  escalation: {
    mandate_id: string;
    escalation_type: string;
    message: string;
    notified_roles: string[];
  }
): Promise<void> {
  // In production, this would send notifications via email, in-app, etc.
  // This is a placeholder implementation.

  console.log('Sending escalation notification:', {
    mandateId: escalation.mandate_id,
    type: escalation.escalation_type,
    message: escalation.message,
    roles: escalation.notified_roles,
  });

  // TODO: Integrate with notification service to send actual notifications
}

export default {
  checkMandateEscalations,
  checkAllMandatesForOrganization,
  runSLAHealthCheck,
  sendEscalationNotifications,
};