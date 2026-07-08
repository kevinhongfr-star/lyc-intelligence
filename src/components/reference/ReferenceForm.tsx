// Phase 7.1: Reference Form Component (Public - No Login Required)
// Referee System - Structured questionnaire for referees

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface ReferenceRequest {
  id: string;
  candidateName: string;
  mandateTitle: string;
  refereeName: string;
  status: string;
  expiresAt: string;
}

interface ReferenceResponse {
  questionNumber: number;
  questionText: string;
  rating: number | null;
  responseText: string;
}

interface ReferenceFormProps {
  token: string;
}

// Structured questions for reference check
const REFERENCE_QUESTIONS = [
  {
    number: 1,
    text: 'How do you know {candidate} and in what capacity did you work together?',
    type: 'text',
    required: true,
  },
  {
    number: 2,
    text: 'How would you rate {candidate}\'s overall performance?',
    type: 'rating',
    ratingLabel: 'Overall Performance',
    required: true,
  },
  {
    number: 3,
    text: 'What are {candidate}\'s greatest strengths?',
    type: 'text',
    required: true,
  },
  {
    number: 4,
    text: 'What areas could {candidate} improve in?',
    type: 'text',
    required: true,
  },
  {
    number: 5,
    text: 'How would you rate {candidate}\'s leadership ability?',
    type: 'rating',
    ratingLabel: 'Leadership',
    required: true,
  },
  {
    number: 6,
    text: 'How would you rate {candidate}\'s teamwork and collaboration?',
    type: 'rating',
    ratingLabel: 'Teamwork',
    required: true,
  },
  {
    number: 7,
    text: 'How would you rate {candidate}\'s problem-solving ability?',
    type: 'rating',
    ratingLabel: 'Problem Solving',
    required: true,
  },
  {
    number: 8,
    text: 'Can you describe a specific situation where {candidate} demonstrated exceptional work?',
    type: 'text',
    required: true,
  },
  {
    number: 9,
    text: 'Would you hire or work with {candidate} again?',
    type: 'yesno',
    required: true,
  },
  {
    number: 10,
    text: 'Any additional comments?',
    type: 'text',
    required: false,
  },
];

type Step = 'loading' | 'form' | 'success' | 'expired' | 'error';

