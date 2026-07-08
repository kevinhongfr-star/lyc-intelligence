import React from 'react';
import { BarChart2, Share2, Award } from 'lucide-react';
import { MOCK_ASSESSMENT_RESULTS } from '@/mocks/advancedFeatures';
import { Button } from '@/components/ui';

interface AssessmentResultsProps {
  onBack: () => void;
  onShare?: () => void;
  onRetake?: () => void;
}

function DimensionBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-text-muted">{value}/{max}</span>
      </div>
      <div className="h-3 bg-bg-tertiary overflow-hidden" style={{ borderRadius: 0 }}>
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%`, borderRadius: 0 }}
        />
      </div>
    </div>
  );
}

export default function AssessmentResults({ onBack, onShare, onRetake }: AssessmentResultsProps) {
  const { trident, cognitive } = MOCK_ASSESSMENT_RESULTS;

  return (
    <div className="space-y-6">
      {/* TRIDENT Results */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-1 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          TRIDENT Leadership Assessment
        </h3>
        <div className="flex items-center gap-4 mb-5">
          <span className="text-3xl font-bold text-text-primary">{trident.overall}</span>
          <span className="text-sm text-text-muted">/10 overall</span>
        </div>
        <div className="space-y-4">
          {Object.entries(trident.dimensions).map(([dim, score]) => (
            <DimensionBar key={dim} label={dim} value={score as number} max={10} />
          ))}
        </div>
      </div>

      {/* Cognitive Results */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-1 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-accent" />
          Cognitive Style Profile
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl font-bold text-text-primary">{cognitive.overall}</span>
          <span className="text-sm text-text-muted">/100 overall</span>
        </div>
        <p className="text-sm text-accent font-medium mb-5">
          Style: {cognitive.style}
        </p>
        <div className="space-y-4">
          {Object.entries(cognitive.breakdown).map(([dim, score]) => (
            <DimensionBar key={dim} label={dim} value={score as number} max={100} />
          ))}
        </div>
      </div>

      {/* Percentile display */}
      <div className="bg-accent/5 border border-accent/20 p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4">Percentile Rankings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-primary p-4 border border-bg-tertiary" style={{ borderRadius: 0 }}>
            <p className="text-sm text-text-muted">TRIDENT</p>
            <p className="text-2xl font-bold text-accent">92nd</p>
            <p className="text-xs text-text-muted">percentile</p>
          </div>
          <div className="bg-bg-primary p-4 border border-bg-tertiary" style={{ borderRadius: 0 }}>
            <p className="text-sm text-text-muted">Cognitive</p>
            <p className="text-2xl font-bold text-accent">85th</p>
            <p className="text-xs text-text-muted">percentile</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="default"
          size="default"
          onClick={onShare}
          style={{ borderRadius: 0 }}
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Results
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={onRetake}
          style={{ borderRadius: 0 }}
        >
          Retake
        </Button>
        <Button
          variant="ghost"
          size="default"
          onClick={onBack}
          style={{ borderRadius: 0 }}
        >
          Back to Catalog
        </Button>
      </div>
    </div>
  );
}
