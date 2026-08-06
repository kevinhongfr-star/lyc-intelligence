import * as db from './supabaseRest.js';
import { getTierConfig, type TierKey } from './tierConfig.js';

const FREE_TIER: TierKey = 'explorer';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MONTH = 30 * MS_PER_DAY;

interface UsageRecord {
  id?: string;
  user_id: string;
  messages_used: number;
  assessments_used: number;
  period_start: string;
  period_end: string;
  created_at?: string;
  updated_at?: string;
}

function computePeriodStart(type: 'daily' | 'monthly'): string {
  const now = new Date();
  if (type === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.toISOString();
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return start.toISOString();
}

function computePeriodEnd(type: 'daily' | 'monthly'): string {
  const now = new Date();
  if (type === 'daily') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return end.toISOString();
  }
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return end.toISOString();
}

async function getOrCreateUsageRecord(userId: string): Promise<UsageRecord> {
  const dailyStart = computePeriodStart('daily');
  const monthlyStart = computePeriodStart('monthly');

  let record = await db.selectOne('usage_tracking', {
    column: 'user_id',
    value: userId,
    select: '*',
  });

  if (!record) {
    const newRecord: UsageRecord = {
      user_id: userId,
      messages_used: 0,
      assessments_used: 0,
      period_start: dailyStart,
      period_end: computePeriodEnd('daily'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    record = await db.insert('usage_tracking', newRecord);
    return record;
  }

  const now = Date.now();
  const periodEnd = new Date(record.period_end).getTime();
  if (now > periodEnd) {
    const newDailyStart = computePeriodStart('daily');
    const newDailyEnd = computePeriodEnd('daily');
    record = await db.update('usage_tracking', { column: 'id', value: record.id }, {
      messages_used: 0,
      period_start: newDailyStart,
      period_end: newDailyEnd,
      updated_at: new Date().toISOString(),
    }).then((rows: any[]) => rows[0] || record);
  }

  return record;
}

export async function checkMessageLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const record = await getOrCreateUsageRecord(userId);
  const config = getTierConfig(FREE_TIER);
  const limit = config.messageLimit;
  const used = record.messages_used || 0;
  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    resetAt: record.period_end,
  };
}

export async function checkAssessmentLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const record = await getOrCreateUsageRecord(userId);
  const config = getTierConfig(FREE_TIER);
  const limit = config.assessmentLimit;
  const used = record.assessments_used || 0;
  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  const monthlyEnd = computePeriodEnd('monthly');
  return {
    allowed,
    remaining,
    resetAt: monthlyEnd,
  };
}

export async function recordMessageUsage(userId: string): Promise<{ used: number; remaining: number }> {
  const record = await getOrCreateUsageRecord(userId);
  const config = getTierConfig(FREE_TIER);
  const newUsed = (record.messages_used || 0) + 1;

  const updated = await db.update('usage_tracking', { column: 'id', value: record.id }, {
    messages_used: newUsed,
    updated_at: new Date().toISOString(),
  });

  const updatedRecord = Array.isArray(updated) ? updated[0] : updated;
  const limit = config.messageLimit;
  return {
    used: newUsed,
    remaining: Math.max(0, limit - newUsed),
  };
}

export async function recordAssessmentUsage(userId: string): Promise<{ used: number; remaining: number }> {
  const record = await getOrCreateUsageRecord(userId);
  const config = getTierConfig(FREE_TIER);
  const newUsed = (record.assessments_used || 0) + 1;

  const updated = await db.update('usage_tracking', { column: 'id', value: record.id }, {
    assessments_used: newUsed,
    updated_at: new Date().toISOString(),
  });

  const updatedRecord = Array.isArray(updated) ? updated[0] : updated;
  const limit = config.assessmentLimit;
  return {
    used: newUsed,
    remaining: Math.max(0, limit - newUsed),
  };
}

export async function getUsageStats(userId: string): Promise<{
  messages: { used: number; limit: number; remaining: number; resetAt: string };
  assessments: { used: number; limit: number; remaining: number; resetAt: string };
}> {
  const record = await getOrCreateUsageRecord(userId);
  const config = getTierConfig(FREE_TIER);

  const messagesUsed = record.messages_used || 0;
  const assessmentsUsed = record.assessments_used || 0;
  const messagesLimit = config.messageLimit;
  const assessmentsLimit = config.assessmentLimit;

  return {
    messages: {
      used: messagesUsed,
      limit: messagesLimit,
      remaining: Math.max(0, messagesLimit - messagesUsed),
      resetAt: record.period_end,
    },
    assessments: {
      used: assessmentsUsed,
      limit: assessmentsLimit,
      remaining: Math.max(0, assessmentsLimit - assessmentsUsed),
      resetAt: computePeriodEnd('monthly'),
    },
  };
}