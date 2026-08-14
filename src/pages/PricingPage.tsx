/**
 * PricingPage — W3-4 / #1318 / #1330
 *
 * 3 marketing tiers (Executive Introduction / Professional / Executive).
 * Backend supports 5 tiers; Council + Enterprise are hidden, sales-only.
 *
 * Brand rules:
 *  - Zero border radius everywhere (#1349).
 *  - System serif headings, DM Sans body, IBM Plex Mono labels.
 *  - Fuchsia page accent (#C108AB) — conversion moment.
 *  - NEVER "free" — "Executive Introduction" / "complimentary".
 *  - Premium voice, no SaaS/freemium framing.
 *
 * Config source of truth: @/config/tierConfig.ts (TIER_PRICING, MARKETING_TIERS,
 * TIER_MARKETING_BENEFITS, computeTierPrice).
 */
import React, { useMemo, useState } from 'react';
import { Check, ArrowRight, Loader2, Globe, Coins } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import { SEO } from '@/components/seo/SEO';
import { trackUpgradeAttempt, trackCTA, trackBillingView } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { DS, TEAL, ERROR } from '@/tokens';
import {
  MARKETING_TIERS,
  RECOMMENDED_TIER,
  TIER_META,
  TIER_PRICING,
  TIER_MARKETING_BENEFITS,
  TIER_CTA_LABEL,
  computeTierPrice,
  formatPrice,
  normalizeTier,
  tierMeets,
  ANNUAL_SAVE_PERCENT,
  type TierKey,
  type PricingCurrency,
  type BillingCycle,
} from '@/config/tierConfig';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

