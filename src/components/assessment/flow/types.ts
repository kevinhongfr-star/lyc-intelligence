// ── ASSESSMENT FLOW TYPES ──────────────────────────────────────────
// #1323: Added skipIf + branch support for conditional question flow.
// #1323: Added scenario question format (context stem before the prompt).

/** Supported question response types */
export type QuestionType = 'likert' | 'mcq_single' | 'mcq_multi';

/** A single assessment question */
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  /** Which dimension this question scores (maps to catalog dimension id) */
  dimension: string;
  /** For mcq_single / mcq_multi */
  options?: Array<{
    label: string;
    /** Score contribution (for Likert, 1-5; for mcq, weighted) */
    score: number;
  }>;
  /** For likert: scale labels (low → high) */
  scaleLabels?: [string, string];
  /** Optional helper text */
  hint?: string;
  /** For mcq_multi: max selections allowed */
  maxSelections?: number;

  // ── #1323: Scenario question format ────────────────────────────

  /**
   * Optional scenario context shown above the question prompt. When present,
   * the question renders as a scenario-based item: the scenario stem is
   * displayed in a distinct block above the response options, signalling
   * "answer in the context of this situation" rather than abstract self-
   * report. This closes the positioning gap where marketing promises
   * scenario-based assessment but the engine only emitted Likert items.
   */
  scenario?: string;

  // ── #1323: Skip logic & branching ───────────────────────────────

  /**
   * Skip this question if the predicate returns true. Evaluated against
   * the current answer set when the flow would display this question.
   * Skipped questions are not shown and not counted in progress.
   *
   * Example: skip a follow-up if the gate question scored below 3.
   *   skipIf: (answers) => (answers['q5'] as number) < 3
   */
  skipIf?: (answers: AnswerMap) => boolean;

  /**
   * Branch to a specific question ID after this question is answered.
   * Return null (or omit) for default linear progression (next in array).
   *
   * Example: route to a different section based on mcq choice.
   *   branch: (answers) => answers['q3'] === 5 ? 'section_b_q1' : null
   */
  branch?: (answers: AnswerMap) => string | null;
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
  /** Questions in order */
  questions: AssessmentQuestion[];
  /** Where to redirect after submission */
  resultsPath: string;
  /** Where the "back to landing" link goes */
  landingPath: string;
  /** Optional: real submission handler. Returns result ID for redirect.
   * If not provided, flow simulates processing with a 2s delay. */
  onSubmit?: (answers: AnswerMap) => Promise<{ resultId: string | null }>;

  // ── #1323: Entry expectation screen ─────────────────────────────

  /**
   * Optional intro screen shown before the first question. Sets
   * expectations about assessment duration, what to expect, and
   * the complimentary / tier context.
   */
  intro?: {
    title: string;
    body: string;
    /** Estimated duration label, e.g. "~10 minutes" */
    duration?: string;
    /** Bullet points of what to expect */
    expectations?: string[];
  };
}

/** Answer storage: questionId → answer value */
export type AnswerMap = Record<string, number | number[]>;

/** Persisted state in localStorage */
export interface PersistedAssessmentState {
  answers: AnswerMap;
  currentIndex: number;
  startedAt: number;
  /** null = in progress, 'submitting' = processing, 'done' = completed */
  status: 'in_progress' | 'submitting' | 'done';
}
