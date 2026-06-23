// Phase 4.6: Alumni API Routes

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchAlumni, createAlumni, type Alumni } from '@/lib/alumni/engine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  const filters = {
    companyName: url.searchParams.get('company_name') || undefined,
    jobTitle: url.searchParams.get('job_title') || undefined,
    tags: url.searchParams.getAll('tag'),
    status: url.searchParams.get('status') || undefined,
    query: url.searchParams.get('q') || undefined,
  };

  try {
    const alumni = await searchAlumni(supabase, orgId, filters);
    return NextResponse.json({ success: true, data: alumni });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      candidate_id,
      org_id,
      mandate_id,
      placement_date,
      company_name,
      job_title,
      guarantee_months = 3,
    } = body;

    if (!candidate_id || !org_id || !mandate_id || !placement_date || !company_name || !job_title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alumni = await createAlumni(
      supabase,
      candidate_id,
      org_id,
      mandate_id,
      placement_date,
      company_name,
      job_title,
      guarantee_months
    );

    if (!alumni) {
      return NextResponse.json({ error: 'Failed to create alumni record' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: alumni }, { status: 201 });
  } catch (error) {
    console.error('Error creating alumni:', error);
    return NextResponse.json({ error: 'Failed to create alumni record' }, { status: 500 });
  }
}