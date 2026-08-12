/**
 * assessment.ts — Canonical assessment types matching #98/#1341 schema.
 *
 * These types mirror the Supabase table structure:
 *   assessment_definitions, assessment_dimensions, assessment_questions,
 *   assessment_attempts, assessment_responses, assessment_results,
 *   assessment_result_dimensions, assessment_archetypes
 *
 * JSON definition files (src/data/diagnostics/*.json) are SEED data.
 * Database tables are the runtime source of truth.
 */

import type { TierKey } from '@/config/tierConfig';

// ── Diagnostic Definition (assessment_definitions table) ───────────

export interface DiagnosticMeta {
  id: string;                    // canonical slug: 'prism', 'spark', etc.
  title: string;                 // display title: 'PRISM'
  subtitle: string;              // 'Career & Professional Branding Diagnostic'
  accent_color: string;          // hex color per diagnostic
  total_questions: number;
  total_dimensions: number;
  tier_key: TierKey;             // minimum tier required
  status: 'placeholder' | 'active';
}

// ── Dimension (assessment_dimensions table) ────────────────────────

export interface DiagnosticDimension {
  key: string;                   // canonical key: 'clarity', 'visibility', etc.
  name: string;                  // 'Clarity'
  description: string;           // what this dimension measures
  low_label: string;             // 'Developing'
  high_label: string;            // 'Mastery'
  weight: number;                // scoring weight (default 1.0)
  sort_order: number;
}

// ── Question (assessment_questions table) ──────────────────────────

/**
 * Canonical question types per #1277 branching-native spec.
 * Consolidates the 3 existing interfaces (flow/types.ts, akira/types.ts,
 * supabaseApi.ts) into one canonical set.
 */
export type CanonicalQuestionType =
  | 'single_select'   // one option from a list
  | 'multi_select'    // multiple options from a list
  | 'scale'           // numeric scale (e.g., 1-5, 1-10)
  | 'text'            // open text response
  | 'scenario';       // scenario-based with contextual preamble

/**
 * Skip logic action types per #1277 spec.
 */
export type SkipAction = 'skip_question' | 'jump_to' | 'end_assessment';

/**
 * A single skip logic rule. Condition is evaluated against the current
 * answer set. If condition matches, the action is performed.
 */
export interface SkipRule {
  condition: {
    question_id: string;         // question_key to check
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in';
    value: string | number | string[];
  };
  action: SkipAction;
  target?: string;               // question_key for jump_to
}

/**
 * Dependency: this question should only be shown if the dependency
 * condition is met. Different from skip_logic (which is evaluated
 * when the flow reaches this question; dependency is a prerequisite).
 */
export interface QuestionDependency {
  question_id: string;           // question_key to check
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface DiagnosticQuestion {
  key: string;                   // canonical key: 'q_001', 'q_role', etc.
  type: CanonicalQuestionType;
  prompt: string;
  /** For single_select / multi_select */
  options?: Array<{
    value: string;
    label: string;
    /** Score contribution for this option */
    score?: number;
  }>;
  /** For scale: min and max values */
  scale_min?: number;
  scale_max?: number;
  scale_labels?: Record<string, string>;
  /** For multi_select: max selections allowed */
  max_selections?: number;
  /** For scenario: contextual preamble shown above the prompt */
  scenario?: string;
  required: boolean;
  /** Which dimension this question scores */
  dimension_key: string;
  /** Scoring weight within the dimension */
  weight: number;
  sort_order: number;
  /** Skip logic rules — evaluated when flow reaches this question */
  skip_logic?: SkipRule[];
  /** Dependency — prerequisite condition for showing this question */
  dependency?: QuestionDependency;
}

// ── Archetype (assessment_archetypes table) ────────────────────────

export interface DiagnosticArchetype {
  key: string;                   // 'archetype_1', 'the_architect', etc.
  name: string;                  // 'The Architect'
  description: string;
  key_traits: string[];
  sort_order: number;
}

// ── Scoring Configuration ──────────────────────────────────────────

export interface ScoringConfig {
  method: 'weighted_average';
  overall_formula: 'dimension_weighted_avg';
  archetype_mapping: 'highest_dimension_combo';
}

export interface ResultInsights {
  high: string;
  medium: string;
  low: string;
}

// ── Complete Diagnostic Definition (JSON seed file format) ─────────

export interface DiagnosticDefinition {
  meta: DiagnosticMeta;
  dimensions: DiagnosticDimension[];
  questions: DiagnosticQuestion[];
  archetypes: DiagnosticArchetype[];
  scoring: ScoringConfig;
  result_insights: ResultInsights;
}

// ── Runtime Types (database rows) ──────────────────────────────────

export interface AssessmentAttempt {
  attempt_id: string;
  user_id: string | null;        // null = anonymous
  assessment_id: string;         // diagnostic slug
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  current_question_key: string | null;
  is_anonymous: boolean;
  expires_at: string | null;     // for anonymous attempts (7 days)
}

export interface AssessmentResponse {
  response_id: string;
  attempt_id: string;
  question_key: string;
  answer: unknown;               // structured answer value(s)
  answered_at: string;
}

export interface AssessmentResult {
  result_id: string;
  attempt_id: string;
  assessment_id: string;
  user_id: string | null;
  overall_score: number;         // 0-100
  overall_level: string;         // Developing, Proficient, Advanced, Mastery
  style_key: string | null;
  archetype_key: string | null;
  insights: string[];
  completed_at: string;
}

export interface AssessmentResultDimension {
  result_dimension_id: string;
  result_id: string;
  dimension_key: string;
  score: number;                 // 0-100
  level: string;                 // Developing, Proficient, Advanced, Mastery
  dimension_name: string;
  description: string;           // per-dimension insight text
}

// ── Level thresholds (#1342) ───────────────────────────────────────

export const LEVEL_THRESHOLDS = [
  { min: 0,  max: 39,  level: 'Developing' },
  { min: 40, max: 69,  level: 'Proficient' },
  { min: 70, max: 89,  level: 'Advanced' },
  { min: 90, max: 100, level: 'Mastery' },
] as const;

export function scoreToLevel(score: number): string {
  for (const t of LEVEL_THRESHOLDS) {
    if (score >= t.min && score <= t.max) return t.level;
  }
  return 'Developing';
}
