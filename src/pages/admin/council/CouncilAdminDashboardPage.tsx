/**
 * CouncilAdminDashboardPage — Admin overview for The Council.
 * KPIs, member growth bar chart, recent signups, revenue by tier, quick links.
 * Self-contained with mock data; wire to /api/admin/council/* for persistence.
 */
import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  CalendarCheck,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Kpi {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

interface GrowthPoint {
  month: string;
  members: number;
}

interface Signup {
  id: string;
  name: string;
  email: string;
  tier: TierId;
  date: string;
}

interface RevenueTier {
  id: TierId;
  name: string;
  members: number;
  revenue: number;
  price: number;
}

interface QuickLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

type TierId = 'founding' | 'individual' | 'corporate' | 'pe-partner';

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const KPIS: Kpi[] = [
  {
    label: 'Total Members',
    value: '1,284',
    delta: '+8.2%',
    trend: 'up',
    icon: Users,
  },
  {
    label: 'Active Today',
    value: '347',
    delta: '+12.4%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    label: 'Monthly Revenue',
    value: '¥418,200',
    delta: '+5.1%',
    trend: 'up',
    icon: DollarSign,
  },
  {
    label: 'Event Attendance Rate',
    value: '78%',
    delta: '-2.3%',
    trend: 'down',
    icon: CalendarCheck,
  },
];

const GROWTH: GrowthPoint[] = [
  { month: 'Jan', members: 820 },
  { month: 'Feb', members: 902 },
  { month: 'Mar', members: 981 },
  { month: 'Apr', members: 1024 },
  { month: 'May', members: 1098 },
  { month: 'Jun', members: 1176 },
  { month: 'Jul', members: 1284 },
];

const SIGNUPS: Signup[] = [
  {
    id: 'su_001',
    name: 'Elena Rodriguez',
    email: 'elena.r@horizoncap.com',
    tier: 'corporate',
    date: '2026-07-15T09:24:00Z',
  },
  {
    id: 'su_002',
    name: 'Marcus Wei',
    email: 'm.wei@brightwave.io',
    tier: 'individual',
    date: '2026-07-15T07:11:00Z',
  },
  {
    id: 'su_003',
    name: 'Priya Nair',
    email: 'priya@summitpe.com',
    tier: 'pe-partner',
    date: '2026-07-14T18:42:00Z',
  },
  {
    id: 'su_004',
    name: 'Tomas Berg',
    email: 'tomas.b@northstar.co',
    tier: 'founding',
    date: '2026-07-14T15:05:00Z',
  },
  {
    id: 'su_005',
    name: 'Aisha Khan',
    email: 'aisha.k@vertexventures.com',
    tier: 'individual',
    date: '2026-07-14T11:38:00Z',
  },
];

const REVENUE_TIERS: RevenueTier[] = [
  { id: 'founding', name: 'Founding', members: 18, revenue: 50400, price: 2800 },
  { id: 'individual', name: 'Individual', members: 842, revenue: 3199600, price: 3800 },
  { id: 'corporate', name: 'Corporate', members: 312, revenue: 3744000, price: 12000 },
  { id: 'pe-partner', name: 'PE Partner', members: 112, revenue: 2800000, price: 25000 },
];

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Event Manager',
    description: 'Create, edit, and track Council events and attendance.',
    icon: CalendarDays,
    href: '/admin/council/events',
  },
  {
    title: 'Coaching Manager',
    description: 'Schedule coaching sessions and assign coaches.',
    icon: GraduationCap,
    href: '/admin/council/coaching',
  },
  {
    title: 'Applications',
    description: 'Review pending membership applications and assign tiers.',
    icon: ClipboardList,
    href: '/admin/council/applications',
  },
];

