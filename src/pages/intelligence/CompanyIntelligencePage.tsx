/**
 * CompanyIntelligencePage — Company 360° intelligence view.
 * Single-company profile aggregating overview metrics, signals, financials,
 * leadership and news. Self-contained with mock data; wire to
 * /api/intelligence/companies/:id for persistence.
 */
import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  Users,
  Newspaper,
  DollarSign,
  Activity,
  Crown,
  MapPin,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type TabKey = 'overview' | 'signals' | 'financials' | 'leadership' | 'news';

type SignalType =
  | 'executive_movement'
  | 'market_shift'
  | 'funding_round'
  | 'leadership_change'
  | 'expansion_news';

type SignalStatus = 'new' | 'reviewed' | 'archived' | 'actioned';

interface CompanySignal {
  id: string;
  type: SignalType;
  title: string;
  summary: string;
  status: SignalStatus;
  date: string;
  source: string;
}

interface FundingRound {
  id: string;
  round: string;
  amount: string;
  date: string;
  leadInvestor: string;
}

interface Executive {
  id: string;
  name: string;
  title: string;
  since: string;
  recentlyChanged: boolean;
  previousRole?: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  summary: string;
}

interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  headquarters: string;
  website: string;
  founded: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/* Label / color maps                                                  */
/* ------------------------------------------------------------------ */

const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  executive_movement: 'Executive Movement',
  market_shift: 'Market Shift',
  funding_round: 'Funding Round',
  leadership_change: 'Leadership Change',
  expansion_news: 'Expansion News',
};

const STATUS_META: Record<
  SignalStatus,
  { label: string; variant: 'fuchsia' | 'warning' | 'default' | 'success' }
> = {
  new: { label: 'New', variant: 'fuchsia' },
  reviewed: { label: 'Reviewed', variant: 'warning' },
  archived: { label: 'Archived', variant: 'default' },
  actioned: { label: 'Actioned', variant: 'success' },
};

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const COMPANY: CompanyProfile = {
  name: 'Halcyon Bio',
  industry: 'Biotechnology',
  size: '500–1,000 employees',
  headquarters: 'Boston, MA',
  website: 'halcyonbio.com',
  founded: '2016',
  description:
    'Clinical-stage biotechnology company developing precision therapeutics for oncology and rare diseases. Recently closed a growth round and is scaling R&D and commercial operations across North America and EMEA.',
};

const KEY_METRICS = [
  { label: 'Signals (90d)', value: '14', trend: 'up' as const, change: '+3' },
  { label: 'Open Roles', value: '42', trend: 'up' as const, change: '+12' },
  { label: 'Funding (Total)', value: '$220M', trend: 'up' as const, change: '+$120M' },
  { label: 'Talent Density', value: 'High', trend: 'up' as const, change: 'Top 15%' },
];

const COMPANY_SIGNALS: CompanySignal[] = [
  {
    id: 'csig_1',
    type: 'funding_round',
    title: 'Series D closed — $120M',
    summary: 'Led by Tier-1 investor with participation from existing backers. Proceeds earmarked for late-stage trials and EMEA expansion.',
    status: 'new',
    date: '2026-07-13',
    source: 'Crunchbase API',
  },
  {
    id: 'csig_2',
    type: 'executive_movement',
    title: 'New Chief Commercial Officer',
    summary: 'Appointed CCO with prior experience scaling commercial ops at a public biotech.',
    status: 'new',
    date: '2026-07-09',
    source: 'LinkedIn',
  },
  {
    id: 'csig_3',
    type: 'expansion_news',
    title: 'EMEA HQ in Zurich',
    summary: 'Announced European headquarters; 20+ commercial and regulatory hires planned.',
    status: 'reviewed',
    date: '2026-06-28',
    source: 'Press Release',
  },
  {
    id: 'csig_4',
    type: 'market_shift',
    title: 'FDA fast-track designation',
    summary: 'Lead candidate received fast-track designation, shortening expected approval timeline.',
    status: 'actioned',
    date: '2026-06-15',
    source: 'RSS · Reuters',
  },
  {
    id: 'csig_5',
    type: 'leadership_change',
    title: 'VP R&D transition',
    summary: 'VP of R&D moved to an advisory role; successor promoted internally.',
    status: 'archived',
    date: '2026-05-30',
    source: 'Social · X',
  },
];

