// Phase 3.8: Compensation Benchmark Engine
// Computes percentiles from placement data with progressive relaxation

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BenchmarkInput,
  BenchmarkResult,
  CompDataPoint,
  HistoryDataPoint,
  ConfidenceLevel,
} from '@/types/compensation';

const MIN_SAMPLE_SIZE = 3;
const HIGH_CONFIDENCE_SAMPLE = 10;

/**
 * Compute a compensation benchmark for a given role/location.
 * Uses progressive relaxation: city → country → job title only.
 */
export async function computeBenchmark(
  supabase: SupabaseClient,
  orgId: string,
  input: BenchmarkInput
): Promise<BenchmarkResult | null> {
  // Strategy 1: Exact match (city + industry + job title)
  const exactResult = await tryBenchmark(supabase, orgId, input, {
    includeCity: true,
    includeIndustry: true,
  });

  if (exactResult && exactResult.sampleSize >= HIGH_CONFIDENCE_SAMPLE) {
    return { ...exactResult, confidence: 'high', relaxationLevel: 0 };
  }

  if (exactResult && exactResult.sampleSize >= MIN_SAMPLE_SIZE) {
    return { ...exactResult, confidence: 'medium', relaxationLevel: 0 };
  }

  // Strategy 2: Relax city (country + industry + job title)
  if (input.city) {
    const countryResult = await tryBenchmark(supabase, orgId, input, {
      includeCity: false,
      includeIndustry: true,
    });

    if (countryResult && countryResult.sampleSize >= MIN_SAMPLE_SIZE) {
      const confidence: ConfidenceLevel =
        countryResult.sampleSize >= HIGH_CONFIDENCE_SAMPLE ? 'medium' : 'low';
      return {
        ...countryResult,
        confidence,
        relaxationLevel: 1,
        relaxationNote: `Relaxed city constraint (${input.city} → ${input.country || 'CN'})`,
      };
    }
  }

  // Strategy 3: Relax industry (city + job title)
  if (input.industry) {
    const noIndustryResult = await tryBenchmark(supabase, orgId, input, {
      includeCity: true,
      includeIndustry: false,
    });

    if (noIndustryResult && noIndustryResult.sampleSize >= MIN_SAMPLE_SIZE) {
      return {
        ...noIndustryResult,
        confidence: 'low',
        relaxationLevel: 2,
        relaxationNote: `Relaxed industry constraint`,
      };
    }
  }

  // Strategy 4: Most relaxed (job title + country only)
  const relaxedResult = await tryBenchmark(supabase, orgId, input, {
    includeCity: false,
    includeIndustry: false,
  });

  if (relaxedResult && relaxedResult.sampleSize >= MIN_SAMPLE_SIZE) {
    return {
      ...relaxedResult,
      confidence: 'low',
      relaxationLevel: 3,
      relaxationNote: 'Broad match (country + job title only)',
    };
  }

  return null;
}

/**
 * Try computing a benchmark with specific constraint levels
 */
async function tryBenchmark(
  supabase: SupabaseClient,
  orgId: string,
  input: BenchmarkInput,
  options: { includeCity: boolean; includeIndustry: boolean }
): Promise<BenchmarkResult | null> {
  let query = supabase
    .from('comp_data_points')
    .select('total_cash_annual, currency, source_type')
    .eq('org_id', orgId);

  // Job title fuzzy match
  query = query.ilike('job_title', `%${input.jobTitle}%`);

  if (options.includeIndustry && input.industry) {
    query = query.eq('industry', input.industry);
  }
  if (input.country) {
    query = query.eq('country', input.country);
  }
  if (options.includeCity && input.city) {
    query = query.eq('city', input.city);
  }
  if (input.level) {
    // Level may not be directly in data points; skip for now
  }

  const { data, error } = await query;

  if (error || !data || data.length < MIN_SAMPLE_SIZE) {
    return null;
  }

  const dataPoints = data as CompDataPoint[];
  const sources = Array.from(new Set(dataPoints.map(d => d.source_type)));

  return calculatePercentiles(dataPoints, 'medium', sources);
}

/**
 * Calculate percentile statistics from an array of data points
 */
export function calculatePercentiles(
  data: Array<{ total_cash_annual: number | null; currency: string }>,
  baseConfidence: ConfidenceLevel,
  dataSources: string[]
): BenchmarkResult {
  const values = data
    .map(d => d.total_cash_annual)
    .filter((v): v is number => v != null && !isNaN(v) && v > 0)
    .sort((a, b) => a - b);

  const n = values.length;
  const currency = data[0]?.currency || 'CNY';

  if (n === 0) {
    return {
      p10: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      mean: 0,
      sampleSize: 0,
      currency,
      confidence: 'low',
      dataSources,
    };
  }

  const p10 = percentile(values, 0.1);
  const p25 = percentile(values, 0.25);
  const p50 = percentile(values, 0.5);
  const p75 = percentile(values, 0.75);
  const p90 = percentile(values, 0.9);
  const mean = Math.round(values.reduce((a, b) => a + b, 0) / n);

  let confidence: ConfidenceLevel = baseConfidence;
  if (n >= HIGH_CONFIDENCE_SAMPLE) {
    confidence = 'high';
  } else if (n >= MIN_SAMPLE_SIZE) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    p10: Math.round(p10),
    p25: Math.round(p25),
    p50: Math.round(p50),
    p75: Math.round(p75),
    p90: Math.round(p90),
    mean,
    sampleSize: n,
    currency,
    confidence,
    dataSources,
  };
}

