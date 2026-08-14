// ═══════════════════════════════════════════════════════════
// QUEST Question Bank — Qualified Executive Skills & Transition
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/QUEST_QB_notion.json
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
export const FULL_NAME = "Executive Performance Architecture";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 36;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 12;

export const DIMENSIONS: QUESTDimensionBank[] = [
  {
    id: "D1",
    name: "Strategic Thinking",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Direction articulation", "Pattern recognition", "Multi-horizon thinking", "Strategic linkage", "Assumption management", "Strategic translation"],
    reverse_coded: ["Q04"],
    questions: [
      {
        id: "Q01",
        text: "I can articulate the strategic direction of my organisation with precision — including the specific priorities, trade-offs, and time horizons that define it — without referencing documents or presentations.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I regularly identify patterns across market signals, competitive moves, and internal data that allow me to anticipate strategic challenges before they become visible to most others in my organisation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "I can hold the long-term strategic view and the near-term operational detail simultaneously — making decisions that serve both without sacrificing one for the other.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "I find it difficult to explain how the work of my function connects to the broader organisational strategy in terms that are meaningful to people outside my domain.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I can clearly describe the two or three assumptions that, if proved false, would require our current strategy to change materially — and I monitor those assumptions actively.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "When the organisational strategy changes significantly, I translate the implications into specific, actionable direction for my team without waiting for further guidance from above.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "Execution Excellence",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Organisational design for delivery", "Strategy-to-results conversion", "Execution consistency", "Performance visibility", "Accountability architecture", "Resource discipline"],
    reverse_coded: ["Q09"],
    questions: [
      {
        id: "Q07",
        text: "I have built organisational structures, role accountabilities, and performance rhythms that produce consistent results — even when I am not directly involved in day-to-day delivery.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "I can describe a specific initiative I led in the past two years where I translated a complex strategic goal into a measurable operational outcome on schedule and within resource constraints.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "My team often misses commitments or delivers below expectation even when the goal was clearly communicated — I find execution consistency difficult to sustain across my organisation.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I have a clear system for tracking progress against strategic priorities — one that gives me early warning when delivery is at risk, not just after the deadline has passed.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I hold accountabilities clearly across my organisation — people know precisely what they own, what success looks like, and what the consequence of non-delivery is.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I am comfortable making resource trade-off decisions — stopping or de-prioritising initiatives that are not delivering — rather than allowing underperforming programmes to continue consuming capacity.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "Commercial Acumen",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Value creation understanding", "Financial literacy", "Commercial confidence", "APAC commercial intelligence", "Commercial judgment under uncertainty", "Market intelligence application"],
    reverse_coded: ["Q15"],
    questions: [
      {
        id: "Q13",
        text: "I can articulate the specific mechanism by which my organisation creates value for customers and captures a portion of that value commercially — with enough precision to make credible resource allocation decisions.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I am comfortable interpreting financial statements and using financial data — revenue, margin, cash flow, unit economics — to make strategic and operational decisions in my domain.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I find commercial and financial conversations at the executive level difficult — I often rely on finance or commercial colleagues to interpret data before I can contribute meaningfully.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I understand the specific commercial dynamics of the APAC markets where I operate — including how pricing, customer relationships, channel structures, and competitive intensity differ from Western market norms.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I can make credible commercial decisions under uncertainty — recommending a course of action on pricing, market entry, or customer investment when the data is incomplete and the stakes are high.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I regularly use market intelligence — competitor moves, customer feedback, macro trends — to refine commercial direction, not just to confirm decisions already made.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "People Leadership",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Team architecture", "Succession development", "Team independence", "Dependency risk", "Individualised development", "High-stakes people decisions"],
    reverse_coded: ["Q22"],
    questions: [
      {
        id: "Q19",
        text: "I have deliberately built a team that is stronger than the sum of its individual members — where the team's collective capability exceeds what I could achieve by directing individuals separately.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "I can identify at least two people in my current team who are on a trajectory to operate at my level or above within the next three years — and I am actively investing in that trajectory.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "My team performs at a consistently high level when I am absent — they do not require my involvement in day-to-day decisions to maintain quality and pace.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "I tend to be the primary decision-maker on most significant issues in my team — when I am not available, pace slows and quality varies noticeably.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I tailor my leadership approach to the individual — adjusting how I challenge, support, and develop each person based on their specific capability profile, motivation, and growth stage.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "I have navigated difficult people decisions — performance management, restructuring, role elimination — in ways that preserved the trust and psychological safety of the broader team.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D5",
    name: "Adaptive Capacity",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Environmental scanning & response", "Pivot capability", "Ambiguity tolerance", "APAC change leadership", "Change resistance", "Adaptive track record"],
    reverse_coded: ["Q27", "Q29"],
    questions: [
      {
        id: "Q25",
        text: "When market conditions shift significantly, I identify the strategic implications for my organisation before most peers or competitors do, and I act on those implications with appropriate speed.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "I have successfully changed course on a significant strategic or operational initiative mid-execution — when new information made the original direction no longer viable — without losing stakeholder confidence in my leadership.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q27",
        text: "I perform at my best in stable, well-defined environments; when conditions are ambiguous or rapidly changing, my leadership effectiveness decreases noticeably.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q28",
        text: "I have led a team or organisation through a significant APAC regulatory, market, or stakeholder landscape shift — recalibrating strategy, structure, and priorities — while maintaining operational continuity.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q29",
        text: "I tend to maintain existing plans and commitments even when new information suggests the direction needs to change, because changing course in front of stakeholders feels like an admission of failure.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q30",
        text: "I can describe a specific instance in the past 12 months where I adapted my strategy or leadership approach in response to an external signal that others in my organisation had not yet acted on.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D6",
    name: "AI Readiness",
    count: 6,
    max_raw: 30,
    formula: "(raw/30) x 20",
    sub_dimensions: ["Decision Architecture Readiness", "Data Governance Awareness", "AI Ethics & Risk Oversight", "Organisational AI Adoption Leadership"],
    reverse_coded: ["Q33"],
    questions: [
      {
        id: "Q31",
        text: "I have a clear framework for deciding which organisational decisions should be informed or supported by AI and which should remain under direct human judgment — and I apply it actively.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q32",
        text: "I understand the data governance obligations that arise when AI is used in my organisation's decision-making processes — including who is accountable when AI-influenced decisions produce adverse outcomes.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q33",
        text: "I rely primarily on my technical colleagues to determine how AI should be governed in my organisation — I don't see AI governance as a core leadership accountability at my level.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q34",
        text: "I have led — or actively participated in — an organisational initiative to adopt or scale an AI tool or capability, including managing the change, resistance, and capability-building that adoption required.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q35",
        text: "When AI-generated analysis conflicts with my own judgment or intuition, I have a disciplined process for evaluating which to follow — rather than defaulting automatically to either the AI output or my instinct.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q36",
        text: "I can articulate the specific ethical and reputational risks that AI deployment creates in my organisation's context — and I hold accountability for ensuring those risks are governed, not just identified.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: QUESTQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
