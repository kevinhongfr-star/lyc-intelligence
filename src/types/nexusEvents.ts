// Phase 0.6: NEXUS ↔ DEX Sync Contract - Type Definitions
// Event envelope, payload types, and command types

export type NexusEventType =
  | 'mandate.created'
  | 'mandate.updated'
  | 'mandate.archived'
  | 'candidate.created'
  | 'candidate.updated'
  | 'candidate.status_changed'
  | 'assessment.completed'
  | 'trident.completed'
  | 'grid.completed'
  | 'canvas.completed'
  | 'wave.completed'
  | 'benchmark.completed'
  | 'shift.stage_changed'
  | 'shortlist.updated'
  | 'placement.created'
  | 'client.feedback'
  | 'lens.completed'
  | 'workshop.completed';

export type MethodologyFramework = 'TRIDENT' | 'SHIFT' | 'LENS' | 'GRID' | 'CANVAS' | 'WAVE' | 'BENCHMARK';

export interface NexusEventMetadata {
  correlation_id: string;
  retry_count: number;
}

export interface NexusEvent<T = Record<string, unknown>> {
  event_id: string;
  event_type: NexusEventType;
  timestamp: string;
  org_id: string;
  source: 'dex' | 'nexus';
  version: number;
  payload: T;
  metadata: NexusEventMetadata;
}

// ============================================================================
// Event Payloads
// ============================================================================

export interface MandateCreatedPayload {
  mandate_id: string;
  client_org_id: string;
  title: string;
  pipeline_stages: string[];
  methodology_framework: MethodologyFramework;
  trident_dimensions?: Record<string, number>;
  grid_scores?: Record<string, number>;
  created_at: string;
  created_by?: string;
}

export interface MandateUpdatedPayload {
  mandate_id: string;
  updated_fields: string[];
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  updated_at: string;
  updated_by?: string;
}

export interface MandateArchivedPayload {
  mandate_id: string;
  reason?: string;
  archived_at: string;
  archived_by?: string;
}

export interface CandidateCreatedPayload {
  candidate_id: string;
  mandate_id?: string;
  name: string;
  email: string;
  source: string;
  created_at: string;
}

export interface CandidateUpdatedPayload {
  candidate_id: string;
  updated_fields: string[];
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  updated_at: string;
}

export interface CandidateStatusChangedPayload {
  candidate_id: string;
  mandate_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
}

export interface AssessmentCompletedPayload {
  candidate_id: string;
  mandate_id: string;
  assessment_type: MethodologyFramework;
  scores: Record<string, number>;
  overall_score: number;
  percentile?: number;
  completed_at: string;
  assessment_id: string;
}

export interface ShiftStageChangedPayload {
  candidate_id: string;
  mandate_id: string;
  from_stage: string;
  to_stage: string;
  triggered_by: string;
  timestamp: string;
  stage_data?: Record<string, unknown>;
}

export interface ShortlistUpdatedPayload {
  mandate_id: string;
  shortlist_id: string;
  candidate_ids: string[];
  added_candidates: string[];
  removed_candidates: string[];
  updated_at: string;
  updated_by?: string;
}

export interface PlacementCreatedPayload {
  placement_id: string;
  candidate_id: string;
  mandate_id: string;
  start_date: string;
  compensation: Record<string, unknown>;
  created_at: string;
}

export interface ClientFeedbackPayload {
  feedback_id: string;
  mandate_id: string;
  client_id: string;
  rating: number;
  feedback_text: string;
  feedback_type: string;
  created_at: string;
}

// ============================================================================
// Command Types (NEXUS → DEX)
// ============================================================================

export type NexusCommandType =
  | 'run_trident'
  | 'run_grid'
  | 'run_canvas'
  | 'run_wave'
  | 'run_lens'
  | 'run_benchmark'
  | 'sync_mandate_data'
  | 'get_candidate_profile'
  | 'get_mandate_details'
  | 'trigger_reconciliation';

