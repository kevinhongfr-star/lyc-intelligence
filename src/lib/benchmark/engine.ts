// Phase 7.5: BENCHMARK Assessment Engine

import type { SupabaseClient } from '@supabase/supabase-js';
import { authFetch } from '@/utils/authFetch';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface BenchmarkRun {
  id: string;
  assessment_type: 'SHIFT_LEAP' | 'SHIFT_QUEST' | 'SHIFT_DRIVE' | 'SHIFT_COACH' | 'SHIFT_IMPACT';
  benchmark_scope: 'industry' | 'function' | 'seniority' | 'custom';
  industry_filter: string[];
  function_filter: string[];
  seniority_filter: string[];
  team_member_ids: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: BenchmarkResult[] | null;
  peer_sample_size: number | null;
  credits_charged: number;
  created_by: string | null;
  organization_id: string;
  created_at: string;
  completed_at: string | null;
}

export interface BenchmarkResult {
  member_id: string;
  member_name: string;
  dimension_scores: Record<string, number>;
  percentile_rank: Record<string, number>;
  team_average: Record<string, number>;
  peer_average: Record<string, number>;
}

export interface CozeBenchmarkInput {
  assessment_type: string;
  team_scores: Array<{
    user_id: string;
    dimension_scores: Record<string, number>;
  }>;
  peer_scores: Array<{
    dimension_scores: Record<string, number>;
  }>;
  peer_sample_size: number;
}

export interface CozeBenchmarkOutput {
  insights: string[];
  recommendations: string[];
  team_strengths: string[];
  team_gaps: string[];
}

// ═══════════════════════════════════════════════════════════════
// PEER COMPARISON ENGINE
// ═══════════════════════════════════════════════════════════════

const ASSESSMENT_DIMENSIONS: Record<string, string[]> = {
  SHIFT_LEAP: ['strategic_thinking', 'execution', 'learning_agility', 'leadership_presence', 'change_navigation'],
  SHIFT_QUEST: ['analytical_depth', 'problem_solving', 'decision_quality', 'innovation', 'collaboration'],
  SHIFT_DRIVE: ['goal_orientation', 'resilience', 'time_management', 'resourcefulness', 'adaptability'],
  SHIFT_COACH: ['empathy', 'communication', 'feedback_delivery', 'development_focus', 'trust_building'],
  SHIFT_IMPACT: ['influence', 'negotiation', 'stakeholder_management', 'vision_alignment', 'results_delivery'],
};

/**
 * Get SHIFT results for team members
 */
export async function getTeamShiftResults(
  supabase: SupabaseClient,
  assessmentType: string,
  teamMemberIds: string[]
): Promise<Array<{ user_id: string; output_scores: Record<string, number>; profile: { name: string } }>> {
  const { data, error } = await supabase
    .from('scoring_runs')
    .select(`
      user_id,
      output_scores,
      profiles:user_id(name)
    `)
    .eq('assessment_type', assessmentType)
    .in('user_id', teamMemberIds)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Get latest result per user
  const latestResults = new Map<string, any>();
  for (const result of data) {
    if (!latestResults.has(result.user_id)) {
      latestResults.set(result.user_id, result);
    }
  }

  return Array.from(latestResults.values()).map(r => ({
    user_id: r.user_id,
    output_scores: r.output_scores as Record<string, number>,
    profile: r.profiles || { name: 'Unknown' },
  }));
}

/**
 * Get SHIFT results for peer group
 */
export async function getPeerShiftResults(
  supabase: SupabaseClient,
  assessmentType: string,
  scope: string,
  filters: {
    industry?: string[];
    function?: string[];
    seniority?: string[];
  }
): Promise<Array<{ output_scores: Record<string, number> }>> {
  let query = supabase
    .from('scoring_runs')
    .select(`
      output_scores,
      profiles:user_id(industry, function, seniority)
    `)
    .eq('assessment_type', assessmentType);

  const { data, error } = await query.limit(500);

  if (error || !data) return [];

  // Filter based on scope
  let filtered = data;
  if (scope === 'industry' && filters.industry?.length) {
    filtered = filtered.filter(r => 
      filters.industry!.includes(r.profiles?.industry || '')
    );
  } else if (scope === 'function' && filters.function?.length) {
    filtered = filtered.filter(r => 
      filters.function!.includes(r.profiles?.function || '')
    );
  } else if (scope === 'seniority' && filters.seniority?.length) {
    filtered = filtered.filter(r => 
      filters.seniority!.includes(r.profiles?.seniority || '')
    );
  } else if (scope === 'custom') {
    filtered = filtered.filter(r => {
      const profile = r.profiles || {};
      const industryMatch = !filters.industry?.length || filters.industry.includes(profile.industry || '');
      const functionMatch = !filters.function?.length || filters.function.includes(profile.function || '');
      const seniorityMatch = !filters.seniority?.length || filters.seniority.includes(profile.seniority || '');
      return industryMatch && functionMatch && seniorityMatch;
    });
  }

  return filtered.map(r => ({
    output_scores: r.output_scores as Record<string, number>,
  }));
}

