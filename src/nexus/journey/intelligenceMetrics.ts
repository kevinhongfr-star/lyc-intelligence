export type DevDimension =
  | 'self_awareness'
  | 'strategic_thinking'
  | 'leading_teams'
  | 'communication_presence'
  | 'execution_excellence'
  | 'cross_cultural_fluency';

export type EngagementVector =
  | 'session_frequency'
  | 'question_quality'
  | 'goal_action_taken'
  | 'assessment_completion'
  | 'resource_utilization'
  | 'proactive_interaction';

export interface DevDimensionMeta {
  label: string;
  description: string;
  sourcedFrom: string[];
}

export interface EngagementVectorMeta {
  label: string;
  weight: number;
  rawSources: string[];
}

export const DEV_DIMENSIONS: Record<DevDimension, DevDimensionMeta> = {
  self_awareness: {
    label: 'Self Awareness',
    description: 'Clarity of self-perception, recognition of blind spots, and alignment between intent and impact.',
    sourcedFrom: ['PRISM', 'Bridge'],
  },
  strategic_thinking: {
    label: 'Strategic Thinking',
    description: 'Ability to frame long-term direction, adopt AI strategically, and translate vision into execution strategy.',
    sourcedFrom: ['SPARK', 'DRIVE'],
  },
  leading_teams: {
    label: 'Leading Teams',
    description: 'Sales leadership capability and cultural intelligence applied to team formation and performance.',
    sourcedFrom: ['FORGE', 'MOSAIC'],
  },
  communication_presence: {
    label: 'Communication & Executive Presence',
    description: 'Clarity of messaging, brand alignment, and executive-caliber presence across interactions.',
    sourcedFrom: ['PRISM brand dimensions', 'NEXUS engagement'],
  },
  execution_excellence: {
    label: 'Execution Excellence',
    description: 'Consistency in delivering outcomes, operational rigor, and application of execution capability frameworks.',
    sourcedFrom: ['DRIVE'],
  },
  cross_cultural_fluency: {
    label: 'Cross Cultural Fluency',
    description: 'Cultural intelligence and effectiveness in China-specific and cross-border leadership contexts.',
    sourcedFrom: ['MOSAIC', 'BRIDGE'],
  },
};

export const ENGAGEMENT_VECTORS: Record<EngagementVector, EngagementVectorMeta> = {
  session_frequency: {
    label: 'Session Frequency',
    weight: 1.0,
    rawSources: ['nexus_messages count by week'],
  },
  question_quality: {
    label: 'Question Quality',
    weight: 0.8,
    rawSources: ['average tokens per user message', 'Pro usage ratio'],
  },
  goal_action_taken: {
    label: 'Goal Action Rate',
    weight: 1.2,
    rawSources: ['semantic goals updated to completed / active count'],
  },
  assessment_completion: {
    label: 'Assessment Completion',
    weight: 1.0,
    rawSources: ['completed / available diagnostic ratio'],
  },
  resource_utilization: {
    label: 'Resource Utilization',
    weight: 0.7,
    rawSources: ['rag queries / miles'],
  },
  proactive_interaction: {
    label: 'Proactive Interaction',
    weight: 0.6,
    rawSources: ['recommendation_actioned / recommendation_delivered ratio'],
  },
};

export function calculateEngagementScore(
  rawValues: Record<EngagementVector, number>,
): number {
  const vectors = Object.keys(ENGAGEMENT_VECTORS) as EngagementVector[];
  const totalWeight = vectors.reduce((sum, v) => sum + ENGAGEMENT_VECTORS[v].weight, 0);

  const weightedSum = vectors.reduce((sum, v) => {
    const clamped = Math.max(0, Math.min(100, rawValues[v] ?? 0));
    return sum + clamped * (ENGAGEMENT_VECTORS[v].weight / totalWeight);
  }, 0);

  return Math.round(Math.max(0, Math.min(100, weightedSum)));
}

export interface DiagnosticScore {
  dimension?: DevDimension;
  framework?: string;
  score: number;
  completedAt?: Date | string;
}

