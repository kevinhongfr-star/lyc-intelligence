/**
 * Deterministic Classification Engine (T-002)
 * 
 * Takes dimension scores → deterministically maps to one of 62 archetypes.
 * Same input = same output, always. Pure function, no side effects.
 * 
 * Dimension IDs aligned to Notion diagnostic specifications (2026-07-21).
 * Score scale: 0–20 per dimension.
 */

import { InstrumentId, DimensionScore, ArchetypeResult, AssessmentAnswer } from '@/types/assessment';
import { getArchetypesByInstrument, getArchetypeById } from '@/data/archetypes';
import { INSTRUMENTS } from '@/data/instruments';

// Classification thresholds per instrument
// Each instrument has a unique scoring pattern for each archetype
interface ClassificationPattern {
  archetypeId: string;
  dimensionWeights: Record<string, number>; // dimension id → weight (0 to 1)
}

const CLASSIFICATION_PATTERNS: Record<InstrumentId, ClassificationPattern[]> = {
  // QUEST: Cognitive Complexity, Adaptive Leadership, Stakeholder Intelligence, Mission Alignment, AI Readiness
  quest: [
    { archetypeId: 'quest-architect', dimensionWeights: { cognitive_complexity: 0.95, adaptive_leadership: 0.5, stakeholder_intelligence: 0.4, mission_alignment: 0.6, ai_readiness: 0.5 } },
    { archetypeId: 'quest-catalyst', dimensionWeights: { cognitive_complexity: 0.7, adaptive_leadership: 0.9, stakeholder_intelligence: 0.6, mission_alignment: 0.7, ai_readiness: 0.6 } },
    { archetypeId: 'quest-diplomat', dimensionWeights: { cognitive_complexity: 0.5, adaptive_leadership: 0.6, stakeholder_intelligence: 0.95, mission_alignment: 0.7, ai_readiness: 0.4 } },
    { archetypeId: 'quest-commander', dimensionWeights: { cognitive_complexity: 0.7, adaptive_leadership: 0.4, stakeholder_intelligence: 0.6, mission_alignment: 0.8, ai_readiness: 0.5 } },
    { archetypeId: 'quest-navigator', dimensionWeights: { cognitive_complexity: 0.95, adaptive_leadership: 0.8, stakeholder_intelligence: 0.5, mission_alignment: 0.6, ai_readiness: 0.7 } },
    { archetypeId: 'quest-strategist', dimensionWeights: { cognitive_complexity: 0.9, adaptive_leadership: 0.5, stakeholder_intelligence: 0.7, mission_alignment: 0.6, ai_readiness: 0.6 } },
    { archetypeId: 'quest-engine', dimensionWeights: { cognitive_complexity: 0.4, adaptive_leadership: 0.3, stakeholder_intelligence: 0.3, mission_alignment: 0.7, ai_readiness: 0.4 } },
    { archetypeId: 'quest-entrepreneur', dimensionWeights: { cognitive_complexity: 0.8, adaptive_leadership: 0.9, stakeholder_intelligence: 0.5, mission_alignment: 0.5, ai_readiness: 0.7 } },
    { archetypeId: 'quest-specialist', dimensionWeights: { cognitive_complexity: 0.8, adaptive_leadership: 0.3, stakeholder_intelligence: 0.3, mission_alignment: 0.5, ai_readiness: 0.5 } },
    { archetypeId: 'quest-seedling', dimensionWeights: { cognitive_complexity: 0.5, adaptive_leadership: 0.5, stakeholder_intelligence: 0.5, mission_alignment: 0.5, ai_readiness: 0.5 } },
  ],
  // DRIVE: Intrinsic Motivation, Relational Investment, Mission Alignment, Growth Orientation, Sustainability
  drive: [
    { archetypeId: 'drive-achiever', dimensionWeights: { intrinsic_motivation: 0.95, relational_investment: 0.4, mission_alignment: 0.6, growth_orientation: 0.7, sustainability: 0.5 } },
    { archetypeId: 'drive-craftsman', dimensionWeights: { intrinsic_motivation: 0.9, relational_investment: 0.3, mission_alignment: 0.4, growth_orientation: 0.5, sustainability: 0.7 } },
    { archetypeId: 'drive-champion', dimensionWeights: { intrinsic_motivation: 0.7, relational_investment: 0.7, mission_alignment: 0.9, growth_orientation: 0.7, sustainability: 0.5 } },
    { archetypeId: 'drive-explorer', dimensionWeights: { intrinsic_motivation: 0.7, relational_investment: 0.3, mission_alignment: 0.3, growth_orientation: 0.95, sustainability: 0.3 } },
    { archetypeId: 'drive-stalwart', dimensionWeights: { intrinsic_motivation: 0.5, relational_investment: 0.7, mission_alignment: 0.6, growth_orientation: 0.2, sustainability: 0.9 } },
    { archetypeId: 'drive-restless', dimensionWeights: { intrinsic_motivation: 0.6, relational_investment: 0.4, mission_alignment: 0.3, growth_orientation: 0.9, sustainability: 0.2 } },
    { archetypeId: 'drive-golden-handcuffs', dimensionWeights: { intrinsic_motivation: 0.2, relational_investment: 0.4, mission_alignment: 0.3, growth_orientation: 0.2, sustainability: 0.6 } },
    { archetypeId: 'drive-drifter', dimensionWeights: { intrinsic_motivation: 0.3, relational_investment: 0.3, mission_alignment: 0.3, growth_orientation: 0.3, sustainability: 0.4 } },
    { archetypeId: 'drive-burned-out', dimensionWeights: { intrinsic_motivation: 0.2, relational_investment: 0.2, mission_alignment: 0.2, growth_orientation: 0.1, sustainability: 0.1 } },
    { archetypeId: 'drive-frozen-asset', dimensionWeights: { intrinsic_motivation: 0.4, relational_investment: 0.4, mission_alignment: 0.5, growth_orientation: 0.3, sustainability: 0.5 } },
  ],
  // IMPACT: Governance Effectiveness, Independent Judgment, Board Influence, Strategic Contribution, Mandate Credibility
  impact: [
    { archetypeId: 'impact-architect', dimensionWeights: { governance_effectiveness: 0.95, independent_judgment: 0.7, board_influence: 0.6, strategic_contribution: 0.7, mandate_credibility: 0.7 } },
    { archetypeId: 'impact-steward', dimensionWeights: { governance_effectiveness: 0.8, independent_judgment: 0.6, board_influence: 0.4, strategic_contribution: 0.5, mandate_credibility: 0.8 } },
    { archetypeId: 'impact-networker', dimensionWeights: { governance_effectiveness: 0.4, independent_judgment: 0.5, board_influence: 0.95, strategic_contribution: 0.5, mandate_credibility: 0.7 } },
    { archetypeId: 'impact-guardian', dimensionWeights: { governance_effectiveness: 0.9, independent_judgment: 0.85, board_influence: 0.5, strategic_contribution: 0.4, mandate_credibility: 0.7 } },
    { archetypeId: 'impact-visionary', dimensionWeights: { governance_effectiveness: 0.5, independent_judgment: 0.7, board_influence: 0.6, strategic_contribution: 0.95, mandate_credibility: 0.6 } },
    { archetypeId: 'impact-bridge-builder', dimensionWeights: { governance_effectiveness: 0.6, independent_judgment: 0.5, board_influence: 0.8, strategic_contribution: 0.7, mandate_credibility: 0.7 } },
    { archetypeId: 'impact-nominee', dimensionWeights: { governance_effectiveness: 0.5, independent_judgment: 0.4, board_influence: 0.5, strategic_contribution: 0.5, mandate_credibility: 0.5 } },
    { archetypeId: 'impact-passenger', dimensionWeights: { governance_effectiveness: 0.3, independent_judgment: 0.2, board_influence: 0.2, strategic_contribution: 0.3, mandate_credibility: 0.2 } },
  ],
  // PRISM: Brand Authenticity, Market Visibility, Narrative Clarity, Stakeholder Legibility, APAC Brand Translation
  prism: [
    { archetypeId: 'prism-authority', dimensionWeights: { brand_authenticity: 0.9, market_visibility: 0.7, narrative_clarity: 0.7, stakeholder_legibility: 0.8, apac_brand_translation: 0.6 } },
    { archetypeId: 'prism-signal', dimensionWeights: { brand_authenticity: 0.7, market_visibility: 0.95, narrative_clarity: 0.8, stakeholder_legibility: 0.7, apac_brand_translation: 0.7 } },
    { archetypeId: 'prism-monument', dimensionWeights: { brand_authenticity: 0.7, market_visibility: 0.5, narrative_clarity: 0.5, stakeholder_legibility: 0.7, apac_brand_translation: 0.6 } },
    { archetypeId: 'prism-chameleon', dimensionWeights: { brand_authenticity: 0.3, market_visibility: 0.6, narrative_clarity: 0.7, stakeholder_legibility: 0.6, apac_brand_translation: 0.8 } },
    { archetypeId: 'prism-amplifier', dimensionWeights: { brand_authenticity: 0.7, market_visibility: 0.4, narrative_clarity: 0.6, stakeholder_legibility: 0.5, apac_brand_translation: 0.5 } },
    { archetypeId: 'prism-operator', dimensionWeights: { brand_authenticity: 0.7, market_visibility: 0.5, narrative_clarity: 0.5, stakeholder_legibility: 0.7, apac_brand_translation: 0.6 } },
    { archetypeId: 'prism-ghost', dimensionWeights: { brand_authenticity: 0.5, market_visibility: 0.1, narrative_clarity: 0.3, stakeholder_legibility: 0.2, apac_brand_translation: 0.3 } },
    { archetypeId: 'prism-mask', dimensionWeights: { brand_authenticity: 0.2, market_visibility: 0.8, narrative_clarity: 0.8, stakeholder_legibility: 0.7, apac_brand_translation: 0.6 } },
    { archetypeId: 'prism-static', dimensionWeights: { brand_authenticity: 0.6, market_visibility: 0.6, narrative_clarity: 0.5, stakeholder_legibility: 0.6, apac_brand_translation: 0.4 } },
    { archetypeId: 'prism-blank-page', dimensionWeights: { brand_authenticity: 0.4, market_visibility: 0.2, narrative_clarity: 0.2, stakeholder_legibility: 0.2, apac_brand_translation: 0.3 } },
  ],
  // BRIDGE: HQ Alignment, Local Orchestration, Expectation Translation, Political Navigation, Cultural Fluency
  bridge: [
    { archetypeId: 'bridge-envoy', dimensionWeights: { hq_alignment: 0.7, local_orchestration: 0.7, expectation_translation: 0.9, political_navigation: 0.7, cultural_fluency: 0.8 } },
    { archetypeId: 'bridge-navigator', dimensionWeights: { hq_alignment: 0.9, local_orchestration: 0.6, expectation_translation: 0.6, political_navigation: 0.7, cultural_fluency: 0.7 } },
    { archetypeId: 'bridge-chameleon', dimensionWeights: { hq_alignment: 0.5, local_orchestration: 0.7, expectation_translation: 0.7, political_navigation: 0.6, cultural_fluency: 0.95 } },
    { archetypeId: 'bridge-anchor', dimensionWeights: { hq_alignment: 0.9, local_orchestration: 0.4, expectation_translation: 0.4, political_navigation: 0.5, cultural_fluency: 0.5 } },
    { archetypeId: 'bridge-sprinter', dimensionWeights: { hq_alignment: 0.6, local_orchestration: 0.5, expectation_translation: 0.7, political_navigation: 0.5, cultural_fluency: 0.6 } },
    { archetypeId: 'bridge-cultural-operator', dimensionWeights: { hq_alignment: 0.7, local_orchestration: 0.6, expectation_translation: 0.6, political_navigation: 0.5, cultural_fluency: 0.7 } },
  ],
  // MOSAIC: Institutional Trust, Relationship Velocity, Normative Flexibility, Conflict Resolution
  mosaic: [
    { archetypeId: 'mosaic-cultural-catalyst', dimensionWeights: { institutional_trust: 0.8, relationship_velocity: 0.9, normative_flexibility: 0.8, conflict_resolution: 0.7 } },
    { archetypeId: 'mosaic-cultural-expert', dimensionWeights: { institutional_trust: 0.7, relationship_velocity: 0.5, normative_flexibility: 0.6, conflict_resolution: 0.5 } },
    { archetypeId: 'mosaic-cultural-leader', dimensionWeights: { institutional_trust: 0.9, relationship_velocity: 0.8, normative_flexibility: 0.9, conflict_resolution: 0.9 } },
    { archetypeId: 'mosaic-cultural-tourist', dimensionWeights: { institutional_trust: 0.3, relationship_velocity: 0.4, normative_flexibility: 0.3, conflict_resolution: 0.3 } },
  ],
  // FORGE: Adaptive Learning Orientation, Three Forces Awareness, Development Agency, Bilateral Context Navigation
  forge: [
    { archetypeId: 'forge-rainmaker', dimensionWeights: { adaptive_learning_orientation: 0.5, three_forces_awareness: 0.5, development_agency: 0.6, bilateral_context_navigation: 0.7 } },
    { archetypeId: 'forge-system-builder', dimensionWeights: { adaptive_learning_orientation: 0.7, three_forces_awareness: 0.6, development_agency: 0.8, bilateral_context_navigation: 0.6 } },
    { archetypeId: 'forge-revenue-architect', dimensionWeights: { adaptive_learning_orientation: 0.8, three_forces_awareness: 0.9, development_agency: 0.7, bilateral_context_navigation: 0.7 } },
    { archetypeId: 'forge-promoted-seller', dimensionWeights: { adaptive_learning_orientation: 0.5, three_forces_awareness: 0.4, development_agency: 0.5, bilateral_context_navigation: 0.6 } },
  ],
  // SPARK: Individual AI Adoption Readiness, Capability Exposure Assessment, Organisational Preparedness
  spark: [
    { archetypeId: 'spark-ai-champion', dimensionWeights: { individual_ai_adoption_readiness: 0.9, capability_exposure_assessment: 0.8, organisational_preparedness: 0.7 } },
    { archetypeId: 'spark-skeptical-director', dimensionWeights: { individual_ai_adoption_readiness: 0.3, capability_exposure_assessment: 0.7, organisational_preparedness: 0.5 } },
    { archetypeId: 'spark-governance-bureaucrat', dimensionWeights: { individual_ai_adoption_readiness: 0.5, capability_exposure_assessment: 0.5, organisational_preparedness: 0.95 } },
    { archetypeId: 'spark-disengaged-director', dimensionWeights: { individual_ai_adoption_readiness: 0.2, capability_exposure_assessment: 0.2, organisational_preparedness: 0.2 } },
  ],
  // SHIFT: Cross-Boundary Developmental Orientation, Adaptive Coaching Style, Bilateral Developmental Relationship Quality, Coaching Under Bilateral Constraints
  // No archetypes — score-based composite
  shift: [],
};