/**
 * Calculate a single percentile from a sorted array
 * Uses linear interpolation between closest ranks
 */
function percentile(sortedValues: number[], p: number): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n === 1) return sortedValues[0];

  const index = (n - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Refresh all benchmarks from latest data points
 */
export async function refreshBenchmarks(
  supabase: SupabaseClient,
  orgId: string
): Promise<{ updated: number; total: number }> {
  // Get distinct job title + industry + city + country combos
  const { data: combos, error } = await supabase
    .from('comp_data_points')
    .select('job_title, industry, city, country, level')
    .eq('org_id', orgId);

  if (error || !combos) {
    return { updated: 0, total: 0 };
  }

  // Build unique keys
  const uniqueKeys = new Map<string, BenchmarkInput>();
  for (const c of combos) {
    const key = `${c.job_title}|${c.industry ?? ''}|${c.city ?? ''}|${c.country ?? 'CN'}`;
    if (!uniqueKeys.has(key)) {
      uniqueKeys.set(key, {
        jobTitle: c.job_title,
        industry: c.industry ?? undefined,
        city: c.city ?? undefined,
        country: c.country ?? undefined,
      });
    }
  }

  let updated = 0;
  const total = uniqueKeys.size;

  for (const input of uniqueKeys.values()) {
    const result = await computeBenchmark(supabase, orgId, input);
    if (result) {
      try {
        await supabase.from('comp_benchmarks').upsert(
          {
            org_id: orgId,
            job_title_pattern: input.jobTitle,
            industry: input.industry || null,
            country: input.country || 'CN',
            city: input.city || null,
            level: input.level || null,
            p10: result.p10,
            p25: result.p25,
            p50: result.p50,
            p75: result.p75,
            p90: result.p90,
            mean: result.mean,
            sample_size: result.sampleSize,
            data_sources: result.dataSources,
            effective_from: new Date().toISOString().split('T')[0],
            currency: result.currency,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'org_id, job_title_pattern, industry, country, city',
          }
        );
        updated++;
      } catch (upsertError) {
        console.error('[compBenchmark] Upsert failed:', upsertError);
      }
    }
  }

  return { updated, total };
}

/**
 * Get compensation history over time for a role
 */
export async function getCompensationHistory(
  supabase: SupabaseClient,
  orgId: string,
  input: BenchmarkInput,
  months: number = 12
): Promise<HistoryDataPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('comp_data_points')
    .select('total_cash_annual, currency, data_date, source_type')
    .eq('org_id', orgId)
    .ilike('job_title', `%${input.jobTitle}%`)
    .gte('data_date', startDate.toISOString().split('T')[0])
    .lte('data_date', endDate.toISOString().split('T')[0])
    .order('data_date', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  // Group by month
  const monthlyData: Record<string, CompDataPoint[]> = {};

  for (const point of data as CompDataPoint[]) {
    const monthKey = point.data_date.substring(0, 7); // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(point);
  }

  // Calculate percentiles per month
  const result: HistoryDataPoint[] = [];

  for (const [month, points] of Object.entries(monthlyData)) {
    if (points.length < MIN_SAMPLE_SIZE) continue;

    const values = points
      .map(p => p.total_cash_annual)
      .filter((v): v is number => v != null && !isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    if (values.length < MIN_SAMPLE_SIZE) continue;

    const p25 = percentile(values, 0.25);
    const p50 = percentile(values, 0.5);
    const p75 = percentile(values, 0.75);

    result.push({
      date: `${month}-01`,
      p25: Math.round(p25),
      p50: Math.round(p50),
      p75: Math.round(p75),
      sampleSize: values.length,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get autocomplete suggestions for job titles
 */
export async function getJobTitleSuggestions(
  supabase: SupabaseClient,
  orgId: string,
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('comp_data_points')
    .select('job_title')
    .eq('org_id', orgId)
    .ilike('job_title', `%${query}%`)
    .limit(limit * 5);

  if (error || !data) return [];

  // Deduplicate
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const item of data) {
    const title = (item as { job_title: string }).job_title;
    if (!seen.has(title)) {
      seen.add(title);
      suggestions.push(title);
      if (suggestions.length >= limit) break;
    }
  }

  return suggestions;
}

export default {
  computeBenchmark,
  calculatePercentiles,
  refreshBenchmarks,
  getCompensationHistory,
  getJobTitleSuggestions,
};
