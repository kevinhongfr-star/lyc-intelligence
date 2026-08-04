/**
 * api/_lib/revenueHandler.ts — Admin revenue analytics (S6-T06)
 *
 * Route: GET /api/admin/revenue
 *
 * Aggregates commerce data from Supabase for the admin revenue dashboard:
 *   - Credit pack purchases (count + estimated revenue, grouped by month)
 *   - Active subscriptions (MRR / ARR estimate at $29/mo Council)
 *   - Tier distribution across all profiles
 *   - Credit utilization (total spent / total earned)
 *   - Churn (cancelled subscriptions / total ever subscribed)
 *
 * Auth: super_admin or lyc_admin only (enforced by the router before dispatch).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

// Pack credits → price (mirrors stripeHandler.getCreditPackCatalog).
const PACK_PRICE_BY_CREDITS: Record<number, number> = {
  100: 9.99,
  500: 39.99,
  1500: 99.99,
  5000: 179.99,
};

const COUNCIL_MONTHLY_PRICE = 29;

interface MonthlyRevenue {
  month: string; // YYYY-MM
  packRevenue: number;
  packCount: number;
  subscriptionRevenue: number; // estimated MRR at month
}

interface TierCount {
  tier: string;
  count: number;
}

interface RevenueSummary {
  totals: {
    packRevenue: number;
    packCount: number;
    activeSubscribers: number;
    mrr: number;
    arr: number;
    churnedSubscribers: number;
    churnRate: number;
    creditsEarned: number;
    creditsSpent: number;
    creditUtilization: number;
  };
  monthly: MonthlyRevenue[];
  tierDistribution: TierCount[];
  recentPacks: Array<{
    credits: number;
    price: number;
    created_at: string;
    description: string;
  }>;
  generatedAt: string;
}

export async function handleRevenue(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Credit pack purchase transactions.
    const packTx = await db.selectMany(
      'credit_transactions',
      {
        select: 'id,amount,description,stripe_session_id,created_at',
        where: [
          { column: 'stripe_session_id', value: null, op: 'not.is' },
        ],
        orderBy: { column: 'created_at', ascending: false },
        limit: 1000,
      },
      15000,
    );

    // Filter to actual pack purchases (description starts with the pack prefix).
    const packPurchases = (packTx || []).filter(
      (t: any) =>
        t.stripe_session_id &&
        typeof t.description === 'string' &&
        t.description.startsWith('Credit pack purchase'),
    );

    // 2. Profile subscription + tier data.
    const profiles = await db.selectMany(
      'profiles',
      {
        select: 'id,tier,stripe_subscription_status',
        limit: 100000,
      },
      20000,
    );

    // 3. Credit ledger totals (utilization).
    const creditsRows = await db.selectMany(
      'credits',
      {
        select: 'total_earned,total_spent',
        limit: 100000,
      },
      20000,
    );

    // ── Aggregate ──
    let packRevenue = 0;
    let packCount = 0;
    const monthlyMap: Record<string, MonthlyRevenue> = {};
    const recentPacks: RevenueSummary['recentPacks'] = [];

    for (const t of packPurchases) {
      const credits = Number(t.amount) || 0;
      const price = PACK_PRICE_BY_CREDITS[credits] ?? 0;
      packRevenue += price;
      packCount += 1;

      const month = String(t.created_at || '').slice(0, 7); // YYYY-MM
      if (month) {
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, packRevenue: 0, packCount: 0, subscriptionRevenue: 0 };
        }
        monthlyMap[month].packRevenue += price;
        monthlyMap[month].packCount += 1;
      }

      if (recentPacks.length < 10) {
        recentPacks.push({ credits, price, created_at: t.created_at, description: t.description });
      }
    }

    // Tier distribution + subscription counts.
    const tierCounts: Record<string, number> = {};
    let activeSubscribers = 0;
    let churnedSubscribers = 0;
    let everSubscribed = 0;

    for (const p of profiles || []) {
      const tier = (p as any).tier || 'member';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      const status = (p as any).stripe_subscription_status;
      if (status === 'active' || status === 'trialing') {
        activeSubscribers += 1;
        everSubscribed += 1;
      } else if (status === 'canceled') {
        churnedSubscribers += 1;
        everSubscribed += 1;
      }
    }

    // Credit utilization.
    let creditsEarned = 0;
    let creditsSpent = 0;
    for (const c of creditsRows || []) {
      creditsEarned += Number((c as any).total_earned) || 0;
      creditsSpent += Number((c as any).total_spent) || 0;
    }

    // Spread active subscribers across months for the subscription revenue line.
    // We don't have per-month subscription history, so we attribute current MRR
    // to the current month only — pack revenue is the historical trend.
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (activeSubscribers > 0) {
      if (!monthlyMap[currentMonth]) {
        monthlyMap[currentMonth] = { month: currentMonth, packRevenue: 0, packCount: 0, subscriptionRevenue: 0 };
      }
      monthlyMap[currentMonth].subscriptionRevenue = activeSubscribers * COUNCIL_MONTHLY_PRICE;
    }

    const monthly = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
    const mrr = activeSubscribers * COUNCIL_MONTHLY_PRICE;
    const arr = mrr * 12;
    const churnRate = everSubscribed > 0 ? churnedSubscribers / everSubscribed : 0;
    const creditUtilization = creditsEarned > 0 ? creditsSpent / creditsEarned : 0;

    const summary: RevenueSummary = {
      totals: {
        packRevenue: Number(packRevenue.toFixed(2)),
        packCount,
        activeSubscribers,
        mrr,
        arr,
        churnedSubscribers,
        churnRate: Number(churnRate.toFixed(4)),
        creditsEarned,
        creditsSpent,
        creditUtilization: Number(creditUtilization.toFixed(4)),
      },
      monthly,
      tierDistribution: Object.entries(tierCounts)
        .map(([tier, count]) => ({ tier, count }))
        .sort((a, b) => b.count - a.count),
      recentPacks,
      generatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (err: any) {
    console.error('[revenueHandler] error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to aggregate revenue data',
      details: err?.message,
    });
  }
}
