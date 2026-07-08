import React from 'react';
import { BarChart3 } from 'lucide-react';
import { MOCK_TEAM } from '@/mocks/internalPortal';

export default function WorkloadDistribution() {
  const totalMandates = MOCK_TEAM.reduce((sum, m) => sum + m.mandates, 0);
  const avgMandates = totalMandates / MOCK_TEAM.length;

  const getWorkloadColor = (mandates: number) => {
    if (mandates >= avgMandates * 1.3) return 'bg-red-500';
    if (mandates >= avgMandates * 0.7) return 'bg-amber-500';
    return 'bg-tier-1';
  };

  const getWorkloadLabel = (mandates: number) => {
    if (mandates >= avgMandates * 1.3) return 'High';
    if (mandates >= avgMandates * 0.7) return 'Medium';
    return 'Low';
  };

  const maxMandates = Math.max(...MOCK_TEAM.map(m => m.mandates));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h2 className="font-serif font-semibold text-lg text-text-primary">Workload Distribution</h2>
        </div>
        <div className="text-sm text-text-muted">
          Total: {totalMandates} mandates
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-tier-1" style={{ borderRadius: 0 }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-amber-500" style={{ borderRadius: 0 }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-red-500" style={{ borderRadius: 0 }} />
          <span>High</span>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-4">
        {MOCK_TEAM.map(member => {
          const percentage = (member.mandates / maxMandates) * 100;
          return (
            <div key={member.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 flex-shrink-0"
                    style={{ borderRadius: 0, backgroundColor: member.avatarColor }}
                  />
                  <span className="text-sm font-medium text-text-primary">{member.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-muted">{member.mandates} mandates</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium ${
                      getWorkloadColor(member.mandates) === 'bg-tier-1'
                        ? 'bg-tier-1Bg text-tier-1'
                        : getWorkloadColor(member.mandates) === 'bg-amber-500'
                        ? 'bg-tier-2Bg text-tier-2'
                        : 'bg-red-500/15 text-red-600'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {getWorkloadLabel(member.mandates)}
                  </span>
                </div>
              </div>
              <div className="h-6 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                <div
                  className={`h-full ${getWorkloadColor(member.mandates)} transition-all duration-500`}
                  style={{ width: `${percentage}%`, borderRadius: 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Indicator */}
      <div className="border-t border-bg-tertiary pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Average mandates per member</span>
          <span className="font-medium text-text-primary">{avgMandates.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}
