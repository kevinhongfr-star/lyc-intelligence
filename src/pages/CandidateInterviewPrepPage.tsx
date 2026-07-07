import React from 'react';
import { MockInterviewSimulator } from '@/components/candidate/MockInterviewSimulator';
import { CompanyBriefing } from '@/components/candidate/CompanyBriefing';
import { PanelProfiles } from '@/components/candidate/PanelProfiles';
import { QuestionPrediction } from '@/components/candidate/QuestionPrediction';

export function CandidateInterviewPrepPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">INTERVIEW PREPARATION</h1>
        <p className="text-text-secondary mt-1">VP Engineering — TechCorp</p>
        <p className="text-xs text-text-muted mt-2">
          Interview: Jul 10, 14:00 | Panel: 3 interviewers
        </p>
      </header>

      <MockInterviewSimulator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompanyBriefing />
        <PanelProfiles />
      </div>

      <QuestionPrediction />
    </div>
  );
}
