export type ReportFormat = 'PDF' | 'DOCX' | 'PNG';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed' | 'scheduled';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReportTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'radar' | 'gauge';
  title: string;
  data: Record<string, unknown>;
  width?: number;
  height?: number;
}

export interface ReportHeader {
  logo?: string;
  title: string;
  subtitle?: string;
  reportDate?: string;
  classification?: 'confidential' | 'internal' | 'public';
}

export interface ReportFooter {
  text?: string;
  pageNumbers?: boolean;
  companyName?: string;
}

export interface ReportTemplateData {
  header: ReportHeader;
  sections: ReportSection[];
  tables: ReportTable[];
  charts: ReportChart[];
  footer: ReportFooter;
  metadata: Record<string, unknown>;
}

export interface ReportContext {
  mandateId?: string;
  candidateId?: string;
  userId?: string;
  orgId?: string;
  data: Record<string, unknown>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assessment' | 'coaching' | 'session' | 'progress' | 'insight' | 'career' | 'executive' | 'trident';
  generate: (ctx: ReportContext) => Promise<ReportTemplateData>;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultHeader(title: string, subtitle?: string): ReportHeader {
  return {
    title,
    subtitle,
    reportDate: new Date().toISOString().split('T')[0],
    classification: 'confidential',
  };
}

function defaultFooter(): ReportFooter {
  return {
    text: 'LYC Intelligence — Confidential',
    pageNumbers: true,
    companyName: 'LYC Partners',
  };
}

const assessmentReport: ReportTemplate = {
  id: 'assessment-report',
  name: 'Assessment Report',
  description: 'Comprehensive assessment results with dimension scores, archetype analysis, and development recommendations',
  category: 'assessment',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Executive Summary', content: d.summary || 'Assessment summary not available.', order: 0 },
      { id: uid(), title: 'Dimension Analysis', content: d.dimensionAnalysis || 'Dimension analysis not available.', order: 1 },
      { id: uid(), title: 'Archetype Profile', content: d.archetypeProfile || 'Archetype profile not available.', order: 2 },
      { id: uid(), title: 'Development Recommendations', content: d.recommendations || 'Recommendations not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.scores)) {
      tables.push({
        id: uid(),
        title: 'Dimension Scores',
        headers: ['Dimension', 'Score', 'Percentile'],
        rows: d.scores.map((s: any) => [s.dimension || s.name || 'N/A', String(s.score ?? 0), String(s.percentile ?? 0)]),
      });
    }
    const charts: ReportChart[] = [];
    if (d.scores) {
      charts.push({ id: uid(), type: 'radar', title: 'Score Profile', data: d.scores });
    }
    return {
      header: defaultHeader('Assessment Report', d.candidateName || 'Candidate Assessment'),
      sections,
      tables,
      charts,
      footer: defaultFooter(),
      metadata: { templateId: 'assessment-report', candidateId: ctx.candidateId },
    };
  },
};

const coachingReport: ReportTemplate = {
  id: 'coaching-report',
  name: 'Coaching Report',
  description: 'Coaching engagement summary with progress metrics, goal tracking, and competency development',
  category: 'coaching',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Coaching Engagement Overview', content: d.overview || 'Coaching overview not available.', order: 0 },
      { id: uid(), title: 'Progress Against Goals', content: d.progress || 'Progress data not available.', order: 1 },
      { id: uid(), title: 'Competency Development', content: d.competencies || 'Competency data not available.', order: 2 },
      { id: uid(), title: 'Next Steps & Action Plan', content: d.nextSteps || 'Action plan not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.goals)) {
      tables.push({
        id: uid(),
        title: 'Goal Tracking',
        headers: ['Goal', 'Progress', 'Target Date', 'Status'],
        rows: d.goals.map((g: any) => [g.goal || 'N/A', `${g.progress ?? 0}%`, g.targetDate || 'N/A', g.status || 'active']),
      });
    }
    return {
      header: defaultHeader('Coaching Report', d.coacheeName || 'Coaching Engagement'),
      sections,
      tables,
      charts: [],
      footer: defaultFooter(),
      metadata: { templateId: 'coaching-report', mandateId: ctx.mandateId },
    };
  },
};

