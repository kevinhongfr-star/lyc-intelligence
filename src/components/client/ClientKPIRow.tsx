import React from 'react';

interface KPIData {
  active: number;
  presented: number;
  interviews: number;
  upcoming: number;
}

interface ClientKPIRowProps {
  kpis: KPIData;
}

const KPI_CONFIG = [
  { key: 'active', label: 'Active', color: 'bg-accent' },
  { key: 'presented', label: 'Presented', color: 'bg-teal' },
  { key: 'interviews', label: 'Interviews', color: 'bg-ocean' },
  { key: 'upcoming', label: 'Upcoming', color: 'bg-warning' },
];

export function ClientKPIRow({ kpis }: ClientKPIRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {KPI_CONFIG.map((config) => (
        <div
          key={config.key}
          className="bg-bg-secondary border border-bg-tertiary p-4"
        >
          <div className={`w-10 h-10 ${config.color} flex items-center justify-center mb-3`}>
            <span className="text-white text-xl font-bold">
              {kpis[config.key as keyof KPIData]}
            </span>
          </div>
          <span className="text-sm font-medium text-text-primary">{config.label}</span>
        </div>
      ))}
    </div>
  );
}