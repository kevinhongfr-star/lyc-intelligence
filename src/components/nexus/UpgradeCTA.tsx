import React from 'react';
import { Crown, Sparkles, ArrowRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CANONICAL_TIER_PRICING,
  type TierKey,
} from '@/services/monetizationService';

export interface UpgradeCTAProps {
  /** Whether the CTA is visible */
  visible: boolean;
  /** Tier to upgrade to */
  targetTier?: TierKey;
  /** Miles shortfall that triggered this */
  shortfall?: number;
  /** Context description of what's locked */
  featureName?: string;
  /** Close handler */
  onDismiss: () => void;
  /** Upgrade handler */
  onUpgrade: (tier: TierKey) => void;
  /** Additional className */
  className?: string;
}

const ACCENT = '#C108AB';

const TIER_BENEFITS: Record<TierKey, string[]> = Object.fromEntries(
  (Object.keys(CANONICAL_TIER_PRICING) as TierKey[]).map((k) => [
    k,
    CANONICAL_TIER_PRICING[k].benefits,
  ]),
) as Record<TierKey, string[]>;

const TIER_NAMES: Record<TierKey, string> = Object.fromEntries(
  (Object.keys(CANONICAL_TIER_PRICING) as TierKey[]).map((k) => [
    k,
    k === 'explorer' ? CANONICAL_TIER_PRICING[k].alias! : CANONICAL_TIER_PRICING[k].label,
  ]),
) as Record<TierKey, string>;

const TIER_PRICES: Record<TierKey, string> = Object.fromEntries(
  (Object.keys(CANONICAL_TIER_PRICING) as TierKey[]).map((k) => {
    const t = CANONICAL_TIER_PRICING[k];
    return [k, t.usdMonthly === 0 ? 'Executive Introduction' : `$${t.usdMonthly}/mo`];
  }),
) as Record<TierKey, string>;

/**
 * UpgradeCTA — contextual upgrade prompt.
 * Appears when a user attempts an action requiring more miles or a higher tier.
 * Zero border-radius, crimson #C108AB accent.
 */
export function UpgradeCTA({
  visible,
  targetTier = 'starter',
  shortfall,
  featureName,
  onDismiss,
  onUpgrade,
  className,
}: UpgradeCTAProps) {
  if (!visible) return null;

  const benefits = TIER_BENEFITS[targetTier] || TIER_BENEFITS.starter;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        className
      )}
      role="dialog"
      aria-label="Upgrade Required"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onDismiss} aria-hidden="true" />

      <div
        className="relative max-w-md w-full bg-white shadow-2xl overflow-hidden"
        style={{ }}
      >
        {/* Header */}
        <div
          className="px-6 py-6 text-center relative"
          style={{
            background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT}CC 100%)`,
          }}
        >
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'white',
            }}
          >
            <Crown className="w-8 h-8" style={{ color: ACCENT }} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Upgrade to {TIER_NAMES[targetTier]}
          </h3>
          <p className="text-white/80 text-sm">
            {featureName
              ? `Unlock ${featureName} and more with a ${TIER_NAMES[targetTier]} subscription.`
              : 'Unlock premium features and get more miles.'}
          </p>
        </div>

        {/* Details */}
        <div className="px-6 py-5">
          {shortfall !== undefined && shortfall > 0 && (
            <div
              className="mb-4 p-3 text-sm"
              style={{
                background: `${ACCENT}10`,
                border: `1px solid ${ACCENT}40`,
                color: ACCENT,
              }}
            >
              You need <strong>{shortfall}</strong> more miles for this action.
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-4">
            <span
              className="text-3xl font-bold tabular-nums"
              style={{ color: ACCENT }}
            >
              {TIER_PRICES[targetTier]}
            </span>
            <span className="text-sm opacity-60">per month</span>
          </div>

          <ul className="space-y-2 mb-6">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                <span style={{ color: '#333' }}>{benefit}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onUpgrade(targetTier)}
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 transition-colors hover:opacity-90"
            style={{
              background: ACCENT,
              color: 'white',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onDismiss}
            className="w-full py-3 px-6 mt-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{
              background: 'transparent',
              color: '#666',
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
