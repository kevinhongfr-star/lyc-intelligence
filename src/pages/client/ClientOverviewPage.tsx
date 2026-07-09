/**
 * ClientOverviewPage — B2B Client Portal landing dashboard
 * Renders inside AppShell → Outlet. Shows mandate summary, pipeline metrics, and recent activity.
 * Data sourced from Supabase via useClientMandates and useClientActivity (RLS-scoped).
 */
import React from 'react';
import { Briefcase, Users, TrendingUp, Clock, ArrowRight, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { useClientMandates, useClientActivity, useClientPipelineAnalytics } from '@/hooks/usePortalData';

interface MandateSummary {
  id: string;
  title: string;
  status: string;
  candidatesCount: number;
  progress: number;
  updatedAt: string;
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function progressForMandate(m: { total_candidates: number; tier1_count: number; tier2_count: number; interview_count: number; placed_count: number; }): number {
  // Pipeline progress = interview+ tier1 weighted. Simple heuristic without a stored progress %.
  const total = Math.max(m.total_candidates, 1);
  const advanced = m.placed_count * 1.0 + m.interview_count * 0.6 + m.tier1_count * 0.2;
  return Math.min(100, Math.round((advanced / total) * 100));
}

export function ClientOverviewPage() {
  const { data: rawMandates, loading: mandatesLoading } = useClientMandates();
  const { data: activity, loading: activityLoading } = useClientActivity(6);
  const { data: pipeline } = useClientPipelineAnalytics();
  const placedThisQuarter = pipeline?.byStage['HIRED'] ?? pipeline?.byStage['PLACED'] ?? 0;

  const loading = mandatesLoading || activityLoading;

  const mandates: MandateSummary[] = (rawMandates ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    status: m.status || 'Active',
    candidatesCount: m.total_candidates ?? 0,
    progress: progressForMandate(m),
    updatedAt: formatDateShort(m.updated_at),
  }));

  const activeCount = mandates.filter((m) => (m.status || '').toUpperCase() === 'ACTIVE').length;
  const totalCandidates = mandates.reduce((sum, m) => sum + m.candidatesCount, 0);
  const avgProgress = mandates.length
    ? Math.round(mandates.reduce((sum, m) => sum + m.progress, 0) / mandates.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Overview</h1>
        <p className="text-text-secondary text-sm mt-1">Your executive search engagement summary at a glance.</p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeCount}</div>
              <div className="text-xs text-text-muted">Active Mandates</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : totalCandidates}</div>
              <div className="text-xs text-text-muted">Candidates in Pipeline</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Target className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : `${avgProgress}%`}</div>
              <div className="text-xs text-text-muted">Avg. Progress</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{placedThisQuarter}</div>
              <div className="text-xs text-text-muted">Placed (All-time)</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active mandates list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Mandates</CardTitle>
            <button className="text-sm text-fuchsia hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading mandates...</div>
          ) : mandates.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No mandates found.</div>
          ) : (
            <div className="space-y-4">
              {mandates.map((mandate) => (
                <div key={mandate.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text-primary text-sm">{mandate.title}</span>
                      <Badge variant="default">{mandate.status}</Badge>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {mandate.candidatesCount} candidates · Updated {mandate.updatedAt}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-bg-warm rounded-full overflow-hidden">
                      <div
                        className="h-full bg-fuchsia rounded-full transition-all"
                        style={{ width: `${mandate.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-secondary w-8 text-right">{mandate.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading activity...</div>
          ) : (activity ?? []).length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No recent activity.</div>
          ) : (
            <div className="space-y-3">
              {(activity ?? []).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                  <Clock className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-text-primary font-medium">{item.title}</span>
                    <span className="text-sm text-text-secondary ml-2">— {item.detail}</span>
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0">{formatDateShort(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientOverviewPage;
