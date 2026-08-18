import React from 'react';
import { Globe, Coins, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { PricingCurrency, BillingCycle } from '@/config/pricingData';

export interface PricingHeroProps {
  currency: PricingCurrency;
  onCurrencyChange: (currency: PricingCurrency) => void;
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

export const PricingHero: React.FC<PricingHeroProps> = ({
  currency,
  onCurrencyChange,
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-accent/5 via-tier-1Bg/40 to-white pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
          Executive Intelligence — Currency is diagnostic miles
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-text-primary mb-6">
          Executive Intelligence
        </h1>

        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
          Five tiers, calibrated to where you are in your executive journey.
          Earn diagnostic miles monthly, spend them on diagnostics across the
          complete portfolio.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div
            className="inline-flex items-center rounded-lg border border-bg-tertiary bg-white p-1 shadow-sm"
            role="group"
            aria-label="Currency selection"
          >
            <Button
              variant={currency === 'USD' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onCurrencyChange('USD')}
              className="gap-1.5"
              aria-pressed={currency === 'USD'}
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              USD
            </Button>
            <Button
              variant={currency === 'CNY' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onCurrencyChange('CNY')}
              className="gap-1.5"
              aria-pressed={currency === 'CNY'}
            >
              <span className="text-sm">¥</span>
              CNY
            </Button>
          </div>

          <div
            className="inline-flex items-center rounded-lg border border-bg-tertiary bg-white p-1 shadow-sm"
            role="group"
            aria-label="Billing cycle"
          >
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onBillingCycleChange('monthly')}
              className="gap-1.5"
              aria-pressed={billingCycle === 'monthly'}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'annual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onBillingCycleChange('annual')}
              className="gap-1.5"
              aria-pressed={billingCycle === 'annual'}
            >
              Annual
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-tier-1Bg text-tier-1 font-semibold">
                −20%
              </span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Pro is the recommended tier — 150 diagnostic miles monthly for active executives.
        </p>
      </div>
    </section>
  );
};
