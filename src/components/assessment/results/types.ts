// ── ASSESSMENT RESULTS TYPES ───────────────────────────────────────

export interface DimensionResult {
  id: string;
  name: string;
  score: number;          // 0-100
  lowLabel: string;
  highLabel: string;
  description: string;
}

export interface ArchetypeResult {
  name: string;
  description: string;
  traits: string[];
}

export interface InsightCard {
  title: string;
  text: string;
  /** 'strength' = high-scoring area, 'gap' = low-scoring area */
  type: 'strength' | 'gap';
}

export interface DevelopmentAction {
  priority: number;       // 1 = highest
  dimension: string;
  action: string;
  timeline: string;       // e.g. "30 days", "90 days"
}

export interface AssessmentResultsConfig {
  assessmentCode: string;
  assessmentName: string;
  accent: string;
  prefix: string;
  overallScore: number;       // 0-100
  archetype: ArchetypeResult;
  dimensions: DimensionResult[];
  insights: InsightCard[];
  developmentActions: DevelopmentAction[];
  /** Path to retake the assessment */
  retakePath: string;
  /** Path to NEXUS portal */
  nexusPath: string;
}
