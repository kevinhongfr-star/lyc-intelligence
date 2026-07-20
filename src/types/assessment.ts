/**
 * Assessment & Archetype Type System
 * Phase 0 — Data Architecture (T-001, T-002, T-003)
 * 
 * Core types for the 9-instrument, 62-archetype assessment system.
 */

// ── Instruments ──

export type InstrumentId =
  | 'quest'     // Leadership Capability
  | 'drive'     // Motivational Profile
  | 'impact'    // Board Effectiveness
  | 'prism'     // Brand Identity
  | 'bridge'    // Cultural Intelligence (Individual)
  | 'mosaic'    // Cultural Intelligence (Organization)
  | 'forge'     // Revenue Leadership
  | 'spark'     // AI Readiness
  | 'shift';    // Composite (cross-instrument)

export interface Instrument {
  id: InstrumentId;
  name: string;
  tagline: string;
  color: string;
  colorLight: string;
  colorDark: string;
  archetypeCount: number;
  dimensions: Dimension[];
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
}

// ── Archetypes ──

export interface Archetype {
  id: string;
  name: string;
  instrument: InstrumentId;
  category: string;
  description: string;
  teaser: string; // 1-paragraph teaser for free tier
  icon: string; // SVG icon path or component name
  strengths: string[];
  risks: string[];
  developmentPriorities: string[];
}

export interface ArchetypeResult {
  archetypeId: string;
  archetypeName: string;
  instrument: InstrumentId;
  category: string;
  description: string;
  confidence: number; // 0-1
  isTransitional: boolean; // confidence < 0.6
  secondaryArchetypeId?: string;
  secondaryArchetypeName?: string;
}

// ── Modifiers ──

export interface Modifier {
  id: string;
  name: string;
  description: string;
  type: 'scale' | 'context' | 'environment';
  impact: 'positive' | 'negative' | 'neutral';
  adjustmentFactor: number; // -0.2 to +0.2
}

export interface ModifierResult {
  modifier: Modifier;
  active: boolean;
  adjustedScore: number;
  narrative: string;
}

// ── Assessment ──

export interface AssessmentAnswer {
  questionId: string;
  dimensionId: string;
  score: number;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  rawScore: number;
  normalizedScore: number; // 0-100
  percentile?: number;
}

export interface AssessmentResult {
  id: string;
  instrumentId: InstrumentId;
  createdAt: string;
  answers: AssessmentAnswer[];
  dimensionScores: DimensionScore[];
  archetype: ArchetypeResult;
  modifiers: ModifierResult[];
  email?: string; // For gated access
  isGated: boolean;
}

// ── Assessment Submission ──

export interface AssessmentSubmission {
  instrumentId: InstrumentId;
  answers: Record<string, number>; // questionId -> score
  email?: string;
}

export interface AssessmentSummary {
  archetype: {
    name: string;
    category: string;
    description: string;
  };
  instrumentColor: string;
  archetypeIcon: string;
}

// ── Scale Tier (FORGE specific) ──

export type ScaleTier = 'entry' | 'mid' | 'senior';

export interface ForgeResult extends ArchetypeResult {
  scaleTier: ScaleTier;
  revenueMetrics: {
    quotaAttainment: number;
    dealSize: string;
    teamSize: number;
  };
}

// ── SHIFT Composite ──

export interface ShiftResult extends ArchetypeResult {
  subInstrumentResults: ArchetypeResult[];
  compositeScore: number;
  integrationNarrative: string;
}

// ── API Types ──

export interface SubmitAssessmentRequest {
  instrument_id: InstrumentId;
  answers: Record<string, number>;
  email?: string;
}

export interface SubmitAssessmentResponse {
  success: boolean;
  result: AssessmentResult;
}

export interface GetAssessmentResponse {
  result: AssessmentResult;
}

export interface GetAssessmentSummaryResponse {
  archetype: {
    name: string;
    category: string;
    description: string;
  };
  instrument_color: string;
  archetype_icon: string;
}
