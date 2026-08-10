// ═══════════════════════════════════════════════════════════
// DRIVE Question Bank — None
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface DRIVEQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface DRIVEDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: DRIVEQuestion[];
}

export const INSTRUMENT = "DRIVE";
export const FULL_NAME = "Motivation Architecture & Engagement Risk Assessment";
export const VERSION = "2.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 14;

export const DIMENSIONS: DRIVEDimensionBank[] = [
  {
    id: "D1",
    name: "Intrinsic Motivation",
    count: 7,
    max_raw: 30,
    formula: "(raw/30) × 100",
    sub_dimensions: [
      "Task engagement",
      "Intellectual curiosity",
      "Autonomy drive",
      "Flow state frequency",
      "Craft motivation",
      "APAC intrinsic resonance"
    ],
    reverse_coded: [
      "Q03"
    ],
    questions: [
      {
        id: "D1_Q1",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q2",
        text: "0",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q3",
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q4",
        text: "-",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q5",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q6",
        text: "0",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q7",
        text: "6",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D2",
    name: "Extrinsic Motivation",
    count: 7,
    max_raw: 30,
    formula: "(raw/30) × 100",
    sub_dimensions: [
      "Recognition sensitivity",
      "Reward orientation",
      "Recognition scope",
      "Extrinsic independence",
      "Visibility drive",
      "Progression drive"
    ],
    reverse_coded: [
      "Q10"
    ],
    questions: [
      {
        id: "D2_Q1",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q2",
        text: "0",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q3",
        text: "7",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q4",
        text: "-",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q5",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q6",
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q7",
        text: "2",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D3",
    name: "Values Alignment",
    count: 7,
    max_raw: 30,
    formula: "(raw/30) × 100",
    sub_dimensions: [
      "Purpose congruence",
      "Values articulacy",
      "Values conflict",
      "Organisational ethics fit",
      "Mission alignment",
      "Sustained purpose"
    ],
    reverse_coded: [
      "Q15"
    ],
    questions: [
      {
        id: "D3_Q1",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q2",
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q3",
        text: "3",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q4",
        text: "-",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q5",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q6",
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q7",
        text: "8",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D4",
    name: "Confidence & Self-Efficacy",
    count: 7,
    max_raw: 30,
    formula: "(raw/30) × 100",
    sub_dimensions: [
      "Role-specific confidence",
      "Challenge orientation",
      "Capability doubt",
      "Pressure confidence",
      "Adaptive self-efficacy",
      "APAC contextual confidence"
    ],
    reverse_coded: [
      "Q21"
    ],
    questions: [
      {
        id: "D4_Q1",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q2",
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q3",
        text: "9",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q4",
        text: "-",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q5",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q6",
        text: "2",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D4_Q7",
        text: "4",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D5",
    name: "Growth Orientation",
    count: 7,
    max_raw: 30,
    formula: "(raw/30) × 100",
    sub_dimensions: [
      "Development vs. mastery",
      "Challenge dependency",
      "Mastery preference",
      "Development seeking",
      "Learning curve preference",
      "APAC growth appetite"
    ],
    reverse_coded: [
      "Q27"
    ],
    questions: [
      {
        id: "D5_Q1",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q2",
        text: "2",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q3",
        text: "5",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q4",
        text: "-",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q5",
        text: "Q",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q6",
        text: "3",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D5_Q7",
        text: "0",
        type: "likert",
        reverse_coded: false
      }
    ]
  }
];

export const ALL_QUESTIONS: DRIVEQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