export interface NexusCommandBase {
  command_id: string;
  type: NexusCommandType;
  timestamp: string;
  org_id: string;
}

export interface RunTridentCommand extends NexusCommandBase {
  type: 'run_trident';
  candidate_id: string;
  mandate_id: string;
}

export interface RunGridCommand extends NexusCommandBase {
  type: 'run_grid';
  candidate_id: string;
  mandate_id: string;
}

export interface RunCanvasCommand extends NexusCommandBase {
  type: 'run_canvas';
  candidate_id: string;
  mandate_id: string;
}

export interface RunWaveCommand extends NexusCommandBase {
  type: 'run_wave';
  candidate_id: string;
  mandate_id: string;
}

export interface RunLensCommand extends NexusCommandBase {
  type: 'run_lens';
  candidate_id: string;
  mandate_id: string;
}

export interface RunBenchmarkCommand extends NexusCommandBase {
  type: 'run_benchmark';
  candidate_id: string;
  benchmark_id: string;
}

export interface SyncMandateDataCommand extends NexusCommandBase {
  type: 'sync_mandate_data';
  mandate_id: string;
  entity_types?: string[];
}

export interface GetCandidateProfileCommand extends NexusCommandBase {
  type: 'get_candidate_profile';
  candidate_id: string;
  include_assessments?: boolean;
  include_pipeline?: boolean;
}

export interface GetMandateDetailsCommand extends NexusCommandBase {
  type: 'get_mandate_details';
  mandate_id: string;
  include_candidates?: boolean;
  include_shortlist?: boolean;
}

export interface TriggerReconciliationCommand extends NexusCommandBase {
  type: 'trigger_reconciliation';
  since: string;
  entity_types?: string[];
}

export type NexusCommand =
  | RunTridentCommand
  | RunGridCommand
  | RunCanvasCommand
  | RunWaveCommand
  | RunLensCommand
  | RunBenchmarkCommand
  | SyncMandateDataCommand
  | GetCandidateProfileCommand
  | GetMandateDetailsCommand
  | TriggerReconciliationCommand;

// ============================================================================
// Response Types
// ============================================================================

export interface NexusCommandResponse {
  command_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'accepted' | 'ok';
  message?: string;
  data?: Record<string, unknown>;
  processed_at?: string;
}

export interface NexusWebhookResponse {
  received: boolean;
  event_id: string;
  message?: string;
}

// ============================================================================
// Outbox / Sync State Types
// ============================================================================

export type OutboxStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

export interface NexusEventOutbox {
  event_id: string;
  event: NexusEvent;
  status: OutboxStatus;
  retry_count: number;
  last_error?: string;
  created_at: string;
  delivered_at?: string;
  next_retry_at?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'failed' | 'conflict';

export interface NexusSyncState {
  org_id: string;
  entity_type: string;
  entity_id: string;
  last_synced_at: string;
  last_event_id?: string;
  sync_status: SyncStatus;
}

export const NEXUS_EVENT_VERSION = 1;
export const NEXUS_SOURCE = 'dex' as const;

export const NEXUS_EVENT_TYPES: NexusEventType[] = [
  'mandate.created',
  'mandate.updated',
  'mandate.archived',
  'candidate.created',
  'candidate.updated',
  'candidate.status_changed',
  'assessment.completed',
  'trident.completed',
  'grid.completed',
  'canvas.completed',
  'wave.completed',
  'benchmark.completed',
  'shift.stage_changed',
  'shortlist.updated',
  'placement.created',
  'client.feedback',
  'lens.completed',
  'workshop.completed',
];

export const METHODOLOGY_FRAMEWORKS: MethodologyFramework[] = [
  'TRIDENT',
  'SHIFT',
  'LENS',
  'GRID',
  'CANVAS',
  'WAVE',
  'BENCHMARK',
];
