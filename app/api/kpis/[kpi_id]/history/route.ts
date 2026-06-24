// Phase 0.7: KPI Historical Trend API
// GET historical KPI values for trend analysis

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKpiHistory } from '@/services/kpiComputer';
import { getKpiById } from '@/constants/kpiRegistry';
import type { KpiHistoryPoint } from '@/types/kpis';

export async function GET(
  request: Request,
  { params }: { params: { kpi_id: string } }
) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const limit = parseInt(url.searchParams.get('limit') || '12', 10);

  if (!orgId) {
    return NextResponse.json(
      { error: 'org_id is required' },
      { status: 400 }
    );
  }

  const kpiDef = getKpiById(params.kpi_id);
  if (!kpiDef) {
    return NextResponse.json(
      { error: `Unknown KPI: ${params.kpi_id}` },
      { status: 404 }
    );
  }

  try {
    const history = await getKpiHistory(supabase, orgId, params.kpi_id, limit);

    const dataPoints: KpiHistoryPoint[] = history.map(item => ({
      period_start: item.period_start,
      period_end: item.period_end,
      value: item.value,
      sample_size: item.sample_size,
    }));

    return NextResponse.json({
      success: true,
      kpi: {
        id: kpiDef.id,
        name: kpiDef.name,
        unit: kpiDef.unit,
        category: kpiDef.category,
        target: kpiDef.target,
        warning_threshold: kpiDef.warning_threshold,
        critical_threshold: kpiDef.critical_threshold,
      },
      data_points: dataPoints,
      count: dataPoints.length,
    });
  } catch (error) {
    console.error('[kpi history API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI history' },
      { status: 500 }
    );
  }
}
