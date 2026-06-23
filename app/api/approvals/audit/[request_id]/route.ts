// Phase 3.11: Approval Audit Trail API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { request_id: string } }
) {
  const supabase = createClient();
  const { request_id } = params;

  if (!request_id) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('approval_audit_log')
      .select('*')
      .eq('request_id', request_id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return NextResponse.json({ error: 'Failed to fetch audit trail' }, { status: 500 });
  }
}
