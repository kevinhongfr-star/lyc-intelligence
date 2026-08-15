export const INSTRUMENT = "DRIVE";
export const FULL_NAME = "DRIVE — motivational alignment";
export const B2C_NAME = "DRIVE — motivational alignment";
export const VERSION = "1.2";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const TAGLINE = "Why you lead — and when you will disengage. Intrinsic × extrinsic × purpose × growth × confidence.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Intrinsic Motivation",
    question_ids: [
      "Q01",
      "Q02",
      "Q03",
      "Q04",
      "Q05",
      "Q06"
    ],
    reverse_coded: [
      "Q03"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Task engagement",
      "Intellectual curiosity",
      "Autonomy drive",
      "Flow state frequency",
      "Craft motivation",
      "APAC intrinsic resonance"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D2",
    name: "Extrinsic Motivation",
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
    sub_dimensions: [
      "Recognition sensitivity",
      "Reward orientation",
      "Recognition scope",
      "Extrinsic independence",
      "Visibility drive",
      "Progression drive"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D3",
    name: "Values Alignment",
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
      "Purpose congruence",
      "Values articulacy",
      "Values conflict",
      "Organisational ethics fit",
      "Mission alignment",
      "Sustained purpose"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D4",
    name: "Confidence & Self-Efficacy",
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
    sub_dimensions: [
      "Role-specific confidence",
      "Challenge orientation",
      "Capability doubt",
      "Pressure confidence",
      "Adaptive self-efficacy",
      "APAC contextual confidence"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
  },
  {
    id: "D5",
    name: "Growth Orientation",
    question_ids: [
      "Q25",
      "Q26",
      "Q27",
      "Q28",
      "Q29",
      "Q30"
    ],
    reverse_coded: [
      "Q27"
    ],
    raw_max: 30,
    n_questions: 6,
    sub_dimensions: [
      "Development vs. mastery",
      "Challenge dependency",
      "Mastery preference",
      "Development seeking",
      "Learning curve preference",
      "APAC growth appetite"
    ],
    normalised_max: 20,
    normalised_formula: "(raw/30) x 20"
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
    interpretation: "Partial alignment; significant gaps between role and motivational profile"
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
    meaning: "Mature motivational profile with sustainable engagement"
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
    meaning: "Significant motivational profile gap requiring intervention"
  }
];

export const ARCHETYPES = [
  {
    name: "Achiever",
    motivation_type: "Extrinsic-dominant",
    state: "Fueled",
    pattern: "High output, target-driven",
    risk: "Wears down when recognition dries up",
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

export const MOTIVATION_TYPE_RULES = {
  threshold: 10,
  description: "Step1: |D1-D2| >= threshold → Intrinsic or Extrinsic dominant. < threshold → Dual-drive. Step2: If D3 > D1 and D2 → Purpose-driven. If D5 > D1 and D2 → Growth-driven. Step3: Drifter flag if no clear dominant."
};

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
