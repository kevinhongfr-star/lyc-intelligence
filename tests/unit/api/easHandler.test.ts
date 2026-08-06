// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/_lib/supabaseRest.js', () => ({
  selectOne: vi.fn(),
  selectMany: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  countRows: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

import { selectOne, selectMany, insert, update } from '../../../api/_lib/supabaseRest.js';
import {
  getLiveSessionCredits,
  getWorkshopCredits,
  requestLiveSessionBooking,
  requestWorkshopBooking,
  confirmBooking,
  cancelBooking,
  getCouncilPerks,
  getUserBookings,
  markBookingComplete,
  markBookingNoShow,
  upsertCreditAllocation,
  type Booking,
  type CreditAllocation,
  type BookingStatus,
} from '../../../api/_lib/easHandler.js';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);
const mockInsert = vi.mocked(insert);
const mockUpdate = vi.mocked(update);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeCreditRow(overrides: Record<string, any> = {}) {
  return {
    org_id: 'org-1',
    allocation: 10,
    used: 3,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: null,
    ...overrides,
  };
}

function makeBookingRow(overrides: Record<string, any> = {}) {
  return {
    id: 'booking-1',
    org_id: 'org-1',
    user_id: 'user-1',
    booking_type: 'live_session',
    status: 'pending' as BookingStatus,
    slot_date: '2026-09-01T10:00:00Z',
    workshop_id: null,
    notes: null,
    created_at: '2026-08-06T10:00:00Z',
    confirmed_at: null,
    cancelled_at: null,
    completed_at: null,
    no_show_at: null,
    ...overrides,
  };
}

function makePerksRow(overrides: Record<string, any> = {}) {
  return {
    org_id: 'org-1',
    unlimited_chat: true,
    premium_assessments: true,
    peer_matching: false,
    executive_reviews: false,
    community_access: true,
    priority_support: false,
    live_session_access: true,
    workshop_access: true,
    ...overrides,
  };
}

describe('getLiveSessionCredits', () => {
  it('returns allocation with remaining credits', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow());

    const result = await getLiveSessionCredits('org-1');

    expect(result).toEqual({ org_id: 'org-1', allocation: 10, used: 3, remaining: 7 });
  });

  it('returns zeros when no record exists', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await getLiveSessionCredits('unknown-org');

    expect(result).toEqual({ org_id: 'unknown-org', allocation: 0, used: 0, remaining: 0 });
  });

  it('handles null/undefined fields gracefully', async () => {
    mockSelectOne.mockResolvedValue({ org_id: 'org-2' });

    const result = await getLiveSessionCredits('org-2');

    expect(result).toEqual({ org_id: 'org-2', allocation: 0, used: 0, remaining: 0 });
  });

  it('queries with correct table and column', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow());

    await getLiveSessionCredits('org-1');

    expect(selectOne).toHaveBeenCalledWith('live_session_credits', {
      column: 'org_id',
      value: 'org-1',
    });
  });
});

describe('getWorkshopCredits', () => {
  it('returns allocation with remaining credits', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow({ allocation: 5, used: 5 }));

    const result = await getWorkshopCredits('org-1');

    expect(result).toEqual({ org_id: 'org-1', allocation: 5, used: 5, remaining: 0 });
  });

  it('returns zeros when no record exists', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await getWorkshopCredits('new-org');

    expect(result).toEqual({ org_id: 'new-org', allocation: 0, used: 0, remaining: 0 });
  });

  it('queries with correct table', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow());

    await getWorkshopCredits('org-1');

    expect(selectOne).toHaveBeenCalledWith('workshop_credits', expect.any(Object));
  });
});

