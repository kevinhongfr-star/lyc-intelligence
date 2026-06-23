// Phase 3.11: Single Approval Request Detail API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getApprovalRequestDetail, cancelApprovalRequest } from '@/services/approvalService';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const detail = await getApprovalRequestDetail(supabase, id);

    if (!detail) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: detail });
  } catch (error) {
    console.error('Error fetching approval request:', error);
    return NextResponse.json({ error: 'Failed to fetch approval request' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    if (body.action === 'cancel') {
      const result = await cancelApprovalRequest(supabase, id, body.user_id);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating approval request:', error);
    return NextResponse.json({ error: 'Failed to update approval request' }, { status: 500 });
  }
}
