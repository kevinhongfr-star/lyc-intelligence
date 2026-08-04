/**
 * RevenueAnalytics — Admin revenue dashboard (S6-T06)
 *
 * Fetches aggregated commerce data from GET /api/admin/revenue and renders
 * KPI cards (MRR, ARR, pack revenue, active subscribers, churn, utilization),
 * a monthly revenue chart, tier distribution, and recent credit-pack purchases.
 *
 * Used both as a standalone admin page (/app/revenue) and as a tab inside
 * AnalyticsPage, so it renders as a content panel (no full-page chrome).
 */
import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Repeat, Activity, AlertCircle, Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { authFetch } from '@/utils/authFetch';

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
  monthly: Array<{ month: string; packRevenue: number; packCount: number; subscriptionRevenue: number }>;
  tierDistribution: Array<{ tier: string; count: number }>;
  recentPacks: Array<{ credits: number; price: number; created_at: string; description: string }>;
  generatedAt: string;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function RevenueAnalytics() {
  const [data, setData] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await authFetch('/api/admin/revenue');
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          throw new Error(json.error || `Request failed (${res.status})`);
        }
        setData(json.data as RevenueSummary);
      } catch (e: any) {
        if (!cancelled) {
          console.error('[RevenueAnalytics] fetch error:', e);
          setError(e?.message || 'Unable to load revenue data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-fuchsia" />
        <span className="ml-2 text-sm text-text-muted">Loading revenue data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-4">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const { totals, monthly, tierDistribution, recentPacks } = data;
  const chartData = monthly.map(m => ({
    month: fmtMonth(m.month),
    'Credit Packs': Number(m.packRevenue.toFixed(2)),
    Subscriptions: Number(m.subscriptionRevenue.toFixed(2)),
  }));
  const maxTierCount = Math.max(...tierDistribution.map(t => t.count), 1);

  const kpis = [
    { label: 'MRR', value: fmtMoney(totals.mrr), icon: DollarSign, hint: `${totals.activeSubscribers} active Council` },
    { label: 'ARR (est.)', value: fmtMoney(totals.arr), icon: TrendingUp, hint: 'MRR × 12' },
    { label: 'Pack Revenue', value: fmtMoney(totals.packRevenue), icon: DollarSign, hint: `${totals.packCount} packs sold` },
    { label: 'Active Subscribers', value: String(totals.activeSubscribers), icon: Users, hint: 'Council members' },
    { label: 'Churn Rate', value: fmtPct(totals.churnRate), icon: Repeat, hint: `${totals.churnedSubscribers} churned` },
    { label: 'Credit Utilization', value: fmtPct(totals.creditUtilization), icon: Activity, hint: 'spent / earned' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-fuchsia" /> Revenue Analytics
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Commerce overview — credit pack sales, Council subscriptions, and credit utilization.
          {data.generatedAt && (
            <span className="ml-1 text-xs">Generated {new Date(data.generatedAt).toLocaleString()}.</span>
          )}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white border border-border p-4">
              <div className="flex items-center gap-1.5 text-xs text-text-muted uppercase tracking-wide">
                <Icon className="w-3.5 h-3.5" /> {k.label}
              </div>
              <div className="text-2xl font-bold text-text-primary mt-1">{k.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{k.hint}</div>
            </div>
          );
        })}
      </div>

      {/* Monthly revenue chart */}
      <div className="bg-white border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Revenue (USD)</h3>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-muted">No revenue data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v: any) => fmtMoney(Number(v))}
                contentStyle={{ fontSize: 12, borderRadius: 0 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Credit Packs" stackId="r" fill="#C108AB" />
              <Bar dataKey="Subscriptions" stackId="r" fill="#1A1A2E" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier distribution */}
        <div className="bg-white border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Tier Distribution</h3>
          {tierDistribution.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">No profiles yet.</div>
          ) : (
            <div className="space-y-3">
              {tierDistribution.map(t => (
                <div key={t.tier}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary capitalize">{t.tier || 'unknown'}</span>
                    <span className="font-medium text-text-primary">{t.count}</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary">
                    <div
                      className="h-full bg-fuchsia"
                      style={{ width: `${(t.count / maxTierCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent pack purchases */}
        <div className="bg-white border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Credit Pack Purchases</h3>
          {recentPacks.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">No pack purchases yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {recentPacks.map((p, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-primary">+{p.credits} credits</div>
                    <div className="text-xs text-text-muted">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">{fmtMoney(p.price)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted bg-bg-warm p-3">
        <TrendingDown className="w-3.5 h-3.5" />
        Pack revenue is estimated from credit-pack transaction logs at catalog prices. Subscription MRR reflects current active Council members at $29/mo.
      </div>
    </div>
  );
}
