import React from 'react';
import {
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Building2,
  BarChart3,
  Shield,
  Zap,
  Crown,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PricingTier, InstrumentUserFacing, PricingCurrency } from '@/config/pricingData';

export interface TierValuePropsProps {
  tiers: PricingTier[];
  instruments: Record<string, InstrumentUserFacing>;
  currency: PricingCurrency;
}

interface ValueCard {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  body: string;
  highlightTiers: PricingTier['tier_key'][];
}

const VALUE_CARDS: ValueCard[] = [
  {
    key: 'mile_economy',
    icon: BarChart3,
    headline: 'Diagnostic miles economy',
    body:
      'A transparent currency where every diagnostic costs 1, 2, 3, or 5 miles. Light diagnostics (1mi) for quick pulse checks, Signature diagnostics (3mi) for board-level insights, and CPI flagship (5mi) for full pipeline view.',
    highlightTiers: ['starter', 'pro', 'executive', 'council'],
  },
  {
    key: 'career_core',
    icon: Target,
    headline: 'Career Core diagnostics',
    body:
      'Five focused diagnostics — LEAP, IMPACT, COACH, DRIVE, QUEST — covering agility, presence, coaching aptitude, resilience, and trajectory. 1mi or 2mi each. Included on Starter and above.',
    highlightTiers: ['starter', 'pro', 'executive', 'council'],
  },
  {
    key: 'advisory_deep',
    icon: TrendingUp,
    headline: 'Advisory diagnostic depth',
    body:
      'PRISM, BRIDGE, MOSAIC, SPARK, FORGE — five 2mi–3mi advisory diagnostics for board readiness, role alignment, strategic potential, and operational governance. Starter unlocks the full set.',
    highlightTiers: ['starter', 'pro', 'executive', 'council'],
  },
  {
    key: 'cpi_flagship',
    icon: Crown,
    headline: 'CPI — China Leadership Pipeline Index',
    body:
      'The 5mi flagship. China market benchmarking, executive pipeline scoring, and a 90-minute dedicated debrief. Available from Starter tier; Council members get the fullest value at 600 mi/mo.',
    highlightTiers: ['starter', 'pro', 'executive', 'council'],
  },
  {
    key: 'benchmarking',
    icon: Users,
    headline: 'Executive peer benchmarking',
    body:
      'Pro tier and above place your diagnostic outputs against a regional C-suite dataset. See how you compare on the same dimensions — not generic scores, but real executive-calibre benchmarks.',
    highlightTiers: ['pro', 'executive', 'council'],
  },
  {
    key: 'debriefs',
    icon: Briefcase,
    headline: 'Executive consultant debriefs',
    body:
      'Executive and Council unlock session booking with accredited consultants. 30-min Career Core, 45-min Standard/Advisory, 60-min Signature, and the 90-min CPI Executive Debrief.',
    highlightTiers: ['executive', 'council'],
  },
  {
    key: 'workspace',
    icon: Building2,
    headline: 'Deliverable workspace',
    body:
      'Save, annotate, and compare diagnostic outputs in Pro, Executive, and Council tiers. Canvas views, grids, and exportable deliverables you can take into the boardroom.',
    highlightTiers: ['pro', 'executive', 'council'],
  },
  {
    key: 'community',
    icon: BookOpen,
    headline: 'Council community & workshops',
    body:
      'Council tier only — quarterly live workshops, private community, curated briefings, and direct access to the intelligence research team. For executives operating at the top level.',
    highlightTiers: ['council'],
  },
];

export const TierValueProps: React.FC<TierValuePropsProps> = ({ tiers, instruments, currency }) => {
  const tiersByKey = Object.fromEntries(tiers.map((t) => [t.tier_key, t]));

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="info" size="md" className="mb-4">
            Executive Intelligence
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-4">
            One subscription. Every diagnostic.
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Diagnostic miles buy you access across the complete portfolio of
            11 executive diagnostics, from Light (1mi) to Flagship CPI (5mi).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUE_CARDS.map((card) => {
            const Icon = card.icon;
            const highlightLabels = card.highlightTiers
              .map((k) => tiersByKey[k]?.display_name)
              .filter(Boolean);
            return (
              <Card
                key={card.key}
                className="h-full flex flex-col hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg">{card.headline}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <p className="text-sm text-text-muted leading-relaxed mb-4">{card.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {highlightLabels.map((label) => (
                      <Badge key={label} variant="default" size="sm">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
