import * as db from './supabaseRest.js';
import { earnMiles } from './milesLedger.js';

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

export interface StreakMilestone {
  days: number;
  reward: number;
  reached: boolean;
}

const STREAKS_TABLE = 'streaks';

export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100] as const;

export function getStreakMilestoneReward(milestone: number): number {
  const rewards: Record<number, number> = {
    3: 10,
    7: 25,
    14: 50,
    21: 75,
    30: 100,
    60: 200,
    100: 500,
  };
  return rewards[milestone] || 0;
}

function getTodayLocal(userTimezone?: string): string {
  const now = new Date();
  if (userTimezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {}
  }
  return now.toISOString().slice(0, 10);
}

function getYesterdayLocal(userTimezone?: string): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (userTimezone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(yesterday);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {}
  }
  return yesterday.toISOString().slice(0, 10);
}

export async function getCurrentStreak(userId: string): Promise<StreakInfo> {
  const row = await db.selectOne(STREAKS_TABLE, {
    column: 'user_id',
    value: userId,
  });

  if (!row) {
    return { current: 0, longest: 0, lastActiveDate: null };
  }

  return {
    current: row.current_streak || 0,
    longest: row.longest_streak || 0,
    lastActiveDate: row.last_active_date || null,
  };
}

export async function recordActivity(
  userId: string,
  userTimezone?: string
): Promise<StreakInfo> {
  const today = getTodayLocal(userTimezone);
  const yesterday = getYesterdayLocal(userTimezone);

  const existing = await db.selectOne(STREAKS_TABLE, {
    column: 'user_id',
    value: userId,
  });

  let newCurrent: number;
  let newLongest: number;

  if (!existing) {
    newCurrent = 1;
    newLongest = 1;
  } else {
    const lastDate = existing.last_active_date;
    if (lastDate === today) {
      return {
        current: existing.current_streak || 0,
        longest: existing.longest_streak || 0,
        lastActiveDate: today,
      };
    }

    if (lastDate === yesterday) {
      newCurrent = (existing.current_streak || 0) + 1;
    } else {
      newCurrent = 1;
    }

    newLongest = Math.max(existing.longest_streak || 0, newCurrent);
  }

  const upsertData = {
    user_id: userId,
    current_streak: newCurrent,
    longest_streak: newLongest,
    last_active_date: today,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await db.update(
      STREAKS_TABLE,
      { column: 'user_id', value: userId },
      upsertData
    );
  } else {
    await db.insert(STREAKS_TABLE, upsertData);
  }

  return {
    current: newCurrent,
    longest: newLongest,
    lastActiveDate: today,
  };
}

export async function checkStreakMilestones(
  userId: string
): Promise<{ newly_reached: number[]; rewards_awarded: { milestone: number; miles: number }[] }> {
  const streak = await getCurrentStreak(userId);
  const newlyReached: number[] = [];
  const rewardsAwarded: { milestone: number; miles: number }[] = [];

  const milestonesRecord = await db.selectMany('streak_milestones_awarded', {
    where: [{ column: 'user_id', value: userId }],
  });

  const awardedMilestones = new Set(
    (milestonesRecord || []).map((r: any) => r.milestone)
  );

  for (const milestone of STREAK_MILESTONES) {
    if (streak.current >= milestone && !awardedMilestones.has(milestone)) {
      const reward = getStreakMilestoneReward(milestone);
      newlyReached.push(milestone);

      if (reward > 0) {
        await earnMiles(
          userId,
          reward,
          `Streak milestone: ${milestone} days`,
          `streak-milestone-${milestone}`
        );
        rewardsAwarded.push({ milestone, miles: reward });
      }

      await db.insert('streak_milestones_awarded', {
        user_id: userId,
        milestone,
        awarded_at: new Date().toISOString(),
      });
    }
  }

  return { newly_reached: newlyReached, rewards_awarded: rewardsAwarded };
}

export async function getUserMilestones(
  userId: string
): Promise<StreakMilestone[]> {
  const streak = await getCurrentStreak(userId);

  const milestonesRecord = await db.selectMany('streak_milestones_awarded', {
    where: [{ column: 'user_id', value: userId }],
  });

  const awardedSet = new Set(
    (milestonesRecord || []).map((r: any) => r.milestone)
  );

  return STREAK_MILESTONES.map((days) => ({
    days,
    reward: getStreakMilestoneReward(days),
    reached: awardedSet.has(days) || streak.current >= days,
  }));
}