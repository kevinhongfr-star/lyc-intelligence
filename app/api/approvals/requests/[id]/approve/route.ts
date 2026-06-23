// Phase 3.11: Approve/Reject Approval Step API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveStep } from '@/services/approvalService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { id } = params;

  try {
    const body = await request.json();

    const { step_order, approver_id, decision, comment } = body;

    if (!step_order || !approver_id || !decision) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    const result = await approveStep(supabase, {
      requestId: id,
      stepOrder: step_order,
      approverId: approver_id,
      decision,
      comment,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing approval step:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
