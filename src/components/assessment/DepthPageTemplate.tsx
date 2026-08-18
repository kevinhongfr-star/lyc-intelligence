import React from 'react';
import { Clock, FileText, Target, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/seo/SEO';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INSTRUMENT_MILE_COST, getMileCostTier } from '@/constants/miles';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface DepthPageTemplateProps {
  instrumentCode: string;
  renderSections?: () => React.ReactNode;
  children?: React.ReactNode;
}

function getMeta(code: string) {
  const isCPI = code === 'CPI';
  const miles = INSTRUMENT_MILE_COST[code] ?? 2;
  const tier = getMileCostTier(code);
  const catalog = ASSESSMENT_CATALOG[code];
  const displayName = isCPI ? 'China Leadership Pipeline Index' : catalog?.b2cName || catalog?.name || code;
  const tierLabel = tier?.label ?? 'Standard';
  const duration = catalog?.duration_minutes ?? 15;
  const dimensions = catalog?.dimensions ?? [];
  const tagline = catalog?.tagline || '';
  return { isCPI, miles, tier, displayName, tierLabel, duration, dimensions, tagline, catalog };
}

export function DepthPageTemplate({ instrumentCode, renderSections, children }: DepthPageTemplateProps) {
  const meta = getMeta(instrumentCode);

  const seoTitle = meta.isCPI
    ? `${meta.displayName} — Diagnostic Depth | LYC Intelligence`
    : `${meta.displayName} — Diagnostic Depth | LYC Intelligence`;
  const seoDescription = meta.tagline
    ? `${meta.displayName}: ${meta.tagline} ${meta.tierLabel} tier executive diagnostic. ${meta.miles} miles.`
    : `${meta.displayName} ${meta.tierLabel} tier executive diagnostic. Explore ${meta.dimensions.length} leadership dimensions, ${meta.duration}-minute delivery, ${meta.miles} mi cost.`;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={seoTitle}
        description={seoDescription}
        path={`/diagnostics/${instrumentCode.toLowerCase()}`}
        type="product"
      />

      <header className="bg-gradient-to-br from-slate-50 via-white to-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="info" size="md">
              Diagnostic Depth
            </Badge>
            <Badge variant={meta.isCPI ? 'success' : 'default'} size="md">
              {meta.tierLabel} Tier
            </Badge>
            <Badge variant="default" size="md">
              {meta.miles} mi
            </Badge>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            {meta.displayName}
          </h1>

          {meta.tagline && (
            <p className="text-lg text-text-secondary mb-6 max-w-3xl">
              {meta.tagline}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted mb-8">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{meta.duration} min diagnostic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{meta.dimensions.length} dimensions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              <span>{meta.tierLabel} executive diagnostic</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="default"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Take This Diagnostic
            </Button>
            <Button
              variant="outline"
              size="lg"
            >
              Book {meta.tierLabel} Debrief
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {renderSections ? renderSections() : children}
      </main>
    </div>
  );
}

export default DepthPageTemplate;
