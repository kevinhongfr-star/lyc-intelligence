import React from 'react';
import { TrendingUp, Users, Clock, Star, Heart } from 'lucide-react';
import { MOCK_QUALITY_OF_HIRE } from '@/mocks/internalPortal';

export default function QualityOfHire() {
  const metrics = [
    { label: 'Avg Performance', value: `${MOCK_QUALITY_OF_HIRE.avgPerformance}/10`, pct: MOCK_QUALITY_OF_HIRE.avgPerformance * 10, icon: TrendingUp },
    { label: '90-Day Retention', value: `${MOCK_QUALITY_OF_HIRE.retention90d}%`, pct: MOCK_QUALITY_OF_HIRE.retention90d, icon: Users },
    { label: '1-Year Retention', value: `${MOCK_QUALITY_OF_HIRE.retention1y}%`, pct: MOCK_QUALITY_OF_HIRE.retention1y, icon: Heart },
    { label: 'Client Satisfaction', value: `${MOCK_QUALITY_OF_HIRE.clientSatisfaction}`, pct: MOCK_QUALITY_OF_HIRE.clientSatisfaction * 20, icon: Star },
    { label: 'Time to Productivity', value: MOCK_QUALITY_OF_HIRE.timeToProductivity, pct: 60, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.label}
            className="bg-bg-primary border border-bg-tertiary p-4"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color: '#C108AB' }} />
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{m.label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary mb-3">{m.value}</p>
            <div className="w-full h-2 bg-bg-secondary" style={{ borderRadius: 0 }}>
              <div
                className="h-full"
                style={{ width: `${m.pct}%`, backgroundColor: '#C108AB', borderRadius: 0 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
