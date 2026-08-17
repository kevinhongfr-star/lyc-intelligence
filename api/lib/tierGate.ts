/**
 * tierGate — API route tier-gating middleware.
 *
 * Batch 1.5 / Ticket 2: Server-side tier gating for API routes.
 * Reads the user's tier from the authenticated context and checks
 * against the canonical tier config.
 *
 * Usage in an API route:
 *
 *   import { withTierGate } from '@/lib/tierGate';
 *   export default withTierGate('professional', async (req, res, ctx) => {
 *     // handler only runs if user's tier >= professional
 *   });
 *
 * Soft gate behavior: Explorer-tier users get a 403 with a structured
 * body containing `upgrade_to` + `pricing_url` so the frontend can
 * show a SoftGate / UpgradeCTA instead of a hard error.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  type TierKey,
  TIERS,
  normalizeTier,
  tierMeets,
  DEFAULT_TIER,
} from '../../src/config/tiers';
import { getAuthorizedContext, type AuthorizedContext } from '../lib/auth';

export interface TierGateOptions {
  /** If true, unauthenticated requests are allowed (guest access). */
  allowAnonymous?: boolean;
  /** If false, denied requests get 403. If true, they get 200 with a soft gate body. */
  softDeny?: boolean;
}

export type TieredHandler = (
  req: VercelRequest,
  res: VercelResponse,
  ctx: AuthorizedContext & { tier: TierKey },
) => Promise<void> | void;

/**
 * Wrap an API handler with tier gating. The handler only runs if the
 * user's tier meets the required tier.
 */
export function withTierGate(
  requiredTier: TierKey,
  handler: TieredHandler,
  options: TierGateOptions = {},
) {
  const { allowAnonymous = false, softDeny = false } = options;

  return async function tierGatedHandler(req: VercelRequest, res: VercelResponse) {
    let ctx: AuthorizedContext;
    try {
      ctx = await getAuthorizedContext(req, allowAnonymous);
    } catch (err: any) {
      res.status(401).json({
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
      return;
    }

    const userTier = normalizeTier(ctx.userId ? (ctx as any).tier : null) ?? DEFAULT_TIER;

    if (!tierMeets(userTier, requiredTier)) {
      const requiredMeta = TIERS[requiredTier];
      if (softDeny) {
        res.status(200).json({
          ok: false,
          soft_gate: true,
          required_tier: requiredTier,
          required_tier_display: requiredMeta.displayName,
          current_tier: userTier,
          message: `[Soft gate: ${requiredMeta.displayName} tier required. You're on ${TIERS[userTier].displayName}.]`,
          upgrade_url: '/pricing',
        });
      } else {
        res.status(403).json({
          ok: false,
          error: 'TIER_REQUIRED',
          required_tier: requiredTier,
          required_tier_display: requiredMeta.displayName,
          current_tier: userTier,
          upgrade_url: '/pricing',
          message: `This feature requires the ${requiredMeta.displayName} tier or above.`,
        });
      }
      return;
    }

    // User meets the tier — run the handler with tier context.
    await handler(req, res, { ...ctx, tier: userTier });
  };
}

/**
 * Check a specific feature flag for the authenticated user.
 * Returns the feature value or null if the user is unauthenticated.
 */
export function checkFeature(
  ctx: AuthorizedContext | null,
  feature: string,
): boolean {
  if (!ctx) return false;
  const tier = normalizeTier((ctx as any).tier) ?? DEFAULT_TIER;
  const features = TIERS[tier].features;
  return Boolean((features as any)[feature]);
}
