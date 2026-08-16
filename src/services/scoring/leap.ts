// ═══════════════════════════════════════════════════════════
// LEAP Scoring Config
// Source of truth: akira_source/diagnostic_portfolio/06_scoring_engine_code/leap2_config.json
// ═══════════════════════════════════════════════════════════

export const INSTRUMENT = "LEAP";
export const FULL_NAME = "LEAP — competitive positioning";
export const B2C_NAME = "LEAP — competitive positioning";
export const VERSION = "2.1";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;
export const TIER = "shift";
export const SCORING_MODE = "matrix";
export const PRICE_MILES = 149;
export const TAGLINE = "Five competitive positioning dimensions. Market × Capability × Timing × Risk × Impact.";

export const DIMENSIONS = [
  {
    id: "D1",
    name: "Market",
    weight: 0.25,
    items: [
      {
        id: "LEAP_CR01",
        text: "I can clearly articulate what makes me different from others in my field."
      },
      {
        id: "LEAP_CR02",
        text: "Others in my industry associate me with a specific expertise or value."
      },
      {
        id: "LEAP_CR03",
        text: "My professional brand is consistent across all channels and interactions."
      }
    ],
    reverse_coded: [],
    sub_dimensions: [],
    normalised_max: 20
  },
  {
    id: "D2",
    name: "Capability",
    weight: 0.2,
    items: [
      {
        id: "LEAP_CR04",
        text: "I have documented, measurable achievements that demonstrate my impact."
      },
      {
        id: "LEAP_CR05",
        text: "I can show a track record of delivering results above expectations."
      },
      {
        id: "LEAP_CR06",
        text: "My contributions have been recognised by stakeholders beyond my immediate team."
      }
    ],
    reverse_coded: [],
    sub_dimensions: [],
    normalised_max: 20
  },
  {
    id: "D3",
    name: "Timing",
    weight: 0.2,
    items: [
      {
        id: "LEAP_CR07",
        text: "I regularly contribute thought leadership in my area of expertise."
      },
      {
        id: "LEAP_CR08",
        text: "Decision-makers in my target organisations are aware of my capabilities."
      },
      {
        id: "LEAP_CR09",
        text: "I have an active and strategic professional network that advocates for me."
      }
    ],
    reverse_coded: [],
    sub_dimensions: [],
    normalised_max: 20
  },
  {
    id: "D4",
    name: "Risk",
    weight: 0.2,
    items: [
      {
        id: "LEAP_CR10",
        text: "I have a clear vision of my next career step and the timeline to get there."
      },
      {
        id: "LEAP_CR11",
        text: "I am actively preparing for a transition (upskilling, networking, positioning)."
      },
      {
        id: "LEAP_CR12",
        text: "I feel confident in my ability to make a successful career move within 12 months."
      }
    ],
    reverse_coded: [],
    sub_dimensions: [],
    normalised_max: 20
  },
  {
    id: "D5",
    name: "Impact",
    weight: 0.15,
    items: [
      {
        id: "LEAP_CR13",
        text: "My current role uses my natural strengths and behavioural style."
      },
      {
        id: "LEAP_CR14",
        text: "My career direction is aligned with my personal values and long-term goals."
      },
      {
        id: "LEAP_CR15",
        text: "The culture of my organisation is compatible with how I work best."
      }
    ],
    reverse_coded: [],
    sub_dimensions: [],
    normalised_max: 20
  }
];

export const COMPOSITE_BANDS = [
  {
    min: 80,
    max: 100,
    label: "Exceptional",
    interpretation: "High career readiness with strong behavioural self-awareness"
  },
  {
    min: 60,
    max: 79,
    label: "Strong",
    interpretation: "Ready for strategic career move with minor development"
  },
  {
    min: 40,
    max: 59,
    label: "Developing",
    interpretation: "Solid foundation; specific readiness gaps present"
  },
  {
    min: 20,
    max: 39,
    label: "Emerging",
    interpretation: "Foundational positioning work required"
  },
  {
    min: 0,
    max: 19,
    label: "Early Stage",
    interpretation: "Significant gaps; developmental programme recommended"
  }
];

