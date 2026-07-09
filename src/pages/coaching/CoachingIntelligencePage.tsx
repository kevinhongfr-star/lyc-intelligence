/**
 * CoachingIntelligencePage — B2C Coaching Portal intelligence dashboard
 * Renders inside AppShell → Outlet. Shows engagement analytics,
 * progress insights, and personalized recommendations.
 */
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Activity, Sparkles, BarChart3, Target, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface InsightMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  direction: 'up' | 'down';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'Growth' | 'Career' | 'Skills' | 'Network';
  priority: 'High' | 'Medium' | 'Low';
}

const MOCK_METRICS: InsightMetric[] = [
  { id: 'm1', label: 'Engagement Score', value: '87', change: 12, direction: 'up' },
  { id: 'm2', label: 'Session Velocity', value: '2.4/wk', change: 8, direction: 'up' },
  { id: 'm3', label: 'Goal Progress', value: '68%', change: -3, direction: 'down' },
  { id: 'm4', label: 'Skill Velocity', value: 'High', change: 15, direction: 'up' },
];

const MOCK_RECS: Recommendation[] = [
  { id: 'r1', title: 'Focus on System Design Mastery', description: 'Your assessment shows strong potential. Dedicated practice would accelerate your path to principal engineer.', category: 'Skills', priority: 'High' },
  { id: 'r2', title: 'Expand Industry Network', description: 'Connect with 3 senior leaders in your target companies this month.', category: 'Network', priority: 'High' },
  { id: 'r3', title: 'Refine Executive Presence', description: 'Practice high-stakes presentations with your coach to strengthen communication.', category: 'Growth', priority: 'Medium' },
  { id: 'r4', title: 'Update Career Narrative', description: 'Refresh your positioning story to align with VP-level opportunities.', category: 'Career', priority: 'Medium' },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-fuchsia/10 text-fuchsia',
  Medium: 'bg-amber/10 text-amber',
  Low: 'bg-blue/10 text-blue',
};

const CATEGORY_COLORS: Record<string, string> = {
  Growth: 'bg-fuchsia/10 text-fuchsia',
  Career: 'bg-blue/10 text-blue',
  Skills: 'bg-green/10 text-green',
  Network: 'bg-amber/10 text-amber',
};

export function CoachingIntelligencePage() {
  const [metrics, setMetrics] = useState<InsightMetric[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useTenantContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics(MOCK_METRICS);
      setRecommendations(MOCK_RECS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">B2C Intelligence</h1>
            <p className="text-text-secondary text-sm mt-1">Personalized insights and AI-powered recommendations for your growth.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{tier}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-text-muted">{metric.label}</div>
                <div className="text-2xl font-bold text-text-primary mt-1">{metric.value}</div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                metric.direction === 'up' ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
              }`}>
                {metric.direction === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(metric.change)}%
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-fuchsia" />
              <CardTitle>AI Recommendations</CardTitle>
              <Badge variant="outline" className="ml-auto text-xs">Personalized</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading recommendations...</div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="p-4 bg-bg-warm rounded-lg hover:shadow-card-hover transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-text-primary text-sm">{rec.title}</span>
                          <Badge className={CATEGORY_COLORS[rec.category]}>{rec.category}</Badge>
                        </div>
                        <div className="text-xs text-text-muted">{rec.description}</div>
                      </div>
                      <Badge className={PRIORITY_COLORS[rec.priority]}>{rec.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-fuchsia" />
                <CardTitle>Weekly Pulse</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Mon', value: 65 },
                  { label: 'Tue', value: 80 },
                  { label: 'Wed', value: 45 },
                  { label: 'Thu', value: 90 },
                  { label: 'Fri', value: 70 },
                  { label: 'Sat', value: 30 },
                  { label: 'Sun', value: 55 },
                ].map((day) => (
                  <div key={day.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-secondary">{day.label}</span>
                      <span className="text-text-muted">{day.value}%</span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-fuchsia rounded-full" style={{ width: `${day.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia" />
                <CardTitle>Quick Wins</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  'Complete today\'s reflection',
                  'Schedule next coaching session',
                  'Review your growth milestones',
                ].map((action, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 hover:bg-fuchsia-light/30 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                  >
                    <Target className="w-4 h-4 text-fuchsia" />
                    {action}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-fuchsia" />
            <CardTitle>Growth Trajectory</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-text-muted mb-2">3-Month Trend</div>
              <div className="text-3xl font-bold text-green">+34%</div>
              <div className="text-xs text-text-muted mt-1">vs. previous quarter</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-2">Top Skill Growth</div>
              <div className="text-3xl font-bold text-fuchsia">Leadership</div>
              <div className="text-xs text-text-muted mt-1">+42 points since start</div>
            </div>
            <div>
              <div className="text-sm text-text-muted mb-2">Next Milestone</div>
              <div className="text-3xl font-bold text-text-primary">15 days</div>
              <div className="text-xs text-text-muted mt-1">VP-level readiness</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-secondary">Overall Progress to Goal</span>
              <span className="font-bold text-text-primary">68%</span>
            </div>
            <Progress value={68} className="h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingIntelligencePage;
