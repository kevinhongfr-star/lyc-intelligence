/**
 * schemas/diagnostics/forge.ts — FORGE: Sales Excellence (canonical)
 * Canonical: 4 dimensions, 4 archetypes (per canon/instruments/forge.json)
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const FORGE_DIMENSION_KEYS = [
  'adaptive_learning_orientation',
  'market_context_awareness',
  'development_agency',
  'bilateral_relationship_quality',
] as const;
export type ForgeDimensionKey = (typeof FORGE_DIMENSION_KEYS)[number];

export interface ForgeSpecific {
  deal_stage_presence: Record<string, number>;
  win_rate_proxy?: number;
  pipeline_gap_analysis: {
    weak_stages: string[];
    recommended_focus: ForgeDimensionKey[];
  };
  playbook_gaps: Array<{ dimension: ForgeDimensionKey; gap: string; scenario: string }>;
  top_account_risk?: Array<{ account_ref: string; risk_score: number; mitigation: string }>;
}

export type ForgeResultSchema = AssessmentResultSchema<ForgeSpecific>;

export const FORGE_CONTRACT = {
  diagnostic_slug: 'forge' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: FORGE_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: [
    'the_rainmaker',
    'the_system_builder',
    'the_strategic_seller',
    'the_promoted_seller',
  ] as const,
} as const;

export function isForgeSchema(r: AssessmentResultSchema): r is ForgeResultSchema {
  return r.assessment.slug === 'forge';
}