export function ReferenceForm({ token }: ReferenceFormProps) {
  const [step, setStep] = useState<Step>('loading');
  const [request, setRequest] = useState<ReferenceRequest | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Map<number, ReferenceResponse>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate token and load request
  useEffect(() => {
    async function loadRequest() {
      try {
        const response = await fetch(`/api/data/reference/${token}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          if (result.error === 'Request expired') {
            setStep('expired');
          } else {
            setStep('error');
            setError(result.error || 'Invalid link');
          }
          return;
        }

        const requestData = result.data;

        // Check if already submitted
        if (requestData.status === 'submitted') {
          setStep('success');
          return;
        }

        // Check if expired
        if (new Date(requestData.expires_at) < new Date()) {
          setStep('expired');
          return;
        }

        setRequest(requestData);
        setStep('form');
      } catch (err) {
        setStep('error');
        setError('Failed to load reference request');
      }
    }

    loadRequest();
  }, [token]);

  // Handle response update
  const handleResponse = (questionNumber: number, update: Partial<ReferenceResponse>) => {
    const current = responses.get(questionNumber) || {
      questionNumber,
      questionText: '',
      rating: null,
      responseText: '',
    };

    const updated = { ...current, ...update };
    setResponses(new Map(responses.set(questionNumber, updated)));
  };

  // Check if current question is answered
  const isCurrentAnswered = () => {
    const question = REFERENCE_QUESTIONS[currentQuestion];
    const response = responses.get(question.number);

    if (!response) return false;

    if (question.type === 'rating' || question.type === 'yesno') {
      return response.rating !== null;
    }

    return (response.responseText?.trim()?.length || 0) > 0;
  };

  // Check if can submit (all required questions answered)
  const canSubmit = () => {
    for (const q of REFERENCE_QUESTIONS) {
      if (!q.required) continue;

      const response = responses.get(q.number);
      if (!response) return false;

      if (q.type === 'rating' || q.type === 'yesno') {
        if (response.rating === null) return false;
      } else {
        if (!response.responseText?.trim()) return false;
      }
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit() || !request) return;

    setIsSubmitting(true);

    try {
      const responsesArray = Array.from(responses.values()).map(r => ({
        question_number: r.questionNumber,
        question_text: r.questionText,
        rating: r.rating,
        response_text: r.responseText,
      }));

      const response = await fetch(`/api/data/reference/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responsesArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reference');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-text-muted mt-2">Loading reference request...</p>
        </div>
      </div>
    );
  }

  // Render expired
  if (step === 'expired') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-4">
            Link Expired
          </h1>
          <p className="text-text-muted mt-2">
            This reference request link has expired. Please contact the recruiter if you still wish to provide a reference.
          </p>
        </div>
      </div>
    );
  }

  // Render error
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-4">
            Invalid Link
          </h1>
          <p className="text-text-muted mt-2">
            {error || 'This reference request link is invalid. Please check the link or contact the recruiter.'}
          </p>
        </div>
      </div>
    );
  }

  // Render success
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mt-4">
            Thank You!
          </h1>
          <p className="text-text-muted mt-2">
            Your reference has been submitted successfully. The recruiter will review your feedback.
          </p>
        </div>
      </div>
    );
  }

  // Render form
  const question = REFERENCE_QUESTIONS[currentQuestion];
  const response = responses.get(question.number);
  const candidateName = request?.candidateName?.split(' ')[0] || 'the candidate';
  const questionText = question.text.replace('{candidate}', candidateName);

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-text-primary">Reference Request</h1>
              <p className="text-sm text-text-muted">{request?.mandateTitle}</p>
            </div>
            <div className="text-sm text-text-muted">
              Question {currentQuestion + 1} of {REFERENCE_QUESTIONS.length}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 bg-bg-alt rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentQuestion + 1) / REFERENCE_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-card rounded-none border border-border p-6">
          <h2 className="text-lg font-medium text-text-primary mb-6">
            {questionText}
          </h2>

          {/* Rating question */}
          {question.type === 'rating' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleResponse(question.number, { rating: value })}
                    className={`w-14 h-14 rounded-none border-2 font-semibold transition-all ${
                      response?.rating === value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border hover:border-primary/50 text-text-muted'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          )}

          {/* Yes/No question */}
          {question.type === 'yesno' && (
            <div className="flex gap-4">
              {[
                { value: 'yes', label: 'Yes', color: 'green' },
                { value: 'no', label: 'No', color: 'red' },
                { value: 'maybe', label: 'Maybe', color: 'amber' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleResponse(question.number, {
                      rating: option.value === 'yes' ? 5 : option.value === 'maybe' ? 3 : 1,
                      responseText: option.label,
                    })
                  }
                  className={`flex-1 py-4 rounded-none border-2 font-medium transition-all ${
                    response?.responseText === option.label
                      ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                      : 'border-border hover:border-primary/50 text-text-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Text question */}
          {question.type === 'text' && (
            <textarea
              value={response?.responseText || ''}
              onChange={(e) =>
                handleResponse(question.number, { responseText: e.target.value })
              }
              className="w-full px-4 py-3 border border-border rounded-none bg-bg-base text-text-primary resize-none"
              rows={5}
              placeholder="Please share your thoughts..."
            />
          )}

          {/* Response text for rating questions */}
          {(question.type === 'rating' || question.type === 'yesno') && (
            <div className="mt-4">
              <textarea
                value={response?.responseText || ''}
                onChange={(e) =>
                  handleResponse(question.number, { responseText: e.target.value })
                }
                className="w-full px-4 py-3 border border-border rounded-none bg-bg-base text-text-primary resize-none"
                rows={3}
                placeholder="Optional: Add more detail..."
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-text-muted hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestion < REFERENCE_QUESTIONS.length - 1 ? (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={question.required && !isCurrentAnswered()}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-none font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Reference
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Jump to question */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-text-muted mb-3">Jump to question:</p>
          <div className="flex flex-wrap gap-2">
            {REFERENCE_QUESTIONS.map((q, idx) => {
              const r = responses.get(q.number);
              const isAnswered = q.type === 'rating' || q.type === 'yesno'
                ? r?.rating !== null
                : !!r?.responseText?.trim();

              return (
                <button
                  key={q.number}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-8 h-8 rounded-none text-sm font-medium transition-colors ${
                    idx === currentQuestion
                      ? 'bg-primary text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-bg-alt text-text-muted hover:bg-primary/10'
                  }`}
                >
                  {q.number}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferenceForm;
