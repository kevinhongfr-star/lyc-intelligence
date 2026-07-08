import React, { useState } from 'react';
import { Database, ToggleLeft, ToggleRight } from 'lucide-react';
import { MOCK_RETENTION_POLICIES } from '@/mocks/internalPortal';

export default function DataRetention() {
  const [policies, setPolicies] = useState(MOCK_RETENTION_POLICIES);

  const toggleAutoDelete = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, autoDelete: !p.autoDelete } : p))
    );
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary" style={{ borderRadius: 0 }}>
      <div className="p-4 border-b border-bg-tertiary bg-bg-secondary flex items-center gap-2">
        <Database className="w-4 h-4 text-text-muted" />
        <span className="text-sm font-medium text-text-primary">Data Retention Policies</span>
      </div>
      <div className="divide-y divide-bg-tertiary">
        {policies.map((policy) => (
          <div
            key={policy.id}
            className="flex items-center justify-between px-4 py-4 hover:bg-bg-secondary transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{policy.dataType}</p>
              <p className="text-xs text-text-muted mt-0.5">Retain: {policy.retention}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">Auto-delete</span>
              <button
                onClick={() => toggleAutoDelete(policy.id)}
                className="focus:outline-none"
                aria-label={`Toggle auto-delete for ${policy.dataType}`}
              >
                {policy.autoDelete ? (
                  <ToggleRight className="w-6 h-6" style={{ color: '#C108AB' }} />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-text-muted" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
