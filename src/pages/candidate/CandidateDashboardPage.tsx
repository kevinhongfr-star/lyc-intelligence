/**
 * CandidateDashboardPage — Candidate Portal landing dashboard
 * Renders inside AppShell → Outlet. Shows application status cards, upcoming
 * interviews, latest assessment results, and career progress.
 */
import React from 'react';
import { Briefcase, Calendar, ClipboardCheck, TrendingUp, ArrowRight, Clock, Video, MapPin, Star } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress } from '@/components/ui';
import {
  useCandidateApplications,
  useCandidateInterviews,
  useCandidateAssessments,
  useCandidateProfile,
} from '@/hooks/usePortalData';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface ApplicationStatus {
  id: string;
  company: string;
  role: string;
  status: string;
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

const STATUS_COLORS: Record<string, string> = {
  'Under Review': 'bg-amber/10 text-amber',
  'Submitted to Client': 'bg-blue/10 text-blue',
  'Interview Stage': 'bg-fuchsia-light text-fuchsia',
  'Offer Stage': 'bg-green/10 text-green',
  'Placed': 'bg-green/10 text-green',
  HIRED: 'bg-green/10 text-green',
  PLACED: 'bg-green/10 text-green',
  OFFER: 'bg-green/10 text-green',
  OFFER_EXTENDED: 'bg-green/10 text-green',
  INTERVIEW: 'bg-fuchsia-light text-fuchsia',
  INTERVIEWING: 'bg-fuchsia-light text-fuchsia',
  CLIENT: 'bg-blue/10 text-blue',
  CLIENT_REVIEW: 'bg-blue/10 text-blue',
  SWEEP: 'bg-amber/10 text-amber',
  ACTIVE: 'bg-blue/10 text-blue',
  REJECTED: 'bg-text-muted/10 text-text-muted',
};

function progressForStatus(status: string | null | undefined): number {
  const s = (status || '').toUpperCase();
  if (s === 'HIRED' || s === 'PLACED') return 100;
  if (s === 'OFFER' || s === 'OFFER_EXTENDED') return 85;
  if (s === 'INTERVIEW' || s === 'INTERVIEWING') return 60;
  if (s === 'CLIENT' || s === 'CLIENT_REVIEW') return 40;
  if (s === 'SWEEP' || s === 'ACTIVE') return 20;
  if (s === 'REJECTED') return 100;
  return 30;
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function CandidateDashboardPage() {
  const { data: profile } = useCandidateProfile();
  const { data: rawApps, loading: appsLoading } = useCandidateApplications();
  const { data: rawInterviews, loading: interviewsLoading } = useCandidateInterviews();
  const { data: rawAssessments, loading: assessmentsLoading } = useCandidateAssessments();

  // Derive profile completion from actual data signals (not a hardcoded goal list)
  const fields = profile
    ? [
        !!profile.current_title,
        !!profile.location || !!profile.country,
        !!profile.skills && profile.skills.length > 0,
        !!profile.years_of_experience,
        !!profile.comp_current,
        !!profile.headline,
      ]
    : [false];
  const profileCompletion = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const goals: CareerGoal[] = fields.map((done, i) => ({
    id: `g${i}`,
    label: ['Profile basics', 'Location set', 'Skills added', 'Years of experience', 'Comp disclosed', 'Headline written'][i] || `Field ${i + 1}`,
    progress: done ? 100 : 0,
  }));

  // Map Supabase rows to UI shape
  const applications: ApplicationStatus[] = (rawApps ?? []).map((a) => {
    const company = a.mandate?.company?.name ?? '—';
    const role = a.mandate?.title ?? '—';
    const statusLabel = (a.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: a.id,
      company,
      role,
      status: statusLabel,
      progress: progressForStatus(a.status),
      updatedAt: formatDateShort(a.updated_at),
    };
  });

  const interviews: UpcomingInterview[] = (rawInterviews ?? []).map((iv) => ({
    id: iv.id,
    company: '—', // title is the event name; mandate join happens in dedicated view
    role: iv.title || 'Interview',
    date: formatDateShort(iv.start_time),
    time: formatTime(iv.start_time),
    format: iv.location?.toLowerCase().includes('zoom') || iv.location?.toLowerCase().includes('video') ? 'Video' : 'On-site',
    location: iv.location || 'TBD',
  }));

  const latestAssessment = (rawAssessments ?? [])[0];
  const assessment: AssessmentResult | null = latestAssessment
    ? {
        id: latestAssessment.id,
        name: latestAssessment.assessment_type,
        archetype: latestAssessment.archetype || 'Unclassified',
        score: latestAssessment.composite_score ?? 0,
        takenAt: formatDateShort(latestAssessment.created_at),
        dimensions: Object.entries((latestAssessment.scores as Record<string, number>) || {}).map(([name, score]) => ({ name, score })),
      }
    : null;

  const loading = appsLoading || interviewsLoading || assessmentsLoading;

  const activeCount = applications.length;
  const interviewCount = interviews.length;
  const assessmentCount = assessment ? 1 : 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-text-primary">Candidate Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Your career journey at a glance.</p>
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
            ) : applications.length === 0 ? (
              <div className="py-8 text-center text-text-muted text-sm">No active applications yet.</div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-text-primary text-sm">{app.role}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[app.status] || 'bg-fuchsia-light text-fuchsia'}`}>
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
              <div className="py-8 text-center text-text-muted text-sm">No interviews scheduled.</div>
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
          {loading || !assessment ? (
            <div className="py-8 text-center text-text-muted text-sm">{loading ? 'Loading results...' : 'No assessments taken yet.'}</div>
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
