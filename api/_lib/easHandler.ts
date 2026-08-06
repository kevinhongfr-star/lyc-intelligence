import * as db from './supabaseRest.js';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface CreditAllocation {
  org_id: string;
  allocation: number;
  used: number;
  remaining: number;
}

export interface Booking {
  id: string;
  org_id: string;
  user_id: string;
  booking_type: 'live_session' | 'workshop';
  status: BookingStatus;
  slot_date: string;
  workshop_id?: string | null;
  notes?: string | null;
  created_at: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  completed_at?: string | null;
  no_show_at?: string | null;
}

export interface CouncilPerks {
  org_id: string;
  unlimited_chat: boolean;
  premium_assessments: boolean;
  peer_matching: boolean;
  executive_reviews: boolean;
  community_access: boolean;
  priority_support: boolean;
  live_session_access: boolean;
  workshop_access: boolean;
}

const LIVE_CREDITS_TABLE = 'live_session_credits';
const WORKSHOP_CREDITS_TABLE = 'workshop_credits';
const BOOKINGS_TABLE = 'bookings';
const COUNCIL_PERKS_TABLE = 'council_perks';

async function getCreditAllocation(
  table: string,
  orgId: string
): Promise<CreditAllocation> {
  const row = await db.selectOne(table, {
    column: 'org_id',
    value: orgId,
  });

  if (!row) {
    return { org_id: orgId, allocation: 0, used: 0, remaining: 0 };
  }

  const allocation = Number(row.allocation || 0);
  const used = Number(row.used || 0);

  return {
    org_id: orgId,
    allocation,
    used,
    remaining: Math.max(0, allocation - used),
  };
}

