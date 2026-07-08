import React, { useState } from 'react';
import { ClipboardCheck, BarChart2, Share2 } from 'lucide-react';
import { type Assessment } from '@/mocks/advancedFeatures';
import AssessmentCatalog from '@/components/assessment/AssessmentCatalog';
import AssessmentResults from '@/components/assessment/AssessmentResults';
import AssessmentComparison from '@/components/assessment/AssessmentComparison';
import ShareAssessment from '@/components/assessment/ShareAssessment';
import AssessmentTake from '@/components/assessment/AssessmentTake';

type Tab = 'catalog' | 'results' | 'compare';
type View = { type: 'tab'; tab: Tab } | { type: 'take'; assessment: Assessment } | { type: 'share' };

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'catalog', label: 'Catalog', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'results', label: 'Results', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'compare', label: 'Compare', icon: <Share2 className="w-4 h-4" /> },
];

export default function CandidateAssessmentsPage() {
  const [view, setView] = useState<View>({ type: 'tab', tab: 'catalog' });

  const activeTab = view.type === 'tab' ? view.tab : 'catalog';

  const handleStartAssessment = (assessment: Assessment) => {
    setView({ type: 'take', assessment });
  };

  const handleBackToCatalog = () => {
    setView({ type: 'tab', tab: 'catalog' });
  };

  const handleShare = () => {
    setView({ type: 'share' });
  };

  // Assessment taking view
  if (view.type === 'take') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <main className="max-w-3xl mx-auto px-6 py-6">
          <AssessmentTake
            assessment={view.assessment}
            onComplete={handleBackToCatalog}
          />
        </main>
      </div>
    );
  }

  // Share view
  if (view.type === 'share') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <header className="bg-bg-primary border-b border-bg-tertiary">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <h1 className="font-serif text-2xl font-semibold text-text-primary">
              Share Assessment Results
            </h1>
            <p className="text-text-muted mt-1">
              Generate a shareable link to your assessment results.
            </p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-6">
          <ShareAssessment />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Page header */}
      <header className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            Assessments
          </h1>
          <p className="text-text-muted mt-1">
            Discover, take, and analyze your professional assessments.
          </p>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="bg-bg-primary border-b border-bg-tertiary">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView({ type: 'tab', tab: tab.id })}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
                style={{ borderRadius: 0 }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        {activeTab === 'catalog' && (
          <AssessmentCatalog />
        )}
        {activeTab === 'results' && (
          <AssessmentResults
            onBack={handleBackToCatalog}
            onShare={handleShare}
            onRetake={handleBackToCatalog}
          />
        )}
        {activeTab === 'compare' && (
          <AssessmentComparison />
        )}
      </main>
    </div>
  );
}
