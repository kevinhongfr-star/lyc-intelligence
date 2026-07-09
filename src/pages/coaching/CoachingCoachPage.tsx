/**
 * CoachingCoachPage — B2C Coaching Portal coach dashboard
 * Renders inside AppShell → Outlet. Shows coach info, upcoming sessions,
 * session history, and streak tracking.
 */
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Video,
  Clock,
  Flame,
  Star,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoacheeUpcomingSessions, getCoacheePastSessions, type CoachingSession } from '@/services/supabaseApi';
import { EmptyState } from '@/components/ui';

interface CoachInfo {
  name: string;
  title: string;
  company: string;
  avatarInitials: string;
  rating: number;
  sessionsCompleted: number;
  specialties: string[];
  bio: string;
}

// Static content — coach profile is assigned by admin, not user-queryable
const STATIC_COACH: CoachInfo = {
  name: 'Dr. Amelia Reeves',
  title: 'Executive Career Coach',
  company: 'Former Partner, Spencer Stuart',
  avatarInitials: 'AR',
  rating: 4.9,
  sessionsCompleted: 327,
  specialties: ['C-Suite Transitions', 'Interview Strategy', 'Leadership Presence', 'Compensation Negotiation'],
  bio: 'Amelia has guided 300+ executives through career pivots and C-suite placements. She blends 15 years of executive search with evidence-based coaching frameworks.',
};

export function CoachingCoachPage() {
  const [upcoming, setUpcoming] = useState<CoachingSession[]>([]);
  const [history, setHistory] = useState<CoachingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useTenantContext();

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const fetchSessions = async () => {
      try {
        setError(null);
        const [upcomingData, pastData] = await Promise.all([
          getCoacheeUpcomingSessions(user.id),
          getCoacheePastSessions(user.id),
        ]);
        setUpcoming(upcomingData);
        setHistory(pastData);
      } catch (e) {
        console.error('[CoachingCoachPage] Error:', e);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id]);

  const streakDays = 21;
  const completedCount = history.filter(h => h.status === 'completed').length;
  const avgRating =
    history.length > 0
      ? (history.reduce((sum, h) => sum + (h.rating || 0), 0) / history.length).toFixed(1)
      : '0.0';

  const displayName = profile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Your Coach</h1>
            <p className="text-text-secondary text-sm mt-1">Your coaching relationship and session schedule.</p>
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

      {/* Streak banner */}
      <Card className="p-5 bg-fuchsia-light border-fuchsia-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-fuchsia flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-fuchsia">{streakDays}-Day Streak</div>
              <div className="text-xs text-text-secondary">Keep your momentum going!</div>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-text-primary">{loading ? '—' : completedCount}</div>
              <div className="text-xs text-text-muted">Sessions Done</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-text-primary">{loading ? '—' : avgRating}</div>
              <div className="text-xs text-text-muted">Avg. Rating</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coach info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Coach</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading coach...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <span className="font-serif font-bold text-xl text-fuchsia">{STATIC_COACH.avatarInitials}</span>
                  </div>
                  <div>
                    <div className="font-serif font-semibold text-text-primary">{STATIC_COACH.name}</div>
                    <div className="text-xs text-text-secondary">{STATIC_COACH.title}</div>
                    <div className="text-xs text-text-muted">{STATIC_COACH.company}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber fill-amber" />
                    <span className="text-sm font-medium text-text-primary">{STATIC_COACH.rating}</span>
                  </div>
                  <div className="text-xs text-text-muted">{STATIC_COACH.sessionsCompleted} sessions completed</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-text-secondary mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATIC_COACH.specialties.map((s) => (
                      <Badge key={s} className="bg-fuchsia-light text-fuchsia">{s}</Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">{STATIC_COACH.bio}</p>

                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4" /> Message Coach
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Sessions</CardTitle>
              <Button variant="ghost" size="sm">
                Book Session <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <EmptyState title="Loading sessions..." description="Fetching your coaching schedule." />
            ) : upcoming.length === 0 ? (
              <EmptyState title="No upcoming sessions" description="Schedule a session with your coach to get started." actionLabel="Book Session" onAction={() => {}} />
            ) : (
              <div className="space-y-3">
                {upcoming.map((session) => (
                  <div key={session.id} className="flex items-center gap-4 p-3 border border-border hover:bg-bg-warm transition-colors">
                    <div className="w-11 h-11 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-fuchsia" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary text-sm truncate">{session.title}</span>
                        {session.status === 'confirmed' ? (
                          <Badge className="bg-green/10 text-green">Confirmed</Badge>
                        ) : (
                          <Badge className="bg-amber/10 text-amber">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(session.scheduled_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {session.duration_min}min
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-3 h-3" /> {session.format}
                        </span>
                      </div>
                    </div>
                    <Button variant="default" size="sm">Join</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session history */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
            {loading ? (
              <EmptyState title="Loading history..." description="Fetching your session history." />
            ) : history.length === 0 ? (
              <EmptyState title="No past sessions yet" description="Complete your first coaching session to see it here." />
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 py-3 border-b border-border last:border-b-0">
                    <div className="w-9 h-9 rounded-lg bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-text-primary text-sm">{item.title}</span>
                        <Badge className="bg-green/10 text-green">{item.outcome || item.status}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.notes || 'No notes recorded.'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {item.rating && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < item.rating! ? 'text-amber fill-amber' : 'text-border'}`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-text-muted">{new Date(item.scheduled_at).toLocaleDateString()} · {item.duration_min}min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachingCoachPage;
