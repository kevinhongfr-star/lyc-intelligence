// ═══════════════════════════════════════════════════════════
// COACH Question Bank — None
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface COACHQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface COACHDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: COACHQuestion[];
}

export const INSTRUMENT = "COACH";
export const FULL_NAME = "Bilateral Coaching Readiness & Leadership Development Architecture";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 24;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 9;

export const DIMENSIONS: COACHDimensionBank[] = [
  {
    id: "D1",
    name: "CROSS-BOUNDARY DEVELOPMENTAL ORIENTATION (CBDO)",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "Q01",
        text: "I invest as much deliberate effort in developing the capability of my bilateral counterparts as I do in developing my own direct reports.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I view developing my bilateral partner's team as part of my leadership responsibility, not as a discretionary investment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "I find it difficult to justify spending development energy on people who are not formally part of my team.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "When a bilateral counterpart learns at a different pace than I expect, I adjust my development approach rather than reducing my investment in their development.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I find it frustrating when my counterparts are slower to develop capability than I think they should be, and this affects the quality of my coaching conversations with them.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "I can sustain a genuine developmental orientation toward someone who is operating at a significantly slower learning pace than I do, without signalling impatience.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "ADAPTIVE COACHING STYLE (ACS)",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "Q07",
        text: "I have more than one coaching approach and I deliberately select the approach based on the context, the person, and the relationship.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "I tend to use the same coaching approach with most of the people I develop, regardless of their context or learning style.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "I can describe the specific differences between how I coach someone who needs challenge versus someone who needs support, and I apply these differences consistently.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I adapt the directness, tone, and structure of my feedback conversations depending on the cultural context of the person I am coaching.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I apply the same standards of directness in developmental feedback across all of the cultural contexts I work in.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I have received feedback that my coaching approach does not land well in certain cultural contexts, and I have changed my approach as a result.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "BILATERAL DEVELOPMENTAL RELATIONSHIP QUALITY (BDRQ)",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "Q13",
        text: "I have built developmental relationships with bilateral counterparts where the level of trust is comparable to the best developmental relationships I have with my own direct reports.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I find it takes significantly longer to build the level of trust required for honest developmental conversations with bilateral counterparts than with people on my own team.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I have a specific approach for building developmental trust across institutional and cultural boundaries that I apply consistently.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I can hold bilateral counterparts accountable for commitments they have made in developmental conversations without it damaging the relationship or triggering a defensive response.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I tend to be less direct about holding bilateral counterparts accountable for development commitments than I would be with my own direct reports, because of the relationship complexity.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I have effective strategies for re-engaging a bilateral counterpart who has not followed through on a developmental commitment, without escalating the conversation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "COACHING UNDER BILATERAL CONSTRAINTS (CBC)",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: [],
    questions: [
      {
        id: "Q19",
        text: "When the bilateral partnership is under significant performance or time pressure, I maintain a coaching orientation with my counterparts rather than defaulting to directive instructions.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "Under high pressure, I revert to telling people what to do rather than coaching them to reach their own decision, even when I know a coaching approach would be more effective in the long run.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "I can identify the specific conditions under which I am most likely to abandon a coaching approach, and I have strategies for maintaining it even in those conditions.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "I can coach effectively in situations where it is structurally unclear who holds decision authority — where the authority is genuinely shared and contested.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I find it difficult to maintain a coaching stance when I am unclear about whether I have the authority to hold the person I am coaching accountable for their commitments.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "Authority ambiguity in a bilateral context does not materially affect the quality of my developmental conversations with my counterparts.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: COACHQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