export const DIMENSION_VERDICTS = [
  {
    min: 0,
    max: 39,
    label: "B1 Emerging",
    meaning: "Significant foundational work required before active career transition"
  },
  {
    min: 40,
    max: 59,
    label: "B2 Developing",
    meaning: "Building foundation with identifiable gaps to close"
  },
  {
    min: 60,
    max: 79,
    label: "B3 Ready",
    meaning: "Solid positioning — ready for targeted move execution"
  },
  {
    min: 80,
    max: 100,
    label: "B4 Market-Ready",
    meaning: "Fully positioned for strategic career transition"
  }
];
// X4-NOTE: LEAP archetype narrative array = 16 computation profiles (4xD × 4xI × 4xS × 4xC grid).
// Canon LEAP defines 14 customer-facing archetype labels (published names). The 16 grid
// profiles map into the 14 canonical names at render time — mapping comment inline below.
// Computation bucket count stays 16 (scoring stability); UI surfaces map to 14 canon names.
// X4-verified: no "Architect (Strategic)" / "LEAP Instrument" entries remain in this array.
export const ARCHETYPES = [
  {
    cr_band: "B1",
    name: "The Unproven Driver",
    prism_parent: "Overexposed Generalist",
    narrative: "You lead with decisive urgency, but your readiness scores reveal significant gaps in positioning and proof. Your dominant drive is clear, but without a foundation of documented impact and strategic visibility, others may see intensity without substance.",
    strengths: [
      "Decisive action under pressure",
      "Clear sense of direction",
      "Willingness to challenge status quo"
    ],
    blind_spots: [
      "Assumes drive alone is sufficient",
      "Underinvests in proof documentation",
      "May bulldoze through relationship-building"
    ],
    risk_if_no_action: "Perceived as all bark, no bite — high energy without the credentials to back it up",
    disc_primary: "D"
  },
  {
    disc_primary: "D",
    cr_band: "B2",
    name: "The Assertive Contender",
    prism_parent: "Overexposed Generalist",
    narrative: "Your D-drive gives you presence and authority. You're building readiness but still have visible gaps — particularly in proof depth or network quality. You're asserting yourself into rooms you're not yet fully credentialed for.",
    strengths: [
      "Commanding presence",
      "Building momentum",
      "Not afraid of stretch assignments"
    ],
    blind_spots: [
      "May overestimate readiness based on confidence",
      "Visibility without proportional proof",
      "Risk of overreaching"
    ],
    risk_if_no_action: "Gets the stretch role but struggles to deliver — reputation as 'promoted too soon'"
  },
  {
    disc_primary: "D",
    cr_band: "B3",
    name: "The Rising Commander",
    prism_parent: "Strategic Mover",
    narrative: "You combine decisive leadership with solid readiness foundations. Your positioning is clear, your proof is building, and your move readiness is active. You're on the ascent — the question is execution pace, not direction.",
    strengths: [
      "Strategic decisiveness backed by evidence",
      "Clear career narrative",
      "Momentum with substance"
    ],
    blind_spots: [
      "May accelerate past relationship-building",
      "Could under-invest in cross-cultural refinement"
    ],
    risk_if_no_action: "Minor risk — main danger is pace outstripping network support"
  },
  {
    disc_primary: "D",
    cr_band: "B4",
    name: "The Decisive Strategist",
    prism_parent: "Strategic Mover",
    narrative: "You are the complete package: decisive, positioned, proven, and ready. Your D-drive gives you the authority to command rooms, and your readiness scores confirm you've done the work to back it up. You're market-ready for significant moves.",
    strengths: [
      "Full-spectrum readiness",
      "Authority with evidence",
      "Strategic clarity + execution capability"
    ],
    blind_spots: [
      "Overconfidence in readiness",
      "May underestimate cultural nuance in cross-border moves",
      "Risk of appearing too aggressive in consensus cultures"
    ],
    risk_if_no_action: "Low risk — main danger is impatience or misreading cultural context"
  },
  {
    disc_primary: "I",
    cr_band: "B1",
    name: "The Restless Explorer",
    prism_parent: "Scattered Explorer",
    narrative: "You have infectious energy and enthusiasm, but your readiness scores show you haven't yet channelled that energy into a clear direction. You're exploring widely but landing nowhere. Your I-drive makes you engaging, but without positioning or proof, you risk being liked but not taken seriously.",
    strengths: [
      "High energy and adaptability",
      "Natural connector",
      "Open to new possibilities"
    ],
    blind_spots: [
      "Confuses activity with progress",
      "Lacks focus on a specific direction",
      "May prioritise fun over substance"
    ],
    risk_if_no_action: "Perpetual explorer — always starting, never arriving. Seen as enthusiastic but unserious."
  },
  {
    disc_primary: "I",
    cr_band: "B2",
    name: "The Visible Broadcaster",
    prism_parent: "Overexposed Generalist",
    narrative: "You're highly visible and engaging, and you're building readiness — but your proof doesn't yet match your presence. You're known, people know your name, but when they look deeper, the substance isn't there yet. Your I-drive creates opportunities that your C-gap may fail to convert.",
    strengths: [
      "Strong personal brand awareness",
      "Natural storyteller",
      "Opens doors through relationships"
    ],
    blind_spots: [
      "Confuses visibility with credibility",
      "Underinvests in detail and follow-through",
      "May spread too thin across audiences"
    ],
    risk_if_no_action: "Reputation as 'all sizzle, no steak' — great presenter, weak executor"
  },
  {
    disc_primary: "I",
    cr_band: "B3",
    name: "The Connected Mobilizer",
    prism_parent: "Strategic Mover",
    narrative: "You combine influence with action. Your readiness scores show you're not just visible — you're building real proof and moving strategically. Your I-drive creates natural network advantages, and you're leveraging them effectively.",
    strengths: [
      "Influence backed by substance",
      "Strategic relationship-building",
      "Mobilises others toward shared goals"
    ],
    blind_spots: [
      "May rely too heavily on charm over rigour",
      "Risk of style over substance in critical moments",
      "Could neglect analytical depth"
    ],
    risk_if_no_action: "Moderate risk — danger of hitting a ceiling in roles that demand analytical precision"
  },
  {
    disc_primary: "I",
    cr_band: "B4",
    name: "The Magnetic Closer",
    prism_parent: "Strategic Mover",
    narrative: "You are market-ready with a powerful combination: magnetic influence, documented proof, strategic positioning, and active move readiness. You can open doors AND walk through them. This is the archetype that gets hired for roles they weren't even applied to.",
    strengths: [
      "Maximum influence with maximum readiness",
      "Natural closer",
      "Opens and converts opportunities at scale"
    ],
    blind_spots: [
      "May become over-dependent on charisma",
      "Risk of neglecting operational depth",
      "Could alienate detail-oriented stakeholders"
    ],
    risk_if_no_action: "Low risk — main danger of over-reliance on personal brand without institutional depth"
  },
  {
    disc_primary: "S",
    cr_band: "B1",
    name: "The Anchored Loyalist",
    prism_parent: "Reluctant Transitioner",
    narrative: "You are deeply steady and committed, but your readiness scores indicate you haven't begun the positioning work needed for a career transition. You're anchored — comfortable, reliable, and invisible to opportunities. Your S-drive creates stability but also inertia.",
    strengths: [
      "Deep institutional knowledge",
      "Trusted and dependable",
      "Stabilising presence in teams"
    ],
    blind_spots: [
      "Confuses comfort with satisfaction",
      "Assumes loyalty will be rewarded",
      "Avoids uncomfortable but necessary positioning work"
    ],
    risk_if_no_action: "Permanent plateau — overlooked for roles you're capable of because you never signal readiness"
  },
  {
    disc_primary: "S",
    cr_band: "B2",
    name: "The Cautious Steward",
    prism_parent: "Reluctant Transitioner",
    narrative: "You're building readiness carefully and methodically, but your S-drive makes you hesitant to act. You'd rather be over-prepared than under-prepared, which can mean missed windows. You're a reliable steward who needs to learn that calculated risk is part of career progression.",
    strengths: [
      "Thoughtful preparation",
      "Risk-aware decision-making",
      "Reliable execution once committed"
    ],
    blind_spots: [
      "Over-preparation as procrastination",
      "Misses optimal timing windows",
      "May wait for certainty that never comes"
    ],
    risk_if_no_action: "Window closes on opportunities — forced into reactive rather than proactive moves"
  },
  {
    disc_primary: "S",
    cr_band: "B3",
    name: "The Dependable Backbone",
    prism_parent: "Invisible Achiever",
    narrative: "You're ready and capable, but your S-drive means you don't naturally promote yourself. Your readiness scores are solid, but your visibility gap is the bottleneck. You deliver consistently, but decision-makers may not connect your name to the next-level role.",
    strengths: [
      "Consistent high-quality delivery",
      "Trusted by peers and managers",
      "Solid readiness foundation"
    ],
    blind_spots: [
      "Assumes results speak for themselves",
      "Avoids self-promotion as 'bragging'",
      "Underestimates the visibility gap between current role and target"
    ],
    risk_if_no_action: "Passed over for roles you're qualified for — less capable but more visible peers advance"
  },
  {
    disc_primary: "S",
    cr_band: "B4",
    name: "The Calm Powerhouse",
    prism_parent: "Invisible Achiever",
    narrative: "You're fully ready for the next level, with one persistent gap: visibility. Your S-drive means you lead from behind, deliver exceptional results steadily, and wait for recognition. But at the senior levels, recognition doesn't come to those who don't create it. You're a powerhouse — but the quiet approach needs to change.",
    strengths: [
      "Maximum readiness with deep expertise",
      "Composed authority",
      "Delivers without drama"
    ],
    blind_spots: [
      "Visibility is the only gap — but it's the one that matters most now",
      "May resent others being promoted ahead",
      "Confuses humility with invisibility"
    ],
    risk_if_no_action: "Frustration and disengagement — you know you're ready but the market doesn't see you"
  },
  {
    disc_primary: "C",
    cr_band: "B1",
    name: "The Meticulous Understudy",
    prism_parent: "Invisible Achiever",
    narrative: "You're thorough, precise, and deeply knowledgeable — but you haven't yet translated that into career positioning. Your C-drive makes you a perfectionist who waits until everything is 'ready' before putting yourself forward. That moment never fully arrives.",
    strengths: [
      "Deep analytical capability",
      "Error-free work",
      "Thoughtful problem-solving"
    ],
    blind_spots: [
      "Perfectionism as procrastination",
      "Waits for external validation before acting",
      "May over-invest in analysis at the expense of action"
    ],
    risk_if_no_action: "Career stalls while less qualified but more proactive peers advance"
  },
  {
    disc_primary: "C",
    cr_band: "B2",
    name: "The Diligent Specialist",
    prism_parent: "Invisible Achiever",
    narrative: "You're building readiness with methodical precision, and your C-drive ensures quality in everything you do. But specialists get pigeonholed. Your proof may be deep but narrow, and your visibility may be limited to technical audiences. The market needs to see breadth, not just depth.",
    strengths: [
      "High-quality proof inventory",
      "Methodical skill development",
      "Deep expertise in focus area"
    ],
    blind_spots: [
      "Too narrow — market needs generalists at senior levels",
      "May avoid visibility work as 'superficial'",
      "Risk of being known for one thing only"
    ],
    risk_if_no_action: "Trapped as the 'go-to specialist' — respected but not promoted beyond technical track"
  },
  {
    disc_primary: "C",
    cr_band: "B3",
    name: "The Unseen Expert",
    prism_parent: "Invisible Achiever",
    narrative: "Your readiness is rising, your expertise is deep, but you remain under the radar. Your C-drive means you value substance over style — but at senior levels, style is how substance gets recognised. You need to learn that strategic self-promotion is not bragging — it's professional responsibility.",
    strengths: [
      "Rising readiness with deep craft",
      "Analytical rigour",
      "High-quality deliverables"
    ],
    blind_spots: [
      "Still under-investing in visibility and positioning",
      "May dismiss networking as 'political'",
      "Readiness is there but the market doesn't know it"
    ],
    risk_if_no_action: "Becomes the best-kept secret in your industry — respected by peers, unknown to decision-makers"
  },
  {
    disc_primary: "C",
    cr_band: "B4",
    name: "The Precision Operator",
    prism_parent: "Strategic Mover",
    narrative: "You combine analytical precision with full readiness. This is the rarest combination: someone who is both rigorous AND market-ready. Your C-drive ensures you move deliberately and with evidence. You're ready — the question is whether you'll step into the spotlight.",
    strengths: [
      "Precision with readiness",
      "Evidence-backed decision-making",
      "Deliberate and strategic movement"
    ],
    blind_spots: [
      "May still default to over-analysis when action is needed",
      "Risk of appearing cold or transactional",
      "Could struggle in high-ambiguity, relationship-driven environments"
    ],
    risk_if_no_action: "Low risk — main danger of hesitating at the final moment when leap of faith is required"
  }
];