describe('requestLiveSessionBooking', () => {
  it('creates a pending booking when credits available', async () => {
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'live_session_credits') return makeCreditRow();
      return null;
    });
    mockInsert.mockResolvedValue(makeBookingRow());

    const result = await requestLiveSessionBooking('org-1', 'user-1', '2026-09-01T10:00:00Z');

    expect(result.status).toBe('pending');
    expect(result.booking_type).toBe('live_session');
    expect(result.org_id).toBe('org-1');
    expect(insert).toHaveBeenCalledWith(
      'bookings',
      expect.objectContaining({
        org_id: 'org-1',
        user_id: 'user-1',
        booking_type: 'live_session',
        status: 'pending',
        slot_date: '2026-09-01T10:00:00Z',
      })
    );
  });

  it('throws NO_CREDITS when no remaining credits', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow({ allocation: 5, used: 5 }));

    try {
      await requestLiveSessionBooking('org-1', 'user-1', '2026-09-01T10:00:00Z');
      expect.fail('Expected error');
    } catch (err: any) {
      expect(err.code).toBe('NO_CREDITS');
      expect(err.creditType).toBe('live_session');
    }
  });

  it('stores notes when provided', async () => {
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'live_session_credits') return makeCreditRow();
      return null;
    });
    mockInsert.mockResolvedValue(makeBookingRow());

    await requestLiveSessionBooking('org-1', 'user-1', '2026-09-01T10:00:00Z', 'Please bring portfolio');

    expect(insert).toHaveBeenCalledWith(
      'bookings',
      expect.objectContaining({ notes: 'Please bring portfolio' })
    );
  });

  it('defaults notes to null when not provided', async () => {
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'live_session_credits') return makeCreditRow();
      return null;
    });
    mockInsert.mockResolvedValue(makeBookingRow());

    await requestLiveSessionBooking('org-1', 'user-1', '2026-09-01T10:00:00Z');

    expect(insert).toHaveBeenCalledWith(
      'bookings',
      expect.objectContaining({ notes: null })
    );
  });
});

describe('requestWorkshopBooking', () => {
  it('creates a pending workshop booking', async () => {
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'workshop_credits') return makeCreditRow({ allocation: 3, used: 1 });
      return null;
    });
    mockInsert.mockResolvedValue(makeBookingRow({ booking_type: 'workshop', workshop_id: 'ws-1' }));

    const result = await requestWorkshopBooking('org-1', 'user-1', 'ws-1');

    expect(result.status).toBe('pending');
    expect(result.booking_type).toBe('workshop');
    expect(result.workshop_id).toBe('ws-1');
  });

  it('throws NO_CREDITS when workshop credits exhausted', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow({ allocation: 2, used: 2 }));

    try {
      await requestWorkshopBooking('org-1', 'user-1', 'ws-1');
      expect.fail('Expected error');
    } catch (err: any) {
      expect(err.code).toBe('NO_CREDITS');
      expect(err.creditType).toBe('workshop');
    }
  });
});

describe('confirmBooking', () => {
  it('confirms a pending booking and deducts credit', async () => {
    const bookingRow = makeBookingRow();
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'confirmed', confirmed_at: '2026-08-06T12:00:00Z' }]);

    const result = await confirmBooking('booking-1');

    expect(result.status).toBe('confirmed');
    expect(result.confirmed_at).toBeTruthy();
    expect(update).toHaveBeenCalledWith(
      'bookings',
      { column: 'id', value: 'booking-1' },
      expect.objectContaining({ status: 'confirmed' })
    );
  });

  it('deducts from live_session_credits for live session bookings', async () => {
    const bookingRow = makeBookingRow({ booking_type: 'live_session' });
    const creditRow = makeCreditRow();
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'bookings') return bookingRow;
      if (table === 'live_session_credits') return creditRow;
      return null;
    });
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'confirmed' }]);

    await confirmBooking('booking-1');

    expect(update).toHaveBeenCalledWith(
      'live_session_credits',
      { column: 'org_id', value: 'org-1' },
      expect.objectContaining({ used: 4 })
    );
  });

  it('deducts from workshop_credits for workshop bookings', async () => {
    const bookingRow = makeBookingRow({ booking_type: 'workshop' });
    const creditRow = makeCreditRow();
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'bookings') return bookingRow;
      if (table === 'workshop_credits') return creditRow;
      return null;
    });
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'confirmed' }]);

    await confirmBooking('booking-1');

    expect(update).toHaveBeenCalledWith(
      'workshop_credits',
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('throws when booking not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    await expect(confirmBooking('nonexistent')).rejects.toThrow('Booking not found');
  });

  it('throws when booking is not pending', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'cancelled' }));

    await expect(confirmBooking('booking-1')).rejects.toThrow('Cannot confirm');
  });

  it('creates credit record if none exists', async () => {
    const bookingRow = makeBookingRow();
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'bookings') return bookingRow;
      return null;
    });
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'confirmed' }]);

    await confirmBooking('booking-1');

    expect(insert).toHaveBeenCalledWith(
      'live_session_credits',
      expect.objectContaining({ org_id: 'org-1', used: 1 })
    );
  });
});

