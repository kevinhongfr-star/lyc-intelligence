import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { MOCK_ROLES } from '@/mocks/internalPortal';

export default function RBACManager() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-accent" />
        <h2 className="font-serif font-semibold text-lg text-text-primary">Role-Based Access Control</h2>
      </div>

      <div className="space-y-3">
        {MOCK_ROLES.map(role => {
          const isExpanded = expandedId === role.id;
          return (
            <div
              key={role.id}
              className="bg-bg-primary border border-bg-tertiary"
              style={{ borderRadius: 0 }}
            >
              <button
                onClick={() => toggleExpand(role.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                  )}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium text-text-primary">{role.name}</span>
                    <span className="text-sm text-text-muted">{role.userCount} users</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {role.permissions.slice(0, 4).map(p => (
                      <span
                        key={p}
                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-accent-10 text-accent"
                        style={{ borderRadius: 0 }}
                      >
                        {p}
                      </span>
                    ))}
                    {role.permissions.length > 4 && (
                      <span className="text-xs text-text-muted">+{role.permissions.length - 4} more</span>
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-bg-tertiary">
                  <div className="mt-3">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(p => (
                        <span
                          key={p}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-accent-10 text-accent"
                          style={{ borderRadius: 0 }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Role
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