async function deductCredit(
  table: string,
  orgId: string,
  amount: number = 1
): Promise<void> {
  const row = await db.selectOne(table, {
    column: 'org_id',
    value: orgId,
  });

  if (!row) {
    await db.insert(table, {
      org_id: orgId,
      allocation: 0,
      used: amount,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const currentUsed = Number(row.used || 0);
  await db.update(
    table,
    { column: 'org_id', value: orgId },
    {
      used: currentUsed + amount,
      updated_at: new Date().toISOString(),
    }
  );
}

async function refundCredit(
  table: string,
  orgId: string,
  amount: number = 1
): Promise<void> {
  const row = await db.selectOne(table, {
    column: 'org_id',
    value: orgId,
  });

  if (!row) return;

  const currentUsed = Number(row.used || 0);
  await db.update(
    table,
    { column: 'org_id', value: orgId },
    {
      used: Math.max(0, currentUsed - amount),
      updated_at: new Date().toISOString(),
    }
  );
}

export async function getLiveSessionCredits(
  orgId: string
): Promise<CreditAllocation> {
  return getCreditAllocation(LIVE_CREDITS_TABLE, orgId);
}

export async function getWorkshopCredits(
  orgId: string
): Promise<CreditAllocation> {
  return getCreditAllocation(WORKSHOP_CREDITS_TABLE, orgId);
}

export async function requestLiveSessionBooking(
  orgId: string,
  userId: string,
  slotDate: string,
  notes?: string
): Promise<Booking> {
  const liveCredits = await getLiveSessionCredits(orgId);
  if (liveCredits.remaining <= 0) {
    const err: any = new Error(
      'No live session credits remaining for this organization'
    );
    err.code = 'NO_CREDITS';
    err.creditType = 'live_session';
    throw err;
  }

  const row = await db.insert(BOOKINGS_TABLE, {
    org_id: orgId,
    user_id: userId,
    booking_type: 'live_session',
    status: 'pending',
    slot_date: slotDate,
    notes: notes || null,
    created_at: new Date().toISOString(),
  });

  return {
    id: row?.id || `booking-${Date.now()}`,
    org_id: orgId,
    user_id: userId,
    booking_type: 'live_session',
    status: 'pending',
    slot_date: slotDate,
    notes: notes || null,
    created_at: row?.created_at || new Date().toISOString(),
  };
}

export async function requestWorkshopBooking(
  orgId: string,
  userId: string,
  workshopId: string
): Promise<Booking> {
  const workshopCredits = await getWorkshopCredits(orgId);
  if (workshopCredits.remaining <= 0) {
    const err: any = new Error(
      'No workshop credits remaining for this organization'
    );
    err.code = 'NO_CREDITS';
    err.creditType = 'workshop';
    throw err;
  }

  const row = await db.insert(BOOKINGS_TABLE, {
    org_id: orgId,
    user_id: userId,
    booking_type: 'workshop',
    status: 'pending',
    slot_date: new Date().toISOString(),
    workshop_id: workshopId,
    created_at: new Date().toISOString(),
  });

  return {
    id: row?.id || `booking-${Date.now()}`,
    org_id: orgId,
    user_id: userId,
    booking_type: 'workshop',
    status: 'pending',
    slot_date: row?.slot_date || new Date().toISOString(),
    workshop_id: workshopId,
    created_at: row?.created_at || new Date().toISOString(),
  };
}

export async function confirmBooking(bookingId: string): Promise<Booking> {
  const booking = await db.selectOne(BOOKINGS_TABLE, {
    column: 'id',
    value: bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status !== 'pending') {
    throw new Error(
      `Cannot confirm booking in "${booking.status}" status. Only pending bookings can be confirmed.`
    );
  }

  const creditTable =
    booking.booking_type === 'live_session'
      ? LIVE_CREDITS_TABLE
      : WORKSHOP_CREDITS_TABLE;

  await deductCredit(creditTable, booking.org_id);

  const updated = await db.update(
    BOOKINGS_TABLE,
    { column: 'id', value: bookingId },
    {
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const row = updated[0];
  return {
    id: row?.id || booking.id,
    org_id: row?.org_id || booking.org_id,
    user_id: row?.user_id || booking.user_id,
    booking_type: row?.booking_type || booking.booking_type,
    status: 'confirmed',
    slot_date: row?.slot_date || booking.slot_date,
    workshop_id: row?.workshop_id || booking.workshop_id,
    notes: row?.notes || booking.notes,
    created_at: row?.created_at || booking.created_at,
    confirmed_at: row?.confirmed_at || new Date().toISOString(),
  };
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const booking = await db.selectOne(BOOKINGS_TABLE, {
    column: 'id',
    value: bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status === 'cancelled') {
    throw new Error('Booking is already cancelled');
  }

  if (booking.status === 'completed') {
    throw new Error('Cannot cancel a completed booking');
  }

  if (booking.status === 'no_show') {
    throw new Error('Cannot cancel a no-show booking');
  }

  const slotDate = new Date(booking.slot_date);
  const now = new Date();
  const hoursBefore = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const refundAllowed = hoursBefore >= 24;

  if (booking.status === 'confirmed' && refundAllowed) {
    const creditTable =
      booking.booking_type === 'live_session'
        ? LIVE_CREDITS_TABLE
        : WORKSHOP_CREDITS_TABLE;
    await refundCredit(creditTable, booking.org_id);
  }

  const updated = await db.update(
    BOOKINGS_TABLE,
    { column: 'id', value: bookingId },
    {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const row = updated[0];
  return {
    id: row?.id || booking.id,
    org_id: row?.org_id || booking.org_id,
    user_id: row?.user_id || booking.user_id,
    booking_type: row?.booking_type || booking.booking_type,
    status: 'cancelled',
    slot_date: row?.slot_date || booking.slot_date,
    workshop_id: row?.workshop_id || booking.workshop_id,
    notes: row?.notes || booking.notes,
    created_at: row?.created_at || booking.created_at,
    cancelled_at: row?.cancelled_at || new Date().toISOString(),
  };
}

export async function getCouncilPerks(orgId: string): Promise<CouncilPerks> {
  const row = await db.selectOne(COUNCIL_PERKS_TABLE, {
    column: 'org_id',
    value: orgId,
  });

  if (!row) {
    return {
      org_id: orgId,
      unlimited_chat: false,
      premium_assessments: false,
      peer_matching: false,
      executive_reviews: false,
      community_access: false,
      priority_support: false,
      live_session_access: false,
      workshop_access: false,
    };
  }

  return {
    org_id: orgId,
    unlimited_chat: Boolean(row.unlimited_chat),
    premium_assessments: Boolean(row.premium_assessments),
    peer_matching: Boolean(row.peer_matching),
    executive_reviews: Boolean(row.executive_reviews),
    community_access: Boolean(row.community_access),
    priority_support: Boolean(row.priority_support),
    live_session_access: Boolean(row.live_session_access),
    workshop_access: Boolean(row.workshop_access),
  };
}

export async function getUserBookings(
  orgId: string,
  status?: BookingStatus
): Promise<Booking[]> {
  const where: any[] = [{ column: 'org_id', value: orgId }];

  if (status) {
    where.push({ column: 'status', value: status });
  }

  const rows = await db.selectMany(BOOKINGS_TABLE, {
    where,
    orderBy: { column: 'created_at', ascending: false },
    limit: 100,
  });

  return (rows || []).map((r: any) => ({
    id: r.id,
    org_id: r.org_id,
    user_id: r.user_id,
    booking_type: r.booking_type,
    status: r.status,
    slot_date: r.slot_date,
    workshop_id: r.workshop_id || null,
    notes: r.notes || null,
    created_at: r.created_at,
    confirmed_at: r.confirmed_at || null,
    cancelled_at: r.cancelled_at || null,
    completed_at: r.completed_at || null,
    no_show_at: r.no_show_at || null,
  }));
}

export async function markBookingComplete(
  bookingId: string
): Promise<Booking> {
  const booking = await db.selectOne(BOOKINGS_TABLE, {
    column: 'id',
    value: bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status !== 'confirmed') {
    throw new Error(
      `Cannot complete booking in "${booking.status}" status. Only confirmed bookings can be completed.`
    );
  }

  const updated = await db.update(
    BOOKINGS_TABLE,
    { column: 'id', value: bookingId },
    {
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const row = updated[0];
  return {
    id: row?.id || booking.id,
    org_id: row?.org_id || booking.org_id,
    user_id: row?.user_id || booking.user_id,
    booking_type: row?.booking_type || booking.booking_type,
    status: 'completed',
    slot_date: row?.slot_date || booking.slot_date,
    workshop_id: row?.workshop_id || booking.workshop_id,
    notes: row?.notes || booking.notes,
    created_at: row?.created_at || booking.created_at,
    completed_at: row?.completed_at || new Date().toISOString(),
  };
}

export async function markBookingNoShow(
  bookingId: string
): Promise<Booking> {
  const booking = await db.selectOne(BOOKINGS_TABLE, {
    column: 'id',
    value: bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status !== 'confirmed') {
    throw new Error(
      `Cannot mark as no-show in "${booking.status}" status. Only confirmed bookings can be marked as no-show.`
    );
  }

  const updated = await db.update(
    BOOKINGS_TABLE,
    { column: 'id', value: bookingId },
    {
      status: 'no_show',
      no_show_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  const row = updated[0];
  return {
    id: row?.id || booking.id,
    org_id: row?.org_id || booking.org_id,
    user_id: row?.user_id || booking.user_id,
    booking_type: row?.booking_type || booking.booking_type,
    status: 'no_show',
    slot_date: row?.slot_date || booking.slot_date,
    workshop_id: row?.workshop_id || booking.workshop_id,
    notes: row?.notes || booking.notes,
    created_at: row?.created_at || booking.created_at,
    no_show_at: row?.no_show_at || new Date().toISOString(),
  };
}

export async function upsertCreditAllocation(
  table: string,
  orgId: string,
  allocation: number
): Promise<CreditAllocation> {
  const existing = await db.selectOne(table, {
    column: 'org_id',
    value: orgId,
  });

  if (existing) {
    const currentUsed = Number(existing.used || 0);
    await db.update(
      table,
      { column: 'org_id', value: orgId },
      {
        allocation,
        remaining: Math.max(0, allocation - currentUsed),
        updated_at: new Date().toISOString(),
      }
    );
    return {
      org_id: orgId,
      allocation,
      used: currentUsed,
      remaining: Math.max(0, allocation - currentUsed),
    };
  }

  await db.insert(table, {
    org_id: orgId,
    allocation,
    used: 0,
    remaining: allocation,
    created_at: new Date().toISOString(),
  });

  return { org_id: orgId, allocation, used: 0, remaining: allocation };
}

export { LIVE_CREDITS_TABLE, WORKSHOP_CREDITS_TABLE, BOOKINGS_TABLE, COUNCIL_PERKS_TABLE };
