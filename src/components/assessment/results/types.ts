// ── ASSESSMENT RESULTS TYPES ───────────────────────────────────────
// #1322: Extended with Executive Summary + Narrative sections so the top of
// the results page delivers the 30-second "what this means for you" insight.
// Every assessment renderer now composes these into progressive-reveal sections
// that are revealed on scroll (not dumped all-at-once).

export interface ExecutiveSummary {
  /** 1-line verdict. Shown in HERO as the headline. */
  headline: string;
  /** 2-3 sentence narrative that "tells the story" of the result. */
  synopsis: string;
  /** Top 3 bullets of key insight (typically 1 strength + 1 gap + 1 meta). */
  keyTakeaways: Array<{ label: string; detail: string; tone: 'strength' | 'gap' | 'neutral' }>;
  /** Overall placement bracket. */
  bracket:
    | 'Top 10%'
    | 'Top Quartile'
    | 'Above Average'
    | 'Solid Midfield'
    | 'Developing'
    | 'Needs Attention';
}

export interface DimensionResult {
  id: string;
  name: string;
  score: number;          // 0-100
  lowLabel: string;
  highLabel: string;
  description: string;
  /** #1322: one-line narrative "what this means for you" rendered on hover/tap */
  narrative?: string;
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
  /** #1322: estimated success impact 0-100 — shown as "Impact: High/Med/Low" icon */
  impactLabel?: 'High' | 'Medium' | 'Long-term';
}

export interface AssessmentResultsConfig {
  assessmentCode: string;
  assessmentName: string;
  accent: string;
  prefix: string;
  overallScore: number;       // 0-100
  executiveSummary?: ExecutiveSummary;
  archetype: ArchetypeResult;
  dimensions: DimensionResult[];
  insights: InsightCard[];
  developmentActions: DevelopmentAction[];
  /** Path to retake the assessment */
  retakePath: string;
  /** Path to NEXUS portal */
  nexusPath: string;
}
