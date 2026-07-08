/**
 * ClientOverviewPage — B2B Client Portal landing dashboard
 * Renders inside AppShell → Outlet. Shows mandate summary, pipeline metrics, and recent activity.
 */
import React, { useState, useEffect } from 'react';
import { Briefcase, Users, TrendingUp, Clock, ArrowRight, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

interface MandateSummary {
  id: string;
  title: string;
  status: 'Active' | 'On Hold' | 'Closed';
  candidatesCount: number;
  progress: number;
  updatedAt: string;
}

const MOCK_MANDATES: MandateSummary[] = [
  { id: 'm1', title: 'VP Engineering — TechCorp', status: 'Active', candidatesCount: 24, progress: 65, updatedAt: '2025-01-15' },
  { id: 'm2', title: 'CFO — FinScale', status: 'Active', candidatesCount: 18, progress: 40, updatedAt: '2025-01-14' },
  { id: 'm3', title: 'Head of Product — DataMesh', status: 'On Hold', candidatesCount: 8, progress: 20, updatedAt: '2025-01-10' },
];

export function ClientOverviewPage() {
  const [mandates, setMandates] = useState<MandateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API call to /api/client/mandates
    const timer = setTimeout(() => {
      setMandates(MOCK_MANDATES);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const activeCount = mandates.filter(m => m.status === 'Active').length;
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
              <div className="text-2xl font-bold text-text-primary">2</div>
              <div className="text-xs text-text-muted">Placed This Quarter</div>
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
          <div className="space-y-3">
            {[
              { action: 'New candidate added', detail: 'Sarah Chen — VP Engineering', time: '2h ago' },
              { action: 'Interview scheduled', detail: 'Michael Wong — CFO, FinScale', time: '5h ago' },
              { action: 'Report generated', detail: 'Talent Deep-Dive: TechCorp pipeline', time: '1d ago' },
              { action: 'Mandate updated', detail: 'Head of Product — DataMesh put on hold', time: '3d ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                <Clock className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm text-text-primary font-medium">{item.action}</span>
                  <span className="text-sm text-text-secondary ml-2">— {item.detail}</span>
                </div>
                <span className="text-xs text-text-muted flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientOverviewPage;
