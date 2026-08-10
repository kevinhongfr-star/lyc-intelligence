// ═══════════════════════════════════════════════════════════
// QUEST Question Bank — Qualified Executive Skills & Transition
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface QUESTQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface QUESTDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: QUESTQuestion[];
}

export const INSTRUMENT = "QUEST";
export const FULL_NAME = "Qualified Executive Skills & Transition";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 14;

export const DIMENSIONS: QUESTDimensionBank[] = [
  {
    id: "D1",
    name: "Strategic Clarity",
    count: 10,
    max_raw: 50,
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
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D1_Q7",
        text: "0",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D2",
    name: "Adaptability",
    count: 10,
    max_raw: 50,
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
        text: "1",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q3",
        text: "1",
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
        text: "2",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D2_Q7",
        text: "0",
        type: "likert",
        reverse_coded: false
      }
    ]
  },
  {
    id: "D3",
    name: "Decision Quality",
    count: 10,
    max_raw: 50,
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
        text: "2",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q3",
        text: "1",
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
        text: "3",
        type: "likert",
        reverse_coded: false
      },
      {
        id: "D3_Q7",
        text: "0",
        type: "likert",
        reverse_coded: false
      }
    ]
  }
];

export const ALL_QUESTIONS: QUESTQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
