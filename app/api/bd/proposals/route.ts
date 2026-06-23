// Phase 2.8: BD Proposals API - CRUD

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BDProposal } from '@/types/bd';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const opportunityId = url.searchParams.get('opportunity_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('bd_proposals')
      .select('*')
      .eq('org_id', orgId);

    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data as BDProposal[]) || [],
    });
  } catch (error) {
    console.error('Error fetching BD proposals:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      opportunity_id,
      title,
      created_by,
      fee_structure,
      fee_amount,
      fee_currency,
      payment_terms,
      guarantee_period_months,
      role_count,
      scope_description,
      timeline_weeks,
      document_url,
    } = body;

    if (!org_id || !opportunity_id || !title || !created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, opportunity_id, title, created_by' },
        { status: 400 }
      );
    }

    // Get latest version for this opportunity
    const { data: existing } = await supabase
      .from('bd_proposals')
      .select('version')
      .eq('opportunity_id', opportunity_id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? (existing[0].version || 0) + 1 : 1;

    const insertData: Record<string, unknown> = {
      org_id,
      opportunity_id,
      title,
      version: nextVersion,
      created_by,
    };

    if (fee_structure !== undefined) insertData.fee_structure = fee_structure;
    if (fee_amount !== undefined) insertData.fee_amount = fee_amount;
    if (fee_currency !== undefined) insertData.fee_currency = fee_currency;
    if (payment_terms !== undefined) insertData.payment_terms = payment_terms;
    if (guarantee_period_months !== undefined) insertData.guarantee_period_months = guarantee_period_months;
    if (role_count !== undefined) insertData.role_count = role_count;
    if (scope_description !== undefined) insertData.scope_description = scope_description;
    if (timeline_weeks !== undefined) insertData.timeline_weeks = timeline_weeks;
    if (document_url !== undefined) insertData.document_url = document_url;

    const { data, error } = await supabase
      .from('bd_proposals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    try {
      await supabase.from('bd_activities').insert({
        org_id,
        opportunity_id,
        activity_type: 'proposal_sent',
        description: `Proposal created: ${title} (v${nextVersion})`,
        performed_by: created_by,
      });
    } catch (activityError) {
      console.error('Failed to log proposal activity:', activityError);
    }

    return NextResponse.json({ success: true, data: data as BDProposal }, { status: 201 });
  } catch (error) {
    console.error('Error creating BD proposal:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
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

    if (body.title !== undefined) updates.title = body.title;
    if (body.status !== undefined) updates.status = body.status;
    if (body.fee_structure !== undefined) updates.fee_structure = body.fee_structure;
    if (body.fee_amount !== undefined) updates.fee_amount = body.fee_amount;
    if (body.fee_currency !== undefined) updates.fee_currency = body.fee_currency;
    if (body.payment_terms !== undefined) updates.payment_terms = body.payment_terms;
    if (body.guarantee_period_months !== undefined) updates.guarantee_period_months = body.guarantee_period_months;
    if (body.role_count !== undefined) updates.role_count = body.role_count;
    if (body.scope_description !== undefined) updates.scope_description = body.scope_description;
    if (body.timeline_weeks !== undefined) updates.timeline_weeks = body.timeline_weeks;
    if (body.document_url !== undefined) updates.document_url = body.document_url;
    if (body.status === 'sent') updates.sent_at = new Date().toISOString();

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('bd_proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as BDProposal });
  } catch (error) {
    console.error('Error updating BD proposal:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}
