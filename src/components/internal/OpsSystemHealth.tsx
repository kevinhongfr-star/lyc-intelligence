import React from 'react';
import { Cpu, MemoryStick, AlertTriangle, Activity, Link, Zap } from 'lucide-react';
import { MOCK_SYSTEM_HEALTH } from '@/mocks/internalPortal';

const metrics = [
  { label: 'CPU Usage', value: MOCK_SYSTEM_HEALTH.cpu, unit: '%', icon: Cpu, color: '#16A34A' },
  { label: 'Memory', value: MOCK_SYSTEM_HEALTH.memory, unit: '%', icon: MemoryStick, color: '#F59E0B' },
  { label: 'Error Rate', value: MOCK_SYSTEM_HEALTH.errorRate, unit: '%', icon: AlertTriangle, color: '#DC2626' },
  { label: 'Uptime', value: parseFloat(MOCK_SYSTEM_HEALTH.uptime), unit: '%', icon: Activity, color: '#C108AB' },
];

export default function OpsSystemHealth() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => {
          const Icon = m.icon;
          const displayValue = m.label === 'Error Rate' ? m.value : m.value;
          return (
            <div
              key={m.label}
              className="border border-bg-tertiary bg-bg-primary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: m.color }} />
                <span className="text-xs text-text-muted font-medium">{m.label}</span>
              </div>
              <div className="text-2xl font-serif font-bold text-text-primary mb-3">
                {m.label === 'Error Rate' ? `${m.value}${m.unit}` : m.label === 'Uptime' ? `${m.value}${m.unit}` : `${m.value}${m.unit}`}
              </div>
              <div className="h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${Math.min(m.value, 100)}%`,
                    backgroundColor: m.color,
                    borderRadius: 0,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-8 border border-bg-tertiary bg-bg-primary p-4" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Active Connections</span>
          <span className="text-sm font-semibold text-text-primary">{MOCK_SYSTEM_HEALTH.activeConnections}</span>
        </div>
        <div className="w-px h-6 bg-bg-tertiary" />
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Requests/min</span>
          <span className="text-sm font-semibold text-text-primary">{MOCK_SYSTEM_HEALTH.requestsPerMin}</span>
        </div>
      </div>
    </div>
  );
}
