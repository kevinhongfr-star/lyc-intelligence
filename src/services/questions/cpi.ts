// ═══════════════════════════════════════════════════════════
// CPI Question Bank — Career Positioning Index (Phase 12)
// Retained from existing CPI renderer + scenario bank.
// ═══════════════════════════════════════════════════════════

export interface CPIBankDimension {
  id: string;
  name: string;
  description: string;
  questions: Array<{ id: string; stem: string; scenario?: string; options?: { label: string; value: number; text: string }[] }>;
}

// The CPI instrument uses a scenario-driven question bank hosted
// alongside cpiReportRenderer.ts. Below are the canonical dimensions.
export const CPI_DIMENSIONS: CPIBankDimension[] = [
  {
    id: 'D1',
    name: 'Strategic Orientation',
    description: 'Ability to frame long-term direction and trade-offs.',
    questions: [],
  },
  {
    id: 'D2',
    name: 'Cross-Border Adaptability',
    description: 'Navigating APAC multicultural contexts and stakeholders.',
    questions: [],
  },
  {
    id: 'D3',
    name: 'Stakeholder Influence',
    description: 'Credibility and impact across board, CEO and clients.',
    questions: [],
  },
  {
    id: 'D4',
    name: 'Execution Discipline',
    description: 'From strategy to outcomes, at senior-leader tempo.',
    questions: [],
  },
  {
    id: 'D5',
    name: 'Leadership Presence',
    description: 'Composure, narrative authority, and brand resonance.',
    questions: [],
  },
];

export const INSTRUMENT = 'CPI';
export const FULL_NAME = 'China Leadership Pipeline Index';
export const VERSION = '1.0';
export const TOTAL_QUESTIONS = 25;
export const SCALE = 'Scenario + structured evidence';
export const DELIVERY_MINUTES = 25;

export const DIMENSIONS = CPI_DIMENSIONS;

export const ALL_QUESTIONS = CPI_DIMENSIONS.flatMap(d =>
  d.questions.map(q => ({
    id: q.id,
    text: q.stem || q.scenario || q.id,
    type: 'mcq_single' as const,
    reverse_coded: false,
    dimension_id: d.id,
    dimension_name: d.name,
    options: q.options,
  }))
);

export const REVERSE_CODED_IDS: string[] = [];