export interface AssessmentHistoryEntry {
  instrumentCode: string;
  completedAt: Date | string;
  scores?: Record<string, number>;
}

const DIMENSION_FRAMEWORK_MAP: Record<DevDimension, string[]> = {
  self_awareness: ['PRISM', 'BRIDGE', 'prism', 'bridge'],
  strategic_thinking: ['SPARK', 'DRIVE', 'spark', 'drive'],
  leading_teams: ['FORGE', 'MOSAIC', 'forge', 'mosaic'],
  communication_presence: ['PRISM', 'NEXUS', 'prism', 'nexus'],
  execution_excellence: ['DRIVE', 'drive'],
  cross_cultural_fluency: ['MOSAIC', 'BRIDGE', 'mosaic', 'bridge'],
};

const BASELINE_DEFAULTS: Record<DevDimension, number> = {
  self_awareness: 52,
  strategic_thinking: 48,
  leading_teams: 55,
  communication_presence: 58,
  execution_excellence: 61,
  cross_cultural_fluency: 45,
};

export function calculateDevelopmentDimensions(
  diagnosticResults: DiagnosticScore[] = [],
  assessmentHistory: AssessmentHistoryEntry[] = [],
): Record<DevDimension, number> & { pendingFlags: Record<DevDimension, boolean> } {
  const dimensions = Object.keys(DEV_DIMENSIONS) as DevDimension[];
  const scores: Record<DevDimension, number> = {} as Record<DevDimension, number>;
  const pendingFlags: Record<DevDimension, boolean> = {} as Record<DevDimension, boolean>;

  for (const dim of dimensions) {
    const matchedScores: number[] = [];

    for (const dr of diagnosticResults) {
      if (dr.dimension === dim) {
        matchedScores.push(dr.score);
        continue;
      }
      if (dr.framework) {
        const frameworks = DIMENSION_FRAMEWORK_MAP[dim];
        if (frameworks.some((f) => dr.framework!.toUpperCase().includes(f.toUpperCase()))) {
          matchedScores.push(dr.score);
        }
      }
    }

    for (const ah of assessmentHistory) {
      const frameworks = DIMENSION_FRAMEWORK_MAP[dim];
      const code = ah.instrumentCode?.toUpperCase() ?? '';
      if (frameworks.some((f) => code.includes(f.toUpperCase())) && ah.scores) {
        const scoreValues = Object.values(ah.scores);
        if (scoreValues.length) {
          const avg = scoreValues.reduce((s, v) => s + v, 0) / scoreValues.length;
          matchedScores.push(avg);
        }
      }
    }

    if (matchedScores.length > 0) {
      const avg = matchedScores.reduce((s, v) => s + v, 0) / matchedScores.length;
      scores[dim] = Math.round(Math.max(0, Math.min(100, avg)));
      pendingFlags[dim] = false;
    } else {
      scores[dim] = BASELINE_DEFAULTS[dim];
      pendingFlags[dim] = true;
    }
  }

  return { ...scores, pendingFlags };
}

export interface MilestoneContext {
  assessmentsCompleted: Array<{ completedAt?: Date | string; instrumentCode?: string }>;
  goalsCompleted: Array<{ completedAt?: Date | string }>;
  journeyDays: number;
  totalMilesSpent: number;
  sessionsCount: number;
  executiveTierUpgradeAt?: Date | string | null;
  recommendationsDelivered?: number;
  recommendationsActioned?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: Date | string | null;
  icon: 'assessment' | 'sessions' | 'miles' | 'goal' | 'duration' | 'tier' | 'diagnostics' | 'engagement' | 'reflection' | 'resource' | 'network' | 'mastery';
}

