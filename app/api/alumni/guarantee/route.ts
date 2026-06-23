// Phase 4.6: Guarantee Period Tracking API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getGuaranteePeriod,
  recordCheckIn,
  updateGuaranteeStatus,
  calculateDaysRemaining,
} from '@/lib/alumni/engine';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const alumniId = url.searchParams.get('alumni_id');
  const orgId = url.searchParams.get('org_id');
  const status = url.searchParams.get('status');

  try {
    if (alumniId) {
      const guarantee = await getGuaranteePeriod(supabase, alumniId);
      if (!guarantee) {
        return NextResponse.json({ error: 'Guarantee period not found' }, { status: 404 });
      }

      const daysRemaining = calculateDaysRemaining(guarantee.end_date);

      return NextResponse.json({
        success: true,
        data: { ...guarantee, days_remaining: daysRemaining },
      });
    }

    let query = supabase.from('guarantee_periods').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error || !data) {
      return NextResponse.json({ success: true, data: [] });
    }

    const guarantees = data.map((g: any) => ({
      ...g,
      days_remaining: calculateDaysRemaining(g.end_date),
    }));

    return NextResponse.json({ success: true, data: guarantees });
  } catch (error) {
    console.error('Error fetching guarantee periods:', error);
    return NextResponse.json({ error: 'Failed to fetch guarantee periods' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    if (body.action === 'record_checkin') {
      const { guarantee_id, check_in_date, status, notes, consultant_id } = body;

      const success = await recordCheckIn(
        supabase,
        guarantee_id,
        check_in_date,
        status,
        notes,
        consultant_id
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === 'update_status') {
      const { guarantee_id, status, fee_refund_pct, dispute_notes } = body;

      const success = await updateGuaranteeStatus(
        supabase,
        guarantee_id,
        status,
        fee_refund_pct,
        dispute_notes
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing guarantee action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}