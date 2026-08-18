import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  Briefcase,
  Crown,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { PricingCurrency } from '@/config/pricingData';

export interface DebriefsSectionProps {
  currency: PricingCurrency;
}

interface DebriefSession {
  key: string;
  duration: string;
  title: string;
  cohort: string;
  cohortDetails: string[];
  pricing: { usd: number; cny: number };
  tierTag: 'all_paid' | 'pro_plus' | 'executive_plus' | 'council_plus';
  icon: React.ComponentType<{ className?: string }>;
  isFlagship?: boolean;
}

const DEBRIEF_SESSIONS: DebriefSession[] = [
  {
    key: 'career_core',
    duration: '30 min',
    title: 'Career Core Debrief',
    cohort: '1mi – 2mi cohort',
    cohortDetails: ['LEAP (1mi)', 'IMPACT (2mi)', 'COACH (2mi)', 'DRIVE (2mi)', 'QUEST (2mi)'],
    pricing: { usd: 99, cny: 33 },
    tierTag: 'pro_plus',
    icon: Users,
  },
  {
    key: 'standard_advisory',
    duration: '45 min',
    title: 'Standard / Advisory Debrief',
    cohort: '2mi cohort',
    cohortDetails: ['PRISM (2mi)', 'BRIDGE (3mi)', 'MOSAIC (3mi)', 'SPARK (3mi)', 'FORGE (3mi)'],
    pricing: { usd: 149, cny: 50 },
    tierTag: 'pro_plus',
    icon: Briefcase,
  },
  {
    key: 'signature',
    duration: '60 min',
    title: 'Signature Debrief',
    cohort: '3mi cohort',
    cohortDetails: ['BRIDGE (3mi)', 'MOSAIC (3mi)', 'SPARK (3mi)', 'FORGE (3mi)'],
    pricing: { usd: 249, cny: 66 },
    tierTag: 'executive_plus',
    icon: UserCheck,
  },
  {
    key: 'cpi_executive',
    duration: '90 min',
    title: 'CPI Executive Debrief',
    cohort: '5mi cohort',
    cohortDetails: [
      'CPI — China Leadership Pipeline Index',
      'Flagship 5mi diagnostic',
      'Full pipeline report review',
      'China market benchmarking walkthrough',
    ],
    pricing: { usd: 499, cny: 116 },
    tierTag: 'council_plus',
    icon: Crown,
    isFlagship: true,
  },
];

const TIER_TAG_LABELS: Record<DebriefSession['tierTag'], { label: string; variant: 'default' | 'info' | 'warning' | 'success' }> = {
  all_paid: { label: 'Starter +', variant: 'default' },
  pro_plus: { label: 'Pro +', variant: 'info' },
  executive_plus: { label: 'Executive +', variant: 'warning' },
  council_plus: { label: 'Council +', variant: 'success' },
};

export const DebriefsSection: React.FC<DebriefsSectionProps> = ({ currency }) => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-white via-bg-secondary/30 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="warning" size="md" className="mb-4 gap-1.5">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Consultant sessions
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary mb-4">
            Executive debrief sessions
          </h2>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Book consultant-led debriefs aligned to your diagnostic mile cohort.
            Every diagnostic can be paired with a dedicated session at the matching tier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {DEBRIEF_SESSIONS.map((session) => {
            const Icon = session.icon;
            const price = currency === 'CNY'
              ? `¥${session.pricing.cny}`
              : `$${session.pricing.usd}`;
            const tag = TIER_TAG_LABELS[session.tierTag];
            return (
              <Card
                key={session.key}
                className={cn(
                  'h-full flex flex-col transition-all',
                  session.isFlagship && 'ring-2 ring-tier-4/40 shadow-lg',
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-11 h-11 rounded-lg flex items-center justify-center shrink-0',
                          session.isFlagship ? 'bg-tier-4/15' : 'bg-accent/10',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            session.isFlagship ? 'text-tier-4' : 'text-accent',
                          )}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">
                          {session.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" size="sm" className="gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {session.duration}
                          </Badge>
                          <Badge variant={tag.variant} size="sm">
                            {tag.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-serif font-bold text-text-primary">
                        {price}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">per session</div>
                    </div>
                  </div>

                  <CardDescription className="pt-3">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-2">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {session.cohort}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col">
                  <ul className="space-y-2 mb-5 flex-1">
                    {session.cohortDetails.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                        <span
                          className={cn(
                            'mt-1.5 h-1.5 w-1.5 rounded-full shrink-0',
                            session.isFlagship ? 'bg-tier-4' : 'bg-accent',
                          )}
                          aria-hidden="true"
                        />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={session.isFlagship ? 'default' : 'outline'}
                    size="default"
                    className="w-full"
                  >
                    Book {session.duration} session
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
