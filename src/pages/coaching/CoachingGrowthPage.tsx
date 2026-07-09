/**
 * CoachingGrowthPage — B2C Coaching Portal growth tracking
 * Renders inside AppShell → Outlet. Shows milestones, skill development
 * progress, and achievements.
 */
import React from 'react';
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
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress, Button } from '@/components/ui';
import { useTenantContext } from '@/hooks/useTenantContext';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  progress: number; // 0-100
}

interface SkillTrack {
  id: string;
  skill: string;
  currentLevel: number; // 1-5
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

// Static content - growth tracking, no direct database backing
const STATIC_MILESTONES: Milestone[] = [
  { id: 'ms1', title: 'Complete Career Audit', description: 'Full assessment of strengths, gaps, and target roles.', targetDate: '2024-12-15', status: 'Completed', progress: 100 },
  { id: 'ms2', title: 'Build Target Company List', description: 'Identify and research 12 high-fit target companies.', targetDate: '2025-01-15', status: 'Completed', progress: 100 },
  { id: 'ms3', title: 'Refresh Personal Brand', description: 'Update LinkedIn, resume, and executive bio.', targetDate: '2025-02-01', status: 'In Progress', progress: 65 },
  { id: 'ms4', title: 'Secure 5 Networking Conversations', description: 'Initiate and complete warm introductions.', targetDate: '2025-02-15', status: 'In Progress', progress: 40 },
  { id: 'ms5', title: 'Land Target Role Interviews', description: 'Convert outreach into at least 3 first-round interviews.', targetDate: '2025-03-15', status: 'Upcoming', progress: 0 },
  { id: 'ms6', title: 'Negotiate and Accept Offer', description: 'Secure and accept a role above the 75th percentile.', targetDate: '2025-04-30', status: 'Upcoming', progress: 0 },
];

const STATIC_SKILLS: SkillTrack[] = [
  { id: 'sk1', skill: 'Executive Communication', currentLevel: 3, targetLevel: 5, weeksRemaining: 6, activitiesDone: 8, activitiesTotal: 14 },
  { id: 'sk2', skill: 'Strategic Storytelling', currentLevel: 2, targetLevel: 4, weeksRemaining: 8, activitiesDone: 5, activitiesTotal: 12 },
  { id: 'sk3', skill: 'Financial Acumen', currentLevel: 3, targetLevel: 4, weeksRemaining: 4, activitiesDone: 9, activitiesTotal: 10 },
  { id: 'sk4', skill: 'Negotiation Tactics', currentLevel: 4, targetLevel: 5, weeksRemaining: 3, activitiesDone: 6, activitiesTotal: 8 },
];

const STATIC_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Steps', description: 'Completed your initial career assessment.', unlockedAt: '2024-12-13', icon: 'sparkles' },
  { id: 'a2', title: 'Brand Builder', description: 'Refreshed all personal brand assets.', unlockedAt: '2025-01-10', icon: 'zap' },
  { id: 'a3', title: 'Network Navigator', description: 'Completed 5 meaningful networking conversations.', unlockedAt: null, icon: 'trophy' },
  { id: 'a4', title: 'Interview Ready', description: 'Passed a full mock interview with top marks.', unlockedAt: null, icon: 'zap' },
  { id: 'a5', title: 'Offer Winner', description: 'Secured a job offer above your target percentile.', unlockedAt: null, icon: 'trophy' },
  { id: 'a6', title: 'Streak Keeper', description: 'Maintained a 21-day coaching streak.', unlockedAt: '2025-01-14', icon: 'sparkles' },
];

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
  const { profile } = useTenantContext();

  const milestones = STATIC_MILESTONES;
  const skills = STATIC_SKILLS;
  const achievements = STATIC_ACHIEVEMENTS;

  const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
  const overallProgress = milestones.length
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
    : 0;
  const unlockedAchievements = achievements.filter(a => a.unlockedAt !== null).length;

  const displayName = profile?.name || 'Coachee';
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CoachingGrowthPage;
