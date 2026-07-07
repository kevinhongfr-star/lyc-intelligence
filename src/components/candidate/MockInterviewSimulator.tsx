import React, { useState } from 'react';
import { Play, SkipForward, CheckCircle2, MessageSquare, RotateCcw } from 'lucide-react';
import { InterviewTimer } from '@/components/candidate/InterviewTimer';
import { InterviewFeedback } from '@/components/candidate/InterviewFeedback';

type Phase = 'idle' | 'answering' | 'feedback' | 'complete';

interface AnswerRecord {
  question: string;
  response: string;
  score: number;
  feedback: string;
}

const QUESTIONS: string[] = [
  'Tell me about a time you led a major technical migration. What was your approach to risk management?',
  'How do you balance technical debt with feature delivery in a high-growth environment?',
  'Describe your approach to building and scaling engineering teams across multiple regions.',
  'How do you make architecture decisions when requirements are ambiguous?',
  'Tell me about a conflict with a product or business stakeholder. How did you resolve it?',
  'What is your philosophy on engineering hiring and team composition?',
  'How do you measure engineering team performance and health?',
  'Walk me through a technical decision you regret. What would you do differently?',
];

const QUESTION_SECONDS = 300;
const TOTAL_QUESTIONS = QUESTIONS.length;

function generateScore(): number {
  // Random 6.0 – 9.2, 1 decimal
  const raw = 6 + Math.random() * 3.2;
  return Math.round(raw * 10) / 10;
}

function feedbackForScore(score: number): string {
  if (score >= 8.5) return 'Excellent — crisp structure with strong, quantified impact.';
  if (score >= 7.5) return 'Strong structure; consider quantifying impact more concretely.';
  if (score >= 6.8) return 'Good answer; tighten the narrative arc for sharper delivery.';
  return 'Solid foundations; add a concrete example to ground the claim.';
}

