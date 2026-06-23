// Phase 2.7: Saved Searches CRUD API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSavedSearch,
  getSavedSearches,
  logSearchExecution,
  type SearchFilters,
} from '@/lib/saved-searches/engine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const userId = url.searchParams.get('user_id');

  if (!orgId || !userId) {
    return NextResponse.json({ error: 'org_id and user_id are required' }, { status: 400 });
  }

  try {
    const searches = await getSavedSearches(supabase, orgId, userId);
    return NextResponse.json({ success: true, data: searches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      user_id,
      search_name,
      search_filters,
      search_description,
      alert_frequency = 'daily',
      is_shared = false,
    } = body;

    if (!org_id || !user_id || !search_name || !search_filters) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const savedSearch = await createSavedSearch(
      supabase,
      org_id,
      user_id,
      search_name,
      search_filters as SearchFilters,
      search_description,
      alert_frequency as 'realtime' | 'daily' | 'weekly' | 'off',
      is_shared
    );

    if (!savedSearch) {
      return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: savedSearch }, { status: 201 });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 });
  }
}