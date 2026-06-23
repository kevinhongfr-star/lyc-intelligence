// Phase 6.2: Advanced Analytics - Data Service
// Funnel analytics, time-to-fill, quality of hire, consultant performance

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export const PIPELINE_STAGES = [
  { value: 'applied', label: 'Applied', order: 1 },
  { value: 'screening', label: 'Screening', order: 2 },
  { value: 'phone_interview', label: 'Phone Interview', order: 3 },
  { value: 'interview_1', label: 'Interview 1', order: 4 },
  { value: 'interview_2', label: 'Interview 2', order: 5 },
  { value: 'interview_3', label: 'Interview 3', order: 6 },
  { value: 'final_interview', label: 'Final Interview', order: 7 },
  { value: 'offer_pending', label: 'Offer Pending', order: 8 },
  { value: 'offer_accepted', label: 'Offer Accepted', order: 9 },
  { value: 'onboarded', label: 'Onboarded', order: 10 },
  { value: 'probation_passed', label: 'Probation Passed', order: 11 },
];

export interface DateRange {
  start: string;
  end: string;
}

export interface FunnelStage {
  stage: string;
  label: string;
  order: number;
  count: number;
  conversionRate: number;
  isBottleneck: boolean;
}

export interface FunnelAnalytics {
  stages: FunnelStage[];
  bottleneck: FunnelStage | null;
  totalCandidates: number;
  totalPlaced: number;
  overallConversion: number;
}

export interface MandateTimeToFill {
  mandateId: string;
  mandateTitle: string;
  clientName: string;
  avgDaysToFill: number;
  placedCount: number;
  totalCandidates: number;
}

export interface ConsultantTimeToFill {
  consultantId: string;
  consultantName: string;
  avgDaysToFill: number;
  placementCount: number;
}

export interface ClientTimeToFill {
  clientId: string;
  clientName: string;
  avgDaysToFill: number;
  placementCount: number;
}

export interface TimeToFillAnalytics {
  byMandate: MandateTimeToFill[];
  byConsultant: ConsultantTimeToFill[];
  byClient: ClientTimeToFill[];
  overallAvgDays: number;
}

export interface QualityOfHireMetrics {
  probationPassRate: number;
  probationPassed: number;
  probationFailed: number;
  probationPending: number;
  totalPlacements: number;
  avgMatchScore: number;
  retention6Month: number;
  retention6MonthCount: number;
}

export interface ConsultantPerformance {
  consultantId: string;
  consultantName: string;
  placementsThisQuarter: number;
  placementsThisYear: number;
  totalPlacements: number;
  activeMandates: number;
  candidatesInPipeline: number;
  avgMatchScore: number;
  avgTimeToFill: number;
  clientSatisfactionScore: number | null;
  rank: number;
}

export interface AnalyticsDashboardData {
  funnel: FunnelAnalytics;
  timeToFill: TimeToFillAnalytics;
  qualityOfHire: QualityOfHireMetrics;
  consultantPerformance: ConsultantPerformance[];
  dateRange: DateRange;
}

// ═══════════════════════════════════════════════════════════════
// FUNNEL ANALYTICS
// ═══════════════════════════════════════════════════════════════

