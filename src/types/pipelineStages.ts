/**
 * Enhanced Pipeline Stages Configuration
 * 19 stages + 2 terminal stages for B2B Dashboard
 * Grouped by phase: Sourcing, Client, Interview, Evaluation, Offer, Post-Placement, Terminal
 */

export const PIPELINE_PHASES = {
  SOURCING: 'Sourcing',
  CLIENT: 'Client',
  INTERVIEW: 'Interview',
  EVALUATION: 'Evaluation',
  OFFER: 'Offer',
  POST_PLACEMENT: 'Post-Placement',
  TERMINAL: 'Terminal',
} as const;

export type PipelinePhase = typeof PIPELINE_PHASES[keyof typeof PIPELINE_PHASES];

// 19 main stages + 2 terminal stages
export const PIPELINE_STAGES = {
  // Sourcing Phase (3 stages)
  APPROACH: 'approach',
  SCREENED: 'screened',
  PARTNER_APPROVED: 'partner_approved',
  
  // Client Phase (2 stages)
  CLIENT_SUBMITTED: 'client_submitted',
  CLIENT_APPROVED: 'client_approved',
  
  // Interview Phase (4 stages)
  INTERVIEW_1: 'interview_1',
  INTERVIEW_2: 'interview_2',
  INTERVIEW_3: 'interview_3',
  FINAL_INTERVIEW: 'final_interview',
  
  // Evaluation Phase (2 stages)
  ASSESSMENT: 'assessment',
  REFERENCE_CHECK: 'reference_check',
  
  // Offer Phase (2 stages)
  OFFER_SENT: 'offer_sent',
  OFFER_ACCEPTED: 'offer_accepted',
  
  // Post-Placement Phase (5 stages)
  ONBOARDED: 'onboarded',
  FOLLOW_UP_1M: 'follow_up_1m',
  FOLLOW_UP_3M: 'follow_up_3m',
  FOLLOW_UP_6M: 'follow_up_6m',
  PROBATION_PASSED: 'probation_passed',
  
  // Terminal Stages (2 stages - candidates exit here)
  WITHDRAWN: 'withdrawn',
  REJECTED: 'rejected',
} as const;

export type PipelineStageName = typeof PIPELINE_STAGES[keyof typeof PIPELINE_STAGES];

export interface PipelineStageConfig {
  id: PipelineStageName;
  label: string;
  phase: PipelinePhase;
  color: string;
  bgColor: string;
  description: string;
}

