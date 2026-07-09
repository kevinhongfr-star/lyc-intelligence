/**
 * ClientPipelineAnalyticsPage — B2B Client Portal pipeline analytics
 * Renders inside AppShell → Outlet.
 */
import React from 'react';
import { TrendingUp, Users, Clock, Target, BarChart3, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

const STAGES = [
  { name: 'Sourcing', count: 48, percentage: 100, color: 'bg-blue' },
  { name: 'Screening', count: 32, percentage: 67, color: 'bg-fuchsia' },
  { name: 'Shortlisted', count: 15, percentage: 31, color: 'bg-amber' },
  { name: 'Interview', count: 8, percentage: 17, color: 'bg-lens' },
  { name: 'Offer', count: 3, percentage: 6, color: 'bg-green' },
  { name: 'Placed', count: 2, percentage: 4, color: 'bg-green' },
];

const TRENDS = [
  { month: 'Sep', candidates: 12, mandates: 3 },
  { month: 'Oct', candidates: 18, mandates: 4 },
  { month: 'Nov', candidates: 24, mandates: 5 },
  { month: 'Dec', candidates: 22, mandates: 5 },
  { month: 'Jan', candidates: 30, mandates: 6 },
];

export function ClientPipelineAnalyticsPage() {
  const { clientAccount, profile } = useTenantContext();
  const maxCandidates = Math.max(...TRENDS.map(t => t.candidates));
  const conversionRate = ((2 / 48) * 100).toFixed(1);
  const avgTimeToPlace = 68;

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Pipeline Analytics</h1>
            <p className="text-text-secondary text-sm mt-1">Real-time funnel metrics and conversion trends.</p>
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

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Users className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">48</div>
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
              <div className="text-2xl font-bold text-text-primary">{avgTimeToPlace}d</div>
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
              <div className="text-2xl font-bold text-text-primary">+25%</div>
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
          <div className="space-y-4">
            {STAGES.map((stage) => (
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
        </CardContent>
      </Card>

      {/* Monthly trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4 h-48">
            {TRENDS.map((trend) => (
              <div key={trend.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className="w-8 bg-fuchsia rounded-t transition-all hover:bg-fuchsia/80 cursor-pointer relative group"
                    style={{ height: `${(trend.candidates / maxCandidates) * 100}%` }}
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
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientPipelineAnalyticsPage;
