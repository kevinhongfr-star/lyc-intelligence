// ═══════════════════════════════════════════════════════════
// COACH Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/coach_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "COACH";
export const FULL_NAME = "COACH — Manager-as-Coach Capability";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = COACH — Manager-as-Coach Capability draft derived from reportPipeline.
export const B2C_NAME = "COACH — Manager-as-Coach Capability";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = COACH — Manager-as-Coach Capability draft derived from reportPipeline.
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 26;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 8;
export const TIER = "core";
export const PRICE_MILES = 199;
export const TAGLINE = "The four pillars of a coaching leader: Mindset → Skillset → Toolkit → Discipline.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "COACH MINDSET",
    question_ids: [
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Q5"
    ],
    reverse_coded: [],
    raw_max: 25,
    n_questions: 5,
    sub_dimensions: [
      "A. Belief in potential",
      "B. Internal locus of control"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/25) x 20"
  },
  {
    id: "D2",
    name: "COACH SKILLSET",
    question_ids: [
      "Q6",
      "Q7",
      "Q8",
      "Q9",
      "Q10",
      "Q11",
      "Q12"
    ],
    reverse_coded: [],
    raw_max: 35,
    n_questions: 7,
    sub_dimensions: [
      "A. Active listening & reflecting",
      "B. Powerful questioning",
      "C. Contracting, structure & presence"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/35) x 20"
  },
  {
    id: "D3",
    name: "COACH TOOLKIT",
    question_ids: [
      "Q13",
      "Q14",
      "Q15",
      "Q16",
      "Q17",
      "Q18",
      "Q19"
    ],
    reverse_coded: [
      "Q19"
    ],
    raw_max: 35,
    n_questions: 7,
    sub_dimensions: [
      "A. Goal-setting frameworks",
      "B. Developmental coaching models",
      "C. Performance & accountability conversations"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/35) x 20"
  },
  {
    id: "D4",
    name: "COACH DISCIPLINE",
    question_ids: [
      "Q20",
      "Q21",
      "Q22",
      "Q23",
      "Q24",
      "Q25",
      "Q26"
    ],
    reverse_coded: [
      "Q25",
      "Q26"
    ],
    raw_max: 35,
    n_questions: 7,
    sub_dimensions: [
      "A. Frequency & consistency",
      "B. Ownership & boundaries",
      "C. Measurement & review"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/35) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "Coaching Leader",
    min: 80,
    max: 100,
    interpretation: "Strong Manager-as-Coach capability across all four pillars. Ready to coach at scale and develop other leaders in coaching."
  },
  {
    band: "Developing Coach",
    min: 60,
    max: 79.9,
    interpretation: "Functional coaching capability with specific pillars to strengthen. Likely effective with familiar team members but less consistent in new contexts."
  },
  {
    band: "Emerging Coach",
    min: 40,
    max: 59.9,
    interpretation: "Coaching is developing but not yet a reliable leadership lever. One or more pillars require focused intervention."
  },
  {
    band: "Coaching Gap",
    min: 0,
    max: 39.9,
    interpretation: "Significant gap in coaching readiness. Defaulting to directive / solve-for approaches; team development is at risk."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strength",
    meaning: "A reliable pillar of your Manager-as-Coach capability"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Foundational but inconsistent — a focused development target"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "A high-priority gap limiting your impact as a coaching leader"
  }
];

export const ARCHETYPES: unknown[] = [];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
