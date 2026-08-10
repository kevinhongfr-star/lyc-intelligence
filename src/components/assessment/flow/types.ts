// ── ASSESSMENT FLOW TYPES ──────────────────────────────────────────

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
