import React from 'react';

interface Mandate {
  id: string;
  title: string;
  department: string;
  status: string;
  slaDays: number;
}

interface ClientMandateListProps {
  mandates: Mandate[];
  selectedMandate: Mandate;
  onSelect: (mandate: Mandate) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-teal/10 text-teal',
  COMPLETED: 'bg-accent/10 text-accent',
  PAUSED: 'bg-warning/10 text-warning',
};

const SLA_COLOR = (days: number) => {
  if (days > 20) return 'bg-teal/10 text-teal';
  if (days > 10) return 'bg-warning/10 text-warning';
  return 'bg-error/10 text-error';
};

export function ClientMandateList({ mandates, selectedMandate, onSelect }: ClientMandateListProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Active Mandates</h2>
      
      <div className="space-y-2">
        {mandates.map((mandate) => (
          <button
            key={mandate.id}
            onClick={() => onSelect(mandate)}
            className={`w-full text-left p-4 border transition-colors ${
              selectedMandate.id === mandate.id
                ? 'bg-accent/10 border-accent'
                : 'bg-bg-primary border-bg-tertiary hover:border-accent/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-text-primary">{mandate.title}</span>
              <span className={`px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[mandate.status] || 'bg-bg-tertiary text-text-muted'}`}>
                {mandate.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{mandate.department}</span>
              <span className={`text-xs font-medium ${SLA_COLOR(mandate.slaDays)}`}>
                {mandate.slaDays}d SLA
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}