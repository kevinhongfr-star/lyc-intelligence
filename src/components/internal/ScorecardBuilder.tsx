import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, BarChart3 } from 'lucide-react';
import { MOCK_SCORECARD_TEMPLATES } from '@/mocks/internalPortal';

export default function ScorecardBuilder() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#C108AB]" />
          <span className="text-sm font-medium text-text-primary">Scorecard Templates</span>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
          style={{ borderRadius: 0 }}
        >
          <Plus className="w-3 h-3" />
          Create New
        </button>
      </div>

      <div className="space-y-2">
        {MOCK_SCORECARD_TEMPLATES.map(template => {
          const isExpanded = expandedId === template.id;
          return (
            <div
              key={template.id}
              className="border border-bg-tertiary bg-bg-primary"
              style={{ borderRadius: 0 }}
            >
              <button
                onClick={() => toggleExpand(template.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-text-muted" />
                  <span className="font-medium text-text-primary">{template.name}</span>
                  <span className="text-xs text-text-muted">{template.criteria.length} criteria</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {template.criteria.map(criterion => (
                    <div key={criterion.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary">{criterion.label}</span>
                        <span className="font-medium text-text-primary">{criterion.weight}%</span>
                      </div>
                      <div className="h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                        <div
                          className="h-full bg-[#C108AB] transition-all"
                          style={{ width: `${criterion.weight}%`, borderRadius: 0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
