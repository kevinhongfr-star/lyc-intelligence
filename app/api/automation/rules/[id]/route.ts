// Phase 3.10: Single Automation Rule API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scheduleTimeChecks, cancelScheduledChecks } from '@/services/ruleScheduler';

const MAX_CONDITIONS_PER_RULE = 10;
const MAX_ACTIONS_PER_RULE = 5;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Get execution count
    const { count: executionCount } = await supabase
      .from('rule_executions')
      .select('id', { count: 'exact', head: true })
      .eq('rule_id', id);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        total_executions: executionCount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching rule:', error);
    return NextResponse.json({ error: 'Failed to fetch rule' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    // Validate conditions limit
    if (body.conditions && body.conditions.length > MAX_CONDITIONS_PER_RULE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_CONDITIONS_PER_RULE} conditions per rule` },
        { status: 400 }
      );
    }

    // Validate actions limit
    if (body.actions && body.actions.length > MAX_ACTIONS_PER_RULE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ACTIONS_PER_RULE} actions per rule` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.trigger_config !== undefined) updates.trigger_config = body.trigger_config;
    if (body.conditions !== undefined) updates.conditions = body.conditions;
    if (body.condition_logic !== undefined) updates.condition_logic = body.condition_logic;
    if (body.actions !== undefined) updates.actions = body.actions;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    // Handle activate/deactivate
    if (body.action === 'toggle') {
      const { data: rule } = await supabase
        .from('automation_rules')
        .select('is_active, org_id, trigger_type')
        .eq('id', id)
        .single();

      if (!rule) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
      }

      const newActive = !rule.is_active;

      const { data: updated, error } = await supabase
        .from('automation_rules')
        .update({ is_active: newActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Handle time-based rule scheduling
      if (rule.trigger_type === 'time_elapsed') {
        if (newActive) {
          await scheduleTimeChecks(supabase, id, rule.org_id);
        } else {
          await cancelScheduledChecks(supabase, id);
        }
      }

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error patching rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    // Cancel scheduled checks first
    await cancelScheduledChecks(supabase, id);

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
