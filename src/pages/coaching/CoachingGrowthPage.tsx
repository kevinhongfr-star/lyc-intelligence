/**
 * CoachingGrowthPage — B2C Coaching Portal growth tracking
 * Renders inside AppShell → Outlet. Shows milestones, skill development
 * progress, and achievements.
 */
import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  Lock,
  TrendingUp,
  Zap,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button, EmptyState } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';
import {
  getCoacheePastSessions,
  getAssessmentInvitations,
  type CoachingSession,
  type AssessmentInvitation,
} from '@/services/supabaseApi';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  progress: number;
}

interface SkillTrack {
  id: string;
  skill: string;
  currentLevel: number;
  targetLevel: number;
  weeksRemaining: number;
  activitiesDone: number;
  activitiesTotal: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  icon: 'trophy' | 'sparkles' | 'zap';
}

const ACHIEVEMENT_ICONS = {
  trophy: Trophy,
  sparkles: Sparkles,
  zap: Zap,
};

const MILESTONE_STATUS_VARIANT: Record<Milestone['status'], 'success' | 'default' | 'warning'> = {
  'Completed': 'success',
  'In Progress': 'warning',
  'Upcoming': 'default',
};

export function CoachingGrowthPage() {
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
        setError(null);
        const [sessionData, assessmentData] = await Promise.all([
          user?.id ? getCoacheePastSessions(user.id) : Promise.resolve<CoachingSession[]>([]),
          candidateProfile?.id ? getAssessmentInvitations(candidateProfile.id) : Promise.resolve<AssessmentInvitation[]>([]),
        ]);
        if (cancelled) return;
        setSessions(sessionData);
        setAssessments(assessmentData);
      } catch (e) {
        console.error('[CoachingGrowthPage] Error:', e);
        if (!cancelled) setError('Failed to load growth data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, candidateProfile?.id]);

  // Derive milestones from completed sessions + assessments
  const milestones: Milestone[] = [
    ...sessions.filter(s => s.status === 'completed').slice(0, 6).map((s, i) => ({
      id: `milestone-${s.id}`,
      title: s.title,
      description: `${s.format} coaching session`,
      targetDate: new Date(s.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Completed' as const,
      progress: 100,
    })),
    ...assessments.slice(0, 3).map((a, i) => ({
      id: `assess-${a.id}`,
      title: a.assessment_title || 'Assessment',
      description: a.assessment_type || 'Skills assessment',
      targetDate: new Date(a.invited_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: a.status === 'completed' ? 'Completed' as const : a.status === 'viewed' ? 'In Progress' as const : 'Upcoming' as const,
      progress: a.status === 'completed' ? 100 : a.status === 'viewed' ? 50 : 0,
    })),
  ];

  // Derive skill tracks from assessments (score-based levels 1-5)
  const skills: SkillTrack[] = assessments
    .filter(a => a.status === 'completed')
    .slice(0, 4)
    .map((a, i) => {
      const score = a.score || 75;
      const level = Math.min(5, Math.max(1, Math.ceil(score / 20)));
      return {
        id: `skill-${a.id}`,
        skill: a.assessment_title || 'Skill Area',
        currentLevel: level,
        targetLevel: 5,
        weeksRemaining: Math.max(1, 8 - i * 2),
        activitiesDone: Math.round(score / 10),
        activitiesTotal: 10,
      };
    });

  // Derive achievements from milestones
  const achievements: Achievement[] = [
    { id: 'a1', title: 'First Steps', description: 'Completed your initial assessment.', unlockedAt: assessments.length > 0 ? new Date().toISOString().split('T')[0] : null, icon: 'sparkles' },
    { id: 'a2', title: 'Session Starter', description: 'Completed your first coaching session.', unlockedAt: sessions.some(s => s.status === 'completed') ? new Date(sessions.find(s => s.status === 'completed')!.scheduled_at).toISOString().split('T')[0] : null, icon: 'zap' },
    { id: 'a3', title: 'Dedicated Learner', description: 'Completed 5+ coaching sessions.', unlockedAt: sessions.filter(s => s.status === 'completed').length >= 5 ? new Date().toISOString().split('T')[0] : null, icon: 'trophy' },
    { id: 'a4', title: 'Assessment Pro', description: 'Completed all available assessments.', unlockedAt: assessments.length > 0 && assessments.every(a => a.status === 'completed') ? new Date().toISOString().split('T')[0] : null, icon: 'zap' },
    { id: 'a5', title: 'Milestone Master', description: 'Reached all major milestones.', unlockedAt: null, icon: 'trophy' },
    { id: 'a6', title: 'Consistent Go-Getter', description: 'Maintained a 21-day engagement streak.', unlockedAt: null, icon: 'sparkles' },
  ];

  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const overallProgress = milestones.length
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
    : 0;
  const unlockedAchievements = achievements.filter(a => a.unlockedAt !== null).length;

  const displayName = profile?.name || candidateProfile?.name || 'Coachee';
  const tier = profile?.tier || 'Professional';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-serif font-bold text-2xl text-text-primary">Growth Tracking</h1>
            <p className="text-text-secondary text-sm mt-1">Your milestones, skill development, and achievements.</p>
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

      {/* Top metrics */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="p-4"><div className="animate-pulse h-14 bg-bg-tertiary rounded" /></Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6"><div className="text-center text-red text-sm">{error}</div></Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Target className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {`${completedMilestones}/${milestones.length}`}
              </div>
              <div className="text-xs text-text-muted">Milestones Done</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">{`${overallProgress}%`}</div>
              <div className="text-xs text-text-muted">Overall Progress</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-light flex items-center justify-center">
              <Trophy className="w-5 h-5 text-fuchsia" />
            </div>
            <div>
              <div className="text-2xl font-bold text-text-primary">
                {`${unlockedAchievements}/${achievements.length}`}
              </div>
              <div className="text-xs text-text-muted">Achievements</div>
            </div>
          </div>
        </Card>
      </div>
      )}

      {/* Milestones timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-fuchsia" />
              <CardTitle>Milestones</CardTitle>
            </div>
            <Button variant="ghost" size="sm">Add Milestone</Button>
          </div>
        </CardHeader>
        <CardContent>
            {loading ? (
              <div className="py-8 text-center text-text-muted text-sm">Loading milestones...</div>
            ) : milestones.length === 0 ? (
              <EmptyState
                title="No milestones yet"
                description="Complete coaching sessions and assessments to build your milestone timeline."
              />
            ) : (
            <div className="space-y-1">
              {milestones.map((milestone, idx) => {
                const isLast = idx === milestones.length - 1;
                const Icon = milestone.status === 'Completed' ? CheckCircle2 : milestone.status === 'Upcoming' ? Circle : Target;
                const iconColor =
                  milestone.status === 'Completed' ? 'text-green' : milestone.status === 'In Progress' ? 'text-fuchsia' : 'text-text-muted';
                return (
                  <div key={milestone.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
                      {!isLast && <div className="w-px flex-1 bg-border min-h-[40px] my-1" />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${milestone.status === 'Upcoming' ? 'text-text-secondary' : 'text-text-primary'}`}>
                          {milestone.title}
                        </span>
                        <Badge variant={MILESTONE_STATUS_VARIANT[milestone.status]}>{milestone.status}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{milestone.description}</p>
                      {milestone.status !== 'Completed' && (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 max-w-[200px]">
                            <Progress value={milestone.progress} />
                          </div>
                          <span className="text-xs font-medium text-text-secondary">{milestone.progress}%</span>
                        </div>
                      )}
                      <div className="text-xs text-text-muted mt-1.5">Target: {milestone.targetDate}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill development */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-fuchsia" />
              <CardTitle>Skill Development</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="py-8 text-center text-text-muted text-sm">Loading skills...</div>
              ) : skills.length === 0 ? (
                <EmptyState
                  title="No skill data yet"
                  description="Complete assessments to see your skill development progress."
                />
              ) : (
              <div className="space-y-5">
                {skills.map((skill) => {
                  const levelProgress = (skill.activitiesDone / skill.activitiesTotal) * 100;
                  return (
                    <div key={skill.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{skill.skill}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < skill.currentLevel ? 'bg-fuchsia' : 'bg-border'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
                        <span>Level {skill.currentLevel} → {skill.targetLevel}</span>
                        <span>{skill.weeksRemaining} weeks left</span>
                      </div>
                      <Progress value={levelProgress} />
                      <div className="text-xs text-text-muted mt-1">
                        {skill.activitiesDone}/{skill.activitiesTotal} activities completed
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-fuchsia" />
              <CardTitle>Achievements</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
              {loading ? (
                <div className="py-8 text-center text-text-muted text-sm">Loading achievements...</div>
              ) : achievements.length === 0 ? (
                <EmptyState
                  title="No achievements yet"
                  description="Complete sessions and assessments to unlock achievements."
                />
              ) : (
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => {
                  const unlocked = achievement.unlockedAt !== null;
                  const Icon = unlocked ? ACHIEVEMENT_ICONS[achievement.icon] : Lock;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 border ${unlocked ? 'border-fuchsia-20 bg-fuchsia-light' : 'border-border bg-bg-warm'}`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            unlocked ? 'bg-fuchsia' : 'bg-bg-tertiary'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${unlocked ? 'text-white' : 'text-text-muted'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-medium ${unlocked ? 'text-text-primary' : 'text-text-muted'}`}>
                            {achievement.title}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5 leading-snug">
                            {achievement.description}
                          </div>
                          {unlocked && (
                            <div className="text-xs text-fuchsia mt-1">{achievement.unlockedAt}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CoachingGrowthPage;
