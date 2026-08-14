// ═══════════════════════════════════════════════════════════
// LEAP Question Bank — Leadership Evaluation & Psychological Profiling
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface LEAPQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface LEAPDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: LEAPQuestion[];
}

export const INSTRUMENT = "LEAP";
export const FULL_NAME = "Leadership Evaluation & Psychological Profiling";
export const VERSION = "2.0";
// NOTE: questions/leap.ts organises DISC items per-dimension (D/I/S/C), so the
// same 16 forced-choice item sets appear in 4 parallel dim arrays each. The
// de-duplicated question list a user actually answers lives in scoring/leap.ts
// (16 DISC forced-choice + 15 CR Likert + 4 CB cross-border = 35). Keep this
// constant aligned with scoring/leap.ts TOTAL_QUESTIONS so every consumer
// (engine progress bar, catalog, QUESTION_BANKS index) sees the real total.
export const TOTAL_QUESTIONS = 35;
export const SCALE = "Forced-choice DISC + Likert (mixed)";
export const DELIVERY_MINUTES = 15;

export const DIMENSIONS: LEAPDimensionBank[] = [
  {
    id: "DISC_D",
    name: "Dominance",
    count: 8,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_DQ01",
        text: "Rank the adjectives. Forced choice. \"Decisive\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Decisive",
            value: "D"
          },
          {
            label: "I",
            text: "Enthusiastic",
            value: "I"
          },
          {
            label: "S",
            text: "Patient",
            value: "S"
          },
          {
            label: "C",
            text: "Analytical",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ02",
        text: "Rank the adjectives. Forced choice. \"Direct\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Direct",
            value: "D"
          },
          {
            label: "I",
            text: "Optimistic",
            value: "I"
          },
          {
            label: "S",
            text: "Reliable",
            value: "S"
          },
          {
            label: "C",
            text: "Precise",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ03",
        text: "Rank the adjectives. Forced choice. \"Competitive\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Competitive",
            value: "D"
          },
          {
            label: "I",
            text: "Persuasive",
            value: "I"
          },
          {
            label: "S",
            text: "Supportive",
            value: "S"
          },
          {
            label: "C",
            text: "Systematic",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ04",
        text: "Rank the adjectives. Forced choice. \"Results-oriented\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Results-oriented",
            value: "D"
          },
          {
            label: "I",
            text: "Sociable",
            value: "I"
          },
          {
            label: "S",
            text: "Steady",
            value: "S"
          },
          {
            label: "C",
            text: "Thorough",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ05",
        text: "Rank the adjectives. Forced choice. \"Assertive\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Assertive",
            value: "D"
          },
          {
            label: "I",
            text: "Expressive",
            value: "I"
          },
          {
            label: "S",
            text: "Cooperative",
            value: "S"
          },
          {
            label: "C",
            text: "Detail-oriented",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ06",
        text: "Rank the adjectives. Forced choice. \"Bold\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Bold",
            value: "D"
          },
          {
            label: "I",
            text: "Inspiring",
            value: "I"
          },
          {
            label: "S",
            text: "Loyal",
            value: "S"
          },
          {
            label: "C",
            text: "Careful",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ07",
        text: "Rank the adjectives. Forced choice. \"Driven\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Driven",
            value: "D"
          },
          {
            label: "I",
            text: "Charming",
            value: "I"
          },
          {
            label: "S",
            text: "Calm",
            value: "S"
          },
          {
            label: "C",
            text: "Accurate",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ08",
        text: "Rank the adjectives. Forced choice. \"Independent\" — D=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Independent",
            value: "D"
          },
          {
            label: "I",
            text: "Outgoing",
            value: "I"
          },
          {
            label: "S",
            text: "Accommodating",
            value: "S"
          },
          {
            label: "C",
            text: "Diplomatic",
            value: "C"
          }
        ],
        scale_labels: null
      }
    ]
  },
  {
    id: "DISC_I",
    name: "Influence",
    count: 8,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_DQ01",
        text: "Rank the adjectives. Forced choice. \"Enthusiastic\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Decisive",
            value: "D"
          },
          {
            label: "I",
            text: "Enthusiastic",
            value: "I"
          },
          {
            label: "S",
            text: "Patient",
            value: "S"
          },
          {
            label: "C",
            text: "Analytical",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ02",
        text: "Rank the adjectives. Forced choice. \"Optimistic\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Direct",
            value: "D"
          },
          {
            label: "I",
            text: "Optimistic",
            value: "I"
          },
          {
            label: "S",
            text: "Reliable",
            value: "S"
          },
          {
            label: "C",
            text: "Precise",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ03",
        text: "Rank the adjectives. Forced choice. \"Persuasive\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Competitive",
            value: "D"
          },
          {
            label: "I",
            text: "Persuasive",
            value: "I"
          },
          {
            label: "S",
            text: "Supportive",
            value: "S"
          },
          {
            label: "C",
            text: "Systematic",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ04",
        text: "Rank the adjectives. Forced choice. \"Sociable\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Results-oriented",
            value: "D"
          },
          {
            label: "I",
            text: "Sociable",
            value: "I"
          },
          {
            label: "S",
            text: "Steady",
            value: "S"
          },
          {
            label: "C",
            text: "Thorough",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ05",
        text: "Rank the adjectives. Forced choice. \"Expressive\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Assertive",
            value: "D"
          },
          {
            label: "I",
            text: "Expressive",
            value: "I"
          },
          {
            label: "S",
            text: "Cooperative",
            value: "S"
          },
          {
            label: "C",
            text: "Detail-oriented",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ06",
        text: "Rank the adjectives. Forced choice. \"Inspiring\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Bold",
            value: "D"
          },
          {
            label: "I",
            text: "Inspiring",
            value: "I"
          },
          {
            label: "S",
            text: "Loyal",
            value: "S"
          },
          {
            label: "C",
            text: "Careful",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ07",
        text: "Rank the adjectives. Forced choice. \"Charming\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Driven",
            value: "D"
          },
          {
            label: "I",
            text: "Charming",
            value: "I"
          },
          {
            label: "S",
            text: "Calm",
            value: "S"
          },
          {
            label: "C",
            text: "Accurate",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ08",
        text: "Rank the adjectives. Forced choice. \"Outgoing\" — I=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Independent",
            value: "D"
          },
          {
            label: "I",
            text: "Outgoing",
            value: "I"
          },
          {
            label: "S",
            text: "Accommodating",
            value: "S"
          },
          {
            label: "C",
            text: "Diplomatic",
            value: "C"
          }
        ],
        scale_labels: null
      }
    ]
  },
  {
    id: "DISC_S",
    name: "Steadiness",
    count: 8,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_DQ01",
        text: "Rank the adjectives. Forced choice. \"Patient\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Decisive",
            value: "D"
          },
          {
            label: "I",
            text: "Enthusiastic",
            value: "I"
          },
          {
            label: "S",
            text: "Patient",
            value: "S"
          },
          {
            label: "C",
            text: "Analytical",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ02",
        text: "Rank the adjectives. Forced choice. \"Reliable\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Direct",
            value: "D"
          },
          {
            label: "I",
            text: "Optimistic",
            value: "I"
          },
          {
            label: "S",
            text: "Reliable",
            value: "S"
          },
          {
            label: "C",
            text: "Precise",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ03",
        text: "Rank the adjectives. Forced choice. \"Supportive\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Competitive",
            value: "D"
          },
          {
            label: "I",
            text: "Persuasive",
            value: "I"
          },
          {
            label: "S",
            text: "Supportive",
            value: "S"
          },
          {
            label: "C",
            text: "Systematic",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ04",
        text: "Rank the adjectives. Forced choice. \"Steady\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Results-oriented",
            value: "D"
          },
          {
            label: "I",
            text: "Sociable",
            value: "I"
          },
          {
            label: "S",
            text: "Steady",
            value: "S"
          },
          {
            label: "C",
            text: "Thorough",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ05",
        text: "Rank the adjectives. Forced choice. \"Cooperative\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Assertive",
            value: "D"
          },
          {
            label: "I",
            text: "Expressive",
            value: "I"
          },
          {
            label: "S",
            text: "Cooperative",
            value: "S"
          },
          {
            label: "C",
            text: "Detail-oriented",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ06",
        text: "Rank the adjectives. Forced choice. \"Loyal\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Bold",
            value: "D"
          },
          {
            label: "I",
            text: "Inspiring",
            value: "I"
          },
          {
            label: "S",
            text: "Loyal",
            value: "S"
          },
          {
            label: "C",
            text: "Careful",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ07",
        text: "Rank the adjectives. Forced choice. \"Calm\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Driven",
            value: "D"
          },
          {
            label: "I",
            text: "Charming",
            value: "I"
          },
          {
            label: "S",
            text: "Calm",
            value: "S"
          },
          {
            label: "C",
            text: "Accurate",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ08",
        text: "Rank the adjectives. Forced choice. \"Accommodating\" — S=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Independent",
            value: "D"
          },
          {
            label: "I",
            text: "Outgoing",
            value: "I"
          },
          {
            label: "S",
            text: "Accommodating",
            value: "S"
          },
          {
            label: "C",
            text: "Diplomatic",
            value: "C"
          }
        ],
        scale_labels: null
      }
    ]
  },
  {
    id: "DISC_C",
    name: "Conscientiousness",
    count: 8,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_DQ01",
        text: "Rank the adjectives. Forced choice. \"Analytical\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Decisive",
            value: "D"
          },
          {
            label: "I",
            text: "Enthusiastic",
            value: "I"
          },
          {
            label: "S",
            text: "Patient",
            value: "S"
          },
          {
            label: "C",
            text: "Analytical",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ02",
        text: "Rank the adjectives. Forced choice. \"Precise\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Direct",
            value: "D"
          },
          {
            label: "I",
            text: "Optimistic",
            value: "I"
          },
          {
            label: "S",
            text: "Reliable",
            value: "S"
          },
          {
            label: "C",
            text: "Precise",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ03",
        text: "Rank the adjectives. Forced choice. \"Systematic\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Competitive",
            value: "D"
          },
          {
            label: "I",
            text: "Persuasive",
            value: "I"
          },
          {
            label: "S",
            text: "Supportive",
            value: "S"
          },
          {
            label: "C",
            text: "Systematic",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ04",
        text: "Rank the adjectives. Forced choice. \"Thorough\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Results-oriented",
            value: "D"
          },
          {
            label: "I",
            text: "Sociable",
            value: "I"
          },
          {
            label: "S",
            text: "Steady",
            value: "S"
          },
          {
            label: "C",
            text: "Thorough",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ05",
        text: "Rank the adjectives. Forced choice. \"Detail-oriented\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Assertive",
            value: "D"
          },
          {
            label: "I",
            text: "Expressive",
            value: "I"
          },
          {
            label: "S",
            text: "Cooperative",
            value: "S"
          },
          {
            label: "C",
            text: "Detail-oriented",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ06",
        text: "Rank the adjectives. Forced choice. \"Careful\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Bold",
            value: "D"
          },
          {
            label: "I",
            text: "Inspiring",
            value: "I"
          },
          {
            label: "S",
            text: "Loyal",
            value: "S"
          },
          {
            label: "C",
            text: "Careful",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ07",
        text: "Rank the adjectives. Forced choice. \"Accurate\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Driven",
            value: "D"
          },
          {
            label: "I",
            text: "Charming",
            value: "I"
          },
          {
            label: "S",
            text: "Calm",
            value: "S"
          },
          {
            label: "C",
            text: "Accurate",
            value: "C"
          }
        ],
        scale_labels: null
      },
      {
        id: "LEAP_DQ08",
        text: "Rank the adjectives. Forced choice. \"Diplomatic\" — C=Conscientiousness.",
        type: "forced_choice",
        reverse_coded: false,
        options: [
          {
            label: "D",
            text: "Independent",
            value: "D"
          },
          {
            label: "I",
            text: "Outgoing",
            value: "I"
          },
          {
            label: "S",
            text: "Accommodating",
            value: "S"
          },
          {
            label: "C",
            text: "Diplomatic",
            value: "C"
          }
        ],
        scale_labels: null
      }
    ]
  },
  {
    id: "CR/Positioning",
    name: "Career Readiness — Positioning",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR01",
        text: "I can articulate my unique professional value in one clear sentence that resonates with any audience.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Proof",
    name: "Career Readiness — Proof",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR02",
        text: "In the past 3 years, I have built a track record of measurable, quantifiable achievements I can point to.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Visibility",
    name: "Career Readiness — Visibility",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR03",
        text: "I have visible thought leadership presence (articles, speaking, industry recognition) in the last 12 months.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Network",
    name: "Career Readiness — Network",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR04",
        text: "I have a strategic network of contacts who could actively influence or sponsor my next career move.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Move_Readiness",
    name: "Career Readiness — Move_Readiness",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR05",
        text: "I have clarity on my next career direction and a realistic timeline for making the move.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Cross_Border",
    name: "Career Readiness — Cross_Border",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR06",
        text: "I have meaningful experience operating across multiple cultural contexts and feel comfortable navigating cultural complexity.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CR/Alignment",
    name: "Career Readiness — Alignment",
    count: 1,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CR07",
        text: "My current role allows me to operate in a way that feels natural and aligned with my behavioural style.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: [
          "Strongly disagree",
          "Strongly agree"
        ]
      }
    ]
  },
  {
    id: "CB",
    name: "APAC Cross-Border Calibration",
    count: 4,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "LEAP_CB01",
        text: "I understand the cultural nuances of business in the APAC region.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "LEAP_CB02",
        text: "I can adapt my communication style to work effectively across Asian markets.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "LEAP_CB03",
        text: "I have professional relationships or experience in multiple APAC countries.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "LEAP_CB04",
        text: "I am perceived as credible and relatable by stakeholders from diverse Asian cultures.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: LEAPQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
