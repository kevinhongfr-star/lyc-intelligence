// Phase 5.7: PIPL Data Subject Rights Requests API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type {
  DataSubjectRequest,
  RequestType,
  DataSubjectType,
} from '@/types/pipl';
import { PIPL_DEFAULT_CONFIG } from '@/types/pipl';

const TABLE_MAP: Record<string, string> = {
  candidate: 'contacts',
  client_contact: 'client_contacts',
  user: 'users',
};

const PII_FIELDS_TO_CLEAR: Record<string, string[]> = {
  contacts: [
    'email',
    'phone',
    'address',
    'wechat',
    'linkedin',
    'photo_url',
    'resume_url',
  ],
  client_contacts: [
    'email',
    'phone',
    'wechat',
    'linkedin',
    'photo_url',
  ],
  users: [
    'email',
    'phone',
  ],
};

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const status = url.searchParams.get('status');
  const requestType = url.searchParams.get('request_type');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('data_subject_requests')
      .select('*')
      .eq('org_id', orgId);

    if (status) {
      query = query.eq('status', status);
    }
    if (requestType) {
      query = query.eq('request_type', requestType);
    }

    const { data, error } = await query
      .order('requested_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      requests: (data as DataSubjectRequest[]) || [],
    });
  } catch (error) {
    console.error('Error fetching data subject requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
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
      request_type,
      data_subject_type,
      data_subject_id,
      request_details,
    } = body;

    if (!org_id || !request_type || !data_subject_type || !data_subject_id) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, request_type, data_subject_type, data_subject_id' },
        { status: 400 }
      );
    }

    const slaDays = PIPL_DEFAULT_CONFIG.request_sla_days;
    const dueAt = new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert({
        org_id,
        request_type,
        data_subject_type,
        data_subject_id,
        request_details: request_details || null,
        due_at: dueAt,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-process certain request types
    if (request_type === 'deletion') {
      await processDeletionRequest(
        org_id,
        data_subject_type,
        data_subject_id
      );

      // Mark request as completed
      await supabase
        .from('data_subject_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          response_details: {
            processed: true,
            action: 'soft_delete',
            fields_cleared: PII_FIELDS_TO_CLEAR[TABLE_MAP[data_subject_type]] || [],
          },
        })
        .eq('id', data.id);
    }

    return NextResponse.json(
      { success: true, request: data as DataSubjectRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating data subject request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}

/**
 * Process a deletion request: soft-delete PII and clear consents
 */
async function processDeletionRequest(
  orgId: string,
  subjectType: string,
  subjectId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const table = TABLE_MAP[subjectType];
  if (!table) {
    return { success: false, error: `Unknown subject type: ${subjectType}` };
  }

  try {
    // Build update object for soft delete / anonymization
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const piiFields = PII_FIELDS_TO_CLEAR[table] || [];
    for (const field of piiFields) {
      updates[field] = '[deleted]';
    }

    // Add deletion marker
    if (table === 'contacts') {
      updates.status = 'deleted';
      updates.deleted_at = new Date().toISOString();
      updates.anonymized = true;
    }

    // Soft delete the record
    const { error: updateError } = await supabase
      .from(table)
      .update(updates)
      .eq('id', subjectId)
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Error soft-deleting record:', updateError);
      return { success: false, error: updateError.message };
    }

    // Delete associated consents
    const { error: consentError } = await supabase
      .from('data_consents')
      .update({
        consent_given: false,
        withdrawn_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId)
      .eq('data_subject_type', subjectType)
      .eq('data_subject_id', subjectId);

    if (consentError) {
      console.error('Error clearing consents:', consentError);
    }

    // Also revoke residency tag
    try {
      await supabase
        .from('data_residency_tags')
        .update({
          data_category: 'standard',
          updated_at: new Date().toISOString(),
        })
        .eq('entity_type', table)
        .eq('entity_id', subjectId);
    } catch (tagError) {
      console.error('Error updating residency tag:', tagError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing deletion request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
