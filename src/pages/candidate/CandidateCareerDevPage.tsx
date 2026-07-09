/**
 * CandidateCareerDevPage — Candidate Portal career development tracker
 * Renders inside AppShell → Outlet. Shows learning goals, skills progress,
 * certifications, and career path planning.
 */
import React, { useState, useEffect } from 'react';
import { Target, Trophy, BookOpen, Award, TrendingUp, CheckCircle2, Circle, User, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import { getCoacheePastSessions, getAssessmentInvitations, type CoachingSession, type AssessmentInvitation } from '@/services/supabaseApi';

interface LearningGoal {
  id: string;
  title: string;
  category: 'Skill' | 'Certification' | 'Project' | 'Network';
  progress: number;
  deadline: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  date?: string;
}

// Static content — skills tracking has no direct table backing
const STATIC_SKILLS = [
  { id: 's1', skill: 'System Design', level: 85, target: 95, category: 'Engineering' },
  { id: 's2', skill: 'Leadership', level: 78, target: 90, category: 'Management' },
  { id: 's3', skill: 'Strategic Planning', level: 70, target: 85, category: 'Business' },
  { id: 's4', skill: 'Public Speaking', level: 65, target: 80, category: 'Communication' },
  { id: 's5', skill: 'Product Vision', level: 72, target: 88, category: 'Product' },
];

// Static content — career milestones, no direct table backing
const STATIC_MILESTONES: Milestone[] = [
  { id: 'm1', title: 'Promoted to Engineering Manager', description: 'Led team of 8 engineers', achieved: true, date: '2023' },
  { id: 'm2', title: 'Led Cloud Migration Project', description: '$2M initiative, on time and under budget', achieved: true, date: '2024' },
  { id: 'm3', title: 'VP Engineering Role', description: 'Target promotion to VP-level', achieved: false },
  { id: 'm4', title: 'Industry Speaker', description: 'Speak at 2 major tech conferences', achieved: false },
];

const STATUS_COLORS: Record<string, string> = {
  'In Progress': 'bg-blue/10 text-blue',
  Completed: 'bg-green/10 text-green',
  'Not Started': 'bg-text-muted/10 text-text-muted',
};

const CATEGORY_COLORS: Record<string, string> = {
  Skill: 'bg-fuchsia/10 text-fuchsia',
  Certification: 'bg-blue/10 text-blue',
  Project: 'bg-green/10 text-green',
  Network: 'bg-amber/10 text-amber',
};

export function CandidateCareerDevPage() {
  const [sessions, setSessions] = useState<CoachingSession[]>([]);
  const [assessments, setAssessments] = useState<AssessmentInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, candidateProfile, profile } = useTenantContext();

  useEffect(() => {
    if (!user?.id && !candidateProfile?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [sessionData, assessmentData] = await Promise.all([
          user?.id ? getCoacheePastSessions(user.id) : Promise.resolve<CoachingSession[]>([]),
          candidateProfile?.id ? getAssessmentInvitations(candidateProfile.id) : Promise.resolve<AssessmentInvitation[]>([]),
        ]);
        if (cancelled) return;
        setSessions(sessionData);
        setAssessments(assessmentData);
        setError(null);
      } catch (e) {
        console.error('[CandidateCareerDevPage] Error:', e);
        if (!cancelled) setError('Failed to load development data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, candidateProfile?.id]);

  // Derive learning goals from completed coaching sessions and assessments
  const goals: LearningGoal[] = [
    ...sessions.slice(0, 5).map((s, i) => ({
      id: `sess-${s.id}`,
      title: s.title,
      category: 'Skill' as const,
      progress: s.status === 'completed' ? 100 : 50,
      deadline: new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: s.status === 'completed' ? 'Completed' as const : 'In Progress' as const,
    })),
    ...assessments.slice(0, 5).map((a, i) => ({
      id: `assess-${a.id}`,
      title: a.assessment_type || `Assessment ${i + 1}`,
      category: 'Certification' as const,
      progress: a.status === 'completed' ? 100 : a.status === 'viewed' ? 50 : 0,
      deadline: '—',
      status: a.status === 'completed' ? 'Completed' as const : a.status === 'viewed' ? 'In Progress' as const : 'Not Started' as const,
    })),
  ];

  const skills = STATIC_SKILLS;
  const milestones = STATIC_MILESTONES;

  const displayName = candidateProfile?.name || profile?.name || 'Candidate';
  const currentTitle = candidateProfile?.current_title || 'Professional';

  const completedGoals = goals.filter(g => g.status === 'Completed').length;
  const avgProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Career Development</h1>
            <p className="text-text-secondary text-sm mt-1">Track your learning goals, skill development, and career milestones.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Target className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{goals.length}</div>
              <div className="text-xs text-text-muted">Active Goals</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{completedGoals}</div>
              <div className="text-xs text-text-muted">Completed</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{`${avgProgress}%`}</div>
              <div className="text-xs text-text-muted">Avg Progress</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-fuchsia" />
            <CardTitle>Learning Goals</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-text-muted text-sm">Loading goals...</div>
          ) : error ? (
            <EmptyState title="Failed to load" description={error} />
          ) : goals.length === 0 ? (
            <EmptyState title="No goals yet" description="Your coaching sessions and assessments will appear here as development goals." />
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
              <div key={goal.id} className="p-4 bg-bg-warm rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-text-primary text-sm">{goal.title}</span>
                      <Badge className={CATEGORY_COLORS[goal.category]}>{goal.category}</Badge>
                    </div>
                    <div className="text-xs text-text-muted">Due: {goal.deadline}</div>
                  </div>
                  <Badge className={STATUS_COLORS[goal.status]}>{goal.status}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={goal.progress} className="h-2 flex-1" />
                  <span className="text-xs font-bold text-text-primary w-10 text-right">{goal.progress}%</span>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-fuchsia" />
              <CardTitle>Skill Development</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-medium text-text-primary">{skill.skill}</span>
                      <span className="text-xs text-text-muted ml-2">({skill.category})</span>
                    </div>
                    <div className="text-xs font-bold text-text-primary">
                      {skill.level} / {skill.target}
                    </div>
                  </div>
                  <div className="relative h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div className="absolute h-full bg-fuchsia rounded-full" style={{ width: `${skill.level}%` }} />
                    <div className="absolute h-full w-0.5 bg-text-muted" style={{ left: `${skill.target}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-fuchsia" />
              <CardTitle>Career Milestones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-3 p-3 bg-bg-warm rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    milestone.achieved ? 'bg-green/10 text-green' : 'bg-bg-tertiary text-text-muted'
                  }`}>
                    {milestone.achieved ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${milestone.achieved ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {milestone.title}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{milestone.description}</div>
                    {milestone.date && (
                      <div className="text-xs text-fuchsia mt-1">{milestone.date}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CandidateCareerDevPage;
