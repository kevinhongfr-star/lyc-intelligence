import React from 'react';
import { Coins, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MilePack, PricingCurrency } from '@/config/pricingData';

export interface MilePacksSectionProps {
  packs: MilePack[];
  currency: PricingCurrency;
}

export const MilePacksSection: React.FC<MilePacksSectionProps> = ({ packs, currency }) => {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="warning" size="md" className="mb-4 gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Top up anytime
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-4">
            Diagnostic mile packs
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Running out of diagnostic miles? Top up instantly. Packs never expire
            and stack alongside your monthly subscription allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {packs.map((pack, idx) => {
            const isPopular = pack.miles === 250;
            const price = currency === 'CNY' ? `¥${pack.cny}` : `$${pack.usd}`;
            return (
              <Card
                key={pack.pack_key}
                className={cn(
                  'relative flex flex-col h-full transition-all',
                  isPopular && 'ring-2 ring-tier-2 shadow-lg',
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="warning" size="md" className="shadow-sm">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-serif">
                      {pack.miles} miles
                    </CardTitle>
                    <div className="w-10 h-10 rounded-full bg-tier-2/10 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-tier-2" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-3xl font-serif font-bold text-text-primary">
                      {price}
                    </span>
                  </div>

                  <CardDescription className="mt-4 min-h-[48px]">
                    {pack.valueExample}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 mt-auto">
                  <ul className="space-y-2.5 mb-5 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-tier-2 mt-1">•</span>
                      <span>
                        {pack.miles >= 100
                          ? `${Math.floor(pack.miles / 2)} Standard diagnostics (2mi each)`
                          : `${Math.floor(pack.miles / 2)} Standard diagnostics (2mi each)`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-tier-2 mt-1">•</span>
                      <span>
                        {Math.floor(pack.miles / 3)} Signature diagnostics (3mi each)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-tier-2 mt-1">•</span>
                      <span>
                        {Math.floor(pack.miles / 5)} CPI flagship runs (5mi each)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-tier-2 mt-1">•</span>
                      <span>Never expire — carry-forward balance</span>
                    </li>
                  </ul>

                  <Button
                    variant={isPopular ? 'default' : 'outline'}
                    size="default"
                    className="w-full"
                  >
                    Buy {pack.miles} mi
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
