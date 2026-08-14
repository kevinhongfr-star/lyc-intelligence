// ═══════════════════════════════════════════════════════════
// DRIVE Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/drive_v2_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "DRIVE";
export const FULL_NAME = "Motivation Architecture & Engagement Risk Assessment";
export const VERSION = "2.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 14;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const B2C_NAME = "Motivation Architecture & Engagement Risk";
export const TAGLINE = "Why you lead \u2014 and when you will disengage. Intrinsic \u00d7 extrinsic \u00d7 purpose \u00d7 growth \u00d7 confidence.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Intrinsic Motivation",
    question_ids: [
      "DRIVE_Q01",
      "DRIVE_Q02",
      "DRIVE_Q03",
      "DRIVE_Q04",
      "DRIVE_Q05",
      "DRIVE_Q06"
    ],
    reverse_coded: [
      "DRIVE_Q03"
    ],
    raw_max: 30,
    sub_dimensions: [
      "Task engagement",
      "Intellectual curiosity",
      "Autonomy drive",
      "Flow state frequency",
      "Craft motivation",
      "APAC intrinsic resonance"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20",
    n_questions: 6
  },
  {
    id: "D2",
    name: "Extrinsic Motivation",
    question_ids: [
      "DRIVE_Q07",
      "DRIVE_Q08",
      "DRIVE_Q09",
      "DRIVE_Q10",
      "DRIVE_Q11",
      "DRIVE_Q12"
    ],
    reverse_coded: [
      "DRIVE_Q10"
    ],
    raw_max: 30,
    sub_dimensions: [
      "Recognition sensitivity",
      "Reward orientation",
      "Recognition scope",
      "Extrinsic independence",
      "Visibility drive",
      "Progression drive"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20",
    n_questions: 6
  },
  {
    id: "D3",
    name: "Values Alignment",
    question_ids: [
      "DRIVE_Q13",
      "DRIVE_Q14",
      "DRIVE_Q15",
      "DRIVE_Q16",
      "DRIVE_Q17",
      "DRIVE_Q18"
    ],
    reverse_coded: [
      "DRIVE_Q15"
    ],
    raw_max: 30,
    sub_dimensions: [
      "Purpose congruence",
      "Values articulacy",
      "Values conflict",
      "Organisational ethics fit",
      "Mission alignment",
      "Sustained purpose"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20",
    n_questions: 6
  },
  {
    id: "D4",
    name: "Confidence & Self-Efficacy",
    question_ids: [
      "DRIVE_Q19",
      "DRIVE_Q20",
      "DRIVE_Q21",
      "DRIVE_Q22",
      "DRIVE_Q23",
      "DRIVE_Q24"
    ],
    reverse_coded: [
      "DRIVE_Q21"
    ],
    raw_max: 30,
    sub_dimensions: [
      "Role-specific confidence",
      "Challenge orientation",
      "Capability doubt",
      "Pressure confidence",
      "Adaptive self-efficacy",
      "APAC contextual confidence"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20",
    n_questions: 6
  },
  {
    id: "D5",
    name: "Growth Orientation",
    question_ids: [
      "DRIVE_Q25",
      "DRIVE_Q26",
      "DRIVE_Q27",
      "DRIVE_Q28",
      "DRIVE_Q29",
      "DRIVE_Q30"
    ],
    reverse_coded: [
      "DRIVE_Q27"
    ],
    raw_max: 30,
    sub_dimensions: [
      "Development vs. mastery",
      "Challenge dependency",
      "Mastery preference",
      "Development seeking",
      "Learning curve preference",
      "APAC growth appetite"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20",
    n_questions: 6
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 80,
    max: 100,
    band: "High Drive",
    interpretation: "Strong motivation across multiple dimensions; highly engaged and directed"
  },
  {
    min: 60,
    max: 79,
    band: "Active Drive",
    interpretation: "Generally energised; 1-2 motivation dimensions with meaningful gaps"
  },
  {
    min: 40,
    max: 59,
    band: "Moderate Drive",
    interpretation: "Partial alignment; significant gaps between role and motivational architecture"
  },
  {
    min: 20,
    max: 39,
    band: "Low Drive",
    interpretation: "Substantial misalignment; disengagement risk is material"
  },
  {
    min: 0,
    max: 19,
    band: "Disengaged",
    interpretation: "Motivational breakdown; urgent career review and role redesign required"
  }
];

export const DIMENSION_VERDICTS = [
  {
    dim: "all",
    min: 16,
    max: 20,
    verdict: "Strong",
    meaning: "Mature motivation architecture with sustainable engagement"
  },
  {
    dim: "all",
    min: 10,
    max: 15.9,
    verdict: "Developing",
    meaning: "Moderate motivation with identifiable risk factors"
  },
  {
    dim: "all",
    min: 0,
    max: 9.9,
    verdict: "Gap",
    meaning: "Significant motivation architecture gap requiring intervention"
  }
];

export const ARCHETYPES = [
  {
    name: "Achiever",
    motivation_type: "Extrinsic-dominant",
    state: "Fueled",
    pattern: "High output, target-driven",
    risk: "Burns out when recognition dries up",
    profile: "High Intrinsic Motivation + High Growth Orientation + High Confidence"
  },
  {
    name: "Craftsman",
    motivation_type: "Intrinsic-dominant",
    state: "Fueled",
    pattern: "Motivated by excellence of the work",
    risk: "Demotivated by bureaucracy and mediocrity",
    profile: "High Intrinsic Motivation + High Values Alignment"
  },
  {
    name: "Champion",
    motivation_type: "Relational-dominant",
    state: "Fueled",
    pattern: "Energised by building team capability",
    risk: "Loses motivation when team is removed",
    profile: "High Extrinsic Motivation + High Confidence + High Growth Orientation"
  },
  {
    name: "Explorer",
    motivation_type: "Intrinsic-dominant",
    state: "Fueled",
    pattern: "Driven by new challenges and contexts",
    risk: "Disengages in stable, routine mandates",
    profile: "High Growth Orientation + Moderate Intrinsic Motivation"
  },
  {
    name: "Stalwart",
    motivation_type: "Purpose-driven",
    state: "Fueled",
    pattern: "Long-term institutional loyalty",
    risk: "Rigid in changing contexts",
    profile: "High Values Alignment + High Intrinsic Motivation + Low Growth Orientation"
  },
  {
    name: "Restless",
    motivation_type: "Growth-driven",
    state: "Flickering",
    pattern: "High capability, underplaced",
    risk: "Exits if mandate does not expand",
    profile: "High Extrinsic Motivation + Low Values Alignment + High Growth Orientation"
  },
  {
    name: "Golden Handcuffs",
    motivation_type: "Extrinsic-dominant",
    state: "Flickering",
    pattern: "Staying for rewards, not the work",
    risk: "Explore what would need to change to re-engage",
    profile: "High Extrinsic Motivation + Low Intrinsic Motivation + High Values Alignment"
  },
  {
    name: "Drifter",
    motivation_type: "No clear dominant",
    state: "Flickering",
    pattern: "No dominant motivation source",
    risk: "Mandates feel arbitrary",
    profile: "Low Intrinsic Motivation + Low Values Alignment + Low Growth Orientation"
  },
  {
    name: "Burned-Out",
    motivation_type: "Depleted",
    state: "Fading",
    pattern: "Motivation structurally exhausted",
    risk: "Immediate safety assessment required",
    profile: "Low Intrinsic Motivation + Low Confidence + Low Growth Orientation"
  },
  {
    name: "Frozen Asset",
    motivation_type: "Blocked",
    state: "Fading",
    pattern: "High capability, structural paralysis",
    risk: "Organisational or mandate design intervention",
    profile: "High Values Alignment + Low Growth Orientation + Low Confidence"
  }
];

export const CORE_QUESTIONS = 30;
export const ENGAGEMENT_RISK_QUESTIONS = 6;
export const SHIFT_WEIGHT = 0.15;
export const ENGAGEMENT_RISK = {
  id: "ER",
  name: "Engagement Risk Sub-Score",
  question_ids: [
    "DRIVE_Q31",
    "DRIVE_Q32",
    "DRIVE_Q33",
    "DRIVE_Q34",
    "DRIVE_Q35",
    "DRIVE_Q36"
  ],
  reverse_coded: [
    "DRIVE_Q34"
  ],
  raw_max: 30,
  states: [
    {
      min: 0,
      max: 30,
      label: "Low Risk",
      state: "Fueled"
    },
    {
      min: 31,
      max: 60,
      label: "Moderate Risk",
      state: "Flickering"
    },
    {
      min: 61,
      max: 100,
      label: "High Risk",
      state: "Fading"
    }
  ]
};
export const MOTIVATION_TYPE_RULES = {
  threshold: 10,
  description: "Step1: |D1-D2| >= threshold → Intrinsic or Extrinsic dominant. < threshold → Dual-drive. Step2: If D3 > D1 and D2 → Purpose-driven. If D5 > D1 and D2 → Growth-driven. Step3: Drifter flag if no clear dominant."
};

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
