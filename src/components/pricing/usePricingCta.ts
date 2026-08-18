/**
 * usePricingCta.ts — CTA funnel logic for the pricing page (Batch 3 / Ticket 9).
 *
 * Encapsulates the per-tier CTA mapping:
 *  - Explorer  → free signup (no credit card), redirect to /dashboard or /login
 *  - Starter/Pro/Executive → Stripe checkout (monthly or annual)
 *  - Council   → application flow (invite-only, never self-serve signup)
 *
 * Also handles the Explorer → Starter upgrade nudge (triggered after
 * complimentary diagnostics are used) and money-back guarantee placement.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import { trackUpgradeAttempt, trackCTA } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import {
  TIERS,
  isSelfServeUpgradeAllowed,
  type TierKey,
  type BillingCycle,
} from '@/config/tiers';

/** Stripe price env var mapping per paid tier. */
const STRIPE_PRICE_ENV: Partial<Record<TierKey, string | undefined>> = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER as string | undefined,
  professional: import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined,
  executive: import.meta.env.VITE_STRIPE_PRICE_EXECUTIVE as string | undefined,
  council: import.meta.env.VITE_STRIPE_PRICE_COUNCIL as string | undefined,
};

export type CtaAction = 'free_signup' | 'stripe_checkout' | 'apply' | 'current';

export interface CtaConfig {
  action: CtaAction;
  label: string;
  /** Whether the button is disabled (e.g. current tier). */
  disabled: boolean;
}

/**
 * Determine the CTA config for a tier given the user's current tier.
 * Council is always "Apply" (invite-only). Explorer is always "Start complimentary".
 * Paid tiers are "Choose X" via Stripe, disabled if it's the current tier.
 */
export function getCtaConfig(tierKey: TierKey, currentTier: TierKey): CtaConfig {
  if (tierKey === currentTier) {
    return { action: 'current', label: 'Current plan', disabled: true };
  }
  if (tierKey === 'explorer') {
    return { action: 'free_signup', label: 'Start complimentary', disabled: false };
  }
  if (tierKey === 'council' || !isSelfServeUpgradeAllowed(tierKey)) {
    return { action: 'apply', label: 'Request invite', disabled: false };
  }
  return {
    action: 'stripe_checkout',
    label: `Choose ${TIERS[tierKey].displayName}`,
    disabled: false,
  };
}

export interface UsePricingCtaResult {
  /** Get the CTA config for a tier. */
  getCta: (tierKey: TierKey) => CtaConfig;
  /** Execute the CTA action for a tier. */
  handleSelectTier: (tierKey: TierKey, cycle: BillingCycle) => Promise<void>;
  /** Current user tier (normalized). */
  currentTier: TierKey;
}

/**
 * Pricing CTA hook. Manages Stripe checkout, free signup redirect, and
 * Council application flow. Used by the pricing page and tier cards.
 */
export function usePricingCta(onUpgradeSuccess?: () => void): UsePricingCtaResult {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();

  const currentTier: TierKey = (() => {
    const raw = profile?.tier as string | undefined;
    const normalized = raw === 'starter' || raw === 'professional' || raw === 'executive' || raw === 'council' || raw === 'explorer'
      ? (raw as TierKey)
      : 'explorer';
    return normalized;
  })();

  const handleSelectTier = useCallback(
    async (tierKey: TierKey, cycle: BillingCycle) => {
      const config = getCtaConfig(tierKey, currentTier);
      if (config.disabled) return;

      // ── Free signup (Explorer) ──
      if (config.action === 'free_signup') {
        trackCTA({
          location: 'pricing_tier',
          label: 'Start Complimentary',
          destination: user ? '/dashboard' : '/login',
          context_id: tierKey,
        });
        navigate(user ? '/dashboard' : '/login');
        return;
      }

      // ── Council application flow (invite-only) ──
      if (config.action === 'apply') {
        trackCTA({
          location: 'pricing_tier',
          label: 'Request Invite',
          destination: '/council/apply',
          context_id: tierKey,
        });
        // Route to application page (or contact fallback).
        navigate('/council/apply');
        return;
      }

      // ── Stripe checkout (paid tiers) ──
      trackUpgradeAttempt(tierKey, 'pricing_page');

      try {
        const priceId = STRIPE_PRICE_ENV[tierKey];
        if (!priceId) {
          // Stripe keys not configured yet (#1338) — graceful fallback.
          throw new Error(
            `${TIERS[tierKey].displayName} checkout is being configured. Please contact LYC Partners to upgrade.`,
          );
        }
        const response = await authFetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId,
            tier: tierKey,
            cycle,
            successUrl: `${window.location.origin}/account/billing?upgraded=true&tier=${tierKey}`,
            cancelUrl: `${window.location.origin}/pricing?canceled=true`,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          onUpgradeSuccess?.();
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } catch (e: any) {
        console.error('Upgrade error:', e);
        reportError(e, { scope: 'pricing:checkout', severity: 'error', extra: { tier: tierKey } });
        alert(e.message || 'Failed to start upgrade');
      }
    },
    [currentTier, user, navigate, onUpgradeSuccess],
  );

  const getCta = useCallback(
    (tierKey: TierKey) => getCtaConfig(tierKey, currentTier),
    [currentTier],
  );

  return { getCta, handleSelectTier, currentTier };
}
