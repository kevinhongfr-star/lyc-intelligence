import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export type QuestionType = 'likert' | 'mcq_single' | 'mcq_multi' | 'text' | 'ranking';

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  required?: boolean;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  max_length?: number;
  ranking_items?: string[];
}

export interface AssessmentConfig {
  id: string;
  title: string;
  type: string;
  description?: string;
  estimated_minutes: number;
  show_timer: boolean;
  questions: AssessmentQuestion[];
}

export interface AssessmentResponse {
  question_id: string;
  value: string | number | string[] | number[];
}

export interface CandidateAssessmentProps {
  assessment: AssessmentConfig;
  candidateId: string;
  mandateId: string;
  onSubmit: (responses: AssessmentResponse[]) => Promise<void>;
  onSave?: (responses: AssessmentResponse[]) => Promise<void>;
  onExit?: () => void;
  initialResponses?: AssessmentResponse[];
}

const STORAGE_KEY = 'candidate_assessment_responses';

export function CandidateAssessment({
  assessment,
  candidateId,
  mandateId,
  onSubmit,
  onSave,
  onExit,
  initialResponses = [],
}: CandidateAssessmentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, AssessmentResponse['value']>>(() => {
    const saved: Record<string, AssessmentResponse['value']> = {};
    initialResponses.forEach(r => {
      saved[r.question_id] = r.value;
    });
    return saved;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);

  const currentQuestion = assessment.questions[currentIndex];
  const progress = ((currentIndex + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentIndex === assessment.questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  // Calculate total time if timer is enabled
  useEffect(() => {
    if (assessment.show_timer && assessment.estimated_minutes > 0) {
      setTimeRemaining(assessment.estimated_minutes * 60);
    }
  }, [assessment.show_timer, assessment.estimated_minutes]);

  // Timer countdown
  useEffect(() => {
    if (!assessment.show_timer || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment.show_timer, timeRemaining]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        assessmentId: assessment.id,
        candidateId,
        mandateId,
        responses,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Failed to save responses to localStorage', e);
    }
  }, [responses, assessment.id, candidateId, mandateId]);

  // Load saved responses
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.assessmentId === assessment.id && parsed.candidateId === candidateId) {
          setResponses(prev => ({ ...prev, ...parsed.responses }));
        }
      }
    } catch (e) {
      console.warn('Failed to load saved responses', e);
    }
  }, [assessment.id, candidateId]);

  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save to server
  const saveToServer = useCallback(async () => {
    if (!onSave || !isOnline) return;

    setIsSaving(true);
    try {
      const responseArray: AssessmentResponse[] = Object.entries(responses).map(([question_id, value]) => ({
        question_id,
        value,
      }));
      await onSave(responseArray);
      setLastSaved(new Date());
    } catch (e) {
      console.error('Auto-save failed:', e);
    } finally {
      setIsSaving(false);
    }
  }, [responses, onSave, isOnline]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(responses).length > 0) {
        saveToServer();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [responses, saveToServer]);

  const handleResponseChange = (value: AssessmentResponse['value']) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < assessment.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unansweredRequired = assessment.questions
      .filter(q => q.required && !responses[q.id])
      .map(q => q.text);

    if (unansweredRequired.length > 0 && !timeExpired) {
      alert(`Please answer all required questions: ${unansweredRequired.length} remaining`);
      return;
    }

    setIsSubmitting(true);
    try {
      const responseArray: AssessmentResponse[] = Object.entries(responses).map(([question_id, value]) => ({
        question_id,
        value,
      }));
      await onSubmit(responseArray);
      // Clear localStorage after successful submit
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Submit failed:', e);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentResponse = () => responses[currentQuestion.id];

  const canProceed = currentQuestion.required
    ? responses[currentQuestion.id] !== undefined
    : true;

  // Render Likert scale question
  const renderLikert = () => {
    const scaleMin = currentQuestion.scale_min ?? 1;
    const scaleMax = currentQuestion.scale_max ?? 7;
    const currentValue = getCurrentResponse() as number | undefined;

    return (
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{currentQuestion.scale_min_label || 'Strongly Disagree'}</span>
          <span>{currentQuestion.scale_max_label || 'Strongly Agree'}</span>
        </div>
        <div className="flex justify-between gap-1">
          {Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i).map(value => (
            <button
              key={value}
              onClick={() => handleResponseChange(value)}
              className={`flex-1 py-4 px-2 rounded-xl border-2 transition-all text-center font-medium ${
                currentValue === value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render MCQ single choice question
  const renderMCQSingle = () => {
    const currentValue = getCurrentResponse() as string | undefined;
    const options = currentQuestion.options || [];

    return (
      <div className="space-y-3">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleResponseChange(option)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              currentValue === option
                ? 'border-accent bg-accent/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                currentValue === option
                  ? 'border-accent bg-accent'
                  : 'border-gray-300'
              }`}>
                {currentValue === option && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-gray-800">{option}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render MCQ multiple choice question
  const renderMCQMulti = () => {
    const currentValue = (getCurrentResponse() as string[]) || [];
    const options = currentQuestion.options || [];

    const toggleOption = (option: string) => {
      if (currentValue.includes(option)) {
        handleResponseChange(currentValue.filter(v => v !== option));
      } else {
        handleResponseChange([...currentValue, option]);
      }
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => toggleOption(option)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              currentValue.includes(option)
                ? 'border-accent bg-accent/10'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                currentValue.includes(option)
                  ? 'border-accent bg-accent'
                  : 'border-gray-300'
              }`}>
                {currentValue.includes(option) && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-gray-800">{option}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Render text question
  const renderText = () => {
    const currentValue = getCurrentResponse() as string | undefined;
    const maxLength = currentQuestion.max_length || 1000;

    return (
      <div className="space-y-2">
        <textarea
          value={currentValue || ''}
          onChange={e => handleResponseChange(e.target.value)}
          maxLength={maxLength}
          rows={6}
          className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-accent focus:outline-none resize-none text-gray-800"
          placeholder="Type your answer here..."
        />
        <div className="text-right text-sm text-gray-400">
          {(currentValue || '').length} / {maxLength}
        </div>
      </div>
    );
  };

  // Render ranking question
  const renderRanking = () => {
    const currentValue = (getCurrentResponse() as number[]) || [];
    const items = currentQuestion.ranking_items || [];

    const moveItem = (fromIndex: number, toIndex: number) => {
      const newOrder = [...currentValue];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      handleResponseChange(newOrder);
    };

    // Initialize ranking order if not set
    useEffect(() => {
      if (currentValue.length === 0 && items.length > 0) {
        handleResponseChange(items.map((_, i) => i));
      }
    }, []);

    if (currentValue.length === 0) return null;

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500 mb-4">Drag to reorder, or use buttons</p>
        {currentValue.map((itemIndex, displayIndex) => (
          <div
            key={itemIndex}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200"
          >
            <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
              {displayIndex + 1}
            </span>
            <span className="flex-1 text-gray-800">{items[itemIndex]}</span>
            <div className="flex gap-1">
              <button
                onClick={() => displayIndex > 0 && moveItem(displayIndex, displayIndex - 1)}
                disabled={displayIndex === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => displayIndex < items.length - 1 && moveItem(displayIndex, displayIndex + 1)}
                disabled={displayIndex === items.length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'likert':
        return renderLikert();
      case 'mcq_single':
        return renderMCQSingle();
      case 'mcq_multi':
        return renderMCQMulti();
      case 'text':
        return renderText();
      case 'ranking':
        return renderRanking();
      default:
        return <p className="text-gray-500">Unsupported question type</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onExit && (
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
              <div>
                <h1 className="font-semibold text-gray-900">{assessment.title}</h1>
                <p className="text-sm text-gray-500">{assessment.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Online status */}
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-gray-400" />
              )}
              {/* Save status */}
              {isSaving ? (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              ) : lastSaved ? (
                <span className="text-sm text-gray-400">Saved</span>
              ) : null}
              {/* Timer */}
              {assessment.show_timer && timeRemaining !== null && (
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining < 300 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  {timeExpired ? 'Time expired' : formatTime(timeRemaining)}
                </div>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Question {currentIndex + 1} of {assessment.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Question text */}
          <div className="mb-6">
            <div className="flex items-start gap-2 mb-2">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                {currentQuestion.text}
              </h2>
              {currentQuestion.required && (
                <span className="text-red-500">*</span>
              )}
            </div>
            {currentQuestion.description && (
              <p className="text-gray-500">{currentQuestion.description}</p>
            )}
          </div>

          {/* Answer */}
          {renderQuestion()}

          {/* Validation message */}
          {currentQuestion.required && !responses[currentQuestion.id] && (
            <p className="mt-4 text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              This question is required
            </p>
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstQuestion}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {/* Question dots */}
              <div className="hidden md:flex items-center gap-1">
                {assessment.questions.slice(Math.max(0, currentIndex - 2), currentIndex).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 2 + i))}
                    className={`w-2 h-2 rounded-full ${
                      responses[q.id] ? 'bg-accent' : 'bg-gray-300'
                    }`}
                  />
                ))}
                <div className={`w-2 h-2 rounded-full ${responses[currentQuestion.id] ? 'bg-accent' : 'bg-accent/50'}`} />
                {assessment.questions.slice(currentIndex + 1, currentIndex + 3).map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(currentIndex + 1 + i)}
                    className={`w-2 h-2 rounded-full ${
                      responses[q.id] ? 'bg-accent' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {isLastQuestion ? (
              <Button
                variant="default"
                onClick={handleSubmit}
                disabled={isSubmitting || (!canProceed && !timeExpired)}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </footer>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exit Assessment?</h3>
            <p className="text-gray-500 mb-6">
              Your progress has been auto-saved. You can resume later from where you left off.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1"
              >
                Continue
              </Button>
              <Button
                variant="default"
                onClick={onExit}
                className="flex-1"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateAssessment;
