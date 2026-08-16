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

export const ARCHETYPES = [
  {
    id: "A1",
    name: "The Institutional Strategist",
    strength_dimensions: ["Institutional Trust", "Relationship Velocity"],
    core_pattern: "Reads institutional environments deeply while building relationships at speed. Most effective cross-border partner type.",
    strengths: [
      "Understands institutional trust dynamics in depth",
      "Builds working trust rapidly in new contexts",
      "Activates partnerships quickly in new markets"
    ],
    growth_areas: [
      "May underinvest in normative flexibility — reading unstated expectations",
      "Conflict resolution may rely more on relationship capital than structural diagnosis",
      "Risk of overconfidence in familiar institutional contexts"
    ],
    development_focus: "Deepen normative flexibility for contexts with different unstated rules; build diagnostic conflict resolution capability beyond relationship-based resolution.",
    organisational_impact: "Reduces time-to-value in new market entries and new partnership formations."
  },
  {
    id: "A2",
    name: "The Deep Connector",
    strength_dimensions: ["Relationship Velocity", "Normative Flexibility"],
    core_pattern: "Builds trust quickly and adapts seamlessly to different normative environments. Strong at maintaining partnership quality across disruptions.",
    strengths: [
      "Establishes trust rapidly across contexts",
      "Reads and adapts to unstated normative expectations",
      "Maintains relationship quality during institutional disruptions"
    ],
    growth_areas: [
      "May underestimate institutional trust and governance complexity",
      "Conflict resolution may prioritise harmony over structural resolution",
      "Risk of relationship depth without institutional rigour"
    ],
    development_focus: "Build institutional trust analysis capability; develop structural conflict diagnosis alongside relational resolution.",
    organisational_impact: "Maintains partnership continuity during disruptions. Critical for relationship-dependent revenue streams."
  },
  {
    id: "A3",
    name: "The Normative Bridge",
    strength_dimensions: ["Normative Flexibility", "Conflict Resolution"],
    core_pattern: "Reads unstated expectations across cultures and resolves conflicts arising from normative misalignment. Critical in APAC partnership contexts.",
    strengths: [
      "Accurately reads unstated normative expectations",
      "Resolves conflicts by addressing normative misalignment root causes",
      "Prevents friction from escalating into structural conflict"
    ],
    growth_areas: [
      "May lack deep institutional trust analysis",
      "Relationship velocity may be slower — prioritises quality over speed",
      "Risk of over-accommodating normative differences"
    ],
    development_focus: "Build institutional trust and governance analysis capability; develop faster relationship establishment methods without sacrificing depth.",
    organisational_impact: "Prevents partnership friction from escalating into costly structural conflicts."
  },
  {
    id: "A4",
    name: "The Capability Broker",
    strength_dimensions: ["Institutional Trust", "Conflict Resolution"],
    core_pattern: "Understands institutional dynamics deeply and resolves capability asymmetry conflicts effectively. Operates at the governance level of partnerships.",
    strengths: [
      "Deep institutional trust and governance analysis",
      "Addresses root causes of partnership friction rather than symptoms",
      "Diagnoses capability asymmetry conflicts accurately"
    ],
    growth_areas: [
      "Relationship velocity may be slower — analytical rather than relational",
      "Normative flexibility may be underdeveloped — relies on structural analysis",
      "Risk of analysing more than connecting"
    ],
    development_focus: "Build relationship velocity and active network maintenance; develop normative flexibility alongside structural analysis.",
    organisational_impact: "Addresses root causes of partnership friction; builds sustainable bilateral governance structures."
  },
  {
    id: "A5",
    name: "The Relationship Specialist",
    strength_dimensions: ["Relationship Velocity only"],
    core_pattern: "Builds trust quickly but may lack the institutional or normative depth for complex environments. Strong in stable contexts, vulnerable in volatile ones.",
    strengths: [
      "Rapid trust establishment",
      "Active cross-border network maintenance",
      "Strong in familiar partnership contexts"
    ],
    growth_areas: [
      "Institutional trust analysis is underdeveloped",
      "Normative flexibility may be shallow — adapts style but not understanding",
      "Conflict resolution relies on relationship capital rather than diagnosis"
    ],
    development_focus: "Build institutional trust and governance understanding; develop diagnostic conflict resolution capability; deepen normative flexibility.",
    organisational_impact: "Effective in familiar partnership contexts. Needs institutional support when operating in novel or rapidly changing environments."
  },
  {
    id: "A6",
    name: "The Institutional Analyst",
    strength_dimensions: ["Institutional Trust only"],
    core_pattern: "Deep understanding of institutional dynamics but slower to build relationships or adapt normatively. More analyst than operator.",
    strengths: [
      "Deep institutional trust and governance analysis",
      "Strong risk assessment of institutional trust degradation",
      "Valuable for partnership design and structure"
    ],
    growth_areas: [
      "Relationship velocity is slower — needs more time to establish trust",
      "Normative flexibility may be underdeveloped — relies on structural understanding",
      "Conflict resolution may be analytical rather than relational"
    ],
    development_focus: "Build relationship velocity and active trust-building capability; develop normative flexibility for contexts where rules are unstated.",
    organisational_impact: "Valuable for partnership design and governance structure. Needs relationship-capable partners to execute."
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