describe('cancelBooking', () => {
  it('cancels a pending booking', async () => {
    const bookingRow = makeBookingRow();
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'cancelled' }]);

    const result = await cancelBooking('booking-1');

    expect(result.status).toBe('cancelled');
    expect(result.cancelled_at).toBeTruthy();
  });

  it('refunds credit when cancelled >=24h before confirmed booking', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 48);
    const bookingRow = makeBookingRow({
      status: 'confirmed',
      slot_date: futureDate.toISOString(),
    });
    const creditRow = makeCreditRow({ allocation: 10, used: 5 });
    mockSelectOne.mockImplementation(async (table: string) => {
      if (table === 'bookings') return bookingRow;
      if (table === 'live_session_credits') return creditRow;
      return null;
    });
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'cancelled' }]);

    await cancelBooking('booking-1');

    expect(update).toHaveBeenCalledWith(
      'live_session_credits',
      expect.any(Object),
      expect.objectContaining({ used: 4 })
    );
  });

  it('does not refund when cancelled <24h before', async () => {
    const nearDate = new Date();
    nearDate.setHours(nearDate.getHours() + 2);
    const bookingRow = makeBookingRow({
      status: 'confirmed',
      slot_date: nearDate.toISOString(),
    });
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'cancelled' }]);

    await cancelBooking('booking-1');

    const updateCalls = mockUpdate.mock.calls.filter(
      (c: any[]) => c[0] === 'live_session_credits'
    );
    expect(updateCalls).toHaveLength(0);
  });

  it('does not refund for workshop bookings within 24h', async () => {
    const nearDate = new Date();
    nearDate.setHours(nearDate.getHours() + 2);
    const bookingRow = makeBookingRow({
      booking_type: 'workshop',
      status: 'confirmed',
      slot_date: nearDate.toISOString(),
    });
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'cancelled' }]);

    await cancelBooking('booking-1');

    const creditCalls = mockUpdate.mock.calls.filter(
      (c: any[]) => c[0] === 'workshop_credits'
    );
    expect(creditCalls).toHaveLength(0);
  });

  it('throws when booking not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    await expect(cancelBooking('nonexistent')).rejects.toThrow('Booking not found');
  });

  it('throws when already cancelled', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'cancelled' }));

    await expect(cancelBooking('booking-1')).rejects.toThrow('already cancelled');
  });

  it('throws when completed', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'completed' }));

    await expect(cancelBooking('booking-1')).rejects.toThrow('Cannot cancel a completed');
  });

  it('throws when no_show', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'no_show' }));

    await expect(cancelBooking('booking-1')).rejects.toThrow('Cannot cancel a no-show');
  });
});

describe('getCouncilPerks', () => {
  it('returns all perk flags for org with perks', async () => {
    mockSelectOne.mockResolvedValue(makePerksRow());

    const result = await getCouncilPerks('org-1');

    expect(result.unlimited_chat).toBe(true);
    expect(result.premium_assessments).toBe(true);
    expect(result.peer_matching).toBe(false);
    expect(result.community_access).toBe(true);
    expect(result.live_session_access).toBe(true);
    expect(result.workshop_access).toBe(true);
  });

  it('returns all false when no perks record', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await getCouncilPerks('unknown-org');

    expect(result.unlimited_chat).toBe(false);
    expect(result.premium_assessments).toBe(false);
    expect(result.peer_matching).toBe(false);
    expect(result.executive_reviews).toBe(false);
    expect(result.community_access).toBe(false);
    expect(result.priority_support).toBe(false);
    expect(result.live_session_access).toBe(false);
    expect(result.workshop_access).toBe(false);
  });

  it('queries with correct table', async () => {
    mockSelectOne.mockResolvedValue(makePerksRow());

    await getCouncilPerks('org-1');

    expect(selectOne).toHaveBeenCalledWith('council_perks', {
      column: 'org_id',
      value: 'org-1',
    });
  });

  it('handles partially null perk fields', async () => {
    mockSelectOne.mockResolvedValue({
      org_id: 'org-1',
      unlimited_chat: true,
    });

    const result = await getCouncilPerks('org-1');

    expect(result.unlimited_chat).toBe(true);
    expect(result.peer_matching).toBe(false);
    expect(result.priority_support).toBe(false);
  });
});

