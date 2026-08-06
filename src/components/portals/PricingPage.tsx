import React, { useState, useEffect } from 'react';
import { Check, Crown, Sparkles, ArrowRight, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchTiers,
  createCheckoutSession,
  type Tier,
  type TierKey,
  type BillingCycle,
} from '@/services/monetizationService';

export interface PricingPageProps {
  /** Initial billing cycle */
  initialCycle?: BillingCycle;
  /** Additional className */
  className?: string;
}

const ACCENT = '#C108AB';

const TIER_ICONS: Record<TierKey, React.ReactNode> = {
  explorer: <Zap className="w-6 h-6 text-white" />,
  starter: <Sparkles className="w-6 h-6 text-white" />,
  pro: <Crown className="w-6 h-6 text-white" />,
  executive: <Crown className="w-6 h-6 text-white" />,
  council: <Crown className="w-6 h-6 text-white" />,
};

const TIER_COLORS: Record<TierKey, string> = {
  explorer: '#666666',
  starter: '#C108AB',
  pro: '#C108AB',
  executive: '#C108AB',
  council: '#C108AB',
};

/**
 * PricingPage — public pricing page.
 * Displays all tiers with features and CTAs.
 * Zero border-radius, crimson #C108AB accent.
 */
export function PricingPage({ initialCycle = 'monthly', className }: PricingPageProps) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [cycle, setCycle] = useState<BillingCycle>(initialCycle);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchTiers()
      .then((data) => {
        if (mounted) setTiers(data);
      })
      .catch(() => {
        if (mounted) {
          setTiers([
            { key: 'explorer', name: 'Explorer', priceMonthly: 0, priceAnnual: 0, features: ['Basic chat', '2 credits/day'] },
            { key: 'starter', name: 'Starter', priceMonthly: 29, priceAnnual: 290, features: ['Unlimited chat', 'All assessments', 'PDF export'] },
            { key: 'pro', name: 'Pro', priceMonthly: 99, priceAnnual: 990, features: ['Everything in Starter', 'Peer matching', 'Deliverables'] },
            { key: 'executive', name: 'Executive', priceMonthly: 299, priceAnnual: 2990, features: ['Everything in Pro', 'Executive reviews', 'Events'] },
            { key: 'council', name: 'Council', priceMonthly: 999, priceAnnual: 9990, features: ['Everything in Executive', 'Live sessions', 'Workshops'] },
          ]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = async (tierKey: TierKey) => {
    setProcessingTier(tierKey);
    setError(null);

    try {
      const session = await createCheckoutSession(tierKey, cycle);
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e: any) {
      console.error('Checkout error:', e);
      setError(e?.message || 'Failed to start checkout');
      setProcessingTier(null);
    }
  };

  const handleSelectFree = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className={cn('min-h-screen bg-white', className)}>
      {/* Header */}
      <div
        className="py-16 px-4 text-center"
        style={{
          background: `linear-gradient(180deg, ${ACCENT}08 0%, white 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium"
            style={{
              background: `${ACCENT}12`,
              color: ACCENT,
              borderRadius: 0,
            }}
          >
            <Sparkles className="w-4 h-4" />
            Choose Your Path
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: '#000' }}
          >
            Unlock Your Leadership Potential
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#666' }}>
            From free exploration to executive council, pick the tier that matches your ambitions.
          </p>

          {/* Cycle toggle */}
          <div className="inline-flex mt-8 overflow-hidden" style={{ borderRadius: 0 }}>
            <button
              onClick={() => setCycle('monthly')}
              className={cn(
                'px-6 py-2 font-medium text-sm transition-colors',
                cycle === 'monthly' ? 'text-white' : 'text-gray-600 hover:opacity-70'
              )}
              style={{
                background: cycle === 'monthly' ? ACCENT : '#F5F5F5',
                borderRadius: 0,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle('annual')}
              className={cn(
                'px-6 py-2 font-medium text-sm transition-colors',
                cycle === 'annual' ? 'text-white' : 'text-gray-600 hover:opacity-70'
              )}
              style={{
                background: cycle === 'annual' ? ACCENT : '#F5F5F5',
                borderRadius: 0,
              }}
            >
              Annual <span className="ml-1 text-xs opacity-80">Save ~17%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse"
                style={{ background: '#F5F5F5', borderRadius: 0 }}
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const price = cycle === 'monthly' ? tier.priceMonthly : tier.priceAnnual;
              const isFree = price === 0;
              const isPopular = tier.key === 'starter' || tier.key === 'pro';
              const isProcessing = processingTier === tier.key;
              const tierKey = tier.key as TierKey;

              return (
                <div
                  key={tier.key}
                  className={cn(
                    'relative p-8 bg-white transition-shadow hover:shadow-lg flex flex-col',
                    isPopular ? 'ring-2' : 'border',
                  )}
                  style={{
                    borderColor: isPopular ? ACCENT : '#E5E5E5',
                    borderRadius: 0,
                  }}
                >
                  {isPopular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium text-white"
                      style={{ background: ACCENT, borderRadius: 0 }}
                    >
                      Most Popular
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className="w-12 h-12 flex items-center justify-center mb-4"
                    style={{
                      background: TIER_COLORS[tierKey] || ACCENT,
                      borderRadius: 0,
                    }}
                  >
                    {TIER_ICONS[tierKey]}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold mb-1" style={{ color: '#000' }}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-4">
                    {isFree ? (
                      <span
                        className="text-3xl font-bold"
                        style={{ color: '#000' }}
                      >
                        Free
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-3xl font-bold tabular-nums"
                          style={{ color: '#000' }}
                        >
                          ${price}
                        </span>
                        <span className="text-sm opacity-60">
                          /{cycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: ACCENT }}
                        />
                        <span style={{ color: '#333' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => (isFree ? handleSelectFree() : handleSelect(tierKey))}
                    disabled={isProcessing}
                    className={cn(
                      'w-full py-3 px-4 font-semibold flex items-center justify-center gap-2 transition-colors',
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                    )}
                    style={{
                      background: isFree ? '#F5F5F5' : ACCENT,
                      color: isFree ? '#000' : 'white',
                      borderRadius: 0,
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isFree ? 'Get Started' : `Choose ${tier.name}`}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            className="mt-6 p-4 text-center text-sm"
            style={{
              background: '#FEE2E2',
              border: '1px solid #EF4444',
              color: '#991B1B',
              borderRadius: 0,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Feature comparison */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ color: '#000' }}>
          Compare Features
        </h2>
        <div
          className="overflow-hidden"
          style={{ border: '1px solid #E5E5E5', borderRadius: 0 }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F5F5F5' }}>
                <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#333' }}>
                  Feature
                </th>
                {['Explorer', 'Starter', 'Pro', 'Executive', 'Council'].map((n) => (
                  <th
                    key={n}
                    className="px-6 py-4 text-center text-sm font-semibold"
                    style={{ color: '#333' }}
                  >
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Chat Messages', values: ['Basic', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
                { feature: 'Assessments', values: ['1', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
                { feature: 'PDF Export', values: ['—', '✓', '✓', '✓', '✓'] },
                { feature: 'Peer Matching', values: ['—', '—', '✓', '✓', '✓'] },
                { feature: 'Executive Reviews', values: ['—', '—', '—', '✓', '✓'] },
                { feature: 'Live Sessions', values: ['—', '—', '—', '—', '✓'] },
                { feature: 'Workshops', values: ['—', '—', '—', '—', '✓'] },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? 'white' : '#FAFAFA',
                    borderTop: '1px solid #E5E5E5',
                  }}
                >
                  <td className="px-6 py-3 text-sm font-medium" style={{ color: '#000' }}>
                    {row.feature}
                  </td>
                  {row.values.map((v, j) => (
                    <td
                      key={j}
                      className="px-6 py-3 text-center text-sm"
                      style={{
                        color: v === '✓' ? ACCENT : v === '—' ? '#CCC' : '#333',
                      }}
                    >
                      {v === '✓' ? (
                        <Check className="w-4 h-4 mx-auto" style={{ color: ACCENT }} />
                      ) : (
                        v
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
