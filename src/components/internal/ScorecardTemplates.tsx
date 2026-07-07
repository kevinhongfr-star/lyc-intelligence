import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  criteriaCount: number;
}

const TEMPLATES: Template[] = [
  { id: 't-1', name: 'Standard Executive Interview', criteriaCount: 10 },
  { id: 't-2', name: 'Technical Leadership', criteriaCount: 8 },
  { id: 't-3', name: 'Cultural Fit', criteriaCount: 6 },
];

export function ScorecardTemplates() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">SCORECARD TEMPLATES</h3>
        </div>
        <button className="text-accent text-sm flex items-center gap-1 hover:text-text-primary">
          <Plus className="w-3.5 h-3.5" />
          New Template
        </button>
      </div>

      <div className="border border-bg-tertiary">
        {TEMPLATES.map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center justify-between px-4 py-3 ${
              i < TEMPLATES.length - 1 ? 'border-b border-bg-tertiary' : ''
            }`}
          >
            <div>
              <p className="text-text-primary font-medium">{t.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.criteriaCount} criteria</p>
            </div>
            <button className="text-accent text-sm hover:text-text-primary">Use</button>
          </div>
        ))}
      </div>
    </div>
  );
}
