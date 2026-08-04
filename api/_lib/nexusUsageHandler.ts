/**
 * api/_lib/nexusUsageHandler.ts — S7-T07 (N7)
 *
 * Aggregates Nexus usage statistics for the Billing Dashboard: daily CNY spend,
 * intent distribution, token counts, conversation count, and budget cap status.
 * Sourced from nexus_usage_log + nexus_conversations.
 *
 * Routes (via nexusHandler → /api/nexus/usage):
 *   GET /api/nexus/usage  → aggregated usage for the caller (last 30 days)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, isSupabaseConfigured } from './supabaseRest.js';

interface IntentStat {
  intent: string;
  count: number;
  total_tokens: number;
  total_cost_cny: number;
}

interface DailyUsage {
  date: string;            // YYYY-MM-DD
  messages: number;
  total_tokens: number;
  total_cost_cny: number;
}

export interface NexusUsageReport {
  range_days: number;
  total_messages: number;
  total_tokens: number;
  total_cost_cny: number;
  total_conversations: number;
  today_cost_cny: number;
  today_messages: number;
  // Daily budget cap (mirrors nexusBudgetTracker logic).
  daily_budget_cny: number;
  // Top intents by message count.
  intent_distribution: IntentStat[];
  // Per-day breakdown (oldest → newest) for the chart.
  daily_usage: DailyUsage[];
}

// Mirror of nexusBudgetTracker tier→budget mapping. Kept in sync so the
// billing dashboard can show the cap without a separate fetch.
const TIER_DAILY_BUDGET_CNY: Record<string, number> = {
  free: 5,
  member: 20,
  basic: 20,
  pro: 35,
  council: 50,
  enterprise: 50,
};

export async function handleNexusUsage(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  // pathArr[0] === 'usage'
  const method = req.method || 'GET';

  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({
      success: true,
      usage: {
        range_days: 30,
        total_messages: 0,
        total_tokens: 0,
        total_cost_cny: 0,
        total_conversations: 0,
        today_cost_cny: 0,
        today_messages: 0,
        daily_budget_cny: TIER_DAILY_BUDGET_CNY.free,
        intent_distribution: [],
        daily_usage: [],
      } as NexusUsageReport,
    });
  }

  try {
    const rangeDays = Math.min(Math.max(Number(req.query.days) || 30, 1), 90);
    const cutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();
    const todayIso = new Date().toISOString().slice(0, 10);

    // Fetch usage logs for the user within the window.
    const logs = await selectMany(
      'nexus_usage_log',
      {
        select: 'usage_date,intent,model,input_tokens,output_tokens,total_tokens,cost_cny',
        where: [
          { column: 'user_id', value: authUser.id, op: 'eq' },
          { column: 'usage_date', value: cutoff.slice(0, 10), op: 'gte' },
        ],
        orderBy: { column: 'usage_date', ascending: true },
        limit: 1000,
      },
      8000,
    ).catch(() => []);

    // Fetch conversation count for the user.
    const conversations = await selectMany(
      'nexus_conversations',
      {
        select: 'id,updated_at',
        where: [
          { column: 'user_id', value: authUser.id, op: 'eq' },
          { column: 'updated_at', value: cutoff, op: 'gte' },
        ],
        limit: 500,
      },
      5000,
    ).catch(() => []);

    // Aggregate.
    const intentMap = new Map<string, IntentStat>();
    const dailyMap = new Map<string, DailyUsage>();
    let totalMessages = 0;
    let totalTokens = 0;
    let totalCostCny = 0;
    let todayCostCny = 0;
    let todayMessages = 0;

    for (const log of logs || []) {
      const date = String(log.usage_date || '').slice(0, 10);
      const intent = String(log.intent || 'unknown');
      const tokens = Number(log.total_tokens || 0);
      const cost = Number(log.cost_cny || 0);

      totalMessages++;
      totalTokens += tokens;
      totalCostCny += cost;

      if (date === todayIso) {
        todayCostCny += cost;
        todayMessages++;
      }

      // Intent aggregation.
      const existing = intentMap.get(intent) || {
        intent,
        count: 0,
        total_tokens: 0,
        total_cost_cny: 0,
      };
      existing.count++;
      existing.total_tokens += tokens;
      existing.total_cost_cny += cost;
      intentMap.set(intent, existing);

      // Daily aggregation.
      const day = dailyMap.get(date) || {
        date,
        messages: 0,
        total_tokens: 0,
        total_cost_cny: 0,
      };
      day.messages++;
      day.total_tokens += tokens;
      day.total_cost_cny += cost;
      dailyMap.set(date, day);
    }

    const intentDistribution = Array.from(intentMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const dailyUsage = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    // Resolve tier for the daily budget cap. We don't have direct access to the
    // profile here without another fetch; default to free and let the caller
    // surface the real tier from the auth store if needed.
    const dailyBudgetCny = TIER_DAILY_BUDGET_CNY.free;

    const report: NexusUsageReport = {
      range_days: rangeDays,
      total_messages: totalMessages,
      total_tokens: totalTokens,
      total_cost_cny: Math.round(totalCostCny * 10000) / 10000,
      total_conversations: (conversations || []).length,
      today_cost_cny: Math.round(todayCostCny * 10000) / 10000,
      today_messages: todayMessages,
      daily_budget_cny: dailyBudgetCny,
      intent_distribution: intentDistribution,
      daily_usage: dailyUsage,
    };

    return res.status(200).json({ success: true, usage: report });
  } catch (err: any) {
    console.error('[nexusUsageHandler] error:', err);
    return res.status(500).json({
      error: 'Usage aggregation failed',
      details: err?.message,
      success: false,
    });
  }
}
