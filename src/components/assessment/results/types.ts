// ── ASSESSMENT RESULTS TYPES ───────────────────────────────────────

export interface DimensionResult {
  id: string;
  name: string;
  score: number;          // 0-100
  lowLabel: string;
  highLabel: string;
  description: string;
  /** Why this dimension matters for executive effectiveness (P1 #1322) */
  whyItMatters?: string;
  /** Suggested action to develop this dimension (P1 #1322) */
  actionSuggestion?: string;
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

/** A single key finding for the executive summary (P1 #1322) */
export interface KeyFinding {
  label: string;          // e.g. "Top strength", "Priority gap", "Signature trait"
  text: string;           // one-line finding statement
}

/** Executive summary block shown above the fold (P1 #1322) */
export interface ExecutiveSummary {
  /** One-line verdict — the "what this means" headline */
  verdict: string;
  /** 2-3 key findings surfaced for 30-second grasp */
  keyFindings: KeyFinding[];
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
  /** Executive summary shown above the fold (P1 #1322). Auto-derived if absent. */
  executiveSummary?: ExecutiveSummary;
}
