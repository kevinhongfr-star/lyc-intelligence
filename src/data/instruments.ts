/**
 * Instrument Definitions — 9 diagnostic instruments
 * Phase 0 (T-001) + Phase 1 (T-101: instrument colors)
 * 
 * Dimensions aligned to Notion diagnostic specifications (2026-07-21).
 * Score scale: 0–20 per dimension (per report template spec).
 * Colors are provisional — Kevin to approve final palette.
 */

import { Instrument, InstrumentId } from '@/types/assessment';

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  quest: {
    id: 'quest',
    name: 'QUEST',
    tagline: 'Executive Capability Diagnostic',
    color: '#2563EB',      // Blue
    colorLight: '#DBEAFE',
    colorDark: '#1E40AF',
    archetypeCount: 10,
    dimensions: [
      { id: 'cognitive_complexity', name: 'Cognitive Complexity', description: 'The capacity to hold and process multiple competing considerations simultaneously — systems thinking, scenario analysis, and operating effectively in ambiguity', minScore: 0, maxScore: 20 },
      { id: 'adaptive_leadership', name: 'Adaptive Leadership', description: 'The capacity to adjust leadership approach in response to changing organisational context, team composition, and environmental demands', minScore: 0, maxScore: 20 },
      { id: 'stakeholder_intelligence', name: 'Stakeholder Intelligence', description: 'The capacity to read, map, and navigate the interests, motivations, and influence dynamics of complex stakeholder ecosystems', minScore: 0, maxScore: 20 },
      { id: 'mission_alignment', name: 'Mission Alignment', description: 'The degree to which the executive\'s leadership energy is aligned with the organisation\'s strategic direction', minScore: 0, maxScore: 20 },
      { id: 'ai_readiness', name: 'AI Readiness', description: 'The executive\'s current capacity to integrate AI tools and AI-driven decisions into their leadership practice', minScore: 0, maxScore: 20 },
    ],
  },
  drive: {
    id: 'drive',
    name: 'DRIVE',
    tagline: 'Motivation & Engagement Diagnostic',
    color: '#DC2626',      // Red
    colorLight: '#FEE2E2',
    colorDark: '#991B1B',
    archetypeCount: 10,
    dimensions: [
      { id: 'intrinsic_motivation', name: 'Intrinsic Motivation', description: 'The degree to which motivation is driven by the inherent satisfaction of the work itself — quality, craft, intellectual challenge — independent of external recognition', minScore: 0, maxScore: 20 },
      { id: 'relational_investment', name: 'Relational Investment', description: 'The degree to which motivation is sustained by the quality of professional relationships — team belonging, peer connection, shared purpose', minScore: 0, maxScore: 20 },
      { id: 'mission_alignment', name: 'Mission Alignment', description: 'The degree to which motivation is connected to the broader purpose of the organisation — the sense that the work matters beyond personal achievement', minScore: 0, maxScore: 20 },
      { id: 'growth_orientation', name: 'Growth Orientation', description: 'The degree to which motivation is sustained by learning, development, and the experience of growing capability', minScore: 0, maxScore: 20 },
      { id: 'sustainability', name: 'Sustainability', description: 'The degree to which motivation patterns are structurally sustainable — pace, recovery, and the capacity to maintain effectiveness over mandate cycles', minScore: 0, maxScore: 20 },
    ],
  },
  impact: {
    id: 'impact',
    name: 'IMPACT',
    tagline: 'Board Effectiveness Diagnostic',
    color: '#7C3AED',      // Violet
    colorLight: '#EDE9FE',
    colorDark: '#5B21B6',
    archetypeCount: 8,
    dimensions: [
      { id: 'governance_effectiveness', name: 'Governance Effectiveness', description: 'The capacity to understand, apply, and strengthen governance frameworks — policy design, risk oversight, audit and compliance', minScore: 0, maxScore: 20 },
      { id: 'independent_judgment', name: 'Independent Judgment', description: 'The capacity to form and sustain an independent position on governance and strategic questions — genuine independence from management influence and board dynamics', minScore: 0, maxScore: 20 },
      { id: 'board_influence', name: 'Board Influence', description: 'The capacity to shape board decisions and governance direction through quality of contributions and boardroom communication', minScore: 0, maxScore: 20 },
      { id: 'strategic_contribution', name: 'Strategic Contribution', description: 'The capacity to contribute meaningfully to the board\'s strategic agenda — long-term perspective, analytical rigour, and domain expertise', minScore: 0, maxScore: 20 },
      { id: 'mandate_credibility', name: 'Mandate Credibility', description: 'The degree to which the board mandate is perceived as credible by fellow directors, the CEO, and the external stakeholder ecosystem', minScore: 0, maxScore: 20 },
    ],
  },
  prism: {
    id: 'prism',
    name: 'PRISM',
    tagline: 'Executive Brand Identity',
    color: '#F59E0B',      // Amber
    colorLight: '#FEF3C7',
    colorDark: '#B45309',
    archetypeCount: 10,
    dimensions: [
      { id: 'brand_authenticity', name: 'Brand Authenticity', description: 'The degree to which the professional brand is grounded in a genuine, consistent leadership identity that remains stable across contexts', minScore: 0, maxScore: 20 },
      { id: 'market_visibility', name: 'Market Visibility', description: 'The degree to which the professional brand is actively present in the markets that matter — content, speaking, network activity, reputation management', minScore: 0, maxScore: 20 },
      { id: 'narrative_clarity', name: 'Narrative Clarity', description: 'The capacity to articulate a professional narrative with clarity, consistency, and persuasive force across different stakeholder contexts', minScore: 0, maxScore: 20 },
      { id: 'stakeholder_legibility', name: 'Stakeholder Legibility', description: 'The degree to which the brand is legible — clear and interpretable — to the specific stakeholders that matter most', minScore: 0, maxScore: 20 },
      { id: 'apac_brand_translation', name: 'APAC Brand Translation', description: 'The capacity to translate professional brand identity across APAC market contexts where trust signals and reputation norms differ', minScore: 0, maxScore: 20 },
    ],
  },
  bridge: {
    id: 'bridge',
    name: 'BRIDGE',
    tagline: 'Cross-Border Mandate Diagnostic',
    color: '#059669',      // Emerald
    colorLight: '#D1FAE5',
    colorDark: '#047857',
    archetypeCount: 6,
    dimensions: [
      { id: 'hq_alignment', name: 'HQ Alignment', description: 'The capacity to maintain institutional alignment with headquarters requirements while navigating a significant operating context shift', minScore: 0, maxScore: 20 },
      { id: 'local_orchestration', name: 'Local Orchestration', description: 'The capacity to mobilise, direct, and maintain a leadership team through a context shift when team members were selected for the previous context', minScore: 0, maxScore: 20 },
      { id: 'expectation_translation', name: 'Expectation Translation', description: 'The capacity to translate between stakeholder expectations calibrated to the previous context and the operating requirements of the new context', minScore: 0, maxScore: 20 },
      { id: 'political_navigation', name: 'Political Navigation', description: 'The capacity to navigate the political dynamics of a bilateral mandate — managing competing power centres and influence structures across contexts', minScore: 0, maxScore: 20 },
      { id: 'cultural_fluency', name: 'Cultural Fluency', description: 'The capacity to read, adapt to, and operate effectively across the cultural norms of the new mandate context', minScore: 0, maxScore: 20 },
    ],
  },
  mosaic: {
    id: 'mosaic',
    name: 'MOSAIC',
    tagline: 'Cross-Border Team Dynamics',
    color: '#0891B2',      // Cyan
    colorLight: '#CFFAFE',
    colorDark: '#0E7490',
    archetypeCount: 4,
    dimensions: [
      { id: 'institutional_trust', name: 'Institutional Trust', description: 'The capacity to operate in cross-border partnerships where institutional trust frameworks are degraded or asymmetric', minScore: 0, maxScore: 20 },
      { id: 'relationship_velocity', name: 'Relationship Velocity', description: 'The capacity to build, maintain, and activate cross-border relationships at the velocity required by the operating environment', minScore: 0, maxScore: 20 },
      { id: 'normative_flexibility', name: 'Normative Flexibility', description: 'The capacity to operate effectively across different normative frameworks as operating expectations shift', minScore: 0, maxScore: 20 },
      { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'The capacity to navigate conflict in cross-border partnerships where capability asymmetry or institutional trust degradation is a contributing factor', minScore: 0, maxScore: 20 },
    ],
  },
  forge: {
    id: 'forge',
    name: 'FORGE',
    tagline: 'Executive Agility Diagnostic',
    color: '#EA580C',      // Orange
    colorLight: '#FFF7ED',
    colorDark: '#C2410C',
    archetypeCount: 4,
    dimensions: [
      { id: 'adaptive_learning_orientation', name: 'Adaptive Learning Orientation', description: 'Challenge seeking, feedback integration, and mental model flexibility — the willingness to update how you lead based on new evidence', minScore: 0, maxScore: 20 },
      { id: 'three_forces_awareness', name: 'Three Forces Awareness', description: 'Pattern recognition across Force 1 (China Realignment), Force 2 (Partnership Deficit), and Force 3 (Succession Illusion)', minScore: 0, maxScore: 20 },
      { id: 'development_agency', name: 'Development Agency', description: 'Self-directed development, development resource mobilisation, and development consistency', minScore: 0, maxScore: 20 },
      { id: 'bilateral_context_navigation', name: 'Bilateral Context Navigation', description: 'Bilateral ambiguity tolerance, counterpart development investment, and compound force navigation', minScore: 0, maxScore: 20 },
    ],
  },
  spark: {
    id: 'spark',
    name: 'SPARK',
    tagline: 'AI Governance Readiness Diagnostic',
    color: '#8B5CF6',      // Purple
    colorLight: '#F3E8FF',
    colorDark: '#6D28D9',
    archetypeCount: 4,
    dimensions: [
      { id: 'individual_ai_adoption_readiness', name: 'Individual AI Adoption Readiness', description: 'Current adoption level, workflow adaptation willingness, and critical evaluation capacity for AI tools', minScore: 0, maxScore: 20 },
      { id: 'capability_exposure_assessment', name: 'Capability Exposure Assessment', description: 'Domain-specific capability awareness, depreciation risk recognition, and bilateral asymmetry awareness', minScore: 0, maxScore: 20 },
      { id: 'organisational_preparedness', name: 'Organisational Preparedness', description: 'Governance readiness, data infrastructure, and capability investment for AI integration', minScore: 0, maxScore: 20 },
    ],
  },
  shift: {
    id: 'shift',
    name: 'SHIFT',
    tagline: 'Bilateral Coaching Effectiveness',
    color: '#475569',      // Slate
    colorLight: '#F1F5F9',
    colorDark: '#1E293B',
    archetypeCount: 0, // Scored composite — no archetypes
    dimensions: [
      { id: 'cross_boundary_developmental_orientation', name: 'Cross-Boundary Developmental Orientation', description: 'Bilateral developmental intent and patience with different learning cadences', minScore: 0, maxScore: 20 },
      { id: 'adaptive_coaching_style', name: 'Adaptive Coaching Style', description: 'Style flexibility and cultural adaptation in coaching approach', minScore: 0, maxScore: 20 },
      { id: 'bilateral_developmental_relationship_quality', name: 'Bilateral Developmental Relationship Quality', description: 'Trust-building across boundaries and accountability navigation', minScore: 0, maxScore: 20 },
      { id: 'coaching_under_bilateral_constraints', name: 'Coaching Under Bilateral Constraints', description: 'Consistency under pressure and authority ambiguity management', minScore: 0, maxScore: 20 },
    ],
  },
};

export const INSTRUMENT_LIST = Object.values(INSTRUMENTS);

export function getInstrument(id: InstrumentId): Instrument {
  return INSTRUMENTS[id];
}

export function getInstrumentColor(id: InstrumentId): string {
  return INSTRUMENTS[id].color;
}
