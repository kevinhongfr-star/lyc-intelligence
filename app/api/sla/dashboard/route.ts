// Phase 3.12: SLA Dashboard API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    // Get all timelines for the organization
    const { data: timelines, error: timelinesError } = await supabase
      .from('mandate_timelines')
      .select('*')
      .eq('org_id', orgId);

    if (timelinesError) {
      return NextResponse.json({ error: timelinesError.message }, { status: 500 });
    }

    // Get active escalations
    const { data: escalations, error: escalationsError } = await supabase
      .from('sla_escalations')
      .select('*')
      .eq('org_id', orgId)
      .is('acknowledged_at', null);

    if (escalationsError) {
      return NextResponse.json({ error: escalationsError.message }, { status: 500 });
    }

    // Get performance history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: performance, error: performanceError } = await supabase
      .from('sla_performance_history')
      .select('*')
      .eq('org_id', orgId)
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .order('completed_at', { ascending: false });

    if (performanceError) {
      return NextResponse.json({ error: performanceError.message }, { status: 500 });
    }

    // Calculate summary stats
    const summary = {
      total_mandates: timelines.length,
      on_track: timelines.filter((t: any) => t.health_status === 'on_track').length,
      at_risk: timelines.filter((t: any) => t.health_status === 'at_risk').length,
      breached: timelines.filter((t: any) => t.health_status === 'breached').length,
      completed: timelines.filter((t: any) => t.health_status === 'completed').length,
      active_escalations: escalations.length,
      warning_escalations: escalations.filter((e: any) => e.escalation_type === 'warning').length,
      critical_escalations: escalations.filter((e: any) => e.escalation_type === 'critical').length,
      breach_escalations: escalations.filter((e: any) => e.escalation_type === 'breach').length,
    };

    // Calculate SLA performance metrics
    const slaMetrics = performance.length > 0
      ? {
          average_duration: Math.round(
            performance.reduce((sum: number, p: any) => sum + (p.total_duration_days || 0), 0) / performance.length
          ),
          sla_met_rate: Math.round(
            (performance.filter((p: any) => p.sla_met).length / performance.length) * 100
          ),
          breached_count: performance.filter((p: any) => (p.breached_milestones?.length || 0) > 0).length,
        }
      : {
          average_duration: 0,
          sla_met_rate: 0,
          breached_count: 0,
        };

    return NextResponse.json({
      success: true,
      summary,
      sla_metrics: slaMetrics,
      timelines,
      escalations,
      recent_performance: performance.slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}