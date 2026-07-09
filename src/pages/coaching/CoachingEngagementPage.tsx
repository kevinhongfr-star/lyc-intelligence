/**
 * CoachingEngagementPage — B2C Coaching Portal engagement metrics
 * Renders inside AppShell → Outlet. Shows engagement scores,
 * activity timeline, and participation stats.
 */
import React, { useState, useEffect } from 'react';
import { Activity, Calendar, MessageSquare, Target, Award, TrendingUp, Clock, User, Sparkles, Flame } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoachingCredits, type CoachingCreditData, getCoacheeUpcomingSessions, getCoacheePastSessions, type CoachingSession } from '@/services/supabaseApi';

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
  const [upcoming, setUpcoming] = useState<CoachingSession[]>([]);
  const [past, setPast] = useState<CoachingSession[]>([]);
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
        const [creditsData, upcomingData, pastData] = await Promise.all([
          getCoachingCredits(user.id),
          getCoacheeUpcomingSessions(user.id),
          getCoacheePastSessions(user.id),
        ]);
        if (cancelled) return;
        setCredits(creditsData);
        setUpcoming(upcomingData);
        setPast(pastData);
        setError(null);
      } catch (e) {
        console.error('[CoachingEngagementPage] Error:', e);
        if (!cancelled) setError('Failed to load engagement data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  const totalSessions = past.length + upcoming.length;
  const completedSessions = past.filter(s => s.status === 'completed').length;
  const completionRate = past.length > 0 ? Math.round((completedSessions / past.length) * 100) : 0;

  const computeStreak = (sessions: CoachingSession[]): number => {
    const completed = sessions
      .filter(s => s.status === 'completed')
      .map(s => new Date(s.scheduled_at).toDateString());
    const uniqueDays = [...new Set(completed)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (uniqueDays.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (new Date(uniqueDays[i]).toDateString() === expected.toDateString()) {
        streak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (new Date(uniqueDays[i]).toDateString() === yesterday.toDateString()) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  };

  const streakDays = computeStreak(past);

  const sessionMetrics: EngagementMetric[] = [
    { id: 's1', label: 'Total Sessions', value: String(totalSessions), score: Math.min(100, totalSessions * 10), trend: totalSessions > 0 ? 'up' : 'stable' },
    { id: 's2', label: 'Completion Rate', value: `${completionRate}%`, score: completionRate, trend: completionRate > 50 ? 'up' : 'stable' },
  ];

  const streakMetric: EngagementMetric = {
    id: 'st1',
    label: 'Engagement Streak',
    value: `${streakDays} days`,
    score: Math.min(100, streakDays * 7),
    trend: streakDays > 0 ? 'up' : 'stable',
  };

  const creditMetrics: EngagementMetric[] = credits
    ? [
        { id: 'c1', label: 'Credits Available', value: String(credits.current_credits), score: credits.total_purchased ? Math.min(100, Math.round((credits.current_credits / credits.total_purchased) * 100)) : 0, trend: 'stable' },
        { id: 'c2', label: 'Credits Used', value: String(credits.used_credits), score: credits.total_purchased ? Math.round((credits.used_credits / credits.total_purchased) * 100) : 0, trend: 'up' },
      ]
    : [];

  const metrics: EngagementMetric[] = [...sessionMetrics, streakMetric, ...creditMetrics];

  const overallScore = metrics.length
    ? Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length)
    : 0;

  const activity: ActivityEntry[] = past.slice(0, 8).map((s) => ({
    id: `sess-${s.id}`,
    type: 'session' as const,
    title: s.title,
    description: `${s.format} session · ${s.duration_min} min`,
    date: new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: `${s.duration_min} min`,
  }));

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
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading activity...</div>
            ) : activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Your coaching session activity will appear here."
              />
            ) : (
            <div className="space-y-3">
              {activity.map((entry) => (
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
            )}
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
                    <span className="text-text-secondary">Sessions Completed</span>
                    <span className="font-bold text-text-primary">{completedSessions}</span>
                  </div>
                  <Progress value={Math.min(100, completedSessions * 25)} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Upcoming</span>
                    <span className="font-bold text-text-primary">{upcoming.length}</span>
                  </div>
                  <Progress value={Math.min(100, upcoming.length * 50)} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Completion Rate</span>
                    <span className="font-bold text-text-primary">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-secondary">Streak</span>
                    <span className="font-bold text-text-primary">{streakDays} days</span>
                  </div>
                  <Progress value={Math.min(100, streakDays * 5)} className="h-2" />
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
                <div className="text-5xl font-bold text-fuchsia">{streakDays}</div>
                <div className="text-sm text-text-secondary mt-1">days</div>
                <div className="text-xs text-text-muted mt-2">
                  {streakDays === 0 ? 'No sessions yet. Book your first session!' : streakDays >= 7 ? 'Great consistency!' : 'Keep it up!'}
                </div>
                <div className="flex items-center justify-center mt-3">
                  <Flame className="w-5 h-5 text-amber" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CoachingEngagementPage;
