import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, MessageSquare, TrendingUp, Calendar, Award, ChevronRight } from 'lucide-react';
import type { OutreachAttempt, OutreachChannel, OutreachOutcome } from '@/types';
import { CHANNEL_LABELS, OUTCOME_LABELS } from '@/types';
import { getAllOutreachAttempts } from '@/services/supabaseApi';
import { useAuthStore } from '@/stores/authStore';

const POSITIVE_OUTCOMES: OutreachOutcome[] = ['positive', 'interested', 'scheduled_interview', 'referred_other'];

interface Props {
  mandateId?: string;
  mandateTitle?: string;
  compact?: boolean;
}

interface ChannelStats {
  channel: OutreachChannel;
  total: number;
  responded: number;
  positive: number;
  responseRate: number;
  positiveRate: number;
}

interface ConsultantStats {
  consultantId: string | null;
  consultantName: string;
  total: number;
  responded: number;
  positive: number;
  responseRate: number;
  positiveRate: number;
}

interface DashboardData {
  totalAttempts: number;
  totalResponded: number;
  totalPositive: number;
  overallResponseRate: number;
  overallPositiveRate: number;
  uniqueCandidates: number;
  byChannel: ChannelStats[];
  byConsultant: ConsultantStats[];
  avgAttemptsBeforePositive: number;
  funnelData: {
    totalCandidates: number;
    contacted: number;
    responseReceived: number;
    positiveResponse: number;
    progressedToApproach: number;
  };
  timeSeries: { date: string; attempts: number; responses: number; positives: number }[];
}

function isoDateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDaysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDateOnly(d);
}

