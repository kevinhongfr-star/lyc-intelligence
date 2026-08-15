/**
 * schemas/diagnostics/bridge.ts — BRIDGE: Cross-Border Mandate Readiness (canonical)
 * Canonical: 6 dimensions, 6 archetypes (per canon/instruments/bridge.json)
 */
import type { AssessmentResultSchema } from '../assessmentResult';

export const BRIDGE_DIMENSION_KEYS = [
  'mandate_clarity',
  'stakeholder_relationship_building',
  'communication_alignment',
  'pressure_resilience',
  'long_game_thinking',
  'cultural_fluency',
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
  tenure_fit_years?: number;
}

export type BridgeResultSchema = AssessmentResultSchema<BridgeSpecific>;

export const BRIDGE_CONTRACT = {
  diagnostic_slug: 'bridge' as const,
  contract_version: 'b2c.v1' as const,
  dimension_keys: BRIDGE_DIMENSION_KEYS,
  ei_dimension_cap: 4,
  archetype_keys: [
    'the_envoy',
    'the_wanderer',
    'the_chameleon',
    'the_anchor',
    'the_sprinter',
    'the_cultural_operator',
  ] as const,
} as const;

export function isBridgeSchema(r: AssessmentResultSchema): r is BridgeResultSchema {
  return r.assessment.slug === 'bridge';
}
