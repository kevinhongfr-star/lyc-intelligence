// Phase 3.11: Approval Delegations API - CRUD Delegation Rules

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const delegatorId = url.searchParams.get('delegator_id');
  const activeOnly = url.searchParams.get('active') === 'true';

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('approval_delegations')
      .select('*')
      .eq('org_id', orgId);

    if (delegatorId) {
      query = query.eq('delegator_id', delegatorId);
    }

    if (activeOnly) {
      query = query.eq('is_active', true).gte('ends_at', new Date().toISOString());
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching delegations:', error);
    return NextResponse.json({ error: 'Failed to fetch delegations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      delegator_id,
      delegate_id,
      approval_type,
      starts_at,
      ends_at,
    } = body;

    if (!org_id || !delegator_id || !delegate_id || !approval_type || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (new Date(ends_at) <= new Date(starts_at)) {
      return NextResponse.json({ error: 'ends_at must be after starts_at' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('approval_delegations')
      .insert({
        org_id,
        delegator_id,
        delegate_id,
        approval_type,
        starts_at,
        ends_at,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating delegation:', error);
    return NextResponse.json({ error: 'Failed to create delegation' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const updates: Record<string, unknown> = {};

    if (body.delegate_id !== undefined) updates.delegate_id = body.delegate_id;
    if (body.starts_at !== undefined) updates.starts_at = body.starts_at;
    if (body.ends_at !== undefined) updates.ends_at = body.ends_at;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    const { data, error } = await supabase
      .from('approval_delegations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating delegation:', error);
    return NextResponse.json({ error: 'Failed to update delegation' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('approval_delegations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting delegation:', error);
    return NextResponse.json({ error: 'Failed to delete delegation' }, { status: 500 });
  }
}
