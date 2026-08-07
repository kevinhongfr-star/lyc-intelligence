export type CurriculumLevel = 'foundational' | 'intermediate' | 'advanced' | 'mastery';

export type LearningStatus = 'not-started' | 'in-progress' | 'completed' | 'archived';

export type ResourceType = 'article' | 'video' | 'exercise' | 'case-study' | 'assessment' | 'peer-session';

export interface LearningResource {
  id: string;
  title: string;
  type: ResourceType;
  url?: string;
  duration: number;
  description: string;
  skills: string[];
}

export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  level: CurriculumLevel;
  estimatedDuration: number;
  resources: LearningResource[];
  dependencies: string[];
  learningOutcomes: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  focus: string;
  modules: CurriculumModule[];
  totalDuration: number;
  difficulty: CurriculumLevel;
  prerequisites: string[];
  careerStage: string;
}

export interface LearningProgress {
  pathId: string;
  moduleProgress: Record<string, { status: LearningStatus; completedResources: string[]; score: number | null }>;
  overallProgress: number;
  startedAt: number | null;
  completedAt: number | null;
  lastAccessedAt: number | null;
}

const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'path-leadership-foundation',
    title: 'Leadership Foundations',
    description: 'Build core leadership competencies including communication, emotional intelligence, and team management.',
    focus: 'leadership',
    difficulty: 'foundational',
    careerStage: 'early-to-mid-career',
    prerequisites: [],
    modules: [
      {
        id: 'mod-lead-1',
        title: 'Self-Awareness & Emotional Intelligence',
        description: 'Understand your leadership style and develop emotional intelligence competencies.',
        level: 'foundational',
        estimatedDuration: 3600,
        dependencies: [],
        learningOutcomes: ['Identify personal leadership strengths', 'Apply emotional intelligence frameworks', 'Create a personal development plan'],
        resources: [
          { id: 'res-1', title: 'Introduction to Emotional Intelligence', type: 'article', duration: 900, description: 'Overview of EQ competencies and their impact on leadership.', skills: ['emotional-intelligence'] },
          { id: 'res-2', title: 'Leadership Style Assessment', type: 'assessment', duration: 1800, description: 'Assess your natural leadership tendencies and preferences.', skills: ['self-awareness'] },
          { id: 'res-3', title: 'Journaling Exercise: Leadership Reflections', type: 'exercise', duration: 900, description: 'Structured reflection prompts to develop self-awareness.', skills: ['self-reflection'] },
        ],
      },
      {
        id: 'mod-lead-2',
        title: 'Communication & Influencing',
        description: 'Master communication techniques for effective leadership and stakeholder management.',
        level: 'foundational',
        estimatedDuration: 3600,
        dependencies: ['mod-lead-1'],
        learningOutcomes: ['Deliver clear, impactful messages', 'Adapt communication style to audiences', 'Handle difficult conversations'],
        resources: [
          { id: 'res-4', title: 'Situational Communication Framework', type: 'article', duration: 1200, description: 'Adapting communication based on context and audience.', skills: ['communication'] },
          { id: 'res-5', title: 'Difficult Conversation Role-Play', type: 'exercise', duration: 1800, description: 'Practice navigating challenging leadership conversations.', skills: ['conflict-resolution'] },
          { id: 'res-6', title: 'Giving and Receiving Feedback', type: 'video', duration: 900, description: 'Techniques for constructive feedback exchanges.', skills: ['feedback'] },
        ],
      },
      {
        id: 'mod-lead-3',
        title: 'Leading Teams',
        description: 'Build, develop, and lead high-performing teams.',
        level: 'foundational',
        estimatedDuration: 4200,
        dependencies: ['mod-lead-1', 'mod-lead-2'],
        learningOutcomes: ['Build team trust and psychological safety', 'Set clear goals and expectations', 'Develop team members'],
        resources: [
          { id: 'res-7', title: 'Building Psychological Safety', type: 'article', duration: 1200, description: 'Strategies for creating safe team environments.', skills: ['team-building'] },
          { id: 'res-8', title: 'Team Charter Workshop', type: 'exercise', duration: 1800, description: 'Facilitate team alignment on values and working norms.', skills: ['team-alignment'] },
          { id: 'res-9', title: 'Performance Management Case Study', type: 'case-study', duration: 1200, description: 'Analyze a real performance management scenario.', skills: ['performance-management'] },
        ],
      },
    ],
    totalDuration: 11400,
  },
  {
    id: 'path-career-transition',
    title: 'Career Transition Mastery',
    description: 'Navigate career transitions with confidence — from IC to management, or across functions.',
    focus: 'career-transition',
    difficulty: 'intermediate',
    careerStage: 'mid-career',
    prerequisites: [],
    modules: [
      {
        id: 'mod-ct-1',
        title: 'Transition Readiness Assessment',
        description: 'Evaluate your readiness for a career transition and identify skill gaps.',
        level: 'intermediate',
        estimatedDuration: 2700,
        dependencies: [],
        learningOutcomes: ['Assess transition readiness', 'Identify skill gaps', 'Create transition timeline'],
        resources: [
          { id: 'res-10', title: 'Career Transition Readiness Quiz', type: 'assessment', duration: 1200, description: 'Evaluate your preparedness for career change.', skills: ['self-assessment'] },
          { id: 'res-11', title: 'IC-to-Manager Transition Guide', type: 'article', duration: 1500, description: 'Key insights for moving from individual contributor to management.', skills: ['career-transition'] },
        ],
      },
      {
        id: 'mod-ct-2',
        title: 'Negotiating the Transition',
        description: 'Negotiate terms, create transition plans, and manage stakeholder relationships.',
        level: 'intermediate',
        estimatedDuration: 3600,
        dependencies: ['mod-ct-1'],
        learningOutcomes: ['Negotiate transition terms', 'Build stakeholder support', 'Create 100-day plan'],
        resources: [
          { id: 'res-12', title: 'Negotiation Framework for Transitions', type: 'article', duration: 1200, description: 'Strategies for negotiating role changes.', skills: ['negotiation'] },
          { id: 'res-13', title: '100-Day Plan Template & Workshop', type: 'exercise', duration: 2400, description: 'Build a structured 100-day transition plan.', skills: ['planning'] },
        ],
      },
      {
        id: 'mod-ct-3',
        title: 'Succeeding in the New Role',
        description: 'Navigate the first 90 days and establish credibility in your new role.',
        level: 'intermediate',
        estimatedDuration: 3600,
        dependencies: ['mod-ct-2'],
        learningOutcomes: ['Execute 100-day plan', 'Build relationships in new structure', 'Demonstrate early wins'],
        resources: [
          { id: 'res-14', title: 'First 90 Days Playbook', type: 'article', duration: 1500, description: 'Guide to succeeding in the first quarter of a new role.', skills: ['onboarding'] },
          { id: 'res-15', title: 'Peer Coaching Session: First 30 Days', type: 'peer-session', duration: 2100, description: 'Group peer coaching on early transition challenges.', skills: ['peer-learning'] },
        ],
      },
    ],
    totalDuration: 9900,
  },
  {
    id: 'path-performance-excellence',
    title: 'Performance Excellence',
    description: 'Master performance management — from delivering feedback to driving improvement.',
    focus: 'performance',
    difficulty: 'intermediate',
    careerStage: 'mid-to-senior',
    prerequisites: [],
    modules: [
      {
        id: 'mod-perf-1',
        title: 'Delivering Effective Feedback',
        description: 'Master the art of giving and receiving performance feedback.',
        level: 'intermediate',
        estimatedDuration: 3600,
        dependencies: [],
        learningOutcomes: ['Use SBI model for feedback', 'Handle emotional reactions', 'Document feedback professionally'],
        resources: [
          { id: 'res-16', title: 'SBI Feedback Model Deep Dive', type: 'article', duration: 1200, description: 'Situation-Behavior-Impact model mastery.', skills: ['feedback'] },
          { id: 'res-17', title: 'Difficult Feedback Role-Play', type: 'exercise', duration: 1800, description: 'Practice delivering challenging feedback.', skills: ['difficult-conversations'] },
          { id: 'res-18', title: 'Feedback Self-Assessment', type: 'assessment', duration: 600, description: 'Evaluate your feedback delivery skills.', skills: ['self-assessment'] },
        ],
      },
      {
        id: 'mod-perf-2',
        title: 'Performance Improvement Planning',
        description: 'Create and execute structured performance improvement plans.',
        level: 'intermediate',
        estimatedDuration: 3600,
        dependencies: ['mod-perf-1'],
        learningOutcomes: ['Write effective PIPs', 'Set measurable milestones', 'Monitor and adjust plans'],
        resources: [
          { id: 'res-19', title: 'PIP Template & Guide', type: 'article', duration: 1500, description: 'Structured approach to performance improvement plans.', skills: ['planning'] },
          { id: 'res-20', title: 'PIP Case Study: Success Story', type: 'case-study', duration: 1200, description: 'Real example of successful performance turnaround.', skills: ['performance-management'] },
          { id: 'res-21', title: 'Creating Your First PIP', type: 'exercise', duration: 900, description: 'Hands-on PIP creation workshop.', skills: ['writing'] },
        ],
      },
      {
        id: 'mod-perf-3',
        title: 'Coaching for Performance',
        description: 'Use coaching techniques to drive sustainable performance improvement.',
        level: 'advanced',
        estimatedDuration: 4200,
        dependencies: ['mod-perf-2'],
        learningOutcomes: ['Apply GROW model to performance', 'Balance support with accountability', 'Drive lasting behavior change'],
        resources: [
          { id: 'res-22', title: 'Coaching for Performance Video Series', type: 'video', duration: 2700, description: 'Video series on coaching techniques for performance.', skills: ['coaching'] },
          { id: 'res-23', title: 'Performance Coaching Case Studies', type: 'case-study', duration: 1500, description: 'Analyze successful performance coaching engagements.', skills: ['analysis'] },
        ],
      },
    ],
    totalDuration: 11400,
  },
];

