import React from 'react';
import { Map } from 'lucide-react';

interface CityProfile {
  city: string;
  count: number;
}

const CITIES: CityProfile[] = [
  { city: 'Singapore', count: 247 },
  { city: 'Shanghai', count: 189 },
  { city: 'Jakarta', count: 156 },
  { city: 'Bangkok', count: 87 },
  { city: 'Manila', count: 54 },
];

const MAX_COUNT = 247;

export function MarketMapView() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-1">
        <Map className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">MARKET MAP</h3>
      </div>
      <p className="text-xs text-text-muted mb-4">SEA Fintech Talent Density</p>

      <div className="space-y-3">
        {CITIES.map((c) => {
          const widthPct = (c.count / MAX_COUNT) * 100;
          return (
            <div key={c.city} className="flex items-center gap-3">
              <span className="w-24 text-sm font-medium text-text-primary">{c.city}</span>
              <div className="flex-1 h-6 bg-bg-tertiary">
                <div
                  className="h-6 bg-accent"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="w-20 text-right text-xs text-text-muted">
                {c.count} profiles
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
