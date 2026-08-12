/**
 * schemas/diagnostics/bridge.ts — #97 BRIDGE: China Leadership Readiness
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const BRIDGE_DIMENSION_KEYS = [
  'context_sensitivity',  // guanxi, mianzi, cultural nuance
  'stakeholder_alignment',// HQ vs China entity alignment
  'decision_style',       // decision-making style fit (centralised vs consensus)
  'communication_protocol',// written + verbal (direct vs indirect) bridges
  'trust_building',       // onshore trust accumulation velocity
  'crisis_readiness',     // China-specific crisis / gov-relations posture
] as const;
export type BridgeDimensionKey = (typeof BRIDGE_DIMENSION_KEYS)[number];

export interface BridgeSpecific {
  entry_mode_fit?: 'JV' | 'WFOE' | 'Partnership' | 'Greenfield' | 'Not applicable';
  cross_border_gap: {
    dimension: BridgeDimensionKey;
    hq_vs_onshore_delta: number;
    risk_level: 'low' | 'medium' | 'high';
  }[];
  cultural_blindspots: Array<{ scenario: string; suggestion: string }>;
  government_readiness_score?: number;
  tenure_fit_years?: number;  // recommended minimum on-shore tenure
}

export type BridgeResultSchema = AssessmentResultSchema<BridgeSpecific>;

export const BRIDGE_CONTRACT = {
  diagnostic_slug: 'bridge' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: BRIDGE_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: ['the_bridge', 'the_ambassador', 'the_nativist', 'the_diplomat'] as const,
} as const;

export function isBridgeSchema(r: AssessmentResultSchema): r is BridgeResultSchema {
  return r.assessment.slug === 'bridge';
}
