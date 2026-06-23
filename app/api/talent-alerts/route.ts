// Phase 2.7: Talent Alerts API

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getUnviewedAlerts,
  getAllAlerts,
  markAlertAsViewed,
  markAllAlertsAsViewed,
  countUnviewedAlerts,
} from '@/lib/saved-searches/alerts';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const userId = url.searchParams.get('user_id');
  const unviewedOnly = url.searchParams.get('unviewed') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  try {
    const alerts = unviewedOnly
      ? await getUnviewedAlerts(supabase, userId)
      : await getAllAlerts(supabase, userId);

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching talent alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch talent alerts' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const userId = url.searchParams.get('user_id');
  const alertId = url.searchParams.get('alert_id');

  try {
    // Mark all alerts as viewed
    if (!alertId && userId) {
      const success = await markAllAlertsAsViewed(supabase, userId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark all alerts as viewed' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Mark single alert as viewed
    if (alertId) {
      const success = await markAlertAsViewed(supabase, alertId);
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark alert as viewed' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error updating talent alerts:', error);
    return NextResponse.json({ error: 'Failed to update talent alerts' }, { status: 500 });
  }
}