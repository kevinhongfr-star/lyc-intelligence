// Phase 3.12: SLA Engine - Core calculation logic

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SLAMilestone {
  stage: string;
  target_days: number;
  warning_days: number;
}

export interface EscalationRule {
  threshold_pct: number;
  notify_roles: string[];
  action: 'warning' | 'critical' | 'breach';
}

export interface SLAConfiguration {
  id: string;
  org_id: string;
  mandate_type: string;
  milestones: SLAMilestone[];
  escalation_rules: EscalationRule[];
}

export interface TimelineMilestone {
  stage: string;
  target_date: string;
  actual_date: string | null;
  status: 'pending' | 'completed' | 'at_risk' | 'breached';
}

export interface MandateTimeline {
  id: string;
  mandate_id: string;
  org_id: string;
  sla_config_id: string;
  start_date: string;
  current_stage: string;
  milestones: TimelineMilestone[];
  overall_progress_pct: number;
  days_remaining: number | null;
  health_status: 'on_track' | 'at_risk' | 'breached' | 'completed';
}

export interface SLAEscalation {
  id: string;
  mandate_id: string;
  org_id: string;
  timeline_id: string;
  escalation_type: 'warning' | 'critical' | 'breach';
  milestone_stage: string;
  message: string;
  notified_roles: string[];
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface SLAPerformanceRecord {
  id: string;
  org_id: string;
  mandate_id: string;
  mandate_type: string;
  total_duration_days: number;
  stages_completed: Array<{
    stage: string;
    planned_days: number;
    actual_days: number;
    variance: number;
  }>;
  sla_met: boolean;
  breached_milestones: string[];
  completed_at: string;
}

// ═══════════════════════════════════════════════════════════════
// SLA ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate target dates for all milestones based on start date
 */
export function calculateTargetDates(
  startDate: Date,
  milestones: SLAMilestone[]
): TimelineMilestone[] {
  let currentDate = new Date(startDate);

  return milestones.map((milestone) => {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + milestone.target_days);

    // Move current date forward for next milestone
    currentDate = new Date(targetDate);

    return {
      stage: milestone.stage,
      target_date: targetDate.toISOString(),
      actual_date: null,
      status: 'pending' as const,
    };
  });
}

/**
 * Calculate overall progress percentage
 */
export function calculateProgress(milestones: TimelineMilestone[]): number {
  if (milestones.length === 0) return 0;

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const inProgressCount = milestones.find(m => m.status === 'at_risk' || m.status === 'pending') ? 1 : 0;

  const completedPct = (completedCount / milestones.length) * 100;
  const inProgressPct = inProgressCount > 0 ? (1 / milestones.length) * 30 : 0;

  return Math.round(completedPct + inProgressPct);
}

/**
 * Calculate days remaining until the last milestone
 */
export function calculateDaysRemaining(
  milestones: TimelineMilestone[],
  startDate: string
): number | null {
  const lastMilestone = milestones[milestones.length - 1];
  if (!lastMilestone) return null;

  const targetDate = new Date(lastMilestone.target_date);
  const today = new Date();

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Update milestone status based on current date
 */
export function updateMilestoneStatus(
  milestones: TimelineMilestone[],
  currentStage: string
): TimelineMilestone[] {
  const today = new Date();

  return milestones.map((milestone, index) => {
    // Skip if already completed
    if (milestone.status === 'completed') {
      return milestone;
    }

    const targetDate = new Date(milestone.target_date);
    const daysUntilTarget = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if this is the current stage
    const isCurrentStage = milestone.stage === currentStage;

    let status: TimelineMilestone['status'] = milestone.status;

    if (daysUntilTarget < 0) {
      // Target date passed - breached
      status = 'breached';
    } else if (daysUntilTarget <= 2 && !isCurrentStage) {
      // Within warning period and not yet started
      status = 'at_risk';
    } else if (isCurrentStage && daysUntilTarget <= 3) {
      // Current stage with limited time remaining
      status = 'at_risk';
    } else if (index > 0) {
      // Check if previous milestone is completed
      const prevMilestone = milestones[index - 1];
      if (prevMilestone.status !== 'completed' && index > 0) {
        // Previous not completed, but we're past target date
        if (daysUntilTarget < 0) {
          status = 'breached';
        }
      }
    }

    return { ...milestone, status };
  });
}

/**
 * Calculate overall health status
 */
export function calculateHealthStatus(milestones: TimelineMilestone[]): MandateTimeline['health_status'] {
  const hasBreached = milestones.some(m => m.status === 'breached');
  const hasAtRisk = milestones.some(m => m.status === 'at_risk');
  const allCompleted = milestones.every(m => m.status === 'completed');

  if (hasBreached) return 'breached';
  if (hasAtRisk) return 'at_risk';
  if (allCompleted) return 'completed';
  return 'on_track';
}

/**
 * Find applicable escalation rules
 */
export function findApplicableEscalations(
  milestones: TimelineMilestone[],
  escalationRules: EscalationRule[]
): Array<{ milestone: TimelineMilestone; rule: EscalationRule }> {
  const applicable: Array<{ milestone: TimelineMilestone; rule: EscalationRule }> = [];

  milestones.forEach(milestone => {
    const today = new Date();
    const targetDate = new Date(milestone.target_date);
    const totalTime = milestone.target_days * 24 * 60 * 60 * 1000;
    const elapsedTime = today.getTime() - new Date(milestone.target_date).getTime() + totalTime;
    const elapsedPct = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));

    escalationRules.forEach(rule => {
      if (elapsedPct >= rule.threshold_pct) {
        applicable.push({ milestone, rule });
      }
    });
  });

  return applicable;
}

