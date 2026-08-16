// ═══════════════════════════════════════════════════════════
// PRISM Question Bank — None
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface PRISMQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface PRISMDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: PRISMQuestion[];
}

export const INSTRUMENT = "PRISM";
export const FULL_NAME = "PRISM — professional branding";
export const B2C_NAME = "PRISM — professional branding";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;

export const DIMENSIONS: PRISMDimensionBank[] = [
  {
    id: "D1",
    name: "Brand Clarity",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q04"],
    questions: [
      {
        id: "Q01",
        text: "I can articulate, in two sentences, what I specifically offer that is distinct from other senior leaders in my field.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q02",
        text: "When people ask what I do, I have a clear and consistent answer that accurately reflects the value I create.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q03",
        text: "I know exactly what I want to be known for in the next stage of my career — and it is different from what I am currently known for.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q04",
        text: "I find it difficult to explain my unique contribution without listing my roles or credentials.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q05",
        text: "The people who advocate for me in rooms I'm not in can easily articulate what makes me distinctive.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q06",
        text: "My professional identity has a clear centre — a specific expertise or perspective that connects everything I do.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D2",
    name: "Market Legibility",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q10"],
    questions: [
      {
        id: "Q07",
        text: "My career story — including my cross-border and cross-cultural experience — is easy for APAC boards and search firms to read and value.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q08",
        text: "I can point to specific results I have achieved that are legible and compelling in APAC business contexts.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q09",
        text: "APAC-native organisations understand what I bring without me needing to extensively explain my background.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q10",
        text: "I notice that my APAC cross-border experience is harder to communicate to Western boards and search firms than to APAC-native ones.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q11",
        text: "I have named stakeholder relationships in my target APAC markets that strengthen my credibility with decision-makers in those markets.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q12",
        text: "My professional profile — CV, LinkedIn, verbal narrative — explains my cross-border career in a way that creates a clear and compelling picture for APAC audiences.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D3",
    name: "Identity Consistency",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q16"],
    questions: [
      {
        id: "Q13",
        text: "My professional identity is consistent whether I am speaking to a board, a peer, a client, or a search firm.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q14",
        text: "The story I tell about myself on LinkedIn is consistent with what I say in a job interview or board conversation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q15",
        text: "I adapt my communication style to different audiences, but the core of what I stand for stays consistent.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q16",
        text: "I notice that I present myself quite differently depending on the audience — and I'm not sure which version is the real one.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q17",
        text: "If someone compared my LinkedIn profile, my CV, and my verbal introduction, they would find a consistent and coherent professional identity.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q18",
        text: "My various professional roles — executive, board member, advisor — are connected by a consistent identity, not pulled in different directions.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D4",
    name: "Narrative Power",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q22"],
    questions: [
      {
        id: "Q19",
        text: "I can tell my career story in a way that makes clear not just what I did, but why it matters and what it means for my next contribution.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q20",
        text: "I frame my achievements in terms of the judgment I exercised and the outcomes I created — not just the roles I held.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q21",
        text: "When I describe my career trajectory, people understand why each move made sense and where I am heading.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q22",
        text: "I find it easier to describe what I have done than to articulate what it says about my leadership or my future value.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q23",
        text: "My professional story has a through-line — a logic that connects my past to my present to my future that is visible to others.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q24",
        text: "I can calibrate my career narrative for different audiences — adjusting the emphasis without losing the coherence or the core story.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  },
  {
    id: "D5",
    name: "Visibility Level",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q28"],
    questions: [
      {
        id: "Q25",
        text: "I am known by the search firms, board nomination committees, or senior networks that are most relevant to my next career move.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q26",
        text: "My thought leadership — whether written, spoken, or shared — reaches the people who matter most to my career trajectory.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q27",
        text: "My network actively creates opportunities for me — introducing me, advocating for me, and opening doors I don't know exist.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q28",
        text: "I am largely invisible to the search firms and senior networks that are most relevant to my target next role.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q29",
        text: "Industry peers, board members, or senior stakeholders regularly seek out my perspective on relevant topics.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      },
      {
        id: "Q30",
        text: "I have a deliberate visibility strategy — I am intentionally building presence in the communities where my next opportunity is most likely to emerge.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: ["Strongly disagree", "Strongly agree"]
      }
    ]
  }
];

export const ALL_QUESTIONS: PRISMQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
