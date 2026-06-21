// src/types/mandate.ts
// Phase 0.1: Re-export from pipelineStages constants for backward compatibility

import {
  PIPELINE_STAGES,
  TERMINAL_STAGES,
  ALL_STAGES,
  STAGE_BY_VALUE,
  STAGE_LABEL,
  STAGE_COLOR,
  OLD_STAGE_TO_NEW,
  NEW_STAGE_TO_OLD,
  getNextStage,
  getPreviousStage,
  getStagePhase,
  getStagesByPhase,
  isTerminalStage,
  isValidStage,
  getStageProgress,
  type PipelineStage,
  type StagePhase,
  type StagePhaseValue,
} from '@/constants/pipelineStages';

// Re-export everything for backward compatibility
export {
  PIPELINE_STAGES,
  TERMINAL_STAGES,
  ALL_STAGES,
  STAGE_BY_VALUE,
  STAGE_LABEL,
  STAGE_COLOR,
  OLD_STAGE_TO_NEW,
  NEW_STAGE_TO_OLD,
  getNextStage,
  getPreviousStage,
  getStagePhase,
  getStagesByPhase,
  isTerminalStage,
  isValidStage,
  getStageProgress,
};

export type { PipelineStage, StagePhase, StagePhaseValue };

// ── Deprecated: kept for backward compatibility ──

/** @deprecated Use PIPELINE_STAGES from '@/constants/pipelineStages' instead */
export const STAGE_ORDER = PIPELINE_STAGES.map(s => s.value);

/** @deprecated Use STAGE_BY_VALUE from '@/constants/pipelineStages' instead */
export const STAGE_CONFIG = Object.fromEntries(
  ALL_STAGES.map(s => [s.value, { label: s.label, color: s.color }])
);

/** @deprecated Use string with isValidStage() validation */
export type Stage = string;
