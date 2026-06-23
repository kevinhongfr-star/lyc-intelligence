// Phase 3.10: Automation Rules CRUD API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scheduleTimeChecks, cancelScheduledChecks } from '@/services/ruleScheduler';

const MAX_ACTIVE_RULES = 50;
const MAX_CONDITIONS_PER_RULE = 10;
const MAX_ACTIONS_PER_RULE = 5;

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const triggerType = url.searchParams.get('trigger_type');
  const isActive = url.searchParams.get('is_active');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('automation_rules')
      .select('*')
      .eq('org_id', orgId);

    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      name,
      description,
      trigger_type,
      trigger_config,
      conditions,
      condition_logic,
      actions,
      created_by,
    } = body;

    if (!org_id || !name || !trigger_type || !created_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate conditions limit
    if (conditions && conditions.length > MAX_CONDITIONS_PER_RULE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CONDITIONS_PER_RULE} conditions per rule` },
        { status: 400 }
      );
    }

    // Validate actions limit
    if (actions && actions.length > MAX_ACTIONS_PER_RULE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ACTIONS_PER_RULE} actions per rule` },
        { status: 400 }
      );
    }

    // Check active rules limit
    const { count: activeCount, error: countError } = await supabase
      .from('automation_rules')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org_id)
      .eq('is_active', true);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((activeCount || 0) >= MAX_ACTIVE_RULES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ACTIVE_RULES} active rules per organization` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        org_id,
        name,
        description,
        trigger_type,
        trigger_config: trigger_config || {},
        conditions: conditions || [],
        condition_logic: condition_logic || 'AND',
        actions: actions || [],
        created_by,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Schedule time-based checks if applicable
    if (trigger_type === 'time_elapsed') {
      await scheduleTimeChecks(supabase, data.id, org_id);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }
}
