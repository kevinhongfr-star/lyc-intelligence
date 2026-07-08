import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, ListChecks } from 'lucide-react';
import { MOCK_TASK_TEMPLATES } from '@/mocks/internalPortal';

export default function TaskTemplates() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Task Templates</h2>
      </div>

      <div className="space-y-3">
        {MOCK_TASK_TEMPLATES.map(template => {
          const isExpanded = expandedId === template.id;
          return (
            <div
              key={template.id}
              className="bg-bg-primary border border-bg-tertiary"
              style={{ borderRadius: 0 }}
            >
              <button
                onClick={() => toggleExpand(template.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                  )}
                  <span className="font-medium text-text-primary">{template.name}</span>
                  <span className="text-xs text-text-muted">{template.steps.length} steps</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-bg-tertiary">
                  <ol className="space-y-2 mt-3">
                    {template.steps.map((step, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-accent-10 text-accent flex-shrink-0"
                          style={{ borderRadius: 0 }}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm text-text-primary">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-white hover:bg-accent-light transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      <Copy className="w-3 h-3" />
                      Use Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
