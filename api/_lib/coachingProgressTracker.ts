export type CompetencyLevel = 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';

export type ProgressStatus = 'not-started' | 'on-track' | 'ahead' | 'behind' | 'completed';

export interface CompetencyScore {
  id: string;
  competency: string;
  score: number;
  level: CompetencyLevel;
  evidence: string[];
  lastUpdated: number;
}

export interface SessionRecord {
  id: string;
  date: number;
  type: 'coaching' | 'simulation' | 'peer' | 'reflection' | 'assessment';
  title: string;
  duration: number;
  outcome: string;
  score: number | null;
  insights: string[];
}

export interface ProgressGoal {
  id: string;
  description: string;
  targetDate: number;
  status: ProgressStatus;
  milestones: { id: string; description: string; completed: boolean }[];
  createdAt: number;
}

export interface CoachingProgressReport {
  coacheeId: string;
  period: { start: number; end: number };
  sessions: SessionRecord[];
  competencies: CompetencyScore[];
  goals: ProgressGoal[];
  overallScore: number;
  keyAchievements: string[];
  areasForGrowth: string[];
  recommendations: string[];
  progressTrend: 'improving' | 'stable' | 'declining';
  nextSteps: string[];
}

const COMPETENCY_FRAMEWORK: Record<string, { competencies: string[] }> = {
  leadership: {
    competencies: ['emotional-intelligence', 'communication', 'strategic-thinking', 'team-leadership', 'decision-making'],
  },
  'career-transition': {
    competencies: ['self-assessment', 'negotiation', 'stakeholder-management', 'adaptability', 'networking'],
  },
  performance: {
    competencies: ['feedback-delivery', 'performance-planning', 'coaching-skills', 'difficult-conversations', 'accountability'],
  },
  communication: {
    competencies: ['verbal-communication', 'written-communication', 'active-listening', 'presentation-skills', 'conflict-resolution'],
  },
};

export function getCompetenciesForFocus(focus: string): string[] {
  return COMPETENCY_FRAMEWORK[focus]?.competencies ?? ['general-development'];
}

export function initializeCompetencyScores(coacheeId: string, focus: string): CompetencyScore[] {
  const competencies = getCompetenciesForFocus(focus);
  return competencies.map(comp => ({
    id: `${coacheeId}-${comp}-${Date.now()}`,
    competency: comp,
    score: 0.3,
    level: 'novice',
    evidence: [],
    lastUpdated: Date.now(),
  }));
}

export function updateCompetencyScore(
  scores: CompetencyScore[],
  competency: string,
  newScore: number,
  evidence: string,
): CompetencyScore[] {
  const idx = scores.findIndex(s => s.competency === competency);
  if (idx === -1) return scores;
  const updated = [...scores];
  const current = updated[idx];
  const weightedScore = Math.round((current.score * 0.6 + newScore * 0.4) * 100) / 100;
  updated[idx] = {
    ...current,
    score: Math.min(weightedScore, 0.99),
    level: classifyLevel(weightedScore),
    evidence: [...current.evidence, evidence].slice(-10),
    lastUpdated: Date.now(),
  };
  return updated;
}