const sessionSummary: ReportTemplate = {
  id: 'session-summary',
  name: 'Session Summary',
  description: 'Coaching session highlights, key discussions, action items, and follow-up notes',
  category: 'session',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Session Overview', content: d.overview || 'Session overview not available.', order: 0 },
      { id: uid(), title: 'Key Discussion Topics', content: d.topics || 'Topics not available.', order: 1 },
      { id: uid(), title: 'Action Items', content: d.actionItems || 'Action items not available.', order: 2 },
      { id: uid(), title: 'Follow-up Notes', content: d.followUp || 'Follow-up notes not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.actionItemsList)) {
      tables.push({
        id: uid(),
        title: 'Action Items',
        headers: ['Action Item', 'Owner', 'Due Date', 'Priority'],
        rows: d.actionItemsList.map((a: any) => [a.item || 'N/A', a.owner || 'N/A', a.dueDate || 'N/A', a.priority || 'medium']),
      });
    }
    return {
      header: defaultHeader('Session Summary', d.sessionTitle || 'Coaching Session'),
      sections,
      tables,
      charts: [],
      footer: defaultFooter(),
      metadata: { templateId: 'session-summary', mandateId: ctx.mandateId },
    };
  },
};

const progressReport: ReportTemplate = {
  id: 'progress-report',
  name: 'Progress Report',
  description: 'Periodic progress tracking with milestone achievements, KPI trends, and development trajectory',
  category: 'progress',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Progress Executive Summary', content: d.executiveSummary || 'Executive summary not available.', order: 0 },
      { id: uid(), title: 'Milestone Achievements', content: d.milestones || 'Milestones not available.', order: 1 },
      { id: uid(), title: 'KPI Trends', content: d.kpiTrends || 'KPI trends not available.', order: 2 },
      { id: uid(), title: 'Development Trajectory', content: d.trajectory || 'Trajectory not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.milestones)) {
      tables.push({
        id: uid(),
        title: 'Milestones',
        headers: ['Milestone', 'Date', 'Status', 'Impact'],
        rows: d.milestones.map((m: any) => [m.name || 'N/A', m.date || 'N/A', m.status || 'pending', m.impact || 'N/A']),
      });
    }
    const charts: ReportChart[] = [];
    if (d.kpiData) {
      charts.push({ id: uid(), type: 'line', title: 'KPI Trend', data: d.kpiData });
    }
    return {
      header: defaultHeader('Progress Report', d.reportPeriod || 'Progress Update'),
      sections,
      tables,
      charts,
      footer: defaultFooter(),
      metadata: { templateId: 'progress-report', userId: ctx.userId },
    };
  },
};

const insightReport: ReportTemplate = {
  id: 'insight-report',
  name: 'Insight Report',
  description: 'Data-driven talent intelligence insights with market analysis, org dynamics, and strategic recommendations',
  category: 'insight',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Key Insights', content: d.keyInsights || 'Key insights not available.', order: 0 },
      { id: uid(), title: 'Market Intelligence', content: d.marketIntelligence || 'Market data not available.', order: 1 },
      { id: uid(), title: 'Organizational Dynamics', content: d.orgDynamics || 'Org dynamics not available.', order: 2 },
      { id: uid(), title: 'Strategic Recommendations', content: d.recommendations || 'Recommendations not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.talentPool)) {
      tables.push({
        id: uid(),
        title: 'Talent Pool Overview',
        headers: ['Position', 'Count', 'Avg Score', 'Gap'],
        rows: d.talentPool.map((t: any) => [t.position || 'N/A', String(t.count ?? 0), String(t.avgScore ?? 0), t.gap || 'N/A']),
      });
    }
    const charts: ReportChart[] = [];
    if (d.marketData) {
      charts.push({ id: uid(), type: 'bar', title: 'Market Distribution', data: d.marketData });
    }
    return {
      header: defaultHeader('Insight Report', d.focusArea || 'Talent Intelligence'),
      sections,
      tables,
      charts,
      footer: defaultFooter(),
      metadata: { templateId: 'insight-report', orgId: ctx.orgId },
    };
  },
};

const careerPlanReport: ReportTemplate = {
  id: 'career-plan-report',
  name: 'Career Plan Report',
  description: 'Individualized career development plan with goal mapping, competency gaps, and growth roadmap',
  category: 'career',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Career Vision', content: d.vision || 'Career vision not available.', order: 0 },
      { id: uid(), title: 'Current State Analysis', content: d.currentState || 'Current state not available.', order: 1 },
      { id: uid(), title: 'Competency Gap Analysis', content: d.gapAnalysis || 'Gap analysis not available.', order: 2 },
      { id: uid(), title: 'Development Roadmap', content: d.roadmap || 'Roadmap not available.', order: 3 },
      { id: uid(), title: 'Milestone Timeline', content: d.timeline || 'Timeline not available.', order: 4 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.developmentActions)) {
      tables.push({
        id: uid(),
        title: 'Development Actions',
        headers: ['Action', 'Competency', 'Timeline', 'Resources'],
        rows: d.developmentActions.map((a: any) => [a.action || 'N/A', a.competency || 'N/A', a.timeline || 'N/A', a.resources || 'N/A']),
      });
    }
    return {
      header: defaultHeader('Career Plan Report', d.candidateName || 'Career Development'),
      sections,
      tables,
      charts: [],
      footer: defaultFooter(),
      metadata: { templateId: 'career-plan-report', candidateId: ctx.candidateId },
    };
  },
};

