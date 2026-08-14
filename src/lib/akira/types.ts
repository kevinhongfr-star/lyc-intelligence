export type QuestionType = "likert" | "forced_choice" | "mcq_single" | "mcq_multi";

/**
 * Scoring mode — determines how dimensions are scored and archetypes are matched.
 * - `weighted_average`: Standard Likert, weighted composite, generic archetype match.
 * - `matrix`: Archetype determined by high/low dimension combination (e.g. PRISM foundation × visibility).
 * - `forced_choice`: Mixed-method (DISC forced-choice + Likert). Archetype by DISC primary × CR band.
 * - `score_only`: No archetypes. Dimension scores + composite only.
 * - `weakest_dim`: Archetype determined by weakest dimension (e.g. BRIDGE).
 */
export type ScoringMode = "weighted_average" | "matrix" | "forced_choice" | "score_only" | "weakest_dim";

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: QuestionType;
  reverse_coded?: boolean;
  dimension_id?: string;
  dimension_name?: string;
  options?: Array<{ label?: string; text: string; value?: number | string }>;
  scale_labels?: [string, string];
}

export interface InstrumentDimension {
  id?: string;
  name: string;
  question_ids?: string[];
  items?: Array<{ id: string; text?: string }>;
  reverse_coded?: string[];
  raw_max?: number;
  n_questions?: number;
  count?: number;
  questions?: unknown[];
  sub_dimensions?: string[];
  normalised_max?: number;
  normalised_formula?: string;
  weight?: number;
  anchors?: Array<{ min: number; max: number; label: string }>;
  description?: string;
}

export interface CompositeBand {
  min: number;
  max: number;
  band: string;
  interpretation: string;
}

export interface DimensionVerdict {
  dim?: string;
  min: number;
  max: number;
  verdict: string;
  meaning: string;
}

export interface Archetype {
  id?: string | number;
  name: string;
  description?: string;
  "#"?: string;
  foundation?: string;
  visibility?: string;
  core_dynamic?: string;
  risk_if_unaddressed?: string;
  development_priority?: string;
  apac_note?: string;
  apac_modifier_note?: string;
  profile?: string;
  core_strength?: string;
  orientation?: string;
  mandate_band?: string;
  motivation_type?: string;
  weakest_dimension?: string;
  organisational_impact?: string;
  board_ai_fluency?: string;
  selling_acumen?: string;
  key_risk?: string;
  state?: string;
  [k: string]: unknown;
}

export interface InstrumentConfig {
  instrument: string;
  full_name?: string;
  version?: string;
  total_questions?: number;
  scale?: string;
  delivery_minutes?: number;
  scoring_mode?: ScoringMode;
  dimensions: InstrumentDimension[];
  composite_bands: CompositeBand[];
  dimension_verdicts?: DimensionVerdict[];
  archetypes?: Archetype[];
  engagement_risk?: unknown;
  [k: string]: unknown;
}