export async function getFunnelAnalytics(
  supabase: SupabaseClient,
  orgId: string,
  dateRange: DateRange
): Promise<FunnelAnalytics> {
  // Get all candidates in the pipeline for the organization within date range
  const { data: candidates, error } = await supabase
    .from('candidates_pipeline')
    .select(`
      id,
      stage,
      created_at,
      mandate:mandate_id(
        id,
        created_at,
        organization_id
      )
    `)
    .eq('mandate.organization_id', orgId)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (error) {
    console.error('[Analytics] Funnel error:', error);
    return {
      stages: [],
      bottleneck: null,
      totalCandidates: 0,
      totalPlaced: 0,
      overallConversion: 0,
    };
  }

  // Count candidates at each stage
  const stageCounts: Record<string, number> = {};
  PIPELINE_STAGES.forEach(stage => {
    stageCounts[stage.value] = 0;
  });

  let totalCandidates = 0;
  let totalPlaced = 0;

  candidates?.forEach(candidate => {
    if (candidate.stage && stageCounts.hasOwnProperty(candidate.stage)) {
      stageCounts[candidate.stage]++;
    }
    totalCandidates++;
    if (['offer_accepted', 'onboarded', 'probation_passed'].includes(candidate.stage)) {
      totalPlaced++;
    }
  });

  // Calculate conversion rates and identify bottleneck
  const stages: FunnelStage[] = [];
  let minConversion = 100;
  let bottleneck: FunnelStage | null = null;

  PIPELINE_STAGES.forEach((stage, index) => {
    const count = stageCounts[stage.value] || 0;
    const prevStage = index > 0 ? PIPELINE_STAGES[index - 1] : null;
    const prevCount = prevStage ? stageCounts[prevStage.value] || 0 : count;
    
    let conversionRate = 0;
    if (prevCount > 0 && index > 0) {
      conversionRate = Math.round((count / prevCount) * 100);
    } else if (index === 0) {
      conversionRate = 100;
    }

    const isBottleneck = index > 0 && conversionRate > 0 && conversionRate < minConversion;
    if (isBottleneck) {
      minConversion = conversionRate;
    }

    stages.push({
      stage: stage.value,
      label: stage.label,
      order: stage.order,
      count,
      conversionRate,
      isBottleneck: false,
    });
  });

  // Mark bottleneck (lowest conversion rate > 0)
  let foundBottleneck = false;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].conversionRate > 0 && stages[i].conversionRate === minConversion && !foundBottleneck) {
      stages[i].isBottleneck = true;
      bottleneck = stages[i];
      foundBottleneck = true;
    }
  }

  const overallConversion = totalCandidates > 0 
    ? Math.round((totalPlaced / totalCandidates) * 100) 
    : 0;

  return {
    stages,
    bottleneck,
    totalCandidates,
    totalPlaced,
    overallConversion,
  };
}

// ═══════════════════════════════════════════════════════════════
// TIME-TO-FILL ANALYTICS
// ═══════════════════════════════════════════════════════════════

