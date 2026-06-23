// Phase 2.7: Single Saved Search API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSavedSearchById,
  updateSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  formatFilters,
  type SearchFilters,
} from '@/lib/saved-searches/engine';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const search = await getSavedSearchById(supabase, id);
    if (!search) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    const formattedFilters = formatFilters(search.search_filters);

    return NextResponse.json({
      success: true,
      data: {
        ...search,
        formatted_filters: formattedFilters,
      },
    });
  } catch (error) {
    console.error('Error fetching saved search:', error);
    return NextResponse.json({ error: 'Failed to fetch saved search' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    const updates: Record<string, any> = {};

    if (body.search_name !== undefined) updates.search_name = body.search_name;
    if (body.search_description !== undefined) updates.search_description = body.search_description;
    if (body.search_filters !== undefined) updates.search_filters = body.search_filters;
    if (body.alert_frequency !== undefined) updates.alert_frequency = body.alert_frequency;
    if (body.alert_threshold !== undefined) updates.alert_threshold = body.alert_threshold;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.is_shared !== undefined) updates.is_shared = body.is_shared;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const updated = await updateSavedSearch(supabase, id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating saved search:', error);
    return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const success = await deleteSavedSearch(supabase, id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    if (body.action === 'execute') {
      const { candidates, count } = await executeSavedSearch(supabase, id);
      return NextResponse.json({ success: true, data: { candidates, count } });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error executing saved search:', error);
    return NextResponse.json({ error: 'Failed to execute saved search' }, { status: 500 });
  }
}