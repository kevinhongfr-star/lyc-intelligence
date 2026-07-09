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

interface UpcomingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  durationMin: number;
  format: 'Video' | 'In-Person';
  status: 'Confirmed' | 'Pending';
}

interface SessionHistoryItem {
  id: string;
  title: string;
  date: string;
  durationMin: number;
  outcome: 'Completed' | 'Cancelled' | 'No-Show';
  rating: number;
  notes: string;
}

const MOCK_COACH: CoachInfo = {
  name: 'Dr. Amelia Reeves',
  title: 'Executive Career Coach',
  company: 'Former Partner, Spencer Stuart',
  avatarInitials: 'AR',
  rating: 4.9,
  sessionsCompleted: 327,
  specialties: ['C-Suite Transitions', 'Interview Strategy', 'Leadership Presence', 'Compensation Negotiation'],
  bio: 'Amelia has guided 300+ executives through career pivots and C-suite placements. She blends 15 years of executive search with evidence-based coaching frameworks.',
};

const MOCK_UPCOMING: UpcomingSession[] = [
  { id: 'u1', title: 'Career Strategy Review', date: '2025-01-22', time: '10:00 AM', durationMin: 60, format: 'Video', status: 'Confirmed' },
  { id: 'u2', title: 'Interview Prep — CFO Role', date: '2025-01-25', time: '2:30 PM', durationMin: 90, format: 'Video', status: 'Confirmed' },
  { id: 'u3', title: 'Salary Negotiation Workshop', date: '2025-01-29', time: '4:00 PM', durationMin: 45, format: 'Video', status: 'Pending' },
];

const MOCK_HISTORY: SessionHistoryItem[] = [
  { id: 'h1', title: 'LinkedIn Profile Optimization', date: '2025-01-15', durationMin: 60, outcome: 'Completed', rating: 5, notes: 'Refined headline and summary; aligned with VP Engineering target.' },
  { id: 'h2', title: 'Target Company Mapping', date: '2025-01-08', durationMin: 75, outcome: 'Completed', rating: 5, notes: 'Built a list of 12 high-fit companies with warm intro paths.' },
  { id: 'h3', title: 'Networking Outreach Drafting', date: '2024-12-20', durationMin: 45, outcome: 'Completed', rating: 4, notes: 'Drafted 8 outreach messages tailored to alumni network.' },
  { id: 'h4', title: 'Initial Assessment', date: '2024-12-13', durationMin: 90, outcome: 'Completed', rating: 5, notes: 'Established baseline goals and 90-day coaching plan.' },
];

export function CoachingCoachPage() {
  const [coach, setCoach] = useState<CoachInfo | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useTenantContext();

  useEffect(() => {
    // TODO: Replace with real API call to /api/coaching/coach
    const timer = setTimeout(() => {
      setCoach(MOCK_COACH);
      setUpcoming(MOCK_UPCOMING);
      setHistory(MOCK_HISTORY);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const streakDays = 21;
  const completedCount = history.filter(h => h.outcome === 'Completed').length;
  const avgRating =
    history.length > 0
      ? (history.reduce((sum, h) => sum + h.rating, 0) / history.length).toFixed(1)
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
            {loading || !coach ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading coach...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                    <span className="font-serif font-bold text-xl text-fuchsia">{coach.avatarInitials}</span>
                  </div>
                  <div>
                    <div className="font-serif font-semibold text-text-primary">{coach.name}</div>
                    <div className="text-xs text-text-secondary">{coach.title}</div>
                    <div className="text-xs text-text-muted">{coach.company}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber fill-amber" />
                    <span className="text-sm font-medium text-text-primary">{coach.rating}</span>
                  </div>
                  <div className="text-xs text-text-muted">{coach.sessionsCompleted} sessions completed</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-text-secondary mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-1.5">
                    {coach.specialties.map((s) => (
                      <Badge key={s} className="bg-fuchsia-light text-fuchsia">{s}</Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">{coach.bio}</p>

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
              <div className="py-8 text-center text-text-muted text-sm">Loading sessions...</div>
            ) : upcoming.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">No upcoming sessions scheduled.</div>
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
                        {session.status === 'Pending' ? (
                          <Badge variant="warning">Pending</Badge>
                        ) : (
                          <Badge variant="success">Confirmed</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.time} · {session.durationMin}min
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
            <div className="py-8 text-center text-text-muted text-sm">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">No past sessions yet.</div>
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
                      <Badge variant="default">{item.outcome}</Badge>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{item.notes}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < item.rating ? 'text-amber fill-amber' : 'text-border'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-text-muted">{item.date} · {item.durationMin}min</span>
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