export function getLearningPaths(): LearningPath[] {
  return LEARNING_PATHS;
}

export function getPathById(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find(p => p.id === id);
}

export function generateLearningPath(
  focus: string,
  currentLevel: string,
  goals: string[],
): LearningPath {
  const existing = LEARNING_PATHS.find(p => p.focus === focus);
  if (existing) return existing;
  const pathId = `path-${focus}-${Date.now()}`;
  const modules: CurriculumModule[] = [
    {
      id: `mod-${focus}-foundations`,
      title: `${capitalize(focus)} Foundations`,
      description: `Core principles of ${focus} for practitioners at ${currentLevel} level.`,
      level: 'foundational',
      estimatedDuration: 3600,
      dependencies: [],
      learningOutcomes: goals.slice(0, 3),
      resources: [
        { id: `res-${focus}-1`, title: `Introduction to ${capitalize(focus)}`, type: 'article', duration: 1200, description: `Foundational concepts in ${focus}.`, skills: [focus] },
        { id: `res-${focus}-2`, title: `${capitalize(focus)} Self-Assessment`, type: 'assessment', duration: 900, description: 'Evaluate your current skills.', skills: ['self-assessment'] },
      ],
    },
    {
      id: `mod-${focus}-practice`,
      title: `${capitalize(focus)} Practice`,
      description: `Apply ${focus} concepts through exercises and case studies.`,
      level: 'intermediate',
      estimatedDuration: 3600,
      dependencies: [`mod-${focus}-foundations`],
      learningOutcomes: goals.slice(2, 5),
      resources: [
        { id: `res-${focus}-3`, title: `${capitalize(focus)} Exercise`, type: 'exercise', duration: 1800, description: 'Hands-on practice with real scenarios.', skills: [focus] },
        { id: `res-${focus}-4`, title: `${capitalize(focus)} Case Study`, type: 'case-study', duration: 1800, description: 'Analyze real-world application.', skills: ['analysis'] },
      ],
    },
    {
      id: `mod-${focus}-mastery`,
      title: `${capitalize(focus)} Mastery`,
      description: `Advanced techniques and real-world application of ${focus}.`,
      level: 'advanced',
      estimatedDuration: 4200,
      dependencies: [`mod-${focus}-practice`],
      learningOutcomes: goals.slice(4),
      resources: [
        { id: `res-${focus}-5`, title: `Peer Coaching: ${capitalize(focus)}`, type: 'peer-session', duration: 2100, description: 'Group peer coaching session.', skills: ['peer-learning'] },
        { id: `res-${focus}-6`, title: `${capitalize(focus)} Capstone Assessment`, type: 'assessment', duration: 2100, description: 'Demonstrate mastery of the topic.', skills: ['assessment'] },
      ],
    },
  ];
  const totalDuration = modules.reduce((sum, m) => sum + m.estimatedDuration, 0);
  return {
    id: pathId,
    title: `${capitalize(focus)} Development Path`,
    description: `A structured learning path to develop ${focus} competencies.`,
    focus,
    modules,
    totalDuration,
    difficulty: 'foundational',
    prerequisites: [],
    careerStage: currentLevel,
  };
}

