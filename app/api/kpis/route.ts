// Phase 0.7: KPI Retrieval API
// GET current KPI values for an organization

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLatestKpiValues } from '@/services/kpiComputer';
import KPI_REGISTRY, { getKpiById } from '@/constants/kpiRegistry';
import type { KpiWithValue, KpiTrend, KpiValue } from '@/types/kpis';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const category = url.searchParams.get('category');
  const dashboard = url.searchParams.get('dashboard');

  if (!orgId) {
    return NextResponse.json(
      { error: 'org_id is required' },
      { status: 400 }
    );
  }

  try {
    // Filter KPIs based on query params
    let kpiDefs = KPI_REGISTRY;

    if (category) {
      kpiDefs = kpiDefs.filter(k => k.category === category);
    }

    if (dashboard) {
      kpiDefs = kpiDefs.filter(k =>
        k.dashboard.includes(dashboard as typeof k.dashboard[number])
      );
    }

    const kpiIds = kpiDefs.map(k => k.id);

    // Get latest values
    const latestValues = await getLatestKpiValues(supabase, orgId, kpiIds);

    // Build KPI with value objects
    const kpisWithValues: KpiWithValue[] = kpiDefs.map(kpiDef => {
      const currentValue =
        latestValues.find(v => v.kpi_id === kpiDef.id) || null;

      // For trend, we'd need previous period value
      // For now, mark as flat if no previous value
      const previousValue = null as KpiValue | null;
      const trend: KpiTrend = 'flat';
      const trendPercentage = 0;

      const status = getKpiStatus(kpiDef, currentValue?.value);

      return {
        ...kpiDef,
        current_value: currentValue,
        previous_value: previousValue,
        trend,
        trend_percentage: trendPercentage,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      kpis: kpisWithValues,
      total: kpisWithValues.length,
    });
  } catch (error) {
    console.error('[kpis API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPIs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const {
      org_id,
      period_start,
      period_end,
      kpi_ids,
    } = body;

    if (!org_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'org_id, period_start, and period_end are required' },
        { status: 400 }
      );
    }

    // Dynamically import to avoid circular dependency issues
    const { computeAllKpis, saveKpiValues, checkKpiThresholds } = await import(
      '@/services/kpiComputer'
    );

    const periodStart = new Date(period_start);
    const periodEnd = new Date(period_end);

    // Compute KPIs
    let kpisToCompute = KPI_REGISTRY;
    if (kpi_ids && kpi_ids.length > 0) {
      kpisToCompute = kpi_ids
        .map((id: string) => getKpiById(id))
        .filter((k): k is NonNullable<typeof k> => k !== undefined);
    }

    const values: KpiValue[] = [];
    for (const kpiDef of kpisToCompute) {
      try {
        const { computeKpi } = await import('@/services/kpiComputer');
        const val = await computeKpi(
          supabase,
          kpiDef,
          org_id,
          periodStart,
          periodEnd
        );
        values.push(val);
      } catch (err) {
        console.error(`[kpis API] Failed to compute ${kpiDef.id}:`, err);
      }
    }

    // Save values
    await saveKpiValues(supabase, values);

    // Check thresholds
    const alerts = await checkKpiThresholds(supabase, values);

    return NextResponse.json(
      {
        success: true,
        computed: values.length,
        values,
        alerts_generated: alerts.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[kpis API] Computation error:', error);
    return NextResponse.json(
      { error: 'Failed to compute KPIs' },
      { status: 500 }
    );
  }
}

function getKpiStatus(
  kpiDef: {
    warning_threshold?: number;
    critical_threshold?: number;
    higher_is_better?: boolean;
  },
  value?: number
): 'healthy' | 'warning' | 'critical' | 'unknown' {
  if (value === undefined || value === null) return 'unknown';

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

  return 'healthy';
}
