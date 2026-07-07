import React from 'react';
import { CalendarSyncStatus } from '@/components/internal/CalendarSyncStatus';
import { InterviewCoordinator } from '@/components/internal/InterviewCoordinator';
import { ScorecardTemplates } from '@/components/internal/ScorecardTemplates';
import { DebriefCapture } from '@/components/internal/DebriefCapture';

export function SchedulingPlusPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-text-primary">SCHEDULING+</h1>
      <CalendarSyncStatus />
      <InterviewCoordinator />
      <ScorecardTemplates />
      <DebriefCapture />
    </div>
  );
}
