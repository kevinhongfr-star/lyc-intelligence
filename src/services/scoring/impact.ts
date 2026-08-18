// ═══════════════════════════════════════════════════════════
// IMPACT Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/impact_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "IMPACT";
export const FULL_NAME = "IMPACT — board & stakeholder impact";
export const B2C_NAME = "IMPACT — board & stakeholder impact";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const TAGLINE = "Board-ready you. Strategic oversight, governance rigour, stakeholder intelligence, mandate legacy.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Strategic Oversight",
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
    name: "Governance Rigour",
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
    name: "Stakeholder Intelligence",
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
    name: "Mandate Legacy",
    question_ids: [
      "Q19",
      "Q20",
      "Q21",
      "Q22",
      "Q23",
      "Q24"
    ],
    reverse_coded: [
      "Q21"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D5",
    name: "Executive Presence & Influence",
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
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 70,
    max: 100,
    band: "High Mandate",
    interpretation: "Strong governance foundation; credible and effective in board role"
  },
  {
    min: 40,
    max: 69,
    band: "Building Mandate",
    interpretation: "Developing capability; some meaningful gaps to address"
  },
  {
    min: 0,
    max: 39,
    band: "Fragile Mandate",
    interpretation: "Significant gaps in board effectiveness; development or honest role assessment required"
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature capability with demonstrated organisational impact"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Emerging capability with targeted development opportunities"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant capability gap requiring immediate attention"
  }
];

// X4-3: ARCHETYPES = person-archetypes only (no matrix axes). See MATRIX_AXES for 2x2 axis definitions.
export const ARCHETYPES = [
  {
    name: "The Strategic Builder",
    "#": "1",
    orientation: "Governance + Strategy dominant",
    mandate_band: "High",
    core_dynamic: "Sets the standards and sees the big picture. The board member every chair wants. Rare combination of governance rigour and strategic intelligence operating at full strength.",
    risk_if_unaddressed: "May become the dominant voice — suppressing other directors' contributions. Board monoculture risk.",
    development_priority: "Board chair succession readiness; sponsoring governance uplift in co-directors",
    apac_modifier_note: "If Executive Presence & Influence <50, Strategic Builder profile may not translate to APAC-native boards — high Western credibility, APAC gap possible"
  },
  {
    name: "The Steward",
    "#": "2",
    orientation: "Governance + Legacy dominant",
    mandate_band: "High",
    core_dynamic: "Protects what has been built while building for the future. The institutional memory keeper. Brings a long-term governance lens that most boards undervalue.",
    risk_if_unaddressed: "May resist necessary change. Over-conservatism can slow board adaptation to market shifts.",
    development_priority: "Innovation mindset development; engaging constructively with market shifts",
    apac_modifier_note: "Strong in Japan and Singapore governance contexts; may have less traction in higher-velocity APAC markets (e.g., SE Asia startups, China state contexts)"
  },
  {
    name: "The Networker",
    "#": "3",
    orientation: "Relationship-dominant",
    mandate_band: "High",
    core_dynamic: "Connects dots across stakeholders, surfaces opportunities, reads the boardroom dynamics with exceptional precision.",
    risk_if_unaddressed: "Governance depth may lag relationship breadth. Substance must match style.",
    development_priority: "Deepening governance rigour; building analytical independence to match stakeholder intelligence",
    apac_modifier_note: "APAC Networkers with government stakeholder relationships are highly valuable — this archetype's Executive Presence & Influence score is the most important modifier"
  },
  {
    name: "The Guardian",
    "#": "4",
    orientation: "Governance-dominant",
    mandate_band: "Building",
    core_dynamic: "Rigorous on process, consistent on fiduciary duties, but not yet contributing at full strategic level. The conscientious director.",
    risk_if_unaddressed: "Strategic contribution remains thin. May be seen as a procedural resource rather than a thought leader.",
    development_priority: "Strategic oversight development; learning to ask questions that reframe management's strategic proposals",
    apac_modifier_note: "Strong governance foundation makes this archetype credible across APAC markets — APAC Credibility gap most likely in market-specific intelligence"
  },
  {
    name: "The Visionary",
    "#": "5",
    orientation: "Strategy-dominant",
    mandate_band: "Building",
    core_dynamic: "Sees the future clearly. Brings genuine strategic intelligence. But governance mechanics are still tightening. Great strategist, developing director.",
    risk_if_unaddressed: "Governance gaps create risk exposure — may inadvertently overstep into executive territory.",
    development_priority: "Governance rigour; maintaining appropriate board/management boundary in strategic discussions",
    apac_modifier_note: "High value in APAC growth markets; may lack credibility with regulatory-facing boards (MAS, CSRC) where governance rigour is scrutinised"
  },
  {
    name: "The Bridge-Builder",
    "#": "6",
    orientation: "Relationship + Legacy dominant",
    mandate_band: "Building",
    core_dynamic: "Builds relationships and thinks long-term. A connector with a genuine commitment to lasting value. Growing governance capability.",
    risk_if_unaddressed: "Strategic oversight depth may be insufficient for complex board mandates.",
    development_priority: "Strategic oversight development; governance formalisation beyond process compliance",
    apac_modifier_note: "Strong APAC stakeholder relationship builder — often effective with APAC-native boards where relational credibility opens governance conversations"
  },
  {
    name: "The Nominee",
    "#": "7",
    orientation: "Any profile",
    mandate_band: "Fragile (any dim ≥50)",
    core_dynamic: "Recently appointed or still developing governance capability. Potential is present — at least one dimension shows credible foundation.",
    risk_if_unaddressed: "Development stalls if not actively supported. Risk of becoming a Passenger if learning support is absent.",
    development_priority: "Structured board director development programme; mentorship pairing with experienced director",
    apac_modifier_note: "APAC-specific governance literacy development is highest priority — Western governance training alone is insufficient for APAC board contexts"
  },
  {
    name: "The Passenger",
    "#": "8",
    orientation: "All dims low",
    mandate_band: "Fragile (all dims <40)",
    core_dynamic: "Attends meetings, votes with the majority, contributes minimally. The board member whose presence does not strengthen the board's collective capability.",
    risk_if_unaddressed: "Continued presence weakens board effectiveness and sets a governance floor that others adapt to.",
    development_priority: "Honest assessment conversation required: targeted development or board exit",
    apac_modifier_note: "Executive Presence & Influence is likely very low — limited value in APAC governance contexts without fundamental capability development"
  }
];

export const MATRIX_AXES = [
  { name: "Axis 1", description: "Impact Orientation: How does the board member primarily create value? (Governance-dominant / Strategy-dominant / Relationship-dominant / Legacy-dominant / Balanced)" },
  { name: "Axis 2", description: "Mandate Strength Band: How credibly do they operate in the governance role? (High / Building / Fragile)" },
];

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