export async function getTimeToFillAnalytics(
  supabase: SupabaseClient,
  orgId: string,
  dateRange: DateRange
): Promise<TimeToFillAnalytics> {
  // Get all placed candidates with mandate info
  const { data: placedCandidates, error } = await supabase
    .from('candidates_pipeline')
    .select(`
      id,
      stage,
      created_at,
      match_score,
      mandate:mandate_id(
        id,
        title,
        created_at,
        organization_id,
        client:client_id(
          id,
          company_name
        )
      ),
      consultant:consultant_id(
        id,
        name
      )
    `)
    .eq('mandate.organization_id', orgId)
    .in('stage', ['offer_accepted', 'onboarded', 'probation_passed'])
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (error) {
    console.error('[Analytics] TimeToFill error:', error);
    return {
      byMandate: [],
      byConsultant: [],
      byClient: [],
      overallAvgDays: 0,
    };
  }

  // Calculate time-to-fill for each placed candidate
  const timeToFills: Array<{ days: number; mandateId: string; mandateTitle: string; clientName: string; consultantId: string; consultantName: string }> = [];

  placedCandidates?.forEach(candidate => {
    if (candidate.mandate?.created_at && candidate.created_at) {
      const mandateCreated = new Date(candidate.mandate.created_at);
      const candidateCreated = new Date(candidate.created_at);
      const daysToFill = Math.ceil((candidateCreated.getTime() - mandateCreated.getTime()) / (1000 * 60 * 60 * 24));

      timeToFills.push({
        days: daysToFill,
        mandateId: candidate.mandate.id,
        mandateTitle: candidate.mandate.title || 'Unknown',
        clientName: (candidate.mandate.client as any)?.company_name || 'Unknown',
        consultantId: (candidate.consultant as any)?.id || 'unknown',
        consultantName: (candidate.consultant as any)?.name || 'Unknown',
      });
    }
  });

  // Calculate overall average
  const overallAvgDays = timeToFills.length > 0
    ? Math.round(timeToFills.reduce((sum, t) => sum + t.days, 0) / timeToFills.length)
    : 0;

  // By Mandate
  const byMandateMap = new Map<string, { days: number[]; mandateId: string; mandateTitle: string; clientName: string }>();
  timeToFills.forEach(t => {
    const existing = byMandateMap.get(t.mandateId);
    if (existing) {
      existing.days.push(t.days);
    } else {
      byMandateMap.set(t.mandateId, {
        days: [t.days],
        mandateId: t.mandateId,
        mandateTitle: t.mandateTitle,
        clientName: t.clientName,
      });
    }
  });

  const byMandate: MandateTimeToFill[] = Array.from(byMandateMap.values()).map(m => ({
    mandateId: m.mandateId,
    mandateTitle: m.mandateTitle,
    clientName: m.clientName,
    avgDaysToFill: Math.round(m.days.reduce((a, b) => a + b, 0) / m.days.length),
    placedCount: m.days.length,
    totalCandidates: m.days.length, // Simplified
  }));

  // By Consultant
  const byConsultantMap = new Map<string, { days: number[]; consultantId: string; consultantName: string }>();
  timeToFills.forEach(t => {
    const existing = byConsultantMap.get(t.consultantId);
    if (existing) {
      existing.days.push(t.days);
    } else {
      byConsultantMap.set(t.consultantId, {
        days: [t.days],
        consultantId: t.consultantId,
        consultantName: t.consultantName,
      });
    }
  });

  const byConsultant: ConsultantTimeToFill[] = Array.from(byConsultantMap.values())
    .map(c => ({
      consultantId: c.consultantId,
      consultantName: c.consultantName,
      avgDaysToFill: Math.round(c.days.reduce((a, b) => a + b, 0) / c.days.length),
      placementCount: c.days.length,
    }))
    .sort((a, b) => a.avgDaysToFill - b.avgDaysToFill);

  // By Client
  const byClientMap = new Map<string, { days: number[]; clientId: string; clientName: string }>();
  timeToFills.forEach(t => {
    const existing = byClientMap.get(t.clientName);
    if (existing) {
      existing.days.push(t.days);
    } else {
      byClientMap.set(t.clientName, {
        days: [t.days],
        clientId: t.mandateId, // Use mandate ID as fallback
        clientName: t.clientName,
      });
    }
  });

  const byClient: ClientTimeToFill[] = Array.from(byClientMap.values())
    .map(c => ({
      clientId: c.clientId,
      clientName: c.clientName,
      avgDaysToFill: Math.round(c.days.reduce((a, b) => a + b, 0) / c.days.length),
      placementCount: c.days.length,
    }))
    .sort((a, b) => b.avgDaysToFill - a.avgDaysToFill);

  return {
    byMandate,
    byConsultant,
    byClient,
    overallAvgDays,
  };
}

// ═══════════════════════════════════════════════════════════════
// QUALITY OF HIRE
// ═══════════════════════════════════════════════════════════════

