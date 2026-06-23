// Phase 4.6: Re-engagement Workflow API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AlumniCampaign } from '@/lib/alumni/engine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('alumni_campaigns')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data as AlumniCampaign[] });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      campaign_name,
      campaign_type,
      target_tags = [],
      target_companies = [],
      message_template,
      send_date,
      created_by,
    } = body;

    if (!org_id || !campaign_name || !campaign_type || !message_template) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('alumni_campaigns')
      .insert({
        org_id,
        campaign_name,
        campaign_type,
        target_tags,
        target_companies,
        message_template,
        send_date,
        status: send_date ? 'scheduled' : 'draft',
        created_by,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as AlumniCampaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const { id, status, send_date } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updates: Record<string, any> = { status };
    if (send_date) updates.send_date = send_date;

    const { data, error } = await supabase
      .from('alumni_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as AlumniCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}