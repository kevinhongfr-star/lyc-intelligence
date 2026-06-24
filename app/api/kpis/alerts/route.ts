// Phase 0.7: KPI Alerts API
// GET active KPI alerts + POST to acknowledge alerts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { KpiAlert } from '@/types/kpis';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const severity = url.searchParams.get('severity');
  const acknowledged = url.searchParams.get('acknowledged');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  if (!orgId) {
    return NextResponse.json(
      { error: 'org_id is required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('kpi_alerts')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (acknowledged === 'false') {
      query = query.is('acknowledged_at', null);
    } else if (acknowledged === 'true') {
      query = query.not('acknowledged_at', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alerts = (data as KpiAlert[]) || [];
    const activeCount = alerts.filter(a => !a.acknowledged_at).length;
    const criticalCount = alerts.filter(
      a => !a.acknowledged_at && a.severity === 'critical'
    ).length;
    const warningCount = alerts.filter(
      a => !a.acknowledged_at && a.severity === 'warning'
    ).length;

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        active: activeCount,
        critical: criticalCount,
        warning: warningCount,
      },
    });
  } catch (error) {
    console.error('[kpi alerts API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { alert_id, org_id, acknowledged_by } = body;

    if (!alert_id || !org_id) {
      return NextResponse.json(
        { error: 'alert_id and org_id are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('kpi_alerts')
      .update({
        acknowledged_at: now,
        acknowledged_by: acknowledged_by || null,
      })
      .eq('id', alert_id)
      .eq('org_id', org_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alert: data as KpiAlert,
    });
  } catch (error) {
    console.error('[kpi alerts API] Acknowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
