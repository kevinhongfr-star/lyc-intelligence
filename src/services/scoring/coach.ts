// ═══════════════════════════════════════════════════════════
// COACH Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/coach_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "COACH";
export const FULL_NAME = "Bilateral Coaching Readiness & Leadership Development Architecture";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 24;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 9;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const B2C_NAME = "Bilateral Coaching Readiness";
export const TAGLINE = "Coaching is a bilateral practice, not a top-down one. Do you operate in a developmental system?";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "CROSS-BOUNDARY DEVELOPMENTAL ORIENTATION (CBDO)",
    question_ids: [
      "COACH_Q01",
      "COACH_Q02",
      "COACH_Q03",
      "COACH_Q04",
      "COACH_Q05",
      "COACH_Q06"
    ],
    reverse_coded: [
      "COACH_Q03",
      "COACH_Q05"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I invest as much deliberate effort in developing the capabil...",
      "I view developing my bilateral partner's team as part of my ...",
      "I find it difficult to justify spending development energy o...",
      "When a bilateral counterpart learns at a different pace than...",
      "I find it frustrating when my counterparts are slower to dev...",
      "I can sustain a genuine developmental orientation toward som..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D2",
    name: "ADAPTIVE COACHING STYLE (ACS)",
    question_ids: [
      "COACH_Q07",
      "COACH_Q08",
      "COACH_Q09",
      "COACH_Q10",
      "COACH_Q11",
      "COACH_Q12"
    ],
    reverse_coded: [
      "COACH_Q08",
      "COACH_Q11"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I have more than one coaching approach and I deliberately se...",
      "I tend to use the same coaching approach with most of the pe...",
      "I can describe the specific differences between how I coach ...",
      "I adapt the directness, tone, and structure of my feedback c...",
      "I apply the same standards of directness in developmental fe...",
      "I have received feedback that my coaching approach does not ..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "BILATERAL DEVELOPMENTAL RELATIONSHIP QUALITY (BDRQ)",
    question_ids: [
      "COACH_Q13",
      "COACH_Q14",
      "COACH_Q15",
      "COACH_Q16",
      "COACH_Q17",
      "COACH_Q18"
    ],
    reverse_coded: [
      "COACH_Q14",
      "COACH_Q17"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "I have built developmental relationships with bilateral coun...",
      "I find it takes significantly longer to build the level of t...",
      "I have a specific approach for building developmental trust ...",
      "I can hold bilateral counterparts accountable for commitment...",
      "I tend to be less direct about holding bilateral counterpart...",
      "I have effective strategies for re-engaging a bilateral coun..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "COACHING UNDER BILATERAL CONSTRAINTS (CBC)",
    question_ids: [
      "COACH_Q19",
      "COACH_Q20",
      "COACH_Q21",
      "COACH_Q22",
      "COACH_Q23",
      "COACH_Q24"
    ],
    reverse_coded: [
      "COACH_Q20",
      "COACH_Q23"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "When the bilateral partnership is under significant performa...",
      "Under high pressure, I revert to telling people what to do r...",
      "I can identify the specific conditions under which I am most...",
      "I can coach effectively in situations where it is structural...",
      "I find it difficult to maintain a coaching stance when I am ...",
      "Authority ambiguity in a bilateral context does not material..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "Mature Coaching Leader",
    min: 80,
    max: 100,
    interpretation: "Demonstrates mature bilateral coaching capability across all dimensions. Can develop leadership talent effectively in cross-boundary contexts."
  },
  {
    band: "Developing Coaching Leader",
    min: 60,
    max: 79,
    interpretation: "Solid coaching foundation with specific dimensions requiring investment. Effective in familiar contexts but may struggle under bilateral constraints."
  },
  {
    band: "Emerging Coaching Awareness",
    min: 40,
    max: 59,
    interpretation: "Foundational coaching capability is developing but not yet reliable for bilateral leadership development. Significant risk of talent development gaps."
  },
  {
    band: "Coaching Capability Gap",
    min: 0,
    max: 39,
    interpretation: "Significant gaps across coaching dimensions. Bilateral talent development is at serious risk without targeted intervention."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature bilateral coaching capability"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Emerging coaching capability with development opportunities"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant coaching capability gap"
  }
];

export const ARCHETYPES = [
  {
    name: "The Bilateral Developer",
    profile: "High CBDO + High ACS + High BDRQ",
    description: "Fully developed bilateral coaching capability. Maintains developmental orientation across all contexts, adapts coaching style effectively, and builds deep trust with counterparts.",
    organisational_impact: "Can develop leadership talent in any bilateral context. Creates lasting developmental relationships that outlast specific transactions."
  },
  {
    name: "The Adaptive Coach",
    profile: "High ACS + High CBC",
    description: "Can adapt coaching approach to context and maintain coaching stance under pressure. May not invest as deeply in developmental orientation or relationship building, but effective in volatile contexts.",
    organisational_impact: "Valuable in contexts where coaching approaches must shift rapidly. Provides coaching continuity during organisational disruption."
  },
  {
    name: "The Trust Builder",
    profile: "High BDRQ + High CBDO",
    description: "Builds strong developmental relationships and maintains genuine developmental orientation. May be less adaptive in coaching style and struggle under bilateral constraints.",
    organisational_impact: "Creates deep developmental relationships. Most effective in stable bilateral contexts where trust can develop over time."
  },
  {
    name: "The Pressure-Tested Coach",
    profile: "High CBC only",
    description: "Can maintain coaching stance under pressure but may lack the developmental orientation, adaptive style, or relationship depth for comprehensive bilateral development.",
    organisational_impact: "Reliable under pressure but limited in scope. Needs complementary coaching capabilities in the team."
  },
  {
    name: "The Transactional Developer",
    profile: "Low CBDO + Moderate ACS",
    description: "Applies coaching techniques but views development as discretionary rather than core responsibility. May coach effectively within own team but not across bilateral boundaries.",
    organisational_impact: "Limited bilateral impact. Development investment stops at organisational boundaries. Risk of talent development gaps in partnership contexts."
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
