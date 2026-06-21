// src/constants/pipelineStages.ts
// Phase 0.1: 19+2 Stage Recruitment Lifecycle

export interface PipelineStage {
  value: string;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  phase: StagePhaseValue;
  description: string;
}

export type StagePhaseValue = 'sourcing' | 'screening' | 'client' | 'interview' | 'closing' | 'placement';

export interface StagePhase {
  value: StagePhaseValue;
  label: string;
  order: number;
  color: string;
}

export const STAGE_PHASES: StagePhase[] = [
  { value: 'sourcing', label: 'Sourcing', order: 1, color: '#00897B' },
  { value: 'screening', label: 'Screening', order: 2, color: '#7C3AED' },
  { value: 'client', label: 'Client', order: 3, color: '#F59E0B' },
  { value: 'interview', label: 'Interview', order: 4, color: '#3B82F6' },
  { value: 'closing', label: 'Closing', order: 5, color: '#EC4899' },
  { value: 'placement', label: 'Placement', order: 6, color: '#14B8A6' },
];

const createStage = (
  value: string,
  label: string,
  shortLabel: string,
  color: string,
  order: number,
  phase: StagePhaseValue,
  description: string
): PipelineStage => ({
  value,
  label,
  shortLabel,
  color,
  bgColor: `bg-[${color}]`,
  borderColor: `border-[${color}]`,
  order,
  phase,
  description,
});

// 18 Happy-path stages
export const PIPELINE_STAGES: PipelineStage[] = [
  createStage('approach', 'First Approach', 'Approach', '#00897B', 1, 'sourcing', 'Initial candidate outreach'),
  createStage('screened', 'Screened', 'Screened', '#0284C7', 2, 'sourcing', 'Candidate has been screened'),
  createStage('partner_approved', 'LYC Partner Approved', 'Partner OK', '#7C3AED', 3, 'screening', 'Approved by LYC Partner'),
  createStage('client_submitted', 'Submitted to Client', 'Submitted', '#F59E0B', 4, 'client', 'CV submitted to client'),
  createStage('client_approved', 'Approved by Client', 'Client OK', '#10B981', 5, 'client', 'Approved by client for interview'),
  createStage('interview_1', 'Interview I', 'Int 1', '#3B82F6', 6, 'interview', 'First round interview'),
  createStage('interview_2', 'Interview II', 'Int 2', '#2563EB', 7, 'interview', 'Second round interview'),
  createStage('interview_3', 'Interview III', 'Int 3', '#1D4ED8', 8, 'interview', 'Third round interview'),
  createStage('final_interview', 'Final Round Interview', 'Final Int', '#1E40AF', 9, 'interview', 'Final round interview'),
  createStage('assessment', 'Assessment', 'Assess', '#8B5CF6', 10, 'interview', 'Candidate assessment'),
  createStage('reference_check', 'Reference Check', 'Ref Check', '#A855F7', 11, 'closing', 'Reference verification'),
  createStage('offer_sent', 'Offer Sent', 'Offer', '#EC4899', 12, 'closing', 'Offer has been sent'),
  createStage('offer_accepted', 'Offer Accepted', 'Accepted', '#F43F5E', 13, 'closing', 'Offer has been accepted'),
  createStage('onboarded', 'Onboarded', 'Onboard', '#14B8A6', 14, 'placement', 'Candidate has onboarded'),
  createStage('follow_up_1m', '1 Month Follow Up', '1M FU', '#0D9488', 15, 'placement', 'One month follow up'),
  createStage('follow_up_3m', '3 Month Follow Up', '3M FU', '#0F766E', 16, 'placement', 'Three month follow up'),
  createStage('follow_up_6m', '6 Month Follow Up', '6M FU', '#115E59', 17, 'placement', 'Six month follow up'),
  createStage('probation_passed', 'Probation Passed', 'Prob OK', '#059669', 18, 'placement', 'Probation period completed'),
];

// 2 Terminal stages
export const TERMINAL_STAGES: PipelineStage[] = [
  createStage('withdrawn', 'Withdrawn', 'WD', '#6B7280', 90, 'sourcing', 'Candidate withdrawn'),
  createStage('rejected', 'Rejected', 'Rej', '#EF4444', 91, 'sourcing', 'Candidate rejected'),
];

// Combined stages
export const ALL_STAGES: PipelineStage[] = [...PIPELINE_STAGES, ...TERMINAL_STAGES];

// Lookup maps
export const STAGE_BY_VALUE: Record<string, PipelineStage> = {};
export const STAGE_LABEL: Record<string, string> = {};
export const STAGE_COLOR: Record<string, string> = {};

ALL_STAGES.forEach(stage => {
  STAGE_BY_VALUE[stage.value] = stage;
  STAGE_LABEL[stage.value] = stage.label;
  STAGE_COLOR[stage.value] = stage.color;
});

// Old to new mapping (backward compatibility)
export const OLD_STAGE_TO_NEW: Record<string, string> = {
  SWEEP: 'screened',
  CANVA: 'client_submitted',
  GRID: 'client_approved',
  LENS: 'interview_1',
  PLACED: 'offer_accepted',
};

export const NEW_STAGE_TO_OLD: Record<string, string> = Object.fromEntries(
  Object.entries(OLD_STAGE_TO_NEW).map(([old, nw]) => [nw, old])
);

// Helper functions
export function getNextStage(currentStage: string): string | null {
  if (isTerminalStage(currentStage)) return null;
  const idx = PIPELINE_STAGES.findIndex(s => s.value === currentStage);
  if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[idx + 1].value;
}

export function getPreviousStage(currentStage: string): string | null {
  const idx = PIPELINE_STAGES.findIndex(s => s.value === currentStage);
  if (idx <= 0) return null;
  return PIPELINE_STAGES[idx - 1].value;
}

export function getStagePhase(stageValue: string): StagePhase | undefined {
  const stage = STAGE_BY_VALUE[stageValue];
  if (!stage) return undefined;
  return STAGE_PHASES.find(p => p.value === stage.phase);
}

export function getStagesByPhase(phaseValue: StagePhaseValue): PipelineStage[] {
  return PIPELINE_STAGES.filter(s => s.phase === phaseValue);
}

export function isTerminalStage(stageValue: string): boolean {
  return TERMINAL_STAGES.some(s => s.value === stageValue);
}

export function isValidStage(stageValue: string): boolean {
  return !!STAGE_BY_VALUE[stageValue];
}

export function getStageProgress(stageValue: string): number {
  const stage = STAGE_BY_VALUE[stageValue];
  if (!stage) return 0;
  if (isTerminalStage(stageValue)) return 0;
  return Math.round((stage.order / PIPELINE_STAGES.length) * 100);
}
