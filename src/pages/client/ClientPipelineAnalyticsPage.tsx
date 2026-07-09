/**
 * ClientPipelineAnalyticsPage — B2B Client Portal pipeline analytics
 * Renders inside AppShell → Outlet. Funnel data sourced from Supabase via useClientPipelineAnalytics (RLS-scoped).
 */
import React, { useMemo } from 'react';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useClientPipelineAnalytics, useClientMandates } from '@/hooks/usePortalData';

// Stage display order — matches how LYC teams use the pipeline
const STAGE_DISPLAY_ORDER: { keys: string[]; label: string; color: string }[] = [
  { keys: ['SWEEP', 'SOURCING', 'ACTIVE'], label: 'Sourcing', color: 'bg-blue' },
  { keys: ['SCREEN', 'SCREENING', 'IN_REVIEW'], label: 'Screening', color: 'bg-fuchsia' },
  { keys: ['SHORTLIST', 'SHORTLISTED', 'TIER1'], label: 'Shortlisted', color: 'bg-amber' },
  { keys: ['INTERVIEW', 'INTERVIEWING', 'CLIENT'], label: 'Interview', color: 'bg-lens' },
  { keys: ['OFFER', 'OFFER_EXTENDED'], label: 'Offer', color: 'bg-green' },
  { keys: ['HIRED', 'PLACED'], label: 'Placed', color: 'bg-green' },
];

function stageCount(byStage: Record<string, number>, keys: string[]): number {
  return keys.reduce((sum, k) => sum + (byStage[k] || 0), 0);
}

export function ClientPipelineAnalyticsPage() {
  const { data: pipeline, loading: pipelineLoading } = useClientPipelineAnalytics();
  const { data: mandates } = useClientMandates();

  // Derive funnel from real data
  const stages = useMemo(() => {
    const byStage = pipeline?.byStage ?? {};
    const topCount = Math.max(
      STAGE_DISPLAY_ORDER[0].keys.reduce((s, k) => s + (byStage[k] || 0), 0),
      1
    );
    return STAGE_DISPLAY_ORDER.map((s) => {
      const count = stageCount(byStage, s.keys);
      return { name: s.label, count, percentage: Math.round((count / topCount) * 100), color: s.color };
    });
  }, [pipeline]);

  const totalCandidates = pipeline?.total ?? 0;
  const conversionRate = pipeline ? (pipeline.conversionRate * 100).toFixed(1) : '0.0';
  // avgTimeToPlace not in current schema — show '—' to be honest
  const avgTimeToPlace: number | null = null;

  // Monthly trend stub: mandates created per month from updated_at
  const trends = useMemo(() => {
    const months: Record<string, { candidates: number; mandates: number }> = {};
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      months[key] = { candidates: 0, mandates: 0 };
    }
    for (const m of mandates ?? []) {
      const d = new Date(m.updated_at);
      if (isNaN(d.getTime())) continue;
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (months[key]) {
        months[key].mandates += 1;
        months[key].candidates += m.total_candidates ?? 0;
      }
    }
    return Object.entries(months).map(([month, v]) => ({ month, ...v }));
  }, [mandates]);

  const maxCandidates = Math.max(...trends.map((t) => t.candidates), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Pipeline Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time funnel metrics and conversion trends.</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{pipelineLoading ? '—' : totalCandidates}</div>
              <div className="text-xs text-text-muted">Total Candidates</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Target className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{conversionRate}%</div>
              <div className="text-xs text-text-muted">Placement Rate</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Clock className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{avgTimeToPlace == null ? '—' : `${avgTimeToPlace}d`}</div>
              <div className="text-xs text-text-muted">Avg. Time to Place</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">—</div>
              <div className="text-xs text-text-muted">MoM Growth</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {pipelineLoading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading funnel...</div>
          ) : totalCandidates === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No pipeline data yet.</div>
          ) : (
            <div className="space-y-4">
              {stages.map((stage) => (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-text-primary">{stage.name}</span>
                    <span className="text-sm text-text-secondary">{stage.count} ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full h-3 bg-bg-warm rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.every((t) => t.candidates === 0 && t.mandates === 0) ? (
            <div className="py-8 text-center text-text-muted text-sm">No trend data yet.</div>
          ) : (
            <div className="flex items-end justify-between gap-4 h-48">
              {trends.map((trend) => (
                <div key={trend.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center h-32">
                    <div
                      className="w-8 bg-fuchsia rounded-t transition-all hover:bg-fuchsia/80 cursor-pointer relative group"
                      style={{ height: `${Math.max(2, (trend.candidates / maxCandidates) * 100)}%` }}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {trend.candidates}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">{trend.month}</span>
                  <span className="text-xs font-medium text-text-secondary">{trend.mandates} mandates</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientPipelineAnalyticsPage;

