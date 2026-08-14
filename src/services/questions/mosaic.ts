// ═══════════════════════════════════════════════════════════
// MOSAIC Question Bank — Cross-Border Partnership Intelligence
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/MOSAIC_QB_notion.json
// ═══════════════════════════════════════════════════════════

export interface MOSAICQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface MOSAICDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: MOSAICQuestion[];
}

export const INSTRUMENT = "MOSAIC";
export const FULL_NAME = "Cross-Border Partnership Intelligence & Institutional Navigation";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 25;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 8;

export const DIMENSIONS: MOSAICDimensionBank[] = [
  {
    id: "D1",
    name: "INSTITUTIONAL TRUST",
    count: 8,
    max_raw: 40,
    formula: "(raw/40) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q7"],
    questions: [
      {
        id: "Q1",
        text: "When working with a partner organisation that operates under a different regulatory or governance framework, I am confident in my ability to make binding decisions without requiring institutional alignment first.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q2",
        text: "In partnerships where the legal enforceability of agreements is uncertain, I have built alternative trust mechanisms that allow the relationship to function effectively.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q3",
        text: "I have a clear understanding of which aspects of my current partnerships rely on institutional frameworks that may no longer be as reliable as they were three years ago.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q4",
        text: "I actively review my cross-border partnership structures for exposure to institutional trust degradation, as a distinct risk category from relationship risk.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q5",
        text: "When AI adoption rates differ significantly between my organisation and a partner, I treat the resulting capability asymmetry as a governance risk, not just an operational difference.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q6",
        text: "I have modified how I document cross-border decisions since 2020 to reflect changes in the institutional trust environment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q7",
        text: "I rely primarily on formal contractual frameworks to provide the trust scaffolding for my most important cross-border relationships.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q8",
        text: "I can describe specifically how the bilateral institutional trust environment has changed in the past five years, and how that change has affected at least one decision I have made or am making.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "RELATIONSHIP VELOCITY",
    count: 7,
    max_raw: 35,
    formula: "(raw/35) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q13"],
    questions: [
      {
        id: "Q9",
        text: "I can establish sufficient working trust with a new cross-border counterpart to make significant joint decisions within a significantly shorter timeframe than would have been standard in my sector ten years ago.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I have adapted my relationship-building approach to account for the increased velocity of business decisions in the environments I operate in.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I maintain a current network of cross-border relationships that can be activated quickly for decision support, without requiring a lengthy re-establishment phase.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "When AI has changed the nature of what a counterpart organisation does or how it operates, I have been able to adapt my understanding of that organisation quickly enough to maintain effective working relationships.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q13",
        text: "I prefer to establish a relationship over an extended period before engaging in significant joint decisions.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I have a deliberate process for maintaining relationship quality with cross-border counterparts during periods when direct contact is limited (regulatory restrictions, travel constraints, AI-mediated communication).",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "When a cross-border relationship requires rebuilding after a disruption (regulatory change, leadership change, AI-driven operational shift), I have a clear method for accelerating that rebuilding.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "NORMATIVE FLEXIBILITY",
    count: 5,
    max_raw: 25,
    formula: "(raw/25) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q19"],
    questions: [
      {
        id: "Q16",
        text: "I can identify, without prompting, the normative expectations of a counterpart environment that are not written in any governance document but that significantly affect how decisions are made.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I have changed how I present my own capabilities and role to cross-border counterparts as AI has changed what those counterparts expect senior professionals to be able to do.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I am comfortable making decisions that meet the normative expectations of one environment but might be interpreted differently in another, where both interpretations are legitimate.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q19",
        text: "I find it difficult to operate effectively when I am uncertain about the normative expectations of the environment I am in.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "When an AI capability change has altered what is considered a foundational professional skill in my sector, I have adjusted how I position my own expertise accordingly.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "CONFLICT RESOLUTION",
    count: 5,
    max_raw: 25,
    formula: "(raw/25) x 20",
    sub_dimensions: [],
    reverse_coded: ["Q24"],
    questions: [
      {
        id: "Q21",
        text: "When conflict arises in a cross-border partnership, I actively examine whether capability asymmetry (including AI-driven differences) may be a contributing factor, before attributing the conflict to cultural or personal causes.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "I have resolved a partnership conflict by naming and addressing an underlying capability asymmetry that neither party had previously identified as the source of friction.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I can distinguish between conflict that is caused by interpersonal friction, conflict caused by governance structure misalignment, and conflict caused by capability asymmetry — and I apply different resolution approaches to each.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "When a cross-border partnership conflict becomes difficult to resolve, I typically escalate it to a higher authority level to resolve.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q25",
        text: "I have modified my approach to conflict resolution in cross-border partnerships to account for the fact that AI adoption differences between partners may be producing friction that appears as communication or cultural misalignment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: MOSAICQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
