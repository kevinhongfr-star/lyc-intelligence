// Phase 5.7: PIPL Consent Withdrawal API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const { org_id, consent_id, reason } = body;

    if (!org_id || !consent_id) {
      return NextResponse.json(
        { error: 'org_id and consent_id are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Update consent to withdrawn
    const { data, error } = await supabase
      .from('data_consents')
      .update({
        consent_given: false,
        withdrawn_at: now,
        updated_at: now,
      })
      .eq('id', consent_id)
      .eq('org_id', org_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create a data subject request record if it was a withdrawal
    try {
      await supabase.from('data_subject_requests').insert({
        org_id,
        request_type: 'withdraw_consent',
        data_subject_type: data.data_subject_type,
        data_subject_id: data.data_subject_id,
        status: 'completed',
        request_details: {
          consent_id,
          purpose: data.purpose,
          withdrawal_reason: reason || 'User-initiated withdrawal',
        },
        response_details: {
          processed_at: now,
          result: 'consent_withdrawn',
        },
        completed_at: now,
      });
    } catch (requestError) {
      console.error('Failed to create withdrawal request record:', requestError);
    }

    return NextResponse.json({
      success: true,
      status: 'withdrawn',
      consent: data,
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw consent' },
      { status: 500 }
    );
  }
}