export function initializeProgress(pathId: string): LearningProgress {
  const path = getPathById(pathId);
  if (!path) throw new Error(`Path not found: ${pathId}`);
  const moduleProgress: LearningProgress['moduleProgress'] = {};
  path.modules.forEach(m => {
    moduleProgress[m.id] = { status: 'not-started', completedResources: [], score: null };
  });
  return {
    pathId,
    moduleProgress,
    overallProgress: 0,
    startedAt: Date.now(),
    completedAt: null,
    lastAccessedAt: Date.now(),
  };
}

export function updateModuleProgress(
  progress: LearningProgress,
  moduleId: string,
  status: LearningStatus,
  completedResources: string[],
  score: number | null = null,
): LearningProgress {
  const path = getPathById(progress.pathId);
  if (!path) throw new Error(`Path not found: ${progress.pathId}`);
  const moduleDef = path.modules.find(m => m.id === moduleId);
  if (!moduleDef) throw new Error(`Module not found: ${moduleId}`);
  const updatedModuleProgress = {
    ...progress.moduleProgress,
    [moduleId]: {
      status,
      completedResources: [...new Set([...(progress.moduleProgress[moduleId]?.completedResources ?? []), ...completedResources])],
      score,
    },
  };
  const totalModules = path.modules.length;
  const completedModules = Object.values(updatedModuleProgress).filter(mp => mp.status === 'completed').length;
  const overallProgress = Math.round((completedModules / totalModules) * 100);
  return {
    ...progress,
    moduleProgress: updatedModuleProgress,
    overallProgress,
    completedAt: overallProgress === 100 ? Date.now() : null,
    lastAccessedAt: Date.now(),
  };
}

