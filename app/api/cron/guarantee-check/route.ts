// Phase 4.6: Daily Guarantee Check Cron

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGuaranteePeriod, updateGuaranteeStatus, calculateDaysRemaining } from '@/lib/alumni/engine';

export async function GET() {
  const supabase = createClient();

  try {
    // Get all active guarantee periods
    const { data: guarantees, error } = await supabase
      .from('guarantee_periods')
      .select('id, alumni_id, org_id, end_date, check_in_dates, status')
      .eq('status', 'active');

    if (error || !guarantees) {
      return NextResponse.json({ success: true, message: 'No active guarantees to check' });
    }

    const results = {
      total_checked: guarantees.length,
      status_updates: 0,
      checkin_reminders: 0,
      expired_guarantees: 0,
    };

    for (const guarantee of guarantees) {
      const daysRemaining = calculateDaysRemaining(guarantee.end_date);

      // Check if guarantee has expired
      if (daysRemaining <= 0) {
        await updateGuaranteeStatus(supabase, guarantee.id, 'completed');
        results.expired_guarantees++;
        results.status_updates++;
        continue;
      }

      // Check for upcoming check-ins (within 3 days)
      const today = new Date().toISOString().split('T')[0];
      const upcomingCheckIns = (guarantee.check_in_dates as string[] || []).filter(date => {
        const checkInDate = new Date(date);
        const diff = checkInDate.getTime() - new Date(today).getTime();
        return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000; // Within 3 days
      });

      if (upcomingCheckIns.length > 0) {
        results.checkin_reminders += upcomingCheckIns.length;
        // Send reminders via notification service (to be implemented)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Guarantee check completed',
      results,
    });
  } catch (error) {
    console.error('Error running guarantee check:', error);
    return NextResponse.json({ error: 'Failed to run guarantee check' }, { status: 500 });
  }
}