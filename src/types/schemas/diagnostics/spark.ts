/**
 * schemas/diagnostics/spark.ts — #97 SPARK: AI Leadership Readiness
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const SPARK_DIMENSION_KEYS = [
  'ai_awareness',        // AI literacy
  'strategic_adoption',  // strategic (not tactical) AI deployment
  'team_enablement',     // upskilling + AI tooling access
  'risk_governance',     // AI risk, policy, ethics
  'change_capability',   // org change management for AI shifts
  'innovation_output',   // AI-driven experiments / outcomes
] as const;
export type SparkDimensionKey = (typeof SPARK_DIMENSION_KEYS)[number];

export interface SparkSpecific {
  ai_maturity_stage: 'Explorer' | 'Adopter' | 'Scaler' | 'Transformer';
  adoption_gap_vs_role: number;     // 0-100 delta against role peer band
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
  ei_dimension_cap: 4,
  archetype_keys: ['the_visionary', 'the_builder', 'the_governor', 'the_innovator'] as const,
} as const;

export function isSparkSchema(r: AssessmentResultSchema): r is SparkResultSchema {
  return r.assessment.slug === 'spark';
}
