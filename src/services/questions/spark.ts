// ═══════════════════════════════════════════════════════════
// SPARK Question Bank — None
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
// ═══════════════════════════════════════════════════════════

export interface SPARKQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface SPARKDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: SPARKQuestion[];
}

export const INSTRUMENT = "SPARK";
export const FULL_NAME = "SPARK — AI Leadership Readiness";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = SPARK — AI Leadership Readiness draft derived from reportPipeline.
export const B2C_NAME = "SPARK — AI Leadership Readiness";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = SPARK — AI Leadership Readiness draft derived from reportPipeline.
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 27;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 9;

export const DIMENSIONS: SPARKDimensionBank[] = [
  {
    id: "D1",
    name: "INDIVIDUAL AI ADOPTION READINESS (IAAR)",
    count: 9,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q03", "Q05", "Q08"],
    questions: [
      {
        id: "Q01",
        text: "I currently use AI tools as part of my regular professional workflow, not just for occasional experimentation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I have integrated at least one AI-enabled capability into how I produce or review professional work in the last six months.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "My use of AI tools in my professional practice remains largely experimental and has not changed how I actually deliver work.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "I am willing to restructure professional workflows that I have used successfully for years if AI tools can produce the same or better output more efficiently.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I am resistant to changing how I do professional work even when there is evidence that AI tools could produce comparable results faster.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "I actively look for established workflows in my professional practice that could be improved or replaced by AI tools.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q07",
        text: "I can evaluate the output of AI tools in my professional domain with enough expertise to identify errors, gaps, and limitations without relying on external verification.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "I am concerned that I do not yet have the professional judgment required to identify when an AI-generated output in my domain is wrong in ways that are not immediately obvious.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "I treat AI-generated professional outputs as drafts that require expert review, not as finished work that can be used without verification.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "CAPABILITY EXPOSURE ASSESSMENT (CEA)",
    count: 9,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q11", "Q14", "Q17"],
    questions: [
      {
        id: "Q10",
        text: "I have a clear and current understanding of which AI capabilities are now available in my specific professional domain and what they can produce.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I am uncertain about which AI tools are currently being used in my professional domain and what they are capable of doing at the level my clients or counterparts would expect.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I can explain to a senior colleague or client what AI-enabled capabilities are now available in my domain, without significant gaps in my knowledge.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q13",
        text: "I can identify at least two or three professional capabilities I currently possess that are at meaningful risk of being deprecated by AI tools within the next five years.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I am confident that the professional capabilities I have developed over my career will remain as valuable in ten years as they are today.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I have made a deliberate assessment of which of my current professional capabilities are most at risk from AI adoption and which will become more valuable as a result.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I have a reasonably clear picture of the difference between my organisation's AI adoption level and the AI adoption level of my primary bilateral partner organisation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I have not actively assessed whether my bilateral partner organisation is ahead of or behind my organisation in AI capability adoption.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I am aware of at least one specific way in which AI capability asymmetry between my organisation and a bilateral partner has already created a structural advantage or disadvantage in our relationship.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "ORGANISATIONAL PREPAREDNESS (OP)",
    count: 9,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q21", "Q24", "Q26"],
    questions: [
      {
        id: "Q19",
        text: "My organisation has a defined policy for which AI tools can be used by professional staff and under what conditions.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "My organisation has a process for reviewing AI-generated professional outputs before they are delivered to clients or used in decision-making.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "My organisation has no formal governance structure for AI tool adoption, and professional staff make their own choices about what to use.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "My organisation has the data access and data quality standards required to deploy AI tools effectively in professional services delivery.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "My organisation's data is organised and accessible in a way that would allow AI tools to be applied systematically rather than only on a case-by-case basis.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "Data quality and access limitations are a significant constraint on my organisation's ability to deploy AI tools beyond isolated use cases.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q25",
        text: "My organisation is actively investing in developing its professional staff's capability to use AI tools effectively — not just providing access to tools, but building the skills to use them well.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "My organisation's approach to AI capability is primarily tool procurement rather than capability development in its professional workforce.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q27",
        text: "My organisation has a clear view of which professional capabilities need to be developed in its workforce to capture the productivity gains that AI tools can produce.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: SPARKQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
