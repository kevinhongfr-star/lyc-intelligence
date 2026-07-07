import React from 'react';
import type { CandidateApplication } from '@/services/supabaseApi';
import { StageProgress } from './StageProgress';

export interface CandidateAppSummary {
  id: string;
  role: string;
  company: string;
  currentStage: number;
}

const MOCK_APPLICATIONS: CandidateAppSummary[] = [
  { id: '1', role: 'VP Engineering', company: 'TechCorp', currentStage: 2 },
  { id: '2', role: 'CTO', company: 'NeoBank', currentStage: 1 },
  { id: '3', role: 'Head of Platform', company: 'DataPipe', currentStage: 4 },
];

interface ApplicationTrackerProps {
  /** Legacy prop — accepted for backward compatibility with the older CandidatePortal. */
  applications?: CandidateApplication[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function ApplicationTracker({ selectedId, onSelect }: ApplicationTrackerProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary">
      <div className="p-4 border-b border-bg-tertiary">
        <h2 className="font-serif text-lg font-bold text-text-primary">Applications</h2>
        <p className="text-xs text-text-muted mt-0.5">{MOCK_APPLICATIONS.length} active</p>
      </div>
      <div className="divide-y divide-bg-tertiary">
        {MOCK_APPLICATIONS.map((app) => {
          const selected = selectedId === app.id;
          return (
            <button
              key={app.id}
              onClick={() => onSelect?.(app.id)}
              className={`w-full text-left p-4 transition-colors ${
                selected ? 'bg-accent-10' : 'hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{app.role}</p>
                  <p className="text-sm text-text-muted truncate">{app.company}</p>
                </div>
              </div>
              <StageProgress currentStage={app.currentStage} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
