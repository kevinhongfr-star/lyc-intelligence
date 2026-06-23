// Phase 2.8: Single BD Opportunity API - Get, Update, Delete, Stage Transitions

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transitionStage } from '@/services/bdStageTransition';
import { handoffToIntake, isReadyForHandoff } from '@/services/bdToIntakeHandoff';
import type { BDStage, StageTransitionMetadata, BDOpportunity } from '@/types/bd';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;
  const url = new URL(request.url);
  const orgId = url.searchParams.get('org_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('bd_opportunities')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data as BDOpportunity,
      ready_for_handoff: isReadyForHandoff(data as BDOpportunity),
    });
  } catch (error) {
    console.error('Error fetching BD opportunity:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
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

    const updates: Record<string, unknown> = {};

    if (body.company_name !== undefined) updates.company_name = body.company_name;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (body.company_size !== undefined) updates.company_size = body.company_size;
    if (body.country !== undefined) updates.country = body.country;
    if (body.city !== undefined) updates.city = body.city;
    if (body.website !== undefined) updates.website = body.website;
    if (body.primary_contact_name !== undefined) updates.primary_contact_name = body.primary_contact_name;
    if (body.primary_contact_email !== undefined) updates.primary_contact_email = body.primary_contact_email;
    if (body.primary_contact_phone !== undefined) updates.primary_contact_phone = body.primary_contact_phone;
    if (body.primary_contact_title !== undefined) updates.primary_contact_title = body.primary_contact_title;
    if (body.linkedin_url !== undefined) updates.linkedin_url = body.linkedin_url;
    if (body.opportunity_type !== undefined) updates.opportunity_type = body.opportunity_type;
    if (body.estimated_roles !== undefined) updates.estimated_roles = body.estimated_roles;
    if (body.estimated_fee_total !== undefined) updates.estimated_fee_total = body.estimated_fee_total;
    if (body.estimated_fee_currency !== undefined) updates.estimated_fee_currency = body.estimated_fee_currency;
    if (body.fee_structure !== undefined) updates.fee_structure = body.fee_structure;
    if (body.owner_id !== undefined) updates.owner_id = body.owner_id;
    if (body.team_members !== undefined) updates.team_members = body.team_members;
    if (body.source !== undefined) updates.source = body.source;
    if (body.source_detail !== undefined) updates.source_detail = body.source_detail;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.deferred_until !== undefined) updates.deferred_until = body.deferred_until;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('bd_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as BDOpportunity });
  } catch (error) {
    console.error('Error updating BD opportunity:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
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
    const { action, org_id, user_id, new_stage, metadata } = body;

    if (!org_id || !user_id) {
      return NextResponse.json({ error: 'org_id and user_id are required' }, { status: 400 });
    }

    switch (action) {
      case 'transition_stage': {
        if (!new_stage) {
          return NextResponse.json({ error: 'new_stage is required' }, { status: 400 });
        }

        const result = await transitionStage(
          supabase,
          id,
          org_id,
          new_stage as BDStage,
          user_id,
          metadata as StageTransitionMetadata
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result.data });
      }

      case 'handoff_to_intake': {
        const result = await handoffToIntake(supabase, id, org_id, user_id);

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          mandate_id: result.mandate_id,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error patching BD opportunity:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const { error } = await supabase
      .from('bd_opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting BD opportunity:', error);
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 });
  }
}
