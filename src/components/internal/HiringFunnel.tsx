import React from 'react';
import { MOCK_HIRING_FUNNEL } from '@/mocks/internalPortal';

export default function HiringFunnel() {
  const total = MOCK_HIRING_FUNNEL[0].count;

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
      <div className="space-y-3">
        {MOCK_HIRING_FUNNEL.map((stage, index) => {
          const percentage = Math.round((stage.count / total) * 100);
          const barWidth = Math.round((stage.count / 200) * 200);
          const opacity = 0.4 + (index / (MOCK_HIRING_FUNNEL.length - 1)) * 0.6;

          return (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-text-primary text-right shrink-0">
                {stage.stage}
              </div>
              <div className="flex-1">
                <div
                  className="h-8"
                  style={{
                    width: `${barWidth}px`,
                    maxWidth: '200px',
                    backgroundColor: `rgba(193, 8, 171, ${opacity})`,
                    borderRadius: 0,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '8px',
                  }}
                >
                  <span className="text-xs font-semibold text-white">{stage.count}</span>
                </div>
              </div>
              <div className="w-14 text-sm text-text-muted text-right shrink-0">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
