// Phase 3.8: Compensation Benchmark API - Get benchmark for role/location

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeBenchmark, getCompensationHistory } from '@/services/compBenchmarkEngine';
import type { BenchmarkInput } from '@/types/compensation';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const jobTitle = url.searchParams.get('job_title');
  const industry = url.searchParams.get('industry') || undefined;
  const city = url.searchParams.get('city') || undefined;
  const country = url.searchParams.get('country') || 'CN';
  const level = url.searchParams.get('level') || undefined;
  const includeHistory = url.searchParams.get('include_history') === 'true';

  if (!orgId || !jobTitle) {
    return NextResponse.json(
      { error: 'org_id and job_title are required' },
      { status: 400 }
    );
  }

  try {
    const input: BenchmarkInput = {
      jobTitle,
      industry,
      country,
      city,
      level: level as any,
    };

    const benchmark = await computeBenchmark(supabase, orgId, input);

    if (!benchmark) {
      return NextResponse.json({
        success: true,
        benchmark: null,
        query: input,
        message: 'Insufficient data for benchmark calculation (minimum 3 data points required)',
      });
    }

    // Include history if requested
    let history = null;
    if (includeHistory) {
      history = await getCompensationHistory(supabase, orgId, input, 12);
    }

    return NextResponse.json({
      success: true,
      benchmark,
      query: input,
      history: history || undefined,
    });
  } catch (error) {
    console.error('Error computing benchmark:', error);
    return NextResponse.json(
      { error: 'Failed to compute benchmark' },
      { status: 500 }
    );
  }
}
