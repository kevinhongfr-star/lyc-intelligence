import React, { useState } from 'react';
import { ApplicationTracker } from '@/components/candidate/ApplicationTracker';
import { ApplicationTimeline } from '@/components/candidate/ApplicationTimeline';
import { ApplicationDocuments } from '@/components/candidate/ApplicationDocuments';

export function CandidateApplicationsPage() {
  const [selectedId, setSelectedId] = useState<string>('1');

  return (
    <div className="space-y-6">
      <header className="border-b border-bg-tertiary pb-6">
        <h1 className="font-serif text-2xl font-bold text-text-primary">Applications</h1>
        <p className="text-text-muted mt-1">Track every role through to placement</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ApplicationTracker selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <ApplicationTimeline applicationId={selectedId} />
          <ApplicationDocuments />
        </div>
      </div>
    </div>
  );
}
