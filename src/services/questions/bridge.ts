export interface BRIDGEQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface BRIDGEDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: BRIDGEQuestion[];
}

export const INSTRUMENT = "BRIDGE";
export const FULL_NAME = "BRIDGE — Cross-Border Leadership Execution";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = BRIDGE — Cross-Border Leadership Execution draft derived from reportPipeline.
export const B2C_NAME = "BRIDGE — Cross-Border Leadership Execution";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = BRIDGE — Cross-Border Leadership Execution draft derived from reportPipeline.
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;

export const DIMENSIONS: BRIDGEDimensionBank[] = [
  {
    id: "D1",
    name: "Mandate Clarity",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q04"],
    questions: [
      {
        id: "Q01",
        text: "I have a specific, detailed understanding of what this mandate requires — not just the job title and general scope, but the specific outcomes the organisation needs in the next 18 months.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I can articulate how this mandate is different from any previous role I have held — and specifically what those differences require of me.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "I have had direct conversations with the board or key principals about what success looks like in this mandate, and I have a clear shared picture of that definition.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "I find that my understanding of what the mandate requires becomes clearer as I go, rather than having a clear picture at the outset.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I understand the specific organisational history, stakeholder politics, and market dynamics that define this mandate — not just the role description.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "I can identify the two or three things that, if I get them wrong in the first 90 days, will make this mandate much harder to recover.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "Stakeholder Navigation",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q10"],
    questions: [
      {
        id: "Q07",
        text: "I have a structured approach to mapping the key stakeholders in a new APAC mandate context — including stakeholders who are not formally in my reporting line but whose support is essential.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "In high-context APAC business environments, I invest deliberately in relationships before those relationships are needed — not in response to a specific transaction or requirement.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "I have maintained a key APAC stakeholder relationship through a period of significant tension or misalignment — and the relationship emerged stronger.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I find transactional relationship-building (connecting when I need something) more natural than investing in relationships before a specific need arises.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I can read the informal power structures in an APAC organisation — who has real influence, who the key relationship brokers are, and how decisions actually get made.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I approach APAC government or political stakeholder relationships with the same investment and patience I apply to business relationships.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "Communication Alignment",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q16"],
    questions: [
      {
        id: "Q13",
        text: "I have adapted my natural communication style significantly to operate effectively in an APAC cross-border mandate — and I can describe specifically how I adapted.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I understand how my natural communication style — specifically its directness, debate orientation, or assertiveness — is read in the target APAC market.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I check for understanding and alignment in APAC stakeholder conversations rather than assuming agreement because no objection was raised.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I default to my natural communication style under pressure, even when I know it creates friction in the APAC context I am operating in.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I can deliver difficult messages — performance feedback, strategic disagreement, expectation misalignment — in ways that are heard and received in APAC relational contexts.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I read silence, indirection, and non-verbal cues in APAC stakeholder conversations as information, not as absence of a view.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "Pressure Resilience",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q22"],
    questions: [
      {
        id: "Q19",
        text: "I can identify, in advance, the specific types of mandate pressure that are most likely to change my behaviour in ways that are unhelpful — and I have strategies for those specific situations.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "When a key stakeholder relationship fails or significantly deteriorates in a mandate context, I recover my effectiveness quickly.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "Under sustained pressure from headquarters, the local team, and the market simultaneously, my decision quality holds.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "When the mandate becomes politically difficult, I become more risk-averse and less willing to have the conversations that are needed.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I can sustain my mandate focus and performance through an extended period of uncertainty, without requiring resolution of the uncertainty before I continue to act.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "I have specific early-warning indicators that tell me when my own performance is degrading under mandate pressure — and I act on those indicators before the degradation becomes visible to others.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D5",
    name: "Long-Game Thinking",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q28"],
    questions: [
      {
        id: "Q25",
        text: "I am comfortable investing in APAC relationships and trust-building over a 3–5 year timeline, even when there is no immediate transactional return on that investment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "I resist pressure — from headquarters, from myself, or from the quarterly results cycle — to generate short-term wins at the expense of long-term relationship capital.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q27",
        text: "I can articulate specific examples of decisions I have made in APAC mandates that sacrificed short-term results to preserve or build long-term relationship trust.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q28",
        text: "I find it difficult to invest in relationships or initiatives where the return is more than 12 months away, particularly when short-term results are under pressure.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q29",
        text: "I understand that in APAC's relationship economy, my reputation is built over years — and I make decisions with that timeline in mind.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q30",
        text: "I can work patiently within a 3–5 year trust-building cycle with government or institutional APAC stakeholders, even when commercial pressure creates urgency.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D6",
    name: "Cultural Fluency",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q35"],
    questions: [
      {
        id: "Q31",
        text: "I have a specific, current understanding of the cultural norms — around hierarchy, consensus, face-saving, and relationship-first communication — in the target APAC market I am entering.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q32",
        text: "When I have made a cultural misstep in an APAC context, I have been able to identify what happened, repair the relationship, and adjust my approach.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q33",
        text: "I understand how decision-making operates in the specific APAC governance context I am entering — including the informal processes and relationship dynamics that run alongside the formal structure.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q34",
        text: "I treat cultural differences in the target APAC market as context to understand and adapt to, rather than as friction to overcome.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q35",
        text: "I find that my instinctive approach to leadership — my default behaviours under pressure — is culturally compatible with the APAC market I am entering.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q36",
        text: "I have built genuine relationships with APAC-native colleagues, clients, or stakeholders that are not primarily transactional — relationships where cultural understanding is mutual rather than one-directional.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: BRIDGEQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
