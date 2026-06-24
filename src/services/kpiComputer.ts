// Phase 0.7: KPI Computation Engine
// Computes KPI values from source data and persists results

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  KpiDefinition,
  KpiValue,
  KpiAlert,
  KpiAlertSeverity,
} from '@/types/kpis';
import KPI_REGISTRY, { getKpiById } from '@/constants/kpiRegistry';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Compute a single KPI for an organization over a given period.
 */
export async function computeKpi(
  supabase: SupabaseClient,
  kpiDef: KpiDefinition,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<KpiValue> {
  let value = 0;
  let sampleSize = 0;

  switch (kpiDef.id) {
    case 'time_to_shortlist':
      ({ value, sampleSize } = await computeTimeToShortlist(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'time_to_hire':
      ({ value, sampleSize } = await computeTimeToHire(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'offer_acceptance_rate':
      ({ value, sampleSize } = await computeOfferAcceptanceRate(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'mandate_fill_rate':
      ({ value, sampleSize } = await computeMandateFillRate(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'candidate_engagement_rate':
      ({ value, sampleSize } = await computeCandidateEngagementRate(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'assessment_completion_rate':
      ({ value, sampleSize } = await computeAssessmentCompletionRate(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'shortlist_to_interview_ratio':
      ({ value, sampleSize } = await computeShortlistToInterviewRatio(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'interview_to_offer_ratio':
      ({ value, sampleSize } = await computeInterviewToOfferRatio(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'candidate_nps':
      ({ value, sampleSize } = await computeCandidateNPS(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    case 'withdrawal_rate':
      ({ value, sampleSize } = await computeWithdrawalRate(
        supabase,
        orgId,
        periodStart,
        periodEnd
      ));
      break;

    default:
      // For KPIs not yet implemented, return 0 with sample_size 0
      value = 0;
      sampleSize = 0;
  }

  const precision = kpiDef.precision ?? 2;
  const multiplier = Math.pow(10, precision);
  const roundedValue = Math.round(value * multiplier) / multiplier;

  return {
    kpi_id: kpiDef.id,
    org_id: orgId,
    value: roundedValue,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
    computed_at: new Date().toISOString(),
    sample_size: sampleSize,
  };
}

/**
 * Compute all KPIs for an organization over a given period.
 */
export async function computeAllKpis(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<KpiValue[]> {
  const results: KpiValue[] = [];

  for (const kpiDef of KPI_REGISTRY) {
    try {
      const value = await computeKpi(supabase, kpiDef, orgId, periodStart, periodEnd);
      results.push(value);
    } catch (err) {
      console.error(`[kpiComputer] KPI ${kpiDef.id} computation failed:`, err);
    }
  }

  return results;
}

/**
 * Persist computed KPI values to the database (upsert by unique key).
 */
export async function saveKpiValues(
  supabase: SupabaseClient,
  values: KpiValue[]
): Promise<void> {
  if (values.length === 0) return;

  for (const val of values) {
    try {
      await supabase
        .from('kpi_values')
        .upsert(val, {
          onConflict: 'kpi_id, org_id, period_start, period_end',
        });
    } catch (err) {
      console.error(`[kpiComputer] Failed to save KPI ${val.kpi_id}:`, err);
    }
  }
}

/**
 * Check KPI values against thresholds and generate alerts.
 */
export async function checkKpiThresholds(
  supabase: SupabaseClient,
  values: KpiValue[]
): Promise<KpiAlert[]> {
  const alerts: KpiAlert[] = [];

  for (const val of values) {
    const kpiDef = getKpiById(val.kpi_id);
    if (!kpiDef) continue;
    if (val.sample_size === 0) continue;

    const severity = getThresholdBreach(kpiDef, val.value);
    if (!severity) continue;

    const threshold =
      severity === 'critical'
        ? kpiDef.critical_threshold
        : kpiDef.warning_threshold;

    if (threshold === undefined) continue;

    const message = buildAlertMessage(kpiDef, val.value, severity, threshold);

    try {
      const { data, error } = await supabase
        .from('kpi_alerts')
        .insert({
          kpi_id: val.kpi_id,
          org_id: val.org_id,
          severity,
          current_value: val.value,
          threshold,
          message,
        })
        .select()
        .single();

      if (!error && data) {
        alerts.push(data as KpiAlert);
      }
    } catch (err) {
      console.error(`[kpiComputer] Failed to create alert for ${val.kpi_id}:`, err);
    }
  }

  return alerts;
}

/**
 * Get the latest KPI values for an organization.
 */
export async function getLatestKpiValues(
  supabase: SupabaseClient,
  orgId: string,
  kpiIds?: string[]
): Promise<KpiValue[]> {
  let query = supabase
    .from('kpi_values')
    .select('*')
    .eq('org_id', orgId)
    .order('period_end', { ascending: false });

  if (kpiIds && kpiIds.length > 0) {
    query = query.in('kpi_id', kpiIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[kpiComputer] Failed to get latest KPI values:', error);
    return [];
  }

  // Deduplicate: keep only the latest value per kpi_id
  const latestMap = new Map<string, KpiValue>();
  for (const item of data as KpiValue[]) {
    if (!latestMap.has(item.kpi_id)) {
      latestMap.set(item.kpi_id, item);
    }
  }

  return Array.from(latestMap.values());
}

/**
 * Get historical KPI values for trend analysis.
 */
export async function getKpiHistory(
  supabase: SupabaseClient,
  orgId: string,
  kpiId: string,
  limit: number = 12
): Promise<KpiValue[]> {
  const { data, error } = await supabase
    .from('kpi_values')
    .select('*')
    .eq('org_id', orgId)
    .eq('kpi_id', kpiId)
    .order('period_end', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`[kpiComputer] Failed to get history for ${kpiId}:`, error);
    return [];
  }

  return (data as KpiValue[]).reverse(); // oldest first
}

// ============================================================================
// Individual KPI Computation Functions
// ============================================================================

async function computeTimeToShortlist(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { data, error } = await supabase
      .from('mandates')
      .select(
        `
        id,
        created_at,
        organization_id,
        shortlist:candidates(status, created_at, shortlisted_at)
      `
      )
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const days: number[] = [];

    for (const mandate of data) {
      const shortlists = (mandate as { shortlist?: Array<{ shortlisted_at?: string; created_at?: string }> }).shortlist;
      if (!shortlists || shortlists.length === 0) continue;

      const firstShortlist = shortlists
        .filter(s => s.shortlisted_at || s.created_at)
        .sort((a, b) => {
          const aDate = a.shortlisted_at || a.created_at || '';
          const bDate = b.shortlisted_at || b.created_at || '';
          return aDate.localeCompare(bDate);
        })[0];

      if (firstShortlist) {
        const firstDate = firstShortlist.shortlisted_at || firstShortlist.created_at;
        if (firstDate && mandate.created_at) {
          const diffMs = new Date(firstDate).getTime() - new Date(mandate.created_at).getTime();
          if (diffMs > 0) {
            days.push(diffMs / MS_PER_DAY);
          }
        }
      }
    }

    const value = days.length
      ? days.reduce((a, b) => a + b, 0) / days.length
      : 0;

    return { value, sampleSize: days.length };
  } catch (err) {
    console.error('[kpiComputer] time_to_shortlist error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeTimeToHire(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(
        `
        id,
        created_at,
        accepted_at,
        organization_id,
        mandate_id,
        mandates!offers_mandate_id_fkey(created_at)
      `
      )
      .eq('organization_id', orgId)
      .eq('status', 'accepted')
      .gte('accepted_at', periodStart.toISOString())
      .lte('accepted_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const days: number[] = [];

    for (const offer of data as Array<{
      accepted_at: string;
      mandates: { created_at: string } | null;
    }>) {
      if (offer.mandates?.created_at && offer.accepted_at) {
        const diffMs =
          new Date(offer.accepted_at).getTime() -
          new Date(offer.mandates.created_at).getTime();
        if (diffMs > 0) {
          days.push(diffMs / MS_PER_DAY);
        }
      }
    }

    const value = days.length
      ? days.reduce((a, b) => a + b, 0) / days.length
      : 0;

    return { value, sampleSize: days.length };
  } catch (err) {
    console.error('[kpiComputer] time_to_hire error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeOfferAcceptanceRate(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('status')
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())
      .in('status', ['sent', 'accepted', 'rejected', 'withdrawn']);

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const offers = data as Array<{ status: string }>;
    const total = offers.length;
    const accepted = offers.filter(o => o.status === 'accepted').length;

    const value = total > 0 ? (accepted / total) * 100 : 0;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] offer_acceptance_rate error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeMandateFillRate(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { data, error } = await supabase
      .from('mandates')
      .select('status')
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const mandates = data as Array<{ status: string }>;
    const total = mandates.length;
    const filled = mandates.filter(
      m => m.status === 'filled' || m.status === 'completed' || m.status === 'closed'
    ).length;

    const value = total > 0 ? (filled / total) * 100 : 0;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] mandate_fill_rate error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeCandidateEngagementRate(
  supabase: SupabaseClient,
  orgId: string,
  _periodStart: Date,
  _periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * MS_PER_DAY).toISOString();

    const { count: totalCount, error: totalError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    if (totalError) {
      return { value: 0, sampleSize: 0 };
    }

    // Active candidates: those with recent activity (last login or update)
    const { count: activeCount, error: activeError } = await supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('updated_at', sevenDaysAgo);

    if (activeError) {
      return { value: 0, sampleSize: 0 };
    }

    const total = totalCount || 0;
    const active = activeCount || 0;
    const value = total > 0 ? (active / total) * 100 : 0;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] candidate_engagement_rate error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeAssessmentCompletionRate(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    // Use candidate assessments if table exists, otherwise return 0
    const { data, error } = await supabase
      .from('candidate_assessments')
      .select('status')
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const assessments = data as Array<{ status: string }>;
    const total = assessments.length;
    const completed = assessments.filter(
      a => a.status === 'completed' || a.status === 'finished'
    ).length;

    const value = total > 0 ? (completed / total) * 100 : 0;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] assessment_completion_rate error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeShortlistToInterviewRatio(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('status, shortlisted_at, interview_scheduled_at')
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const candidates = data as Array<{
      status: string;
      shortlisted_at?: string;
      interview_scheduled_at?: string;
    }>;

    const shortlisted = candidates.filter(
      c => c.shortlisted_at || c.status === 'shortlisted'
    ).length;
    const interviewed = candidates.filter(
      c => c.interview_scheduled_at || c.status === 'interview' || c.status === 'interviews'
    ).length;

    const value = shortlisted > 0 ? (interviewed / shortlisted) * 100 : 0;

    return { value, sampleSize: shortlisted };
  } catch (err) {
    console.error('[kpiComputer] shortlist_to_interview_ratio error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeInterviewToOfferRatio(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { count: interviewCount, error: interviewError } = await supabase
      .from('interviews')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (interviewError) {
      return { value: 0, sampleSize: 0 };
    }

    const { count: offerCount, error: offerError } = await supabase
      .from('offers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (offerError) {
      return { value: 0, sampleSize: 0 };
    }

    const interviews = interviewCount || 0;
    const offers = offerCount || 0;
    const value = interviews > 0 ? (offers / interviews) * 100 : 0;

    return { value, sampleSize: interviews };
  } catch (err) {
    console.error('[kpiComputer] interview_to_offer_ratio error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeCandidateNPS(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    // NPS from feedback surveys if available
    const { data, error } = await supabase
      .from('feedback_surveys')
      .select('nps_score')
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (error || !data) {
      return { value: 0, sampleSize: 0 };
    }

    const surveys = data as Array<{ nps_score: number }>;
    const total = surveys.length;

    if (total === 0) return { value: 0, sampleSize: 0 };

    const promoters = surveys.filter(s => s.nps_score >= 9).length;
    const detractors = surveys.filter(s => s.nps_score <= 6).length;

    const value = ((promoters - detractors) / total) * 100;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] candidate_nps error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

async function computeWithdrawalRate(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ value: number; sampleSize: number }> {
  try {
    const { count: totalCount, error: totalError } = await supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (totalError) {
      return { value: 0, sampleSize: 0 };
    }

    const { count: withdrawnCount, error: withdrawnError } = await supabase
      .from('candidates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'withdrawn')
      .gte('withdrawn_at', periodStart.toISOString())
      .lte('withdrawn_at', periodEnd.toISOString());

    if (withdrawnError) {
      return { value: 0, sampleSize: 0 };
    }

    const total = totalCount || 0;
    const withdrawn = withdrawnCount || 0;
    const value = total > 0 ? (withdrawn / total) * 100 : 0;

    return { value, sampleSize: total };
  } catch (err) {
    console.error('[kpiComputer] withdrawal_rate error:', err);
    return { value: 0, sampleSize: 0 };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getThresholdBreach(
  kpiDef: KpiDefinition,
  value: number
): KpiAlertSeverity | null {
  const higherIsBetter = kpiDef.higher_is_better ?? true;

  if (kpiDef.critical_threshold !== undefined) {
    const breached = higherIsBetter
      ? value <= kpiDef.critical_threshold
      : value >= kpiDef.critical_threshold;
    if (breached) return 'critical';
  }

  if (kpiDef.warning_threshold !== undefined) {
    const breached = higherIsBetter
      ? value <= kpiDef.warning_threshold
      : value >= kpiDef.warning_threshold;
    if (breached) return 'warning';
  }

  return null;
}

function buildAlertMessage(
  kpiDef: KpiDefinition,
  value: number,
  severity: KpiAlertSeverity,
  threshold: number
): string {
  const higherIsBetter = kpiDef.higher_is_better ?? true;
  const direction = higherIsBetter ? 'below' : 'above';
  const unit = kpiDef.unit === 'percentage' ? '%' : '';

  return `${kpiDef.name} is ${severity}: ${value}${unit} is ${direction} ${threshold}${unit} threshold`;
}

export default {
  computeKpi,
  computeAllKpis,
  saveKpiValues,
  checkKpiThresholds,
  getLatestKpiValues,
  getKpiHistory,
};
