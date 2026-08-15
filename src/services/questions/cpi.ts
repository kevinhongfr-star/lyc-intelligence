// ═══════════════════════════════════════════════════════════
// CPI Question Bank — Career Positioning Index (B2C single-rater port)
// X2-1: Flagship executive self-awareness assessment.
// 6 dimensions · 30 Likert questions · 6 archetypes · ~15 minutes.
// Source: B2B CPI framework (Strategic Orientation, Cross-Border
// Adaptability, Stakeholder Influence, Execution Discipline,
// Leadership Presence + Self-Awareness Quotient meta-dimension).
// Single-rater self-assessment — multi-rater/teams = B2B upsell.
// ═══════════════════════════════════════════════════════════

export interface CPIQuestion {
  id: string;
  text: string;
  type: 'likert' | 'forced_choice' | 'mcq_single' | 'mcq_multi';
  reverse_coded: boolean;
  options?: Array<{ label?: string | null; text: string; value?: number | string | null }> | null;
  scale_labels?: [string, string] | null;
}

export interface CPIDimensionBank {
  id: string;
  name: string;
  description: string;
  count: number;
  max_raw?: number | null;
  formula?: string | null;
  sub_dimensions: string[];
  reverse_coded: string[];
  questions: CPIQuestion[];
}

export const INSTRUMENT = 'CPI';
export const FULL_NAME = 'CPI — Career Positioning Index';
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = CPI — Career Positioning Index draft derived from reportPipeline.
export const B2C_NAME = 'CPI — Career Positioning Index';
// TODO(Akira - X4-1): confirm descriptor against Diagnostic Portfolio Master Library. Current = CPI — Career Positioning Index draft derived from reportPipeline.
export const VERSION = '13.0';
export const TOTAL_QUESTIONS = 30;
export const SCALE = '1-5 Likert';
export const DELIVERY_MINUTES = 15;

export const DIMENSIONS: CPIDimensionBank[] = [
  // X4-6 CPI dimension drift (see scoring/cpi.ts for full approved divergence note).
  // B2C CPI uses 6-D self-rater structure — intentionally NOT B2B CPI v2 12-D set.
  {
    id: 'D1',
    name: 'Strategic Orientation',
    description: 'Long-horizon framing and trade-off discipline. Future-back thinking over tactical reaction.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q02'],
    questions: [
      {
        id: 'Q01',
        text: 'I frame decisions in terms of 3–5 year strategic implications, not just quarterly results.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q02',
        text: 'I find it difficult to make trade-offs that defer short-term wins for long-term positioning. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q03',
        text: 'I can articulate how my function\'s strategy connects to the enterprise-level direction, in language a board member would recognise.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q04',
        text: 'I regularly scan for structural shifts — market, technology, regulatory — that could reshape my mandate.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q05',
        text: 'When faced with ambiguity, I default to a clear strategic hypothesis rather than waiting for complete information.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
  {
    id: 'D2',
    name: 'Cross-Border Adaptability',
    description: 'Agility across cultures, markets, and organizational structures. Spanning boundaries without losing clarity.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q08'],
    questions: [
      {
        id: 'Q06',
        text: 'I have led teams or initiatives spanning three or more APAC markets with material P&L or strategic impact.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q07',
        text: 'I adapt my communication style to the cultural norms of the market I am operating in, without losing the substance of my message.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q08',
        text: 'I find APAC stakeholder dynamics harder to navigate than HQ-centric ones. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q09',
        text: 'I can articulate the regulatory and governance differences across at least three APAC markets relevant to my function.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q10',
        text: 'I have built personal relationships with senior stakeholders in APAC markets outside my home market.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
  {
    id: 'D3',
    name: 'Stakeholder Influence',
    description: 'Mobilizing ecosystem actors without formal authority. Coalition-building and incentive alignment.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q14'],
    questions: [
      {
        id: 'Q11',
        text: 'I have mobilised a cross-functional coalition to deliver an outcome that none of the parties owned individually.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q12',
        text: 'I can map the incentive structure of any stakeholder ecosystem within a week of engaging with it.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q13',
        text: 'I have successfully influenced a board or C-suite decision against the initial recommendation of management.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q14',
        text: 'I tend to rely on formal authority rather than relationship capital to drive outcomes. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q15',
        text: 'I am regularly invited into board, exco, or client C-suite rooms for my perspective, not just my functional expertise.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
  {
    id: 'D4',
    name: 'Execution Discipline',
    description: 'Reliable delivery through structure, cadence, and prioritization. Operates through volatility.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q18'],
    questions: [
      {
        id: 'Q16',
        text: 'I operate with a personal cadence — weekly or monthly — that surfaces slippage before it becomes a crisis.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q17',
        text: 'I can name the three to five metrics that most reliably predict whether my mandate is on track.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q18',
        text: 'I frequently find myself firefighting operational issues that should have been delegated. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q19',
        text: 'I have delivered a complex multi-quarter initiative on time and on scope, with documented evidence I can show.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q20',
        text: 'When a project slips, my first move is to revisit the plan and ownership — not to add resources.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
  {
    id: 'D5',
    name: 'Leadership Presence',
    description: 'Composure, narrative, and inspiration under pressure. Visible in high-stakes moments.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q24'],
    questions: [
      {
        id: 'Q21',
        text: 'I can hold a room of senior executives through a thirty-minute strategic narrative without relying on slides.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q22',
        text: 'I remain composed and clear under public scrutiny or high-stakes questioning.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q23',
        text: 'I have a personal leadership narrative that others can articulate without prompting.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q24',
        text: 'I tend to defer to others in high-stakes meetings rather than hold the floor. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q25',
        text: 'My direct reports would describe me as inspiring, not just effective.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
  {
    id: 'D6',
    name: 'Self-Awareness Quotient',
    description: 'Accurate read of one\'s own operating patterns, blind spots, and impact on others. The meta-dimension.',
    count: 5,
    max_raw: 25,
    formula: null,
    sub_dimensions: [],
    reverse_coded: ['Q29'],
    questions: [
      {
        id: 'Q26',
        text: 'I can name my top three leadership blind spots without consulting a 360 review.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q27',
        text: 'I actively seek feedback that contradicts my self-assessment, rather than feedback that confirms it.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q28',
        text: 'I have changed a deeply-held leadership belief in the last twenty-four months based on new evidence.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q29',
        text: 'I tend to attribute team failures to circumstance rather than to my own leadership choices. [R]',
        type: 'likert',
        reverse_coded: true,
        options: null,
        scale_labels: null,
      },
      {
        id: 'Q30',
        text: 'I know which situations reliably cause me to operate below my normal effectiveness, and I plan around them.',
        type: 'likert',
        reverse_coded: false,
        options: null,
        scale_labels: null,
      },
    ],
  },
];

export const ALL_QUESTIONS: CPIQuestion[] = DIMENSIONS.flatMap(d => d.questions);

export const REVERSE_CODED_IDS: string[] = DIMENSIONS.flatMap(d => d.reverse_coded);

// Legacy alias retained for old CPI renderer references.
export const CPI_DIMENSIONS = DIMENSIONS;
