/**
 * Deterministic Classification Engine (T-002)
 * 
 * Takes dimension scores → deterministically maps to one of 62 archetypes.
 * Same input = same output, always. Pure function, no side effects.
 */

import { InstrumentId, DimensionScore, ArchetypeResult, AssessmentAnswer } from '@/types/assessment';
import { getArchetypesByInstrument, getArchetypeById } from '@/data/archetypes';
import { INSTRUMENTS } from '@/data/instruments';

// Classification thresholds per instrument
// Each instrument has a unique scoring pattern for each archetype
interface ClassificationPattern {
  archetypeId: string;
  // Dimension id → expected score range [low, high]
  // High scores = dimension is strong; Low = dimension is weak
  dimensionWeights: Record<string, number>; // dimension id → weight (-1 to 1)
}

const CLASSIFICATION_PATTERNS: Record<InstrumentId, ClassificationPattern[]> = {
  quest: [
    { archetypeId: 'quest-architect', dimensionWeights: { strategic_vision: 0.9, execution_discipline: 0.7, people_development: 0.3, stakeholder_influence: 0.4, adaptive_agility: 0.5 } },
    { archetypeId: 'quest-catalyst', dimensionWeights: { strategic_vision: 0.7, execution_discipline: 0.3, people_development: 0.8, stakeholder_influence: 0.6, adaptive_agility: 0.9 } },
    { archetypeId: 'quest-diplomat', dimensionWeights: { strategic_vision: 0.5, execution_discipline: 0.4, people_development: 0.7, stakeholder_influence: 0.95, adaptive_agility: 0.6 } },
    { archetypeId: 'quest-commander', dimensionWeights: { strategic_vision: 0.7, execution_discipline: 0.9, people_development: 0.5, stakeholder_influence: 0.6, adaptive_agility: 0.4 } },
    { archetypeId: 'quest-navigator', dimensionWeights: { strategic_vision: 0.95, execution_discipline: 0.5, people_development: 0.4, stakeholder_influence: 0.5, adaptive_agility: 0.8 } },
    { archetypeId: 'quest-strategist', dimensionWeights: { strategic_vision: 0.9, execution_discipline: 0.6, people_development: 0.3, stakeholder_influence: 0.7, adaptive_agility: 0.5 } },
    { archetypeId: 'quest-engine', dimensionWeights: { strategic_vision: 0.4, execution_discipline: 0.95, people_development: 0.6, stakeholder_influence: 0.3, adaptive_agility: 0.3 } },
    { archetypeId: 'quest-entrepreneur', dimensionWeights: { strategic_vision: 0.8, execution_discipline: 0.6, people_development: 0.4, stakeholder_influence: 0.5, adaptive_agility: 0.9 } },
    { archetypeId: 'quest-specialist', dimensionWeights: { strategic_vision: 0.5, execution_discipline: 0.8, people_development: 0.3, stakeholder_influence: 0.3, adaptive_agility: 0.3 } },
    { archetypeId: 'quest-seedling', dimensionWeights: { strategic_vision: 0.5, execution_discipline: 0.5, people_development: 0.5, stakeholder_influence: 0.5, adaptive_agility: 0.5 } },
  ],
  drive: [
    { archetypeId: 'drive-achiever', dimensionWeights: { achievement_orientation: 0.95, autonomy_need: 0.6, recognition_seeking: 0.4, growth_appetite: 0.7, stability_preference: 0.3 } },
    { archetypeId: 'drive-craftsman', dimensionWeights: { achievement_orientation: 0.7, autonomy_need: 0.7, recognition_seeking: 0.2, growth_appetite: 0.6, stability_preference: 0.5 } },
    { archetypeId: 'drive-champion', dimensionWeights: { achievement_orientation: 0.9, autonomy_need: 0.5, recognition_seeking: 0.8, growth_appetite: 0.8, stability_preference: 0.2 } },
    { archetypeId: 'drive-explorer', dimensionWeights: { achievement_orientation: 0.5, autonomy_need: 0.8, recognition_seeking: 0.3, growth_appetite: 0.95, stability_preference: 0.1 } },
    { archetypeId: 'drive-stalwart', dimensionWeights: { achievement_orientation: 0.6, autonomy_need: 0.3, recognition_seeking: 0.3, growth_appetite: 0.2, stability_preference: 0.95 } },
    { archetypeId: 'drive-restless', dimensionWeights: { achievement_orientation: 0.7, autonomy_need: 0.7, recognition_seeking: 0.5, growth_appetite: 0.9, stability_preference: 0.2 } },
    { archetypeId: 'drive-golden-handcuffs', dimensionWeights: { achievement_orientation: 0.4, autonomy_need: 0.2, recognition_seeking: 0.6, growth_appetite: 0.2, stability_preference: 0.9 } },
    { archetypeId: 'drive-drifter', dimensionWeights: { achievement_orientation: 0.3, autonomy_need: 0.4, recognition_seeking: 0.3, growth_appetite: 0.3, stability_preference: 0.5 } },
    { archetypeId: 'drive-burned-out', dimensionWeights: { achievement_orientation: 0.2, autonomy_need: 0.2, recognition_seeking: 0.2, growth_appetite: 0.1, stability_preference: 0.7 } },
    { archetypeId: 'drive-frozen-asset', dimensionWeights: { achievement_orientation: 0.6, autonomy_need: 0.5, recognition_seeking: 0.4, growth_appetite: 0.6, stability_preference: 0.4 } },
  ],
  impact: [
    { archetypeId: 'impact-architect', dimensionWeights: { governance_mastery: 0.9, board_dynamics: 0.6, strategic_contribution: 0.7, risk_oversight: 0.8 } },
    { archetypeId: 'impact-steward', dimensionWeights: { governance_mastery: 0.7, board_dynamics: 0.5, strategic_contribution: 0.5, risk_oversight: 0.95 } },
    { archetypeId: 'impact-networker', dimensionWeights: { governance_mastery: 0.4, board_dynamics: 0.9, strategic_contribution: 0.5, risk_oversight: 0.3 } },
    { archetypeId: 'impact-guardian', dimensionWeights: { governance_mastery: 0.8, board_dynamics: 0.6, strategic_contribution: 0.4, risk_oversight: 0.85 } },
    { archetypeId: 'impact-visionary', dimensionWeights: { governance_mastery: 0.5, board_dynamics: 0.6, strategic_contribution: 0.95, risk_oversight: 0.4 } },
    { archetypeId: 'impact-bridge-builder', dimensionWeights: { governance_mastery: 0.6, board_dynamics: 0.9, strategic_contribution: 0.7, risk_oversight: 0.5 } },
    { archetypeId: 'impact-nominee', dimensionWeights: { governance_mastery: 0.5, board_dynamics: 0.5, strategic_contribution: 0.5, risk_oversight: 0.5 } },
    { archetypeId: 'impact-passenger', dimensionWeights: { governance_mastery: 0.3, board_dynamics: 0.3, strategic_contribution: 0.2, risk_oversight: 0.3 } },
  ],
  prism: [
    { archetypeId: 'prism-authority', dimensionWeights: { brand_clarity: 0.8, narrative_power: 0.6, visibility_strategy: 0.6, authenticity_index: 0.7, market_resonance: 0.7 } },
    { archetypeId: 'prism-signal', dimensionWeights: { brand_clarity: 0.95, narrative_power: 0.8, visibility_strategy: 0.9, authenticity_index: 0.6, market_resonance: 0.8 } },
    { archetypeId: 'prism-monument', dimensionWeights: { brand_clarity: 0.6, narrative_power: 0.5, visibility_strategy: 0.5, authenticity_index: 0.5, market_resonance: 0.7 } },
    { archetypeId: 'prism-chameleon', dimensionWeights: { brand_clarity: 0.4, narrative_power: 0.7, visibility_strategy: 0.6, authenticity_index: 0.3, market_resonance: 0.7 } },
    { archetypeId: 'prism-amplifier', dimensionWeights: { brand_clarity: 0.5, narrative_power: 0.6, visibility_strategy: 0.3, authenticity_index: 0.8, market_resonance: 0.5 } },
    { archetypeId: 'prism-operator', dimensionWeights: { brand_clarity: 0.6, narrative_power: 0.4, visibility_strategy: 0.5, authenticity_index: 0.7, market_resonance: 0.6 } },
    { archetypeId: 'prism-ghost', dimensionWeights: { brand_clarity: 0.2, narrative_power: 0.3, visibility_strategy: 0.2, authenticity_index: 0.5, market_resonance: 0.2 } },
    { archetypeId: 'prism-mask', dimensionWeights: { brand_clarity: 0.7, narrative_power: 0.8, visibility_strategy: 0.8, authenticity_index: 0.2, market_resonance: 0.6 } },
    { archetypeId: 'prism-static', dimensionWeights: { brand_clarity: 0.7, narrative_power: 0.5, visibility_strategy: 0.6, authenticity_index: 0.6, market_resonance: 0.4 } },
    { archetypeId: 'prism-blank-page', dimensionWeights: { brand_clarity: 0.2, narrative_power: 0.3, visibility_strategy: 0.3, authenticity_index: 0.6, market_resonance: 0.2 } },
  ],
  bridge: [
    { archetypeId: 'bridge-envoy', dimensionWeights: { cultural_awareness: 0.8, adaptation_capacity: 0.7, communication_flex: 0.9, relationship_depth: 0.7 } },
    { archetypeId: 'bridge-navigator', dimensionWeights: { cultural_awareness: 0.9, adaptation_capacity: 0.6, communication_flex: 0.6, relationship_depth: 0.5 } },
    { archetypeId: 'bridge-chameleon', dimensionWeights: { cultural_awareness: 0.8, adaptation_capacity: 0.95, communication_flex: 0.8, relationship_depth: 0.7 } },
    { archetypeId: 'bridge-anchor', dimensionWeights: { cultural_awareness: 0.7, adaptation_capacity: 0.3, communication_flex: 0.4, relationship_depth: 0.8 } },
    { archetypeId: 'bridge-sprinter', dimensionWeights: { cultural_awareness: 0.6, adaptation_capacity: 0.5, communication_flex: 0.7, relationship_depth: 0.3 } },
    { archetypeId: 'bridge-cultural-operator', dimensionWeights: { cultural_awareness: 0.8, adaptation_capacity: 0.5, communication_flex: 0.5, relationship_depth: 0.5 } },
  ],
  mosaic: [
    { archetypeId: 'mosaic-cultural-catalyst', dimensionWeights: { organizational_openness: 0.9, integration_maturity: 0.8, inclusive_leadership: 0.8, cultural_infrastructure: 0.7 } },
    { archetypeId: 'mosaic-cultural-expert', dimensionWeights: { organizational_openness: 0.7, integration_maturity: 0.5, inclusive_leadership: 0.6, cultural_infrastructure: 0.7 } },
    { archetypeId: 'mosaic-cultural-leader', dimensionWeights: { organizational_openness: 0.8, integration_maturity: 0.9, inclusive_leadership: 0.9, cultural_infrastructure: 0.9 } },
    { archetypeId: 'mosaic-cultural-tourist', dimensionWeights: { organizational_openness: 0.5, integration_maturity: 0.3, inclusive_leadership: 0.3, cultural_infrastructure: 0.3 } },
  ],
  forge: [
    { archetypeId: 'forge-rainmaker', dimensionWeights: { revenue_strategy: 0.6, sales_leadership: 0.7, market_positioning: 0.7, pipeline_mastery: 0.9 } },
    { archetypeId: 'forge-system-builder', dimensionWeights: { revenue_strategy: 0.7, sales_leadership: 0.6, market_positioning: 0.5, pipeline_mastery: 0.8 } },
    { archetypeId: 'forge-revenue-architect', dimensionWeights: { revenue_strategy: 0.95, sales_leadership: 0.5, market_positioning: 0.9, pipeline_mastery: 0.6 } },
    { archetypeId: 'forge-promoted-seller', dimensionWeights: { revenue_strategy: 0.5, sales_leadership: 0.8, market_positioning: 0.5, pipeline_mastery: 0.7 } },
  ],
  spark: [
    { archetypeId: 'spark-ai-champion', dimensionWeights: { ai_vision: 0.9, tech_fluency: 0.8, change_readiness: 0.8, ethics_governance: 0.6 } },
    { archetypeId: 'spark-skeptical-director', dimensionWeights: { ai_vision: 0.4, tech_fluency: 0.6, change_readiness: 0.3, ethics_governance: 0.7 } },
    { archetypeId: 'spark-governance-bureaucrat', dimensionWeights: { ai_vision: 0.5, tech_fluency: 0.5, change_readiness: 0.3, ethics_governance: 0.95 } },
    { archetypeId: 'spark-disengaged-director', dimensionWeights: { ai_vision: 0.2, tech_fluency: 0.2, change_readiness: 0.2, ethics_governance: 0.3 } },
  ],
  shift: [], // Composite — handled separately
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
  // SHIFT is composite — aggregate from sub-instruments
  if (instrumentId === 'shift') {
    return classifyShift(dimensionScores);
  }

  const patterns = CLASSIFICATION_PATTERNS[instrumentId];
  const instrument = INSTRUMENTS[instrumentId];

  // Build score map
  const scoreMap: Record<string, number> = {};
  dimensionScores.forEach(ds => {
    scoreMap[ds.dimensionId] = ds.normalizedScore;
  });

  // Calculate similarity for each archetype pattern
  let bestMatch: { archetypeId: string; score: number } | null = null;
  let secondBest: { archetypeId: string; score: number } | null = null;

  for (const pattern of patterns) {
    let similarity = 0;
    let totalWeight = 0;

    for (const [dimId, weight] of Object.entries(pattern.dimensionWeights)) {
      const actualScore = (scoreMap[dimId] ?? 50) / 100; // Normalize to 0-1
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
 * SHIFT composite classification — aggregates from sub-instruments.
 */
function classifyShift(dimensionScores: DimensionScore[]): ArchetypeResult {
  // For SHIFT, we aggregate scores across all instruments
  // and create a composite archetype based on the overall profile
  const avgScore = dimensionScores.reduce((sum, ds) => sum + ds.normalizedScore, 0) / (dimensionScores.length || 1);

  let archetypeId: string;
  let archetypeName: string;

  if (avgScore >= 80) {
    archetypeId = 'shift-integrated-leader';
    archetypeName = 'Integrated Leader';
  } else if (avgScore >= 60) {
    archetypeId = 'shift-adaptive-specialist';
    archetypeName = 'Adaptive Specialist';
  } else if (avgScore >= 40) {
    archetypeId = 'shift-selective-engager';
    archetypeName = 'Selective Engager';
  } else {
    archetypeId = 'shift-development-focus';
    archetypeName = 'Development Focus';
  }

  return {
    archetypeId,
    archetypeName,
    instrument: 'shift',
    category: 'Composite Profile',
    description: `Your SHIFT composite profile reveals an ${archetypeName} pattern across multiple diagnostic dimensions.`,
    confidence: 0.7,
    isTransitional: false,
  };
}

/**
 * Calculate dimension scores from raw answers.
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

  // Calculate scores
  return instrument.dimensions.map(dim => {
    const scores = dimensionMap.get(dim.id) ?? [50];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const normalizedScore = Math.max(0, Math.min(100, avgScore));

    return {
      dimensionId: dim.id,
      dimensionName: dim.name,
      rawScore: avgScore,
      normalizedScore: Math.round(normalizedScore),
    };
  });
}