export const STAGE_CONFIG: Record<PipelineStageName, PipelineStageConfig> = {
  // Sourcing Phase
  [PIPELINE_STAGES.APPROACH]: {
    id: PIPELINE_STAGES.APPROACH,
    label: 'Approach',
    phase: PIPELINE_PHASES.SOURCING,
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Initial outreach to candidate',
  },
  [PIPELINE_STAGES.SCREENED]: {
    id: PIPELINE_STAGES.SCREENED,
    label: 'Screened',
    phase: PIPELINE_PHASES.SOURCING,
    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    description: 'Phone/video screening completed',
  },
  [PIPELINE_STAGES.PARTNER_APPROVED]: {
    id: PIPELINE_STAGES.PARTNER_APPROVED,
    label: 'Partner Approved',
    phase: PIPELINE_PHASES.SOURCING,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    description: 'Internal approval to proceed',
  },
  
  // Client Phase
  [PIPELINE_STAGES.CLIENT_SUBMITTED]: {
    id: PIPELINE_STAGES.CLIENT_SUBMITTED,
    label: 'Client Submitted',
    phase: PIPELINE_PHASES.CLIENT,
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    description: 'Presented to client',
  },
  [PIPELINE_STAGES.CLIENT_APPROVED]: {
    id: PIPELINE_STAGES.CLIENT_APPROVED,
    label: 'Client Approved',
    phase: PIPELINE_PHASES.CLIENT,
    color: '#DB2777',
    bgColor: 'rgba(219, 39, 119, 0.1)',
    description: 'Client selected for interview',
  },
  
  // Interview Phase
  [PIPELINE_STAGES.INTERVIEW_1]: {
    id: PIPELINE_STAGES.INTERVIEW_1,
    label: 'Interview 1',
    phase: PIPELINE_PHASES.INTERVIEW,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'First round interview',
  },
  [PIPELINE_STAGES.INTERVIEW_2]: {
    id: PIPELINE_STAGES.INTERVIEW_2,
    label: 'Interview 2',
    phase: PIPELINE_PHASES.INTERVIEW,
    color: '#D97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    description: 'Second round interview',
  },
  [PIPELINE_STAGES.INTERVIEW_3]: {
    id: PIPELINE_STAGES.INTERVIEW_3,
    label: 'Interview 3',
    phase: PIPELINE_PHASES.INTERVIEW,
    color: '#B45309',
    bgColor: 'rgba(180, 83, 9, 0.1)',
    description: 'Third round interview',
  },
  [PIPELINE_STAGES.FINAL_INTERVIEW]: {
    id: PIPELINE_STAGES.FINAL_INTERVIEW,
    label: 'Final Interview',
    phase: PIPELINE_PHASES.INTERVIEW,
    color: '#92400E',
    bgColor: 'rgba(146, 64, 14, 0.1)',
    description: 'Final round / panel interview',
  },
  
  // Evaluation Phase
  [PIPELINE_STAGES.ASSESSMENT]: {
    id: PIPELINE_STAGES.ASSESSMENT,
    label: 'Assessment',
    phase: PIPELINE_PHASES.EVALUATION,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'SHIFT Assessment / skills test',
  },
  [PIPELINE_STAGES.REFERENCE_CHECK]: {
    id: PIPELINE_STAGES.REFERENCE_CHECK,
    label: 'Reference Check',
    phase: PIPELINE_PHASES.EVALUATION,
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    description: 'Reference verification',
  },
  
  // Offer Phase
  [PIPELINE_STAGES.OFFER_SENT]: {
    id: PIPELINE_STAGES.OFFER_SENT,
    label: 'Offer Sent',
    phase: PIPELINE_PHASES.OFFER,
    color: '#14B8A6',
    bgColor: 'rgba(20, 184, 166, 0.1)',
    description: 'Offer letter sent',
  },
  [PIPELINE_STAGES.OFFER_ACCEPTED]: {
    id: PIPELINE_STAGES.OFFER_ACCEPTED,
    label: 'Offer Accepted',
    phase: PIPELINE_PHASES.OFFER,
    color: '#0D9488',
    bgColor: 'rgba(13, 148, 136, 0.1)',
    description: 'Offer accepted by candidate',
  },
  
  // Post-Placement Phase
  [PIPELINE_STAGES.ONBOARDED]: {
    id: PIPELINE_STAGES.ONBOARDED,
    label: 'Onboarded',
    phase: PIPELINE_PHASES.POST_PLACEMENT,
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    description: 'Candidate started',
  },
  [PIPELINE_STAGES.FOLLOW_UP_1M]: {
    id: PIPELINE_STAGES.FOLLOW_UP_1M,
    label: '30-Day Check',
    phase: PIPELINE_PHASES.POST_PLACEMENT,
    color: '#0891B2',
    bgColor: 'rgba(8, 145, 178, 0.1)',
    description: '30-day follow-up',
  },
  [PIPELINE_STAGES.FOLLOW_UP_3M]: {
    id: PIPELINE_STAGES.FOLLOW_UP_3M,
    label: '90-Day Review',
    phase: PIPELINE_PHASES.POST_PLACEMENT,
    color: '#0E7490',
    bgColor: 'rgba(14, 116, 144, 0.1)',
    description: '90-day performance review',
  },
  [PIPELINE_STAGES.FOLLOW_UP_6M]: {
    id: PIPELINE_STAGES.FOLLOW_UP_6M,
    label: '6-Month Review',
    phase: PIPELINE_PHASES.POST_PLACEMENT,
    color: '#155E75',
    bgColor: 'rgba(21, 94, 117, 0.1)',
    description: '6-month milestone check',
  },
  [PIPELINE_STAGES.PROBATION_PASSED]: {
    id: PIPELINE_STAGES.PROBATION_PASSED,
    label: 'Probation Passed',
    phase: PIPELINE_PHASES.POST_PLACEMENT,
    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    description: 'Probationary period completed',
  },
  
  // Terminal Stages
  [PIPELINE_STAGES.WITHDRAWN]: {
    id: PIPELINE_STAGES.WITHDRAWN,
    label: 'Withdrawn',
    phase: PIPELINE_PHASES.TERMINAL,
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    description: 'Candidate withdrew',
  },
  [PIPELINE_STAGES.REJECTED]: {
    id: PIPELINE_STAGES.REJECTED,
    label: 'Rejected',
    phase: PIPELINE_PHASES.TERMINAL,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Not selected',
  },
};

