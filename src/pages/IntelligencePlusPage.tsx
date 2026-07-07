import React from 'react';
import { InteractiveGRID } from '@/components/internal/InteractiveGRID';
import { MarketMapView } from '@/components/internal/MarketMapView';
import { CompanyRanking } from '@/components/internal/CompanyRanking';
import { TalentDensityHeatmap } from '@/components/internal/TalentDensityHeatmap';

export function IntelligencePlusPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">INTELLIGENCE+</h1>
      </header>
      <InteractiveGRID />
      <MarketMapView />
      <CompanyRanking />
      <TalentDensityHeatmap />
    </div>
  );
}
