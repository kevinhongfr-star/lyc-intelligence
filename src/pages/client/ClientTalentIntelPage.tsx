/**
 * ClientTalentIntelPage — B2B Client Portal talent intelligence
 * Renders inside AppShell → Outlet. Shows talent market insights,
 * skill trends, and competitive landscape.
 */
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Users, BarChart3, Globe, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface MarketTrend {
  id: string;
  label: string;
  value: string;
  change: number;
  direction: 'up' | 'down';
}

interface SkillDemand {
  id: string;
  skill: string;
  demand: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface TalentPool {
  id: string;
  title: string;
  count: number;
  avgScore: number;
  location: string;
}

const MOCK_TRENDS: MarketTrend[] = [
  { id: 't1', label: 'Active Candidates', value: '12.4K', change: 15, direction: 'up' },
  { id: 't2', label: 'Market Activity', value: 'High', change: 8, direction: 'up' },
  { id: 't3', label: 'Time-to-Hire', value: '42 days', change: -12, direction: 'down' },
  { id: 't4', label: 'Offer Acceptance', value: '78%', change: 5, direction: 'up' },
];

const MOCK_SKILLS: SkillDemand[] = [
  { id: 's1', skill: 'Cloud Architecture', demand: 95, trend: 'increasing' },
  { id: 's2', skill: 'AI/ML Engineering', demand: 88, trend: 'increasing' },
  { id: 's3', skill: 'Data Strategy', demand: 72, trend: 'stable' },
  { id: 's4', skill: 'Cybersecurity', demand: 85, trend: 'increasing' },
  { id: 's5', skill: 'Product Leadership', demand: 68, trend: 'stable' },
  { id: 's6', skill: 'DevOps', demand: 76, trend: 'decreasing' },
];

const MOCK_POOLS: TalentPool[] = [
  { id: 'p1', title: 'VP Engineering — Bay Area', count: 45, avgScore: 92, location: 'San Francisco, CA' },
  { id: 'p2', title: 'CFO — FinTech', count: 28, avgScore: 88, location: 'New York, NY' },
  { id: 'p3', title: 'Head of Product — SaaS', count: 36, avgScore: 90, location: 'Remote' },
  { id: 'p4', title: 'CTO — Series B', count: 15, avgScore: 94, location: 'Austin, TX' },
];

export function ClientTalentIntelPage() {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [skills, setSkills] = useState<SkillDemand[]>([]);
  const [pools, setPools] = useState<TalentPool[]>([]);
  const [loading, setLoading] = useState(true);
  const { clientAccount, profile } = useTenantContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrends(MOCK_TRENDS);
      setSkills(MOCK_SKILLS);
      setPools(MOCK_POOLS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const displayName = clientAccount?.name || profile?.name || 'Client User';
  const organization = clientAccount?.organization || 'Your Organization';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((trend) => (
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
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading skill data...</div>
            ) : (
              <div className="space-y-4">
                {skills.map((item) => (
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
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading talent pools...</div>
            ) : (
              <div className="space-y-3">
                {pools.map((pool) => (
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
                      <div className="text-xs text-fuchsia font-medium">Avg Score: {pool.avgScore}</div>
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
              <h3 className="text-sm font-medium text-text-secondary mb-3">Top Markets</h3>
              <ul className="space-y-2">
                {['San Francisco Bay Area', 'New York City', 'Boston', 'Austin', 'Seattle'].map((city, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-fuchsia-light flex items-center justify-center text-xs font-bold text-fuchsia">{i + 1}</span>
                    {city}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Emerging Roles</h3>
              <ul className="space-y-2">
                {['AI Product Manager', 'ML Engineering Lead', 'Data Privacy Officer', 'Remote Work Strategist', 'Sustainability Officer'].map((role, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-text-primary">
                    <TrendingUp className="w-4 h-4 text-green flex-shrink-0" />
                    {role}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Competitive Insights</h3>
              <div className="space-y-3">
                {[
                  { label: 'Active Searches', value: '156' },
                  { label: 'Average Salary', value: '$245K' },
                  { label: 'Signing Bonus', value: '$35K avg' },
                  { label: 'Equity Range', value: '0.5-2%' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="font-medium text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientTalentIntelPage;