/**
 * api/_lib/nexusBudgetTracker.ts — S7-T01 (N1)
 *
 * Per-user daily token/cost tracking with a hard daily budget cap.
 * Spec: ¥50/day per user (N1 — "Token counting + cost tracking, daily budget cap (¥50/day)").
 *
 * Pricing model (DeepSeek public list prices, Aug 2026):
 *   - deepseek-chat (V3 / Flash): input $0.27 / 1M tokens, output $1.10 / 1M tokens
 *   - USD→CNY at 7.2 (conservative)
 * Effective CNY per 1K tokens:
 *   - input:  0.27 * 7.2 / 1000 = 0.001944 CNY/1K
 *   - output: 1.10 * 7.2 / 1000 = 0.007920 CNY/1K
 */

import { selectMany, insert } from './supabaseRest.js';

// Daily cap in CNY. Override via env for testing or per-tier adjustments.
export const DEFAULT_DAILY_BUDGET_CNY = Number(process.env.NEXUS_DAILY_BUDGET_CNY || 50);

// Pricing (CNY per 1 token).
const PRICE_INPUT_CNY_PER_TOKEN = 0.27 * 7.2 / 1_000_000;
const PRICE_OUTPUT_CNY_PER_TOKEN = 1.10 * 7.2 / 1_000_000;

export interface UsageRecord {
  user_id: string;
  intent?: string;
  model?: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_cny: number;
}

export interface BudgetStatus {
  spent_cny: number;
  budget_cny: number;
  remaining_cny: number;
  utilization_pct: number; // 0..100
  exceeded: boolean;
}

/**
 * Compute cost in CNY for a token usage record.
 */
export function computeCostCNY(inputTokens: number, outputTokens: number): number {
  const cost =
    inputTokens * PRICE_INPUT_CNY_PER_TOKEN + outputTokens * PRICE_OUTPUT_CNY_PER_TOKEN;
  // Round to 6 decimal places (matches DB column precision).
  return Math.round(cost * 1_000_000) / 1_000_000;
}

/**
 * Get the daily budget for a given user tier. Council/Enterprise users get a higher cap.
 */
export function getDailyBudgetForTier(tier: string): number {
  const t = (tier || 'free').toLowerCase();
  if (t === 'council' || t === 'enterprise') {
    return DEFAULT_DAILY_BUDGET_CNY * 4; // ¥200/day for premium tiers
  }
  if (t === 'pro' || t === 'member') {
    return DEFAULT_DAILY_BUDGET_CNY * 2; // ¥100/day for paid tiers
  }
  return DEFAULT_DAILY_BUDGET_CNY; // ¥50/day for free/intro
}

/**
 * Fetch today's spend for a user from nexus_usage_log.
 * Falls back to 0 on error (fail-open: don't block users on DB issues).
 *
 * Supabase REST has no native SUM, so we fetch today's rows (capped at 1000)
 * and sum client-side. Per-user daily row count stays well below this in practice.
 */
export async function getTodaySpend(userId: string): Promise<number> {
  try {
    const rows = await selectMany(
      'nexus_usage_log',
      {
        select: 'cost_cny',
        where: [
          { column: 'user_id', value: userId },
          { column: 'usage_date', value: new Date().toISOString().slice(0, 10) },
        ],
        limit: 1000,
      },
      5000,
    );
    const total = (rows || []).reduce((sum, r) => sum + Number(r.cost_cny || 0), 0);
    return Math.round(total * 1_000_000) / 1_000_000;
  } catch (e) {
    console.warn('[nexusBudgetTracker] getTodaySpend failed (fail-open):', e);
    return 0;
  }
}

/**
 * Check whether a user is within their daily budget.
 */
export async function checkBudget(
  userId: string,
  tier: string,
): Promise<BudgetStatus> {
  const budget = getDailyBudgetForTier(tier);
  const spent = await getTodaySpend(userId);
  const remaining = Math.max(0, budget - spent);
  const utilization_pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  return {
    spent_cny: spent,
    budget_cny: budget,
    remaining_cny: remaining,
    utilization_pct,
    exceeded: spent >= budget,
  };
}

/**
 * Record a usage event. Best-effort — failures are logged but do not block the response.
 */
export async function recordUsage(record: UsageRecord): Promise<void> {
  try {
    await insert('nexus_usage_log', {
      user_id: record.user_id,
      usage_date: new Date().toISOString().slice(0, 10),
      intent: record.intent || null,
      model: record.model || null,
      input_tokens: record.input_tokens,
      output_tokens: record.output_tokens,
      total_tokens: record.total_tokens,
      cost_cny: record.cost_cny,
    });
  } catch (e) {
    console.warn('[nexusBudgetTracker] recordUsage failed (non-blocking):', e);
  }
}

/**
 * Convenience: check budget, and if exceeded return an HTTP 429 response.
 * Returns true if the caller should abort (budget exceeded), false to continue.
 */
export async function enforceBudget(
  userId: string,
  tier: string,
  res: { status: (code: number) => { json: (body: any) => void } },
): Promise<boolean> {
  const status = await checkBudget(userId, tier);
  if (status.exceeded) {
    res.status(429).json({
      error: 'Daily budget exceeded',
      success: false,
      budget: status,
      message: `You have reached your daily Nexus usage cap (¥${status.budget_cny.toFixed(2)}). Try again tomorrow or upgrade your plan.`,
    });
    return true;
  }
  return false;
}