// Stage order array for Kanban display
export const PIPELINE_STAGE_ORDER: PipelineStageName[] = [
  PIPELINE_STAGES.APPROACH,
  PIPELINE_STAGES.SCREENED,
  PIPELINE_STAGES.PARTNER_APPROVED,
  PIPELINE_STAGES.CLIENT_SUBMITTED,
  PIPELINE_STAGES.CLIENT_APPROVED,
  PIPELINE_STAGES.INTERVIEW_1,
  PIPELINE_STAGES.INTERVIEW_2,
  PIPELINE_STAGES.INTERVIEW_3,
  PIPELINE_STAGES.FINAL_INTERVIEW,
  PIPELINE_STAGES.ASSESSMENT,
  PIPELINE_STAGES.REFERENCE_CHECK,
  PIPELINE_STAGES.OFFER_SENT,
  PIPELINE_STAGES.OFFER_ACCEPTED,
  PIPELINE_STAGES.ONBOARDED,
  PIPELINE_STAGES.FOLLOW_UP_1M,
  PIPELINE_STAGES.FOLLOW_UP_3M,
  PIPELINE_STAGES.FOLLOW_UP_6M,
  PIPELINE_STAGES.PROBATION_PASSED,
  PIPELINE_STAGES.WITHDRAWN,
  PIPELINE_STAGES.REJECTED,
];

// Phases grouped for UI organization
export const PIPELINE_PHASE_ORDER: PipelinePhase[] = [
  PIPELINE_PHASES.SOURCING,
  PIPELINE_PHASES.CLIENT,
  PIPELINE_PHASES.INTERVIEW,
  PIPELINE_PHASES.EVALUATION,
  PIPELINE_PHASES.OFFER,
  PIPELINE_PHASES.POST_PLACEMENT,
  PIPELINE_PHASES.TERMINAL,
];

// Get stages by phase
export function getStagesByPhase(phase: PipelinePhase): PipelineStageConfig[] {
  return Object.values(STAGE_CONFIG).filter(stage => stage.phase === phase);
}

// Get score color based on value
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22C55E'; // green
  if (score >= 60) return '#EAB308'; // yellow
  return '#EF4444'; // red
}

// Get verdict label
export function getVerdictLabel(verdict: string): { label: string; color: string } {
  switch (verdict) {
    case 'strong_fit':
      return { label: 'Strong Fit', color: '#22C55E' };
    case 'moderate_fit':
      return { label: 'Moderate Fit', color: '#EAB308' };
    case 'weak_fit':
      return { label: 'Weak Fit', color: '#EF4444' };
    default:
      return { label: verdict, color: '#6B7280' };
  }
}

// List status types
export const LIST_STATUS_OPTIONS = [
  { value: 'longlist', label: 'Longlist', color: '#6B7280' },
  { value: 'shortlist', label: 'Shortlist', color: '#3B82F6' },
  { value: 'approach', label: 'Approach', color: '#8B5CF6' },
  { value: 'engaged', label: 'Engaged', color: '#10B981' },
  { value: 'pipeline', label: 'Pipeline', color: '#EC4899' },
] as const;

export type ListStatus = typeof LIST_STATUS_OPTIONS[number]['value'];