describe('getUserBookings', () => {
  it('returns bookings ordered by created_at descending', async () => {
    const rows = [
      makeBookingRow({ id: 'b-2', created_at: '2026-08-07T10:00:00Z' }),
      makeBookingRow({ id: 'b-1', created_at: '2026-08-06T10:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(rows);

    const result = await getUserBookings('org-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('b-2');
  });

  it('filters by status when provided', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getUserBookings('org-1', 'confirmed');

    expect(selectMany).toHaveBeenCalledWith(
      'bookings',
      expect.objectContaining({
        where: expect.arrayContaining([
          { column: 'org_id', value: 'org-1' },
          { column: 'status', value: 'confirmed' },
        ]),
      })
    );
  });

  it('returns empty array when no bookings', async () => {
    mockSelectMany.mockResolvedValue(null);

    const result = await getUserBookings('org-1');

    expect(result).toEqual([]);
  });

  it('defaults to unfiltered when no status specified', async () => {
    mockSelectMany.mockResolvedValue([]);

    await getUserBookings('org-1');

    expect(selectMany).toHaveBeenCalledWith(
      'bookings',
      expect.objectContaining({
        where: [{ column: 'org_id', value: 'org-1' }],
      })
    );
  });
});

describe('markBookingComplete', () => {
  it('completes a confirmed booking', async () => {
    const bookingRow = makeBookingRow({ status: 'confirmed' });
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'completed', completed_at: '2026-08-06T14:00:00Z' }]);

    const result = await markBookingComplete('booking-1');

    expect(result.status).toBe('completed');
    expect(result.completed_at).toBeTruthy();
  });

  it('throws when not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    await expect(markBookingComplete('nonexistent')).rejects.toThrow('Booking not found');
  });

  it('throws when not confirmed', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'pending' }));

    await expect(markBookingComplete('booking-1')).rejects.toThrow('Cannot complete');
  });
});

describe('markBookingNoShow', () => {
  it('marks a confirmed booking as no_show', async () => {
    const bookingRow = makeBookingRow({ status: 'confirmed' });
    mockSelectOne.mockResolvedValue(bookingRow);
    mockUpdate.mockResolvedValue([{ ...bookingRow, status: 'no_show', no_show_at: '2026-08-06T10:30:00Z' }]);

    const result = await markBookingNoShow('booking-1');

    expect(result.status).toBe('no_show');
    expect(result.no_show_at).toBeTruthy();
  });

  it('throws when not found', async () => {
    mockSelectOne.mockResolvedValue(null);

    await expect(markBookingNoShow('nonexistent')).rejects.toThrow('Booking not found');
  });

  it('throws when not confirmed', async () => {
    mockSelectOne.mockResolvedValue(makeBookingRow({ status: 'cancelled' }));

    await expect(markBookingNoShow('booking-1')).rejects.toThrow('Cannot mark as no-show');
  });
});

describe('upsertCreditAllocation', () => {
  it('creates new allocation record', async () => {
    mockSelectOne.mockResolvedValue(null);
    mockInsert.mockResolvedValue({
      org_id: 'org-1',
      allocation: 20,
      used: 0,
      remaining: 20,
    });

    const result = await upsertCreditAllocation('live_session_credits', 'org-1', 20);

    expect(result.allocation).toBe(20);
    expect(result.used).toBe(0);
    expect(result.remaining).toBe(20);
    expect(insert).toHaveBeenCalledWith(
      'live_session_credits',
      expect.objectContaining({ org_id: 'org-1', allocation: 20 })
    );
  });

  it('updates existing allocation preserving used count', async () => {
    mockSelectOne.mockResolvedValue(makeCreditRow({ allocation: 10, used: 3 }));
    mockUpdate.mockResolvedValue([{
      org_id: 'org-1',
      allocation: 20,
      used: 3,
      remaining: 17,
    }]);

    const result = await upsertCreditAllocation('live_session_credits', 'org-1', 20);

    expect(result.allocation).toBe(20);
    expect(result.used).toBe(3);
    expect(result.remaining).toBe(17);
  });
});

describe('BookingStatus type coverage', () => {
  it('supports all 5 booking statuses', () => {
    const statuses: BookingStatus[] = [
      'pending', 'confirmed', 'completed', 'cancelled', 'no_show',
    ];
    expect(statuses).toHaveLength(5);
  });
});
