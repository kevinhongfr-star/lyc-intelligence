import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import {
  INK, OFF, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle,
} from '../landing/shared';
import type {
  AssessmentFlowConfig,
  AssessmentQuestion,
  AnswerMap,
  PersistedAssessmentState,
} from './types';

interface Props {
  config: AssessmentFlowConfig;
}

const STORAGE_KEY_PREFIX = 'assessment_flow_';

// ── HELPERS ────────────────────────────────────────────────────────

function loadState(slug: string): PersistedAssessmentState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAssessmentState;
  } catch {
    return null;
  }
}

function saveState(slug: string, state: PersistedAssessmentState) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${slug}`, JSON.stringify(state));
  } catch {
    // storage full or unavailable — non-blocking
  }
}

function clearState(slug: string) {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${slug}`);
  } catch {
    // non-blocking
  }
}

function isAnswered(q: AssessmentQuestion, answers: AnswerMap): boolean {
  const val = answers[q.id];
  if (val === undefined || val === null) return false;
  if (q.type === 'mcq_multi') return Array.isArray(val) && val.length > 0;
  return typeof val === 'number';
}

// ── #1323: SKIP LOGIC & BRANCHING HELPERS ──────────────────────────

/** Check if a question should be skipped given current answers. */
function shouldSkip(q: AssessmentQuestion, answers: AnswerMap): boolean {
  return q.skipIf ? q.skipIf(answers) : false;
}

/**
 * Get the effective next index considering branch + skip.
 * Returns questions.length to signal "go to review".
 */
function getNextIndex(
  questions: AssessmentQuestion[],
  currentIndex: number,
  answers: AnswerMap,
): number {
  const currentQ = questions[currentIndex];

  // Check branch first — explicit routing overrides linear progression.
  if (currentQ?.branch) {
    const targetId = currentQ.branch(answers);
    if (targetId) {
      const targetIdx = questions.findIndex((q) => q.id === targetId);
      if (targetIdx >= 0 && !shouldSkip(questions[targetIdx], answers)) {
        return targetIdx;
      }
    }
  }

  // Default: find the next non-skipped question.
  for (let i = currentIndex + 1; i < questions.length; i++) {
    if (!shouldSkip(questions[i], answers)) {
      return i;
    }
  }

  // No more non-skipped questions — signal review phase.
  return questions.length;
}

/** Get the effective previous index (skip over skipped questions). */
function getPrevIndex(
  questions: AssessmentQuestion[],
  currentIndex: number,
  answers: AnswerMap,
): number {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!shouldSkip(questions[i], answers)) {
      return i;
    }
  }
  return 0;
}

/** Get the list of active (non-skipped) questions for the current answers. */
function getActiveQuestions(
  questions: AssessmentQuestion[],
  answers: AnswerMap,
): AssessmentQuestion[] {
  return questions.filter((q) => !shouldSkip(q, answers));
}

