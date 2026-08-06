// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  TIER_CONFIG,
  TIER_ORDER,
  FEATURE_ACCESS_MATRIX,
  getTierConfig,
  listTiers,
  getFeatureAccess,
  getTierRank,
  compareTiers,
  isTierAtLeast,
  type TierKey,
  type TierConfig,
} from '../../../api/_lib/tierConfig.js';

describe('tierConfig — TIER_CONFIG', () => {
  it('defines all five tiers', () => {
    const expected: TierKey[] = ['explorer', 'starter', 'pro', 'executive', 'council'];
    for (const tier of expected) {
      expect(TIER_CONFIG[tier]).toBeDefined();
      expect(TIER_CONFIG[tier].key).toBe(tier);
    }
  });

  it('explorer tier has $0/month price', () => {
    expect(TIER_CONFIG.explorer.priceMonthly).toBe(0);
  });

  it('explorer tier has 10 messages/day limit', () => {
    expect(TIER_CONFIG.explorer.messageLimit).toBe(10);
    expect(TIER_CONFIG.explorer.unlimitedMessages).toBe(false);
  });

  it('explorer tier has 1 assessment/month limit', () => {
    expect(TIER_CONFIG.explorer.assessmentLimit).toBe(1);
    expect(TIER_CONFIG.explorer.unlimitedAssessments).toBe(false);
  });

  it('explorer tier has basic depth', () => {
    expect(TIER_CONFIG.explorer.depth).toBe('basic');
  });

  it('explorer tier has no advanced features', () => {
    const advancedFeatures = ['peer_matching', 'events', 'council', 'coaching', 'deliverables'];
    for (const feat of advancedFeatures) {
      expect(TIER_CONFIG.explorer.features).not.toContain(feat);
    }
  });

  it('starter tier has $29/month price', () => {
    expect(TIER_CONFIG.starter.priceMonthly).toBe(29);
  });

  it('starter tier has 50 messages/day limit', () => {
    expect(TIER_CONFIG.starter.messageLimit).toBe(50);
  });

  it('starter tier has unlimited assessments', () => {
    expect(TIER_CONFIG.starter.unlimitedAssessments).toBe(true);
  });

  it('starter tier has full depth and basic frameworks', () => {
    expect(TIER_CONFIG.starter.depth).toBe('full');
    expect(TIER_CONFIG.starter.features).toContain('frameworks');
  });

  it('pro tier has $99/month price', () => {
    expect(TIER_CONFIG.pro.priceMonthly).toBe(99);
  });

  it('pro tier has unlimited messages', () => {
    expect(TIER_CONFIG.pro.unlimitedMessages).toBe(true);
  });

  it('pro tier has premium depth', () => {
    expect(TIER_CONFIG.pro.depth).toBe('premium');
  });

  it('pro tier includes peer matching', () => {
    expect(TIER_CONFIG.pro.features).toContain('peer_matching');
  });

  it('executive tier has $299/month price', () => {
    expect(TIER_CONFIG.executive.priceMonthly).toBe(299);
  });

  it('executive tier includes events', () => {
    expect(TIER_CONFIG.executive.features).toContain('events');
  });

  it('executive tier includes coaching', () => {
    expect(TIER_CONFIG.executive.features).toContain('coaching');
  });

  it('council tier has $999/month price', () => {
    expect(TIER_CONFIG.council.priceMonthly).toBe(999);
  });

  it('council tier has all features including council-only', () => {
    const allFeatures = ['chat', 'assessments', 'frameworks', 'peer_matching', 'events', 'council', 'web_research', 'export_pdf', 'deliverables', 'coaching'];
    for (const feat of allFeatures) {
      expect(TIER_CONFIG.council.features).toContain(feat);
    }
  });
});

describe('tierConfig — TIER_ORDER', () => {
  it('ranks tiers from lowest to highest', () => {
    expect(TIER_ORDER).toEqual(['explorer', 'starter', 'pro', 'executive', 'council']);
  });
});

