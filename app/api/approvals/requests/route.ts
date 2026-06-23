// Phase 3.11: Approval Requests API - Create + List

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApprovalRequest, getApprovalRequestDetail } from '@/services/approvalService';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const status = url.searchParams.get('status');
  const entityType = url.searchParams.get('entity_type');
  const requestedBy = url.searchParams.get('requested_by');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('approval_requests')
      .select('*')
      .eq('org_id', orgId);

    if (status) {
      query = query.eq('status', status);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (requestedBy) {
      query = query.eq('requested_by', requestedBy);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const body = await request.json();

    const {
      org_id,
      approval_type,
      entity_type,
      entity_id,
      request_data,
      requested_by,
    } = body;

    if (!org_id || !approval_type || !entity_type || !entity_id || !requested_by) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createApprovalRequest(supabase, {
      orgId: org_id,
      approvalType: approval_type,
      entityType: entity_type,
      entityId: entity_id,
      requestData: request_data,
      requestedBy: requested_by,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, request_id: result.request_id }, { status: 201 });
  } catch (error) {
    console.error('Error creating approval request:', error);
    return NextResponse.json({ error: 'Failed to create approval request' }, { status: 500 });
  }
}
