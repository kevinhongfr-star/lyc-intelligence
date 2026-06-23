// Phase 3.10: Rule Execution Log API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const ruleId = url.searchParams.get('rule_id');
  const entityType = url.searchParams.get('entity_type');
  const entityId = url.searchParams.get('entity_id');
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('rule_executions')
      .select('*')
      .eq('org_id', orgId);

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
  }
}
