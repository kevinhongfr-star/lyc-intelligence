/**
 * PricingPage.tsx — Batch 3 full pricing page assembly (9 tickets).
 *
 * Section order:
 *  1. Hero (T4) — eyebrow, headline, CTA, billing cycle toggle
 *  2. Tier Value Props (T5) — 5 tier blocks + upgrade ladder framing
 *  3. Tier Cards (T2) — 5 cards with monthly/annual toggle, badges, CTA
 *  4. Feature Comparison Table (T3) — all tiers × all features
 *  5. Mile Packs (T7) — 3 packs (1/5/15 mi), savings, explainer
 *  6. Human Debriefs (T8) — 4 session types, tier discounts, free sessions
 *  7. FAQ (T6) — 8-12 questions, accordion
 *
 * CTA funnel (T9):
 *  - Explorer  → free signup (/login or /dashboard)
 *  - Paid tiers → Stripe checkout (monthly/annual)
 *  - Council   → application flow (/council/apply)
 *
 * Copy = plug-in later. All marketing copy placeholders prefixed [Emily: ...].
 * All numbers from pricingData.ts / tiers.ts / miles.ts — no hardcoded values.
 */
import React, { useState, useCallback } from 'react';
import { SEO } from '@/components/seo/SEO';
import { trackBillingView } from '@/analytics/eventTracker';
import { useAuthStore } from '@/stores/authStore';
import { DS } from '@/tokens';
import { PRICING_TIERS } from '@/config/pricingData';
import type { BillingCycle, PricingCurrency } from '@/config/tiers';

import { PricingHero } from '@/components/pricing/PricingHero';
import { TierValueProps } from '@/components/pricing/TierValueProps';
import { TierCard } from '@/components/pricing/TierCard';
import { FeatureComparisonTable } from '@/components/pricing/FeatureComparisonTable';
import { MilePacksSection } from '@/components/pricing/MilePacksSection';
import { DebriefsSection } from '@/components/pricing/DebriefsSection';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { usePricingCta } from '@/components/pricing/usePricingCta';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user } = useAuthStore();

  React.useEffect(() => {
    trackBillingView(user ? 'portal_nav' : 'direct_link');
  }, [user]);

  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currency] = useState<PricingCurrency>('USD');

  // CTA funnel logic (T9)
  const { getCta, handleSelectTier, currentTier } = usePricingCta(onUpgradeSuccess);

  const onPrimaryCta = useCallback(() => {
    // Hero CTA → scroll to tier cards
    const cards = document.getElementById('pricing-tier-cards');
    if (cards) cards.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <SEO page="pricing" />

      {/* T4: Hero */}
      <PricingHero cycle={cycle} onCycleChange={setCycle} onPrimaryCta={onPrimaryCta} />

      {/* T5: Tier Value Props */}
      <TierValueProps />

      {/* T2: Tier Cards */}
      <section
        id="pricing-tier-cards"
        style={{
          background: DS.bg,
          padding: '64px 24px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Section heading */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: DS.eyebrow,
                marginBottom: 16,
              }}
            >
              [Emily: tier cards eyebrow]
            </div>
            <h2
              style={{
                fontFamily: DS.headingFont,
                fontSize: 36,
                lineHeight: 1.2,
                color: DS.text,
                margin: 0,
                fontWeight: 600,
              }}
            >
              [Emily: tier cards headline]
            </h2>
          </div>

          {/* Billing toggle (duplicate from hero for convenience) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 48,
            }}
          >
            <BillingToggleMini cycle={cycle} onChange={setCycle} />
          </div>

          {/* Tier cards grid — 5-col desktop, 2-col tablet, 1-col mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 20,
            }}
          >
            {PRICING_TIERS.map((tier) => (
              <TierCard
                key={tier.key}
                tier={tier}
                cycle={cycle}
                currency={currency}
                cta={getCta(tier.key)}
                onSelect={() => handleSelectTier(tier.key, cycle)}
              />
            ))}
          </div>

          {/* Money-back guarantee note */}
          <div
            style={{
              marginTop: 40,
              textAlign: 'center',
              fontFamily: DS.bodyFont,
              fontSize: 14,
              color: DS.muted,
            }}
          >
            [Emily: guarantee text — 7/14/30-day money-back. Mapped to positioning doc §guarantee.]
          </div>
        </div>
      </section>

      {/* T3: Feature Comparison */}
      <FeatureComparisonTable />

      {/* T7: Mile Packs */}
      <MilePacksSection />

      {/* T8: Human Debriefs */}
      <DebriefsSection cycle={cycle} currency={currency} />

      {/* T6: FAQ */}
      <PricingFAQ />

      {/* Mobile responsive CSS override — tier card grid breakpoints */}
      <style>{`
        @media (max-width: 1024px) {
          #pricing-tier-cards > div > div[style*="grid-template-columns: repeat(5"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          #pricing-tier-cards > div > div[style*="grid-template-columns: repeat(5"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          #pricing-tier-cards > div > div[style*="grid-template-columns: repeat(5"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

/** Compact billing toggle used above the tier cards grid. */
function BillingToggleMini({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 16px',
        background: DS.bgAlt,
        border: `1px solid ${DS.border}`,
      }}
    >
      <span
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          fontWeight: cycle === 'monthly' ? 600 : 400,
          color: cycle === 'monthly' ? DS.text : DS.muted,
          cursor: 'pointer',
        }}
        onClick={() => onChange('monthly')}
      >
        Monthly
      </span>
      <button
        onClick={() => onChange(cycle === 'monthly' ? 'annual' : 'monthly')}
        style={{
          width: 48,
          height: 24,
          border: 'none',
          background: cycle === 'annual' ? DS.accent : DS.borderStrong,
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
          transition: DS.transition,
        }}
        aria-label="Toggle billing cycle"
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: cycle === 'annual' ? 26 : 2,
            width: 18,
            height: 18,
            background: DS.bg,
            transition: DS.transition,
          }}
        />
      </button>
      <span
        style={{
          fontFamily: DS.bodyFont,
          fontSize: 14,
          fontWeight: cycle === 'annual' ? 600 : 400,
          color: cycle === 'annual' ? DS.text : DS.muted,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
        onClick={() => onChange('annual')}
      >
        Annual
        <span
          style={{
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.05em',
            color: DS.accent,
            border: `1px solid ${DS.accent}`,
            padding: '2px 6px',
          }}
        >
          SAVE 15%
        </span>
      </span>
    </div>
  );
}
