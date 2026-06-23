// Phase 4.6: Alumni Referrals API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createReferral,
  updateReferralStatus,
  getOrganizationReferrals,
  calculateReferralMetrics,
} from '@/lib/alumni/referral';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const status = url.searchParams.get('status');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    // Check for metrics request
    if (url.searchParams.get('metrics') === 'true') {
      const startDate = url.searchParams.get('start_date');
      const endDate = url.searchParams.get('end_date');

      const metrics = await calculateReferralMetrics(supabase, orgId, startDate, endDate);
      return NextResponse.json({ success: true, data: metrics });
    }

    const referrals = await getOrganizationReferrals(supabase, orgId, status);
    return NextResponse.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    // Create referral
    if (!body.action) {
      const {
        alumni_id,
        org_id,
        referred_name,
        referred_email,
        referred_phone,
        mandate_id,
        notes,
      } = body;

      if (!alumni_id || !org_id || !referred_name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const referral = await createReferral(
        supabase,
        alumni_id,
        org_id,
        referred_name,
        referred_email,
        referred_phone,
        mandate_id,
        notes
      );

      if (!referral) {
        return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: referral }, { status: 201 });
    }

    // Update referral status
    if (body.action === 'update_status') {
      const { referral_id, status, referred_candidate_id } = body;

      if (!referral_id || !status) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const updated = await updateReferralStatus(
        supabase,
        referral_id,
        status,
        referred_candidate_id
      );

      if (!updated) {
        return NextResponse.json({ error: 'Failed to update referral status' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}