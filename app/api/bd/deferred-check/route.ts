// Phase 2.8: BD Deferred Check API - Past-due follow-up alerts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BDOpportunity } from '@/types/bd';

export async function GET(request: Request) {
  const supabase = createClient();
  const url = new URL(request.url);

  const orgId = url.searchParams.get('org_id');
  const ownerId = url.searchParams.get('owner_id');
  const includeUpcoming = url.searchParams.get('include_upcoming') === 'true';
  const upcomingDays = parseInt(url.searchParams.get('upcoming_days') || '7');

  if (!orgId) {
    return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = supabase
      .from('bd_opportunities')
      .select('*')
      .eq('org_id', orgId)
      .eq('stage', 'deferred')
      .not('deferred_until', 'is', null);

    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }

    const { data, error } = await query
      .order('deferred_until', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const deferredOpps = (data as BDOpportunity[]) || [];

    const pastDue: BDOpportunity[] = [];
    const upcoming: BDOpportunity[] = [];

    const upcomingDate = new Date(today);
    upcomingDate.setDate(upcomingDate.getDate() + upcomingDays);

    for (const opp of deferredOpps) {
      if (!opp.deferred_until) continue;

      const deferredDate = new Date(opp.deferred_until);
      deferredDate.setHours(0, 0, 0, 0);

      if (deferredDate < today) {
        pastDue.push(opp);
      } else if (includeUpcoming && deferredDate <= upcomingDate) {
        upcoming.push(opp);
      }
    }

    // Calculate days overdue for each past due item
    const pastDueWithDays = pastDue.map((opp) => ({
      ...opp,
      days_overdue: Math.floor(
        (today.getTime() - new Date(opp.deferred_until!).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      success: true,
      data: {
        past_due: pastDueWithDays,
        upcoming: includeUpcoming ? upcoming : [],
        past_due_count: pastDue.length,
        upcoming_count: upcoming.length,
        total_deferred: deferredOpps.length,
      },
    });
  } catch (error) {
    console.error('Error fetching deferred checks:', error);
    return NextResponse.json({ error: 'Failed to fetch deferred opportunities' }, { status: 500 });
  }
}
