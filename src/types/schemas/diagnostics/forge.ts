/**
 * schemas/diagnostics/forge.ts — #97 FORGE: Sales Excellence
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const FORGE_DIMENSION_KEYS = [
  'discovery',          // qualifying + needs discovery
  'positioning',        // value framing vs competition
  'stakeholder_map',    // multi-threaded access + buyer map
  'negotiation',        // pricing, concessions, deal structuring
  'pipeline_health',    // pipeline hygiene + forecasting
  'retention_expand',   // account retention + expansion
] as const;
export type ForgeDimensionKey = (typeof FORGE_DIMENSION_KEYS)[number];

export interface ForgeSpecific {
  deal_stage_presence: Record<string, number>;  // stage → 0-100 self-rated
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
  archetype_keys: ['the_hunter', 'the_farmer', 'the_closer', 'the_strategist'] as const,
} as const;

export function isForgeSchema(r: AssessmentResultSchema): r is ForgeResultSchema {
  return r.assessment.slug === 'forge';
}
