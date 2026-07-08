import React, { useState } from 'react';
import { ClipboardCheck, Clock, BarChart2 } from 'lucide-react';
import { MOCK_ASSESSMENTS, type Assessment } from '@/mocks/advancedFeatures';
import { Badge } from '@/components/ui';
import AssessmentDetail from './AssessmentDetail';

type TypeTab = 'all' | 'personality' | 'cognitive' | 'skills' | 'leadership';

const TYPE_TABS: { id: TypeTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'personality', label: 'Personality' },
  { id: 'cognitive', label: 'Cognitive' },
  { id: 'skills', label: 'Skills' },
  { id: 'leadership', label: 'Leadership' },
];

const STATUS_CONFIG: Record<Assessment['status'], { label: string; variant: 'success' | 'warning' | 'default'; color: string }> = {
  available: { label: 'Available', variant: 'success', color: 'bg-green-500' },
  in_progress: { label: 'In Progress', variant: 'warning', color: 'bg-amber-500' },
  completed: { label: 'Completed', variant: 'default', color: 'bg-[#C108AB]' },
};

export default function AssessmentCatalog() {
  const [activeTab, setActiveTab] = useState<TypeTab>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const filteredAssessments =
    activeTab === 'all'
      ? MOCK_ASSESSMENTS
      : MOCK_ASSESSMENTS.filter((a) => a.type === activeTab);

  if (selectedAssessment) {
    return (
      <AssessmentDetail
        assessment={selectedAssessment}
        onBack={() => setSelectedAssessment(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Type filter tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary pb-3">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-accent text-white'
                : 'text-text-muted hover:bg-bg-tertiary'
            }`}
            style={{ borderRadius: 0 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessment grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssessments.map((assessment) => {
          const statusConfig = STATUS_CONFIG[assessment.status];
          return (
            <button
              key={assessment.id}
              onClick={() => setSelectedAssessment(assessment)}
              className="text-left bg-bg-primary border border-bg-tertiary p-5 hover:bg-bg-secondary transition-colors"
              style={{ borderRadius: 0 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Badge variant="default" className="uppercase text-[10px] tracking-wider">
                  {assessment.type}
                </Badge>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <h3 className="font-serif font-semibold text-text-primary text-lg mb-2">
                {assessment.name}
              </h3>
              <p className="text-sm text-text-muted mb-4 line-clamp-2">
                {assessment.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {assessment.estimatedTime}
                </span>
                <span className="flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" />
                  {assessment.questionCount} questions
                </span>
                {assessment.score !== undefined && (
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    Score: {assessment.score}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No assessments found for this category.
        </div>
      )}
    </div>
  );
}