// ── LIKERT QUESTION ────────────────────────────────────────────────
function LikertQuestion({
  question,
  value,
  onSelect,
  accent,
}: {
  question: AssessmentQuestion;
  value: number | undefined;
  onSelect: (score: number) => void;
  accent: string;
}) {
  const scale = [1, 2, 3, 4, 5];
  const labels = question.scaleLabels || ['Low', 'High'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
        <span style={{ ...monoStyle, color: G600, fontSize: 10 }}>{labels[0]}</span>
        <span style={{ ...monoStyle, color: accent, fontSize: 10 }}>{labels[1]}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {scale.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              onClick={() => onSelect(n)}
              style={{
                flex: 1,
                minHeight: 56,
                background: selected ? accent : WHITE,
                border: `1px solid ${selected ? accent : G200}`,
                cursor: 'pointer',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 18,
                fontWeight: 600,
                color: selected ? WHITE : INK,
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.background = G100;
                }
              }}
              onMouseLeave={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = G200;
                  e.currentTarget.style.background = WHITE;
                }
              }}
            >
              <span>{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MCQ SINGLE ─────────────────────────────────────────────────────
function McqSingleQuestion({
  question,
  value,
  onSelect,
  accent,
}: {
  question: AssessmentQuestion;
  value: number | undefined;
  onSelect: (score: number, index: number) => void;
  accent: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {question.options?.map((opt, i) => {
        const selected = value === opt.score;
        return (
          <button
            key={i}
            onClick={() => onSelect(opt.score, i)}
            style={{
              width: '100%',
              padding: '20px 24px',
              background: selected ? accent : WHITE,
              border: `1px solid ${selected ? accent : G200}`,
              cursor: 'pointer',
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 500,
              color: selected ? WHITE : INK,
              textAlign: 'left',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.background = G100;
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = G200;
                e.currentTarget.style.background = WHITE;
              }
            }}
          >
            <span style={{
              width: 28, height: 28, flexShrink: 0,
              border: `1px solid ${selected ? WHITE : G300}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: 11, fontWeight: 500,
              color: selected ? WHITE : G600,
            }}>
              {String.fromCharCode(65 + i)}
            </span>
            <span style={{ flex: 1 }}>{opt.label}</span>
            {selected && <Check style={{ width: 18, height: 18, color: WHITE }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── MCQ MULTI ──────────────────────────────────────────────────────
function McqMultiQuestion({
  question,
  value,
  onToggle,
  accent,
}: {
  question: AssessmentQuestion;
  value: number[] | undefined;
  onToggle: (score: number) => void;
  accent: string;
}) {
  const selected = value || [];
  const maxSel = question.maxSelections || 2;

  return (
    <div>
      <div style={{ ...monoStyle, color: G600, fontSize: 10, marginBottom: 16 }}>
        Select up to {maxSel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {question.options?.map((opt, i) => {
          const isSelected = selected.includes(opt.score);
          const atMax = selected.length >= maxSel && !isSelected;
          return (
            <button
              key={i}
              onClick={() => !atMax && onToggle(opt.score)}
              disabled={atMax}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: isSelected ? accent : WHITE,
                border: `1px solid ${isSelected ? accent : G200}`,
                cursor: atMax ? 'not-allowed' : 'pointer',
                opacity: atMax ? 0.4 : 1,
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontSize: 15,
                fontWeight: 500,
                color: isSelected ? WHITE : INK,
                textAlign: 'left',
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !atMax) {
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.background = G100;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !atMax) {
                  e.currentTarget.style.borderColor = G200;
                  e.currentTarget.style.background = WHITE;
                }
              }}
            >
              <span style={{
                width: 28, height: 28, flexShrink: 0,
                border: `1px solid ${isSelected ? WHITE : G300}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isSelected ? WHITE : 'transparent',
              }}>
                <Check style={{ width: 16, height: 16 }} />
              </span>
              <span style={{ flex: 1 }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── REVIEW SCREEN ──────────────────────────────────────────────────
function ReviewScreen({
  config,
  answers,
  onEdit,
  accent,
  activeQuestions,
}: {
  config: AssessmentFlowConfig;
  answers: AnswerMap;
  onEdit: (index: number) => void;
  accent: string;
  // #1323: active (non-skipped) questions — defaults to config.questions.
  activeQuestions?: AssessmentQuestion[];
}) {
  const questions = activeQuestions ?? config.questions;
  const answered = questions.filter((q) => isAnswered(q, answers)).length;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ ...monoStyle, color: accent, marginBottom: 16 }}>Review</div>
        <h1 style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 12,
        }}>
          Ready to submit?
        </h1>
        <p style={{ fontSize: 16, color: G600, lineHeight: 1.6 }}>
          {answered} of {questions.length} questions answered. Review your responses below before submitting.
        </p>
      </div>
      <div style={{ border: `1px solid ${G200}`, background: WHITE }}>
        {questions.map((q, i) => {
          const val = answers[q.id];
          let display = '—';
          if (q.type === 'likert' && typeof val === 'number') {
            display = `${val} / 5`;
          } else if (q.type === 'mcq_single' && typeof val === 'number') {
            const opt = q.options?.find((o) => o.score === val);
            display = opt?.label || '—';
          } else if (q.type === 'mcq_multi' && Array.isArray(val)) {
            display = val.length + ' selected';
          }
          return (
            <button
              key={q.id}
              onClick={() => onEdit(i)}
              style={{
                width: '100%', padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'none', border: 'none',
                borderBottom: i < questions.length - 1 ? `1px solid ${G200}` : 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <div style={{ flex: 1, paddingRight: 24 }}>
                <div style={{ ...monoStyle, color: G400, fontSize: 9, marginBottom: 4 }}>
                  Q{i + 1}
                </div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 500, marginBottom: 4 }}>
                  {q.text}
                </div>
                <div style={{ fontSize: 13, color: G600 }}>
                  {display}
                </div>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: G400, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── SUBMITTING SCREEN ──────────────────────────────────────────────
function SubmittingScreen({ accent }: { accent: string }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Loader2 style={{
        width: 48, height: 48, color: accent,
        animation: 'spin 1s linear infinite',
      }} />
      <h2 style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        fontSize: 24, fontWeight: 700, color: INK, marginTop: 32, marginBottom: 8,
      }}>
        Analyzing your responses…
      </h2>
      <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, textAlign: 'center', maxWidth: 400 }}>
        Our AI is scoring your answers across all five dimensions and preparing your personalized report.
      </p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export function AssessmentFlow({ config }: Props) {
  const navigate = useNavigate();
  const { code, accent, prefix, questions, resultsPath, landingPath } = config;

  // State
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  // #1323: 'intro' phase shows the entry expectation screen before questions.
  const [phase, setPhase] = useState<'intro' | 'questions' | 'review' | 'submitting'>(
    config.intro ? 'intro' : 'questions',
  );
  const [hydrated, setHydrated] = useState(false);

  // Storage key
  const storageKey = `${STORAGE_KEY_PREFIX}${code.toLowerCase()}`;

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadState(code.toLowerCase());
    if (saved && saved.status === 'in_progress') {
      setAnswers(saved.answers);
      setCurrentIndex(Math.min(saved.currentIndex, questions.length - 1));
      // #1323: skip intro when resuming a saved session.
      setPhase('questions');
    }
    setHydrated(true);
  }, [code, questions.length]);

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    const state: PersistedAssessmentState = {
      answers,
      currentIndex,
      startedAt: Date.now(),
      status: 'in_progress',
    };
    saveState(code.toLowerCase(), state);
  }, [answers, currentIndex, hydrated, code]);

  // Current question
  const currentQ = questions[currentIndex];
  // #1323: active questions = non-skipped questions for current answers.
  const activeQuestions = getActiveQuestions(questions, answers);
  const answeredCount = activeQuestions.filter((q) => isAnswered(q, answers)).length;
  // isLast: no more non-skipped questions after current (or branch leads to review).
  const nextIdx = phase === 'questions' ? getNextIndex(questions, currentIndex, answers) : -1;
  const isLast = nextIdx >= questions.length;
  const progress = ((phase === 'review' ? activeQuestions.length : answeredCount) / Math.max(1, activeQuestions.length)) * 100;

  // Answer handlers
  const handleLikert = useCallback((score: number) => {
    const newAnswers = { ...answers, [currentQ.id]: score };
    setAnswers(newAnswers);
    // #1323: auto-advance using skip/branch logic.
    setTimeout(() => {
      const nextIndex = getNextIndex(questions, currentIndex, newAnswers);
      if (nextIndex >= questions.length) {
        setPhase('review');
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 250);
  }, [currentQ, currentIndex, questions.length, answers]);

  const handleMcqSingle = useCallback((score: number) => {
    const newAnswers = { ...answers, [currentQ.id]: score };
    setAnswers(newAnswers);
    // #1323: auto-advance using skip/branch logic.
    setTimeout(() => {
      const nextIndex = getNextIndex(questions, currentIndex, newAnswers);
      if (nextIndex >= questions.length) {
        setPhase('review');
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 250);
  }, [currentQ, currentIndex, questions.length, answers]);

  const handleMcqMulti = useCallback((score: number) => {
    setAnswers((prev) => {
      const current = (prev[currentQ.id] as number[]) || [];
      const maxSel = currentQ.maxSelections || 2;
      if (current.includes(score)) {
        return { ...prev, [currentQ.id]: current.filter((s) => s !== score) };
      }
      if (current.length >= maxSel) return prev;
      return { ...prev, [currentQ.id]: [...current, score] };
    });
  }, [currentQ]);

  // Navigation
  const goNext = useCallback(() => {
    // #1323: use skip/branch-aware next index.
    const nextIndex = getNextIndex(questions, currentIndex, answers);
    if (nextIndex >= questions.length) {
      setPhase('review');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, questions.length, answers]);

  const goBack = useCallback(() => {
    // #1323: skip over skipped questions when going back.
    if (currentIndex > 0) {
      setCurrentIndex(getPrevIndex(questions, currentIndex, answers));
    }
  }, [currentIndex, questions.length, answers]);

  // Keyboard support
  useEffect(() => {
    if (phase !== 'questions') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        goBack();
      } else if (e.key === 'ArrowRight' && isAnswered(currentQ, answers)) {
        goNext();
      } else if (currentQ.type === 'likert') {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 5) handleLikert(n);
      } else if (currentQ.type === 'mcq_single' && currentQ.options) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= currentQ.options.length) {
          handleMcqSingle(currentQ.options[n - 1].score);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, currentIndex, currentQ, answers, goBack, goNext, handleLikert, handleMcqSingle]);

  // Submit
  const handleSubmit = useCallback(async () => {
    setPhase('submitting');
    const state: PersistedAssessmentState = {
      answers, currentIndex, startedAt: Date.now(), status: 'submitting',
    };
    saveState(code.toLowerCase(), state);

    let resultId: string | null = null;

    if (config.onSubmit) {
      // Real backend submission
      try {
        const result = await config.onSubmit(answers);
        resultId = result.resultId;
      } catch (e) {
        console.error('[AssessmentFlow] Submission failed:', e);
        // Fall through to navigation with null ID — results page handles mock fallback
      }
    } else {
      // Simulated processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    clearState(code.toLowerCase());

    // Redirect to results page (with ID if available)
    navigate(resultId ? `${resultsPath}/${resultId}` : resultsPath);
  }, [answers, currentIndex, code, resultsPath, navigate, config]);

  // ── RENDER ───────────────────────────────────────────────────────
  if (phase === 'submitting') {
    return (
      <div style={{ background: OFF, minHeight: '100vh', padding: '80px 32px' }}>
        <SubmittingScreen accent={accent} />
      </div>
    );
  }

  return (
    <div style={{
      background: OFF, minHeight: '100vh', color: INK,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(245,245,243,0.96)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${G200}`,
      }}>
        <div style={{ ...containerStyle, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to={landingPath} style={{
            fontFamily: "'Crimson Pro', Georgia, serif",
            fontSize: 16, fontWeight: 700, color: INK, textDecoration: 'none',
            display: 'flex', alignItems: 'baseline', gap: 6,
          }}>
            {config.name} <span style={{
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: 9, fontWeight: 400, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: G400,
            }}>by LYC</span>
          </Link>
          <Link to={landingPath} style={{
            fontSize: 13, color: G600, textDecoration: 'none',
            transition: 'color 120ms ease',
          }}
            onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
            onMouseLeave={(e) => (e.currentTarget.style.color = G600)}>
            Exit
          </Link>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: G200, position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progress}%`, background: accent,
            transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        {/* #1323: Intro / entry expectation screen */}
        {phase === 'intro' && config.intro && (
          <div style={{ maxWidth: 680, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ ...monoStyle, color: accent, fontSize: 10, marginBottom: 16 }}>
                {config.code} Assessment
              </div>
              <h1 style={{
                fontFamily: "'Crimson Pro', Georgia, serif",
                fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 16,
              }}>
                {config.intro.title}
              </h1>
              <p style={{ fontSize: 16, color: G600, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
                {config.intro.body}
              </p>
            </div>
            {config.intro.expectations && config.intro.expectations.length > 0 && (
              <div style={{ border: `1px solid ${G200}`, background: WHITE, marginBottom: 40 }}>
                {config.intro.expectations.map((exp, i) => (
                  <div key={i} style={{
                    padding: '20px 24px',
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    borderBottom: i < config.intro!.expectations!.length - 1 ? `1px solid ${G200}` : 'none',
                  }}>
                    <span style={{
                      width: 28, height: 28, flexShrink: 0,
                      border: `1px solid ${accent}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                      fontSize: 11, fontWeight: 500, color: accent,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 15, color: INK, lineHeight: 1.5, flex: 1 }}>
                      {exp}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              {config.intro.duration && (
                <span style={{ ...monoStyle, color: G400, fontSize: 10 }}>
                  {config.intro.duration}
                </span>
              )}
              <button
                onClick={() => setPhase('questions')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', background: accent, border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 15, fontWeight: 600, color: WHITE,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.transition = 'transform 120ms cubic-bezier(0.4,0,0.2,1)';
                }}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Begin assessment <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        )}

        {phase === 'questions' && currentQ && (
          <div style={{ maxWidth: 680, width: '100%' }}>
            {/* Progress label */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 48,
            }}>
              <span style={{ ...monoStyle, color: G400, fontSize: 10 }}>
                Question {currentIndex + 1} of {questions.length}
              </span>
              {/* #1323: show active count when skip logic reduces questions */}
              <span style={{ ...monoStyle, color: accent, fontSize: 10 }}>
                {answeredCount} answered
              </span>
            </div>

            {/* Question text */}
            <h1 style={{
              fontFamily: "'Crimson Pro', Georgia, serif",
              fontSize: 28, fontWeight: 700, color: INK,
              lineHeight: 1.3, marginBottom: 8,
            }}>
              {currentQ.text}
            </h1>
            {currentQ.hint && (
              <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, marginBottom: 40 }}>
                {currentQ.hint}
              </p>
            )}
            {!currentQ.hint && <div style={{ height: 32 }} />}

            {/* Answer area */}
            {currentQ.type === 'likert' && (
              <LikertQuestion
                question={currentQ}
                value={answers[currentQ.id] as number | undefined}
                onSelect={handleLikert}
                accent={accent}
              />
            )}
            {currentQ.type === 'mcq_single' && (
              <McqSingleQuestion
                question={currentQ}
                value={answers[currentQ.id] as number | undefined}
                onSelect={handleMcqSingle}
                accent={accent}
              />
            )}
            {currentQ.type === 'mcq_multi' && (
              <McqMultiQuestion
                question={currentQ}
                value={answers[currentQ.id] as number[] | undefined}
                onToggle={handleMcqMulti}
                accent={accent}
              />
            )}

            {/* Navigation */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 48,
            }}>
              <button
                onClick={goBack}
                disabled={currentIndex === 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', background: 'none',
                  border: 'none', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14, fontWeight: 500, color: currentIndex === 0 ? G300 : INK,
                  opacity: currentIndex === 0 ? 0.5 : 1,
                  transition: 'opacity 120ms ease',
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>

              {/* For mcq_multi and non-auto-advancing, show Next button */}
              {currentQ.type === 'mcq_multi' && (
                <button
                  onClick={goNext}
                  disabled={!isAnswered(currentQ, answers)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px',
                    background: isAnswered(currentQ, answers) ? accent : G200,
                    border: 'none', cursor: isAnswered(currentQ, answers) ? 'pointer' : 'not-allowed',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 14, fontWeight: 500,
                    color: isAnswered(currentQ, answers) ? WHITE : G400,
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {isLast ? 'Review' : 'Next'} <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              )}

              {/* For likert/mcq_single: show "skip to review" on last question */}
              {currentQ.type !== 'mcq_multi' && isLast && isAnswered(currentQ, answers) && (
                <button
                  onClick={() => setPhase('review')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', background: accent, border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: 14, fontWeight: 500, color: WHITE,
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  Review <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div style={{ maxWidth: 680, width: '100%' }}>
            <ReviewScreen
              config={config}
              answers={answers}
              onEdit={(i) => {
                // #1323: map active-question index back to full questions array.
                const qId = activeQuestions[i]?.id;
                const origIdx = questions.findIndex((q) => q.id === qId);
                if (origIdx >= 0) {
                  setCurrentIndex(origIdx);
                  setPhase('questions');
                }
              }}
              accent={accent}
              activeQuestions={activeQuestions}
            />
            {/* Submit bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 48,
            }}>
              <button
                onClick={() => {
                  // #1323: go back to last active (non-skipped) question.
                  const lastActive = activeQuestions[activeQuestions.length - 1];
                  const lastIdx = questions.findIndex((q) => q.id === lastActive?.id);
                  if (lastIdx >= 0) {
                    setCurrentIndex(lastIdx);
                    setPhase('questions');
                  }
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', background: 'none', border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 14, fontWeight: 500, color: INK,
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 32px', background: accent, border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 15, fontWeight: 600, color: WHITE,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.transition = 'transform 120ms cubic-bezier(0.4,0,0.2,1)';
                }}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Submit assessment <Check style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
