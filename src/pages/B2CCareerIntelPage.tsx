import React from 'react';
import { CareerTrajectory } from '@/components/b2c/CareerTrajectory';
import { SkillGapAnalysis } from '@/components/b2c/SkillGapAnalysis';
import { MarketPositioning } from '@/components/b2c/MarketPositioning';
import { PeerComparison } from '@/components/b2c/PeerComparison';
import { CoachIntegrationLink } from '@/components/b2c/CoachIntegrationLink';
import { ScoreTimeline } from '@/components/b2c/ScoreTimeline';
import { TargetRoleSimulator } from '@/components/b2c/TargetRoleSimulator';
import { TemporalBadge } from '@/components/shared/TemporalBadge';

export function B2CCareerIntelPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-text-primary">Career Intel</h1>
            <p className="text-text-muted mt-1 text-sm">
              Trajectory, skill gaps, market positioning, and peer benchmarks.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <TemporalBadge label="Updated today" />
            <CoachIntegrationLink context="career intel" />
          </div>
        </div>
      </header>

      <MarketPositioning score={72} percentile={18} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CareerTrajectory />
        <SkillGapAnalysis />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoreTimeline />
        <TargetRoleSimulator />
      </div>

      <PeerComparison />

      <CoachIntegrationLink context="skill gap analysis" />
    </div>
  );
}
