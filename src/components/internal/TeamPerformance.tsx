import React from 'react';
import { DollarSign, Target, Star, Briefcase } from 'lucide-react';
import { MOCK_TEAM } from '@/mocks/internalPortal';

const KPI_CARDS = [
  { label: 'Total Revenue', value: '$1.68M', icon: DollarSign, color: 'text-accent' },
  { label: 'Avg Placements', value: '4', icon: Target, color: 'text-tier-1' },
  { label: 'Avg Satisfaction', value: '4.7', icon: Star, color: 'text-tier-2' },
  { label: 'Active Mandates', value: '20', icon: Briefcase, color: 'text-ocean-deep' },
];

export default function TeamPerformance() {
  const maxRevenue = Math.max(
    ...MOCK_TEAM.map(m => parseInt(m.revenue.replace(/[$k]/g, '')))
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-bg-primary border border-bg-tertiary p-4"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-serif font-semibold text-text-primary">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Performance Bars */}
      <div>
        <h3 className="font-serif font-semibold text-lg text-text-primary mb-4">Individual Performance</h3>
        <div className="space-y-3">
          {MOCK_TEAM.map(member => {
            const revenueNum = parseInt(member.revenue.replace(/[$k]/g, ''));
            const percentage = (revenueNum / maxRevenue) * 100;
            return (
              <div key={member.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text-primary">{member.name}</span>
                  <span className="text-sm text-text-muted">{member.revenue}</span>
                </div>
                <div className="h-2 bg-bg-tertiary" style={{ borderRadius: 0 }}>
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${percentage}%`, borderRadius: 0 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
