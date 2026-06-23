// Phase 2.8: BD Opportunities API - CRUD + list

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BDOpportunity } from '@/types/bd';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const stage = url.searchParams.get('stage');
  const ownerId = url.searchParams.get('owner_id');
  const search = url.searchParams.get('search');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('bd_opportunities')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (stage) {
      query = query.eq('stage', stage);
    }
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,primary_contact_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data as BDOpportunity[]) || [],
      count: count || 0,
    });
  } catch (error) {
    console.error('Error fetching BD opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      company_name,
      primary_contact_name,
      owner_id,
      industry,
      company_size,
      country,
      city,
      website,
      primary_contact_email,
      primary_contact_phone,
      primary_contact_title,
      linkedin_url,
      stage,
      opportunity_type,
      estimated_roles,
      estimated_fee_total,
      estimated_fee_currency,
      fee_structure,
      team_members,
      source,
      source_detail,
      notes,
    } = body;

    if (!org_id || !company_name || !primary_contact_name || !owner_id) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, company_name, primary_contact_name, owner_id' },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      org_id,
      company_name,
      primary_contact_name,
      owner_id,
    };

    if (industry !== undefined) insertData.industry = industry;
    if (company_size !== undefined) insertData.company_size = company_size;
    if (country !== undefined) insertData.country = country;
    if (city !== undefined) insertData.city = city;
    if (website !== undefined) insertData.website = website;
    if (primary_contact_email !== undefined) insertData.primary_contact_email = primary_contact_email;
    if (primary_contact_phone !== undefined) insertData.primary_contact_phone = primary_contact_phone;
    if (primary_contact_title !== undefined) insertData.primary_contact_title = primary_contact_title;
    if (linkedin_url !== undefined) insertData.linkedin_url = linkedin_url;
    if (stage !== undefined) insertData.stage = stage;
    if (opportunity_type !== undefined) insertData.opportunity_type = opportunity_type;
    if (estimated_roles !== undefined) insertData.estimated_roles = estimated_roles;
    if (estimated_fee_total !== undefined) insertData.estimated_fee_total = estimated_fee_total;
    if (estimated_fee_currency !== undefined) insertData.estimated_fee_currency = estimated_fee_currency;
    if (fee_structure !== undefined) insertData.fee_structure = fee_structure;
    if (team_members !== undefined) insertData.team_members = team_members;
    if (source !== undefined) insertData.source = source;
    if (source_detail !== undefined) insertData.source_detail = source_detail;
    if (notes !== undefined) insertData.notes = notes;

    const { data, error } = await supabase
      .from('bd_opportunities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log creation activity
    try {
      await supabase.from('bd_activities').insert({
        org_id,
        opportunity_id: data.id,
        activity_type: 'note',
        description: 'Opportunity created',
        performed_by: owner_id,
      });
    } catch (activityError) {
      console.error('Failed to log creation activity:', activityError);
    }

    return NextResponse.json({ success: true, data: data as BDOpportunity }, { status: 201 });
  } catch (error) {
    console.error('Error creating BD opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}
