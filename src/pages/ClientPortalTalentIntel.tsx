import React from 'react';
import { TalentLandscapeExplorer } from '@/components/client/TalentLandscapeExplorer';
import { LeadershipBenchmark } from '@/components/client/LeadershipBenchmark';
import { BenchmarkRow } from '@/components/client/BenchmarkRow';

const DIMENSIONS = [
  { dimension: 'Strategic Vision', yourScore: 7.2, p50: 6.5, p75: 8.0 },
  { dimension: 'Execution', yourScore: 8.0, p50: 7.0, p75: 8.5 },
  { dimension: 'Innovation', yourScore: 6.0, p50: 6.8, p75: 8.2 },
  { dimension: 'Commercial', yourScore: 5.5, p50: 6.0, p75: 7.5 },
  { dimension: 'People', yourScore: 7.8, p50: 7.2, p75: 8.3 },
];

export function ClientPortalTalentIntel() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">TALENT INTELLIGENCE</h1>
        <p className="text-text-muted mt-1">
          Market mapping, talent landscape, and competitive leadership benchmarking
        </p>
      </header>

      <TalentLandscapeExplorer />

      <LeadershipBenchmark />

      <section className="bg-bg-primary border border-bg-tertiary p-5">
        <h3 className="font-serif text-lg font-bold text-text-primary mb-4">DIMENSION BREAKDOWN</h3>
        {DIMENSIONS.map((d) => (
          <BenchmarkRow
            key={d.dimension}
            dimension={d.dimension}
            yourScore={d.yourScore}
            p50={d.p50}
            p75={d.p75}
          />
        ))}
      </section>
    </div>
  );
}
