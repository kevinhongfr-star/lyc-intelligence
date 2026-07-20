/**
 * src/lib/featureFlags.ts — Feature Flag Management
 * Dynamic feature rollout, A/B testing, gradual rollout
 */
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environments: string[];
  targetUsers?: string[];
  targetRoles?: string[];
  createdAt: string;
  updatedAt: string;
}

const MOCK_FLAGS: FeatureFlag[] = [
  {
    id: 'ff-1',
    name: 'dex_ai_coach',
    description: 'AI-powered career coach feature',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['production', 'staging'],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'ff-2',
    name: 'shift_scoring',
    description: 'SHIFT composite scoring model',
    enabled: true,
    rolloutPercentage: 75,
    environments: ['production', 'staging'],
    createdAt: '2026-05-15T00:00:00Z',
    updatedAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'ff-3',
    name: 'candidate_portal_v2',
    description: 'Enhanced candidate portal v2.1',
    enabled: true,
    rolloutPercentage: 30,
    environments: ['staging'],
    targetRoles: ['candidate'],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-18T00:00:00Z',
  },
  {
    id: 'ff-4',
    name: 'smart_search',
    description: 'Advanced smart search with filters',
    enabled: true,
    rolloutPercentage: 100,
    environments: ['production', 'staging'],
    createdAt: '2026-06-20T00:00:00Z',
    updatedAt: '2026-07-19T00:00:00Z',
  },
  {
    id: 'ff-5',
    name: 'ai_insights',
    description: 'ML-driven insights and recommendations',
    enabled: false,
    rolloutPercentage: 0,
    environments: ['staging'],
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-16T00:00:00Z',
  },
];

let flags: FeatureFlag[] = [...MOCK_FLAGS];

export function getFeatureFlags(): FeatureFlag[] {
  return flags;
}

export function getFeatureFlag(id: string): FeatureFlag | undefined {
  return flags.find(f => f.id === id || f.name === id);
}

export function isFeatureEnabled(featureId: string, userId?: string, userRole?: string): boolean {
  const flag = getFeatureFlag(featureId);
  if (!flag || !flag.enabled) return false;

  if (flag.targetUsers && userId && !flag.targetUsers.includes(userId)) {
    return false;
  }

  if (flag.targetRoles && userRole && !flag.targetRoles.includes(userRole)) {
    return false;
  }

  if (flag.rolloutPercentage < 100) {
    const hash = userId ? hashCode(userId) : Math.random();
    return (hash % 100) < flag.rolloutPercentage;
  }

  return true;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function updateFeatureFlag(id: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
  const index = flags.findIndex(f => f.id === id || f.name === id);
  if (index === -1) return undefined;

  flags[index] = {
    ...flags[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return flags[index];
}

export async function createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
  const newFlag: FeatureFlag = {
    ...flag,
    id: `ff-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  flags.push(newFlag);
  return newFlag;
}

export async function deleteFeatureFlag(id: string): Promise<boolean> {
  const initialLength = flags.length;
  flags = flags.filter(f => f.id !== id && f.name !== id);
  return flags.length < initialLength;
}