export function MockInterviewSimulator() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerRecord | null>(null);

  const startInterview = () => {
    setPhase('answering');
    setCurrentQuestionIndex(0);
    setUserResponse('');
    setAnswers([]);
    setCurrentAnswer(null);
  };

  const submitAnswer = () => {
    if (userResponse.trim().length === 0) return;
    const question = QUESTIONS[currentQuestionIndex];
    const score = generateScore();
    const feedback = feedbackForScore(score);
    const record: AnswerRecord = { question, response: userResponse, score, feedback };
    setAnswers((prev) => [...prev, record]);
    setCurrentAnswer(record);
    setPhase('feedback');
  };

  const skipQuestion = () => {
    // Skipped questions are not scored — not added to answers.
    setCurrentAnswer(null);
    advance();
  };

  const handleExpire = () => {
    // Time ran out — submit if there is a response, otherwise skip.
    if (userResponse.trim().length > 0) {
      submitAnswer();
    } else {
      skipQuestion();
    }
  };

  const advance = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= TOTAL_QUESTIONS) {
      setPhase('complete');
    } else {
      setCurrentQuestionIndex(nextIndex);
      setUserResponse('');
      setCurrentAnswer(null);
      setPhase('answering');
    }
  };

  const restart = () => {
    setPhase('idle');
    setCurrentQuestionIndex(0);
    setUserResponse('');
    setAnswers([]);
    setCurrentAnswer(null);
  };

  const overallScore = (): number => {
    if (answers.length === 0) return 0;
    const sum = answers.reduce((acc, a) => acc + a.score, 0);
    return Math.round((sum / answers.length) * 10) / 10;
  };

  const completedPercent = Math.min(100, (currentQuestionIndex / TOTAL_QUESTIONS) * 100);

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-accent" />
          <h3 className="font-serif text-lg font-bold text-text-primary">MOCK INTERVIEW SIMULATOR</h3>
        </div>
        {phase !== 'idle' && phase !== 'complete' && (
          <span className="text-xs text-text-muted whitespace-nowrap">
            Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {phase !== 'idle' && (
        <div className="mb-5">
          <div className="h-1 w-full bg-bg-tertiary">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* IDLE */}
      {phase === 'idle' && (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="text-sm text-text-secondary max-w-xl">
            Run a guided mock interview for the <span className="font-medium text-text-primary">VP Engineering</span>{' '}
            role. You will move through {TOTAL_QUESTIONS} behavioral questions, each with a 5:00 response window.
            Receive an AI score and feedback after every answer.
          </p>
          <button
            type="button"
            onClick={startInterview}
            className="inline-flex items-center gap-2 bg-accent text-white px-5 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Interview
          </button>
        </div>
      )}

      {/* ANSWERING */}
      {phase === 'answering' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 bg-bg-secondary border border-bg-tertiary p-3">
            <div className="w-9 h-9 bg-accent-10 flex items-center justify-center">
              <span className="text-xs font-bold text-accent">DEX</span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">DEX Interviewer</p>
              <p className="text-xs text-text-muted">AI mock panelist</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
              Question {currentQuestionIndex + 1}
            </p>
            <p className="font-serif text-base font-bold text-text-primary leading-relaxed">
              {QUESTIONS[currentQuestionIndex]}
            </p>
          </div>

          <InterviewTimer
            key={currentQuestionIndex}
            totalSeconds={QUESTION_SECONDS}
            running={phase === 'answering'}
            onExpire={handleExpire}
          />

          <div>
            <label className="block text-xs uppercase tracking-wider text-text-muted mb-2">
              Your response
            </label>
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              rows={6}
              placeholder="Structure your answer — situation, action, outcome..."
              className="w-full bg-bg-primary border border-bg-tertiary p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submitAnswer}
              disabled={userResponse.trim().length === 0}
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Submit Answer
            </button>
            <button
              type="button"
              onClick={skipQuestion}
              className="inline-flex items-center gap-2 bg-bg-secondary border border-bg-tertiary text-text-secondary px-4 py-2 text-sm font-medium hover:bg-bg-hover transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK */}
      {phase === 'feedback' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
              Question {currentQuestionIndex + 1}
            </p>
            <p className="font-serif text-base font-bold text-text-primary leading-relaxed">
              {QUESTIONS[currentQuestionIndex]}
            </p>
          </div>

          {currentAnswer ? (
            <div className="bg-bg-secondary border border-bg-tertiary p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs uppercase tracking-wider text-text-muted">AI Score</span>
                <span className="font-serif text-3xl font-bold text-accent">
                  {currentAnswer.score.toFixed(1)}
                </span>
              </div>
              <div className="h-px bg-bg-tertiary" />
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Feedback</p>
                <p className="text-sm text-text-primary">{currentAnswer.feedback}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Your response</p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{currentAnswer.response}</p>
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-bg-tertiary p-4">
              <p className="text-sm text-text-muted">Question skipped — no score recorded.</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={advance}
              className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              {currentQuestionIndex + 1 >= TOTAL_QUESTIONS ? 'Finish Interview' : 'Next Question'}
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {phase === 'complete' && (
        <div className="space-y-6">
          <div className="bg-bg-secondary border border-bg-tertiary p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Overall interview score</p>
                <p className="font-serif text-4xl font-bold text-accent">
                  {overallScore().toFixed(1)}
                  <span className="text-lg text-text-muted"> / 10</span>
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wider text-text-muted mb-1">Answered</p>
                <p className="text-sm text-text-primary">
                  {answers.length} of {TOTAL_QUESTIONS} scored
                  {TOTAL_QUESTIONS - answers.length > 0 && (
                    <span className="text-text-muted"> · {TOTAL_QUESTIONS - answers.length} skipped</span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-px bg-bg-tertiary my-4" />

            {answers.length === 0 ? (
              <p className="text-sm text-warning">
                No answers were scored — all questions skipped. Try again and submit at least one response.
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                {overallScore() >= 8
                  ? 'Strong session — your answers projected executive-level clarity and grip on the role.'
                  : overallScore() >= 7
                    ? 'Solid session — tighten quantification and narrative arc to push into the top band.'
                    : 'Workable session — re-anchor each answer in a concrete example with measurable outcome.'}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 bg-bg-secondary border border-bg-tertiary text-text-primary px-4 py-2 text-sm font-medium hover:bg-bg-hover transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>

          <InterviewFeedback />
        </div>
      )}
    </div>
  );
}
