/**
 * engine/types.ts — Types for the branching-native DiagnosticEngine.
 *
 * #1277: Canonical branching-native assessment question engine. This module
 * consolidates the ad-hoc flow types (flow/types.ts) onto the canonical
 * assessment types (@/types/assessment). The engine is fully data-driven:
 * it loads a DiagnosticDefinition via getDiagnostic(slug) and drives the full
 * attempt → response → result lifecycle via diagnosticApi.ts (#1341).
 *
 * Canonical question types: single_select | multi_select | scale | text | scenario
 * Skip logic actions: skip_question | jump_to | end_assessment
 * Dependency: prerequisite condition for showing a question (vs. skip_logic
 * which is evaluated when the flow reaches / advances past a question).
 */
import type {
  DiagnosticDefinition,
  DiagnosticQuestion,
  CanonicalQuestionType,
  SkipRule,
  QuestionDependency,
  DiagnosticMeta,
} from '@/types/assessment';
import type { AnswerMap, AnswerValue } from '@/services/diagnosticScoring';

/** Engine UI phases. */
export type EnginePhase = 'intro' | 'questions' | 'review' | 'submitting';

export interface DiagnosticEngineProps {
  /** Diagnostic slug: 'prism', 'spark', 'forge', etc. */
  slug: string;
  /** Authenticated user id, or null for anonymous / guest mode. */
  userId: string | null;
  /** Accent color override (falls back to diagnostic meta.accent_color). */
  accent?: string;
  /** Called with the result id once the attempt is scored. Parent redirects. */
  onComplete?: (resultId: string) => void;
}

export type {
  DiagnosticDefinition,
  DiagnosticQuestion,
  CanonicalQuestionType,
  SkipRule,
  QuestionDependency,
  DiagnosticMeta,
  AnswerMap,
  AnswerValue,
};
