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
import { sendNotification, type NotificationType } from '@/services/notifications/notificationService';

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
        // Fire-and-forget notification dispatch
        void sendEscalationNotifications(supabase, {
          mandate_id: escalation.mandate_id,
          org_id: escalation.org_id,
          timeline_id: escalation.timeline_id,
          escalation_type: escalation.escalation_type,
          milestone_stage: escalation.milestone_stage,
          message: escalation.message,
          notified_roles: escalation.notified_roles,
        });
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
 *
 * Resolves recipients by combining two strategies:
 *   1. Look up active assignees on the mandate (account_executive, lead_consultant, etc.)
 *   2. Look up org members whose role matches the SLA rule's notify_roles list
 *
 * Then dispatches an in-app + email notification to each recipient via the
 * central notification service, which respects per-user preferences, quiet
 * hours, and digest mode.
 */
export async function sendEscalationNotifications(
  supabase: SupabaseClient,
  escalation: {
    mandate_id: string;
    org_id: string;
    timeline_id: string;
    escalation_type: string;
    milestone_stage: string;
    message: string;
    notified_roles: string[];
  }
): Promise<void> {
  const notificationType = escalationTypeToNotificationType(escalation.escalation_type);
  const actionUrl = `/admin/mandates/${escalation.mandate_id}?timeline=${escalation.timeline_id}`;

  const recipientIds = await resolveEscalationRecipients(
    supabase,
    escalation.org_id,
    escalation.mandate_id,
    escalation.notified_roles
  );

  if (recipientIds.length === 0) {
    console.warn(
      '[SLA Escalation] No recipients resolved for escalation',
      { mandateId: escalation.mandate_id, roles: escalation.notified_roles }
    );
    return;
  }

  const titlePrefix: Record<string, string> = {
    warning: 'SLA Warning',
    critical: 'SLA Critical',
    breach: 'SLA Breach',
  };
  const title = `${titlePrefix[escalation.escalation_type] || 'SLA Alert'}: ${escalation.milestone_stage} milestone`;

  await Promise.all(
    recipientIds.map((userId) =>
      sendNotification(supabase, {
        userId,
        type: notificationType,
        title,
        message: escalation.message,
        entityType: 'mandate',
        entityId: escalation.mandate_id,
        actionUrl,
      }).catch((err) => {
        console.error('[SLA Escalation] Failed to notify user', { userId, err });
      })
    )
  );
}

/**
 * Map SLA escalation severity to a notification type.
 * `milestone_at_risk` is critical=true (bypasses quiet hours) for warnings and critical alerts.
 * `deadline` is critical=true for full breaches.
 */
function escalationTypeToNotificationType(escalationType: string): NotificationType {
  if (escalationType === 'breach') return 'deadline';
  return 'milestone_at_risk';
}

/**
 * Resolve the set of user IDs who should receive an escalation notification.
 *
 * Combines:
 *   - Mandate assignees (account_executive, lead_consultant, coordinator_id)
 *   - Org members with a role in `notify_roles`
 *
 * Returns de-duplicated user IDs.
 */
async function resolveEscalationRecipients(
  supabase: SupabaseClient,
  orgId: string,
  mandateId: string,
  notifyRoles: string[]
): Promise<string[]> {
  const recipientSet = new Set<string>();

  // 1. Mandate assignees — always notified regardless of role list
  try {
    const { data: mandate, error } = await supabase
      .from('mandates')
      .select('account_executive_id, lead_consultant_id, coordinator_id, created_by')
      .eq('id', mandateId)
      .maybeSingle();

    if (!error && mandate) {
      [
        mandate.account_executive_id,
        mandate.lead_consultant_id,
        mandate.coordinator_id,
        mandate.created_by,
      ].forEach((uid: string | null | undefined) => {
        if (uid) recipientSet.add(uid);
      });
    }
  } catch (err) {
    console.error('[SLA Escalation] Failed to load mandate assignees', err);
  }

  // 2. Org members whose role matches the SLA rule's notify_roles
  if (notifyRoles.length > 0) {
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .in('role', notifyRoles);

      if (!error && members) {
        members.forEach((m: { user_id: string }) => {
          if (m.user_id) recipientSet.add(m.user_id);
        });
      }
    } catch (err) {
      console.error('[SLA Escalation] Failed to load org members by role', err);
    }
  }

  return Array.from(recipientSet);
}

export default {
  checkMandateEscalations,
  checkAllMandatesForOrganization,
  runSLAHealthCheck,
  sendEscalationNotifications,
};