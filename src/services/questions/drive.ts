export interface DRIVEQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface DRIVEDimensionBank {
  id: string;
  name: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: DRIVEQuestion[];
}

export const INSTRUMENT = "DRIVE";
export const FULL_NAME = "DRIVE — Motivation Profile & Engagement Risk";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = DRIVE — Motivation Profile & Engagement Risk draft derived from reportPipeline.
export const B2C_NAME = "DRIVE — Motivation Profile & Engagement Risk";
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = DRIVE — Motivation Profile & Engagement Risk draft derived from reportPipeline.
export const VERSION = "2.0";
export const TOTAL_QUESTIONS = 30;
export const SCALE = "1-5 Likert";
export const DELIVERY_MINUTES = 10;

export const DIMENSIONS: DRIVEDimensionBank[] = [
  {
    id: "D1",
    name: "Intrinsic Motivation",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [
      "Task engagement",
      "Intellectual curiosity",
      "Autonomy drive",
      "Flow state frequency",
      "Craft motivation",
      "APAC intrinsic resonance"
    ],
    reverse_coded: ["Q03"],
    questions: [
      {
        id: "Q01",
        text: "The work itself — the intellectual challenge, the problem-solving, the craft — is the primary reason I remain in my current role, not the compensation, the organisation, or external recognition.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q02",
        text: "I am most motivated when I am working on complex, demanding tasks that require my full attention — routine or administrative work drains my energy regardless of the external rewards attached.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q03",
        text: "If the external rewards were sufficient — compensation, title, recognition — I would remain engaged even in work I find intellectually undemanding or unstimulating.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q04",
        text: "There are moments in my current role when I become so absorbed in the work that I lose track of time — a state of flow that I find deeply motivating in itself.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q05",
        text: "I would stay in my current role even if the external conditions deteriorated — the quality of the work itself is sufficient to sustain my motivation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q06",
        text: "In APAC cross-border assignments — where the cultural complexity, ambiguity, and relational demands are inherently rich — I find the work itself more motivating than in simpler, more familiar contexts.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D2",
    name: "Extrinsic Motivation",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [
      "Recognition sensitivity",
      "Reward orientation",
      "Recognition scope",
      "Extrinsic independence",
      "Visibility drive",
      "Progression drive"
    ],
    reverse_coded: ["Q10"],
    questions: [
      {
        id: "Q07",
        text: "Visible recognition of my contributions — from senior stakeholders, from the organisation, or from my professional community — is an important source of motivation for me.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q08",
        text: "The compensation, title, and status associated with my current role are meaningful motivating factors — not incidental to my engagement.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q09",
        text: "When I achieve a significant result, I want it acknowledged — being told quietly that I did well is not enough; I want the recognition to match the contribution.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q10",
        text: "I would be equally motivated in a role that paid significantly less, as long as the work itself was interesting and the mission was meaningful.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q11",
        text: "My motivation increases measurably when I am in a high-visibility role — where my work and results are seen by senior leadership or the broader organisation.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q12",
        text: "Career progression — movement to more senior titles, expanded scope, higher compensation — is an active and ongoing motivator for me, not just a background assumption.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D3",
    name: "Values Alignment",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [
      "Purpose congruence",
      "Values articulacy",
      "Values conflict",
      "Organisational ethics fit",
      "Mission alignment",
      "Sustained purpose"
    ],
    reverse_coded: ["Q15"],
    questions: [
      {
        id: "Q13",
        text: "My daily work reflects what I believe is genuinely important — ethically, professionally, and in terms of the impact I want to have.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q14",
        text: "I can clearly articulate why the work I do matters — not just commercially or organisationally, but in terms of what I personally value.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q15",
        text: "I am being asked to do things in my current role that conflict with what I believe is right — creating a nagging sense of misalignment I cannot easily resolve.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q16",
        text: "The organisation I work for conducts itself in ways that align with my personal ethical commitments — I am not required to suppress my values to succeed here.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q17",
        text: "My current role allows me to contribute to something larger than commercial outcomes — to a purpose or mission I personally believe in.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q18",
        text: "Even when external conditions are difficult — the work is hard, the organisation is under pressure — I feel that what I am doing matters in a way that sustains my commitment.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D4",
    name: "Confidence & Self-Efficacy",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [
      "Role-specific confidence",
      "Challenge orientation",
      "Capability doubt",
      "Pressure confidence",
      "Adaptive self-efficacy",
      "APAC contextual confidence"
    ],
    reverse_coded: ["Q21"],
    questions: [
      {
        id: "Q19",
        text: "I believe I am capable of handling whatever challenges arise in my current role — including the ones I have not encountered yet.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q20",
        text: "When I face a significant challenge at work, my default response is to lean in — to believe I can figure it out rather than to doubt whether I am the right person for it.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q21",
        text: "I have a growing sense that the demands of my current role may be exceeding my capability — and that concern is affecting my performance and my wellbeing.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q22",
        text: "My confidence in my own judgment and capability holds under pressure — I do not significantly second-guess myself when the stakes are high or the situation is ambiguous.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q23",
        text: "I have made a significant career transition — new sector, new geography, new level of seniority — and successfully rebuilt my confidence and effectiveness in the new context.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q24",
        text: "In APAC cross-border contexts — where the cultural, relational, and operational demands differ significantly from my baseline — I feel genuinely capable, not just technically competent.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  },
  {
    id: "D5",
    name: "Growth Orientation",
    count: 6,
    max_raw: null,
    formula: null,
    sub_dimensions: [
      "Development vs. mastery",
      "Challenge dependency",
      "Mastery preference",
      "Development seeking",
      "Learning curve preference",
      "APAC growth appetite"
    ],
    reverse_coded: ["Q27"],
    questions: [
      {
        id: "Q25",
        text: "I am more energised by assignments that require me to develop new skills than by assignments where I can apply expertise I have already built.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q26",
        text: "When my current role stops being challenging — when I feel I have largely mastered what it requires — my motivation declines noticeably, even if external conditions are favourable.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q27",
        text: "I prefer to operate in domains where I have deep established expertise — new challenges that require me to start from scratch are more uncomfortable than energising.",
        type: "likert",
        reverse_coded: true,
        options: null,
        scale_labels: null
      },
      {
        id: "Q28",
        text: "I actively seek feedback and development input — not because it is expected, but because I am genuinely motivated by becoming more capable.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q29",
        text: "I would take a role with a significantly steeper learning curve over a role where I would be immediately effective, if both were otherwise comparable.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      },
      {
        id: "Q30",
        text: "Taking on a new APAC mandate — with its unfamiliar regulatory, cultural, and relational complexity — is the kind of challenge that energises rather than intimidates me.",
        type: "likert",
        reverse_coded: false,
        options: null,
        scale_labels: null
      }
    ]
  }
];

export const ALL_QUESTIONS: DRIVEQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);
