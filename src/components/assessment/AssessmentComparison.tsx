import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { MOCK_ASSESSMENTS, MOCK_ASSESSMENT_RESULTS } from '@/mocks/advancedFeatures';
import type { Assessment } from '@/mocks/advancedFeatures';
import { Badge } from '@/components/ui';

const MOCK_RIGHT_OFFSETS: Record<string, number> = { Vision: -1, Execution: 0, Influence: -2, Learning: -1, Resilience: 0 };

const completedAssessments = MOCK_ASSESSMENTS.filter((a) => a.status === 'completed');

const TRIDENT_DIMENSIONS = Object.keys(MOCK_ASSESSMENT_RESULTS.trident.dimensions);

function ComparisonBar({ label, leftValue, rightValue, max = 10 }: { label: string; leftValue: number; rightValue: number; max?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-text-primary">{label}</span>
        <div className="flex gap-4">
          <span className="text-accent">{leftValue}</span>
          <span className="text-text-muted">vs</span>
          <span className="text-text-secondary">{rightValue}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <div className="flex-1 h-3 bg-bg-tertiary overflow-hidden" style={{ borderRadius: 0 }}>
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(leftValue / max) * 100}%`, borderRadius: 0 }}
          />
        </div>
        <div className="flex-1 h-3 bg-bg-tertiary overflow-hidden" style={{ borderRadius: 0 }}>
          <div
            className="h-full bg-teal transition-all duration-500"
            style={{ width: `${(rightValue / max) * 100}%`, borderRadius: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AssessmentComparison() {
  const [leftId, setLeftId] = useState<string>(completedAssessments[0]?.id || '');
  const [rightId, setRightId] = useState<string>(completedAssessments[1]?.id || '');

  const leftAssessment = completedAssessments.find((a) => a.id === leftId);
  const rightAssessment = completedAssessments.find((a) => a.id === rightId);

  const rightValues = useMemo(() => {
    const vals: Record<string, number> = {};
    for (const dim of TRIDENT_DIMENSIONS) {
      const base = MOCK_ASSESSMENT_RESULTS.trident.dimensions[dim as keyof typeof MOCK_ASSESSMENT_RESULTS.trident.dimensions] as number;
      vals[dim] = Math.max(0, base + (MOCK_RIGHT_OFFSETS[dim] ?? 0));
    }
    return vals;
  }, []);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Assessment A</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
            style={{ borderRadius: 0 }}
          >
            {completedAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Assessment B</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
            style={{ borderRadius: 0 }}
          >
            {completedAssessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison table */}
      {leftAssessment && rightAssessment && (
        <>
          <div className="bg-bg-primary border border-bg-tertiary p-5" style={{ borderRadius: 0 }}>
            <h3 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent" />
              Overview
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div />
              <div className="text-center font-medium text-accent">{leftAssessment.name}</div>
              <div className="text-center font-medium text-teal">{rightAssessment.name}</div>

              <div className="text-text-muted">Type</div>
              <div className="text-center"><Badge variant="default">{leftAssessment.type}</Badge></div>
              <div className="text-center"><Badge variant="default">{rightAssessment.type}</Badge></div>

              <div className="text-text-muted">Score</div>
              <div className="text-center font-bold text-text-primary">{leftAssessment.score ?? '-'}</div>
              <div className="text-center font-bold text-text-primary">{rightAssessment.score ?? '-'}</div>

              <div className="text-text-muted">Percentile</div>
              <div className="text-center font-bold text-accent">{leftAssessment.percentile ? `${leftAssessment.percentile}%` : '-'}</div>
              <div className="text-center font-bold text-teal">{rightAssessment.percentile ? `${rightAssessment.percentile}%` : '-'}</div>
            </div>
          </div>

          {/* TRIDENT dimension comparison */}
          <div className="bg-bg-primary border border-bg-tertiary p-5" style={{ borderRadius: 0 }}>
            <h3 className="font-serif font-semibold text-text-primary mb-4">
              TRIDENT Dimensions
            </h3>
            <div className="space-y-4">
              {TRIDENT_DIMENSIONS.map((dim) => (
                <ComparisonBar
                  key={dim}
                  label={dim}
                  leftValue={MOCK_ASSESSMENT_RESULTS.trident.dimensions[dim as keyof typeof MOCK_ASSESSMENT_RESULTS.trident.dimensions] as number}
                  rightValue={rightValues[dim]}
                  max={10}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {completedAssessments.length < 2 && (
        <div className="text-center py-12 text-text-muted">
          You need at least 2 completed assessments to compare.
        </div>
      )}
    </div>
  );
}
