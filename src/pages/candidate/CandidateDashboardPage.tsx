/**
 * CandidateDashboardPage — Candidate Portal landing dashboard
 * Renders inside AppShell → Outlet. Shows application status cards, upcoming
 * interviews, latest assessment results, and career progress.
 */
import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, ClipboardCheck, TrendingUp, ArrowRight, Clock, Video, MapPin, Star, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getOffers, getAssessmentInvitations } from '@/services/supabaseApi';

interface ApplicationStatus {
  id: string;
  company: string;
  role: string;
  status: 'Under Review' | 'Submitted to Client' | 'Interview Stage' | 'Offer Stage' | 'Placed';
  progress: number;
  updatedAt: string;
}

interface UpcomingInterview {
  id: string;
  company: string;
  role: string;
  date: string;
  time: string;
  format: string;
  location: string;
}

interface AssessmentResult {
  id: string;
  name: string;
  archetype: string;
  score: number;
  takenAt: string;
  dimensions: { name: string; score: number }[];
}

interface CareerGoal {
  id: string;
  label: string;
  progress: number;
}

const STATIC_INTERVIEWS: UpcomingInterview[] = [
  { id: 'i1', company: 'TechCorp', role: 'VP Engineering', date: 'Jan 22, 2025', time: '10:00 AM', format: 'Video', location: 'Zoom' },
  { id: 'i2', company: 'CloudPeak', role: 'CTO', date: 'Jan 24, 2025', time: '2:30 PM', format: 'On-site', location: 'Seattle, WA' },
];

const STATIC_GOALS: CareerGoal[] = [
  { id: 'g1', label: 'Complete profile', progress: 100 },
  { id: 'g2', label: 'Take baseline assessment', progress: 100 },
  { id: 'g3', label: 'Apply to 3 target roles', progress: 67 },
  { id: 'g4', label: 'Complete interview prep', progress: 45 },
];

const STATUS_COLORS: Record<ApplicationStatus['status'], string> = {
  'Under Review': 'bg-amber/10 text-amber',
  'Submitted to Client': 'bg-blue/10 text-blue',
  'Interview Stage': 'bg-fuchsia-light text-fuchsia',
  'Offer Stage': 'bg-green/10 text-green',
  'Placed': 'bg-green/10 text-green',
};

export function CandidateDashboardPage() {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [interviews, setInterviews] = useState<UpcomingInterview[]>([]);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    async function loadData() {
      try {
        const offersResult = await getOffers();
        const offers = Array.isArray(offersResult) ? offersResult : (offersResult as any).data || [];
        const mappedOffers: ApplicationStatus[] = offers.map((o: any) => ({
          id: o.id,
          company: o.client_name || 'Unknown',
          role: o.position_title || 'Position',
          status: (o.status === 'accepted' ? 'Offer Stage' : o.status === 'sent' ? 'Submitted to Client' : 'Under Review') as ApplicationStatus['status'],
          progress: o.status === 'accepted' ? 85 : o.status === 'sent' ? 40 : 20,
          updatedAt: o.updated_at?.split('T')[0] || o.created_at?.split('T')[0] || '',
        }));
        setApplications(mappedOffers);

        setInterviews(STATIC_INTERVIEWS);

        if (candidateProfile?.id) {
          try {
            const invitations = await getAssessmentInvitations(candidateProfile.id);
            const completed = invitations.filter((i: any) => i.status === 'completed');
            if (completed.length > 0) {
              const latest = completed[0];
              setAssessment({
                id: latest.id,
                name: latest.assessment_title || 'Assessment',
                archetype: 'Completed',
                score: 0,
                takenAt: latest.invited_at?.split('T')[0] || '',
                dimensions: [],
              });
            }
          } catch (e) {
            console.error('[CandidateDashboardPage] Assessment error:', e);
          }
        }

        setGoals(STATIC_GOALS);
      } catch (e) {
        console.error('[CandidateDashboardPage] Error:', e);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [candidateProfile?.id]);

  const activeCount = applications.length;
  const interviewCount = interviews.length;
  const assessmentCount = assessment ? 1 : 0;
  const profileCompletion = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header with user info */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Candidate Dashboard</h1>
            <p className="text-text-secondary text-sm mt-1">Your career journey at a glance.</p>
          </div>
          <div className="flex items-center gap-3 bg-bg-warm px-4 py-2 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-fuchsia-light flex items-center justify-center">
              <User className="w-4 h-4 text-fuchsia" />
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">{displayName}</div>
              <div className="text-xs text-text-muted">{currentTitle}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : activeCount}</div>
              <div className="text-xs text-text-muted">Active Applications</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Calendar className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : interviewCount}</div>
              <div className="text-xs text-text-muted">Upcoming Interviews</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : assessmentCount}</div>
              <div className="text-xs text-text-muted">Assessments Completed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{loading ? '—' : `${profileCompletion}%`}</div>
              <div className="text-xs text-text-muted">Profile Completion</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Application Status</CardTitle>
              <button className="text-sm text-fuchsia hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading applications...</div>
            ) : error ? (
              <EmptyState title="Failed to load" description="Could not load applications. Please try again later." />
            ) : applications.length === 0 ? (
              <EmptyState title="No applications yet" description="You don't have any active applications at this time." />
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-text-primary text-sm">{app.role}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[app.status]}`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {app.company} · Updated {app.updatedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-bg-warm rounded-full overflow-hidden">
                        <div className="h-full bg-fuchsia rounded-full transition-all" style={{ width: `${app.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium text-text-secondary w-8 text-right">{app.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming interviews */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading interviews...</div>
            ) : interviews.length === 0 ? (
              <EmptyState title="No interviews scheduled" description="No upcoming interviews at this time." />
            ) : (
              <div className="space-y-4">
                {interviews.map((iv) => (
                  <div key={iv.id} className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center flex-shrink-0">
                      {iv.format === 'Video' ? <Video className="w-5 h-5 text-fuchsia" /> : <MapPin className="w-5 h-5 text-fuchsia" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary text-sm">{iv.role} — {iv.company}</div>
                      <div className="text-xs text-text-muted mt-1 flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {iv.date}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {iv.time}</span>
                        <span>{iv.format} · {iv.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment results */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Assessment Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading results...</div>
          ) : !assessment ? (
            <EmptyState title="No assessments yet" description="You haven't completed any assessments yet." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-center text-center bg-fuchsia-light rounded-lg p-6">
                <Star className="w-8 h-8 text-fuchsia mb-2" />
                <div className="text-xs text-text-muted uppercase tracking-wide">Your Archetype</div>
                <div className="font-serif font-bold text-xl text-text-primary mt-1">{assessment.archetype}</div>
                <div className="text-sm text-text-secondary mt-2">{assessment.score}/100 overall</div>
              </div>
              <div className="lg:col-span-2 space-y-3">
                {assessment.dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-primary">{dim.name}</span>
                      <span className="text-text-secondary font-medium">{dim.score}</span>
                    </div>
                    <Progress value={dim.score} />
                  </div>
                ))}
                <div className="text-xs text-text-muted pt-2">Taken on {assessment.takenAt}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career progress */}
      <Card>
        <CardHeader>
          <CardTitle>Career Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading progress...</div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text-primary">{goal.label}</span>
                    <span className="text-text-secondary font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CandidateDashboardPage;
