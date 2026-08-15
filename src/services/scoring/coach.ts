// ═══════════════════════════════════════════════════════════
// COACH Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/coach_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "COACH";
export const FULL_NAME = "COACH — executive coaching fit";
export const B2C_NAME = "COACH — executive coaching fit";
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
    name: "Developmental Orientation",
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
    name: "Adaptive Coaching Style",
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
    name: "Developmental Relationship Quality",
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
      "A. Goal-setting models",
      "B. Developmental coaching models",
      "C. Performance & accountability conversations"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/35) x 20"
  },
  {
    id: "D4",
    name: "Coaching Under Constraints",
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

export const ARCHETYPES = [
  {
    name: "The Bilateral Developer",
    "#": "1",
    focus: "Developmental orientation + relationship quality dominant",
    description: "Thinks developmentally and builds strong bilateral developmental relationships. Combines orientation with the relational quality that drives actual growth in others.",
    primary_dim: "D1 + D3",
  },
  {
    name: "The Adaptive Coach",
    "#": "2",
    focus: "Adaptive style + developmental orientation dominant",
    description: "Matches coaching approach to the coachee and context. Flexible, fluid, and able to shift gears between support, challenge, and directiveness as the moment requires.",
    primary_dim: "D2 + D1",
  },
  {
    name: "The Trust Builder",
    "#": "3",
    focus: "Developmental relationship quality dominant",
    description: "Builds genuine, safe, high-trust coaching relationships. Coachees are willing to bring their real challenges because the relational foundation is strong enough to hold vulnerability.",
    primary_dim: "D3",
  },
  {
    name: "The Pressure-Tested Coach",
    "#": "4",
    focus: "Coaching under constraints + adaptive style dominant",
    description: "Delivers quality coaching even under time pressure, organisational constraints, and high-stakes contexts. Doesn't abandon coaching discipline when the environment gets tight.",
    primary_dim: "D4 + D2",
  },
  {
    name: "The Transactional Developer",
    "#": "5",
    focus: "Skillset strong but developmental orientation thin",
    description: "Knows coaching mechanics and can run a competent conversation, but coaching is instrumental and task-focused rather than genuinely developmental. Tools outpace mindset.",
    primary_dim: "D2 high, D1 developing",
  },
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
