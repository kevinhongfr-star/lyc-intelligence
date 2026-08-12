import React, { useMemo, useState } from 'react';
import { Check, Crown, Sparkles, ArrowRight, Loader2, Globe, Coins } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import { SEO } from '@/components/seo/SEO';
import {
  CANONICAL_TIER_ORDER,
  CANONICAL_TIER_PRICING,
  CANONICAL_ASSESSMENT_ORDER,
  CANONICAL_ASSESSMENT_PRICING,
  RECOMMENDED_TIER,
  detectUserCurrency,
  formatTierPrice,
  formatAssessmentPrice,
  type PricingCurrency,
  type TierKey,
} from '@/services/monetizationService';
import { trackUpgradeAttempt, trackCTA, trackBillingView } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

const STRIPE_PRICE_ENV: Record<TierKey, string | undefined> = {
  explorer: undefined,
  starter: import.meta.env.VITE_STRIPE_PRICE_STARTER as string | undefined,
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string | undefined,
  executive: import.meta.env.VITE_STRIPE_PRICE_EXECUTIVE as string | undefined,
  council: import.meta.env.VITE_STRIPE_PRICE_COUNCIL as string | undefined,
};

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, profile } = useAuthStore();

  // Track pricing/billing view on mount
  React.useEffect(() => {
    trackBillingView(user ? 'portal_nav' : 'direct_link');
  }, [user]);

  // Currency: explicit toggle > user preference > auto-detect.
  const detected = useMemo<PricingCurrency>(() => {
    const pref = (profile as any)?.currency_preference ?? null;
    return detectUserCurrency({ preference: pref });
  }, [profile]);

  const [currency, setCurrency] = useState<PricingCurrency>(detected);
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (tierKey: TierKey) => {
    if (tierKey === 'explorer') {
      // Explorer = Executive Introduction → no checkout, just send to dashboard.
      trackCTA({ location: 'pricing_tier', label: 'Explorer CTA', destination: user ? '/dashboard' : '/login', context_id: tierKey });
      if (!user) {
        window.location.href = '/login';
      } else {
        window.location.href = '/dashboard';
      }
      return;
    }

    trackUpgradeAttempt(tierKey, 'pricing_page');
    setLoadingTier(tierKey);
    setError(null);

    try {
      const priceId = STRIPE_PRICE_ENV[tierKey];
      if (!priceId) {
        throw new Error(
          `${CANONICAL_TIER_PRICING[tierKey].label} plan is not configured yet. Please contact support.`,
        );
      }
      const response = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          tier: tierKey,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <SEO page="pricing" />
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-text-primary mb-4">
          Choose Your Plan
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">
          Five tiers, calibrated to where you are in your executive journey.
          Currency is <span className="font-medium">miles</span> — earn monthly, spend on assessments.
        </p>

        {/* Currency Toggle */}
        <div className="mt-6 inline-flex items-center bg-white border border-border">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
              currency === 'USD' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
            aria-pressed={currency === 'USD'}
          >
            <Globe className="w-4 h-4" />
            Global · USD
          </button>
          <button
            onClick={() => setCurrency('CNY')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${
              currency === 'CNY' ? 'bg-accent text-white' : 'text-text-secondary hover:bg-bg-tertiary'
            }`}
            aria-pressed={currency === 'CNY'}
          >
            <Coins className="w-4 h-4" />
            China · CNY
          </button>
        </div>
        <p className="text-xs text-text-muted mt-2">
          China pricing reflects a 1/3 regional adjustment, shown in CNY.
        </p>
      </div>

      {/* Subscription Tier Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CANONICAL_TIER_ORDER.map((tierKey) => {
            const tier = CANONICAL_TIER_PRICING[tierKey];
            const price = formatTierPrice(tierKey, currency);
            const isRecommended = tierKey === RECOMMENDED_TIER;
            const isCurrent = profile?.tier === tierKey || profile?.tier === tier.key;
            const isExplorer = tierKey === 'explorer';
            const isLoading = loadingTier === tierKey;

            return (
              <div
                key={tierKey}
                className={`relative border-2 p-6 flex flex-col ${
                  isRecommended
                    ? 'border-accent bg-gradient-to-b from-accent/5 to-white shadow-xl'
                    : 'border-border bg-white shadow-sm hover:shadow-md transition-shadow'
                }`}
              >
                {isRecommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-accent text-white px-4 py-1 text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-4 right-2">
                    <span className="bg-green-500 text-white px-3 py-1 text-xs font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Tier label */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-text-primary">
                    {isExplorer ? tier.alias : tier.label}
                  </h3>
                  {isExplorer && (
                    <p className="text-xs text-text-muted uppercase tracking-wide mt-1">
                      Complimentary access
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  {price.isZero ? (
                    <div>
                      <div className="text-2xl font-bold text-text-primary leading-tight">
                        Executive Introduction
                      </div>
                      <div className="text-sm text-text-muted mt-1">
                        {price.secondary}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-text-primary">
                        {price.primary}
                      </span>
                      <span className="text-sm text-text-muted">
                        {currency === 'CNY' ? '/ 月' : '/ mo'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Monthly miles */}
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="text-xs text-text-muted uppercase tracking-wide">Monthly miles</div>
                  <div className="text-2xl font-semibold text-accent">
                    {tier.monthlyMiles === 0 ? '—' : `${tier.monthlyMiles} mi`}
                  </div>
                  {tier.earnsMiles && (
                    <div className="text-xs text-text-muted mt-1">Earns miles via NEXUS actions</div>
                  )}
                </div>

                {/* Benefits */}
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-text-secondary">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(tierKey)}
                  disabled={isLoading || isCurrent}
                  className={`w-full py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? 'bg-bg-tertiary text-text-muted cursor-default'
                      : isRecommended
                        ? 'bg-accent text-white hover:bg-accent-hover'
                        : 'bg-bg-tertiary text-text-primary hover:bg-bg-secondary'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : isExplorer ? (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Upgrade to {tier.label}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {error && !isCurrent && loadingTier === null && !isExplorer && (
                  <p className="text-red-500 text-xs mt-2 text-center">{error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Pricing Section */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Assessment Pricing</h2>
          <p className="text-text-muted">
            Three price tiers across the 11-instrument catalog. Pay once per assessment — miles or fiat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CANONICAL_ASSESSMENT_ORDER.map((priceTier) => {
            const p = CANONICAL_ASSESSMENT_PRICING[priceTier];
            const display = formatAssessmentPrice(priceTier, currency);
            const isUnique = priceTier === 'unique';

            return (
              <div
                key={priceTier}
                className={`border-2 p-6 flex flex-col ${
                  isUnique
                    ? 'border-accent bg-gradient-to-b from-accent/5 to-white'
                    : 'border-border bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {isUnique && <Crown className="w-5 h-5 text-accent" />}
                  <h3 className="text-lg font-bold text-text-primary">{p.label}</h3>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-text-primary">{display.primary}</span>
                  <span className="text-sm text-text-muted">one-time</span>
                </div>
                <div className="text-sm text-accent font-medium mb-4">
                  {display.miles} mi
                </div>

                <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Instruments
                </div>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {p.instruments.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary border border-border"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Feature Comparison
        </h2>
        <div className="bg-white border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-tertiary">
                <th className="px-4 py-3 text-left font-medium text-text-secondary">Feature</th>
                {CANONICAL_TIER_ORDER.map((tierKey) => {
                  const tier = CANONICAL_TIER_PRICING[tierKey];
                  const isRecommended = tierKey === RECOMMENDED_TIER;
                  return (
                    <th
                      key={tierKey}
                      className={`px-4 py-3 text-center font-medium ${
                        isRecommended ? 'text-accent' : 'text-text-secondary'
                      }`}
                    >
                      {tierKey === 'explorer' ? tier.alias : tier.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  feature: 'Monthly miles',
                  values: ['—', '50 mi', '150 mi', '300 mi', '600 mi'],
                },
                {
                  feature: 'NEXUS chat',
                  values: ['Executive Introduction', 'Standard', 'Priority', 'Priority', 'Unlimited'],
                },
                {
                  feature: 'All 11 assessments',
                  values: ['Preview only', '✓', '✓', '✓', '✓'],
                },
                {
                  feature: 'Personalised reports',
                  values: ['—', '✓', '✓', '✓', '✓'],
                },
                {
                  feature: 'Peer benchmarking',
                  values: ['—', '—', '✓', '✓', '✓'],
                },
                {
                  feature: 'Deliverable workspace',
                  values: ['—', '—', '✓', '✓', '✓'],
                },
                {
                  feature: 'Executive consultant debriefs',
                  values: ['—', '—', '—', '✓', '✓'],
                },
                {
                  feature: 'Live event access',
                  values: ['—', '—', '—', '✓', '✓'],
                },
                {
                  feature: 'Council community & workshops',
                  values: ['—', '—', '—', '—', '✓'],
                },
                {
                  feature: 'NEXUS miles earning',
                  values: ['—', '✓', '✓', '✓', '✓'],
                },
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-bg-tertiary/50'}>
                  <td className="px-4 py-3 text-text-secondary">{row.feature}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center">
                      {val === '✓' ? (
                        <Check className="w-4 h-4 text-accent mx-auto" />
                      ) : val === '—' ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <span
                          className={`font-medium ${
                            j === CANONICAL_TIER_ORDER.indexOf(RECOMMENDED_TIER)
                              ? 'text-accent'
                              : 'text-text-primary'
                          }`}
                        >
                          {val}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-text-primary text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              question: 'Can I cancel my subscription at any time?',
              answer:
                'Yes. You can cancel any paid subscription at any time. You will continue to have access until the end of your current billing period, after which your account returns to Executive Introduction status.',
            },
            {
              question: 'How do miles work?',
              answer:
                'Miles are the LYC Intelligence currency. Starter, Pro, Executive, and Council tiers receive a monthly miles allowance on their billing anniversary. You spend miles to run assessments from the 11-instrument catalog. Executive Introduction (Explorer) accounts do not receive a monthly allowance but can still explore the NEXUS chat and assessment previews.',
            },
            {
              question: 'Can I earn additional miles?',
              answer:
                'Yes — subscribers at Starter tier and above earn miles by completing NEXUS framework exploration sessions (+5 mi), guided reflections (+3 mi), and receive a one-time completion refund (+10 mi) per assessment instrument.',
            },
            {
              question: 'Can I upgrade or downgrade my plan?',
              answer:
                'Absolutely. You can change tiers at any time. Upgrades take effect immediately; downgrades take effect at the end of your current billing cycle.',
            },
            {
              question: 'Do unused miles roll over?',
              answer:
                'Monthly miles allowances reset on your billing anniversary. Miles earned through NEXUS actions (exploration, reflection, completion refunds) remain on your balance until spent.',
            },
            {
              question: 'What payment methods are accepted?',
              answer:
                'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. Apple Pay and Google Pay are supported where available. China-region users may also see local payment options during checkout.',
            },
            {
              question: 'Why is China pricing lower?',
              answer:
                'China pricing reflects a regional adjustment (~1/3 of global USD pricing) shown in CNY. This aligns with regional market expectations while keeping the miles economy consistent worldwide.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-border p-6">
              <h3 className="font-semibold text-text-primary mb-2">{faq.question}</h3>
              <p className="text-text-muted text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-accent p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Ready to Elevate Your Leadership?</h2>
          <p className="mb-6 opacity-90">
            Join {CANONICAL_TIER_PRICING[RECOMMENDED_TIER].label} today and unlock the full NEXUS miles economy.
          </p>
          <button
            onClick={() => handleUpgrade(RECOMMENDED_TIER)}
            disabled={loadingTier !== null}
            className="bg-white text-accent px-8 py-3 font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
          >
            {loadingTier === RECOMMENDED_TIER ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade to {CANONICAL_TIER_PRICING[RECOMMENDED_TIER].label}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
