import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { MOCK_ASSESSMENT_QUESTIONS } from '@/mocks/advancedFeatures';
import { Button, Progress } from '@/components/ui';
import type { Assessment } from '@/mocks/advancedFeatures';
import AssessmentResults from './AssessmentResults';

interface AssessmentTakeProps {
  assessment: Assessment;
  onComplete: () => void;
}

export default function AssessmentTake({ assessment, onComplete }: AssessmentTakeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const totalQuestions = MOCK_ASSESSMENT_QUESTIONS.length;
  const currentQuestion = MOCK_ASSESSMENT_QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Timer counting up
  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswer = (questionIndex: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return <AssessmentResults onBack={onComplete} />;
  }

  return (
    <div className="space-y-6">
      {/* Header: timer + progress */}
      <div className="bg-bg-primary border border-bg-tertiary p-4" style={{ borderRadius: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif font-semibold text-text-primary">{assessment.name}</h2>
          <div className="flex items-center gap-1 text-sm text-text-muted">
            <Clock className="w-4 h-4" />
            {formatTime(elapsedSeconds)}
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-text-muted mb-2">
          <span>Question {currentIndex + 1} of {totalQuestions}</span>
          <span>{Math.round(((currentIndex + 1) / totalQuestions) * 100)}%</span>
        </div>
        <Progress value={((currentIndex + 1) / totalQuestions) * 100} />
      </div>

      {/* Question */}
      <div className="bg-bg-primary border border-bg-tertiary p-6" style={{ borderRadius: 0 }}>
        <p className="text-text-primary text-lg font-medium mb-6">
          {currentQuestion.text}
        </p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = answers[currentIndex] === option;
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(currentIndex, option)}
                className={`w-full text-left p-4 border transition-colors flex items-center gap-3 ${
                  isSelected
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-bg-tertiary hover:bg-bg-secondary text-text-secondary'
                }`}
                style={{ borderRadius: 0 }}
              >
                <div
                  className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-accent bg-accent' : 'border-bg-tertiary'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="default"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          style={{ borderRadius: 0 }}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            variant="default"
            size="default"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < totalQuestions}
            style={{ borderRadius: 0 }}
          >
            Submit
          </Button>
        ) : (
          <Button
            variant="default"
            size="default"
            onClick={handleNext}
            style={{ borderRadius: 0 }}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
