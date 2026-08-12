/**
 * schemas/diagnostics/drive.ts — #97 DRIVE: Execution Capability Framework
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const DRIVE_DIMENSION_KEYS = [
  'goal_clarity',       // OKR / goal translation
  'prioritization',     // backlog / priority rigor
  'velocity',           // throughput + bottleneck management
  'accountability',     // commitments + follow-through
  'resource_allocation',// time / energy / team allocation
  'course_correction',  // feedback loop + pivot speed
] as const;
export type DriveDimensionKey = (typeof DRIVE_DIMENSION_KEYS)[number];

export interface DriveSpecific {
  operating_rhythm?: 'weekly' | 'bi_weekly' | 'monthly' | 'ad_hoc';
  priority_distraction_ratio?: number;   // 0-100 higher = more focus
  bottleneck_map: {
    dimension: DriveDimensionKey;
    severity: 'low' | 'medium' | 'high';
    symptom: string;
  }[];
  execution_playbook: Array<{ recommendation: string; impact: number; effort: 1 | 2 | 3 }>;
  quarter_focus?: {
    rocks: string[];
    stop_doing?: string[];
  };
}

export type DriveResultSchema = AssessmentResultSchema<DriveSpecific>;

export const DRIVE_CONTRACT = {
  diagnostic_slug: 'drive' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: DRIVE_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: ['the_operator', 'the_orchestrator', 'the_firefighter', 'the_macro'] as const,
} as const;

export function isDriveSchema(r: AssessmentResultSchema): r is DriveResultSchema {
  return r.assessment.slug === 'drive';
}
