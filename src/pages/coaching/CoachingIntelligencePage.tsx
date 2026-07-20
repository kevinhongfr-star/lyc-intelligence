/**
 * CoachingIntelligencePage — B2C Coaching Portal intelligence dashboard
 * Renders inside AppShell → Outlet. Shows engagement analytics,
 * progress insights, and personalized AI-powered recommendations.
 */
import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Activity, Sparkles, BarChart3, Target, ArrowUpRight, ArrowDownRight, User, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoacheeUpcomingSessions, getCoacheePastSessions, type CoachingSession } from '@/services/supabaseApi';
import {
  intelligenceService,
  type Recommendation,
} from '@/services/intelligenceService';

interface InsightMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  direction: 'up' | 'down';
}

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
  const [upcoming, setUpcoming] = useState<CoachingSession[]>([]);
  const [past, setPast] = useState<CoachingSession[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useTenantContext();

  useEffect(() => {
    if (!user?.id) { setLoading(false); setRecsLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [up, pst] = await Promise.all([
          getCoacheeUpcomingSessions(user.id),
          getCoacheePastSessions(user.id),
        ]);
        if (cancelled) return;
        setUpcoming(up);
        setPast(pst);
        setError(null);
      } catch (e) {
        console.error('[CoachingIntelligencePage] Error:', e);
        if (!cancelled) setError('Failed to load session data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (loading || !profile) return;
    let cancelled = false;
    (async () => {
      setRecsLoading(true);
      try {
        const context = intelligenceService.extractContext(profile, past, upcoming);
        const recs = await intelligenceService.generateRecommendations(context);
        if (cancelled) return;
        setRecommendations(recs);
      } catch (e) {
        console.error('[CoachingIntelligencePage] Failed to generate recommendations:', e);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loading, profile, past, upcoming]);

  const refreshRecommendations = async () => {
    if (!profile) return;
    setRecsLoading(true);
    try {
      const context = intelligenceService.extractContext(profile, past, upcoming);
      const recs = await intelligenceService.generateRecommendations(context);
      setRecommendations(recs);
    } catch (e) {
      console.error('[CoachingIntelligencePage] Refresh failed:', e);
    } finally {
      setRecsLoading(false);
    }
  };

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  const totalSessions = past.length + upcoming.length;
  const completedSessions = past.filter(s => s.status === 'completed').length;
  const completionRate = past.length > 0 ? Math.round((completedSessions / past.length) * 100) : 0;
  const upcomingCount = upcoming.length;

  const dynamicMetrics: InsightMetric[] = [
    { id: 'm1', label: 'Total Sessions', value: String(totalSessions), change: 12, direction: 'up' },
    { id: 'm2', label: 'Completed', value: String(completedSessions), change: 8, direction: 'up' },
    { id: 'm3', label: 'Completion Rate', value: `${completionRate}%`, change: completionRate > 50 ? 5 : -3, direction: completionRate > 50 ? 'up' : 'down' },
    { id: 'm4', label: 'Upcoming', value: String(upcomingCount), change: upcomingCount > 0 ? 2 : 0, direction: upcomingCount > 0 ? 'up' : 'up' },
  ];

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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <Card key={i} className="p-4"><div className="animate-pulse h-16 bg-bg-tertiary rounded" /></Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6"><div className="text-center text-red text-sm">{error}</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicMetrics.map((metric) => (
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-fuchsia" />
              <CardTitle>AI Recommendations</CardTitle>
              <Badge variant="outline" className="ml-auto text-xs">Personalized</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshRecommendations}
                disabled={recsLoading}
                className="ml-2"
              >
                <RefreshCw className={`w-3 h-3 ${recsLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-bg-tertiary rounded-lg" />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <EmptyState
                title="No recommendations yet"
                description="Complete a few coaching sessions to receive personalized AI recommendations."
              />
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
          {loading ? (
            <div className="animate-pulse h-32 bg-bg-tertiary rounded" />
          ) : error || (totalSessions === 0) ? (
            <EmptyState
              title="No session data yet"
              description="Your growth metrics will appear here once you've had coaching sessions."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-text-muted mb-2">Completed Sessions</div>
                  <div className="text-3xl font-bold text-green">{completedSessions}</div>
                  <div className="text-xs text-text-muted mt-1">total attended</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted mb-2">Upcoming</div>
                  <div className="text-3xl font-bold text-fuchsia">{upcomingCount}</div>
                  <div className="text-xs text-text-muted mt-1">sessions scheduled</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted mb-2">Completion Rate</div>
                  <div className="text-3xl font-bold text-text-primary">{completionRate}%</div>
                  <div className="text-xs text-text-muted mt-1">of past sessions</div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary">Overall Progress to Goal</span>
                  <span className="font-bold text-text-primary">{Math.min(100, completionRate)}%</span>
                </div>
                <Progress value={Math.min(100, completionRate)} className="h-3" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingIntelligencePage;