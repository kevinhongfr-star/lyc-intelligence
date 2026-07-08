import React, { useState, useMemo } from 'react';
import { Globe, ArrowUpDown } from 'lucide-react';
import { MOCK_MARKET_MAPS } from '@/mocks/internalPortal';

const demandOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
const demandColors: Record<string, string> = {
  High: 'bg-[#C108AB]/15 text-[#C108AB]',
  Medium: 'bg-amber-500/15 text-amber-700',
  Low: 'bg-gray-500/15 text-gray-600',
};
const supplyColors: Record<string, string> = {
  High: 'bg-green-500/15 text-green-700',
  Medium: 'bg-amber-500/15 text-amber-700',
  Low: 'bg-red-500/15 text-red-600',
};

export default function MarketMaps() {
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...MOCK_MARKET_MAPS].sort((a, b) => {
      const diff = demandOrder[a.demand] - demandOrder[b.demand];
      return sortAsc ? diff : -diff;
    });
  }, [sortAsc]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#C108AB]" />
          <span className="text-sm font-medium text-text-primary">Market Maps</span>
        </div>
        <button
          onClick={() => setSortAsc(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-bg-tertiary text-text-secondary hover:bg-bg-secondary transition-colors"
          style={{ borderRadius: 0 }}
        >
          <ArrowUpDown className="w-3 h-3" />
          Sort by Demand ({sortAsc ? 'Low first' : 'High first'})
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map(map => (
          <div
            key={map.region}
            className="border border-bg-tertiary bg-bg-primary p-4 flex items-center gap-6"
            style={{ borderRadius: 0 }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-4 h-4 text-text-muted" />
                <span className="font-medium text-text-primary">{map.region}</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-text-muted">
                <span>{map.roles} roles</span>
                <span>Avg: {map.avgSalary}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-text-muted">Demand</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${demandColors[map.demand]}`}>
                {map.demand}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-text-muted">Supply</span>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${supplyColors[map.supply]}`}>
                {map.supply}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
