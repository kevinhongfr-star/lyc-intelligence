import * as db from './supabaseRest.js';
import { earnMiles } from './milesLedger.js';

export type EarningEventType =
  | 'login_streak'
  | 'assessment_completion'
  | 'deliverable_generation'
  | 'mock_interview'
  | 'pdf_export'
  | 'referral_signup'
  | 'seven_day_bonus'
  | 'thirty_day_bonus';

export interface EarningEventConfig {
  miles: number;
  cooldownMinutes: number;
  dailyCap?: number;
  description: string;
}

export const EARNING_EVENT_CONFIG: Record<EarningEventType, EarningEventConfig> = {
  login_streak: {
    miles: 5,
    cooldownMinutes: 1440,
    dailyCap: 1,
    description: 'Daily login streak bonus',
  },
  assessment_completion: {
    miles: 20,
    cooldownMinutes: 60,
    dailyCap: 5,
    description: 'Complete an assessment',
  },
  deliverable_generation: {
    miles: 15,
    cooldownMinutes: 30,
    dailyCap: 10,
    description: 'Generate a deliverable',
  },
  mock_interview: {
    miles: 10,
    cooldownMinutes: 120,
    dailyCap: 5,
    description: 'Complete a mock interview',
  },
  pdf_export: {
    miles: 3,
    cooldownMinutes: 10,
    dailyCap: 20,
    description: 'Export as PDF',
  },
  referral_signup: {
    miles: 50,
    cooldownMinutes: 0,
    dailyCap: 10,
    description: 'Refer a friend who signs up',
  },
  seven_day_bonus: {
    miles: 25,
    cooldownMinutes: 10080,
    description: '7-day streak milestone bonus',
  },
  thirty_day_bonus: {
    miles: 100,
    cooldownMinutes: 43200,
    description: '30-day streak milestone bonus',
  },
};

const EARNING_EVENTS_TABLE = 'earning_events';

export async function checkFrequencyCap(
  userId: string,
  eventType: EarningEventType
): Promise<{ allowed: boolean; remaining: number; resetAt: string | null }> {
  const config = EARNING_EVENT_CONFIG[eventType];
  const now = Date.now();
  const cooldownMs = config.cooldownMinutes * 60 * 1000;

  const recentEvents = await db.selectMany(EARNING_EVENTS_TABLE, {
    where: [
      { column: 'user_id', value: userId },
      { column: 'event_type', value: eventType },
    ],
    orderBy: { column: 'created_at', ascending: false },
    limit: 50,
  });

  if (!recentEvents || recentEvents.length === 0) {
    return { allowed: true, remaining: config.dailyCap || 1, resetAt: null };
  }

  const nowDate = new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();

  const recent = recentEvents
    .filter((e: any) => {
      const createdAt = new Date(e.created_at).getTime();
      return now - createdAt < cooldownMs;
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (recent.length > 0 && cooldownMs > 0) {
    const lastEvent = recent[0];
    const lastTime = new Date(lastEvent.created_at).getTime();
    const nextAllowed = lastTime + cooldownMs;
    if (now < nextAllowed) {
      const resetAt = new Date(nextAllowed).toISOString();
      return { allowed: false, remaining: 0, resetAt };
    }
  }

  if (config.dailyCap !== undefined) {
    const todayCount = recentEvents.filter((e: any) => {
      const createdAt = new Date(e.created_at).getTime();
      return createdAt >= todayStart;
    }).length;

    if (todayCount >= config.dailyCap) {
      const nextDay = new Date(nowDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      return { allowed: false, remaining: 0, resetAt: nextDay.toISOString() };
    }

    return { allowed: true, remaining: config.dailyCap - todayCount, resetAt: null };
  }

  return { allowed: true, remaining: 1, resetAt: null };
}

export async function processEarningEvent(
  userId: string,
  eventType: EarningEventType,
  streakDays?: number
): Promise<{ miles_awarded: number; event_recorded: boolean }> {
  const config = EARNING_EVENT_CONFIG[eventType];

  const capCheck = await checkFrequencyCap(userId, eventType);
  if (!capCheck.allowed) {
    return { miles_awarded: 0, event_recorded: false };
  }

  let milesToAward = config.miles;

  if (eventType === 'login_streak' && streakDays !== undefined) {
    milesToAward = getLoginStreakMiles(streakDays);
  }

  await db.insert(EARNING_EVENTS_TABLE, {
    user_id: userId,
    event_type: eventType,
    miles_awarded: milesToAward,
    created_at: new Date().toISOString(),
  });

  if (milesToAward > 0) {
    await earnMiles(userId, milesToAward, config.description, `earn-${eventType}`);
  }

  return { miles_awarded: milesToAward, event_recorded: true };
}

export async function getUserEarningProgress(
  userId: string
): Promise<Record<EarningEventType, { total_earned: number; count: number; last_earned_at: string | null }>> {
  const result: Record<string, { total_earned: number; count: number; last_earned_at: string | null }> = {};

  for (const eventType of Object.keys(EARNING_EVENT_CONFIG) as EarningEventType[]) {
    result[eventType] = { total_earned: 0, count: 0, last_earned_at: null };
  }

  const events = await db.selectMany(EARNING_EVENTS_TABLE, {
    where: [{ column: 'user_id', value: userId }],
    orderBy: { column: 'created_at', ascending: false },
    limit: 1000,
  });

  if (!events || events.length === 0) {
    return result as any;
  }

  for (const event of events) {
    const et = event.event_type as EarningEventType;
    if (result[et]) {
      result[et].total_earned += event.miles_awarded || 0;
      result[et].count += 1;
      if (!result[et].last_earned_at) {
        result[et].last_earned_at = event.created_at;
      }
    }
  }

  return result as any;
}

export function getLoginStreakMiles(streakDays: number): number {
  if (streakDays <= 0) return 0;
  if (streakDays >= 30) return 50;
  if (streakDays >= 14) return 25;
  if (streakDays >= 7) return 15;
  if (streakDays >= 3) return 10;
  return 5;
}