// coachingService.ts — Real coaching availability + bookings (corrective batch #1393).
//
// Replaces the hardcoded AVAILABILITY_SLOTS / PAST_SESSIONS mocks in
// CoachingPageV3 and the alert()-only confirm in CoachingBookingFlowPage.
// Reads/writes the coaching_availability + coaching_bookings tables
// (migration 20260821_coaching_bookings.sql). On confirm: inserts a real
// booking row, marks the availability slot booked, and enqueues a
// best-effort confirmation email job (ai_job_queue, kind email:booking_confirmation).

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface AvailabilitySlot {
  id: string;
  day: string; // display label e.g. "Monday, Aug 24"
  time: string; // display label e.g. "2:00 PM"
  duration: number; // minutes
  package: string; // Bronze | Silver | Gold
  /** Raw DB row for booking creation. */
  raw: {
    id: string;
    slot_date: string;
    slot_time: string;
    duration_min: number;
    package: string;
  };
}

export interface UserBooking {
  id: string;
  title: string;
  date: string; // display label
  duration: string; // display label e.g. "60 min"
  status: string;
}

function formatDayLabel(slotDate: string): string {
  const d = new Date(slotDate + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return slotDate;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeLabel(slotTime: string): string {
  // slot_time is "HH:MM" — render as "2:00 PM".
  const [hStr, mStr] = slotTime.split(':');
  const h = Number(hStr);
  const m = Number(mStr || '0');
  if (Number.isNaN(h)) return slotTime;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Open consultant slots for the next 2 weeks, newest-first by date.
 */
export async function fetchOpenAvailability(): Promise<AvailabilitySlot[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('coaching_availability')
      .select('id, slot_date, slot_time, duration_min, package, is_booked')
      .eq('is_booked', false)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })
      .limit(12);

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      day: formatDayLabel(row.slot_date),
      time: formatTimeLabel(row.slot_time),
      duration: row.duration_min,
      package: row.package || 'Bronze',
      raw: {
        id: row.id,
        slot_date: row.slot_date,
        slot_time: row.slot_time,
        duration_min: row.duration_min,
        package: row.package,
      },
    }));
  } catch (e) {
    console.error('[coachingService] fetchOpenAvailability failed:', e);
    return [];
  }
}

/**
 * A user's booking history (newest first).
 */
export async function fetchUserBookings(userId: string): Promise<UserBooking[]> {
  if (!isSupabaseConfigured || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('coaching_bookings')
      .select('id, package, slot_day, slot_time, duration_min, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      title: `${row.package} debrief`,
      date: row.slot_day,
      duration: `${row.duration_min} min`,
      status: row.status,
    }));
  } catch (e) {
    console.error('[coachingService] fetchUserBookings failed:', e);
    return [];
  }
}

export interface CreateBookingInput {
  userId: string;
  userEmail?: string | null;
  userName?: string | null;
  availabilityId?: string | null;
  pkg: string;
  slotDay: string;
  slotTime: string;
  durationMin: number;
  notes?: string;
}

export interface CreateBookingResult {
  success: boolean;
  bookingId?: string;
  error?: string;
}

/**
 * Create a real booking record, mark the availability slot booked, and
 * enqueue a best-effort confirmation email. Returns the booking id.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  if (!isSupabaseConfigured || !input.userId) {
    return { success: false, error: 'Not configured' };
  }

  try {
    // 1. Insert the booking row (RLS: user owns their rows).
    const { data, error } = await supabase
      .from('coaching_bookings')
      .insert({
        user_id: input.userId,
        availability_id: input.availabilityId ?? null,
        package: input.pkg,
        slot_day: input.slotDay,
        slot_time: input.slotTime,
        duration_min: input.durationMin,
        status: 'confirmed',
        notes: input.notes ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    const bookingId = (data as any)?.id as string | undefined;
    if (!bookingId) throw new Error('No booking id returned');

    // 2. Mark the availability slot booked (best-effort; availability writes
    //    are server-managed under RLS, so this may no-op client-side — the
    //    booking row is the source of truth regardless).
    if (input.availabilityId) {
      void supabase
        .from('coaching_availability')
        .update({ is_booked: true })
        .eq('id', input.availabilityId);
    }

    // 3. Enqueue confirmation email (best-effort; ai_job_queue).
    if (input.userEmail) {
      void supabase.from('ai_job_queue').insert({
        kind: 'email:booking_confirmation',
        payload: {
          recipient_email: input.userEmail,
          recipient_name: input.userName ?? null,
          package: input.pkg,
          slot_day: input.slotDay,
          slot_time: input.slotTime,
          duration_min: input.durationMin,
          booking_id: bookingId,
        },
        available_at: new Date().toISOString(),
        priority: 5,
        tenant_user_id: input.userId,
        created_by_user: input.userId,
      });
    }

    return { success: true, bookingId };
  } catch (e: any) {
    console.error('[coachingService] createBooking failed:', e);
    return { success: false, error: e?.message || 'Booking failed' };
  }
}
