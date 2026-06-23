// Phase 3.12: SLA Configuration API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id');
  const mandateType = searchParams.get('mandate_type');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase.from('sla_configurations').select('*').eq('org_id', orgId);

    if (mandateType) {
      query = query.eq('mandate_type', mandateType);
    }

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
    const { org_id, mandate_type, milestones, escalation_rules } = body;

    if (!org_id || !mandate_type || !milestones || !escalation_rules) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sla_configurations')
      .upsert({
        org_id,
        mandate_type,
        milestones,
        escalation_rules,
        updated_at: new Date().toISOString(),
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
    const { id, org_id, mandate_type, milestones, escalation_rules } = body;

    if (!id || !org_id) {
      return NextResponse.json({ error: 'id and org_id are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('sla_configurations')
      .update({
        mandate_type,
        milestones,
        escalation_rules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', org_id)
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
  const orgId = searchParams.get('org_id');

  if (!id || !orgId) {
    return NextResponse.json({ error: 'id and org_id are required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('sla_configurations')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}