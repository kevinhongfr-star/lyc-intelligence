import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { MOCK_REVENUE } from '@/mocks/internalPortal';

export default function RevenueAnalytics() {
  const total = MOCK_REVENUE.reduce((sum, r) => sum + r.revenue, 0);
  const avg = Math.round(total / MOCK_REVENUE.length);
  const maxRevenue = Math.max(...MOCK_REVENUE.map((r) => r.revenue));
  const trend = MOCK_REVENUE[MOCK_REVENUE.length - 1].revenue >= MOCK_REVENUE[0].revenue;

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Total:</span>
          <span className="text-sm font-bold text-text-primary">${total}k</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-text-muted" />
          <span className="text-sm text-text-muted">Avg:</span>
          <span className="text-sm font-bold text-text-primary">${avg}k</span>
        </div>
        <div className="flex items-center gap-2">
          {trend ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${trend ? 'text-green-600' : 'text-red-600'}`}>
            {trend ? 'Upward' : 'Downward'} trend
          </span>
        </div>
      </div>

      <div className="flex items-end gap-3" style={{ height: '200px' }}>
        {MOCK_REVENUE.map((entry) => {
          const height = (entry.revenue / maxRevenue) * 100;
          return (
            <div key={entry.month} className="flex flex-col items-center flex-1">
              <div
                className="w-full"
                style={{
                  height: `${height}%`,
                  backgroundColor: '#C108AB',
                  borderRadius: 0,
                  minHeight: '4px',
                }}
              />
              <span className="text-xs text-text-muted mt-2">{entry.month}</span>
              <span className="text-xs font-medium text-text-primary">${entry.revenue}k</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
