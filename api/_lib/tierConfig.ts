export type TierKey = 'explorer' | 'starter' | 'pro' | 'executive' | 'council';

export interface TierConfig {
  key: TierKey;
  name: string;
  priceMonthly: number;
  messageLimit: number;
  assessmentLimit: number;
  unlimitedMessages: boolean;
  unlimitedAssessments: boolean;
  depth: 'basic' | 'full' | 'premium';
  features: string[];
}

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  explorer: {
    key: 'explorer',
    name: 'Explorer',
    priceMonthly: 0,
    messageLimit: 10,
    assessmentLimit: 1,
    unlimitedMessages: false,
    unlimitedAssessments: false,
    depth: 'basic',
    features: ['chat', 'assessments', 'web_research'],
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    messageLimit: 50,
    assessmentLimit: 0,
    unlimitedMessages: false,
    unlimitedAssessments: true,
    depth: 'full',
    features: ['chat', 'assessments', 'frameworks', 'web_research', 'export_pdf'],
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    priceMonthly: 99,
    messageLimit: 0,
    assessmentLimit: 0,
    unlimitedMessages: true,
    unlimitedAssessments: true,
    depth: 'premium',
    features: ['chat', 'assessments', 'frameworks', 'peer_matching', 'web_research', 'export_pdf', 'deliverables'],
  },
  executive: {
    key: 'executive',
    name: 'Executive',
    priceMonthly: 299,
    messageLimit: 0,
    assessmentLimit: 0,
    unlimitedMessages: true,
    unlimitedAssessments: true,
    depth: 'premium',
    features: ['chat', 'assessments', 'frameworks', 'peer_matching', 'events', 'web_research', 'export_pdf', 'deliverables', 'coaching'],
  },
  council: {
    key: 'council',
    name: 'Council',
    priceMonthly: 999,
    messageLimit: 0,
    assessmentLimit: 0,
    unlimitedMessages: true,
    unlimitedAssessments: true,
    depth: 'premium',
    features: ['chat', 'assessments', 'frameworks', 'peer_matching', 'events', 'council', 'web_research', 'export_pdf', 'deliverables', 'coaching'],
  },
};

export const FEATURE_ACCESS_MATRIX: Record<string, TierKey[]> = {
  chat: ['explorer', 'starter', 'pro', 'executive', 'council'],
  assessments: ['explorer', 'starter', 'pro', 'executive', 'council'],
  frameworks: ['starter', 'pro', 'executive', 'council'],
  peer_matching: ['pro', 'executive', 'council'],
  events: ['executive', 'council'],
  council: ['council'],
  web_research: ['explorer', 'starter', 'pro', 'executive', 'council'],
  export_pdf: ['starter', 'pro', 'executive', 'council'],
  deliverables: ['pro', 'executive', 'council'],
  coaching: ['executive', 'council'],
};

const TIER_ORDER: TierKey[] = ['explorer', 'starter', 'pro', 'executive', 'council'];

export function getTierConfig(tier: TierKey): TierConfig {
  return TIER_CONFIG[tier];
}

export function listTiers(): TierConfig[] {
  return TIER_ORDER.map((key) => TIER_CONFIG[key]);
}

export function getFeatureAccess(tier: TierKey, featureKey: string): boolean {
  const allowedTiers = FEATURE_ACCESS_MATRIX[featureKey];
  if (!allowedTiers) return false;
  return allowedTiers.includes(tier);
}

export function getTierRank(tier: TierKey): number {
  return TIER_ORDER.indexOf(tier);
}

export function compareTiers(a: TierKey, b: TierKey): number {
  return getTierRank(a) - getTierRank(b);
}

export function isTierAtLeast(tier: TierKey, minimum: TierKey): boolean {
  return getTierRank(tier) >= getTierRank(minimum);
}

export { TIER_ORDER };