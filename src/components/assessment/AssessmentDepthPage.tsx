import React from 'react';
import { CheckCircle2, ArrowRight, BookOpen, Users, BarChart3 } from 'lucide-react';
import { DepthPageTemplate } from './DepthPageTemplate';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { INSTRUMENT_MILE_COST, getMileCostTier, MILE_COST_TIERS } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import {
  getDurationByMiles,
} from '@/config/sessions';

export interface AssessmentDepthPageProps {
  instrumentCode: string;
}

type GroupLabel = 'Flagship' | 'Career Core' | 'Advisory';

function getGroupLabel(code: string): GroupLabel {
  if (code === 'CPI') return 'Flagship';
  const group = (['LEAP', 'QUEST', 'IMPACT', 'DRIVE', 'COACH'] as const).includes(code as any);
  return group ? 'Career Core' : 'Advisory';
}

function getMilesLabel(miles: number): string {
  switch (miles) {
    case 1: return MILE_COST_TIERS.LIGHT.label;
    case 2: return MILE_COST_TIERS.STANDARD.label;
    case 3: return MILE_COST_TIERS.SIGNATURE.label;
    case 5: return MILE_COST_TIERS.FLAGSHIP.label;
    default: return MILE_COST_TIERS.STANDARD.label;
  }
}

export function AssessmentDepthPage({ instrumentCode }: AssessmentDepthPageProps) {
  const catalog = ASSESSMENT_CATALOG[instrumentCode];
  const isCPI = instrumentCode === 'CPI';
  const miles = INSTRUMENT_MILE_COST[instrumentCode] ?? 2;
  const tier = getMileCostTier(instrumentCode);
  const milesLabel = getMilesLabel(miles);
  const groupLabel = getGroupLabel(instrumentCode);
  const duration = getDurationByMiles(miles);

  const heroName = isCPI ? 'China Leadership Pipeline Index' : catalog?.b2cName || catalog?.name || instrumentCode;
  const heroCopy = isCPI
    ? 'Our flagship diagnostic — calibrated against two decades of APAC executive data.'
    : (catalog?.tagline || 'An executive diagnostic designed for targeted leadership insight.');

  const dimensions = catalog?.dimensions ?? [];
  const archetypes = catalog?.archetypes ?? [];
  const composites = catalog?.compositeBands ?? [];

  return (
    <DepthPageTemplate instrumentCode={instrumentCode}>
      <div className="space-y-16">
        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={isCPI ? 'success' : 'info'} size="sm">
                  {groupLabel} Group
                </Badge>
                <Badge variant="default" size="sm">
                  {milesLabel} Tier · {miles} mi cost
                </Badge>
                {duration && (
                  <Badge variant="default" size="sm">
                    {duration}-min recommended debrief
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl">
                {isCPI ? heroName : `${heroName} — Diagnostic Overview`}
              </CardTitle>
              <CardDescription className="text-base">
                {isCPI ? (
                  <>
                    {heroCopy} Five dimensions, scenario-based evidence, and APAC-specific benchmarking
                    deliver a flagship diagnostic for executives considering board, C-suite, or cross-border
                    China leadership roles.
                  </>
                ) : (
                  heroCopy
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-bg-tertiary/50">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-semibold">{dimensions.length} Dimensions</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    Calibrated leadership dimensions with validated scoring bands and APAC benchmarks.
                  </p>
                </div>
                <div className="p-4 bg-bg-tertiary/50">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold">{archetypes.length} Archetypes</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    Executive archetypes with developmental traits, risks, and positioning guidance.
                  </p>
                </div>
                <div className="p-4 bg-bg-tertiary/50">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold">{composites.length} Score Bands</span>
                  </div>
                  <p className="text-sm text-text-muted">
                    Composite score interpretation calibrated against real executive placement outcomes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Leadership Dimensions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="info" size="sm">
                      {d.question_count} questions
                    </Badge>
                    <Badge variant="default" size="sm">
                      {d.lowLabel} ↔ {d.highLabel}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{d.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-muted leading-relaxed">{d.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {archetypes.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Executive Archetypes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archetypes.slice(0, Math.max(4, archetypes.length)).map((a) => (
                <Card key={a.name}>
                  <CardHeader>
                    <CardTitle className="text-lg">{a.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {a.description && (
                      <p className="text-sm text-text-muted leading-relaxed">{a.description}</p>
                    )}
                    {a.traits.length > 0 && (
                      <ul className="space-y-1.5">
                        {a.traits.map((t, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary">
                            <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {composites.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-text-primary mb-6">Composite Interpretation</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {composites.map((c, i) => (
                    <div key={i} className="p-5 flex items-start gap-4">
                      <div className="w-20 flex-shrink-0">
                        <Badge variant="default" size="md">
                          Band {i + 1}
                        </Badge>
                        <div className="mt-1 text-sm font-semibold text-text-primary">{c.band}</div>
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed">{c.interpretation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl">
                {isCPI
                  ? 'Book a 90-min Flagship Diagnostic Debrief'
                  : `Book a ${duration ?? 45}-min ${milesLabel} Diagnostic Debrief`}
              </CardTitle>
              <CardDescription className="text-base">
                {isCPI
                  ? 'Meet one-on-one with a CPI (China Leadership Pipeline Index) Specialist and Senior Consultant to walk through your results, APAC benchmarks, and personalised leadership positioning plan.'
                  : `Turn your ${heroName} results into action with a specialist-matched debrief. Executive Intelligence delivered by humans.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Book {isCPI ? 'CPI Flagship' : milesLabel} Debrief
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </DepthPageTemplate>
  );
}

export default AssessmentDepthPage;