const TIER_LABEL: Record<TierId, string> = {
  founding: 'Founding',
  individual: 'Individual',
  corporate: 'Corporate',
  'pe-partner': 'PE Partner',
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatCurrency(cny: number): string {
  return '¥' + cny.toLocaleString('en-US');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tierBadgeVariant(tier: TierId): 'fuchsia' | 'default' | 'success' | 'warning' {
  switch (tier) {
    case 'founding':
      return 'fuchsia';
    case 'pe-partner':
      return 'warning';
    case 'corporate':
      return 'success';
    default:
      return 'default';
  }
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CouncilAdminDashboardPage() {
  const [kpiPeriod, setKpiPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const maxGrowth = Math.max(...GROWTH.map((g) => g.members));
  const totalRevenue = REVENUE_TIERS.reduce((sum, t) => sum + t.revenue, 0);
  const totalMembers = REVENUE_TIERS.reduce((sum, t) => sum + t.members, 0);

  return (
    <div
      className="min-h-screen bg-[#F7F7F7] text-[#1C1C1C]"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[2.5px] text-[#C108AB] mb-2">
              Council Admin
            </div>
            <h1
              className="text-2xl font-bold tracking-tight text-[#1C1C1C]"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-[#737373]">
              Membership, revenue, and engagement at a glance.
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setKpiPeriod(p)}
                className={`border px-3 py-1.5 text-sm font-medium transition-colors ${
                  kpiPeriod === p
                    ? 'border-[#C108AB] bg-[#C108AB] text-white'
                    : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                }`}
              >
                {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- KPI cards ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
            const trendColor =
              kpi.trend === 'up' ? 'text-[#1A7D42]' : 'text-[#C0392B]';
            return (
              <Card key={kpi.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-[rgba(193,8,171,0.08)] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C108AB]" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}
                  >
                    <TrendIcon className="h-3.5 w-3.5" />
                    {kpi.delta}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-bold text-[#1C1C1C]">{kpi.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-[#A3A3A3]">
                  {kpi.label}
                </p>
              </Card>
            );
          })}
        </div>

        {/* ---------- Growth chart + Revenue breakdown ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Growth chart */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#1C1C1C]">Member Growth</h2>
                <p className="mt-0.5 text-xs text-[#737373]">Cumulative members over the last 7 months</p>
              </div>
              <Badge variant="fuchsia">+56.6% YTD</Badge>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-end justify-between gap-3 h-56">
                {GROWTH.map((g) => {
                  const heightPct = (g.members / maxGrowth) * 100;
                  return (
                    <div
                      key={g.month}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex w-full flex-1 items-end justify-center">
                        <div
                          className="w-full max-w-[48px] bg-[#C108AB] transition-all duration-300 hover:bg-[#A50798] relative group"
                          style={{ height: `${heightPct}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-[#1C1C1C] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {g.members}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#737373]">{g.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Revenue by tier */}
          <Card>
            <div className="border-b border-[#E5E5E5] px-6 py-4">
              <h2 className="text-base font-semibold text-[#1C1C1C]">Revenue by Tier</h2>
              <p className="mt-0.5 text-xs text-[#737373]">{formatCurrency(totalRevenue)} annualized</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {REVENUE_TIERS.map((tier) => {
                const pct = Math.round((tier.revenue / totalRevenue) * 100);
                return (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#1C1C1C]">{tier.name}</span>
                      <span className="text-[#525252]">{formatCurrency(tier.revenue)}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full bg-[#F7F7F7]">
                      <div
                        className="h-full bg-[#C108AB]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#A3A3A3]">
                      <span>{tier.members} members</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ---------- Recent signups + Quick links ---------- */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent signups */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#1C1C1C]">Recent Member Signups</h2>
                <p className="mt-0.5 text-xs text-[#737373]">Latest 5 approved applications</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/admin/council/applications')}>
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                    <th className="px-6 py-3 font-semibold">Member</th>
                    <th className="px-6 py-3 font-semibold">Tier</th>
                    <th className="px-6 py-3 font-semibold">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {SIGNUPS.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#1C1C1C]">{s.name}</p>
                        <p className="mt-0.5 text-xs text-[#A3A3A3]">{s.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={tierBadgeVariant(s.tier)}>{TIER_LABEL[s.tier]}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#525252]">{formatDate(s.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <div className="border-b border-[#E5E5E5] px-6 py-4">
              <h2 className="text-base font-semibold text-[#1C1C1C]">Quick Links</h2>
              <p className="mt-0.5 text-xs text-[#737373]">Jump to other admin modules</p>
            </div>
            <div className="px-6 py-4 space-y-2">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.title}
                    onClick={() => (window.location.href = link.href)}
                    className="group flex w-full items-start gap-3 border border-[#E5E5E5] bg-white px-4 py-3 text-left transition-colors hover:border-[#C108AB]/30 hover:bg-[#FAFAFA]"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)]">
                      <Icon className="h-4 w-4 text-[#C108AB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#1C1C1C]">{link.title}</span>
                        <ArrowRight className="h-4 w-4 text-[#A3A3A3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#C108AB]" />
                      </div>
                      <p className="mt-0.5 text-xs text-[#737373] leading-relaxed">{link.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-[#E5E5E5] px-6 py-4">
              <div className="flex items-center justify-between text-xs text-[#737373]">
                <span>Total tier seats</span>
                <span className="font-semibold text-[#1C1C1C]">{totalMembers.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CouncilAdminDashboardPage;
