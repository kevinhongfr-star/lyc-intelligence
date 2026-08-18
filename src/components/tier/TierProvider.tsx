/**
 * TierProvider — React context provider for the 5-tier system.
 *
 * Batch 1.5 / Ticket 2: Wraps the app so any component can read the user's
 * current tier + resolved features without prop-drilling or re-fetching.
 *
 * Reads from authStore (profile.tier) on mount + when profile changes.
 * Falls back to DEFAULT_TIER (explorer) for unauthenticated users.
 */
import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  type TierKey,
  type TierFeatures,
  DEFAULT_TIER,
  TIERS,
  normalizeTier,
  tierMeets,
  tierFeatures,
  hasFeature as hasFeatureUtil,
  tierLimit,
  nextTierUp,
  upgradeOptions,
} from '@/config/tiers';

interface TierContextValue {
  /** Canonical tier key (never null — defaults to explorer). */
  tier: TierKey;
  /** Resolved features with inheritance applied. */
  features: TierFeatures;
  /** Display name from config. */
  displayName: string;
  /** Whether the user is on the entry tier. */
  isEntryTier: boolean;
  /** tierMeets() bound to current tier. */
  meets: (required: TierKey) => boolean;
  /** hasFeature() bound to current tier. */
  hasFeature: (feature: keyof TierFeatures) => boolean;
  /** tierLimit() bound to current tier. */
  limit: (limit: keyof TierFeatures) => number | null;
  /** Next tier above current (for upgrade prompts). */
  nextUp: TierKey | null;
  /** All tiers above current (upgrade options). */
  upgrades: TierKey[];
}

const TierContext = createContext<TierContextValue | null>(null);

export interface TierProviderProps {
  children: React.ReactNode;
}

export function TierProvider({ children }: TierProviderProps): React.ReactElement {
  const { profile } = useAuthStore();
  const [tier, setTier] = useState<TierKey>(DEFAULT_TIER);

  useEffect(() => {
    const canonical = normalizeTier(profile?.tier) ?? DEFAULT_TIER;
    setTier(canonical);
  }, [profile?.tier]);

  const value = useMemo<TierContextValue>(() => {
    const meta = TIERS[tier];
    return {
      tier,
      features: meta.features,
      displayName: meta.displayName,
      isEntryTier: meta.isEntryTier,
      meets: (required: TierKey) => tierMeets(tier, required),
      hasFeature: (feature: keyof TierFeatures) => hasFeatureUtil(tier, feature),
      limit: (limit: keyof TierFeatures) => tierLimit(tier, limit),
      nextUp: nextTierUp(tier),
      upgrades: upgradeOptions(tier),
    };
  }, [tier]);

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

/**
 * useTier — access the current user's tier context.
 * Must be used inside <TierProvider>.
 */
export function useTier(): TierContextValue {
  const ctx = useContext(TierContext);
  if (!ctx) {
    throw new Error('useTier must be used within <TierProvider>');
  }
  return ctx;
}

export default TierProvider;
