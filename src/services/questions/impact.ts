// ═══════════════════════════════════════════════════════════
// IMPACT Question Bank — Board Effectiveness Assessment
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/
//   IMPACT_QB_notion.json + impact_config.json
// X2-4: 5 dimensions · 30 questions · 1-5 Likert · 8 board archetypes.
// Team/org focus — bridges individual and team leadership.
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
export const FULL_NAME = "Board Effectiveness Assessment";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 15;

export const DIMENSIONS: IMPACTDimensionBank[] = [
  {
    id: "D1",
    name: "Strategic Oversight",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q04"],
    questions: [
      {
        id: "Q01",
        text: "I consistently ask questions in board discussions that challenge the strategic assumptions underlying management's proposals.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I am able to identify strategic risks that management has not surfaced — and I raise them.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "I distinguish between my role as a board member (governing strategy) and the executive's role (creating strategy), and I hold that boundary clearly.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "I find that I tend to ratify management's strategic proposals rather than challenging their underlying logic. [R]",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I bring a point of view to strategic board discussions that adds genuine value — not just process compliance or broad agreement.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "I can evaluate strategic options at board level with genuine analytical independence, rather than relying entirely on management's framing.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "Governance Rigour",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q10"],
    questions: [
      {
        id: "Q07",
        text: "I apply my fiduciary responsibilities with consistent rigour, even when it creates tension with management.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "I can identify when a governance risk has reached the threshold requiring board escalation — and I act on that judgment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "I hold management accountable for their commitments in a way that is clear and consistent without undermining their authority to operate.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I sometimes defer to the dominant voice in the boardroom rather than pressing a governance concern I believe is valid. [R]",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I understand the specific fiduciary and regulatory obligations that apply to my board role in the markets I operate in.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I can distinguish between governance risk and operational risk — and I engage at the governance level without overreaching into operations.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "Stakeholder Intelligence",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q16"],
    questions: [
      {
        id: "Q13",
        text: "I have a clear and current map of the key stakeholders my board mandate requires me to understand and engage.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I navigate the dynamics between independent directors and management with deliberate intelligence — I understand where the power sits and how to engage it effectively.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "In APAC governance contexts, I am comfortable operating in environments where government or political stakeholders have a direct relationship with the board.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I find APAC government-board stakeholder dynamics more difficult to navigate than investor or management stakeholders. [R]",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I understand how major shareholder dynamics — including controlling family or state shareholders — affect board decision-making in the markets I operate in.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I bring useful stakeholder intelligence into board discussions — insights about investors, regulators, or market dynamics that strengthen the board's collective picture.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "Mandate Legacy",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q21"],
    questions: [
      {
        id: "Q19",
        text: "I think explicitly about the long-term legacy this board's decisions will create — not just the near-term performance metrics.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "I advocate for decisions that protect the organisation's long-term health, even when they create short-term costs or discomfort.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "I am more focused on the organisation's current performance metrics than on the lasting value the board is building. [R]",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "I think carefully about what institutional knowledge, governance standards, and values I am contributing to this organisation's enduring capability.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I consider what the board's track record will look like in 10 years — and I make governance decisions with that perspective in mind.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "I push back when I believe a decision optimises for short-term optics at the expense of long-term institutional credibility.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D5",
    name: "APAC Mandate Credibility",
    count: 6,
    max_raw: 30,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ["Q28"],
    questions: [
      {
        id: "Q25",
        text: "My board or advisory profile — including my experience, network, and governance background — creates genuine credibility with APAC-native stakeholders.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "I understand the governance and regulatory expectations of the specific APAC markets my board role requires me to engage (e.g., MAS in Singapore, CSRC/CAC in China, TSE reform standards in Japan).",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q27",
        text: "I have been able to build or access the APAC relationships needed to carry my board mandate effectively in the markets that matter.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q28",
        text: "When I am in a room with senior APAC business leaders, government officials, or regulators, I can tell that my authority does not fully land in the way I would like it to. [R]",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q29",
        text: "I understand the cultural norms — around consensus, hierarchy, face-saving, and relationship-first communication — that shape governance conversations in APAC board contexts.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q30",
        text: "My APAC governance credibility is actively strengthening — I am investing in the relationships, experience, and market intelligence that will deepen it over time.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: IMPACTQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
