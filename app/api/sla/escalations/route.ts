// Phase 3.12: SLA Escalations API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id');
  const mandateId = searchParams.get('mandate_id');
  const acknowledged = searchParams.get('acknowledged');

  if (!orgId && !mandateId) {
    return NextResponse.json({ error: 'org_id or mandate_id is required' }, { status: 400 });
  }

  try {
    let query = supabase.from('sla_escalations').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    if (mandateId) {
      query = query.eq('mandate_id', mandateId);
    }
    if (acknowledged === 'true') {
      query = query.is('acknowledged_at', null);
    } else if (acknowledged === 'false') {
      query = query.not('acknowledged_at', 'is', null);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      mandate_id,
      org_id,
      timeline_id,
      escalation_type,
      milestone_stage,
      message,
      notified_roles,
    } = body;

    if (!mandate_id || !org_id || !timeline_id || !escalation_type || !milestone_stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sla_escalations')
      .insert({
        mandate_id,
        org_id,
        timeline_id,
        escalation_type,
        milestone_stage,
        message: message || `Escalation triggered for ${milestone_stage}`,
        notified_roles: notified_roles || [],
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, acknowledged_by } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sla_escalations')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('sla_escalations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}