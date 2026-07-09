/**
 * CoachingEngagementPage — B2C Coaching Portal engagement metrics
 * Renders inside AppShell → Outlet. Shows engagement scores,
 * activity timeline, and participation stats.
 */
import React, { useState, useEffect } from 'react';
import { Activity, Calendar, MessageSquare, Target, Award, TrendingUp, Clock, User, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoachingCredits, type CoachingCreditData } from '@/services/supabaseApi';

interface ActivityEntry {
  id: string;
  type: 'session' | 'message' | 'goal' | 'milestone';
  title: string;
  description: string;
  date: string;
  duration?: string;
}

interface EngagementMetric {
  id: string;
  label: string;
  value: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

// Activity feed — UI state, not backed by a database table
const STATIC_ACTIVITY: ActivityEntry[] = [
  { id: 'a1', type: 'session', title: 'Coaching Session with Sarah', description: 'Career strategy discussion', date: 'Today, 2:00 PM', duration: '45 min' },
  { id: 'a2', type: 'milestone', title: 'Completed 21-day streak', description: 'Consistent daily check-ins', date: 'Yesterday' },
  { id: 'a3', type: 'message', title: 'Sent message to coach', description: 'Follow-up on interview prep', date: '2 days ago' },
  { id: 'a4', type: 'goal', title: 'Goal updated', description: 'VP-level readiness: 68%', date: '3 days ago' },
  { id: 'a5', type: 'session', title: 'Mock Interview Session', description: 'System design practice', date: '5 days ago', duration: '60 min' },
];

// Engagement metrics — static baseline; credit-related metrics are wired from
// real credit data (getCoachingCredits) at render time.
const STATIC_METRICS: EngagementMetric[] = [
  { id: 'm1', label: 'Weekly Engagement', value: '87%', score: 87, trend: 'up' },
  { id: 'm2', label: 'Session Attendance', value: '95%', score: 95, trend: 'up' },
  { id: 'm3', label: 'Goal Completion', value: '68%', score: 68, trend: 'stable' },
  { id: 'm4', label: 'Community Participation', value: '42%', score: 42, trend: 'up' },
];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  session: <Calendar className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  goal: <Target className="w-4 h-4" />,
  milestone: <Award className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  session: 'bg-fuchsia/10 text-fuchsia',
  message: 'bg-blue/10 text-blue',
  goal: 'bg-green/10 text-green',
  milestone: 'bg-amber/10 text-amber',
};

const TREND_COLORS: Record<string, string> = {
  up: 'text-green',
  down: 'text-red',
  stable: 'text-text-muted',
};

export function CoachingEngagementPage() {
  const [credits, setCredits] = useState<CoachingCreditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useTenantContext();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError('Unable to identify your account.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachingCredits(user.id);
        if (cancelled) return;
        setCredits(data);
        setError(null);
      } catch (e) {
        console.error('[CoachingEngagementPage] Error:', e);
        if (!cancelled) setError('Failed to load engagement data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  // Partially wired metrics: credit-related metrics come from real credit data,
  // the remaining engagement metrics stay static.
  const creditMetrics: EngagementMetric[] = credits
    ? [
        { id: 'c1', label: 'Credits Available', value: String(credits.current_credits), score: credits.total_purchased ? Math.min(100, Math.round((credits.current_credits / credits.total_purchased) * 100)) : 0, trend: 'stable' },
        { id: 'c2', label: 'Credits Used', value: String(credits.used_credits), score: credits.total_purchased ? Math.round((credits.used_credits / credits.total_purchased) * 100) : 0, trend: 'up' },
      ]
    : [];
  const metrics: EngagementMetric[] = [...creditMetrics, ...STATIC_METRICS];

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / (metrics.length || 1));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Engagement</h1>
            <p className="text-text-secondary text-sm mt-1">Your activity, participation, and overall engagement metrics.</p>
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

      <Card className="bg-fuchsia-light/30 border-fuchsia/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-fuchsia" />
                <span className="font-serif font-bold text-xl text-text-primary">Overall Engagement Score</span>
              </div>
              <p className="text-text-secondary text-sm">You're in the top 15% of active coachees this month!</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-fuchsia">{overallScore}</div>
              <div className="text-xs text-text-muted mt-1">out of 100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!loading && error && (
        <Card>
          <CardContent>
            <div className="py-6 text-center text-red text-sm">{error}</div>
          </CardContent>
        </Card>
      )}
      {!loading && !error && !credits && (
        <EmptyState title="No credit data available" description="Your coaching credit balance and usage will appear here once credit data is available." />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-text-secondary">{metric.label}</div>
              <Badge className={TYPE_COLORS[metric.trend === 'up' ? 'milestone' : metric.trend === 'down' ? 'goal' : 'message']}>
                {metric.trend}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-3">{metric.value}</div>
            <Progress value={metric.score} className="h-2" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-fuchsia" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STATIC_ACTIVITY.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-bg-warm rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[entry.type]}`}>
                    {TYPE_ICONS[entry.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary text-sm">{entry.title}</span>
                      <span className="text-xs text-text-muted">{entry.date}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">{entry.description}</div>
                    {entry.duration && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        <Clock className="w-3 h-3 mr-1" /> {entry.duration}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-fuchsia" />
                <CardTitle>This Week</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Sessions</span>
                    <span className="font-bold text-text-primary">3 / 4</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Messages</span>
                    <span className="font-bold text-text-primary">12</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-blue rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Goals Updated</span>
                    <span className="font-bold text-text-primary">2</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-green rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Resources Viewed</span>
                    <span className="font-bold text-text-primary">8</span>
                  </div>
                  <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="h-full bg-amber rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-5xl font-bold text-fuchsia">21</div>
                <div className="text-sm text-text-secondary mt-1">days</div>
                <div className="text-xs text-text-muted mt-2">Keep it up! You're on fire.</div>
                <Button className="mt-4" size="sm">
                  Check In Today
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CoachingEngagementPage;
