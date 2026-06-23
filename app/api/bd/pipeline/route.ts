// Phase 2.8: BD Pipeline Overview API - Kanban view data

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { STAGE_ORDER } from '@/types/bd';
import type { BDOpportunity, BDStage } from '@/types/bd';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const ownerId = url.searchParams.get('owner_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('bd_opportunities')
      .select('*')
      .eq('org_id', orgId);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const opportunities = (data as BDOpportunity[]) || [];

    // Group by stage
    const pipeline: Record<string, BDOpportunity[]> = {};
    let totalPipelineValue = 0;
    let totalOpportunities = 0;

    // Initialize all stages
    for (const stage of STAGE_ORDER) {
      pipeline[stage] = [];
    }
    pipeline['lost'] = [];
    pipeline['deferred'] = [];

    for (const opp of opportunities) {
      const stage = opp.stage;
      if (!pipeline[stage]) {
        pipeline[stage] = [];
      }
      pipeline[stage].push(opp);
      totalOpportunities++;

      // Add to pipeline value for active stages
      if (
        opp.estimated_fee_total &&
        ['prospect', 'qualified', 'proposal_sent', 'pitch_delivered', 'negotiate'].includes(stage)
      ) {
        totalPipelineValue += Number(opp.estimated_fee_total);
      }
    }

    // Calculate stage counts and values
    const stageStats = STAGE_ORDER.map((stage) => ({
      stage,
      count: pipeline[stage]?.length || 0,
      total_value: pipeline[stage]?.reduce(
        (sum, opp) => sum + (Number(opp.estimated_fee_total) || 0),
        0
      ) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        columns: pipeline,
        stage_order: STAGE_ORDER,
        stage_stats: stageStats,
        total_opportunities: totalOpportunities,
        total_pipeline_value: totalPipelineValue,
        lost_count: pipeline['lost']?.length || 0,
        deferred_count: pipeline['deferred']?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching BD pipeline:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline' }, { status: 500 });
  }
}
