// ═══════════════════════════════════════════════════════════
// QUEST Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/quest_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "QUEST";
export const FULL_NAME = "QUEST — strategic market positioning";
export const B2C_NAME = "QUEST — strategic market positioning";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 199;
export const TAGLINE = "Six-executive-dimension model. Where are you genuinely strong, and where will your next mandate expose gaps?";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Strategic Thinking",
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
    sub_dimensions: [
      "Direction articulation",
      "Pattern recognition",
      "Multi-horizon thinking",
      "Strategic linkage",
      "Assumption management",
      "Strategic translation"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D2",
    name: "Execution Excellence",
    question_ids: [
      "Q07",
      "Q08",
      "Q09",
      "Q10",
      "Q11",
      "Q12"
    ],
    reverse_coded: [
      "Q09"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Organisational design for delivery",
      "Strategy-to-results conversion",
      "Execution consistency",
      "Performance visibility",
      "Accountability structure",
      "Resource discipline"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "Commercial Acumen",
    question_ids: [
      "Q13",
      "Q14",
      "Q15",
      "Q16",
      "Q17",
      "Q18"
    ],
    reverse_coded: [
      "Q15"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Value creation understanding",
      "Financial literacy",
      "Commercial confidence",
      "APAC commercial intelligence",
      "Commercial judgment under uncertainty",
      "Market intelligence application"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "People Leadership",
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
    sub_dimensions: [
      "Team structure",
      "Succession development",
      "Team independence",
      "Dependency risk",
      "Individualised development",
      "High-stakes people decisions"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D5",
    name: "Adaptive Capacity",
    question_ids: [
      "Q25",
      "Q26",
      "Q27",
      "Q28",
      "Q29",
      "Q30"
    ],
    reverse_coded: [
      "Q27",
      "Q29"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Environmental scanning & response",
      "Pivot capability",
      "Ambiguity tolerance",
      "APAC change leadership",
      "Change resistance",
      "Adaptive track record"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D6",
    name: "AI Readiness",
    question_ids: [
      "Q31",
      "Q32",
      "Q33",
      "Q34",
      "Q35",
      "Q36"
    ],
    reverse_coded: [
      "Q33"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Decision Structure Readiness",
      "Data Governance Awareness",
      "AI Ethics & Risk Oversight",
      "Organisational AI Adoption Leadership"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 80,
    max: 100,
    band: "Executive Ready",
    interpretation: "Strong capability across all six dimensions; operating at senior executive level"
  },
  {
    min: 60,
    max: 79,
    band: "Near-Ready",
    interpretation: "1–2 capability gaps to address; strong foundation with targeted development needed"
  },
  {
    min: 40,
    max: 59,
    band: "Capability Building",
    interpretation: "Substantive development needed in 2–3 dimensions; structured programme recommended"
  },
  {
    min: 20,
    max: 39,
    band: "Early Executive",
    interpretation: "In transition to executive level; not yet operating at full capability"
  },
  {
    min: 0,
    max: 19,
    band: "Pre-Executive",
    interpretation: "Fundamental capability gaps; foundational development required"
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 15,
    max: 20,
    verdict: "Strength",
    meaning: "Deployable capability; executive operates at this level consistently and under pressure"
  },
  {
    dim: "all",
    min: 10,
    max: 14.9,
    verdict: "Developing",
    meaning: "Functional in stable conditions; gaps emerge under pressure or in unfamiliar APAC contexts"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Underdeveloped for the executive's current or target role; primary development priority"
  }
];

export const ARCHETYPES = [
  {
    name: "The Architect",
    "#": "1",
    profile: "High Strategic Thinking + High Adaptive Capacity, Advanced band",
    core_strength: "Designs robust systems and can pivot them when context changes. Rare combination at senior executive level.",
    key_risk: "Over-engineering; perfectionism slowing delivery; may underinvest in commercial urgency",
    development_priority: "Delegation discipline; \"good enough\" threshold setting; commercial acumen deepening"
  },
  {
    name: "The Catalyst",
    "#": "2",
    profile: "High Commercial Acumen + High Adaptive Capacity, Advanced band",
    core_strength: "Thrives in complexity and market shifts; spots commercial opportunities others miss; acts fast",
    key_risk: "Impatience with process and governance; may drain teams; can deprioritise people development",
    development_priority: "Sustainability mindset; team development investment; governance discipline"
  },
  {
    name: "The Diplomat",
    "#": "3",
    profile: "High People Leadership + High Strategic Thinking, Advanced band",
    core_strength: "Builds coalitions, manages stakeholder dynamics, aligns diverse groups around complex strategy",
    key_risk: "May prioritise harmony over hard decisions; can be slow to confront underperformance",
    development_priority: "Decisiveness under pressure; constructive confrontation capability; execution rigour"
  },
  {
    name: "The Commander",
    "#": "4",
    profile: "High Execution Excellence + High Commercial Acumen, Advanced band",
    core_strength: "Delivers results through commercial discipline and operational rigour; highly credible in P&L conversations",
    key_risk: "May neglect people development for short-term results; can be directive at the expense of team capability-building",
    development_priority: "People leadership investment; long-term talent pipeline thinking; adaptive capacity"
  },
  {
    name: "The Steward",
    "#": "5",
    profile: "High Adaptive Capacity + High People Leadership, Developing band",
    core_strength: "Guides teams through change with empathy and consistency; preserves team cohesion in uncertainty",
    key_risk: "May lack strategic direction or commercial edge; change leadership without destination clarity",
    development_priority: "Strategic thinking sharpness; commercial acumen; decision conviction"
  },
  {
    name: "The Strategist",
    "#": "6",
    profile: "High Strategic Thinking, Developing band",
    core_strength: "Sees the big picture clearly; excellent at analysis and direction-setting",
    key_risk: "Execution gaps — vision without delivery mechanism; may rely on others for follow-through",
    development_priority: "Execution Excellence; team mobilisation; accountability structure"
  },
  {
    name: "The Engine",
    "#": "7",
    profile: "High Execution Excellence, Developing band",
    core_strength: "Reliable delivery machine; consistent output; operationally credible",
    key_risk: "May be executing the wrong strategy; tends to optimise the current path rather than question it",
    development_priority: "Strategic thinking; commercial awareness; adaptive capacity"
  },
  {
    name: "The Entrepreneur",
    "#": "8",
    profile: "High Commercial Acumen + High Adaptive Capacity, Developing band",
    core_strength: "Bold commercial moves; market-savvy; pivots fast when opportunity shifts",
    key_risk: "May lack organisational buy-in or people development capability; governance gaps",
    development_priority: "People leadership; execution discipline; stakeholder management"
  },
  {
    name: "The Specialist",
    "#": "9",
    profile: "One dimension dominant (>15 pts above all others), any band",
    core_strength: "Deep expertise in one executive capability domain; highly valued for that specific strength",
    key_risk: "Over-reliance on single strength; may have blind spots in 2–3 other dimensions that limit seniority ceiling",
    development_priority: "Broadening capability across secondary dimensions; delegation of dominant strength to create capacity"
  },
  {
    name: "The Seedling",
    "#": "10",
    profile: "Multiple low dimensions, Emerging band (avg <50)",
    core_strength: "High development potential; early in the executive capability journey; typically high motivation",
    key_risk: "Overwhelm; pursuing development in too many areas simultaneously; wrong sequencing of priorities",
    development_priority: "Focus on 1–2 highest-impact dimensions only; structured mentoring; SHIFT-QUEST programme indicated"
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
