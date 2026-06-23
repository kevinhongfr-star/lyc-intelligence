// Phase 3.8: Compensation Benchmark Refresh API - Admin trigger

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshBenchmarks } from '@/services/compBenchmarkEngine';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();
    const { org_id } = body;

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const result = await refreshBenchmarks(supabase, org_id);

    return NextResponse.json({
      success: true,
      message: `Refreshed ${result.updated} of ${result.total} benchmarks`,
      updated: result.updated,
      total: result.total,
    });
  } catch (error) {
    console.error('Error refreshing benchmarks:', error);
    return NextResponse.json(
      { error: 'Failed to refresh benchmarks' },
      { status: 500 }
    );
  }
}