const FUNDING_HISTORY: FundingRound[] = [
  { id: 'fr1', round: 'Seed', amount: '$3.5M', date: '2017-03', leadInvestor: 'Local Angels' },
  { id: 'fr2', round: 'Series A', amount: '$22M', date: '2019-01', leadInvestor: 'Northpoint Ventures' },
  { id: 'fr3', round: 'Series B', amount: '$45M', date: '2021-06', leadInvestor: 'Atlas Capital' },
  { id: 'fr4', round: 'Series C', amount: '$50M', date: '2023-09', leadInvestor: 'Sequoia' },
  { id: 'fr5', round: 'Series D', amount: '$120M', date: '2026-07', leadInvestor: 'Tiger Global' },
];

const GROWTH_METRICS = [
  { label: 'YoY Headcount', value: '+34%', positive: true },
  { label: 'Revenue Growth', value: '+58%', positive: true },
  { label: 'R&D Spend', value: '$48M', positive: true },
  { label: 'Burn Multiple', value: '1.2x', positive: true },
];

const EXECUTIVES: Executive[] = [
  { id: 'ex1', name: 'Dr. Elena Vasquez', title: 'Chief Executive Officer', since: '2016', recentlyChanged: false },
  { id: 'ex2', name: 'Marcus Chen', title: 'Chief Financial Officer', since: '2022', recentlyChanged: false },
  { id: 'ex3', name: 'Priya Nair', title: 'Chief Commercial Officer', since: '2026', recentlyChanged: true, previousRole: 'VP Commercial, public biotech' },
  { id: 'ex4', name: 'Dr. Sam Okafor', title: 'Chief Scientific Officer', since: '2018', recentlyChanged: false },
  { id: 'ex5', name: 'Ruth Goldberg', title: 'Chief People Officer', since: '2026', recentlyChanged: true, previousRole: 'VP People, medtech' },
];

const NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Halcyon Bio closes $120M Series D to advance oncology pipeline',
    source: 'TechCrunch',
    date: '2026-07-13',
    url: '#',
    summary: 'The round will fund late-stage trials and a push into European markets.',
  },
  {
    id: 'n2',
    title: 'FDA grants fast-track designation to Halcyon Bio lead candidate',
    source: 'Reuters',
    date: '2026-06-15',
    url: '#',
    summary: 'Regulatory milestone expected to shorten the approval timeline by 12–18 months.',
  },
  {
    id: 'n3',
    title: 'Halcyon Bio names new Chief Commercial Officer',
    source: 'BioPharma Dive',
    date: '2026-07-09',
    url: '#',
    summary: 'Industry veteran joins ahead of the company’s commercial launch preparations.',
  },
  {
    id: 'n4',
    title: 'Halcyon Bio announces EMEA headquarters in Zurich',
    source: 'FierceBiotech',
    date: '2026-06-28',
    url: '#',
    summary: 'European base will house regulatory and commercial operations.',
  },
];

