// Phase 3.8: Compensation Suggestions API - Autocomplete

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getJobTitleSuggestions } from '@/services/compBenchmarkEngine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const query = url.searchParams.get('q') || '';
  const type = url.searchParams.get('type') || 'job_title';
  const limit = parseInt(url.searchParams.get('limit') || '10');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    if (type === 'job_title') {
      const suggestions = await getJobTitleSuggestions(supabase, orgId, query, limit);
      return NextResponse.json({ success: true, suggestions });
    }

    // For other types (industry, city), get distinct values
    const { data, error } = await supabase
      .from('comp_data_points')
      .select(type)
      .eq('org_id', orgId)
      .not(type, 'is', null)
      .limit(limit * 5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const item of data || []) {
      const value = (item as Record<string, string>)[type];
      if (value && !seen.has(value)) {
        if (!query || value.toLowerCase().includes(query.toLowerCase())) {
          seen.add(value);
          suggestions.push(value);
          if (suggestions.length >= limit) break;
        }
      }
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
