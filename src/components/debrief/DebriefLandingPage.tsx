import React from 'react';
import { ArrowRight, Calendar, Users, BarChart3, CheckCircle2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  SESSION_BUCKETS,
  SESSION_BUCKET_ORDER,
  SESSION_TYPES,
  getDurationByMiles,
} from '@/config/sessions';
import { INSTRUMENT_MILE_COST, MILE_COST_TIERS } from '@/constants/miles';

interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const HOW_IT_WORKS_STEPS: readonly HowItWorksStep[] = [
  {
    step: 1,
    title: 'Choose your diagnostic',
    description: 'Pick from 11 executive diagnostics across Light, Standard, Signature, and Flagship tiers — each calibrated for specific leadership questions.',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    step: 2,
    title: 'Match with the right specialist',
    description: 'We pair your diagnostic tier with the optimal specialist — from Executive Diagnostic Specialists to CPI-certified experts and Senior Consultants.',
    icon: <Users className="w-6 h-6" />,
  },
  {
    step: 3,
    title: 'Book your live debrief',
    description: 'Select a date and time within our 2–60 day window. Your specialist walks through results, benchmarks, and personalised next steps live.',
    icon: <Calendar className="w-6 h-6" />,
  },
] as const;

const SESSION_GROUP_LABELS: Record<string, string> = {
  light: 'Light · 1 mi diagnostics',
  standard: 'Standard · 2 mi diagnostics',
  signature: 'Signature · 3 mi diagnostics',
  flagship: 'Flagship · 5 mi diagnostics',
};

const INSTRUMENT_GROUP_DISPLAY: Record<string, readonly string[]> = {
  light: ['LEAP'],
  standard: ['PRISM', 'IMPACT', 'COACH', 'DRIVE', 'QUEST'],
  signature: ['BRIDGE', 'MOSAIC', 'SPARK', 'FORGE'],
  flagship: ['CPI'],
};

const BUCKET_TIER_LABEL: Record<string, string> = {
  light: MILE_COST_TIERS.LIGHT.label,
  standard: MILE_COST_TIERS.STANDARD.label,
  signature: MILE_COST_TIERS.SIGNATURE.label,
  flagship: MILE_COST_TIERS.FLAGSHIP.label,
};

export interface DebriefLandingPageProps {
  onBrowseSessions?: () => void;
  onBookNow?: (instrumentCode?: string) => void;
}

export function DebriefLandingPage({ onBrowseSessions, onBookNow }: DebriefLandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-white">
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-accent/10 text-accent text-sm font-medium">
          <Zap className="w-4 h-4" />
          Live 1:1 expert interpretation
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
          Diagnostic Debriefs
        </h1>
        <p className="text-lg text-text-muted max-w-3xl mx-auto mb-8">
          Turn your diagnostic results into executive action. Every debrief is led by a certified specialist
          matched to your diagnostic tier — from 30-minute Light sessions to 90-minute Flagship deep-dives
          on the China Leadership Pipeline Index.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="default"
            size="lg"
            rightIcon={<ArrowRight className="w-5 h-5" />}
            onClick={() => onBookNow?.()}
          >
            Book a Diagnostic Debrief
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onBrowseSessions?.()}
          >
            View Session Types
          </Button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-3">How It Works</h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Three simple steps from diagnostic result to actionable executive insight.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <Card key={s.step} className="h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 text-accent flex items-center justify-center mb-3">
                  {s.icon}
                </div>
                <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                  Step {s.step}
                </div>
                <CardTitle className="text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Session Types</h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Four debrief tiers aligned to diagnostic mile costs. Longer sessions cover deeper diagnostics,
            more senior specialists, and broader context.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SESSION_BUCKET_ORDER.map((key) => {
            const cfg = SESSION_BUCKETS[key];
            const duration = getDurationByMiles(cfg.miles) ?? cfg.durationMinutes;
            const groupInstruments = INSTRUMENT_GROUP_DISPLAY[cfg.bucket];
            const isFlagship = cfg.bucket === 'flagship';

            return (
              <Card
                key={key}
                className={cn(
                  'h-full flex flex-col transition-all hover:shadow-lg',
                  isFlagship && 'ring-2 ring-accent'
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={isFlagship ? 'success' : 'info'} size="sm">
                      {BUCKET_TIER_LABEL[cfg.bucket]}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span>{duration} min</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">
                    {isFlagship ? 'Flagship CPI Debrief' : `${cfg.label} Session`}
                  </CardTitle>
                  <CardDescription>
                    {SESSION_GROUP_LABELS[cfg.bucket]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div>
                    <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                      {isFlagship ? 'Includes' : 'Covered diagnostics'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {groupInstruments.map((code) => (
                        <span
                          key={code}
                          className={cn(
                            'text-xs font-medium px-2 py-0.5',
                            code === 'CPI'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-bg-tertiary text-text-secondary'
                          )}
                        >
                          {code === 'CPI' ? 'China Leadership Pipeline Index' : code}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                      Specialist
                    </div>
                    <div className="text-sm text-text-primary space-y-1">
                      {cfg.bucket === 'light' && (
                        <div className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{SESSION_TYPES.expert.title}</span>
                        </div>
                      )}
                      {cfg.bucket === 'standard' && (
                        <>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.expert.title}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.coach.title}</span>
                          </div>
                        </>
                      )}
                      {cfg.bucket === 'signature' && (
                        <>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.consultant.title}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.coach.title}</span>
                          </div>
                        </>
                      )}
                      {cfg.bucket === 'flagship' && (
                        <>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.cpi_specialist.title}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{SESSION_TYPES.consultant.title}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                      What you get
                    </div>
                    <ul className="text-sm text-text-secondary space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        Live 1:1 walkthrough of your results
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        Personalised interpretation
                      </li>
                      {cfg.durationMinutes >= 60 && (
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          Contextual benchmarking
                        </li>
                      )}
                      {cfg.durationMinutes >= 90 && (
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          APAC executive &amp; board-level calibration
                        </li>
                      )}
                      <li className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        Actionable next steps
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="bg-accent p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to unlock your diagnostic insights?
          </h2>
          <p className="max-w-2xl mx-auto mb-8 opacity-90 text-lg">
            Book a live diagnostic debrief today. Executive Intelligence — results delivered by humans, calibrated for leaders.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-accent hover:bg-gray-100 min-h-[52px]"
              rightIcon={<ArrowRight className="w-5 h-5" />}
              onClick={() => onBookNow?.('CPI')}
            >
              Book Flagship CPI Debrief
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10 min-h-[52px]"
              onClick={() => onBrowseSessions?.()}
            >
              Explore All Debrief Tiers
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DebriefLandingPage;