/**
 * Core classification function.
 * Compares dimension scores against known patterns using weighted cosine similarity.
 * Returns the best-matching archetype with confidence score.
 */
export function classifyArchetype(
  instrumentId: InstrumentId,
  dimensionScores: DimensionScore[]
): ArchetypeResult {
  // SHIFT is composite — score-based, no archetype matching
  if (instrumentId === 'shift') {
    return classifyShift(dimensionScores);
  }

  const patterns = CLASSIFICATION_PATTERNS[instrumentId];
  const instrument = INSTRUMENTS[instrumentId];

  // Build score map (normalize 0-20 scale to 0-1)
  const scoreMap: Record<string, number> = {};
  dimensionScores.forEach(ds => {
    scoreMap[ds.dimensionId] = ds.normalizedScore / 100;
  });

  // Calculate similarity for each archetype pattern
  let bestMatch: { archetypeId: string; score: number } | null = null;
  let secondBest: { archetypeId: string; score: number } | null = null;

  for (const pattern of patterns) {
    let similarity = 0;
    let totalWeight = 0;

    for (const [dimId, weight] of Object.entries(pattern.dimensionWeights)) {
      const actualScore = scoreMap[dimId] ?? 0.5; // Default to mid-range
      similarity += weight * actualScore;
      totalWeight += Math.abs(weight);
    }

    const normalizedSimilarity = totalWeight > 0 ? similarity / totalWeight : 0;

    if (!bestMatch || normalizedSimilarity > bestMatch.score) {
      secondBest = bestMatch;
      bestMatch = { archetypeId: pattern.archetypeId, score: normalizedSimilarity };
    } else if (!secondBest || normalizedSimilarity > secondBest.score) {
      secondBest = { archetypeId: pattern.archetypeId, score: normalizedSimilarity };
    }
  }

  // Calculate confidence
  const confidence = bestMatch && secondBest
    ? (bestMatch.score - secondBest.score) / bestMatch.score
    : 0.5;

  const archetype = getArchetypeById(bestMatch?.archetypeId ?? '');
  const secondaryArchetype = secondBest ? getArchetypeById(secondBest.archetypeId) : null;

  return {
    archetypeId: bestMatch?.archetypeId ?? '',
    archetypeName: archetype?.name ?? 'Unknown',
    instrument: instrumentId,
    category: archetype?.category ?? '',
    description: archetype?.description ?? '',
    confidence: Math.max(0, Math.min(1, Math.abs(confidence))),
    isTransitional: Math.abs(confidence) < 0.6,
    secondaryArchetypeId: secondaryArchetype?.id,
    secondaryArchetypeName: secondaryArchetype?.name,
  };
}