export function detectMilestones(context: MilestoneContext): Milestone[] {
  const milestones: Milestone[] = [];
  const now = new Date();

  const firstAssessment = context.assessmentsCompleted?.[0];
  milestones.push({
    id: 'first_assessment',
    title: 'First Diagnostic Complete',
    description: 'Completed your first assessment to establish a baseline.',
    achievedAt: firstAssessment?.completedAt ?? null,
    icon: 'assessment',
  });

  milestones.push({
    id: 'five_sessions',
    title: 'Five Conversations',
    description: 'Engaged in five NEXUS sessions to explore your context.',
    achievedAt: context.sessionsCount >= 5 ? now : null,
    icon: 'sessions',
  });

  milestones.push({
    id: 'one_hundred_miles',
    title: '100 Miles Invested',
    description: 'Allocated 100 miles toward exploration and guidance.',
    achievedAt: context.totalMilesSpent >= 100 ? now : null,
    icon: 'miles',
  });

  const firstGoal = context.goalsCompleted?.[0];
  milestones.push({
    id: 'first_goal',
    title: 'First Goal Completed',
    description: 'Marked your first development goal as complete.',
    achievedAt: firstGoal?.completedAt ?? null,
    icon: 'goal',
  });

  milestones.push({
    id: 'thirty_day_active',
    title: '30-Day Journey',
    description: 'Maintained active engagement over thirty days.',
    achievedAt: context.journeyDays >= 30 ? now : null,
    icon: 'duration',
  });

  const diagnosticsCount = context.assessmentsCompleted?.length ?? 0;
  milestones.push({
    id: 'three_diagnostics',
    title: 'Three Diagnostics',
    description: 'Completed three diagnostic instruments to broaden perspective.',
    achievedAt: diagnosticsCount >= 3 ? now : null,
    icon: 'diagnostics',
  });

  milestones.push({
    id: 'executive_tier',
    title: 'Executive Tier Access',
    description: 'Upgraded to Executive tier for deeper coaching support.',
    achievedAt: context.executiveTierUpgradeAt ?? null,
    icon: 'tier',
  });

  milestones.push({
    id: 'twenty_sessions',
    title: 'Twenty Conversations',
    description: 'Completed twenty NEXUS sessions of sustained engagement.',
    achievedAt: context.sessionsCount >= 20 ? now : null,
    icon: 'engagement',
  });

  milestones.push({
    id: 'five_hundred_miles',
    title: '500 Miles Invested',
    description: 'Invested 500 miles across exploration, reflection, and actions.',
    achievedAt: context.totalMilesSpent >= 500 ? now : null,
    icon: 'resource',
  });

  milestones.push({
    id: 'three_goals',
    title: 'Three Goals Completed',
    description: 'Saw three development goals through to completion.',
    achievedAt: (context.goalsCompleted?.length ?? 0) >= 3 ? now : null,
    icon: 'mastery',
  });

  milestones.push({
    id: 'ninety_day_active',
    title: '90-Day Journey',
    description: 'Ninety days of sustained development practice.',
    achievedAt: context.journeyDays >= 90 ? now : null,
    icon: 'reflection',
  });

  const actionRatio =
    (context.recommendationsDelivered ?? 0) > 0
      ? (context.recommendationsActioned ?? 0) / (context.recommendationsDelivered ?? 1)
      : 0;
  milestones.push({
    id: 'proactive_momentum',
    title: 'Proactive Momentum',
    description: 'Took action on a majority of delivered recommendations.',
    achievedAt:
      (context.recommendationsDelivered ?? 0) >= 5 && actionRatio >= 0.5 ? now : null,
    icon: 'network',
  });

  return milestones
    .filter((m) => m.achievedAt !== null)
    .sort((a, b) => {
      const ta = a.achievedAt ? new Date(a.achievedAt).getTime() : 0;
      const tb = b.achievedAt ? new Date(b.achievedAt).getTime() : 0;
      return ta - tb;
    })
    .slice(0, 12);
}

export interface QuarterlyData {
  dimensionScores: Record<DevDimension, number>;
  engagement90d: number;
  milestonesPeriod: Milestone[];
  recommendationsDelivered: number;
  milesUsed: number;
}

export interface QuarterlyReviewReport {
  summaryParagraphs: string[];
  topStrengths: string[];
  growthAreas: string[];
  recommendedActions: string[];
}

