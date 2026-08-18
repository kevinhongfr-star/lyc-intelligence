/**
 * schemas/diagnostics/drive.ts — DRIVE: Motivation Profile & Engagement Risk (canonical)
 * Canonical: 5 dimensions, 10 profiles (per canon/instruments/drive.json)
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const DRIVE_DIMENSION_KEYS = [
  'purpose_mastery',
  'impact_orientation',
  'motivational_diversity',
  'disengagement_trigger_sensitivity',
  'sustained_motivational_resilience',
] as const;
export type DriveDimensionKey = (typeof DRIVE_DIMENSION_KEYS)[number];

export interface DriveSpecific {
  operating_rhythm?: 'weekly' | 'bi_weekly' | 'monthly' | 'ad_hoc';
  priority_distraction_ratio?: number;
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
  archetype_keys: [
    'purpose_architect',
    'impact_catalyst',
    'growth_weaver',
    'autonomy_seeker',
    'contribution_sage',
    'harmony_champion',
    'mastery_driven',
    'extrinsic_high_performer',
    'balance_first',
    'risk_first',
  ] as const,
} as const;

export function isDriveSchema(r: AssessmentResultSchema): r is DriveResultSchema {
  return r.assessment.slug === 'drive';
}
