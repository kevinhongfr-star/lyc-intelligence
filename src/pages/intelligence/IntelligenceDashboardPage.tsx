/**
 * IntelligenceDashboardPage — Signal dashboard (consultant view)
 * Surfaces market signals captured by the Intelligence Layer so consultants
 * can triage, filter and act on executive moves, funding rounds, market shifts.
 * Wired to /api/intelligence/signals for real data.
 */
import React, { useMemo, useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Database,
  Building2,
  Filter,
  Search,
  ChevronDown,
  Download,
  Check,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type SignalType =
  | 'executive_movement'
  | 'market_shift'
  | 'funding_round'
  | 'leadership_change'
  | 'expansion_news';

type SignalStatus = 'new' | 'reviewed' | 'archived' | 'actioned';

interface Signal {
  id: string;
  type: SignalType;
  company: string;
  source: string;
  relevance: number;
  status: SignalStatus;
  date: string;
  summary: string;
  highPriority: boolean;
  severity?: string;
  detected_at?: string;
  affected_industries?: string[];
  affected_geographies?: string[];
}

type FilterKey = 'all' | 'high_priority' | 'new' | 'actioned';

const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  executive_movement: 'Executive Movement',
  market_shift: 'Market Shift',
  funding_round: 'Funding Round',
  leadership_change: 'Leadership Change',
  expansion_news: 'Expansion News',
};

const STATUS_LABELS: Record<SignalStatus, { label: string; variant: 'fuchsia' | 'warning' | 'default' | 'success' }> = {
  new: { label: 'New', variant: 'fuchsia' },
  reviewed: { label: 'Reviewed', variant: 'warning' },
  archived: { label: 'Archived', variant: 'default' },
  actioned: { label: 'Actioned', variant: 'success' },
};

function relevanceTier(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score > 70) {
    return {
      label: 'High',
      color: 'text-[#16A34A]',
      bg: 'bg-[rgba(22,163,74,0.10)]',
    };
  }
  if (score >= 40) {
    return {
      label: 'Medium',
      color: 'text-[#CA8A04]',
      bg: 'bg-[rgba(202,138,4,0.10)]',
    };
  }
  return { label: 'Low', color: 'text-[#737373]', bg: 'bg-[#F7F7F7]' };
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-[#737373]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-[#1C1C1C]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#A3A3A3]">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center bg-[rgba(193,8,171,0.08)] text-[#C108AB]">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-full animate-pulse bg-[#F7F7F7]" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 w-full animate-pulse bg-[#F7F7F7]" />
      ))}
    </div>
  );
}

