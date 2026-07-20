/**
 * Modifier System (T-003)
 * 
 * Modifiers adjust archetype confidence based on contextual factors:
 * - Scale (team size, revenue scope)
 * - Context (industry, geography, career stage)
 * - Environment (startup vs corporate, crisis vs growth)
 */

import { Modifier, ModifierResult, DimensionScore, ArchetypeResult, InstrumentId } from '@/types/assessment';

export const MODIFIERS: Modifier[] = [
  // Scale modifiers
  { id: 'large-team', name: 'Large Team Scale', description: 'Leading 50+ people amplifies leadership archetypes', type: 'scale', impact: 'positive', adjustmentFactor: 0.1 },
  { id: 'small-team', name: 'Small Team Intimacy', description: 'Leading <10 people amplifies hands-on archetypes', type: 'scale', impact: 'positive', adjustmentFactor: 0.08 },
  { id: 'global-scope', name: 'Global Scope', description: 'Multi-country responsibility amplifies cultural archetypes', type: 'scale', impact: 'positive', adjustmentFactor: 0.12 },
  
  // Context modifiers
  { id: 'startup-context', name: 'Startup Context', description: 'Early-stage environment amplifies entrepreneurial archetypes', type: 'context', impact: 'positive', adjustmentFactor: 0.1 },
  { id: 'corporate-context', name: 'Corporate Context', description: 'Large organization amplifies structural archetypes', type: 'context', impact: 'positive', adjustmentFactor: 0.08 },
  { id: 'turnaround-context', name: 'Turnaround Context', description: 'Crisis/restructuring amplifies catalyst and commander archetypes', type: 'context', impact: 'positive', adjustmentFactor: 0.15 },
  { id: 'growth-context', name: 'Growth Context', description: 'Scaling phase amplifies engine and architect archetypes', type: 'context', impact: 'positive', adjustmentFactor: 0.1 },
  
  // Environment modifiers
  { id: 'high-ambiguity', name: 'High Ambiguity Environment', description: 'Unclear market conditions amplify navigator and strategist archetypes', type: 'environment', impact: 'positive', adjustmentFactor: 0.1 },
  { id: 'high-structure', name: 'Highly Structured Environment', description: 'Regulated/structured environments amplify steward and guardian archetypes', type: 'environment', impact: 'positive', adjustmentFactor: 0.08 },
  { id: 'cross-cultural', name: 'Cross-Cultural Environment', description: 'Multi-cultural work environment amplifies bridge archetypes', type: 'environment', impact: 'positive', adjustmentFactor: 0.12 },
  
  // Negative modifiers (reduce confidence)
  { id: 'role-mismatch', name: 'Role-Archetype Mismatch', description: 'Current role does not align with archetype strengths', type: 'context', impact: 'negative', adjustmentFactor: -0.15 },
  { id: 'tenure-anomaly', name: 'Tenure Anomaly', description: 'Very short or very long tenure relative to archetype norms', type: 'context', impact: 'negative', adjustmentFactor: -0.08 },
];

/**
 * Determine which modifiers are active based on dimension scores and context.
 */
export function computeModifiers(
  instrumentId: InstrumentId,
  dimensionScores: DimensionScore[],
  archetype: ArchetypeResult,
  context?: {
    teamSize?: number;
    isGlobal?: boolean;
    companyStage?: 'startup' | 'growth' | 'corporate' | 'turnaround';
    industry?: string;
    tenureYears?: number;
  }
): ModifierResult[] {
  const activeModifiers: ModifierResult[] = [];

  // Scale modifiers
  if (context?.teamSize) {
    if (context.teamSize >= 50) {
      activeModifiers.push(createModifierResult('large-team', true, archetype.confidence));
    } else if (context.teamSize < 10) {
      activeModifiers.push(createModifierResult('small-team', true, archetype.confidence));
    }
  }

  if (context?.isGlobal) {
    activeModifiers.push(createModifierResult('global-scope', true, archetype.confidence));
  }

  // Context modifiers
  if (context?.companyStage) {
    switch (context.companyStage) {
      case 'startup':
        activeModifiers.push(createModifierResult('startup-context', true, archetype.confidence));
        activeModifiers.push(createModifierResult('high-ambiguity', true, archetype.confidence));
        break;
      case 'growth':
        activeModifiers.push(createModifierResult('growth-context', true, archetype.confidence));
        break;
      case 'corporate':
        activeModifiers.push(createModifierResult('corporate-context', true, archetype.confidence));
        activeModifiers.push(createModifierResult('high-structure', true, archetype.confidence));
        break;
      case 'turnaround':
        activeModifiers.push(createModifierResult('turnaround-context', true, archetype.confidence));
        activeModifiers.push(createModifierResult('high-ambiguity', true, archetype.confidence));
        break;
    }
  }

  // Tenure modifier
  if (context?.tenureYears !== undefined) {
    if (context.tenureYears < 1 || context.tenureYears > 15) {
      activeModifiers.push(createModifierResult('tenure-anomaly', true, archetype.confidence));
    }
  }

  // Add all inactive modifiers for completeness
  for (const modifier of MODIFIERS) {
    if (!activeModifiers.find(m => m.modifier.id === modifier.id)) {
      activeModifiers.push(createModifierResult(modifier.id, false, archetype.confidence));
    }
  }

  return activeModifiers;
}

function createModifierResult(modifierId: string, active: boolean, baseConfidence: number): ModifierResult {
  const modifier = MODIFIERS.find(m => m.id === modifierId)!;
  const adjustedScore = active ? baseConfidence + modifier.adjustmentFactor : baseConfidence;

  return {
    modifier,
    active,
    adjustedScore: Math.max(0, Math.min(1, adjustedScore)),
    narrative: active
      ? `${modifier.name} is active: ${modifier.description}. This ${modifier.impact === 'positive' ? 'strengthens' : 'challenges'} your ${modifier.name.toLowerCase()} signal.`
      : `${modifier.name} is not active in your current context.`,
  };
}

/**
 * Get all available modifiers.
 */
export function getAllModifiers(): Modifier[] {
  return [...MODIFIERS];
}
