// Phase 3.8: Compensation Survey Import API - CSV survey import

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SURVEY_CSV_REQUIRED_COLUMNS } from '@/types/compensation';
import type { SourceType, CompanySize, EducationLevel } from '@/types/compensation';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('comp_survey_imports')
      .select('*')
      .eq('org_id', orgId)
      .order('imported_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching survey imports:', error);
    return NextResponse.json({ error: 'Failed to fetch survey imports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const surveyName = formData.get('survey_name') as string | null;
    const surveyYearStr = formData.get('survey_year') as string | null;
    const orgId = formData.get('org_id') as string | null;
    const importedBy = formData.get('imported_by') as string | null;

    if (!file || !surveyName || !surveyYearStr || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, survey_name, survey_year, org_id' },
        { status: 400 }
      );
    }

    const surveyYear = parseInt(surveyYearStr);
    if (isNaN(surveyYear) || surveyYear < 2000 || surveyYear > 2100) {
      return NextResponse.json({ error: 'Invalid survey_year' }, { status: 400 });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Validate required headers
    const missingHeaders = SURVEY_CSV_REQUIRED_COLUMNS.filter(
      (col) => !headers.includes(col)
    );
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const dataPoints: Record<string, unknown>[] = [];
    const dataDate = `${surveyYear}-06-30`;

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 2) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx]?.trim() || '';
      });

      // Validate required fields
      if (!row.job_title) continue;

      const totalCash = parseFloat(row.total_cash_annual);
      if (isNaN(totalCash) || totalCash <= 0) continue;

      const dataPoint: Record<string, unknown> = {
        org_id: orgId,
        source_type: 'survey' as SourceType,
        job_title: row.job_title,
        industry: row.industry || null,
        city: row.city || null,
        country: row.country || 'CN',
        company_size: (row.company_size as CompanySize) || null,
        currency: row.currency || 'CNY',
        base_salary_annual: parseFloat(row.base_salary_annual) || null,
        bonus_target_pct: parseFloat(row.bonus_target_pct) || null,
        total_cash_annual: totalCash,
        experience_years: parseInt(row.experience_years) || null,
        education_level: (row.education_level as EducationLevel) || null,
        data_date: dataDate,
      };

      dataPoints.push(dataPoint);
    }

    if (dataPoints.length === 0) {
      return NextResponse.json(
        { error: 'No valid data rows found in CSV' },
        { status: 400 }
      );
    }

    // Batch insert (split into chunks for large files)
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < dataPoints.length; i += batchSize) {
      const batch = dataPoints.slice(i, i + batchSize);
      const { error } = await supabase.from('comp_data_points').insert(batch);

      if (error) {
        console.error('Error inserting batch:', error);
        return NextResponse.json(
          { error: `Failed to insert data: ${error.message}` },
          { status: 500 }
        );
      }

      inserted += batch.length;
    }

    // Record the import
    const { data: importRecord, error: importError } = await supabase
      .from('comp_survey_imports')
      .insert({
        org_id: orgId,
        survey_name: surveyName,
        survey_year: surveyYear,
        imported_by: importedBy || null,
        row_count: inserted,
        file_path: file.name,
      })
      .select()
      .single();

    if (importError) {
      console.error('Error recording import:', importError);
    }

    return NextResponse.json(
      {
        success: true,
        imported: inserted,
        import_record: importRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing survey:', error);
    return NextResponse.json(
      { error: 'Failed to import survey data' },
      { status: 500 }
    );
  }
}

/**
 * Parse a CSV line, handling quoted values with commas inside
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
