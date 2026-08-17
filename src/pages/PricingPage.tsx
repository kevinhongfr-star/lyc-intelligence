/**
 * PricingPage — Batch 1.5 / Ticket 4
 *
 * Renders the 5-column PricingPageShell (structural scaffold).
 * All tier data is data-driven from @/config/tiers.
 * Stripe checkout handler preserved from prior implementation.
 *
 * Copy is placeholder — Emily will fill in later.
 */
import React, { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import { SEO } from '@/components/seo/SEO';
import { trackUpgradeAttempt, trackCTA, trackBillingView } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { PricingPageShell } from '@/components/tier/PricingPageShell';
import {
  TIERS,
  TIER_PRICING,
  normalizeTier,
  type TierKey,
  type BillingCycle,
} from '@/config/tiers';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

// Stripe price env vars (blocked on Kevin — #1338). Map canonical tier → env.
const STRIPE_PRICE_ENV: Partial<Record<TierKey, string | undefined>> = {
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER as string | undefined,
  professional: import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined,
  executive: import.meta.env.VITE_STRIPE_PRICE_EXECUTIVE as string | undefined,
  council: import.meta.env.VITE_STRIPE_PRICE_COUNCIL as string | undefined,
};

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, profile } = useAuthStore();

  React.useEffect(() => {
    trackBillingView(user ? 'portal_nav' : 'direct_link');
  }, [user]);

  const currentTier = useMemo(() => {
    return normalizeTier(profile?.tier as string | undefined) ?? 'explorer';
  }, [profile?.tier]);

  const handleSelectTier = async (tierKey: TierKey) => {
    // Entry tier — no checkout, send to dashboard/login.
    if (tierKey === 'explorer') {
      trackCTA({
        location: 'pricing_tier',
        label: 'Start Complimentary Baseline',
        destination: user ? '/dashboard' : '/login',
        context_id: tierKey,
      });
      window.location.href = user ? '/dashboard' : '/login';
      return;
    }

    trackUpgradeAttempt(tierKey, 'pricing_page');

    try {
      const priceId = STRIPE_PRICE_ENV[tierKey];
      if (!priceId) {
        // Stripe keys not configured yet (#1338) — graceful fallback.
        throw new Error(
          `${TIERS[tierKey].displayName} checkout is being configured. Please contact LYC Partners to upgrade.`,
        );
      }
      const cycle: BillingCycle = 'monthly'; // shell default; will wire from toggle in X0
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
      // Soft error — shell stays interactive
      alert(e.message || 'Failed to start upgrade');
    }
  };

  return (
    <>
      <SEO page="pricing" />
      <PricingPageShell onSelectTier={handleSelectTier} />
    </>
  );
}
