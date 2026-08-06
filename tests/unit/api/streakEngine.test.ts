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
  getCurrentStreak,
  recordActivity,
  checkStreakMilestones,
  getUserMilestones,
  STREAK_MILESTONES,
  getStreakMilestoneReward,
} from '../../../api/_lib/streakEngine.js';

const mockSelectOne = vi.mocked(selectOne);
const mockSelectMany = vi.mocked(selectMany);
const mockInsert = vi.mocked(insert);
const mockUpdate = vi.mocked(update);
const mockEarnMiles = vi.mocked(earnMiles);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeStreakRow(overrides: Record<string, any> = {}) {
  return {
    user_id: 'user-1',
    current_streak: 5,
    longest_streak: 10,
    last_active_date: '2026-08-06',
    updated_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

function makeMilestoneRow(overrides: Record<string, any> = {}) {
  return {
    id: 'ms-1',
    user_id: 'user-1',
    milestone: 7,
    awarded_at: '2026-08-06T10:00:00Z',
    ...overrides,
  };
}

describe('STREAK_MILESTONES', () => {
  it('contains 7 milestone levels', () => {
    expect(STREAK_MILESTONES).toEqual([3, 7, 14, 21, 30, 60, 100]);
    expect(STREAK_MILESTONES).toHaveLength(7);
  });

  it('milestones are in ascending order', () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i]).toBeGreaterThan(STREAK_MILESTONES[i - 1]);
    }
  });
});

describe('getStreakMilestoneReward', () => {
  it('returns correct rewards for each milestone', () => {
    expect(getStreakMilestoneReward(3)).toBe(10);
    expect(getStreakMilestoneReward(7)).toBe(25);
    expect(getStreakMilestoneReward(14)).toBe(50);
    expect(getStreakMilestoneReward(21)).toBe(75);
    expect(getStreakMilestoneReward(30)).toBe(100);
    expect(getStreakMilestoneReward(60)).toBe(200);
    expect(getStreakMilestoneReward(100)).toBe(500);
  });

  it('returns 0 for unknown milestones', () => {
    expect(getStreakMilestoneReward(0)).toBe(0);
    expect(getStreakMilestoneReward(50)).toBe(0);
    expect(getStreakMilestoneReward(200)).toBe(0);
  });
});

describe('getCurrentStreak', () => {
  it('returns streak info from database', async () => {
    mockSelectOne.mockResolvedValue(makeStreakRow());

    const result = await getCurrentStreak('user-1');

    expect(result).toEqual({
      current: 5,
      longest: 10,
      lastActiveDate: '2026-08-06',
    });
  });

  it('returns zeros when no streak record exists', async () => {
    mockSelectOne.mockResolvedValue(null);

    const result = await getCurrentStreak('new-user');

    expect(result).toEqual({
      current: 0,
      longest: 0,
      lastActiveDate: null,
    });
  });

  it('handles null fields in existing record', async () => {
    mockSelectOne.mockResolvedValue({ user_id: 'user-1' });

    const result = await getCurrentStreak('user-1');

    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.lastActiveDate).toBeNull();
  });
});

describe('recordActivity', () => {
  it('creates new streak for first activity', async () => {
    mockSelectOne.mockResolvedValue(null);
    mockInsert.mockResolvedValue(makeStreakRow({
      current_streak: 1,
      longest_streak: 1,
      last_active_date: new Date().toISOString().slice(0, 10),
    }));

    const result = await recordActivity('user-1');

    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it('increments streak for consecutive day', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    mockSelectOne.mockResolvedValue(makeStreakRow({
      current_streak: 5,
      longest_streak: 10,
      last_active_date: yesterdayStr,
    }));
    mockUpdate.mockResolvedValue([makeStreakRow({
      current_streak: 6,
      longest_streak: 10,
    })]);

    const result = await recordActivity('user-1');

    expect(result.current).toBe(6);
    expect(result.longest).toBe(10);
  });

  it('resets streak when gap exceeds one day', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysStr = twoDaysAgo.toISOString().slice(0, 10);

    mockSelectOne.mockResolvedValue(makeStreakRow({
      current_streak: 5,
      longest_streak: 10,
      last_active_date: twoDaysStr,
    }));
    mockUpdate.mockResolvedValue([makeStreakRow({
      current_streak: 1,
      longest_streak: 10,
    })]);

    const result = await recordActivity('user-1');

    expect(result.current).toBe(1);
    expect(result.longest).toBe(10);
  });

  it('returns same streak when already active today', async () => {
    const today = new Date().toISOString().slice(0, 10);

    mockSelectOne.mockResolvedValue(makeStreakRow({
      current_streak: 5,
      longest_streak: 10,
      last_active_date: today,
    }));

    const result = await recordActivity('user-1');

    expect(result.current).toBe(5);
    expect(result.longest).toBe(10);
  });

  it('updates longest streak when current exceeds it', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    mockSelectOne.mockResolvedValue(makeStreakRow({
      current_streak: 9,
      longest_streak: 5,
      last_active_date: yesterdayStr,
    }));
    mockUpdate.mockResolvedValue([makeStreakRow({
      current_streak: 10,
      longest_streak: 10,
    })]);

    const result = await recordActivity('user-1');

    expect(result.current).toBe(10);
    expect(result.longest).toBe(10);
  });

  it('stores correct date for timezone-aware users', async () => {
    mockSelectOne.mockResolvedValue(null);
    mockInsert.mockResolvedValue({
      user_id: 'user-1',
      current_streak: 1,
      longest_streak: 1,
      last_active_date: '2026-08-06',
    });

    await recordActivity('user-1', 'Asia/Shanghai');

    expect(insert).toHaveBeenCalledWith(
      'streaks',
      expect.objectContaining({
        user_id: 'user-1',
        current_streak: 1,
      })
    );
  });
});