// Stripe price env vars (blocked on Kevin — #1338). Map canonical tier → env.
const STRIPE_PRICE_ENV: Partial<Record<TierKey, string | undefined>> = {
  professional: import.meta.env.VITE_STRIPE_PRICE_STARTER as string | undefined,
  executive: import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined,
};

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, profile } = useAuthStore();

  React.useEffect(() => {
    trackBillingView(user ? 'portal_nav' : 'direct_link');
  }, [user]);

  const [currency, setCurrency] = useState<PricingCurrency>('USD');
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTier = useMemo(
    () => normalizeTier(profile?.tier) ?? 'executive_introduction',
    [profile?.tier],
  );

  const handleUpgrade = async (tierKey: TierKey) => {
    setError(null);

    // Entry tier — no checkout, send to dashboard/login.
    if (tierKey === 'executive_introduction') {
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
    setLoadingTier(tierKey);

    try {
      const priceId = STRIPE_PRICE_ENV[tierKey];
      if (!priceId) {
        // Stripe keys not configured yet (#1338) — graceful fallback.
        throw new Error(
          `${TIER_META[tierKey].displayName} checkout is being configured. Please contact LYC Partners to upgrade.`,
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
      setError(e.message || 'Failed to start upgrade');
    } finally {
      setLoadingTier(null);
    }
  };

  const cycleLabel = currency === 'CNY' ? '月' : 'mo';

  return (
    <div style={{ minHeight: '100vh', background: DS.bgAlt }}>
      <SEO page="pricing" />

      {/* ── HEADER ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: DS.monoFont,
            fontSize: 11,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: DS.muted,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          Plans &amp; Pricing
        </div>
        <h1
          style={{
            fontFamily: DS.headingFont,
            fontSize: 'clamp(32px, 4.5vw, 48px)',
            fontWeight: 700,
            color: DS.text,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Choose your tier.
        </h1>
        <p
          style={{
            fontFamily: DS.bodyFont,
            fontSize: 16,
            color: DS.textSecondary,
            lineHeight: 1.6,
            marginTop: 16,
            maxWidth: 520,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Three tiers, calibrated to where you are in your leadership journey.
          Start complimentary — upgrade when you're ready for the full catalog.
        </p>

        {/* Billing cycle toggle — annual default */}
        <div
          style={{
            marginTop: 32,
            display: 'inline-flex',
            background: DS.bg,
            border: `1px solid ${DS.border}`,
          }}
        >
          {(['monthly', 'annual'] as BillingCycle[]).map((c) => {
            const isActive = cycle === c;
            return (
              <button
                key={c}
                onClick={() => setCycle(c)}
                aria-pressed={isActive}
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '10px 20px',
                  background: isActive ? DS.accent : 'transparent',
                  color: isActive ? DS.bg : DS.textSecondary,
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: DS.transition,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {c}
                {c === 'annual' && (
                  <span
                    style={{
                      fontFamily: DS.monoFont,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      background: isActive ? 'rgba(255,255,255,0.25)' : `${DS.accent}1A`,
                      color: isActive ? DS.bg : DS.accent,
                      padding: '2px 6px',
                    }}
                  >
                    SAVE {ANNUAL_SAVE_PERCENT}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Currency toggle */}
        <div style={{ marginTop: 12, display: 'inline-flex', marginLeft: 8 }}>
          <div style={{ display: 'inline-flex', background: DS.bg, border: `1px solid ${DS.border}` }}>
            <button
              onClick={() => setCurrency('USD')}
              aria-pressed={currency === 'USD'}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 14px',
                background: currency === 'USD' ? DS.text : 'transparent',
                color: currency === 'USD' ? DS.bg : DS.textSecondary,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Globe style={{ width: 13, height: 13 }} /> USD
            </button>
            <button
              onClick={() => setCurrency('CNY')}
              aria-pressed={currency === 'CNY'}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 14px',
                background: currency === 'CNY' ? DS.text : 'transparent',
                color: currency === 'CNY' ? DS.bg : DS.textSecondary,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Coins style={{ width: 13, height: 13 }} /> CNY
            </button>
          </div>
        </div>
        {currency === 'CNY' && (
          <p style={{ fontFamily: DS.monoFont, fontSize: 10, color: DS.mutedDim, marginTop: 10, letterSpacing: '0.08em' }}>
            China regional pricing · ~1/3 of global USD
          </p>
        )}
      </div>

      {/* ── TIER CARDS ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 24px' }}>
        <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {MARKETING_TIERS.map((tierKey) => {
            const meta = TIER_META[tierKey];
            const isRecommended = tierKey === RECOMMENDED_TIER;
            const isEntry = tierKey === 'executive_introduction';
            const isCurrent = tierMeets(currentTier, tierKey) && tierKey === currentTier;
            const isLoading = loadingTier === tierKey;
            const price = computeTierPrice(tierKey, currency, cycle);
            const benefits = TIER_MARKETING_BENEFITS[tierKey];
            const ctaLabel = TIER_CTA_LABEL[tierKey];

            return (
              <div
                key={tierKey}
                style={{
                  position: 'relative',
                  background: isRecommended ? DS.bg : isEntry ? DS.bgAlt : DS.bgDark,
                  border: `1px solid ${isRecommended ? DS.accent : isEntry ? DS.border : 'transparent'}`,
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Most Popular badge */}
                {isRecommended && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    <span
                      style={{
                        background: DS.accent,
                        color: DS.bg,
                        fontFamily: DS.monoFont,
                        fontSize: 10,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        padding: '5px 14px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <span
                      style={{
                        fontFamily: DS.monoFont,
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: isEntry ? DS.muted : DS.bg,
                        opacity: 0.7,
                      }}
                    >
                      Current
                    </span>
                  </div>
                )}

                {/* Tier name */}
                <h3
                  style={{
                    fontFamily: DS.headingFont,
                    fontSize: 22,
                    fontWeight: 700,
                    color: isEntry || isRecommended ? DS.text : DS.bg,
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  {meta.displayName}
                </h3>
                <p
                  style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    color: isEntry || isRecommended ? DS.muted : 'rgba(255,255,255,0.6)',
                    marginTop: 4,
                  }}
                >
                  {isEntry ? 'Complimentary entry' : isRecommended ? 'Most chosen tier' : 'Premium tier'}
                </p>

                {/* Price */}
                <div style={{ marginTop: 24, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${isEntry || isRecommended ? DS.border : 'rgba(255,255,255,0.12)'}` }}>
                  {price.isZero ? (
                    <div>
                      <div
                        style={{
                          fontFamily: DS.headingFont,
                          fontSize: 32,
                          fontWeight: 700,
                          color: isEntry || isRecommended ? DS.text : DS.bg,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Complimentary
                      </div>
                      <div style={{ fontFamily: DS.bodyFont, fontSize: 12, color: isEntry || isRecommended ? DS.muted : 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                        No credit card required
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span
                        style={{
                          fontFamily: DS.headingFont,
                          fontSize: 40,
                          fontWeight: 700,
                          color: isEntry || isRecommended ? DS.text : DS.bg,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {formatPrice(price.perMonth, currency)}
                      </span>
                      <span style={{ fontFamily: DS.bodyFont, fontSize: 13, color: isEntry || isRecommended ? DS.muted : 'rgba(255,255,255,0.5)' }}>
                        / {cycleLabel}
                      </span>
                      {cycle === 'annual' && (
                        <span style={{ fontFamily: DS.monoFont, fontSize: 10, color: DS.accent, marginLeft: 8, letterSpacing: '0.08em' }}>
                          billed annually
                        </span>
                      )}
                    </div>
                  )}
                  {!price.isZero && (
                    <div style={{ fontFamily: DS.monoFont, fontSize: 10, color: isEntry || isRecommended ? DS.mutedDim : 'rgba(255,255,255,0.4)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {TIER_PRICING[tierKey].monthlyMiles} miles monthly
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {benefits.map((benefit) => (
                    <li key={benefit} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check
                        style={{
                          width: 15,
                          height: 15,
                          color: isRecommended ? DS.accent : isEntry ? TEAL : DS.accentLight,
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: DS.bodyFont,
                          fontSize: 13.5,
                          color: isEntry || isRecommended ? DS.textSecondary : 'rgba(255,255,255,0.82)',
                          lineHeight: 1.5,
                        }}
                      >
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(tierKey)}
                  disabled={isLoading || isCurrent}
                  style={{
                    width: '100%',
                    fontFamily: DS.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    padding: '14px 20px',
                    minHeight: 48,
                    cursor: isCurrent ? 'default' : 'pointer',
                    background: isCurrent
                      ? 'transparent'
                      : isRecommended
                        ? DS.accent
                        : isEntry
                          ? 'transparent'
                          : DS.bg,
                    color: isCurrent
                      ? (isEntry || isRecommended ? DS.mutedDim : 'rgba(255,255,255,0.4)')
                      : isRecommended
                        ? DS.bg
                        : isEntry
                          ? DS.text
                          : DS.bgDark,
                    border: `1px solid ${
                      isCurrent
                        ? (isEntry || isRecommended ? DS.border : 'rgba(255,255,255,0.2)')
                        : isRecommended
                          ? DS.accent
                          : isEntry
                            ? DS.text
                            : DS.bg
                    }`,
                    opacity: isLoading ? 0.6 : 1,
                    transition: DS.transition,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                      Processing…
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    <>
                      {ctaLabel}
                      <ArrowRight style={{ width: 15, height: 15 }} />
                    </>
                  )}
                </button>

                {error && !isCurrent && loadingTier === null && !isEntry && (
                  <p style={{ fontFamily: DS.bodyFont, fontSize: 11, color: ERROR, marginTop: 10, textAlign: 'center' }}>
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ENTERPRISE / TEAMS (hidden tier — separate B2B path) ── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px' }}>
        <div
          style={{
            border: `1px solid ${DS.border}`,
            background: DS.bg,
            padding: '40px 40px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <div style={{ flex: '1 1 320px' }}>
            <div
              style={{
                fontFamily: DS.monoFont,
                fontSize: 10,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: DS.muted,
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              For Teams &amp; Organizations
            </div>
            <h3
              style={{
                fontFamily: DS.headingFont,
                fontSize: 24,
                fontWeight: 700,
                color: DS.text,
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Council &amp; Enterprise tiers
            </h3>
            <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary, lineHeight: 1.6, marginTop: 12, maxWidth: 540 }}>
              Seat-based deployment with SSO, custom framework training, mandate-level
              confidentiality, and a dedicated point of contact. Built for retained search
              practices, in-house talent teams, and boards. Not self-serve — talk to us.
            </p>
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <a
              href="mailto:partners@lyc-partners.ai?subject=Council%20or%20Enterprise%20tier%20inquiry"
              onClick={() => trackCTA({ location: 'pricing_enterprise', label: 'Talk to Sales', destination: 'mailto' })}
              style={{
                fontFamily: DS.bodyFont,
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                padding: '14px 28px',
                minHeight: 48,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: DS.text,
                border: `1px solid ${DS.text}`,
                textDecoration: 'none',
                transition: DS.transition,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = DS.text; e.currentTarget.style.color = DS.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DS.text; }}
            >
              Talk to Sales
              <ArrowRight style={{ width: 15, height: 15 }} />
            </a>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h2
          style={{
            fontFamily: DS.headingFont,
            fontSize: 28,
            fontWeight: 700,
            color: DS.text,
            textAlign: 'center',
            letterSpacing: '-0.015em',
            marginBottom: 32,
          }}
        >
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel any paid subscription at any time. You keep access until the end of your current billing period, after which your account returns to Executive Introduction status.',
            },
            {
              q: 'What is Executive Introduction?',
              a: 'Executive Introduction is our complimentary entry tier. You get one complimentary assessment baseline, basic NEXUS chat access, and a personal profile — no credit card required. It is the natural starting point before upgrading.',
            },
            {
              q: 'What is the difference between Professional and Executive?',
              a: 'Professional unlocks all 11 assessments, full NEXUS access, and complete results history. Executive adds branded PDF reports, priority NEXUS responses, and advanced insights. Professional is the most popular tier; Executive is for users who want premium depth.',
            },
            {
              q: 'Do you offer team pricing?',
              a: 'Yes. Our Council and Enterprise tiers are designed for teams and organizations — seat-based deployment, SSO, custom training, and a dedicated contact. These are not self-serve; contact us to discuss your needs.',
            },
            {
              q: 'How do miles work?',
              a: 'Miles are the LYC Intelligence currency. Professional and Executive tiers receive a monthly miles allowance on their billing anniversary. You spend miles to run additional assessments and access premium features. Executive Introduction accounts do not receive a monthly allowance but can still explore NEXUS and assessment previews.',
            },
          ].map((faq) => (
            <div key={faq.q} style={{ background: DS.bg, border: `1px solid ${DS.border}`, padding: '24px 24px' }}>
              <h3
                style={{
                  fontFamily: DS.headingFont,
                  fontSize: 16,
                  fontWeight: 600,
                  color: DS.text,
                  margin: 0,
                  marginBottom: 8,
                }}
              >
                {faq.q}
              </h3>
              <p style={{ fontFamily: DS.bodyFont, fontSize: 14, color: DS.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
