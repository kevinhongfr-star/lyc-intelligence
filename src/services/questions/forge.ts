// ═══════════════════════════════════════════════════════════
// FORGE Question Bank — None
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface FORGEQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface FORGEDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: FORGEQuestion[];
}

export const INSTRUMENT = "FORGE";
export const FULL_NAME = "Strengths Orientation Assessment";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;

export const DIMENSIONS: FORGEDimensionBank[] = [
  {
    id: "D1",
    name: "ADAPTIVE LEARNING ORIENTATION (ALO)",
    count: 9,
    max_raw: 45,
    formula: "(raw/45) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q03", "Q05", "Q09"],
    questions: [
      {
        id: "Q01",
        text: "I actively seek operating contexts that will require me to develop capabilities I do not yet have, even when lower-risk options are available.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q02",
        text: "I am energised by operating challenges that expose gaps in my current capability.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q03",
        text: "I tend to gravitate toward leadership assignments where my current capabilities are well-matched to the requirements, rather than assignments that will stretch me significantly.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q04",
        text: "When I receive feedback that challenges how I see my own operating approach, I can process it without significant defensiveness.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q05",
        text: "I find it difficult to integrate feedback that is inconsistent with my own assessment of how I operate.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q06",
        text: "I have changed something significant about how I operate as a direct result of diagnostic or developmental feedback in the last two years.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q07",
        text: "When evidence contradicts an assumption I have been operating on, I update the assumption rather than looking for reasons the evidence is wrong.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q08",
        text: "I hold my current mental models of how leadership and organisations work with a degree of tentativeness — I know they are likely to need revision as conditions change.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q09",
        text: "I find it difficult to update long-held beliefs about how leadership should work even when my current operating environment provides consistent evidence that those beliefs are not serving me.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D2",
    name: "THREE FORCES AWARENESS (TFA)",
    count: 9,
    max_raw: 45,
    formula: "(raw/45) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q12", "Q15", "Q17"],
    questions: [
      {
        id: "Q10",
        text: "I can identify specific instances in my current operating context where bilateral governance complexity — the structural friction between two institutional systems — is creating constraints that are not primarily about individual relationships.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q11",
        text: "When I encounter difficulty in bilateral relationships, I naturally look for structural and governance explanations before attributing the difficulty to individuals.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q12",
        text: "I tend to explain bilateral operating challenges primarily in terms of the individuals involved rather than the governance structures they are operating within.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q13",
        text: "I can identify specific ways in which AI capability differences between my organisation and my bilateral partners are creating structural advantages or disadvantages in our professional relationships.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q14",
        text: "I have noticed at least one case in the past 12 months where AI tools have changed what a professional services partner or counterpart can produce — faster, cheaper, or at higher quality than before.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q15",
        text: "I do not see AI capability differences as a significant structural factor in my bilateral professional relationships at this stage.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q16",
        text: "I can identify specific instances in my current context where the gap between my organisation's internal decision cadence and the speed the market is requiring is creating material operating risk.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q17",
        text: "I see the tempo gap in my current operating environment as primarily a management execution problem rather than a structural feature of how organisations were built for a different era.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q18",
        text: "I can identify specific governance or succession decisions in my current context that are taking longer than the market environment allows.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D3",
    name: "DEVELOPMENT AGENCY (DA)",
    count: 9,
    max_raw: 45,
    formula: "(raw/45) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q20", "Q23", "Q26"],
    questions: [
      {
        id: "Q19",
        text: "I have a clear personal development focus for the next 12 months that I am actively managing, independent of what my organisation has structured for me.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q20",
        text: "Most of my development in the past three years has been structured by my organisation rather than self-directed.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q21",
        text: "I can articulate the specific gap I am trying to close in my leadership capability and how I am addressing it.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q22",
        text: "I am effective at identifying and engaging the specific coaches, peers, programmes, or diagnostic tools that address my current development priorities.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q23",
        text: "I wait for my organisation to provide development resources rather than seeking them out independently when institutional provision is inadequate.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q24",
        text: "In the past year, I have sought out at least one development resource (coach, programme, diagnostic, peer forum) that my organisation did not initiate or fund.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q25",
        text: "My development practices remain consistent during high-pressure operating periods — I do not abandon development when performance demands increase.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q26",
        text: "Development activity is the first thing I reduce when my operating schedule becomes demanding.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q27",
        text: "I have maintained my development practices through at least one period of significant operating pressure without substantially reducing them.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D4",
    name: "BILATERAL CONTEXT NAVIGATION (BCN)",
    count: 9,
    max_raw: 45,
    formula: "(raw/45) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q29", "Q32", "Q35"],
    questions: [
      {
        id: "Q28",
        text: "I function effectively in leadership situations where authority, accountability, and decision rights are genuinely shared and not fully resolved.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q29",
        text: "I find it difficult to perform at my best when the operating context requires me to act without clear authority over the decisions I need to influence.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q30",
        text: "I have experience leading effectively in bilateral contexts where the governance structure left significant ambiguity about who held final decision authority, and I managed this ambiguity without it significantly impairing my effectiveness.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q31",
        text: "I invest in the development of my bilateral counterparts — not just my own team — as part of how I build the bilateral relationship for long-term effectiveness.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q32",
        text: "I think of my development investment as something I extend primarily to the people I am formally responsible for, not to bilateral counterparts or partners.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q33",
        text: "I have at least one bilateral counterpart whose capability I am actively working to develop, and I can describe what I am doing and why.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q34",
        text: "When I am facing multiple simultaneous leadership challenges, I can identify the one that is most structurally significant and prioritise it without attempting to address all challenges at the same pace.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q35",
        text: "When multiple leadership challenges are active at the same time, I distribute my attention across all of them rather than sequencing them by structural priority.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q36",
        text: "I have a framework for deciding which of several concurrent operating challenges warrants the most focused leadership attention, and I apply it consistently.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  }
];

export const ALL_QUESTIONS: FORGEQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