export async function getQualityOfHireMetrics(
  supabase: SupabaseClient,
  orgId: string,
  dateRange: DateRange
): Promise<QualityOfHireMetrics> {
  // Get placed candidates with probation info
  const { data: placedCandidates, error } = await supabase
    .from('candidates_pipeline')
    .select(`
      id,
      probation_status,
      match_score,
      created_at,
      mandate:mandate_id(
        organization_id
      )
    `)
    .eq('mandate.organization_id', orgId)
    .in('stage', ['offer_accepted', 'onboarded', 'probation_passed'])
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (error) {
    console.error('[Analytics] QualityOfHire error:', error);
    return {
      probationPassRate: 0,
      probationPassed: 0,
      probationFailed: 0,
      probationPending: 0,
      totalPlacements: 0,
      avgMatchScore: 0,
      retention6Month: 0,
      retention6MonthCount: 0,
    };
  }

  let probationPassed = 0;
  let probationFailed = 0;
  let probationPending = 0;
  let totalMatchScore = 0;
  let matchScoreCount = 0;

  placedCandidates?.forEach(candidate => {
    if (candidate.probation_status === 'passed') probationPassed++;
    else if (candidate.probation_status === 'failed') probationFailed++;
    else if (candidate.probation_status === 'pending' || !candidate.probation_status) probationPending++;
    
    if (candidate.match_score) {
      totalMatchScore += candidate.match_score;
      matchScoreCount++;
    }
  });

  const totalWithStatus = probationPassed + probationFailed;
  const probationPassRate = totalWithStatus > 0
    ? Math.round((probationPassed / totalWithStatus) * 100)
    : 0;

  const avgMatchScore = matchScoreCount > 0
    ? Math.round(totalMatchScore / matchScoreCount)
    : 0;

  // Simplified retention (would need actual 6-month check in production)
  const retention6Month = probationPassed > 0
    ? Math.round(((probationPassed - probationFailed) / probationPassed) * 100)
    : 0;

  return {
    probationPassRate,
    probationPassed,
    probationFailed,
    probationPending,
    totalPlacements: placedCandidates?.length || 0,
    avgMatchScore,
    retention6Month,
    retention6MonthCount: probationPassed,
  };
}

// ═══════════════════════════════════════════════════════════════
// CONSULTANT PERFORMANCE
// ═══════════════════════════════════════════════════════════════