/**
 * Format duration in days to human readable
 */
export function formatDuration(days: number): string {
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// ═══════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get SLA configuration for a mandate type
 */
export async function getSLAConfiguration(
  supabase: SupabaseClient,
  orgId: string,
  mandateType: string
): Promise<SLAConfiguration | null> {
  const { data, error } = await supabase
    .from('sla_configurations')
    .select('*')
    .eq('org_id', orgId)
    .eq('mandate_type', mandateType)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    org_id: data.org_id,
    mandate_type: data.mandate_type,
    milestones: data.milestones as SLAMilestone[],
    escalation_rules: data.escalation_rules as EscalationRule[],
  };
}

/**
 * Create or update mandate timeline
 */
export async function createOrUpdateTimeline(
  supabase: SupabaseClient,
  mandateId: string,
  orgId: string,
  slaConfigId: string,
  startDate: Date,
  currentStage: string,
  milestones: TimelineMilestone[]
): Promise<MandateTimeline | null> {
  const progress = calculateProgress(milestones);
  const daysRemaining = calculateDaysRemaining(milestones, startDate.toISOString());
  const healthStatus = calculateHealthStatus(milestones);

  const { data, error } = await supabase
    .from('mandate_timelines')
    .upsert({
      mandate_id: mandateId,
      org_id: orgId,
      sla_config_id: slaConfigId,
      start_date: startDate.toISOString(),
      current_stage: currentStage,
      milestones,
      overall_progress_pct: progress,
      days_remaining: daysRemaining,
      health_status: healthStatus,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    mandate_id: data.mandate_id,
    org_id: data.org_id,
    sla_config_id: data.sla_config_id,
    start_date: data.start_date,
    current_stage: data.current_stage,
    milestones: data.milestones as TimelineMilestone[],
    overall_progress_pct: data.overall_progress_pct,
    days_remaining: data.days_remaining,
    health_status: data.health_status as MandateTimeline['health_status'],
  };
}

/**
 * Get mandate timeline
 */
export async function getMandateTimeline(
  supabase: SupabaseClient,
  mandateId: string
): Promise<MandateTimeline | null> {
  const { data, error } = await supabase
    .from('mandate_timelines')
    .select('*')
    .eq('mandate_id', mandateId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    mandate_id: data.mandate_id,
    org_id: data.org_id,
    sla_config_id: data.sla_config_id,
    start_date: data.start_date,
    current_stage: data.current_stage,
    milestones: data.milestones as TimelineMilestone[],
    overall_progress_pct: data.overall_progress_pct,
    days_remaining: data.days_remaining,
    health_status: data.health_status as MandateTimeline['health_status'],
  };
}

/**
 * Get all timelines for an organization
 */
export async function getOrganizationTimelines(
  supabase: SupabaseClient,
  orgId: string
): Promise<MandateTimeline[]> {
  const { data, error } = await supabase
    .from('mandate_timelines')
    .select('*')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false });

  if (error || !data) return [];

  return data.map(t => ({
    id: t.id,
    mandate_id: t.mandate_id,
    org_id: t.org_id,
    sla_config_id: t.sla_config_id,
    start_date: t.start_date,
    current_stage: t.current_stage,
    milestones: t.milestones as TimelineMilestone[],
    overall_progress_pct: t.overall_progress_pct,
    days_remaining: t.days_remaining,
    health_status: t.health_status as MandateTimeline['health_status'],
  }));
}

