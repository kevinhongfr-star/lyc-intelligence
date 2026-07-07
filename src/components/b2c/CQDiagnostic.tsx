import React from 'react';

export interface CQDimension {
  name: string;
  score: number;
}

interface CQDiagnosticProps {
  dimensions?: CQDimension[];
}

const DEFAULT_DIMENSIONS: CQDimension[] = [
  { name: 'Decision Style', score: 8.2 },
  { name: 'Conflict Approach', score: 5.5 },
  { name: 'Power Distance', score: 3.8 },
  { name: 'Feedback Directness', score: 7.1 },
  { name: 'Risk Tolerance', score: 6.7 },
];

const MAX_SCORE = 10;

function getColorClass(score: number): string {
  if (score >= 7) return 'bg-teal';
  if (score >= 5) return 'bg-warning';
  return 'bg-error';
}

export function CQDiagnostic({ dimensions = DEFAULT_DIMENSIONS }: CQDiagnosticProps) {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-text-primary">
            Cultural Intelligence Diagnostic
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            How you operate across cultural dimensions
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-teal" /> Strong
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-warning" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-error" /> Risk
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {dimensions.map((dim) => {
          const colorClass = getColorClass(dim.score);
          const widthPercent = (dim.score / MAX_SCORE) * 100;
          return (
            <div key={dim.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary font-medium">{dim.name}</span>
                <span className="text-sm font-semibold text-text-primary">
                  {dim.score.toFixed(1)}
                </span>
              </div>
              <div className="h-2.5 bg-bg-tertiary">
                <div
                  className={`h-full ${colorClass} transition-all`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
