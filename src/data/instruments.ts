/**
 * Instrument Definitions — 9 diagnostic instruments
 * Phase 0 (T-001) + Phase 1 (T-101: instrument colors)
 * 
 * Colors are provisional — Kevin to approve final palette.
 */

import { Instrument, InstrumentId } from '@/types/assessment';

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  quest: {
    id: 'quest',
    name: 'QUEST',
    tagline: 'Leadership Capability Diagnostic',
    color: '#2563EB',      // Blue
    colorLight: '#DBEAFE',
    colorDark: '#1E40AF',
    archetypeCount: 10,
    dimensions: [
      { id: 'strategic_vision', name: 'Strategic Vision', description: 'Ability to set direction and anticipate market shifts', minScore: 0, maxScore: 100 },
      { id: 'people_development', name: 'People Development', description: 'Capacity to build and grow high-performing teams', minScore: 0, maxScore: 100 },
      { id: 'execution_discipline', name: 'Execution Discipline', description: 'Consistency in delivering results against plan', minScore: 0, maxScore: 100 },
      { id: 'stakeholder_influence', name: 'Stakeholder Influence', description: 'Ability to navigate and influence key stakeholders', minScore: 0, maxScore: 100 },
      { id: 'adaptive_agility', name: 'Adaptive Agility', description: 'Speed and effectiveness of pivoting when conditions change', minScore: 0, maxScore: 100 },
    ],
  },
  drive: {
    id: 'drive',
    name: 'DRIVE',
    tagline: 'Motivational Profile',
    color: '#DC2626',      // Red
    colorLight: '#FEE2E2',
    colorDark: '#991B1B',
    archetypeCount: 10,
    dimensions: [
      { id: 'achievement_orientation', name: 'Achievement Orientation', description: 'Intensity of drive to accomplish goals', minScore: 0, maxScore: 100 },
      { id: 'autonomy_need', name: 'Autonomy Need', description: 'Desire for independence and self-direction', minScore: 0, maxScore: 100 },
      { id: 'recognition_seeking', name: 'Recognition Seeking', description: 'Importance of external validation and status', minScore: 0, maxScore: 100 },
      { id: 'growth_appetite', name: 'Growth Appetite', description: 'Appetite for new challenges and development', minScore: 0, maxScore: 100 },
      { id: 'stability_preference', name: 'Stability Preference', description: 'Preference for security and predictability', minScore: 0, maxScore: 100 },
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
      { id: 'governance_mastery', name: 'Governance Mastery', description: 'Depth of board governance understanding', minScore: 0, maxScore: 100 },
      { id: 'board_dynamics', name: 'Board Dynamics', description: 'Ability to navigate board relationships', minScore: 0, maxScore: 100 },
      { id: 'strategic_contribution', name: 'Strategic Contribution', description: 'Quality of strategic input to board decisions', minScore: 0, maxScore: 100 },
      { id: 'risk_oversight', name: 'Risk Oversight', description: 'Effectiveness in board-level risk management', minScore: 0, maxScore: 100 },
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
      { id: 'brand_clarity', name: 'Brand Clarity', description: 'How clearly you articulate your professional identity', minScore: 0, maxScore: 100 },
      { id: 'narrative_power', name: 'Narrative Power', description: 'Ability to tell compelling stories about your work', minScore: 0, maxScore: 100 },
      { id: 'visibility_strategy', name: 'Visibility Strategy', description: 'Intentionality in how and where you show up', minScore: 0, maxScore: 100 },
      { id: 'authenticity_index', name: 'Authenticity Index', description: 'Alignment between perceived and actual self', minScore: 0, maxScore: 100 },
      { id: 'market_resonance', name: 'Market Resonance', description: 'How well your brand resonates with target audience', minScore: 0, maxScore: 100 },
    ],
  },
  bridge: {
    id: 'bridge',
    name: 'BRIDGE',
    tagline: 'Cultural Intelligence Diagnostic',
    color: '#059669',      // Emerald
    colorLight: '#D1FAE5',
    colorDark: '#047857',
    archetypeCount: 6,
    dimensions: [
      { id: 'cultural_awareness', name: 'Cultural Awareness', description: 'Sensitivity to cultural differences and norms', minScore: 0, maxScore: 100 },
      { id: 'adaptation_capacity', name: 'Adaptation Capacity', description: 'Ability to adjust behavior across cultures', minScore: 0, maxScore: 100 },
      { id: 'communication_flex', name: 'Communication Flex', description: 'Range of communication styles across contexts', minScore: 0, maxScore: 100 },
      { id: 'relationship_depth', name: 'Relationship Depth', description: 'Quality of cross-cultural relationships built', minScore: 0, maxScore: 100 },
    ],
  },
  mosaic: {
    id: 'mosaic',
    name: 'MOSAIC',
    tagline: 'Cultural Intelligence — Organization',
    color: '#0891B2',      // Cyan
    colorLight: '#CFFAFE',
    colorDark: '#0E7490',
    archetypeCount: 4,
    dimensions: [
      { id: 'organizational_openness', name: 'Organizational Openness', description: 'How open the organization is to cultural diversity', minScore: 0, maxScore: 100 },
      { id: 'integration_maturity', name: 'Integration Maturity', description: 'Level of cross-cultural integration in operations', minScore: 0, maxScore: 100 },
      { id: 'inclusive_leadership', name: 'Inclusive Leadership', description: 'Quality of leadership commitment to inclusion', minScore: 0, maxScore: 100 },
      { id: 'cultural_infrastructure', name: 'Cultural Infrastructure', description: 'Systems and processes supporting cultural intelligence', minScore: 0, maxScore: 100 },
    ],
  },
  forge: {
    id: 'forge',
    name: 'FORGE',
    tagline: 'Revenue Leadership Diagnostic',
    color: '#EA580C',      // Orange
    colorLight: '#FFF7ED',
    colorDark: '#C2410C',
    archetypeCount: 4,
    dimensions: [
      { id: 'revenue_strategy', name: 'Revenue Strategy', description: 'Ability to design and execute revenue strategy', minScore: 0, maxScore: 100 },
      { id: 'sales_leadership', name: 'Sales Leadership', description: 'Quality of sales team leadership and development', minScore: 0, maxScore: 100 },
      { id: 'market_positioning', name: 'Market Positioning', description: 'Effectiveness in market positioning and GTM', minScore: 0, maxScore: 100 },
      { id: 'pipeline_mastery', name: 'Pipeline Mastery', description: 'Control and predictability of revenue pipeline', minScore: 0, maxScore: 100 },
    ],
  },
  spark: {
    id: 'spark',
    name: 'SPARK',
    tagline: 'AI Readiness Diagnostic',
    color: '#8B5CF6',      // Purple
    colorLight: '#F3E8FF',
    colorDark: '#6D28D9',
    archetypeCount: 4,
    dimensions: [
      { id: 'ai_vision', name: 'AI Vision', description: 'Clarity of AI strategy and vision', minScore: 0, maxScore: 100 },
      { id: 'tech_fluency', name: 'Tech Fluency', description: 'Understanding of AI technologies and capabilities', minScore: 0, maxScore: 100 },
      { id: 'change_readiness', name: 'Change Readiness', description: 'Organizational readiness for AI-driven change', minScore: 0, maxScore: 100 },
      { id: 'ethics_governance', name: 'Ethics & Governance', description: 'AI ethics framework and governance maturity', minScore: 0, maxScore: 100 },
    ],
  },
  shift: {
    id: 'shift',
    name: 'SHIFT',
    tagline: 'Composite Leadership Profile',
    color: '#475569',      // Slate
    colorLight: '#F1F5F9',
    colorDark: '#1E293B',
    archetypeCount: 0, // Composite — aggregates from sub-instruments
    dimensions: [],
  },
};

export const INSTRUMENT_LIST = Object.values(INSTRUMENTS);

export function getInstrument(id: InstrumentId): Instrument {
  return INSTRUMENTS[id];
}

export function getInstrumentColor(id: InstrumentId): string {
  return INSTRUMENTS[id].color;
}
