import { type TierKey, TIER_CONFIG, TIER_ORDER, getFeatureAccess, getTierRank } from './tierConfig.js';
import * as db from './supabaseRest.js';

export { TIER_ORDER };

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: TierKey;
}

export function checkTierAccess(userTier: TierKey, featureKey: string): AccessResult {
  const allowed = getFeatureAccess(userTier, featureKey);
  if (allowed) {
    return { allowed: true };
  }

  const rank = getTierRank(userTier);
  const requiredTier = TIER_ORDER.find((t) => {
    const tiers = getTiersWithFeature(featureKey);
    return tiers.includes(t) && getTierRank(t) > rank;
  });

  return {
    allowed: false,
    reason: `Feature "${featureKey}" requires a higher tier than ${userTier}`,
    requiredTier,
  };
}

function getTiersWithFeature(featureKey: string): TierKey[] {
  const tiers: TierKey[] = [];
  for (const tier of TIER_ORDER) {
    if (getFeatureAccess(tier, featureKey)) {
      tiers.push(tier);
    }
  }
  return tiers;
}

export function requireTier(minimumTier: TierKey) {
  return async function (req: any, res: any, next?: () => void): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status?.(401)?.json?.({ error: 'Unauthorized' });
        return;
      }

      const userTier = await getUserEffectiveTier(userId);
      const userRank = getTierRank(userTier);
      const minimumRank = getTierRank(minimumTier);

      if (userRank < minimumRank) {
        const config = TIER_CONFIG[minimumTier];
        res.status?.(403)?.json?.({
          error: 'Tier requirement not met',
          requiredTier: minimumTier,
          requiredTierName: config?.name,
          message: `This action requires the ${config?.name} tier or higher.`,
        });
        return;
      }

      if (next) next();
    } catch (err: any) {
      res.status?.(500)?.json?.({ error: 'Internal server error', details: err?.message });
    }
  };
}

function getUserIdFromRequest(req: any): string | null {
  if (!req) return null;
  if (req.user?.id) return req.user.id;
  if (req.auth?.userId) return req.auth.userId;
  if (req.headers?.['x-user-id']) return req.headers['x-user-id'];
  return null;
}

export async function getUserEffectiveTier(userId: string): Promise<TierKey> {
  try {
    const profile = await db.selectOne('profiles', {
      column: 'id',
      value: userId,
      select: 'tier, stripe_subscription_status',
    });

    if (!profile) {
      return 'explorer';
    }

    const tier = profile.tier as TierKey;
    const validTiers: TierKey[] = ['explorer', 'starter', 'pro', 'executive', 'council'];

    if (!tier || !validTiers.includes(tier)) {
      return 'explorer';
    }

    if (profile.stripe_subscription_status === 'past_due' || profile.stripe_subscription_status === 'canceled') {
      return 'explorer';
    }

    return tier;
  } catch {
    return 'explorer';
  }
}