// Phase 3.8: Compensation Data Points API - CRUD

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CompDataPoint, SourceType } from '@/types/compensation';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const jobTitle = url.searchParams.get('job_title');
  const industry = url.searchParams.get('industry');
  const sourceType = url.searchParams.get('source_type');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('comp_data_points')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (jobTitle) {
      query = query.ilike('job_title', `%${jobTitle}%`);
    }
    if (industry) {
      query = query.eq('industry', industry);
    }
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data, error, count } = await query
      .order('data_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (data as CompDataPoint[]) || [],
      count: count || 0,
    });
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json({ error: 'Failed to fetch data points' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      source_type,
      job_title,
      currency,
      data_date,
      source_id,
      industry,
      company_size,
      country,
      city,
      base_salary_annual,
      bonus_target_pct,
      equity_value_annual,
      total_cash_annual,
      experience_years,
      education_level,
    } = body;

    if (!org_id || !source_type || !job_title || !currency || !data_date) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, source_type, job_title, currency, data_date' },
        { status: 400 }
      );
    }

    // Validate total_cash is computable or provided
    if (!total_cash_annual && !base_salary_annual) {
      return NextResponse.json(
        { error: 'Either total_cash_annual or base_salary_annual is required' },
        { status: 400 }
      );
    }

    // Calculate total_cash if not provided
    let computedTotalCash = total_cash_annual;
    if (!computedTotalCash && base_salary_annual) {
      const bonusAmount = bonus_target_pct
        ? (Number(base_salary_annual) * Number(bonus_target_pct)) / 100
        : 0;
      computedTotalCash = Number(base_salary_annual) + bonusAmount + Number(equity_value_annual || 0);
    }

    const insertData: Record<string, unknown> = {
      org_id,
      source_type,
      job_title,
      currency,
      data_date,
      total_cash_annual: computedTotalCash,
    };

    if (source_id !== undefined) insertData.source_id = source_id;
    if (industry !== undefined) insertData.industry = industry;
    if (company_size !== undefined) insertData.company_size = company_size;
    if (country !== undefined) insertData.country = country;
    if (city !== undefined) insertData.city = city;
    if (base_salary_annual !== undefined) insertData.base_salary_annual = base_salary_annual;
    if (bonus_target_pct !== undefined) insertData.bonus_target_pct = bonus_target_pct;
    if (equity_value_annual !== undefined) insertData.equity_value_annual = equity_value_annual;
    if (experience_years !== undefined) insertData.experience_years = experience_years;
    if (education_level !== undefined) insertData.education_level = education_level;

    const { data, error } = await supabase
      .from('comp_data_points')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: data as CompDataPoint },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating data point:', error);
    return NextResponse.json({ error: 'Failed to create data point' }, { status: 500 });
  }
}
