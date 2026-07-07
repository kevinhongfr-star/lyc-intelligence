import React from 'react';
import { TeamMemberList } from '@/components/internal/TeamMemberList';
import { PerformanceMetrics } from '@/components/internal/PerformanceMetrics';
import { WorkloadDistribution } from '@/components/internal/WorkloadDistribution';

export function TeamPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">TEAM</h1>
      <TeamMemberList />
      <PerformanceMetrics />
      <WorkloadDistribution />
    </div>
  );
}
