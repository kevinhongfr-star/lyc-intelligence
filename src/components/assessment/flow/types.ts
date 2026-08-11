// ── ASSESSMENT FLOW TYPES ──────────────────────────────────────────
// #1323: Extended with SCENARIO question type, CONTEXT entry-expectation
// questions, and conditional SKIP LOGIC — the key primitives needed for
// executive-grade assessment flows (setup → question → skip based on who
// the taker said they were).

/** Supported question response types.
 *  #1323 adds 'scenario' (narrative setup + multiple choice) and 'context'
 *  (preflight entry-expectation questions that drive skip logic). */
export type QuestionType = 'likert' | 'mcq_single' | 'mcq_multi' | 'scenario' | 'context';

/** A single context (entry-expectation) question, shown BEFORE the scenario
 *  questions begin. Answers to these drive skipIf logic downstream. */
export interface ContextQuestion {
  id: string;
  /** Short machine key: 'seniority' | 'geography' | 'function' | 'current_role' … */
  key: string;
  question: string;
  /** If omitted, defaults to mcq_single-style radio select */
  type?: 'mcq_single' | 'free_text';
  options?: Array<{ label: string; value: string }>;
  /** Helper text below the prompt */
  hint?: string;
  /** Optional default (for known / prefetched context) */
  defaultValue?: string;
  /** True if this is optional */
  optional?: boolean;
}

/** Skip rule — when `answers` + `contextAnswers` satisfy `condition`, the
 *  question is not presented to the user (it's omitted from the order).
 *
 *  Evaluator semantics:
 *   - answerEquals: key is a questionId OR contextKey
 *   - answerIn: value is one of a set
 *   - scoreLt / scoreGt: numeric comparisons on numeric answers
 *   - allOf = AND, anyOf = OR (can be nested)
 */
export type SkipCondition =
  | { answerEquals: { key: string; value: string | number } }
  | { answerIn: { key: string; values: Array<string | number> } }
  | { scoreGt: { key: string; threshold: number } }
  | { scoreLt: { key: string; threshold: number } }
  | { allOf: SkipCondition[] }
  | { anyOf: SkipCondition[] }
  | { neg: SkipCondition };

/** A single assessment question */
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  /** Which dimension this question scores (maps to catalog dimension id) */
  dimension: string;
  /** For mcq_single / mcq_multi / scenario */
  options?: Array<{
    label: string;
    /** Narrative body, shown below the lettered label for scenario-type Qs. */
    detail?: string;
    /** Score contribution (for Likert, 1-5; for mcq, weighted) */
    score: number;
    /** Optional archetype bias (used by engines) */
    archetypeBias?: string;
  }>;
  /** For likert: scale labels (low → high) */
  scaleLabels?: [string, string];
  /** Optional helper text */
  hint?: string;
  /** For mcq_multi: max selections allowed */
  maxSelections?: number;
  /** #1323: Scenario-setup paragraph. Rendered in quotes above the prompt. */
  scenarioContext?: string;
  /** #1323: "What would you do in your first 48 hours?" — specific entry
   *  expectation framing for scenario-type questions. */
  entryExpectation?: string;
  /** #1323: Skip rule evaluated against (answers | contextAnswers). */
  skipIf?: SkipCondition;
}

/** Configuration for a complete assessment flow */
export interface AssessmentFlowConfig {
  /** Diagnostic code, e.g. "PRISM" */
  code: string;
  /** Display name */
  name: string;
  /** Accent color (hex) */
  accent: string;
  /** CSS class prefix for isolation */
  prefix: string;
  /** #1323: Entry-expectation context questions. Rendered as a short
   *  "Tell us about yourself" pre-flight before any scenario/likert
   *  questions. Drives skipIf downstream. */
  contextQuestions?: ContextQuestion[];
  /** Questions in order */
  questions: AssessmentQuestion[];
  /** Where to redirect after submission */
  resultsPath: string;
  /** Where the "back to landing" link goes */
  landingPath: string;
  /** Optional: real submission handler. Returns result ID for redirect.
   * If not provided, flow simulates processing with a 2s delay. */
  onSubmit?: (answers: AnswerMap, contextAnswers: ContextAnswerMap) => Promise<{ resultId: string | null }>;
}

/** Answer storage: questionId → answer value */
export type AnswerMap = Record<string, number | number[]>;

/** #1323: Context answer storage: contextKey → string value */
export type ContextAnswerMap = Record<string, string>;

/** Persisted state in localStorage */
export interface PersistedAssessmentState {
  answers: AnswerMap;
  /** #1323: context answers, e.g. { seniority: 'vp', geography: 'multi_market' } */
  contextAnswers?: ContextAnswerMap;
  /** #1323: 'context' = entry-expectation preflight */
  currentIndex: number;
  startedAt: number;
  /** null = in progress, 'submitting' = processing, 'done' = completed,
   *  'context' = still filling in the preflight context questions */
  status: 'in_progress' | 'submitting' | 'done' | 'context';
}
