// ═══════════════════════════════════════════════════════════
// MOSAIC Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/mosaic_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "MOSAIC";
export const FULL_NAME = "MOSAIC — institutional trust & relationship velocity";
export const B2C_NAME = "MOSAIC — institutional trust & relationship velocity";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 25;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 8;
export const TIER = "core";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 199;
export const TAGLINE = "JVs, alliances, partnerships, multi-party ecosystems. Institutional trust → relationship velocity.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Institutional Trust",
    question_ids: [
      "Q1",
      "Q2",
      "Q3",
      "Q4",
      "Q5",
      "Q6",
      "Q7",
      "Q8"
    ],
    reverse_coded: [
      "Q7"
    ],
    raw_max: 40,
    n_questions: 8,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/40) x 20"
  },
  {
    id: "D2",
    name: "Relationship Velocity",
    question_ids: [
      "Q9",
      "Q10",
      "Q11",
      "Q12",
      "Q13",
      "Q14"
    ],
    reverse_coded: [
      "Q13"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "Normative Flexibility",
    question_ids: [
      "Q15",
      "Q16",
      "Q17",
      "Q18",
      "Q19",
      "Q20"
    ],
    reverse_coded: [
      "Q19"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "Conflict Resolution",
    question_ids: [
      "Q21",
      "Q22",
      "Q23",
      "Q24",
      "Q25"
    ],
    reverse_coded: [
      "Q24"
    ],
    raw_max: 25,
    n_questions: 5,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/25) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "Cross-Border Leader",
    min: 80,
    max: 100,
    interpretation: "Mature cross-border partnership capability. Can manage institutional complexity, build relationships at speed, and resolve conflicts arising from capability asymmetry."
  },
  {
    band: "Developing Cross-Border Capacity",
    min: 60,
    max: 79.9,
    interpretation: "Moderate cross-border capability with specific dimensions requiring investment. Functional in familiar contexts but may struggle with novel institutional environments."
  },
  {
    band: "Emerging Cross-Border Awareness",
    min: 40,
    max: 59.9,
    interpretation: "Foundational cross-border capability is developing but not yet reliable. Significant risk in high-stakes bilateral partnerships."
  },
  {
    band: "Cross-Border Readiness Gap",
    min: 0,
    max: 39.9,
    interpretation: "Significant gaps across all cross-border dimensions. Bilateral partnership effectiveness is at serious risk."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature cross-border partnership capability"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Emerging cross-border capability with targeted development needs"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant cross-border readiness gap"
  }
];

export const ARCHETYPES: unknown[] = [];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