export const LAYERS = {
  disc: {
    description: "Section 1: DISC Behavioral — 16 forced-choice item sets (Q1–Q16)",
    format: "Each item: 4 adjectives (one D, one I, one S, one C). Select MOST like me + LEAST like me.",
    item_sets: [
      {
        id: "LEAP_DQ01",
        set: 1,
        D: "Decisive",
        I: "Enthusiastic",
        S: "Patient",
        C: "Analytical"
      },
      {
        id: "LEAP_DQ02",
        set: 1,
        D: "Direct",
        I: "Optimistic",
        S: "Reliable",
        C: "Precise"
      },
      {
        id: "LEAP_DQ03",
        set: 2,
        D: "Competitive",
        I: "Persuasive",
        S: "Supportive",
        C: "Systematic"
      },
      {
        id: "LEAP_DQ04",
        set: 2,
        D: "Results-oriented",
        I: "Sociable",
        S: "Steady",
        C: "Thorough"
      },
      {
        id: "LEAP_DQ05",
        set: 3,
        D: "Assertive",
        I: "Expressive",
        S: "Cooperative",
        C: "Detail-oriented"
      },
      {
        id: "LEAP_DQ06",
        set: 3,
        D: "Bold",
        I: "Inspiring",
        S: "Loyal",
        C: "Careful"
      },
      {
        id: "LEAP_DQ07",
        set: 4,
        D: "Driven",
        I: "Charming",
        S: "Calm",
        C: "Accurate"
      },
      {
        id: "LEAP_DQ08",
        set: 4,
        D: "Independent",
        I: "Outgoing",
        S: "Accommodating",
        C: "Diplomatic"
      },
      {
        id: "LEAP_DQ09",
        set: 5,
        D: "Commanding",
        I: "Spirited",
        S: "Gentle",
        C: "Formal"
      },
      {
        id: "LEAP_DQ10",
        set: 5,
        D: "Firm",
        I: "Lively",
        S: "Easygoing",
        C: "Reserved"
      },
      {
        id: "LEAP_DQ11",
        set: 6,
        D: "Demanding",
        I: "Animated",
        S: "Kind",
        C: "Cautious"
      },
      {
        id: "LEAP_DQ12",
        set: 6,
        D: "Strong-willed",
        I: "Popular",
        S: "Considerate",
        C: "Logical"
      },
      {
        id: "LEAP_DQ13",
        set: 7,
        D: "Enterprising",
        I: "Talkative",
        S: "Tolerant",
        C: "Perfectionist"
      },
      {
        id: "LEAP_DQ14",
        set: 7,
        D: "Pioneering",
        I: "Playful",
        S: "Sympathetic",
        C: "Orderly"
      },
      {
        id: "LEAP_DQ15",
        set: 8,
        D: "Risk-taking",
        I: "Magnetic",
        S: "Stable",
        C: "Objective"
      },
      {
        id: "LEAP_DQ16",
        set: 8,
        D: "Assertive",
        I: "Spontaneous",
        S: "Harmonious",
        C: "Methodical"
      }
    ],
    scoring: {
      most_value: 2,
      least_value: -1,
      unselected_value: 0,
      items_per_dimension: 4,
      raw_range: {
        min: -4,
        max: 8
      },
      normalization: "(raw + 4) / 12 * 100"
    }
  },
  career_readiness: {
    description: "Section 2: Career Readiness — 15 Likert items (Q17–Q31), 3 per dimension",
    format: "1–5 Likert scale (1=Strongly Disagree, 5=Strongly Agree)",
    dimensions: [
      {
        name: "Positioning",
        weight: 0.25,
        items: [
          {
            id: "LEAP_CR01",
            text: "I can clearly articulate what makes me different from others in my field."
          },
          {
            id: "LEAP_CR02",
            text: "Others in my industry associate me with a specific expertise or value."
          },
          {
            id: "LEAP_CR03",
            text: "My professional brand is consistent across all channels and interactions."
          }
        ]
      },
      {
        name: "Proof",
        weight: 0.2,
        items: [
          {
            id: "LEAP_CR04",
            text: "I have documented, measurable achievements that demonstrate my impact."
          },
          {
            id: "LEAP_CR05",
            text: "I can show a track record of delivering results above expectations."
          },
          {
            id: "LEAP_CR06",
            text: "My contributions have been recognised by stakeholders beyond my immediate team."
          }
        ]
      },
      {
        name: "Visibility",
        weight: 0.2,
        items: [
          {
            id: "LEAP_CR07",
            text: "I regularly contribute thought leadership in my area of expertise."
          },
          {
            id: "LEAP_CR08",
            text: "Decision-makers in my target organisations are aware of my capabilities."
          },
          {
            id: "LEAP_CR09",
            text: "I have an active and strategic professional network that advocates for me."
          }
        ]
      },
      {
        name: "Move",
        weight: 0.2,
        items: [
          {
            id: "LEAP_CR10",
            text: "I have a clear vision of my next career step and the timeline to get there."
          },
          {
            id: "LEAP_CR11",
            text: "I am actively preparing for a transition (upskilling, networking, positioning)."
          },
          {
            id: "LEAP_CR12",
            text: "I feel confident in my ability to make a successful career move within 12 months."
          }
        ]
      },
      {
        name: "Alignment",
        weight: 0.15,
        items: [
          {
            id: "LEAP_CR13",
            text: "My current role uses my natural strengths and behavioural style."
          },
          {
            id: "LEAP_CR14",
            text: "My career direction is aligned with my personal values and long-term goals."
          },
          {
            id: "LEAP_CR15",
            text: "The culture of my organisation is compatible with how I work best."
          }
        ]
      }
    ],
    scoring: {
      scale: "1-5 Likert",
      dimension_normalization: "mean_of_items → (mean - 1) / 4 * 100",
      composite_formula: "SUM(dimension_score × weight)"
    }
  },
  cross_border: {
    description: "Section 3: Cross-Border Modifier — 4 items (Q32–Q35)",
    format: "1–5 Likert scale",
    purpose: "Measures APAC cross-border legibility — reported as standalone score, NOT in composite",
    items: [
      {
        id: "LEAP_CB01",
        text: "I understand the cultural nuances of business in the APAC region."
      },
      {
        id: "LEAP_CB02",
        text: "I can adapt my communication style to work effectively across Asian markets."
      },
      {
        id: "LEAP_CB03",
        text: "I have professional relationships or experience in multiple APAC countries."
      },
      {
        id: "LEAP_CB04",
        text: "I am perceived as credible and relatable by stakeholders from diverse Asian cultures."
      }
    ],
    scoring: {
      scale: "1-5 Likert",
      normalization: "(mean - 1) / 4 * 100",
      in_composite: false,
      reported_as: "APAC Legibility Score (standalone)"
    }
  },
  composite: {
    formula: "LEAP = (DISC Alignment × 0.30) + (Career Readiness × 0.70)",
    disc_alignment_weight: 0.3,
    career_readiness_weight: 0.7,
    disc_alignment_definition: "How well the behavioural profile matches the stated career direction — computed as (Alignment_score × 0.60) + (100 - DISC_balance_penalty × 0.40) where penalty = spread between highest and lowest DISC score"
  },
  disc_style_bands: [
    {
      min: 80,
      max: 100,
      label: "Strong Primary",
      meaning: "Dominant behavioural drive is clear and highly developed"
    },
    {
      min: 60,
      max: 79,
      label: "Strong Secondary",
      meaning: "Behavioural drive is accessible and effective"
    },
    {
      min: 40,
      max: 59,
      label: "Reserve",
      meaning: "Behavioural drive is present but inconsistently deployed"
    },
    {
      min: 20,
      max: 39,
      label: "Weak",
      meaning: "Behavioural drive is underdeveloped"
    },
    {
      min: 0,
      max: 19,
      label: "Minimal",
      meaning: "Behavioural drive is not a natural mode"
    }
  ],
  cr_readiness_bands: [
    {
      min: 0,
      max: 39,
      label: "B1 Emerging",
      meaning: "Significant foundational work required before active career transition"
    },
    {
      min: 40,
      max: 59,
      label: "B2 Developing",
      meaning: "Building foundation with identifiable gaps to close"
    },
    {
      min: 60,
      max: 79,
      label: "B3 Ready",
      meaning: "Solid positioning — ready for targeted move execution"
    },
    {
      min: 80,
      max: 100,
      label: "B4 Market-Ready",
      meaning: "Fully positioned for strategic career transition"
    }
  ],
  prism_rollup: {
    "Invisible Achiever": [
      "Dependable Backbone",
      "Calm Powerhouse",
      "Meticulous Understudy",
      "Diligent Specialist",
      "Unseen Expert"
    ],
    "Scattered Explorer": [
      "Restless Explorer"
    ],
    "Reluctant Transitioner": [
      "Anchored Loyalist",
      "Cautious Steward"
    ],
    "Overexposed Generalist": [
      "Unproven Driver",
      "Assertive Contender",
      "Visible Broadcaster"
    ],
    "Strategic Mover": [
      "Rising Commander",
      "Decisive Strategist",
      "Connected Mobilizer",
      "Magnetic Closer",
      "Precision Operator"
    ]
  },
  mixed_profile_rule: "When no dominant DISC drive emerges (spread < 15 points across all 4 dimensions), assign The Scattered Explorer regardless of CR band."
};

export const SCORING_CONFIG = {
  INSTRUMENT, FULL_NAME, VERSION, TOTAL_QUESTIONS, SCALE, DELIVERY_MINUTES,
  TIER, PRICE_MILES, B2C_NAME, TAGLINE,
  DIMENSIONS, COMPOSITE_BANDS, DIMENSION_VERDICTS, ARCHETYPES,
};
