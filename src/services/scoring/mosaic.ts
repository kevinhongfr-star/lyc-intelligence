// ═══════════════════════════════════════════════════════════
// MOSAIC Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/mosaic_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "MOSAIC";
export const FULL_NAME = "Cross-Border Partnership Intelligence & Institutional Navigation";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 25;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 9;
export const TIER = "advisory";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 99;
export const B2C_NAME = "Cross-Border Partnership Intelligence & Institutional Navigation";
export const TAGLINE = "JVs, alliances, partnerships, multi-party ecosystems. Institutional trust \u2192 relationship velocity.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "INSTITUTIONAL TRUST",
    question_ids: [
      "MOSAIC_Q1",
      "MOSAIC_Q2",
      "MOSAIC_Q3",
      "MOSAIC_Q4",
      "MOSAIC_Q5",
      "MOSAIC_Q6",
      "MOSAIC_Q7",
      "MOSAIC_Q8"
    ],
    reverse_coded: [
      "MOSAIC_Q7"
    ],
    raw_max: 40,
    n_questions: 8,
    sub_dimensions: [
      "When working with a partner organisation that operates under...",
      "In partnerships where the legal enforceability of agreements...",
      "I have a clear understanding of which aspects of my current ...",
      "I actively review my cross-border partnership structures for...",
      "When AI adoption rates differ significantly between my organ...",
      "I have modified how I document cross-border decisions since ...",
      "I rely primarily on formal contractual frameworks to provide...",
      "I can describe specifically how the bilateral institutional ..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/40) x 20"
  },
  {
    id: "D2",
    name: "RELATIONSHIP VELOCITY",
    question_ids: [
      "MOSAIC_Q9",
      "MOSAIC_Q10",
      "MOSAIC_Q11",
      "MOSAIC_Q12",
      "MOSAIC_Q13",
      "MOSAIC_Q14",
      "MOSAIC_Q15"
    ],
    reverse_coded: [
      "MOSAIC_Q13"
    ],
    raw_max: 35,
    n_questions: 7,
    sub_dimensions: [
      "I can establish sufficient working trust with a new cross-bo...",
      "I have adapted my relationship-building approach to account ...",
      "I maintain a current network of cross-border relationships t...",
      "When AI has changed the nature of what a counterpart organis...",
      "I prefer to establish a relationship over an extended period...",
      "I have a deliberate process for maintaining relationship qua...",
      "When a cross-border relationship requires rebuilding after a..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/35) x 20"
  },
  {
    id: "D3",
    name: "NORMATIVE FLEXIBILITY",
    question_ids: [
      "MOSAIC_Q16",
      "MOSAIC_Q17",
      "MOSAIC_Q18",
      "MOSAIC_Q19",
      "MOSAIC_Q20"
    ],
    reverse_coded: [
      "MOSAIC_Q19"
    ],
    raw_max: 25,
    n_questions: 5,
    sub_dimensions: [
      "I can identify, without prompting, the normative expectation...",
      "I have changed how I present my own capabilities and role to...",
      "I am comfortable making decisions that meet the normative ex...",
      "I find it difficult to operate effectively when I am uncerta...",
      "When an AI capability change has altered what is considered ..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/25) x 20"
  },
  {
    id: "D4",
    name: "CONFLICT RESOLUTION",
    question_ids: [
      "MOSAIC_Q21",
      "MOSAIC_Q22",
      "MOSAIC_Q23",
      "MOSAIC_Q24",
      "MOSAIC_Q25"
    ],
    reverse_coded: [
      "MOSAIC_Q24"
    ],
    raw_max: 25,
    n_questions: 5,
    sub_dimensions: [
      "When conflict arises in a cross-border partnership, I active...",
      "I have resolved a partnership conflict by naming and address...",
      "I can distinguish between conflict that is caused by interpe...",
      "When a cross-border partnership conflict becomes difficult t...",
      "I have modified my approach to conflict resolution in cross-..."
    ],
    normalised_max: 20,
    normalised_formula: "(raw/25) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    band: "Cross-Border Leader",
    min: 80,
    max: 100.1,
    interpretation: "Mature cross-border partnership capability. Can navigate institutional complexity, build relationships at speed, and resolve conflicts arising from capability asymmetry."
  },
  {
    band: "Developing Cross-Border Capacity",
    min: 60,
    max: 80,
    interpretation: "Moderate cross-border capability with specific dimensions requiring investment. Functional in familiar contexts but may struggle with novel institutional environments."
  },
  {
    band: "Emerging Cross-Border Awareness",
    min: 40,
    max: 60,
    interpretation: "Foundational cross-border capability is developing but not yet reliable. Significant risk in high-stakes bilateral partnerships."
  },
  {
    band: "Cross-Border Readiness Gap",
    min: 0,
    max: 40,
    interpretation: "Significant gaps across all cross-border dimensions. Bilateral partnership effectiveness is at serious risk."
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature cross-border partnership navigation capability"
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
    meaning: "Significant cross-border navigation gap"
  }
];

export const ARCHETYPES = [
  {
    name: "The Institutional Navigator",
    profile: "High Institutional Trust + High Relationship Velocity",
    description: "Excels at reading and navigating institutional environments while building relationships at speed. The most effective cross-border partner type.",
    organisational_impact: "Can activate bilateral partnerships rapidly in new or changing institutional contexts. Reduces time-to-value in new market entries."
  },
  {
    name: "The Deep Connector",
    profile: "High Relationship Velocity + High Normative Flexibility",
    description: "Builds trust quickly and adapts seamlessly to different normative environments. Strong at maintaining partnership quality across disruptions.",
    organisational_impact: "Maintains partnership continuity during institutional disruptions. Key person for relationship-dependent revenue streams."
  },
  {
    name: "The Normative Bridge",
    profile: "High Normative Flexibility + High Conflict Resolution",
    description: "Can read and navigate unstated expectations across cultures, and resolves conflicts arising from normative misalignment. Critical in APAC contexts.",
    organisational_impact: "Prevents partnership friction from escalating into structural conflict. Reduces costly partnership breakdowns."
  },
  {
    name: "The Capability Broker",
    profile: "High Institutional Trust + High Conflict Resolution",
    description: "Understands institutional dynamics deeply and resolves capability asymmetry conflicts effectively. Operates at the governance level of partnerships.",
    organisational_impact: "Addresses root causes of partnership friction rather than symptoms. Builds sustainable bilateral architectures."
  },
  {
    name: "The Relationship Specialist",
    profile: "High Relationship Velocity only",
    description: "Builds trust quickly but may lack the institutional or normative depth for complex environments. Strong in stable contexts, vulnerable in volatile ones.",
    organisational_impact: "Effective in familiar partnership contexts. Needs institutional support when operating in novel or rapidly changing environments."
  },
  {
    name: "The Institutional Analyst",
    profile: "High Institutional Trust only",
    description: "Deep understanding of institutional dynamics but slower to build relationships or adapt to normative differences. More analyst than operator.",
    organisational_impact: "Valuable for partnership design and governance architecture. Needs relationship-capable partners to execute."
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