const COMPETITORS = [
  { name: 'Vertex Therapeutics', share: '24%', position: 'Leader' },
  { name: 'Aurora Genomics', share: '18%', position: 'Challenger' },
  { name: 'Halcyon Bio', share: '11%', position: 'Rising' },
  { name: 'Meridian Biosciences', share: '9%', position: 'Niche' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/* Shared sub-components                                               */
/* ------------------------------------------------------------------ */

function SectionTitle({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-[#C108AB]">{icon}</span>
        <h2 className="text-sm font-semibold text-[#1C1C1C]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SkeletonBlock({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse bg-[#F7F7F7]"
          style={{ width: `${[100, 85, 70, 92][i % 4]}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

function OverviewTab({ loading }: { loading: boolean }) {
  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <Card>
        <SectionTitle icon={<Activity className="h-4 w-4" />} title="Key Metrics" />
        {loading ? (
          <SkeletonBlock lines={2} />
        ) : (
          <div className="grid grid-cols-2 gap-px bg-[#E5E5E5] sm:grid-cols-4">
            {KEY_METRICS.map((m) => (
              <div key={m.label} className="bg-white px-6 py-5">
                <p className="text-[13px] font-medium uppercase tracking-wide text-[#737373]">
                  {m.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[#1C1C1C]">{m.value}</p>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                      m.trend === 'up' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    {m.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {m.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent signals */}
        <Card>
          <SectionTitle icon={<TrendingUp className="h-4 w-4" />} title="Recent Signals" />
          {loading ? (
            <SkeletonBlock lines={3} />
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {COMPANY_SIGNALS.slice(0, 3).map((s) => (
                <div key={s.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1C1C1C]">{s.title}</p>
                      <p className="mt-0.5 text-xs text-[#737373]">{s.summary}</p>
                    </div>
                    <Badge variant={STATUS_META[s.status].variant}>
                      {STATUS_META[s.status].label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                    {SIGNAL_TYPE_LABELS[s.type]} · {formatDate(s.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Competitive position */}
        <Card>
          <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Competitive Position" />
          {loading ? (
            <SkeletonBlock lines={4} />
          ) : (
            <div className="space-y-4 px-6 py-5">
              {COMPETITORS.map((c) => {
                const isSelf = c.name === COMPANY.name;
                const widthPct = parseInt(c.share, 10);
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          isSelf ? 'text-[#C108AB]' : 'text-[#1C1C1C]'
                        }`}
                      >
                        {c.name}
                        {isSelf && (
                          <span className="ml-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                            (this company)
                          </span>
                        )}
                      </span>
                      <span className="text-[#525252]">{c.share}</span>
                    </div>
                    <div className="h-2 w-full bg-[#F7F7F7]">
                      <div
                        className={`h-full ${isSelf ? 'bg-[#C108AB]' : 'bg-[#A3A3A3]'}`}
                        style={{ width: `${widthPct * 3}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                      {c.position}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SignalsTab({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <SkeletonBlock lines={5} />
      </Card>
    );
  }
  return (
    <Card>
      <SectionTitle
        icon={<Activity className="h-4 w-4" />}
        title="Signal Timeline"
        action={<span className="text-xs text-[#A3A3A3]">{COMPANY_SIGNALS.length} signals</span>}
      />
      <div className="px-6 py-5">
        <ol className="relative border-l border-[#E5E5E5] pl-6">
          {COMPANY_SIGNALS.map((s) => (
            <li key={s.id} className="mb-6 last:mb-0">
              <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#C108AB]" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[#1C1C1C]">{s.title}</p>
                <Badge variant={STATUS_META[s.status].variant}>
                  {STATUS_META[s.status].label}
                </Badge>
                <span className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                  {SIGNAL_TYPE_LABELS[s.type]}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#525252]">{s.summary}</p>
              <p className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                <Calendar className="h-3 w-3" />
                {formatDate(s.date)} · {s.source}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

function FinancialsTab({ loading }: { loading: boolean }) {
  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle icon={<DollarSign className="h-4 w-4" />} title="Growth Metrics" />
        {loading ? (
          <SkeletonBlock lines={2} />
        ) : (
          <div className="grid grid-cols-2 gap-px bg-[#E5E5E5] sm:grid-cols-4">
            {GROWTH_METRICS.map((m) => (
              <div key={m.label} className="bg-white px-6 py-5">
                <p className="text-[13px] font-medium uppercase tracking-wide text-[#737373]">
                  {m.label}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    m.positive ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle
          icon={<TrendingUp className="h-4 w-4" />}
          title="Funding History"
          action={<span className="text-xs text-[#A3A3A3]">{FUNDING_HISTORY.length} rounds</span>}
        />
        {loading ? (
          <SkeletonBlock lines={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                  <th className="px-6 py-3 font-semibold">Round</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Date</th>
                  <th className="px-6 py-3 font-semibold">Lead Investor</th>
                </tr>
              </thead>
              <tbody>
                {FUNDING_HISTORY.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1C1C1C]">
                        <DollarSign className="h-3.5 w-3.5 text-[#C108AB]" />
                        {r.round}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#1C1C1C]">{r.amount}</td>
                    <td className="px-6 py-4 text-sm text-[#525252]">{r.date}</td>
                    <td className="px-6 py-4 text-sm text-[#525252]">{r.leadInvestor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function LeadershipTab({ loading }: { loading: boolean }) {
  return (
    <Card>
      <SectionTitle
        icon={<Crown className="h-4 w-4" />}
        title="Key Executives"
        action={
          <span className="text-xs text-[#A3A3A3]">
            {EXECUTIVES.filter((e) => e.recentlyChanged).length} recent changes
          </span>
        }
      />
      {loading ? (
        <SkeletonBlock lines={4} />
      ) : (
        <div className="divide-y divide-[#E5E5E5]">
          {EXECUTIVES.map((ex) => (
            <div key={ex.id} className="flex items-start gap-4 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)] text-[#C108AB]">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#1C1C1C]">{ex.name}</p>
                  {ex.recentlyChanged && (
                    <Badge variant="fuchsia">Recent Change</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[#525252]">{ex.title}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                  Since {ex.since}
                  {ex.previousRole ? ` · Previously: ${ex.previousRole}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function NewsTab({ loading }: { loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <SkeletonBlock lines={4} />
      </Card>
    );
  }
  return (
    <Card>
      <SectionTitle
        icon={<Newspaper className="h-4 w-4" />}
        title="Recent News"
        action={<span className="text-xs text-[#A3A3A3]">{NEWS.length} articles</span>}
      />
      <div className="divide-y divide-[#E5E5E5]">
        {NEWS.map((n) => (
          <a
            key={n.id}
            href={n.url}
            className="block px-6 py-4 transition-colors hover:bg-[#FAFAFA]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1C1C1C]">{n.title}</p>
                <p className="mt-0.5 text-sm text-[#737373]">{n.summary}</p>
                <p className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                  <Newspaper className="h-3 w-3" />
                  {n.source}
                  <span aria-hidden>·</span>
                  <Calendar className="h-3 w-3" />
                  {formatDate(n.date)}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-[#A3A3A3]" />
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CompanyIntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    // Simulated fetch — replace with /api/intelligence/companies/:id
    setTimeout(() => setLoading(false), 500);
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'signals', label: 'Signals', icon: TrendingUp },
    { key: 'financials', label: 'Financials', icon: DollarSign },
    { key: 'leadership', label: 'Leadership', icon: Users },
    { key: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ---------- Company header ---------- */}
        <Card>
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center bg-[rgba(193,8,171,0.08)] text-[#C108AB]">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#1C1C1C]">{COMPANY.name}</h1>
                  <Badge variant="fuchsia">Monitored</Badge>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-[#525252]">{COMPANY.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#737373]">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {COMPANY.industry}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {COMPANY.size}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {COMPANY.headquarters}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Founded {COMPANY.founded}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh}>
                Refresh
              </Button>
              <Button size="sm">
                <ExternalLink className="h-4 w-4" />
                Visit Site
              </Button>
            </div>
          </div>
        </Card>

        {/* ---------- Tabs ---------- */}
        <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-[#E5E5E5]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-[#C108AB] text-[#C108AB]'
                    : 'border-transparent text-[#525252] hover:border-[#E5E5E5] hover:text-[#1C1C1C]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ---------- Tab content ---------- */}
        <div className="mt-6">
          {activeTab === 'overview' && <OverviewTab loading={loading} />}
          {activeTab === 'signals' && <SignalsTab loading={loading} />}
          {activeTab === 'financials' && <FinancialsTab loading={loading} />}
          {activeTab === 'leadership' && <LeadershipTab loading={loading} />}
          {activeTab === 'news' && <NewsTab loading={loading} />}
        </div>
      </div>
    </div>
  );
}

export default CompanyIntelligencePage;
