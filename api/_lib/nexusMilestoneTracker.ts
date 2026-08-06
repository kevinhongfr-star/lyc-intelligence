import { selectOne, selectMany, insert } from './supabaseRest.js';

export type MilestoneType =
  | 'goal_defined'
  | 'diagnostic_started'
  | 'diagnostic_complete'
  | 'solution_path'
  | 'next_steps'
  | 'assessment_completed'
  | 'deliverable_generated'
  | 'coaching_session';

export interface Milestone {
  id?: string;
  user_id: string;
  session_id: string;
  milestone: MilestoneType;
  created_at?: string;
  metadata?: Record<string, any>;
}

const MILESTONE_ORDER: MilestoneType[] = [
  'goal_defined',
  'diagnostic_started',
  'diagnostic_complete',
  'solution_path',
  'next_steps',
  'assessment_completed',
  'deliverable_generated',
  'coaching_session',
];

export async function trackMilestone(
  userId: string,
  sessionId: string,
  milestone: MilestoneType,
  metadata?: Record<string, any>,
): Promise<Milestone> {
  const row = await insert('nexus_milestones', {
    user_id: userId,
    session_id: sessionId,
    milestone,
    metadata: metadata || null,
  });
  return row as Milestone;
}

export async function getUserMilestones(userId: string): Promise<Milestone[]> {
  const rows = await selectMany('nexus_milestones', {
    where: [{ column: 'user_id', value: userId }],
    orderBy: { column: 'created_at', ascending: false },
  });
  return (rows || []) as Milestone[];
}

export async function getSessionMilestones(sessionId: string): Promise<Milestone[]> {
  const rows = await selectMany('nexus_milestones', {
    where: [{ column: 'session_id', value: sessionId }],
    orderBy: { column: 'created_at', ascending: true },
  });
  return (rows || []) as Milestone[];
}

export function computeMilestoneProgress(milestones: Milestone[]): number {
  if (!milestones || milestones.length === 0) {
    return 0;
  }

  const achieved = new Set(milestones.map(m => m.milestone));
  const achievedCount = MILESTONE_ORDER.filter(m => achieved.has(m)).length;

  return Math.round((achievedCount / MILESTONE_ORDER.length) * 100);
}

export function getNextMilestone(currentMilestones: Milestone[]): MilestoneType | null {
  if (!currentMilestones || currentMilestones.length === 0) {
    return MILESTONE_ORDER[0];
  }

  const achieved = new Set(currentMilestones.map(m => m.milestone));

  for (const milestone of MILESTONE_ORDER) {
    if (!achieved.has(milestone)) {
      return milestone;
    }
  }

  return null;
}

export { MILESTONE_ORDER };
