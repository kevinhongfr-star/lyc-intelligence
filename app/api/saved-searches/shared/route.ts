// Phase 2.7: Shared Searches API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSavedSearches } from '@/lib/saved-searches/engine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const userId = url.searchParams.get('user_id');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    // Get all searches for the org that are shared
    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_shared', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching shared searches:', error);
    return NextResponse.json({ error: 'Failed to fetch shared searches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    if (body.action === 'subscribe') {
      const { saved_search_id, user_id, org_id, notification_preference = 'inherit' } = body;

      if (!saved_search_id || !user_id || !org_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('saved_search_subscriptions')
        .insert({
          saved_search_id,
          user_id,
          org_id,
          notification_preference,
        })
        .select()
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    if (body.action === 'unsubscribe') {
      const { saved_search_id, user_id } = body;

      if (!saved_search_id || !user_id) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const { error } = await supabase
        .from('saved_search_subscriptions')
        .delete()
        .eq('saved_search_id', saved_search_id)
        .eq('user_id', user_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}