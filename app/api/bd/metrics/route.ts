// Phase 2.8: BD Pipeline Metrics API - Conversion rates and pipeline value

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BDOpportunity, BDPipelineMetrics } from '@/types/bd';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const period = url.searchParams.get('period') || 'all'; // 'all', 'week', 'month', 'quarter'

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    // Get all opportunities for the org
    const { data: opportunities, error } = await supabase
      .from('bd_opportunities')
      .select('*')
      .eq('org_id', orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allOpps = (opportunities as BDOpportunity[]) || [];

    // Filter by period if specified
    const filteredOpps = filterByPeriod(allOpps, period);

    // Calculate metrics
    const metrics = calculateMetrics(filteredOpps, allOpps);

    // Try to get stored metrics too
    const { data: storedMetrics } = await supabase
      .from('bd_pipeline_metrics')
      .select('*')
      .eq('org_id', orgId)
      .order('period_start', { ascending: false })
      .limit(12);

    return NextResponse.json({
      success: true,
      data: {
        current: metrics,
        period,
        historical: (storedMetrics as BDPipelineMetrics[]) || [],
      },
    });
  } catch (error) {
    console.error('Error fetching BD metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

function filterByPeriod(opps: BDOpportunity[], period: string): BDOpportunity[] {
  if (period === 'all') return opps;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return opps;
  }

  return opps.filter((opp) => new Date(opp.created_at) >= startDate);
}

function calculateMetrics(opps: BDOpportunity[], allOpps: BDOpportunity[]) {
  // Funnel counts
  const newProspects = opps.filter((o) => o.stage === 'prospect').length;
  const qualified = opps.filter((o) => o.qualified_at).length;
  const proposalsSent = opps.filter((o) => o.proposal_sent_at).length;
  const pitchesDelivered = opps.filter((o) => o.pitch_delivered_at).length;
  const signed = opps.filter((o) => o.stage === 'signed').length;
  const lost = opps.filter((o) => o.stage === 'lost').length;

  // Conversion rates
  const prospectToQualified =
    newProspects > 0 ? (qualified / newProspects) * 100 : 0;
  const qualifiedToSigned =
    qualified > 0 ? (signed / qualified) * 100 : 0;
  const overallWinRate =
    signed + lost > 0 ? (signed / (signed + lost)) * 100 : 0;

  // Value metrics (from all opps for pipeline value)
  const activeStages = ['prospect', 'qualified', 'proposal_sent', 'pitch_delivered', 'negotiate'];
  const totalPipelineValue = allOpps
    .filter((o) => activeStages.includes(o.stage) && o.estimated_fee_total)
    .reduce((sum, o) => sum + (Number(o.estimated_fee_total) || 0), 0);

  const signedValue = allOpps
    .filter((o) => o.stage === 'signed' && o.estimated_fee_total)
    .reduce((sum, o) => sum + (Number(o.estimated_fee_total) || 0), 0);

  const signedOppsWithValue = allOpps.filter(
    (o) => o.stage === 'signed' && o.estimated_fee_total
  );
  const avgDealSize =
    signedOppsWithValue.length > 0
      ? signedValue / signedOppsWithValue.length
      : 0;

  // Stage counts for funnel
  const stageCounts = {
    prospect: allOpps.filter((o) => o.stage === 'prospect').length,
    qualified: allOpps.filter((o) => o.stage === 'qualified').length,
    proposal_sent: allOpps.filter((o) => o.stage === 'proposal_sent').length,
    pitch_delivered: allOpps.filter((o) => o.stage === 'pitch_delivered').length,
    negotiate: allOpps.filter((o) => o.stage === 'negotiate').length,
    signed: allOpps.filter((o) => o.stage === 'signed').length,
    lost: allOpps.filter((o) => o.stage === 'lost').length,
    deferred: allOpps.filter((o) => o.stage === 'deferred').length,
  };

  return {
    funnel: {
      new_prospects: newProspects,
      qualified,
      proposals_sent: proposalsSent,
      pitches_delivered: pitchesDelivered,
      signed,
      lost,
    },
    conversion_rates: {
      prospect_to_qualified_pct: Math.round(prospectToQualified * 10) / 10,
      qualified_to_signed_pct: Math.round(qualifiedToSigned * 10) / 10,
      overall_win_rate_pct: Math.round(overallWinRate * 10) / 10,
    },
    value: {
      total_pipeline_value: Math.round(totalPipelineValue * 100) / 100,
      signed_value: Math.round(signedValue * 100) / 100,
      avg_deal_size: Math.round(avgDealSize * 100) / 100,
    },
    stage_counts: stageCounts,
    total_opportunities: allOpps.length,
  };
}