/**
 * Create SLA escalation
 */
export async function createEscalation(
  supabase: SupabaseClient,
  mandateId: string,
  orgId: string,
  timelineId: string,
  escalationType: 'warning' | 'critical' | 'breach',
  milestoneStage: string,
  message: string,
  notifiedRoles: string[]
): Promise<SLAEscalation | null> {
  const { data, error } = await supabase
    .from('sla_escalations')
    .insert({
      mandate_id: mandateId,
      org_id: orgId,
      timeline_id: timelineId,
      escalation_type: escalationType,
      milestone_stage: milestoneStage,
      message,
      notified_roles: notifiedRoles,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    mandate_id: data.mandate_id,
    org_id: data.org_id,
    timeline_id: data.timeline_id,
    escalation_type: data.escalation_type as SLAEscalation['escalation_type'],
    milestone_stage: data.milestone_stage,
    message: data.message,
    notified_roles: data.notified_roles,
    acknowledged_at: data.acknowledged_at,
    acknowledged_by: data.acknowledged_by,
    created_at: data.created_at,
  };
}

/**
 * Get active escalations for organization
 */
export async function getActiveEscalations(
  supabase: SupabaseClient,
  orgId: string
): Promise<SLAEscalation[]> {
  const { data, error } = await supabase
    .from('sla_escalations')
    .select('*')
    .eq('org_id', orgId)
    .is('acknowledged_at', null)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(e => ({
    id: e.id,
    mandate_id: e.mandate_id,
    org_id: e.org_id,
    timeline_id: e.timeline_id,
    escalation_type: e.escalation_type as SLAEscalation['escalation_type'],
    milestone_stage: e.milestone_stage,
    message: e.message,
    notified_roles: e.notified_roles,
    acknowledged_at: e.acknowledged_at,
    acknowledged_by: e.acknowledged_by,
    created_at: e.created_at,
  }));
}

/**
 * Acknowledge escalation
 */
export async function acknowledgeEscalation(
  supabase: SupabaseClient,
  escalationId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('sla_escalations')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
    })
    .eq('id', escalationId);

  return !error;
}

/**
 * Record SLA performance history
 */
export async function recordPerformance(
  supabase: SupabaseClient,
  orgId: string,
  mandateId: string,
  mandateType: string,
  totalDurationDays: number,
  stagesCompleted: Array<{ stage: string; planned_days: number; actual_days: number; variance: number }>,
  slaMet: boolean,
  breachedMilestones: string[]
): Promise<SLAPerformanceRecord | null> {
  const { data, error } = await supabase
    .from('sla_performance_history')
    .insert({
      org_id: orgId,
      mandate_id: mandateId,
      mandate_type: mandateType,
      total_duration_days: totalDurationDays,
      stages_completed: stagesCompleted,
      sla_met: slaMet,
      breached_milestones: breachedMilestones,
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    org_id: data.org_id,
    mandate_id: data.mandate_id,
    mandate_type: data.mandate_type,
    total_duration_days: data.total_duration_days,
    stages_completed: data.stages_completed as SLAPerformanceRecord['stages_completed'],
    sla_met: data.sla_met,
    breached_milestones: data.breached_milestones,
    completed_at: data.completed_at,
  };
}

export default {
  calculateTargetDates,
  calculateProgress,
  calculateDaysRemaining,
  updateMilestoneStatus,
  calculateHealthStatus,
  findApplicableEscalations,
  formatDuration,
  getSLAConfiguration,
  createOrUpdateTimeline,
  getMandateTimeline,
  getOrganizationTimelines,
  createEscalation,
  getActiveEscalations,
  acknowledgeEscalation,
  recordPerformance,
};