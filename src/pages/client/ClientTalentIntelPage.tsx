/**
 * ClientTalentIntelPage — B2B Client Portal talent intelligence
 * Renders inside AppShell → Outlet. Shows talent market insights,
 * skill trends, and competitive landscape.
 * Data sourced from Supabase aggregate queries via getTalentIntel().
 */
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, BarChart3, Globe, ArrowUpRight, ArrowDownRight, User, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getTalentIntel, type TalentIntelData, type MarketTrend, type SkillDemand, type TalentPool } from '@/services/supabaseApi';

export function ClientTalentIntelPage() {
  const [data, setData] = useState<TalentIntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clientAccount, profile } = useTenantContext();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const result = await getTalentIntel(clientAccount?.id);
        if (cancelled) return;
        setData(result);
      } catch (e) {
        console.error('[ClientTalentIntelPage] Error:', e);
        if (!cancelled) setError('Failed to load talent intelligence data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientAccount?.id]);

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

  const fmtSyncTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Talent Intelligence</h1>
            <p className="text-text-secondary text-sm mt-1">Market insights, skill trends, and talent pool analysis.</p>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} className="p-4"><div className="animate-pulse h-16 bg-bg-tertiary rounded" /></Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6"><div className="text-center text-red text-sm">{error}</div></Card>
      ) : !data || data.trends.length === 0 ? (
        <EmptyState
          title="No data yet"
          description="Talent intelligence metrics will appear here once your database has contacts, mandates, and pipeline data."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.trends.map((trend: MarketTrend) => (
              <Card key={trend.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-text-muted">{trend.label}</div>
                    <div className="text-2xl font-bold text-text-primary mt-1">{trend.value}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend.direction === 'up' ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
                  }`}>
                    {trend.direction === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(trend.change)}%
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-fuchsia" />
                  <CardTitle>Skill Demand Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {data.skills.length === 0 ? (
                  <EmptyState title="No skill data" description="Skills will appear here once contacts have skills data." />
                ) : (
                  <div className="space-y-4">
                    {data.skills.map((item: SkillDemand) => (
                      <div key={item.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{item.skill}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.trend}
                            </Badge>
                          </div>
                          <span className="text-sm font-bold text-text-secondary">{item.demand}%</span>
                        </div>
                        <Progress value={item.demand} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-fuchsia" />
                  <CardTitle>Target Talent Pools</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {data.pools.length === 0 ? (
                  <EmptyState title="No talent pools" description="Pools will appear here once candidates are added to mandates." />
                ) : (
                  <div className="space-y-3">
                    {data.pools.map((pool: TalentPool) => (
                      <div key={pool.id} className="flex items-center justify-between p-3 bg-bg-warm rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-text-primary text-sm">{pool.title}</div>
                          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {pool.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-text-primary">{pool.count}</div>
                          <div className="text-xs text-fuchsia font-medium">candidates</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-fuchsia" />
                <CardTitle>Intelligence Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Market Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Active Candidates</span>
                      <span className="font-medium text-text-primary">{data.trends.find(t => t.id === 't1')?.value || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">New Mandates (30d)</span>
                      <span className="font-medium text-text-primary">{data.trends.find(t => t.id === 't2')?.value || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Avg Time-to-Hire</span>
                      <span className="font-medium text-text-primary">{data.trends.find(t => t.id === 't3')?.value || '—'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Offer Acceptance</span>
                      <span className="font-medium text-text-primary">{data.trends.find(t => t.id === 't4')?.value || '—'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Top Skills in Demand</h3>
                  <ul className="space-y-2">
                    {data.skills.slice(0, 5).map((s, i) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm text-text-primary">
                        <span className="w-5 h-5 rounded-full bg-fuchsia-light flex items-center justify-center text-xs font-bold text-fuchsia">{i + 1}</span>
                        {s.skill}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-3">Competitive Insights</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Active Talent Pools</span>
                      <span className="font-medium text-text-primary">{data.pools.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Pool Candidates</span>
                      <span className="font-medium text-text-primary">{data.pools.reduce((sum, p) => sum + p.count, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Tracked Skills</span>
                      <span className="font-medium text-text-primary">{data.skills.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-text-muted text-right">
            Data from last sync: {fmtSyncTime(data.syncedAt)}
          </div>
        </>
      )}
    </div>
  );
}

export default ClientTalentIntelPage;
