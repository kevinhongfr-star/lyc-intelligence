/**
 * ClientOverviewPage — B2B Client Portal landing dashboard
 * Renders inside AppShell → Outlet. Shows mandate summary, pipeline metrics, and recent activity.
 */
import React, { useState, useEffect } from 'react';
import { Briefcase, Users, TrendingUp, Clock, ArrowRight, Target, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { fetchClientActivity, getMandates, type ClientActivityEvent, type Mandate } from '@/services/supabaseApi';

interface MandateSummary {
  id: string;
  title: string;
  status: 'Active' | 'On Hold' | 'Closed';
  candidatesCount: number;
  progress: number;
  updatedAt: string;
}

export function ClientOverviewPage() {
  const [mandates, setMandates] = useState<MandateSummary[]>([]);
  const [activities, setActivities] = useState<ClientActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientAccount, profile, isLoading: authLoading } = useTenantContext();

  useEffect(() => {
    if (!profile?.id || authLoading) {
      setLoading(false);
      return;
    }

    const loadMandates = async () => {
      try {
        const result = await getMandates({ userId: profile.id, status: 'active' });
        const mapped: MandateSummary[] = result.data.map((m: Mandate) => ({
          id: m.id,
          title: m.title,
          status: (m.status === 'active' ? 'Active' : m.status === 'on_hold' ? 'On Hold' : 'Closed') as 'Active' | 'On Hold' | 'Closed',
          candidatesCount: m.total_candidates ?? 0,
          progress: m.progress ? parseInt(m.progress, 10) : 0,
          updatedAt: m.updated_at ? new Date(m.updated_at).toLocaleDateString() : '',
        }));
        setMandates(mapped);
      } catch (e) {
        console.error('[ClientOverviewPage] Error:', e);
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };

    loadMandates();
  }, [profile?.id, authLoading]);

  useEffect(() => {
    if (!clientAccount?.id || authLoading) {
      setActivityLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const data = await fetchClientActivity(clientAccount.id);
        setActivities(data);
      } catch (e) {
        console.error('[ClientOverviewPage] Error:', e);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivities();
  }, [clientAccount?.id, authLoading]);

  const activeCount = mandates.filter(m => m.status === 'Active').length;
  const totalCandidates = mandates.reduce((sum, m) => sum + m.candidatesCount, 0);
  const avgProgress = mandates.length
    ? Math.round(mandates.reduce((sum, m) => sum + m.progress, 0) / mandates.length)
    : 0;

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  return (
    <div className="space-y-6">
      {/* Page header with user info */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Overview</h1>
            <p className="text-text-secondary text-sm mt-1">Your executive search engagement summary at a glance.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{organization}</div>
            </div>
          </div>
        </div>
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
          ) : error ? (
            <div className="py-8 text-center text-text-muted text-sm">{error}</div>
          ) : mandates.length === 0 ? (
            <EmptyState
              title="No active mandates"
              description="Your active search mandates will appear here."
            />
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
            {activityLoading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading activity...</div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">No recent activity.</div>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
                  <Clock className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm text-text-primary font-medium">{item.title}</span>
                    <span className="text-sm text-text-secondary ml-2">— {item.detail}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientOverviewPage;
