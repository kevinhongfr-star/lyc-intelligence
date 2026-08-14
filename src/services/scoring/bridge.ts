export const INSTRUMENT = "BRIDGE";
export const FULL_NAME = "APAC Mandate Execution & Cross-Border Leadership Readiness";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const B2C_NAME = "APAC Mandate Execution & Cross-Border Leadership Readiness";
export const TAGLINE = "Cross-border mandate readiness. Mandate clarity, stakeholder navigation, cultural fluency, and the resilience to hold under pressure.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Mandate Clarity",
    question_ids: [
      "Q01",
      "Q02",
      "Q03",
      "Q04",
      "Q05",
      "Q06"
    ],
    reverse_coded: [
      "Q04"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D2",
    name: "Stakeholder Navigation",
    question_ids: [
      "Q07",
      "Q08",
      "Q09",
      "Q10",
      "Q11",
      "Q12"
    ],
    reverse_coded: [
      "Q10"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "Communication Alignment",
    question_ids: [
      "Q13",
      "Q14",
      "Q15",
      "Q16",
      "Q17",
      "Q18"
    ],
    reverse_coded: [
      "Q16"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "Pressure Resilience",
    question_ids: [
      "Q19",
      "Q20",
      "Q21",
      "Q22",
      "Q23",
      "Q24"
    ],
    reverse_coded: [
      "Q22"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D5",
    name: "Long-Game Thinking",
    question_ids: [
      "Q25",
      "Q26",
      "Q27",
      "Q28",
      "Q29",
      "Q30"
    ],
    reverse_coded: [
      "Q28"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D6",
    name: "Cultural Fluency",
    question_ids: [
      "Q31",
      "Q32",
      "Q33",
      "Q34",
      "Q35",
      "Q36"
    ],
    reverse_coded: [
      "Q35"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "High Mandate Readiness",
    min: 80,
    max: 100,
    interpretation: "Strong readiness across all 6 dimensions; mandate risk is low"
  },
  {
    band: "Ready with Monitoring",
    min: 65,
    max: 79,
    interpretation: "Solid foundation with specific dimensions requiring attention. Proactive development recommended."
  },
  {
    band: "Development Needed",
    min: 45,
    max: 64,
    interpretation: "Multiple dimensions require deliberate investment before mandate effectiveness can be expected. Early intervention critical."
  },
  {
    band: "Mandate Risk",
    min: 0,
    max: 44,
    interpretation: "Significant gaps across mandate dimensions. Without targeted support, mandate failure probability is high."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature mandate execution capability"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Emerging mandate capability with targeted development needs"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant mandate execution gap"
  }
];

export const ARCHETYPES = [
  {
    name: "The Envoy",
    "#": "1",
    weakest_dimension: "Stakeholder Navigation",
    three_fires_correlation: "Fire 1: Relationship deficit",
    failure_pattern: "Great on paper, fails in practice because relationships don't form. The mandate dies from isolation.",
    weakest_dim_id: "D2"
  },
  {
    name: "The Navigator",
    "#": "2",
    weakest_dimension: "Mandate Clarity",
    three_fires_correlation: "Fire 1: Expectation gap",
    failure_pattern: "Misunderstands what the role actually requires. Misaligned expectations create early friction.",
    weakest_dim_id: "D1"
  },
  {
    name: "The Chameleon",
    "#": "3",
    weakest_dimension: "Communication Alignment",
    three_fires_correlation: "Fire 2: Communication misfire",
    failure_pattern: "Says all the right things in the wrong way. Message is right but delivery creates friction.",
    weakest_dim_id: "D3"
  },
  {
    name: "The Anchor",
    "#": "4",
    weakest_dimension: "Pressure Resilience",
    three_fires_correlation: "Fire 2: Pressure collapse",
    failure_pattern: "Starts strong, deteriorates under sustained pressure. The mandate doesn't fail in good times — it fails in the first crisis.",
    weakest_dim_id: "D4"
  },
  {
    name: "The Sprinter",
    "#": "5",
    weakest_dimension: "Long-Game Thinking",
    three_fires_correlation: "Fire 3: Short-term trap",
    failure_pattern: "Wins short-term results but burns long-term relationship capital. The board sees Q1 wins and doesn't notice the damage.",
    weakest_dim_id: "D5"
  },
  {
    name: "The Cultural Operator",
    "#": "6",
    weakest_dimension: "No dim <50, Cultural Fluency >70",
    three_fires_correlation: "Minimal fire risk",
    failure_pattern: "The ideal BRIDGE profile. Strong across all dimensions with cultural fluency as a demonstrated strength.",
    weakest_dim_id: "D6"
  }
];

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