/**
 * SHIFT composite classification — score-basedLeadership Agility Index.
 * No archetypes — returns band classification.
 */
function classifyShift(dimensionScores: DimensionScore[]): ArchetypeResult {
  const avgScore = dimensionScores.reduce((sum, ds) => sum + ds.normalizedScore, 0) / (dimensionScores.length || 1);

  // Leadership Agility Index bands (0-20 scale)
  let archetypeId: string;
  let archetypeName: string;

  if (avgScore >= 16) {
    archetypeId = 'shift-high-agility';
    archetypeName = 'High Agility';
  } else if (avgScore >= 12) {
    archetypeId = 'shift-moderate-agility';
    archetypeName = 'Moderate Agility';
  } else if (avgScore >= 8) {
    archetypeId = 'shift-developing-agility';
    archetypeName = 'Developing Agility';
  } else {
    archetypeId = 'shift-foundation-focus';
    archetypeName = 'Foundation Focus';
  }

  return {
    archetypeId,
    archetypeName,
    instrument: 'shift',
    category: 'Coaching Effectiveness',
    description: `Your SHIFT profile indicates a ${archetypeName} pattern in bilateral coaching effectiveness.`,
    confidence: 0.7,
    isTransitional: false,
  };
}

/**
 * Calculate dimension scores from raw answers.
 * Normalizes to 0-100 for internal use (display in reports uses 0-20).
 */
export function calculateDimensionScores(
  instrumentId: InstrumentId,
  answers: AssessmentAnswer[]
): DimensionScore[] {
  const instrument = INSTRUMENTS[instrumentId];
  if (!instrument) return [];

  const dimensionMap = new Map<string, number[]>();

  // Group answers by dimension
  for (const answer of answers) {
    const existing = dimensionMap.get(answer.dimensionId) ?? [];
    existing.push(answer.score);
    dimensionMap.set(answer.dimensionId, existing);
  }

  // Calculate scores (normalize to 0-100 for engine, display scales to 0-20)
  return instrument.dimensions.map(dim => {
    const scores = dimensionMap.get(dim.id) ?? [dim.maxScore / 2];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    // Normalize from instrument scale (0-20) to 0-100 for engine
    const normalizedScore = Math.max(0, Math.min(100, (avgScore / dim.maxScore) * 100));

    return {
      dimensionId: dim.id,
      dimensionName: dim.name,
      rawScore: avgScore,
      normalizedScore: Math.round(normalizedScore),
    };
  });
}
