// Phase 5.7: PIPL Consents API - Record and check consent

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DataConsent, DataSubjectType, LegalBasis } from '@/types/pipl';
import { PIPL_DEFAULT_CONFIG } from '@/types/pipl';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const subjectType = url.searchParams.get('subject_type');
  const subjectId = url.searchParams.get('subject_id');
  const purpose = url.searchParams.get('purpose');
  const activeOnly = url.searchParams.get('active_only') === 'true';

  if (!orgId || !subjectType || !subjectId) {
    return NextResponse.json(
      { error: 'org_id, subject_type, and subject_id are required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('data_consents')
      .select('*')
      .eq('org_id', orgId)
      .eq('data_subject_type', subjectType)
      .eq('data_subject_id', subjectId);

    if (purpose) {
      query = query.eq('purpose', purpose);
    }

    if (activeOnly) {
      query = query
        .eq('consent_given', true)
        .is('withdrawn_at', null);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      consents: (data as DataConsent[]) || [],
    });
  } catch (error) {
    console.error('Error fetching consents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      data_subject_type,
      data_subject_id,
      purpose,
      legal_basis,
      consent_text,
      consent_given = true,
      consent_version = 1,
      expires_at,
      ip_address,
      user_agent,
    } = body;

    if (!org_id || !data_subject_type || !data_subject_id || !purpose || !legal_basis || !consent_text) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: org_id, data_subject_type, data_subject_id, purpose, legal_basis, consent_text',
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Calculate expiry if not provided
    let expiryDate = expires_at;
    if (!expiryDate && consent_given) {
      const expiryDays = PIPL_DEFAULT_CONFIG.consent_expiry_days;
      expiryDate = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
    }

    // Use upsert to handle existing consent for same purpose
    const { data, error } = await supabase
      .from('data_consents')
      .upsert(
        {
          org_id,
          data_subject_type,
          data_subject_id,
          purpose,
          legal_basis,
          consent_text,
          consent_version,
          consent_given,
          granted_at: consent_given ? now : null,
          withdrawn_at: consent_given ? null : now,
          expires_at: expiryDate || null,
          ip_address: ip_address || null,
          user_agent: user_agent || null,
          updated_at: now,
        },
        {
          onConflict: 'org_id, data_subject_type, data_subject_id, purpose',
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, consent: data as DataConsent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}
