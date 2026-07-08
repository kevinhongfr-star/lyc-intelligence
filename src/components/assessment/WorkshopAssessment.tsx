import React, { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { ASSESSMENT_CATALOG, type AssessmentDimension } from '@/assessments/catalog';
import { 
  getWorkshopByToken, 
  saveParticipantResponses, 
  submitAssessment,
  scoreAdvisoryAssessment
} from '@/services/supabaseApi';
import type { WorkshopData, ParticipantData } from '@/services/supabaseApi';

type AssessmentPhase = 'welcome' | 'assessment' | 'completion';

interface Question {
  id: string;
  dimension: AssessmentDimension;
  question: string;
  type: 'scale' | 'multiple_choice';
  options?: string[];
}

export function WorkshopAssessment({ token }: { token: string }) {
  const [phase, setPhase] = useState<AssessmentPhase>('welcome');
  const [workshop, setWorkshop] = useState<WorkshopData | null>(null);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    loadWorkshop();
  }, [token]);

  useEffect(() => {
    if (phase === 'assessment' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [phase, timeRemaining]);

  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (phase === 'assessment' && participant) {
        saveParticipantResponses(participant.id, responses);
      }
    }, 2000);
    return () => clearTimeout(autoSave);
  }, [responses, phase, participant]);

  const loadWorkshop = async () => {
    try {
      const data = await getWorkshopByToken(token);
      if (data) {
        setWorkshop(data.workshop);
        setParticipant(data.participant);
        setTimeRemaining(data.workshop.duration_minutes * 60);
        generateQuestions(data.workshop.assessment_type);
      } else {
        setError('Invalid or expired link');
      }
    } catch (err) {
      console.error('Load workshop error:', err);
      setError('Failed to load workshop');
    }
  };

  const generateQuestions = (assessmentType: string) => {
    const catalog = ASSESSMENT_CATALOG[assessmentType as keyof typeof ASSESSMENT_CATALOG];
    if (!catalog) return;

    const newQuestions: Question[] = catalog.dimensions.flatMap(dimension => [
      {
        id: `${dimension.id}_1`,
        dimension,
        question: `When it comes to ${dimension.name.toLowerCase()}, how would you describe your current approach?`,
        type: 'scale',
      },
      {
        id: `${dimension.id}_2`,
        dimension,
        question: `How would you rate your effectiveness in applying ${dimension.name.toLowerCase()} in your work?`,
        type: 'scale',
      },
      {
        id: `${dimension.id}_3`,
        dimension,
        question: `Which statement best describes your ${dimension.name.toLowerCase()} style?`,
        type: 'multiple_choice',
        options: [
          dimension.lowLabel,
          `Between ${dimension.lowLabel} and ${dimension.highLabel}`,
          dimension.highLabel,
          `Strongly ${dimension.highLabel}`,
        ],
      },
    ]);

    setQuestions(newQuestions);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer: number | string) => {
    const question = questions[currentQuestionIndex];
    setResponses(prev => ({ ...prev, [question.id]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!workshop || !participant) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAssessment(participant.id);
      
      await scoreAdvisoryAssessment(workshop.id, participant.id);

      setPhase('completion');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [workshop, participant, responses]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(responses).length;

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">{error}</h2>
          <p className="text-text-muted">Please contact the workshop facilitator for assistance.</p>
        </div>
      </div>
    );
  }

  if (!workshop || !participant) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Welcome Screen */}
      {phase === 'welcome' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-accent">{workshop.assessment_type[0]}</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">{workshop.title}</h1>
            <p className="text-text-muted mb-6">{ASSESSMENT_CATALOG[workshop.assessment_type as keyof typeof ASSESSMENT_CATALOG]?.b2cName}</p>
            
            <div className="bg-bg-secondary rounded-none p-6 mb-6 text-left">
              <h3 className="font-semibold text-text-primary mb-4">What to expect:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary">
                    {questions.length} questions across {ASSESSMENT_CATALOG[workshop.assessment_type as keyof typeof ASSESSMENT_CATALOG]?.dimensions.length} dimensions
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary">
                    Estimated time: {workshop.duration_minutes} minutes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-text-secondary">Answers are auto-saved as you go</span>
                </li>
              </ul>
            </div>

            <Button onClick={() => setPhase('assessment')} className="w-full py-3">
              Start Assessment
            </Button>
          </div>
        </div>
      )}

      {/* Assessment Screen */}
      {phase === 'assessment' && (
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="sticky top-0 bg-bg-primary z-10 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-muted" />
                <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-text-primary'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-text-muted">
                {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="mt-6">
              {/* Dimension Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-sm font-medium text-accent">
                  {currentQuestion.dimension.name}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-xl font-semibold text-text-primary mb-8">
                {currentQuestion.question}
              </h2>

              {/* Scale Question */}
              {currentQuestion.type === 'scale' && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-text-muted mb-2">
                    <span>{currentQuestion.dimension.lowLabel}</span>
                    <span>{currentQuestion.dimension.highLabel}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <button
                        key={num}
                        onClick={() => handleAnswer(num)}
                        className={`aspect-square rounded-none flex items-center justify-center text-lg font-bold transition-all ${
                          responses[currentQuestion.id] === num
                            ? 'bg-accent text-white shadow-lg'
                            : 'bg-bg-secondary text-text-secondary hover:bg-accent/10'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-text-muted text-center">
                    Select a number (1 = {currentQuestion.dimension.lowLabel}, 7 = {currentQuestion.dimension.highLabel})
                  </p>
                </div>
              )}

              {/* Multiple Choice Question */}
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 rounded-none border text-left transition-all ${
                        responses[currentQuestion.id] === option
                          ? 'border-accent bg-accent/5'
                          : 'border-bg-tertiary hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          responses[currentQuestion.id] === option
                            ? 'border-accent bg-accent'
                            : 'border-text-muted'
                        }`}>
                          {responses[currentQuestion.id] === option && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={responses[currentQuestion.id] === option ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                          {option}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-bg-primary border-t border-bg-tertiary p-4">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="text-sm text-text-muted">
                {answeredCount}/{questions.length} answered
              </div>
              <Button 
                onClick={handleNext}
                disabled={!responses[currentQuestion?.id]}
                className="flex items-center gap-2"
              >
                {currentQuestionIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  'Submit Assessment'
                )}
              </Button>
            </div>
          </div>

          {/* Bottom padding for fixed nav */}
          <div className="h-20" />
        </div>
      )}

      {/* Completion Screen */}
      {phase === 'completion' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Thank You!</h1>
            <p className="text-text-muted mb-6">Your assessment has been submitted successfully.</p>

            <div className="bg-bg-secondary rounded-none p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Your Results</h3>
              {showSummary ? (
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    Your assessment has been processed. The workshop facilitator will share detailed results with you.
                  </p>
                  {workshop.allow_report_download && (
                    <Button variant="outline" className="w-full">
                      Download Report
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-bg-tertiary">
                    <span className="text-text-muted">Assessment</span>
                    <span className="text-green-600 font-medium">Completed</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-bg-tertiary">
                    <span className="text-text-muted">Questions Answered</span>
                    <span className="font-medium text-text-primary">{answeredCount}/{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-text-muted">Time Taken</span>
                    <span className="font-medium text-text-primary">{formatTime(workshop.duration_minutes * 60 - timeRemaining)}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSummary(!showSummary)}
              className="text-sm text-accent hover:underline"
            >
              {showSummary ? 'View Summary' : 'View Details'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkshopAssessment;