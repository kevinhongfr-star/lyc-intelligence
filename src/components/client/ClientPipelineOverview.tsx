import React from 'react';

interface PipelineData {
  SWEEP: number;
  CANVA: number;
  GRID: number;
  LENS: number;
  PLACED: number;
}

interface ClientPipelineOverviewProps {
  pipeline: PipelineData;
}

const STAGES = [
  { key: 'SWEEP', label: 'SWEEP', color: 'bg-teal' },
  { key: 'CANVA', label: 'CANVA', color: 'bg-accent' },
  { key: 'GRID', label: 'GRID', color: 'bg-ocean' },
  { key: 'LENS', label: 'LENS', color: 'bg-warning' },
  { key: 'PLACED', label: 'PLACED', color: 'bg-success' },
];

export function ClientPipelineOverview({ pipeline }: ClientPipelineOverviewProps) {
  const total = Object.values(pipeline).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Pipeline Overview</h2>
      <p className="text-sm text-text-muted mb-4">All Mandates</p>
      
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const count = pipeline[stage.key as keyof PipelineData];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-text-primary">{stage.label}</span>
                <span className="text-text-muted">{count}</span>
              </div>
              <div className="h-3 bg-bg-tertiary">
                <div
                  className={`h-full ${stage.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}