export function getPathSummary(progress: LearningProgress): {
  totalModules: number;
  completedCount: number;
  inProgressCount: number;
  totalResources: number;
  completedResources: number;
  estimatedTimeRemaining: number;
} {
  const path = getPathById(progress.pathId);
  if (!path) return { totalModules: 0, completedCount: 0, inProgressCount: 0, totalResources: 0, completedResources: 0, estimatedTimeRemaining: 0 };
  let completedCount = 0;
  let inProgressCount = 0;
  let totalResources = 0;
  let completedResources = 0;
  let remainingTime = 0;
  path.modules.forEach(m => {
    const mp = progress.moduleProgress[m.id];
    if (mp?.status === 'completed') completedCount++;
    if (mp?.status === 'in-progress') inProgressCount++;
    totalResources += m.resources.length;
    if (mp) {
      completedResources += mp.completedResources.length;
      const remainingResources = m.resources.filter(r => !mp.completedResources.includes(r.id));
      remainingTime += remainingResources.reduce((sum, r) => sum + r.duration, 0);
      if (mp.status !== 'completed') remainingTime += 0;
    } else {
      remainingTime += m.estimatedDuration;
    }
  });
  return {
    totalModules: path.modules.length,
    completedCount,
    inProgressCount,
    totalResources,
    completedResources,
    estimatedTimeRemaining: remainingTime,
  };
}

export function getNextRecommendedAction(progress: LearningProgress): { moduleId: string; resourceId: string } | null {
  const path = getPathById(progress.pathId);
  if (!path) return null;
  for (const module of path.modules) {
    const mp = progress.moduleProgress[module.id];
    if (!mp || mp.status !== 'completed') {
      const incompleteResource = module.resources.find(r => !mp?.completedResources.includes(r.id));
      if (incompleteResource) return { moduleId: module.id, resourceId: incompleteResource.id };
      return { moduleId: module.id, resourceId: module.resources[0].id };
    }
  }
  return null;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