export async function getConsultantPerformance(
  supabase: SupabaseClient,
  orgId: string,
  dateRange: DateRange
): Promise<ConsultantPerformance[]> {
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Get all consultants with their metrics
  const { data: consultants, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      role
    `)
    .eq('organization_id', orgId)
    .in('role', ['consultant', 'lyc_admin']);

  if (error) {
    console.error('[Analytics] ConsultantPerformance error:', error);
    return [];
  }

  // Get placements by consultant
  const { data: placements, error: placementsError } = await supabase
    .from('candidates_pipeline')
    .select(`
      id,
      created_at,
      match_score,
      consultant:consultant_id(
        id
      ),
      mandate:mandate_id(
        organization_id,
        created_at
      )
    `)
    .eq('mandate.organization_id', orgId)
    .in('stage', ['offer_accepted', 'onboarded', 'probation_passed']);

  if (placementsError) {
    console.error('[Analytics] Placements error:', placementsError);
    return [];
  }

  // Get active mandates count
  const { data: activeMandates, error: mandatesError } = await supabase
    .from('mandates')
    .select(`id, consultant_id`)
    .eq('organization_id', orgId)
    .eq('status', 'active');

  if (mandatesError) {
    console.error('[Analytics] ActiveMandates error:', mandatesError);
  }

  // Get candidates in pipeline
  const { data: pipelineCandidates, error: pipelineError } = await supabase
    .from('candidates_pipeline')
    .select(`
      id,
      consultant:consultant_id(
        id
      ),
      mandate:mandate_id(
        organization_id
      )
    `)
    .eq('mandate.organization_id', orgId);

  if (pipelineError) {
    console.error('[Analytics] PipelineCandidates error:', pipelineError);
  }

  // Calculate metrics per consultant
  const performanceMap = new Map<string, {
    consultantId: string;
    consultantName: string;
    placementsThisQuarter: number;
    placementsThisYear: number;
    totalPlacements: number;
    matchScores: number[];
    timeToFills: number[];
  }>();

  // Initialize for all consultants
  consultants?.forEach(consultant => {
    performanceMap.set(consultant.id, {
      consultantId: consultant.id,
      consultantName: consultant.name || consultant.email || 'Unknown',
      placementsThisQuarter: 0,
      placementsThisYear: 0,
      totalPlacements: 0,
      matchScores: [],
      timeToFills: [],
    });
  });

  // Calculate placements
  placements?.forEach(p => {
    const consultantId = (p.consultant as any)?.id;
    if (!consultantId) return;

    const perf = performanceMap.get(consultantId);
    if (!perf) return;

    perf.totalPlacements++;

    if (p.created_at) {
      const placementDate = new Date(p.created_at);
      if (placementDate >= quarterStart) perf.placementsThisQuarter++;
      if (placementDate >= yearStart) perf.placementsThisYear++;
    }

    if (p.match_score) perf.matchScores.push(p.match_score);

    if (p.mandate?.created_at && p.created_at) {
      const days = Math.ceil(
        (new Date(p.created_at).getTime() - new Date(p.mandate.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      perf.timeToFills.push(days);
    }
  });

  // Count active mandates and pipeline candidates per consultant
  const activeMandatesByConsultant = new Map<string, number>();
  activeMandates?.forEach(m => {
    const count = activeMandatesByConsultant.get(m.consultant_id || '') || 0;
    activeMandatesByConsultant.set(m.consultant_id || '', count + 1);
  });

  const pipelineByConsultant = new Map<string, number>();
  pipelineCandidates?.forEach(c => {
    const consultantId = (c.consultant as any)?.id;
    const count = pipelineByConsultant.get(consultantId || '') || 0;
    pipelineByConsultant.set(consultantId || '', count + 1);
  });

  // Build final performance array
  const performance: ConsultantPerformance[] = Array.from(performanceMap.values()).map(p => ({
    consultantId: p.consultantId,
    consultantName: p.consultantName,
    placementsThisQuarter: p.placementsThisQuarter,
    placementsThisYear: p.placementsThisYear,
    totalPlacements: p.totalPlacements,
    activeMandates: activeMandatesByConsultant.get(p.consultantId) || 0,
    candidatesInPipeline: pipelineByConsultant.get(p.consultantId) || 0,
    avgMatchScore: p.matchScores.length > 0
      ? Math.round(p.matchScores.reduce((a, b) => a + b, 0) / p.matchScores.length)
      : 0,
    avgTimeToFill: p.timeToFills.length > 0
      ? Math.round(p.timeToFills.reduce((a, b) => a + b, 0) / p.timeToFills.length)
      : 0,
    clientSatisfactionScore: null, // Would come from feedback collection
    rank: 0,
  }));

  // Sort by placements this quarter (descending)
  performance.sort((a, b) => b.placementsThisQuarter - a.placementsThisQuarter);

  // Assign ranks
  performance.forEach((p, index) => {
    p.rank = index + 1;
  });

  return performance;
}

// ═══════════════════════════════════════════════════════════════
// COMBINED ANALYTICS DASHBOARD
// ═══════════════════════════════════════════════════════════════

export async function getAnalyticsDashboard(
  supabase: SupabaseClient,
  orgId: string,
  dateRange: DateRange
): Promise<AnalyticsDashboardData> {
  const [funnel, timeToFill, qualityOfHire, consultantPerformance] = await Promise.all([
    getFunnelAnalytics(supabase, orgId, dateRange),
    getTimeToFillAnalytics(supabase, orgId, dateRange),
    getQualityOfHireMetrics(supabase, orgId, dateRange),
    getConsultantPerformance(supabase, orgId, dateRange),
  ]);

  return {
    funnel,
    timeToFill,
    qualityOfHire,
    consultantPerformance,
    dateRange,
  };
}

// ═══════════════════════════════════════════════════════════════
// DATE RANGE HELPERS
// ═══════════════════════════════════════════════════════════════

export function getDateRange(preset: '30d' | '90d' | '1y' | 'all'): DateRange {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2000); // Effectively "all time"
      break;
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}
