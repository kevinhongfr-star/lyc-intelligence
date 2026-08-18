import React from 'react';
import { Check, Crown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { PricingTier, PricingCurrency, TierKey } from '@/config/pricingData';

export interface TierCardProps {
  tier: PricingTier;
  currency: PricingCurrency;
  isRecommended?: boolean;
  isCurrent?: boolean;
  loading?: boolean;
  onUpgrade?: (tierKey: TierKey) => void;
}

export const TierCard: React.FC<TierCardProps> = ({
  tier,
  currency,
  isRecommended = false,
  isCurrent = false,
  loading = false,
  onUpgrade,
}) => {
  const isExplorer = tier.tier_key === 'explorer';
  const pricePrimary = isExplorer
    ? tier.alias ?? 'Executive Introduction'
    : currency === 'CNY'
      ? `¥${tier.cnyMonthly}`
      : `$${tier.usdMonthly}`;
  const priceSecondary = isExplorer
    ? 'Complimentary access'
    : currency === 'CNY'
      ? '/ 月'
      : '/ mo';

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all duration-300',
        isRecommended && 'ring-2 ring-accent shadow-xl scale-[1.02]',
        isCurrent && 'border-tier-1',
      )}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="info" size="md" className="shadow-md flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Recommended
          </Badge>
        </div>
      )}

      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge variant="success" size="md" className="shadow-md">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-xl font-serif">
            {tier.display_name}
          </CardTitle>
          {tier.tier_key === 'council' && (
            <Crown className="h-5 w-5 text-tier-4" aria-hidden="true" />
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'font-serif font-bold tracking-tight',
                isExplorer ? 'text-2xl text-text-secondary' : 'text-4xl text-text-primary',
              )}
            >
              {pricePrimary}
            </span>
            {!isExplorer && (
              <span className="text-text-muted text-sm">{priceSecondary}</span>
            )}
          </div>
          {isExplorer && (
            <CardDescription className="mt-1">{priceSecondary}</CardDescription>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{tier.monthlyMiles}</span>
          <span>diagnostic miles / month</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-4">
        <ul className="space-y-3 mb-6 flex-1">
          {tier.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <Check
                className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  isRecommended ? 'text-accent' : 'text-tier-1',
                )}
                aria-hidden="true"
              />
              <span className="text-text-secondary leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          variant={isRecommended ? 'default' : 'outline'}
          size="lg"
          className="w-full"
          loading={loading}
          disabled={isCurrent}
          onClick={() => onUpgrade?.(tier.tier_key)}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isCurrent
            ? 'Current Plan'
            : isExplorer
              ? 'Get Started'
              : isRecommended
                ? `Upgrade to ${tier.display_name}`
                : `Choose ${tier.display_name}`}
        </Button>
      </CardContent>
    </Card>
  );
};