export function IntelligenceDashboardPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/intelligence/signals', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch signals');
      const data = await res.json();
      setSignals(data.signals || []);
    } catch (error) {
      console.error('Failed to fetch signals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [session]);

  const updateSignalStatus = async (signalId: string, newStatus: SignalStatus) => {
    setActioningId(signalId);
    try {
      const token = session?.access_token;
      const res = await fetch('/api/intelligence/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: signalId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setSignals((prev) =>
          prev.map((s) => (s.id === signalId ? { ...s, status: newStatus } : s))
        );
      }
    } catch (error) {
      console.error('Failed to update signal:', error);
    } finally {
      setActioningId(null);
    }
  };

  const filtered = useMemo(() => {
    let rows = signals;
    if (activeFilter === 'high_priority') rows = rows.filter((s) => s.highPriority);
    if (activeFilter === 'new') rows = rows.filter((s) => s.status === 'new');
    if (activeFilter === 'actioned') rows = rows.filter((s) => s.status === 'actioned');
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (s) =>
          s.company.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          SIGNAL_TYPE_LABELS[s.type].toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [signals, activeFilter, query]);

  const counts = useMemo(
    () => ({
      active: signals.filter((s) => s.status !== 'archived').length,
      highPriority: signals.filter((s) => s.highPriority).length,
      sources: new Set(signals.map((s) => s.source)).size,
      companies: new Set(signals.map((s) => s.company)).size,
    }),
    [signals],
  );

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'high_priority', label: 'High Priority' },
    { key: 'new', label: 'New' },
    { key: 'actioned', label: 'Actioned' },
  ];

  const getActionButtons = (signal: Signal) => {
    if (actioningId === signal.id) {
      return (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-[#C108AB]" />
        </div>
      );
    }

    switch (signal.status) {
      case 'new':
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateSignalStatus(signal.id, 'reviewed')}
              className="h-7 px-2 text-[11px]"
            >
              <Check className="h-3 w-3" />
              Mark Reviewed
            </Button>
            <Button
              size="sm"
              onClick={() => updateSignalStatus(signal.id, 'actioned')}
              className="h-7 px-2 text-[11px]"
            >
              Action
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateSignalStatus(signal.id, 'archived')}
              className="h-7 px-2 text-[11px] text-[#737373]"
            >
              <Archive className="h-3 w-3" />
            </Button>
          </div>
        );
      case 'reviewed':
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => updateSignalStatus(signal.id, 'actioned')}
              className="h-7 px-2 text-[11px]"
            >
              Action
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateSignalStatus(signal.id, 'archived')}
              className="h-7 px-2 text-[11px] text-[#737373]"
            >
              <Archive className="h-3 w-3" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Intelligence Dashboard</h1>
            <p className="mt-1 text-sm text-[#737373]">
              Live market signals, executive moves and funding activity across your tracked universe.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="appearance-none border border-[#E5E5E5] bg-white py-2.5 pl-3 pr-9 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
            </div>
            <Button variant="outline" size="sm" onClick={fetchSignals}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" aria-label="Export signals">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<Activity className="h-5 w-5" />}
            label="Active Signals"
            value={counts.active}
            sub="Excluding archived"
          />
          <KpiCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="High Priority"
            value={counts.highPriority}
            sub="Requiring attention"
          />
          <KpiCard
            icon={<Database className="h-5 w-5" />}
            label="Sources Tracked"
            value={counts.sources}
            sub="Across all signal types"
          />
          <KpiCard
            icon={<Building2 className="h-5 w-5" />}
            label="Companies Monitored"
            value={counts.companies}
            sub="In current scope"
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="mr-1 h-4 w-4 text-[#737373]" />
            {filterTabs.map((tab) => {
              const active = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[#C108AB] bg-[#C108AB] text-white'
                      : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, source, type…"
              className="pl-9"
              aria-label="Search signals"
            />
          </div>
        </div>

        <div className="mt-4">
          <Card className="overflow-hidden">
            <div className="border-b border-[#E5E5E5] px-6 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C108AB]" />
                <h2 className="text-sm font-semibold text-[#1C1C1C]">Signal Feed</h2>
                <span className="text-xs text-[#A3A3A3]">
                  {filtered.length} of {signals.length} signals
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <TableSkeleton />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Search className="h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No signals match your filters</p>
                <p className="mt-1 text-xs text-[#737373]">
                  Try clearing the search or switching to the All filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                      <th className="px-6 py-3 font-semibold">Signal Type</th>
                      <th className="px-6 py-3 font-semibold">Company</th>
                      <th className="px-6 py-3 font-semibold">Source</th>
                      <th className="px-6 py-3 font-semibold">Relevance</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const tier = relevanceTier(s.relevance);
                      const status = STATUS_LABELS[s.status];
                      return (
                        <tr
                          key={s.id}
                          className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1C1C1C]">
                                {SIGNAL_TYPE_LABELS[s.type]}
                              </span>
                              {s.highPriority && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#C108AB]"
                                  title="High priority"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-[#737373]">
                              {s.summary}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 flex-shrink-0 text-[#A3A3A3]" />
                              <span className="text-sm text-[#1C1C1C]">{s.company}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">{s.source}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${tier.bg} ${tier.color}`}
                              >
                                {s.relevance}
                              </span>
                              <span className="text-[11px] uppercase tracking-wide text-[#A3A3A3]">
                                {tier.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">
                            {new Date(s.date || s.detected_at || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">{getActionButtons(s)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default IntelligenceDashboardPage;