export function generateQuarterlyReviewReport(data: QuarterlyData): QuarterlyReviewReport {
  const dims = Object.keys(DEV_DIMENSIONS) as DevDimension[];
  const sortedDims = [...dims].sort(
    (a, b) => data.dimensionScores[b] - data.dimensionScores[a],
  );
  const top2 = sortedDims.slice(0, 2);
  const bottom2 = sortedDims.slice(-2).reverse();
  const avgScore =
    dims.reduce((s, d) => s + data.dimensionScores[d], 0) / dims.length;

  const summaryParagraphs: string[] = [];
  summaryParagraphs.push(
    `Over the quarter, your development dimensions averaged ${Math.round(avgScore)} out of 100, with a 90-day engagement score of ${data.engagement90d}. You used ${data.milesUsed} miles across NEXUS interactions and had ${data.recommendationsDelivered} recommendations delivered to guide next steps.`,
  );
  if (data.milestonesPeriod.length > 0) {
    summaryParagraphs.push(
      `During this period you reached ${data.milestonesPeriod.length} journey marker${data.milestonesPeriod.length === 1 ? '' : 's'}, including "${data.milestonesPeriod[0].title}"${data.milestonesPeriod.length > 1 ? ` and "${data.milestonesPeriod[data.milestonesPeriod.length - 1].title}"` : ''}. These markers reflect sustained practice rather than linear progress.`,
    );
  } else {
    summaryParagraphs.push(
      'This quarter did not register additional journey markers, which can indicate a period of consolidation, deeper reflection, or shifts in focus that surface in the next cycle.',
    );
  }
  summaryParagraphs.push(
    `Development is non-linear. The following strengths and growth areas are distilled from your current diagnostic footprint combined with observed engagement patterns across NEXUS interactions.`,
  );

  const topStrengths: string[] = top2.map((dim, i) => {
    const meta = DEV_DIMENSIONS[dim];
    const score = data.dimensionScores[dim];
    const tone =
      i === 0 ? 'Your clearest strength this quarter' : 'A secondary strength area';
    return `${tone} is ${meta.label.toLowerCase()} (${score}/100). ${meta.description}`;
  });
  if (data.engagement90d >= 70) {
    topStrengths.push(
      `Engagement pattern is constructive this quarter (${data.engagement90d}/100), indicating consistent session cadence and follow-through on goals.`,
    );
  }

  const growthAreas: string[] = bottom2.map((dim) => {
    const meta = DEV_DIMENSIONS[dim];
    const score = data.dimensionScores[dim];
    return `${meta.label} is a growth area (${score}/100). ${meta.description}`;
  });
  if (data.engagement90d < 50) {
    growthAreas.push(
      `Engagement momentum softened this quarter (${data.engagement90d}/100). Smaller, more frequent sessions often support steadier progress than occasional deep dives.`,
    );
  }

  const recommendedActions: string[] = [];
  const lowDim = bottom2[0];
  recommendedActions.push(
    `Prioritize one focused practice each week tied to ${DEV_DIMENSIONS[lowDim].label.toLowerCase()}. Even fifteen minutes of structured reflection compounds over a quarter.`,
  );
  if (data.milestonesPeriod.length < 2) {
    recommendedActions.push(
      'Schedule a baseline or follow-up diagnostic in the next four weeks to ground the next development cycle in measurable context.',
    );
  }
  recommendedActions.push(
    'Review active goals and close or rename any that no longer align with your current context. A smaller set of commitments usually yields deeper progress.',
  );
  if (data.recommendationsDelivered > 0) {
    recommendedActions.push(
      `Of the ${data.recommendationsDelivered} recommendations delivered this quarter, explicitly resolve which to close, defer, or carry forward so your action list stays intentional.`,
    );
  }
  recommendedActions.push(
    'Use your next NEXUS session to frame a single question you want to unpack. High-quality, specific prompts tend to correlate with more durable development insights.',
  );

  return {
    summaryParagraphs,
    topStrengths,
    growthAreas,
    recommendedActions,
  };
}
