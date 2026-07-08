import React from 'react';
import { ClipboardCheck, Clock, BarChart2, Award, ChevronLeft } from 'lucide-react';
import { MOCK_ASSESSMENT_QUESTIONS, type Assessment } from '@/mocks/advancedFeatures';
import { Badge, Button } from '@/components/ui';

interface AssessmentDetailProps {
  assessment: Assessment;
  onBack: () => void;
  onStart?: (assessment: Assessment) => void;
}

export default function AssessmentDetail({ assessment, onBack, onStart }: AssessmentDetailProps) {
  const sampleQuestion = MOCK_ASSESSMENT_QUESTIONS[0];
  const isCompleted = assessment.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" />
        Back to Catalog
      </Button>

      {/* Assessment header */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="default" className="uppercase text-[10px] tracking-wider">
            {assessment.type}
          </Badge>
          <Badge
            variant={assessment.status === 'completed' ? 'default' : assessment.status === 'in_progress' ? 'warning' : 'success'}
          >
            {assessment.status === 'in_progress' ? 'In Progress' : assessment.status === 'completed' ? 'Completed' : 'Available'}
          </Badge>
        </div>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-3">
          {assessment.name}
        </h2>
        <p className="text-text-muted leading-relaxed">{assessment.description}</p>

        <div className="flex items-center gap-6 mt-4 text-sm text-text-muted">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {assessment.estimatedTime}
          </span>
          <span className="flex items-center gap-1">
            <ClipboardCheck className="w-4 h-4" />
            {assessment.questionCount} questions
          </span>
        </div>
      </div>

      {/* Completed results summary */}
      {isCompleted && assessment.score !== undefined && (
        <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
          <h3 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Your Results
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-secondary p-4" style={{ borderRadius: 0 }}>
              <p className="text-sm text-text-muted">Score</p>
              <p className="text-2xl font-bold text-text-primary">{assessment.score}</p>
            </div>
            <div className="bg-bg-secondary p-4" style={{ borderRadius: 0 }}>
              <p className="text-sm text-text-muted">Percentile</p>
              <p className="text-2xl font-bold text-accent">{assessment.percentile}%</p>
            </div>
          </div>
          {assessment.lastTaken && (
            <p className="text-xs text-text-muted mt-3">
              Last taken: {assessment.lastTaken}
            </p>
          )}
        </div>
      )}

      {/* Sample question preview */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <h3 className="font-serif font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-text-muted" />
          Sample Question
        </h3>
        <p className="text-text-primary mb-3">{sampleQuestion.text}</p>
        <div className="space-y-2">
          {sampleQuestion.options.map((option, idx) => (
            <div
              key={idx}
              className="bg-bg-secondary p-3 text-sm text-text-secondary"
              style={{ borderRadius: 0 }}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      <div className="flex gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={() => onStart?.(assessment)}
          style={{ borderRadius: 0 }}
        >
          {isCompleted ? 'Retake Assessment' : 'Start Assessment'}
        </Button>
        <Button variant="outline" size="lg" onClick={onBack} style={{ borderRadius: 0 }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
