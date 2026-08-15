/**
 * schemas/diagnostics/spark.ts — SPARK: AI Leadership Readiness (canonical)
 * Canonical: 3 dimensions, 4 archetypes (per canon/instruments/spark.json)
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const SPARK_DIMENSION_KEYS = [
  'adoption_rigour',
  'team_enablement_velocity',
  'risk_adjusted_experimentation',
] as const;
export type SparkDimensionKey = (typeof SPARK_DIMENSION_KEYS)[number];

export interface SparkSpecific {
  ai_maturity_stage: 'Explorer' | 'Adopter' | 'Scaler' | 'Transformer';
  adoption_gap_vs_role: number;
  priority_quick_wins: Array<{ title: string; effort: 'low' | 'med'; impact: 'high' | 'med' }>;
  risk_flags: Array<{ dimension: SparkDimensionKey; flag: 'red' | 'amber'; detail: string }>;
  team_readiness?: {
    team_size_band: string;
    enablement_score?: number;
    tooling_coverage_pct?: number;
  };
}

export type SparkResultSchema = AssessmentResultSchema<SparkSpecific>;

export const SPARK_CONTRACT = {
  diagnostic_slug: 'spark' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: SPARK_DIMENSION_KEYS,
  ei_dimension_cap: 3,
  archetype_keys: [
    'ai_curious',
    'task_automator',
    'ai_augmented_manager',
    'ai_transformation_leader',
  ] as const,
} as const;

export function isSparkSchema(r: AssessmentResultSchema): r is SparkResultSchema {
  return r.assessment.slug === 'spark';
}
