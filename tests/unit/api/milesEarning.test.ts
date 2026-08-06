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

vi.mock('../../../api/_lib/milesLedger.js', () => ({
  earnMiles: vi.fn(),
  getMilesBalance: vi.fn().mockResolvedValue({ balance: 0, total_earned: 0, total_spent: 0 }),
  spendMiles: vi.fn(),
  getTransactionHistory: vi.fn().mockResolvedValue([]),
}));

import { selectOne, selectMany, insert, update } from '../../../api/_lib/supabaseRest.js';
import { earnMiles } from '../../../api/_lib/milesLedger.js';
import {
  processEarningEvent,
  checkFrequencyCap,
  getUserEarningProgress,
  getLoginStreakMiles,
  EARNING_EVENT_CONFIG,
  type EarningEventType,
} from '../../../api/_lib/milesEarning.js';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);
const mockInsert = vi.mocked(insert);
const mockEarnMiles = vi.mocked(earnMiles);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeEventRow(overrides: Record<string, any> = {}) {
  return {
    id: 'evt-1',
    user_id: 'user-1',
    event_type: 'assessment_completion',
    miles_awarded: 20,
    created_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

describe('EARNING_EVENT_CONFIG', () => {
  it('contains all 8 event types', () => {
    const types = Object.keys(EARNING_EVENT_CONFIG) as EarningEventType[];
    expect(types).toHaveLength(8);
  });

  it('defines miles and cooldown for each event', () => {
    for (const [key, config] of Object.entries(EARNING_EVENT_CONFIG)) {
      expect(config.miles).toBeGreaterThan(0);
      expect(config.cooldownMinutes).toBeGreaterThanOrEqual(0);
      expect(typeof config.description).toBe('string');
    }
  });

  it('login_streak has 5 miles and daily cap of 1', () => {
    const cfg = EARNING_EVENT_CONFIG.login_streak;
    expect(cfg.miles).toBe(5);
    expect(cfg.dailyCap).toBe(1);
  });

  it('assessment_completion has 20 miles', () => {
    expect(EARNING_EVENT_CONFIG.assessment_completion.miles).toBe(20);
  });

  it('deliverable_generation has 15 miles', () => {
    expect(EARNING_EVENT_CONFIG.deliverable_generation.miles).toBe(15);
  });

  it('referral_signup has 50 miles', () => {
    expect(EARNING_EVENT_CONFIG.referral_signup.miles).toBe(50);
  });

  it('thirty_day_bonus has 100 miles', () => {
    expect(EARNING_EVENT_CONFIG.thirty_day_bonus.miles).toBe(100);
  });
});

describe('getLoginStreakMiles', () => {
  it('returns 0 for zero or negative days', () => {
    expect(getLoginStreakMiles(0)).toBe(0);
    expect(getLoginStreakMiles(-5)).toBe(0);
  });

  it('returns 5 miles for 1-2 day streak', () => {
    expect(getLoginStreakMiles(1)).toBe(5);
    expect(getLoginStreakMiles(2)).toBe(5);
  });

  it('returns 10 miles for 3-6 day streak', () => {
    expect(getLoginStreakMiles(3)).toBe(10);
    expect(getLoginStreakMiles(6)).toBe(10);
  });

  it('returns 15 miles for 7-13 day streak', () => {
    expect(getLoginStreakMiles(7)).toBe(15);
    expect(getLoginStreakMiles(13)).toBe(15);
  });

  it('returns 25 miles for 14-29 day streak', () => {
    expect(getLoginStreakMiles(14)).toBe(25);
    expect(getLoginStreakMiles(29)).toBe(25);
  });

  it('returns 50 miles for 30+ day streak', () => {
    expect(getLoginStreakMiles(30)).toBe(50);
    expect(getLoginStreakMiles(100)).toBe(50);
  });
});

describe('checkFrequencyCap', () => {
  it('allows when no previous events', async () => {
    mockSelectMany.mockResolvedValue([]);

    const result = await checkFrequencyCap('user-1', 'assessment_completion');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('allows first event of the day', async () => {
    mockSelectMany.mockResolvedValue([]);

    const result = await checkFrequencyCap('user-1', 'login_streak');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks second login_streak on same day', async () => {
    const now = new Date();
    const today = now.toISOString();

    mockSelectMany.mockResolvedValue([
      makeEventRow({ id: 'evt-1', event_type: 'login_streak', created_at: today }),
    ]);

    const result = await checkFrequencyCap('user-1', 'login_streak');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('enforces cooldown period', async () => {
    const now = Date.now();
    const recent = new Date(now - 1000).toISOString();

    mockSelectMany.mockResolvedValue([
      makeEventRow({ event_type: 'assessment_completion', created_at: recent }),
    ]);

    const result = await checkFrequencyCap('user-1', 'assessment_completion');

    expect(result.allowed).toBe(false);
    expect(result.resetAt).toBeTruthy();
  });

  it('allows after cooldown expires', async () => {
    const now = Date.now();
    const old = new Date(now - 3600000).toISOString();

    mockSelectMany.mockResolvedValue([
      makeEventRow({ event_type: 'assessment_completion', created_at: old }),
    ]);

    const result = await checkFrequencyCap('user-1', 'assessment_completion');

    expect(result.allowed).toBe(true);
  });

  it('allows unlimited events when no daily cap set', async () => {
    mockSelectMany.mockResolvedValue([]);

    const result = await checkFrequencyCap('user-1', 'seven_day_bonus');

    expect(result.allowed).toBe(true);
  });
});

describe('processEarningEvent', () => {
  it('awards miles and records event', async () => {
    mockSelectMany.mockResolvedValue([]);
    mockInsert.mockResolvedValue(makeEventRow());
    mockEarnMiles.mockResolvedValue({
      transaction: { id: 'tx-1' } as any,
      balance: { balance: 20, total_earned: 20, total_spent: 0 },
    });

    const result = await processEarningEvent('user-1', 'assessment_completion');

    expect(result.miles_awarded).toBe(20);
    expect(result.event_recorded).toBe(true);
    expect(insert).toHaveBeenCalledWith(
      'earning_events',
      expect.objectContaining({
        user_id: 'user-1',
        event_type: 'assessment_completion',
        miles_awarded: 20,
      })
    );
    expect(earnMiles).toHaveBeenCalledWith(
      'user-1',
      20,
      EARNING_EVENT_CONFIG.assessment_completion.description,
      'earn-assessment_completion'
    );
  });

  it('does not award when frequency cap is hit', async () => {
    mockSelectMany.mockResolvedValue([
      makeEventRow({ event_type: 'login_streak', created_at: new Date().toISOString() }),
    ]);

    const result = await processEarningEvent('user-1', 'login_streak');

    expect(result.miles_awarded).toBe(0);
    expect(result.event_recorded).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it('uses tiered streak miles for login_streak', async () => {
    mockSelectMany.mockResolvedValue([]);
    mockInsert.mockResolvedValue(makeEventRow({ event_type: 'login_streak' }));
    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 50, total_earned: 50, total_spent: 0 },
    });

    const result = await processEarningEvent('user-1', 'login_streak', 7);

    expect(result.miles_awarded).toBe(15);
    expect(earnMiles).toHaveBeenCalledWith(
      'user-1',
      15,
      expect.any(String),
      'earn-login_streak'
    );
  });

  it('records event with 0 miles when streak days is 0 for login_streak', async () => {
    mockSelectMany.mockResolvedValue([]);
    mockInsert.mockResolvedValue(makeEventRow({ event_type: 'login_streak', miles_awarded: 0 }));

    const result = await processEarningEvent('user-1', 'login_streak', 0);

    expect(result.miles_awarded).toBe(0);
    expect(result.event_recorded).toBe(true);
  });

  it('uses default config miles when no streakDays provided for login_streak', async () => {
    mockSelectMany.mockResolvedValue([]);
    mockInsert.mockResolvedValue(makeEventRow({ event_type: 'login_streak' }));
    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 5, total_earned: 5, total_spent: 0 },
    });

    const result = await processEarningEvent('user-1', 'login_streak');

    expect(result.miles_awarded).toBe(5);
  });
});

describe('getUserEarningProgress', () => {
  it('returns zero progress for new user', async () => {
    mockSelectMany.mockResolvedValue([]);

    const progress = await getUserEarningProgress('new-user');

    for (const key of Object.keys(EARNING_EVENT_CONFIG)) {
      expect(progress[key as EarningEventType].total_earned).toBe(0);
      expect(progress[key as EarningEventType].count).toBe(0);
      expect(progress[key as EarningEventType].last_earned_at).toBeNull();
    }
  });

  it('aggregates miles per event type', async () => {
    const events = [
      makeEventRow({ event_type: 'assessment_completion', miles_awarded: 20 }),
      makeEventRow({ event_type: 'assessment_completion', miles_awarded: 20 }),
      makeEventRow({ event_type: 'login_streak', miles_awarded: 5 }),
    ];
    mockSelectMany.mockResolvedValue(events);

    const progress = await getUserEarningProgress('user-1');

    expect(progress.assessment_completion.total_earned).toBe(40);
    expect(progress.assessment_completion.count).toBe(2);
    expect(progress.login_streak.total_earned).toBe(5);
    expect(progress.login_streak.count).toBe(1);
  });

  it('includes last earned timestamp', async () => {
    const events = [
      makeEventRow({ event_type: 'pdf_export', miles_awarded: 3, created_at: '2026-08-06T12:00:00Z' }),
    ];
    mockSelectMany.mockResolvedValue(events);

    const progress = await getUserEarningProgress('user-1');

    expect(progress.pdf_export.last_earned_at).toBe('2026-08-06T12:00:00Z');
  });

  it('initializes all event types even with no data', async () => {
    const progress = await getUserEarningProgress('user-1');

    const allTypes = Object.keys(EARNING_EVENT_CONFIG);
    for (const type of allTypes) {
      expect(progress[type as EarningEventType]).toBeDefined();
    }
  });
});