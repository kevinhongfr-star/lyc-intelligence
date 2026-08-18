// ═══════════════════════════════════════════════════════════
// IMPACT Question Bank — Organisational Impact & Leadership Legacy
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface IMPACTQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface IMPACTDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: IMPACTQuestion[];
}

export const INSTRUMENT = "IMPACT";
export const FULL_NAME = "Organisational Impact & Leadership Legacy";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;

export const DIMENSIONS: IMPACTDimensionBank[] = [
  {
    id: "D1",
    name: "Strategic Impact",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
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
    name: "Operational Impact",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
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
    name: "People Impact",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
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
    name: "Cultural Impact",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
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
    name: "Market Impact",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
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

export const ALL_QUESTIONS: IMPACTQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
