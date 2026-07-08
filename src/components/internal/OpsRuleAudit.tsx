import React, { useState } from 'react';
import { Zap, Pause, Play } from 'lucide-react';
import { MOCK_RULES } from '@/mocks/internalPortal';

export default function OpsRuleAudit() {
  const [rules, setRules] = useState(MOCK_RULES);

  const toggleStatus = (id: string) => {
    setRules(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
          : r
      )
    );
  };

  return (
    <div className="space-y-3">
      {rules.map(rule => (
        <div
          key={rule.id}
          className="border border-bg-tertiary bg-bg-primary p-4 hover:shadow-sm transition-shadow"
          style={{ borderRadius: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#C108AB]" />
                <span className="font-medium text-text-primary">{rule.name}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                    rule.status === 'active'
                      ? 'bg-green-500/15 text-green-700'
                      : 'bg-amber-500/15 text-amber-700'
                  }`}
                >
                  {rule.status}
                </span>
              </div>

              <div className="flex items-center gap-6 text-xs text-text-muted">
                <span>Last triggered: {rule.lastTriggered}</span>
                <span>Triggers: {rule.triggers}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Success Rate</span>
                  <span className="font-medium text-text-primary">{rule.successRate}%</span>
                </div>
                <div className="h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${rule.successRate}%`,
                      backgroundColor: rule.successRate >= 95 ? '#16A34A' : rule.successRate >= 85 ? '#F59E0B' : '#DC2626',
                      borderRadius: 0,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleStatus(rule.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors ${
                rule.status === 'active'
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-500/10'
                  : 'border-green-300 text-green-700 hover:bg-green-500/10'
              }`}
              style={{ borderRadius: 0 }}
            >
              {rule.status === 'active' ? (
                <><Pause className="w-3 h-3" /> Pause</>
              ) : (
                <><Play className="w-3 h-3" /> Resume</>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
