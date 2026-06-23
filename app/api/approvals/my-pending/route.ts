// Phase 3.11: My Pending Approvals API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyPendingApprovals } from '@/services/approvalService';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const userId = url.searchParams.get('user_id');
  const orgId = url.searchParams.get('org_id');

  if (!userId || !orgId) {
    return NextResponse.json({ error: 'user_id and org_id are required' }, { status: 400 });
  }

  try {
    const approvals = await getMyPendingApprovals(supabase, userId, orgId);

    return NextResponse.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 });
  }
}
