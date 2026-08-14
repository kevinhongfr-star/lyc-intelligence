// ═══════════════════════════════════════════════════════════
// COACH Question Bank — Coaching Readiness Assessment
// Source of truth: akira_source/diagnostic_portfolio/07_question_banks/COACH_QB_notion.json
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
export const FULL_NAME = "Coaching Readiness & Manager-as-Coach Capability";
export const VERSION = "1.0";
export const TOTAL_QUESTIONS = 26;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 8;

export const DIMENSIONS: COACHDimensionBank[] = [
  {
    id: "D1",
    name: "COACH MINDSET",
    count: 5,
    max_raw: 25,
    formula: "(raw/25) x 20",
    sub_dimensions: ["A. Belief in potential", "B. Internal locus of control"],
    reverse_coded: [],
    questions: [
      {
        id: "Q1",
        text: "I genuinely believe that most people I work with have more potential than they are currently using.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q2",
        text: "I view underperformance as a solvable problem rather than as a fixed personal characteristic.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q3",
        text: "When a team member faces a challenge, my first instinct is to help them think it through, not to solve it for them.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q4",
        text: "I am comfortable holding people accountable for outcomes while also supporting them in how they get there.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q5",
        text: "I see development as a core part of my role, not as a separate activity for an L&D function.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "COACH SKILLSET",
    count: 7,
    max_raw: 35,
    formula: "(raw/35) x 20",
    sub_dimensions: ["A. Active listening & reflecting", "B. Powerful questioning", "C. Contracting, structure & presence"],
    reverse_coded: [],
    questions: [
      {
        id: "Q6",
        text: "In a typical conversation with a direct report or colleague, I listen more than I speak.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q7",
        text: "I am able to paraphrase accurately what someone has said so that they feel genuinely understood.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q8",
        text: "When someone brings me a problem, I consistently ask open, curious questions before proposing a solution.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q9",
        text: "I can ask challenging questions without creating defensiveness or shutting the other person down.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "At the start of a 1:1 or coaching conversation, I am explicit about what we are there to do and what success looks like.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "I can stay present and calm in a conversation even when the other person is frustrated, emotional, or challenging.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "I give specific, behaviourally grounded feedback rather than general evaluative praise or criticism.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "COACH TOOLKIT",
    count: 7,
    max_raw: 35,
    formula: "(raw/35) x 20",
    sub_dimensions: ["A. Goal-setting frameworks", "B. Developmental coaching models", "C. Performance & accountability conversations"],
    reverse_coded: ["Q19"],
    questions: [
      {
        id: "Q13",
        text: "When a team member sets a development goal, I use a structured framework (OKR-style, SMART, GROW, or equivalent) to make it concrete.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I can adapt my approach depending on whether a conversation is about career development, current role performance, or a specific problem to solve.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I have a clear structure for identifying what belief or assumption might be holding someone back, beyond the surface problem.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "I know how to move a conversation from insight to action so that next steps are specific, owned, and time-bound.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "I can recognise when a situation calls for a coaching approach, when it calls for direction, and when it calls for advice — and I choose appropriately.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "I have a repeatable method for following up on commitments made in 1:1s or coaching conversations.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q19",
        text: "I use the same basic conversation structure for most 1:1s regardless of the person or topic.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "COACH DISCIPLINE",
    count: 7,
    max_raw: 35,
    formula: "(raw/35) x 20",
    sub_dimensions: ["A. Frequency & consistency", "B. Ownership & boundaries", "C. Measurement & review"],
    reverse_coded: ["Q25", "Q26"],
    questions: [
      {
        id: "Q20",
        text: "Each of my direct reports has at least one dedicated, undistracted 1:1 or coaching conversation with me every two weeks.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "My coaching conversations are protected time — I do not let other tasks or interruptions routinely encroach on them.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "I am clear with my team members that their development is their responsibility, and that my role is to support them in it.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I can identify the 'right not to solve' — the problems that I deliberately do not solve because I want the other person to develop by solving them.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "Periodically (quarterly or equivalent) I review how effective my coaching has been, with input from the people I coach.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q25",
        text: "If a team member is struggling, my default is to increase the frequency of my direction and input, not the frequency of my coaching.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "I usually skip or reschedule 1:1s if the week is busy with operational priorities.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: COACHQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
