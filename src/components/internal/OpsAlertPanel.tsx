import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, Filter, Check } from 'lucide-react';
import { MOCK_ALERTS } from '@/mocks/internalPortal';

const severityConfig: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-500/15' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/15' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-500/15' },
};

export default function OpsAlertPanel() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filtered = severityFilter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === severityFilter);

  const acknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-text-muted" />
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="border border-bg-tertiary bg-bg-primary text-text-primary text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C108AB]/40"
          style={{ borderRadius: 0 }}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map(alert => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className={`border border-bg-tertiary bg-bg-primary p-4 flex items-center gap-4 ${alert.acknowledged ? 'opacity-60' : ''}`}
              style={{ borderRadius: 0 }}
            >
              <div className={`flex-shrink-0 p-2 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{alert.message}</p>
                <p className="text-xs text-text-muted mt-1">{alert.timestamp}</p>
              </div>
              {alert.acknowledged ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium flex-shrink-0">
                  <Check className="w-3 h-3" />
                  Acked
                </span>
              ) : (
                <button
                  onClick={() => acknowledge(alert.id)}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  <Check className="w-3 h-3" />
                  Acknowledge
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm text-center py-8">No alerts matching this filter.</p>
      )}
    </div>
  );
}
