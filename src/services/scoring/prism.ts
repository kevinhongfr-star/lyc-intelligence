// ═══════════════════════════════════════════════════════════
// PRISM Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/prism_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "PRISM";
export const FULL_NAME = "Professional Brand Legibility";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;
export const TIER = "advisory";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 99;
export const B2C_NAME = "Professional Brand Legibility";
export const TAGLINE = "How legible, differentiated and visible are you to the market that should be hiring you?";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Brand Clarity",
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
    name: "Market Legibility",
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
    name: "Identity Consistency",
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
    name: "Narrative Power",
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
    name: "Visibility Level",
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
    min: 80,
    max: 100,
    band: "Market Leader",
    interpretation: "Clear, consistent, legible brand across all 5 dimensions"
  },
  {
    min: 60,
    max: 79,
    band: "Market Visible",
    interpretation: "Strong in most dimensions; 1–2 specific development areas"
  },
  {
    min: 40,
    max: 59,
    band: "Market Present",
    interpretation: "Brand exists but is not differentiated or consistently legible"
  },
  {
    min: 20,
    max: 39,
    band: "Market Emerging",
    interpretation: "Foundation work needed before visibility investment makes sense"
  },
  {
    min: 0,
    max: 19,
    band: "Market Invisible",
    interpretation: "Urgent brand construction or reconstruction required"
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

export const ARCHETYPES = [
  {
    name: "The Authority",
    "#": "1",
    foundation: "Strong",
    visibility: "High",
    core_dynamic: "Clear brand, consistent identity, widely recognised. The gold standard — a leader whose brand works for them in rooms they're not in.",
    risk_if_unaddressed: "Staleness risk: the brand that worked for the last decade may not work for the next one.",
    development_priority: "Deliberate brand evolution; staying ahead of the market rather than managing legacy",
    apac_note: "The Authority is rare in APAC cross-border contexts — often these leaders have strong home-market authority with APAC legibility gaps"
  },
  {
    name: "The Signal",
    "#": "2",
    foundation: "Strong",
    visibility: "Medium",
    core_dynamic: "Clear about who they are, consistent in how they show up — but not visible enough in the markets that matter. The hidden gem.",
    risk_if_unaddressed: "Will keep being passed over for opportunities their capability deserves. The market can't find them.",
    development_priority: "Visibility activation: thought leadership, search firm engagement, board network investment",
    apac_note: "Very common APAC profile — deep capability, strong internal brand, low external market presence"
  },
  {
    name: "The Monument",
    "#": "3",
    foundation: "Strong",
    visibility: "Low",
    core_dynamic: "Solid, well-defined brand. But visibility is very low — known only to immediate network. Either deliberately private or visibility has not kept pace with career development.",
    risk_if_unaddressed: "Opportunities are passing them by in silence. No one is advocating for them in rooms they're not in.",
    development_priority: "Strategic visibility building; thought leadership publication; search firm relationship investment",
    apac_note: "Common in senior APAC executives post-China mandate or post-SOE career — credibility is real, market presence is near-zero"
  },
  {
    name: "The Chameleon",
    "#": "4",
    foundation: "Weak",
    visibility: "High",
    core_dynamic: "Adapts to every audience, highly visible — but no consistent centre. Seen everywhere, known by no one. Visibility outpaces substance.",
    risk_if_unaddressed: "Brand exhaustion: maintaining different versions for different audiences is unsustainable. Over time, the lack of a centre becomes visible.",
    development_priority: "Identity consolidation; brand clarity work; finding and anchoring the authentic centre",
    apac_note: "High APAC risk: relationship-rich market means the Chameleon's inconsistency gets noticed faster in APAC networks"
  },
  {
    name: "The Amplifier",
    "#": "5",
    foundation: "Developing",
    visibility: "High",
    core_dynamic: "Moderate foundation but strong visibility. Often building personal brand before the internal brand foundation is ready. Narrative Power is outrunning Brand Clarity.",
    risk_if_unaddressed: "Imposter syndrome dynamics; gets attention but can't fully deliver on the brand promise.",
    development_priority: "Deepen brand foundation; ensure authenticity alignment between narrative and substance",
    apac_note: "APAC specific: Amplifiers who have strong narrative without APAC-specific substance get read quickly by experienced APAC stakeholders"
  },
  {
    name: "The Operator",
    "#": "6",
    foundation: "Developing",
    visibility: "Medium",
    core_dynamic: "Functional professional brand. Gets the job done, respected in their network — but not differentiated. One of many rather than the one.",
    risk_if_unaddressed: "Commoditised. Subject to substitution. Will be overlooked for the roles that require a distinctive contribution.",
    development_priority: "Sharpen positioning; find and develop the distinctive angle; differentiation work",
    apac_note: "Very common mid-career APAC profile — solid, respected, invisible above a certain level"
  },
  {
    name: "The Ghost",
    "#": "7",
    foundation: "Developing",
    visibility: "Low",
    core_dynamic: "Has the foundation of a brand — some clarity, some track record — but is almost completely invisible in the market. The capable executive who disappeared.",
    risk_if_unaddressed: "Irrelevance by default. Network atrophies. Opportunities stop arriving.",
    development_priority: "Visibility strategy; narrative development; re-entry into professional communities",
    apac_note: "Frequent post-APAC-posting profile — spent years in market, network is local, home market visibility has collapsed"
  },
  {
    name: "The Mask",
    "#": "8",
    foundation: "Weak",
    visibility: "Medium",
    core_dynamic: "Presents a manufactured or constructed brand that doesn't match internal reality. Knows how to show up but isn't sure who they actually are professionally. Exhausting to maintain.",
    risk_if_unaddressed: "The Mask eventually slips — in high-stakes interviews, board conversations, or sustained relationships.",
    development_priority: "Authentic brand discovery; identity work; finding the real professional centre beneath the presentation",
    apac_note: "APAC executive networks are tight — the Mask's manufactured brand is particularly vulnerable in relationship-first contexts"
  },
  {
    name: "The Static",
    "#": "9",
    foundation: "Weak",
    visibility: "Low-Medium",
    core_dynamic: "No clear brand, no evident evolution, no compelling story. Stuck in a version of themselves that no longer fits the roles they want. Not absent from the market — just not signalling anything.",
    risk_if_unaddressed: "Career plateau becomes permanent. Opportunities stop arriving not because they've left the market but because the market has moved past them.",
    development_priority: "Brand reinvention; career narrative rebuild; identifying what the next chapter is actually about"
  },
  {
    name: "The Blank Page",
    "#": "10",
    foundation: "Weak",
    visibility: "Low",
    core_dynamic: "Starting from scratch or in complete brand crisis. Either very early in executive career development or post-crisis rebuild after exit, board failure, or mandate collapse.",
    risk_if_unaddressed: "Without active construction, the blank page gets filled in by others — and rarely in the way the executive would choose.",
    development_priority: "Full brand construction from foundation up: identity, narrative, visibility, in that sequence",
    apac_note: "Post-exit APAC executives (particularly China or complex-market exits) are at high Blank Page risk if the narrative isn't managed"
  },
  {
    name: "Axis 1",
    description: "Brand Authenticity (Foundation): How strong and consistent is the internal brand foundation? (Strong / Developing / Weak)"
  },
  {
    name: "Axis 2",
    description: "Market Visibility: How readable and present is the executive to external audiences? (High / Medium / Low)"
  }
];


export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
