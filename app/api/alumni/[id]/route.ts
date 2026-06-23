// Phase 4.6: Single Alumni Record API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAlumniById,
  updateAlumni,
  logEngagement,
  getAlumniEngagements,
  getGuaranteePeriod,
  calculateDaysRemaining,
  calculateGuaranteeProgress,
} from '@/lib/alumni/engine';
import { getAlumniReferrals } from '@/lib/alumni/referral';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const alumni = await getAlumniById(supabase, id);
    if (!alumni) {
      return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
    }

    const [engagements, guarantee, referrals] = await Promise.all([
      getAlumniEngagements(supabase, id),
      getGuaranteePeriod(supabase, id),
      getAlumniReferrals(supabase, id),
    ]);

    const daysRemaining = guarantee ? calculateDaysRemaining(guarantee.end_date) : null;
    const progress = guarantee ? calculateGuaranteeProgress(guarantee.start_date, guarantee.end_date) : null;

    return NextResponse.json({
      success: true,
      data: {
        ...alumni,
        engagements,
        guarantee,
        referrals,
        days_remaining: daysRemaining,
        guarantee_progress: progress,
      },
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    const updates: Partial<{
      company_name: string;
      job_title: string;
      alumni_status: string;
      tags: string[];
      notes: string;
    }> = {};

    if (body.company_name) updates.company_name = body.company_name;
    if (body.job_title) updates.job_title = body.job_title;
    if (body.alumni_status) updates.alumni_status = body.alumni_status;
    if (body.tags) updates.tags = body.tags;
    if (body.notes !== undefined) updates.notes = body.notes;

    const updated = await updateAlumni(supabase, id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update alumni' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating alumni:', error);
    return NextResponse.json({ error: 'Failed to update alumni' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    // Check for engagement action
    if (body.action === 'log_engagement') {
      const { engagement_type, initiated_by, summary, outcome, follow_up_date } = body;

      const engagement = await logEngagement(
        supabase,
        id,
        body.org_id,
        engagement_type,
        initiated_by,
        summary,
        outcome,
        follow_up_date
      );

      if (!engagement) {
        return NextResponse.json({ error: 'Failed to log engagement' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: engagement });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing alumni action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}