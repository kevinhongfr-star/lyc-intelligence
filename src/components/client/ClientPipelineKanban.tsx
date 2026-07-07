import React from 'react';

interface PipelineKanbanData {
  SWEEP: string[];
  CANVA: string[];
  GRID: string[];
  LENS: string[];
  PLACED: string[];
}

interface Mandate {
  id: string;
  title: string;
}

interface ClientPipelineKanbanProps {
  data: PipelineKanbanData;
  mandate: Mandate;
}

const STAGES = [
  { key: 'SWEEP', label: 'SWEEP', color: 'bg-teal' },
  { key: 'CANVA', label: 'CANVA', color: 'bg-accent' },
  { key: 'GRID', label: 'GRID', color: 'bg-ocean' },
  { key: 'LENS', label: 'LENS', color: 'bg-warning' },
  { key: 'PLACED', label: 'PLACED', color: 'bg-success' },
];

export function ClientPipelineKanban({ data, mandate }: ClientPipelineKanbanProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">
        Pipeline — {mandate.title} ({mandate.id})
      </h2>
      
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map((stage) => (
          <div key={stage.key} className="bg-bg-primary border border-bg-tertiary p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 ${stage.color}`} />
              <span className="font-medium text-text-primary text-sm">{stage.label}</span>
              <span className="text-xs text-text-muted ml-auto">{data[stage.key as keyof PipelineKanbanData]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(data[stage.key as keyof PipelineKanbanData] || []).map((candidate) => (
                <div
                  key={candidate}
                  className="p-2 bg-bg-tertiary text-sm text-text-secondary"
                >
                  {candidate}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}