describe('tierConfig — FEATURE_ACCESS_MATRIX', () => {
  it('maps chat to all tiers', () => {
    expect(FEATURE_ACCESS_MATRIX.chat).toEqual(['explorer', 'starter', 'pro', 'executive', 'council']);
  });

  it('maps council feature to council tier only', () => {
    expect(FEATURE_ACCESS_MATRIX.council).toEqual(['council']);
  });

  it('maps events to executive and council only', () => {
    expect(FEATURE_ACCESS_MATRIX.events).toEqual(['executive', 'council']);
  });

  it('maps peer_matching to pro, executive, council', () => {
    expect(FEATURE_ACCESS_MATRIX.peer_matching).toEqual(['pro', 'executive', 'council']);
  });

  it('maps frameworks to starter and above', () => {
    expect(FEATURE_ACCESS_MATRIX.frameworks).toEqual(['starter', 'pro', 'executive', 'council']);
  });

  it('maps coaching to executive and council only', () => {
    expect(FEATURE_ACCESS_MATRIX.coaching).toEqual(['executive', 'council']);
  });

  it('maps deliverables to pro and above', () => {
    expect(FEATURE_ACCESS_MATRIX.deliverables).toEqual(['pro', 'executive', 'council']);
  });

  it('maps export_pdf to starter and above', () => {
    expect(FEATURE_ACCESS_MATRIX.export_pdf).toEqual(['starter', 'pro', 'executive', 'council']);
  });
});

describe('tierConfig — getTierConfig', () => {
  it('returns the config for a valid tier', () => {
    const cfg = getTierConfig('pro');
    expect(cfg.key).toBe('pro');
    expect(cfg.priceMonthly).toBe(99);
  });
});

describe('tierConfig — listTiers', () => {
  it('returns all tiers in order', () => {
    const tiers = listTiers();
    expect(tiers).toHaveLength(5);
    expect(tiers.map((t) => t.key)).toEqual(TIER_ORDER);
  });
});

describe('tierConfig — getFeatureAccess', () => {
  it('returns true when tier has access to feature', () => {
    expect(getFeatureAccess('pro', 'chat')).toBe(true);
    expect(getFeatureAccess('council', 'council')).toBe(true);
    expect(getFeatureAccess('executive', 'events')).toBe(true);
  });

  it('returns false when tier does not have access', () => {
    expect(getFeatureAccess('explorer', 'council')).toBe(false);
    expect(getFeatureAccess('starter', 'peer_matching')).toBe(false);
    expect(getFeatureAccess('pro', 'coaching')).toBe(false);
  });

  it('returns false for unknown feature', () => {
    expect(getFeatureAccess('council', 'nonexistent')).toBe(false);
  });
});

describe('tierConfig — getTierRank', () => {
  it('returns correct rank for each tier', () => {
    expect(getTierRank('explorer')).toBe(0);
    expect(getTierRank('starter')).toBe(1);
    expect(getTierRank('pro')).toBe(2);
    expect(getTierRank('executive')).toBe(3);
    expect(getTierRank('council')).toBe(4);
  });
});

describe('tierConfig — compareTiers', () => {
  it('returns positive when first tier is higher', () => {
    expect(compareTiers('council', 'explorer')).toBeGreaterThan(0);
    expect(compareTiers('pro', 'starter')).toBeGreaterThan(0);
  });

  it('returns negative when first tier is lower', () => {
    expect(compareTiers('explorer', 'council')).toBeLessThan(0);
    expect(compareTiers('starter', 'pro')).toBeLessThan(0);
  });

  it('returns zero for same tier', () => {
    expect(compareTiers('pro', 'pro')).toBe(0);
  });
});

describe('tierConfig — isTierAtLeast', () => {
  it('returns true when tier meets minimum', () => {
    expect(isTierAtLeast('pro', 'starter')).toBe(true);
    expect(isTierAtLeast('council', 'council')).toBe(true);
    expect(isTierAtLeast('executive', 'pro')).toBe(true);
  });

  it('returns false when tier is below minimum', () => {
    expect(isTierAtLeast('explorer', 'starter')).toBe(false);
    expect(isTierAtLeast('pro', 'executive')).toBe(false);
  });
});