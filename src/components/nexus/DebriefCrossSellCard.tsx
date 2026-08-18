import React, { useMemo } from 'react';
import { Calendar, Clock, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { INSTRUMENT_MILE_COST, getMileCostTier, MILE_COST_TIERS } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface DebriefCrossSellCardProps {
  instrumentCode: string;
  userTier: 'explorer' | 'starter' | 'pro' | 'executive' | 'council';
  onCTA?: () => void;
  onUpgrade?: () => void;
}

type Duration = 30 | 45 | 60 | 90;

const MILES_TO_DURATION: Readonly<Record<number, Duration>> = {
  1: 30,
  2: 45,
  3: 60,
  5: 90,
} as const;

const TIER_UNLOCK: Readonly<Record<Duration, string>> = {
  30: 'starter',
  45: 'starter',
  60: 'pro',
  90: 'pro',
} as const;

const PRO_PLUS_TIERS = new Set(['pro', 'executive', 'council'] as const);

function resolveMeta(code: string) {
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const diagnosticName = isCPI
    ? 'China Leadership Pipeline Index'
    : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? MILE_COST_TIERS.STANDARD.label;
  return { isCPI, miles, tierLabel, diagnosticName };
}

function canUnlock(tier: string, duration: Duration): boolean {
  const required = TIER_UNLOCK[duration];
  if (required === 'starter') {
    return tier !== 'explorer';
  }
  if (required === 'pro') {
    return PRO_PLUS_TIERS.has(tier as any);
  }
  return true;
}

export function DebriefCrossSellCard({
  instrumentCode,
  userTier,
  onCTA,
  onUpgrade,
}: DebriefCrossSellCardProps) {
  const meta = useMemo(() => resolveMeta(instrumentCode), [instrumentCode]);
  const duration: Duration = MILES_TO_DURATION[meta.miles] ?? 45;
  const unlocked = canUnlock(userTier, duration);

  const headline = `Recommended debrief for your ${meta.diagnosticName} diagnostic`;

  return (
    <Card className={cn(
      'w-full overflow-hidden transition-all hover:shadow-md',
      meta.isCPI && 'ring-2 ring-accent/50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={meta.isCPI ? 'success' : 'info'} size="sm">
              {meta.tierLabel} Debrief
            </Badge>
            <Badge variant="default" size="sm">
              {meta.miles} mi
            </Badge>
            <Badge variant="default" size="sm">
              <Clock className="w-3 h-3 mr-1" />
              {duration} minutes
            </Badge>
          </div>
          {!unlocked && (
            <Badge variant="warning" size="sm" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Pro tier
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{headline}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-text-muted">
            Book a live {duration}-minute debrief with a{' '}
            {meta.isCPI
              ? 'CPI (China Leadership Pipeline Index) Specialist and Senior Consultant'
              : 'certified specialist matched to your diagnostic tier'}. Get personalised interpretation,
            context, and next steps — not just raw scores.
          </div>

          <ul className="space-y-1.5">
            <li className="flex items-start gap-1.5 text-sm text-text-secondary">
              <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              Live 1:1 walkthrough of your {meta.diagnosticName} results
            </li>
            <li className="flex items-start gap-1.5 text-sm text-text-secondary">
              <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              Personalised interpretation and developmental prioritisation
            </li>
            <li className="flex items-start gap-1.5 text-sm text-text-secondary">
              <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
              Actionable next steps and Executive Intelligence context
            </li>
          </ul>

          {unlocked ? (
            <Button
              variant="default"
              size="default"
              className="w-full"
              leftIcon={<Calendar className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={onCTA}
            >
              Book a {duration}-min debrief
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="default"
                size="default"
                className="w-full"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onUpgrade}
              >
                Unlock on Pro
              </Button>
              <p className="text-xs text-text-muted text-center">
                {duration >= 60
                  ? 'Signature and Flagship debriefs require a Pro tier subscription or above.'
                  : 'Standard and above debriefs require a paid tier.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DebriefCrossSellCard;