describe('checkStreakMilestones', () => {
  it('awards new milestone when streak reaches 3', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 3 }));
    mockSelectMany.mockResolvedValueOnce([]);
    mockInsert.mockResolvedValue(makeMilestoneRow({ milestone: 3 }));
    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 10, total_earned: 10, total_spent: 0 },
    });

    const result = await checkStreakMilestones('user-1');

    expect(result.newly_reached).toContain(3);
    expect(result.rewards_awarded).toEqual(
      expect.arrayContaining([expect.objectContaining({ milestone: 3, miles: 10 })])
    );
  });

  it('does not award already-reached milestones', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 7 }));
    mockSelectMany.mockResolvedValueOnce([makeMilestoneRow({ milestone: 3 })]);

    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 10, total_earned: 10, total_spent: 0 },
    });

    const result = await checkStreakMilestones('user-1');

    expect(result.newly_reached).not.toContain(3);
  });

  it('returns empty arrays when no milestones reached', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 1 }));
    mockSelectMany.mockResolvedValueOnce([]);

    const result = await checkStreakMilestones('user-1');

    expect(result.newly_reached).toHaveLength(0);
    expect(result.rewards_awarded).toHaveLength(0);
  });

  it('awards multiple milestones at once', async () => {
    const milestones = STREAK_MILESTONES.filter(m => m <= 7);
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 7 }));
    mockSelectMany.mockResolvedValueOnce([]);

    mockInsert.mockImplementation(async (table: string, data: any) => {
      return { id: 'ms-' + data.milestone, ...data };
    });
    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 100, total_earned: 100, total_spent: 0 },
    });

    const result = await checkStreakMilestones('user-1');

    for (const m of milestones) {
      expect(result.newly_reached).toContain(m);
    }
  });

  it('calls earnMiles with correct description and reference', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 3 }));
    mockSelectMany.mockResolvedValueOnce([]);
    mockInsert.mockResolvedValue(makeMilestoneRow({ milestone: 3 }));
    mockEarnMiles.mockResolvedValue({
      transaction: {} as any,
      balance: { balance: 10, total_earned: 10, total_spent: 0 },
    });

    await checkStreakMilestones('user-1');

    expect(earnMiles).toHaveBeenCalledWith(
      'user-1',
      10,
      'Streak milestone: 3 days',
      'streak-milestone-3'
    );
  });
});

describe('getUserMilestones', () => {
  it('returns milestones with reached status', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 5 }));
    mockSelectMany.mockResolvedValueOnce([makeMilestoneRow({ milestone: 3 })]);

    const result = await getUserMilestones('user-1');

    const m3 = result.find(m => m.days === 3);
    const m7 = result.find(m => m.days === 7);
    expect(m3?.reached).toBe(true);
    expect(m7?.reached).toBe(false);
  });

  it('marks milestones as reached even without explicit award record', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 14 }));
    mockSelectMany.mockResolvedValueOnce([]);

    const result = await getUserMilestones('user-1');

    const m7 = result.find(m => m.days === 7);
    expect(m7?.reached).toBe(true);
    expect(m7?.reward).toBe(25);
  });

  it('includes reward amounts for each milestone', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow({ current_streak: 0 }));
    mockSelectMany.mockResolvedValueOnce([]);

    const result = await getUserMilestones('user-1');

    for (const m of result) {
      expect(typeof m.reward).toBe('number');
      expect(m.reward).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns all 7 milestones', async () => {
    mockSelectOne.mockResolvedValueOnce(makeStreakRow());
    mockSelectMany.mockResolvedValueOnce([]);

    const result = await getUserMilestones('user-1');

    expect(result).toHaveLength(7);
  });
});