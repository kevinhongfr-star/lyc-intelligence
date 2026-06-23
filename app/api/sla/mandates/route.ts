// Phase 3.12: SLA Mandate Timeline API
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSLAConfiguration,
  calculateTargetDates,
  createOrUpdateTimeline,
  getMandateTimeline,
  updateMilestoneStatus,
  calculateHealthStatus,
  calculateProgress,
  calculateDaysRemaining,
} from '@/lib/sla/engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mandateId = searchParams.get('mandate_id');
  const orgId = searchParams.get('org_id');

  if (!mandateId && !orgId) {
    return NextResponse.json({ error: 'mandate_id or org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase.from('mandate_timelines').select('*');

    if (mandateId) {
      query = query.eq('mandate_id', mandateId);
    } else if (orgId) {
      query = query.eq('org_id', orgId);
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
    const { mandate_id, org_id, mandate_type, start_date, current_stage } = body;

    if (!mandate_id || !org_id || !start_date || !current_stage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get SLA configuration
    const config = await getSLAConfiguration(supabase, org_id, mandate_type || 'executive_search');

    if (!config) {
      return NextResponse.json({ error: 'SLA configuration not found' }, { status: 404 });
    }

    // Calculate target dates
    const milestones = calculateTargetDates(new Date(start_date), config.milestones);

    // Create or update timeline
    const timeline = await createOrUpdateTimeline(
      supabase,
      mandate_id,
      org_id,
      config.id,
      new Date(start_date),
      current_stage,
      milestones
    );

    if (!timeline) {
      return NextResponse.json({ error: 'Failed to create timeline' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: timeline });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, current_stage, milestone_updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Get current timeline
    const { data: timeline, error: timelineError } = await supabase
      .from('mandate_timelines')
      .select('*')
      .eq('id', id)
      .single();

    if (timelineError || !timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    let updatedMilestones = timeline.milestones;

    // Apply milestone updates if provided
    if (milestone_updates && Array.isArray(milestone_updates)) {
      updatedMilestones = updatedMilestones.map((m: any) => {
        const update = milestone_updates.find((u: any) => u.stage === m.stage);
        if (update) {
          return { ...m, ...update };
        }
        return m;
      });
    }

    // Update milestone statuses
    const newStage = current_stage || timeline.current_stage;
    updatedMilestones = updateMilestoneStatus(updatedMilestones, newStage);

    // Update timeline
    const updatedTimeline = await createOrUpdateTimeline(
      supabase,
      timeline.mandate_id,
      timeline.org_id,
      timeline.sla_config_id,
      new Date(timeline.start_date),
      newStage,
      updatedMilestones
    );

    if (!updatedTimeline) {
      return NextResponse.json({ error: 'Failed to update timeline' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedTimeline });
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
      .from('mandate_timelines')
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