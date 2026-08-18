// ── ASSESSMENT FLOW TYPES ──────────────────────────────────────────
// #1323: Added skipIf + branch support for conditional question flow.
// #1323: Added scenario question format (context stem before the prompt).

/** Supported question response types */
// forced_choice: LEAP DISC-style A/B (or D/I/S/C) pick-one; slider: numeric range.
export type QuestionType = 'likert' | 'mcq_single' | 'mcq_multi' | 'forced_choice' | 'slider';

/** A single assessment question */
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  /** Which dimension this question scores (maps to catalog dimension id) */
  dimension: string;
  /** For mcq_single / mcq_multi / forced_choice */
  options?: Array<{
    label: string;
    /** Score contribution (for Likert, 1-5; for mcq, weighted) */
    score: number;
    /** For forced_choice: the stored value (e.g. "A"/"B" or DISC "D"/"I"/"S"/"C"). Falls back to label. */
    value?: string;
  }>;
  /** For likert: scale labels (low → high) */
  scaleLabels?: [string, string];
  /** For likert: max scale value (e.g. 5 or 7). Defaults to 5. */
  scaleMax?: number;
  /** For likert/slider: min scale value. Defaults to 1. */
  scaleMin?: number;
  /** For slider: step between values. Defaults to 1. */
  scaleStep?: number;
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

/** Answer storage: questionId → answer value
 *  number: likert / slider / mcq_single (score)
 *  number[]: mcq_multi (selected scores)
 *  string: forced_choice (chosen option value, e.g. "A"/"B" or "D") */
export type AnswerMap = Record<string, number | number[] | string>;

/** Persisted state in localStorage */
export interface PersistedAssessmentState {
  answers: AnswerMap;
  currentIndex: number;
  startedAt: number;
  /** null = in progress, 'submitting' = processing, 'done' = completed */
  status: 'in_progress' | 'submitting' | 'done';
}
