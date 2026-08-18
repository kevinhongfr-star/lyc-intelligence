import React from 'react';
import { Clock, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  SESSION_BUCKETS,
  SESSION_TYPES,
  type SessionKey,
  type SessionTypeKey,
} from '@/config/sessions';
import { INSTRUMENT_MILE_COST, getMileCostTier } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface SessionCardProps {
  session: SessionKey;
  instrument: string;
  currency?: 'USD' | 'CNY';
  onBook?: (sessionKey: SessionKey, sessionType: SessionTypeKey) => void;
}

function getInstrumentDisplayName(code: string): { name: string; miles: number; tierLabel: string } {
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const name = isCPI ? 'China Leadership Pipeline Index' : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? 'Standard';
  return { name, miles, tierLabel };
}

export function SessionCard({ session, instrument, currency = 'USD', onBook }: SessionCardProps) {
  const config = SESSION_BUCKETS[session];
  const instrumentInfo = getInstrumentDisplayName(instrument);
  const isCPI = instrument === 'CPI';
  const recommendedTypes: readonly SessionTypeKey[] = (SESSION_BUCKETS as any)[session]
    ? (() => {
        const recs: Record<string, readonly SessionTypeKey[]> = {
          light_30: ['expert'],
          standard_45: ['coach', 'expert'],
          signature_60: ['consultant', 'coach'],
          flagship_90: ['cpi_specialist', 'consultant'],
        };
        return recs[session] ?? ['expert'];
      })()
    : ['expert'];

  const headline = isCPI
    ? `${instrumentInfo.name} — ${config.durationMinutes}-min Flagship Debrief`
    : `${instrumentInfo.name} — ${config.durationMinutes}-min ${config.label.replace(' Debrief', '')} Debrief`;

  return (
    <Card className={cn(
      'w-full h-full flex flex-col transition-all hover:shadow-lg',
      config.bucket === 'flagship' && 'ring-2 ring-accent'
    )}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              {config.label}
            </Badge>
            {config.bucket === 'flagship' && (
              <Badge variant="success" size="sm">
                Recommended for CPI
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-text-muted text-sm">
            <Clock className="w-4 h-4" />
            <span>{config.durationMinutes} min</span>
          </div>
        </div>
        <CardTitle className="text-lg">{headline}</CardTitle>
        <CardDescription>
          Expert-led diagnostic debrief with personalised interpretation and actionable next steps.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Users className="w-4 h-4" />
            <span>{config.recommendedInstruments.length} diagnostic{config.recommendedInstruments.length > 1 ? 's' : ''}</span>
          </div>
          <div className="text-text-muted">
            {instrumentInfo.tierLabel} tier · {instrumentInfo.miles} mi cost
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            Specialist types
          </div>
          <div className="space-y-2">
            {recommendedTypes.map((typeKey) => {
              const st = SESSION_TYPES[typeKey];
              return (
                <div key={typeKey} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-text-primary">{st.title}</div>
                    <div className="text-text-muted text-xs mt-0.5">{st.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            Covered diagnostics
          </div>
          <div className="flex flex-wrap gap-1.5">
            {config.recommendedInstruments.map((code) => {
              const info = getInstrumentDisplayName(code);
              return (
                <Badge key={code} variant="default" size="sm">
                  {code} — {info.tierLabel}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Diagnostic debrief fee</span>
            <span className="font-semibold text-text-primary">
              {config.durationMinutes} min session
            </span>
          </div>
          {recommendedTypes.map((typeKey, idx) => (
            <Button
              key={typeKey}
              variant={idx === 0 ? 'default' : 'outline'}
              size="default"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onBook?.(session, typeKey)}
            >
              Book with {SESSION_TYPES[typeKey].title.split(' ').slice(0, 2).join(' ')}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default SessionCard;
