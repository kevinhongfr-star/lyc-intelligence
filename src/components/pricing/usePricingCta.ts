import { useCallback } from 'react';
import { TIERS, RECOMMENDED_TIER } from '@/config/pricingData';
import type { TierKey } from '@/config/pricingData';

export interface UpgradeCTA {
  ctaText: string;
  shortText: string;
  targetTier: TierKey;
  targetDisplayName: string;
  targetMonthlyMiles: number;
  deltaMiles: number;
  recommendedHighlight: boolean;
}

const TIERS_BY_KEY = Object.fromEntries(TIERS.map((t) => [t.tier_key, t]));

function orderOf(key: TierKey): number {
  return TIERS_BY_KEY[key]?.order ?? -1;
}

function nextPaidTier(currentOrder: number): TierKey {
  const next = TIERS.find((t) => t.order > currentOrder && t.monthlyMiles > 0);
  if (next) return next.tier_key;
  return RECOMMENDED_TIER;
}

export function usePricingCta() {
  const getUpgradeCTA = useCallback((tierKey: TierKey | null | undefined): UpgradeCTA => {
    const current = tierKey ? TIERS_BY_KEY[tierKey] : null;
    const currentOrder = current ? orderOf(current.tier_key) : -1;

    if (!current) {
      const target = TIERS_BY_KEY[RECOMMENDED_TIER];
      return {
        ctaText: `Upgrade to ${target.display_name}`,
        shortText: `Choose ${target.display_name}`,
        targetTier: target.tier_key,
        targetDisplayName: target.display_name,
        targetMonthlyMiles: target.monthlyMiles,
        deltaMiles: target.monthlyMiles,
        recommendedHighlight: true,
      };
    }

    if (current.tier_key === 'council') {
      return {
        ctaText: 'You are on Council — our highest tier',
        shortText: 'Current: Council',
        targetTier: 'council',
        targetDisplayName: 'Council',
        targetMonthlyMiles: current.monthlyMiles,
        deltaMiles: 0,
        recommendedHighlight: false,
      };
    }

    const targetKey =
      orderOf(current.tier_key) < orderOf(RECOMMENDED_TIER)
        ? RECOMMENDED_TIER
        : nextPaidTier(currentOrder);
    const target = TIERS_BY_KEY[targetKey];

    const delta = target.monthlyMiles - current.monthlyMiles;
    const isRec = targetKey === RECOMMENDED_TIER;

    if (current.tier_key === 'explorer') {
      return {
        ctaText: isRec
          ? `Start with ${target.display_name} — recommended`
          : `Upgrade to ${target.display_name}`,
        shortText: `Get ${target.display_name}`,
        targetTier: target.tier_key,
        targetDisplayName: target.display_name,
        targetMonthlyMiles: target.monthlyMiles,
        deltaMiles: target.monthlyMiles,
        recommendedHighlight: isRec,
      };
    }

    return {
      ctaText: isRec
        ? `Upgrade to ${target.display_name} (recommended)`
        : `Upgrade to ${target.display_name}`,
      shortText: `Upgrade to ${target.display_name}`,
      targetTier: target.tier_key,
      targetDisplayName: target.display_name,
      targetMonthlyMiles: target.monthlyMiles,
      deltaMiles: delta,
      recommendedHighlight: isRec,
    };
  }, []);

  return { getUpgradeCTA };
}
