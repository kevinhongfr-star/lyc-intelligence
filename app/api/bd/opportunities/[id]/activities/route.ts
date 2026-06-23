// Phase 2.8: BD Activity Log API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BDActivity } from '@/types/bd';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const { data, error, count } = await supabase
      .from('bd_activities')
      .select('*', { count: 'exact' })
      .eq('opportunity_id', id)
      .eq('org_id', orgId)
      .order('performed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data as BDActivity[]) || [],
      count: count || 0,
    });
  } catch (error) {
    console.error('Error fetching BD activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    const {
      org_id,
      activity_type,
      description,
      performed_by,
      outcome,
      performed_at,
      contact_id,
      related_document_id,
    } = body;

    if (!org_id || !activity_type || !description || !performed_by) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, activity_type, description, performed_by' },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      org_id,
      opportunity_id: id,
      activity_type,
      description,
      performed_by,
    };

    if (outcome !== undefined) insertData.outcome = outcome;
    if (performed_at !== undefined) insertData.performed_at = performed_at;
    if (contact_id !== undefined) insertData.contact_id = contact_id;
    if (related_document_id !== undefined) insertData.related_document_id = related_document_id;

    const { data, error } = await supabase
      .from('bd_activities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update opportunity's updated_at timestamp
    try {
      await supabase
        .from('bd_opportunities')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (updateError) {
      console.error('Failed to update opportunity timestamp:', updateError);
    }

    return NextResponse.json({ success: true, data: data as BDActivity }, { status: 201 });
  } catch (error) {
    console.error('Error creating BD activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