/**
 * Calculate percentile rank
 */
export function calculatePercentileRank(
  value: number,
  peerValues: number[]
): number {
  if (peerValues.length === 0) return 50;
  
  const sorted = peerValues.sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return Math.round((below / peerValues.length) * 100);
}

/**
 * Calculate team average for a dimension
 */
export function calculateTeamAverage(
  teamResults: Array<{ output_scores: Record<string, number> }>,
  dimension: string
): number {
  const scores = teamResults
    .map(r => r.output_scores[dimension])
    .filter(s => s !== undefined);
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate peer average for a dimension
 */
export function calculatePeerAverage(
  peerResults: Array<{ output_scores: Record<string, number> }>,
  dimension: string
): number {
  const scores = peerResults
    .map(r => r.output_scores[dimension])
    .filter(s => s !== undefined);
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Run benchmark comparison
 */
export async function runBenchmarkComparison(
  supabase: SupabaseClient,
  benchmarkId: string
): Promise<BenchmarkResult[]> {
  // Get benchmark run
  const { data: benchmark, error: benchmarkError } = await supabase
    .from('benchmark_runs')
    .select('*')
    .eq('id', benchmarkId)
    .single();

  if (benchmarkError || !benchmark) {
    throw new Error('Benchmark run not found');
  }

  // Update status to running
  await supabase
    .from('benchmark_runs')
    .update({ status: 'running' })
    .eq('id', benchmarkId);

  try {
    // Get team results
    const teamResults = await getTeamShiftResults(
      supabase,
      benchmark.assessment_type,
      benchmark.team_member_ids
    );

    // Get peer results
    const peerResults = await getPeerShiftResults(
      supabase,
      benchmark.assessment_type,
      benchmark.benchmark_scope,
      {
        industry: benchmark.industry_filter,
        function: benchmark.function_filter,
        seniority: benchmark.seniority_filter,
      }
    );

    // Check minimum peer sample size
    if (peerResults.length < 50) {
      throw new Error(`Insufficient peer data: ${peerResults.length} results (minimum 50 required)`);
    }

    const dimensions = ASSESSMENT_DIMENSIONS[benchmark.assessment_type] || [];
    const results: BenchmarkResult[] = [];

    // Calculate results for each team member
    for (const teamMember of teamResults) {
      const percentileRank: Record<string, number> = {};
      const teamAverage: Record<string, number> = {};
      const peerAverage: Record<string, number> = {};

      for (const dimension of dimensions) {
        const memberScore = teamMember.output_scores[dimension] || 0;
        
        // Get peer values for this dimension
        const peerValues = peerResults
          .map(r => r.output_scores[dimension])
          .filter(s => s !== undefined);

        percentileRank[dimension] = calculatePercentileRank(memberScore, peerValues);
        teamAverage[dimension] = calculateTeamAverage(teamResults, dimension);
        peerAverage[dimension] = calculatePeerAverage(peerResults, dimension);
      }

      results.push({
        member_id: teamMember.user_id,
        member_name: teamMember.profile.name,
        dimension_scores: teamMember.output_scores,
        percentile_rank: percentileRank,
        team_average: teamAverage,
        peer_average: peerAverage,
      });
    }

    // Update benchmark run with results
    await supabase
      .from('benchmark_runs')
      .update({
        status: 'completed',
        results: results,
        peer_sample_size: peerResults.length,
        completed_at: new Date().toISOString(),
      })
      .eq('id', benchmarkId);

    return results;
  } catch (error) {
    // Update status to failed
    await supabase
      .from('benchmark_runs')
      .update({ status: 'failed' })
      .eq('id', benchmarkId);
    
    throw error;
  }
}

/**
 * Call Coze workflow for AI insights via server-side API route.
 */
export async function callCozeBenchmarkWorkflow(
  input: CozeBenchmarkInput
): Promise<CozeBenchmarkOutput> {
  try {
    const response = await authFetch('/api/x/benchmark/coze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.warn('Coze benchmark API call failed:', response.status);
      return generateDefaultInsights(input);
    }

    const data = await response.json();
    return data as CozeBenchmarkOutput;
  } catch (error) {
    console.warn('Coze benchmark error:', error);
    return generateDefaultInsights(input);
  }
}

/**
 * Generate default insights when Coze unavailable
 */
function generateDefaultInsights(input: CozeBenchmarkInput): CozeBenchmarkOutput {
  const teamAvg: Record<string, number> = {};
  const peerAvg: Record<string, number> = {};

  // Calculate averages
  const dimensions = Object.keys(input.team_scores[0]?.dimension_scores || {});
  
  for (const dim of dimensions) {
    const teamScores = input.team_scores.map(s => s.dimension_scores[dim] || 0);
    const peerScores = input.peer_scores.map(s => s.dimension_scores[dim] || 0);
    
    teamAvg[dim] = Math.round(teamScores.reduce((a, b) => a + b, 0) / teamScores.length);
    peerAvg[dim] = Math.round(peerScores.reduce((a, b) => a + b, 0) / peerScores.length);
  }

  // Find strengths and gaps
  const strengths: string[] = [];
  const gaps: string[] = [];
  const insights: string[] = [];

  for (const dim of dimensions) {
    const diff = teamAvg[dim] - peerAvg[dim];
    if (diff >= 10) {
      strengths.push(dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      insights.push(`Your team scores ${diff}% above peer average in ${dim.replace('_', ' ')}`);
    } else if (diff <= -10) {
      gaps.push(dim.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      insights.push(`${dim.replace('_', ' ')} is ${Math.abs(diff)}% below peer average — consider focused development`);
    }
  }

  const recommendations: string[] = [];
  if (gaps.length > 0) {
    recommendations.push(`Invest in ${gaps[0].toLowerCase()} coaching workshops`);
  }
  if (strengths.length > 0) {
    recommendations.push(`Leverage ${strengths[0].toLowerCase()} strength in client-facing roles`);
  }

  return {
    insights: insights.length > 0 ? insights : ['Team performance is within peer range'],
    recommendations: recommendations.length > 0 ? recommendations : ['Continue current development programs'],
    team_strengths: strengths.length > 0 ? strengths : ['Consistent performance'],
    team_gaps: gaps.length > 0 ? gaps : ['No significant gaps identified'],
  };
}

/**
 * Count SHIFT results for assessment type
 */
export async function countShiftResults(
  supabase: SupabaseClient,
  assessmentType: string
): Promise<number> {
  const { count, error } = await supabase
    .from('scoring_runs')
    .select('id', { count: 'exact', head: true })
    .eq('assessment_type', assessmentType);

  if (error || count === null) return 0;
  return count;
}

/**
 * Count SHIFT results matching filters
 */
export async function countPeerResults(
  supabase: SupabaseClient,
  assessmentType: string,
  scope: string,
  filters: {
    industry?: string[];
    function?: string[];
    seniority?: string[];
  }
): Promise<number> {
  const peerResults = await getPeerShiftResults(supabase, assessmentType, scope, filters);
  return peerResults.length;
}

/**
 * Charge credits for benchmark run
 */
export async function chargeForBenchmark(
  supabase: SupabaseClient,
  benchmarkId: string
): Promise<boolean> {
  const { data: benchmark, error } = await supabase
    .from('benchmark_runs')
    .select('organization_id, assessment_type')
    .eq('id', benchmarkId)
    .single();

  if (error || !benchmark) return false;

  // Deduct credits (would integrate with org credit system)
  // For now, just log the charge
  console.log(`Charging 15 credits for benchmark: ${benchmark.assessment_type} to org: ${benchmark.organization_id}`);

  return true;
}

export default {
  getTeamShiftResults,
  getPeerShiftResults,
  calculatePercentileRank,
  calculateTeamAverage,
  calculatePeerAverage,
  runBenchmarkComparison,
  callCozeBenchmarkWorkflow,
  countShiftResults,
  countPeerResults,
  chargeForBenchmark,
  ASSESSMENT_DIMENSIONS,
};