function calculateDashboard(attempts: OutreachAttempt[], contacts: { id: string; first_name: string; last_name: string }[]): DashboardData {
  const totalAttempts = attempts.length;
  const totalResponded = attempts.filter(a => a.outcome && a.outcome !== 'no_response').length;
  const totalPositive = attempts.filter(a => a.outcome && POSITIVE_OUTCOMES.includes(a.outcome)).length;
  const overallResponseRate = totalAttempts > 0 ? (totalResponded / totalAttempts) * 100 : 0;
  const overallPositiveRate = totalAttempts > 0 ? (totalPositive / totalAttempts) * 100 : 0;

  const uniqueCandidates = new Set(attempts.map(a => a.candidate_id)).size;

  // By channel stats
  const byChannelMap: Record<string, { total: number; responded: number; positive: number }> = {};
  attempts.forEach(a => {
    if (!byChannelMap[a.channel]) byChannelMap[a.channel] = { total: 0, responded: 0, positive: 0 };
    byChannelMap[a.channel].total++;
    if (a.outcome && a.outcome !== 'no_response') byChannelMap[a.channel].responded++;
    if (a.outcome && POSITIVE_OUTCOMES.includes(a.outcome)) byChannelMap[a.channel].positive++;
  });

  const byChannel: ChannelStats[] = (Object.keys(byChannelMap) as OutreachChannel[]).map((channel) => {
    const stats = byChannelMap[channel];
    return {
      channel,
      total: stats.total,
      responded: stats.responded,
      positive: stats.positive,
      responseRate: stats.total > 0 ? (stats.responded / stats.total) * 100 : 0,
      positiveRate: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  // By consultant stats
  const consultantMap: Record<string, { total: number; responded: number; positive: number; name: string }> = {};
  const contactNameMap = new Map(contacts.map(c => [c.id, `${c.first_name} ${c.last_name}`]));

  attempts.forEach(a => {
    const key = a.created_by || 'unknown';
    if (!consultantMap[key]) {
      consultantMap[key] = {
        total: 0,
        responded: 0,
        positive: 0,
        name: key === 'unknown' ? 'Unassigned' : contactNameMap.get(key) || 'Consultant',
      };
    }
    consultantMap[key].total++;
    if (a.outcome && a.outcome !== 'no_response') consultantMap[key].responded++;
    if (a.outcome && POSITIVE_OUTCOMES.includes(a.outcome)) consultantMap[key].positive++;
  });

  const byConsultant: ConsultantStats[] = Object.keys(consultantMap).map((key) => {
    const s = consultantMap[key];
    return {
      consultantId: key === 'unknown' ? null : key,
      consultantName: s.name,
      total: s.total,
      responded: s.responded,
      positive: s.positive,
      responseRate: s.total > 0 ? (s.responded / s.total) * 100 : 0,
      positiveRate: s.total > 0 ? (s.positive / s.total) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);

  // Average attempts before first positive response per candidate
  const candidateGroups = new Map<string, OutreachAttempt[]>();
  attempts.forEach(a => {
    if (!candidateGroups.has(a.candidate_id)) candidateGroups.set(a.candidate_id, []);
    candidateGroups.get(a.candidate_id)!.push(a);
  });

  let totalAttemptsForPositives = 0;
  let candidatesWithPositives = 0;
  candidateGroups.forEach((candidateAttempts) => {
    const sortedAttempts = [...candidateAttempts].sort((a, b) => a.attempt_number - b.attempt_number);
    const firstPositiveIdx = sortedAttempts.findIndex(a => a.outcome && POSITIVE_OUTCOMES.includes(a.outcome));
    if (firstPositiveIdx !== -1) {
      totalAttemptsForPositives += firstPositiveIdx + 1;
      candidatesWithPositives++;
    }
  });

  const avgAttemptsBeforePositive = candidatesWithPositives > 0 ? totalAttemptsForPositives / candidatesWithPositives : 0;

  // Time series data (last 14 days)
  const timeSeries: { date: string; attempts: number; responses: number; positives: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dateStr = getDaysAgoISO(i);
    const dayAttempts = attempts.filter(a => a.attempt_date === dateStr);
    timeSeries.push({
      date: dateStr,
      attempts: dayAttempts.length,
      responses: dayAttempts.filter(a => a.outcome && a.outcome !== 'no_response').length,
      positives: dayAttempts.filter(a => a.outcome && POSITIVE_OUTCOMES.includes(a.outcome)).length,
    });
  }

  // Funnel data
  const totalCandidates = new Set(attempts.map(a => a.candidate_id)).size;
  const contacted = new Set(attempts.filter(a => a.attempt_number >= 1).map(a => a.candidate_id)).size;
  const responseReceived = new Set(attempts.filter(a => a.outcome && a.outcome !== 'no_response').map(a => a.candidate_id)).size;
  const positiveResponse = new Set(attempts.filter(a => a.outcome && POSITIVE_OUTCOMES.includes(a.outcome)).map(a => a.candidate_id)).size;

  return {
    totalAttempts,
    totalResponded,
    totalPositive,
    overallResponseRate,
    overallPositiveRate,
    uniqueCandidates,
    byChannel,
    byConsultant,
    avgAttemptsBeforePositive,
    funnelData: {
      totalCandidates,
      contacted,
      responseReceived,
      positiveResponse,
      progressedToApproach: positiveResponse,
    },
    timeSeries,
  };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color = 'text-accent',
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {sublabel && <p className="text-xs text-text-muted mt-1">{sublabel}</p>}
        </div>
        <div className={`p-2 bg-bg-tertiary rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function RateBar({ rate, colorClass }: { rate: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} transition-all`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-text-muted w-12 text-right">{rate.toFixed(1)}%</span>
    </div>
  );
}

export function OutreachDashboard({ mandateId, mandateTitle, compact = false }: Props) {
  const { profile: userProfile } = useAuthStore();
  const [attempts, setAttempts] = useState<OutreachAttempt[]>([]);
  const [contacts, setContacts] = useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'channel' | 'consultant'>('overview');
  const [dateRange, setDateRange] = useState<'all' | '30' | '7'>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllOutreachAttempts(mandateId);
      setAttempts(data);
      setLoading(false);
    }
    load();
  }, [mandateId]);

  const filteredAttempts = useMemo(() => {
    if (dateRange === 'all') return attempts;
    const cutoff = getDaysAgoISO(parseInt(dateRange));
    return attempts.filter(a => a.attempt_date >= cutoff);
  }, [attempts, dateRange]);

  const dashboard = useMemo(() => calculateDashboard(filteredAttempts, contacts), [filteredAttempts, contacts]);

  if (loading) {
    return <div className="py-8 text-center text-text-muted">Loading outreach dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-xl text-text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Outreach Performance Dashboard
            {mandateTitle && <span className="text-text-muted text-base">— {mandateTitle}</span>}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {filteredAttempts.length} outreach attempts across {dashboard.uniqueCandidates} candidates
            {dateRange !== 'all' && ` (last ${dateRange} days)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary min-h-[44px]"
          >
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="7">Last 7 days</option>
          </select>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total Attempts"
          value={dashboard.totalAttempts}
          sublabel={`${dashboard.uniqueCandidates} candidates`}
        />
        <StatCard
          icon={TrendingUp}
          label="Response Rate"
          value={`${dashboard.overallResponseRate.toFixed(1)}%`}
          sublabel={`${dashboard.totalResponded} responses`}
          color="text-emerald-600"
        />
        <StatCard
          icon={Award}
          label="Positive Rate"
          value={`${dashboard.overallPositiveRate.toFixed(1)}%`}
          sublabel={`${dashboard.totalPositive} positive`}
          color="text-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Avg. Attempts → Positive"
          value={dashboard.avgAttemptsBeforePositive.toFixed(1)}
          sublabel="per engaged candidate"
          color="text-purple-600"
        />
      </div>

      {/* View tabs */}
      {!compact && (
        <div className="flex gap-1 border-b border-border">
          {(['overview', 'channel', 'consultant'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                view === v ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              {v === 'overview' ? 'Overview' : v === 'channel' ? 'By Channel' : 'By Consultant'}
            </button>
          ))}
        </div>
      )}

      {/* Channel breakdown */}
      {(view === 'overview' || view === 'channel') && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            Channel Effectiveness
          </h3>

          {dashboard.byChannel.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">No outreach data yet. Start by logging attempts in the candidate timeline.</p>
          ) : (
            <div className="space-y-4">
              {dashboard.byChannel.map((cs) => (
                <div key={cs.channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">{CHANNEL_LABELS[cs.channel]}</span>
                    <span className="text-xs text-text-muted">{cs.total} {cs.total === 1 ? 'attempt' : 'attempts'}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted w-24">Response Rate</span>
                      <RateBar rate={cs.responseRate} colorClass="bg-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted w-24">Positive Rate</span>
                      <RateBar rate={cs.positiveRate} colorClass="bg-blue-500" />
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Best Performing Channel</p>
                {dashboard.byChannel.length > 0 && (() => {
                  const best = [...dashboard.byChannel].sort((a, b) => b.positiveRate - a.positiveRate)[0];
                  return (
                    <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/20 rounded-lg">
                      <span className="text-sm font-medium text-text-primary">{CHANNEL_LABELS[best.channel]}</span>
                      <span className="text-sm font-bold text-accent">{best.positiveRate.toFixed(1)}% positive</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consultant breakdown */}
      {(view === 'overview' || view === 'consultant') && dashboard.byConsultant.length > 1 && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            Per-Consultant Performance
          </h3>

          <div className="space-y-4">
            {dashboard.byConsultant.map((cs) => (
              <div key={cs.consultantId || 'unknown'} className="space-y-2 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{cs.consultantName}</span>
                  <span className="text-xs text-text-muted">{cs.total} attempts</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-24">Response</span>
                    <RateBar rate={cs.responseRate} colorClass="bg-emerald-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted w-24">Positive</span>
                    <RateBar rate={cs.positiveRate} colorClass="bg-blue-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel overview */}
      {view === 'overview' && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Candidate Engagement Funnel
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Total Candidates in Pipeline', count: dashboard.funnelData.totalCandidates, width: 100, color: 'bg-slate-500' },
              { label: 'Contacted (at least 1 attempt)', count: dashboard.funnelData.contacted, width: dashboard.funnelData.totalCandidates > 0 ? (dashboard.funnelData.contacted / dashboard.funnelData.totalCandidates) * 100 : 0, color: 'bg-blue-500' },
              { label: 'Responded', count: dashboard.funnelData.responseReceived, width: dashboard.funnelData.contacted > 0 ? (dashboard.funnelData.responseReceived / dashboard.funnelData.contacted) * 100 : 0, color: 'bg-emerald-500' },
              { label: 'Positive Response', count: dashboard.funnelData.positiveResponse, width: dashboard.funnelData.responseReceived > 0 ? (dashboard.funnelData.positiveResponse / dashboard.funnelData.responseReceived) * 100 : 0, color: 'bg-purple-500' },
            ].map((stage, idx, arr) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-4 text-xs text-text-muted flex justify-center">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary">{stage.label}</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {stage.count}
                      {idx > 0 && (
                        <span className="ml-2 text-xs text-text-muted font-normal">
                          ({((stage.count / Math.max(arr[idx - 1].count, 1)) * 100).toFixed(0)}% of prev)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${stage.color} transition-all`} style={{ width: `${Math.max(stage.width, 2)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last 14 days activity */}
      {view === 'overview' && dashboard.timeSeries.some(d => d.attempts > 0) && (
        <div className="bg-bg-secondary border border-border rounded-xl p-5">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Last 14 Days Activity
          </h3>

          <div className="flex items-end gap-1 h-32">
            {dashboard.timeSeries.map((d) => {
              const maxVal = Math.max(...dashboard.timeSeries.map(x => x.attempts), 1);
              const height = (d.attempts / maxVal) * 100;
              const dateObj = new Date(d.date);
              const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isToday = d.date === getDaysAgoISO(0);

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex flex-col justify-end h-24">
                    <div
                      className={`w-full rounded-t transition-all ${isToday ? 'bg-accent' : 'bg-accent/60'}`}
                      style={{ height: `${Math.max(height, d.attempts > 0 ? 4 : 0)}%`, minHeight: d.attempts > 0 ? '4px' : '0' }}
                      title={`${d.attempts} attempts on ${label}`}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                    {dateObj.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border">
            <span>{new Date(dashboard.timeSeries[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{dashboard.timeSeries.reduce((sum, d) => sum + d.attempts, 0)} total attempts</span>
            <span>{new Date(dashboard.timeSeries[dashboard.timeSeries.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