export function recordSession(
  sessions: SessionRecord[],
  session: Omit<SessionRecord, 'id' | 'createdAt'>,
): SessionRecord[] {
  return [
    ...sessions,
    {
      ...session,
      id: `session-record-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    },
  ];
}

export function createGoal(
  goals: ProgressGoal[],
  description: string,
  targetDate: number,
  milestones: string[] = [],
): ProgressGoal[] {
  const newGoal: ProgressGoal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    description,
    targetDate,
    status: 'on-track',
    milestones: milestones.map((m, i) => ({ id: `ms-${Date.now()}-${i}`, description: m, completed: false })),
    createdAt: Date.now(),
  };
  return [...goals, newGoal];
}

export function updateGoalMilestone(goals: ProgressGoal[], goalId: string, milestoneId: string): ProgressGoal[] {
  return goals.map(g => {
    if (g.id !== goalId) return g;
    const updatedMilestones = g.milestones.map(m => m.id === milestoneId ? { ...m, completed: true } : m);
    const allComplete = updatedMilestones.every(m => m.completed);
    return {
      ...g,
      milestones: updatedMilestones,
      status: allComplete ? 'completed' : 'on-track',
    };
  });
}

export function generateProgressReport(
  coacheeId: string,
  focus: string,
  sessions: SessionRecord[],
  competencies: CompetencyScore[],
  goals: ProgressGoal[],
  periodDays: number = 30,
): CoachingProgressReport {
  const end = Date.now();
  const start = end - periodDays * 24 * 3600 * 1000;
  const periodSessions = sessions.filter(s => s.date >= start && s.date <= end);
  const scores = competencies.length > 0 ? competencies : initializeCompetencyScores(coacheeId, focus);
  const overallScore = computeOverallScore(scores);
  const keyAchievements = extractAchievements(periodSessions, goals);
  const areasForGrowth = identifyGrowthAreas(scores);
  const recommendations = generateRecommendations(scores, goals, periodSessions);
  const trend = computeProgressTrend(periodSessions);
  const nextSteps = generateNextSteps(recommendations, goals, scores);
  return {
    coacheeId,
    period: { start, end },
    sessions: periodSessions,
    competencies: scores,
    goals,
    overallScore: Math.round(overallScore * 100) / 100,
    keyAchievements,
    areasForGrowth,
    recommendations,
    progressTrend: trend,
    nextSteps,
  };
}

export function computeProgressTrend(sessions: SessionRecord[]): 'improving' | 'stable' | 'declining' {
  if (sessions.length < 2) return 'stable';
  const sorted = [...sessions].sort((a, b) => a.date - b.date);
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);
  const avgScore = (arr: SessionRecord[]) => arr.reduce((s, r) => s + (r.score ?? 0), 0) / (arr.length || 1);
  const firstAvg = avgScore(firstHalf);
  const secondAvg = avgScore(secondHalf);
  if (secondAvg > firstAvg + 0.05) return 'improving';
  if (secondAvg < firstAvg - 0.05) return 'declining';
  return 'stable';
}

function computeOverallScore(scores: CompetencyScore[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
}

function classifyLevel(score: number): CompetencyLevel {
  if (score >= 0.85) return 'expert';
  if (score >= 0.7) return 'advanced';
  if (score >= 0.5) return 'proficient';
  if (score >= 0.3) return 'developing';
  return 'novice';
}

function extractAchievements(sessions: SessionRecord[], goals: ProgressGoal[]): string[] {
  const achievements: string[] = [];
  const completedGoals = goals.filter(g => g.status === 'completed');
  completedGoals.forEach(g => {
    achievements.push(`Goal achieved: ${g.description}`);
  });
  const highScoringSessions = sessions.filter(s => s.score !== null && s.score >= 0.8);
  highScoringSessions.slice(0, 3).forEach(s => {
    achievements.push(`Strong performance in ${s.title}`);
  });
  return achievements.slice(0, 5);
}

function identifyGrowthAreas(scores: CompetencyScore[]): string[] {
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  return sorted.slice(0, 3).map(s => `${s.competency} (${Math.round(s.score * 100)}%)`);
}

function generateRecommendations(
  scores: CompetencyScore[],
  goals: ProgressGoal[],
  sessions: SessionRecord[],
): string[] {
  const recommendations: string[] = [];
  const lowestScores = [...scores].sort((a, b) => a.score - b.score).slice(0, 2);
  lowestScores.forEach(s => {
    recommendations.push(`Focus development on ${s.competency} through targeted exercises and coaching.`);
  });
  if (sessions.length < 4) {
    recommendations.push('Increase coaching session frequency to accelerate progress.');
  }
  const pendingGoals = goals.filter(g => g.status !== 'completed');
  if (pendingGoals.length > 0) {
    recommendations.push(`Continue working on ${pendingGoals.length} active goal(s).`);
  }
  return recommendations;
}

function generateNextSteps(
  recommendations: string[],
  goals: ProgressGoal[],
  scores: CompetencyScore[],
): string[] {
  const steps: string[] = [];
  steps.push('Schedule next coaching session within 2 weeks');
  if (goals.length > 0) {
    steps.push('Review progress on existing goals during next session');
  }
  const lowestScore = [...scores].sort((a, b) => a.score - b.score)[0];
  if (lowestScore) {
    steps.push(`Complete targeted exercise for ${lowestScore.competency}`);
  }
  recommendations.slice(0, 2).forEach(r => steps.push(r));
  return steps.slice(0, 5);
}

export function getProgressStatus(
  targetDate: number,
  milestonesCompleted: number,
  totalMilestones: number,
): ProgressStatus {
  const now = Date.now();
  const daysRemaining = Math.floor((targetDate - now) / (24 * 3600 * 1000));
  const progressPercent = totalMilestones > 0 ? milestonesCompleted / totalMilestones : 0;
  const timePercent = 1 - (daysRemaining / 30);
  if (progressPercent >= 1) return 'completed';
  if (progressPercent >= timePercent + 0.2) return 'ahead';
  if (progressPercent < timePercent - 0.2) return 'behind';
  return 'on-track';
}