const executiveSummary: ReportTemplate = {
  id: 'executive-summary',
  name: 'Executive Summary',
  description: 'Concise executive brief with key findings, strategic highlights, and decision-critical information',
  category: 'executive',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'Executive Overview', content: d.overview || 'Executive overview not available.', order: 0 },
      { id: uid(), title: 'Key Findings', content: d.keyFindings || 'Key findings not available.', order: 1 },
      { id: uid(), title: 'Strategic Implications', content: d.implications || 'Implications not available.', order: 2 },
      { id: uid(), title: 'Recommended Actions', content: d.actions || 'Actions not available.', order: 3 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.keyMetrics)) {
      tables.push({
        id: uid(),
        title: 'Key Metrics',
        headers: ['Metric', 'Current', 'Target', 'Delta'],
        rows: d.keyMetrics.map((m: any) => [m.metric || 'N/A', String(m.current ?? 0), String(m.target ?? 0), String(m.delta ?? 0)]),
      });
    }
    const charts: ReportChart[] = [];
    if (d.metricsData) {
      charts.push({ id: uid(), type: 'gauge', title: 'Performance Gauge', data: d.metricsData });
    }
    return {
      header: defaultHeader('Executive Summary', d.topic || 'Executive Briefing'),
      sections,
      tables,
      charts,
      footer: defaultFooter(),
      metadata: { templateId: 'executive-summary', orgId: ctx.orgId },
    };
  },
};

const tridentReport: ReportTemplate = {
  id: 'trident-report',
  name: 'Trident Report',
  description: 'Three-dimensional scoring analysis with D1/D2/D3 breakdown, composite scores, and tier classification',
  category: 'trident',
  async generate(ctx: ReportContext): Promise<ReportTemplateData> {
    const d = ctx.data as Record<string, any>;
    const sections: ReportSection[] = [
      { id: uid(), title: 'TRIDENT Overview', content: d.overview || 'TRIDENT overview not available.', order: 0 },
      { id: uid(), title: 'D1 — Leadership & Experience', content: d.d1Analysis || 'D1 analysis not available.', order: 1 },
      { id: uid(), title: 'D2 — Capability & Fit', content: d.d2Analysis || 'D2 analysis not available.', order: 2 },
      { id: uid(), title: 'D3 — Commercial Readiness', content: d.d3Analysis || 'D3 analysis not available.', order: 3 },
      { id: uid(), title: 'Composite Score & Tier', content: d.compositeAnalysis || 'Composite analysis not available.', order: 4 },
    ];
    const tables: ReportTable[] = [];
    if (Array.isArray(d.candidates)) {
      tables.push({
        id: uid(),
        title: 'Candidate Scores',
        headers: ['Candidate', 'D1', 'D2', 'D3', 'Composite', 'Tier'],
        rows: d.candidates.map((c: any) => [
          c.name || 'N/A',
          String(c.d1 ?? 0),
          String(c.d2 ?? 0),
          String(c.d3 ?? 0),
          String(c.composite ?? 0),
          c.tier || 'N/A',
        ]),
      });
    }
    const charts: ReportChart[] = [];
    if (d.scoreDistribution) {
      charts.push({ id: uid(), type: 'radar', title: 'TRIDENT Profile', data: d.scoreDistribution });
    }
    return {
      header: defaultHeader('TRIDENT Report', d.mandateTitle || 'Candidate Scoring'),
      sections,
      tables,
      charts,
      footer: defaultFooter(),
      metadata: { templateId: 'trident-report', mandateId: ctx.mandateId },
    };
  },
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  assessmentReport,
  coachingReport,
  sessionSummary,
  progressReport,
  insightReport,
  careerPlanReport,
  executiveSummary,
  tridentReport,
];

export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: ReportTemplate['category']): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category);
}

export const TEMPLATE_CATEGORIES: Record<ReportTemplate['category'], string> = {
  assessment: 'Assessment & Evaluation',
  coaching: 'Coaching & Development',
  session: 'Session & Meeting',
  progress: 'Progress & Tracking',
  insight: 'Intelligence & Insights',
  career: 'Career Planning',
  executive: 'Executive Briefing',
  trident: 'TRIDENT Scoring',
};
