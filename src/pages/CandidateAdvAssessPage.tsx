import React from 'react';
import { PremiumAssessments } from '@/components/candidate/PremiumAssessments';
import { AssessmentResults } from '@/components/candidate/AssessmentResults';
import { ResultsExport } from '@/components/candidate/ResultsExport';

export function CandidateAdvAssessPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-text-primary">ADVANCED ASSESSMENTS</h1>
        <p className="text-text-muted mt-1">Premium tools to differentiate your profile</p>
      </header>

      <PremiumAssessments />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssessmentResults />
        <ResultsExport />
      </div>
    </div>
  );
}
