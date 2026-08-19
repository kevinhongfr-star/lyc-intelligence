/**
 * LensTakeFlowPage — V3.5 VISUAL REWORK (V1 foundation)
 *
 * The lens-taking flow. Fills the gap between the lenses library (browsing)
 * and the readout (results). 3-column app shell (NOT full-screen takeover).
 *
 *   LEFT  (220)  — same nav as chat/lenses library, "Lenses" active
 *   MAIN        — phase-aware content:
 *                  Phase A: lens intro screen (eyebrow / display title /
 *                            what-you'll-get / time / cost / Start CTA)
 *                  Phase B: question wizard (5 question types, progress bar,
 *                            auto-advance on single-select, submit on others)
 *                  Phase C: completion → readout transition ("Your readout
 *                            is ready." + View readout CTA)
 *   RIGHT (280) — phase-aware context:
 *                  Phase A: lens info card (name / description / measures /
 *                            time / cost / privacy note)
 *                  Phase B: question position / time remaining / privacy /
 *                            "We'll save your progress" note
 *                  Phase C: same as Phase B (frozen)
 *
 * 5 question types — all V1 line-art styled, mapped 1:1 to engine's
 * CanonicalQuestionType:
 *   single_select → spec #1 (vertical chips, auto-advance)
 *   multi_select  → spec #2 (square checkboxes, submit button)
 *   scale         → spec #3 (numbered cells 1-5/1-7, teal fill, end labels)
 *   text          → spec #4 (textarea, char count, submit button)
 *   scenario      → spec #5 (italic preamble + options below)
 *
 * Mid-flow states:
 *   - Auto-save: every answer is persisted via diagnosticApi.saveResponse
 *   - Exit confirmation: simple modal ("Your progress will be saved...")
 *   - Resume: diagnosticApi.resumeAnonAttempt rehydrates answers + index
 *
 * Naming rules (enforced):
 *  - "Lenses" not "Assessments" / "Diagnostics" (user-facing copy)
 *  - "NEXUS" always by name — never "the AI" / "the coach"
 *  - "Readout" not "report" / "results"
 *  - No "Platform" / "Architecture" anywhere
 *  - Lens activation = coach-recommended opt-in (entry here is deliberate)
 *  - Miles are a UI unit, never marketed
 *
 * CRITICAL: This is 100% presentation layer. Engine, question content,
 * scoring logic, mile deductions — all untouched. We use the existing
 * diagnosticApi: getDiagnostic / createAttempt / saveResponse /
 * completeAttempt / resumeAnonAttempt. Scoring produces { resultId, result }
 * which we navigate to /nexus/lenses/:code/readout/:resultId.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { V1 } from '@/styles/v1-tokens';
import { useAuthStore } from '@/stores/authStore';
import {
  createAttempt,
  saveResponse,
  completeAttempt,
  resumeAnonAttempt,
} from '@/services/diagnosticApi';
import { getDiagnostic } from '@/data/diagnostics';
import type {
  DiagnosticDefinition,
  DiagnosticQuestion,
  DiagnosticMeta,
} from '@/types/assessment';
import type { AnswerMap } from '@/services/diagnosticScoring';

/* ── Canon lens metadata (for intro screen time + cost display) ──
 * DiagnosticMeta doesn't carry mile_cost or time_estimate; we cross-reference
 * by slug to the canon LENSES table used in LensesLibraryPage. All 11 listed.
 */
interface LensCanon {
  code: string;
  name: string;
  descriptor: string;
  miles: number;
  tier: 'Light' | 'Standard' | 'Signature' | 'Flagship';
  timeRange: string; // "12-15 minutes"
  whatYouGet: string[]; // 2-3 bullets for intro screen
  measures: string; // for right rail info card
}

const LENS_CANON: Record<string, LensCanon> = {
  cpi: {
    code: 'CPI', name: 'CPI', descriptor: 'China Leadership Pipeline Index',
    miles: 5, tier: 'Flagship', timeRange: '40-50 minutes',
    whatYouGet: ['Six-dimension leadership pipeline readout', 'Archetype match across six profiles', 'Organizational readiness signal'],
    measures: 'Succession depth, pipeline velocity, and leadership readiness across the China context.',
  },
  leap: {
    code: 'LEAP', name: 'LEAP', descriptor: 'competitive positioning',
    miles: 1, tier: 'Light', timeRange: '8-10 minutes',
    whatYouGet: ['Seventeen positioning archetypes', 'Where you sit vs. the field', 'One next move'],
    measures: 'How you stand relative to peers and competitors in your market.',
  },
  coach: {
    code: 'COACH', name: 'COACH', descriptor: 'executive coaching fit',
    miles: 2, tier: 'Standard', timeRange: '12-15 minutes',
    whatYouGet: ['Coaching style match across eight profiles', 'Readiness signal', 'Friction points to surface early'],
    measures: 'Fit between your working style and a coaching engagement.',
  },
  bridge: {
    code: 'BRIDGE', name: 'BRIDGE', descriptor: 'cross-cultural relational intelligence',
    miles: 3, tier: 'Signature', timeRange: '20-25 minutes',
    whatYouGet: ['Six-dimension relational readout', 'Cross-cultural archetype', 'Where trust builds or breaks'],
    measures: 'Relational intelligence across cultures and contexts.',
  },
  mosaic: {
    code: 'MOSAIC', name: 'MOSAIC', descriptor: 'institutional trust & relationship velocity',
    miles: 3, tier: 'Signature', timeRange: '20-25 minutes',
    whatYouGet: ['Trust velocity readout', 'Institutional access signal', 'Six archetypes'],
    measures: 'How trust and access accumulate across institutions.',
  },
  drive: {
    code: 'DRIVE', name: 'DRIVE', descriptor: 'motivational alignment',
    miles: 2, tier: 'Standard', timeRange: '12-15 minutes',
    whatYouGet: ['Ten motivational profiles', 'Alignment to role and team', 'Where energy leaks'],
    measures: 'Alignment between what drives you and what the role demands.',
  },
  prism: {
    code: 'PRISM', name: 'PRISM', descriptor: 'professional branding',
    miles: 2, tier: 'Standard', timeRange: '12-15 minutes',
    whatYouGet: ['Five-dimension brand readout', 'Ten archetype matches', 'Where you are seen vs. how you intend to be seen'],
    measures: 'How you are perceived professionally versus how you intend to be.',
  },
  impact: {
    code: 'IMPACT', name: 'IMPACT', descriptor: 'board & stakeholder impact',
    miles: 2, tier: 'Standard', timeRange: '15-20 minutes',
    whatYouGet: ['Five-dimension impact readout', 'Eight archetype matches', 'Stakeholder influence signal'],
    measures: 'Impact across board, investors, and key stakeholders.',
  },
  quest: {
    code: 'QUEST', name: 'QUEST', descriptor: 'strategic market positioning',
    miles: 2, tier: 'Standard', timeRange: '15-20 minutes',
    whatYouGet: ['Six-dimension positioning readout', 'Ten archetype matches', 'Where the market places you'],
    measures: 'Strategic positioning relative to market opportunity.',
  },
  spark: {
    code: 'SPARK', name: 'SPARK', descriptor: 'AI leadership readiness',
    miles: 3, tier: 'Signature', timeRange: '20-25 minutes',
    whatYouGet: ['Three-dimension readiness readout', 'Four archetype matches', 'Adoption and governance signals'],
    measures: 'Readiness to lead in an AI-augmented organization.',
  },
  forge: {
    code: 'FORGE', name: 'FORGE', descriptor: 'sales excellence capability',
    miles: 3, tier: 'Signature', timeRange: '20-25 minutes',
    whatYouGet: ['Four-dimension sales capability readout', 'Four archetype matches', 'Pipeline and conversion signal'],
    measures: 'Sales excellence across capability, process, and people.',
  },
};

/* ── Phases ── */
type Phase = 'intro' | 'questions' | 'analyzing' | 'complete' | 'notfound' | 'error';

/* ── Question renderers (V1 line-art) ── */

interface QuestionProps {
  question: DiagnosticQuestion;
  currentAnswer?: string | string[] | number;
  onAnswer: (value: string | string[] | number) => void;
  disabled?: boolean;
}

/* Single-select — vertical chips, auto-advance on select */
function SingleSelectQuestion({ question, currentAnswer, onAnswer, disabled }: QuestionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {question.options?.map(opt => {
        const selected = currentAnswer === opt.value;
        return (
          <button
            key={opt.value}
            disabled={disabled}
            onClick={() => onAnswer(opt.value)}
            style={{
              display: 'block',
              textAlign: 'left',
              padding: '16px 20px',
              background: selected ? V1.teal50 : V1.surface,
              border: `1px solid ${selected ? V1.teal600 : V1.border}`,
              borderLeft: `3px solid ${selected ? V1.teal600 : 'transparent'}`,
              cursor: disabled ? 'default' : 'pointer',
              fontFamily: V1.bodyFont,
              fontSize: V1.textBody,
              color: V1.text,
              transition: 'border-color 120ms ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!disabled && !selected) e.currentTarget.style.borderColor = V1.teal400; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (!disabled && !selected) e.currentTarget.style.borderColor = V1.border; }}
          >
            <div style={{ fontWeight: V1.fwMedium }}>{opt.label}</div>
          </button>
        );
      })}
    </div>
  );
}

/* Multi-select — square checkboxes (teal check), submit button */
function MultiSelectQuestion({ question, currentAnswer, onAnswer, disabled }: QuestionProps) {
  const selected: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
  const maxSel = question.max_selections || question.options?.length || 99;

  const toggle = (val: string) => {
    if (disabled) return;
    if (selected.includes(val)) {
      onAnswer(selected.filter(v => v !== val));
    } else if (selected.length < maxSel) {
      onAnswer([...selected, val]);
    }
  };

  return (
    <div>
      <div className="v1-mono" style={{ color: V1.textDim, marginBottom: 12 }}>
        {question.max_selections ? `Select up to ${question.max_selections}` : 'Select all that apply'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options?.map(opt => {
          const checked = selected.includes(opt.value);
          const atMax = !checked && selected.length >= maxSel;
          return (
            <button
              key={opt.value}
              disabled={disabled || atMax}
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                textAlign: 'left',
                padding: '16px 20px',
                background: checked ? V1.teal50 : V1.surface,
                border: `1px solid ${checked ? V1.teal600 : V1.border}`,
                cursor: (disabled || atMax) ? 'not-allowed' : 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: V1.textBody,
                color: V1.text,
                opacity: atMax ? 0.5 : 1,
              }}
            >
              {/* Square checkbox — 0 radius, teal check */}
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  border: `1px solid ${checked ? V1.teal600 : V1.ink400}`,
                  background: checked ? V1.teal600 : V1.surface,
                  color: V1.surface,
                  flexShrink: 0,
                  marginTop: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                {checked && '✓'}
              </span>
              <span style={{ fontWeight: V1.fwMedium }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Scale / Likert — numbered cells, teal fill + white number, end labels */
function ScaleQuestion({ question, currentAnswer, onAnswer, disabled }: QuestionProps) {
  const min = question.scale_min ?? 1;
  const max = question.scale_max ?? 5;
  const cells: number[] = [];
  for (let n = min; n <= max; n++) cells.push(n);
  const lowLabel = question.scale_labels?.[String(min)] || 'Strongly disagree';
  const highLabel = question.scale_labels?.[String(max)] || 'Strongly agree';

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {cells.map(n => {
          const selected = currentAnswer === n;
          return (
            <button
              key={n}
              disabled={disabled}
              onClick={() => onAnswer(n)}
              style={{
                width: 56,
                height: 56,
                background: selected ? V1.teal600 : V1.surface,
                color: selected ? V1.surface : V1.text,
                border: `1px solid ${selected ? V1.teal600 : V1.border}`,
                fontFamily: V1.displayFont,
                fontSize: V1.textH2,
                cursor: disabled ? 'default' : 'pointer',
                fontWeight: V1.fwSemibold,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
        <span className="v1-mono" style={{ color: V1.textDim, fontSize: V1.textCaption }}>{lowLabel}</span>
        <span className="v1-mono" style={{ color: V1.textDim, fontSize: V1.textCaption }}>{highLabel}</span>
      </div>
    </div>
  );
}

/* Text input — full-width textarea, char count, submit button */
function TextQuestion({ question, currentAnswer, onAnswer, disabled }: QuestionProps) {
  const text = typeof currentAnswer === 'string' ? currentAnswer : '';
  const isOptional = !question.required;
  const max = 1000;

  return (
    <div>
      {isOptional && (
        <div className="v1-mono" style={{ color: V1.textDim, marginBottom: 8 }}>Optional</div>
      )}
      <textarea
        value={text}
        disabled={disabled}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onAnswer(e.target.value.slice(0, max))}
        placeholder="Type your response..."
        rows={5}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: `1px solid ${V1.border}`,
          background: V1.surface,
          color: V1.text,
          fontFamily: V1.bodyFont,
          fontSize: V1.textBody,
          lineHeight: V1.leadingBody,
          resize: 'vertical',
          outline: 'none',
        }}
        onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = V1.teal600; }}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = V1.border; }}
      />
      <div className="v1-mono" style={{ color: V1.textDim, fontSize: V1.textCaption, marginTop: 6, textAlign: 'right' }}>
        {text.length} / {max}
      </div>
    </div>
  );
}

/* Scenario — italic preamble (teal left border) + options below */
function ScenarioQuestion({ question, currentAnswer, onAnswer, disabled }: QuestionProps) {
  return (
    <div>
      {question.scenario && (
        <div style={{
          background: V1.surfaceAlt,
          borderLeft: `2px solid ${V1.teal600}`,
          padding: '16px 20px',
          marginBottom: 20,
        }}>
          <p style={{
            fontFamily: V1.displayFont,
            fontStyle: 'italic',
            fontSize: V1.textBodyLg,
            color: V1.text,
            lineHeight: V1.leadingBody,
            margin: 0,
          }}>
            {question.scenario}
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.options?.map(opt => {
          const selected = currentAnswer === opt.value;
          return (
            <button
              key={opt.value}
              disabled={disabled}
              onClick={() => onAnswer(opt.value)}
              style={{
                display: 'block',
                textAlign: 'left',
                padding: '16px 20px',
                background: selected ? V1.teal50 : V1.surface,
                border: `1px solid ${selected ? V1.teal600 : V1.border}`,
                borderLeft: `3px solid ${selected ? V1.teal600 : 'transparent'}`,
                cursor: disabled ? 'default' : 'pointer',
                fontFamily: V1.bodyFont,
                fontSize: V1.textBody,
                color: V1.text,
              }}
            >
              <div style={{ fontWeight: V1.fwMedium }}>{opt.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Question dispatcher ── */
function QuestionRenderer(props: QuestionProps) {
  switch (props.question.type) {
    case 'single_select': return <SingleSelectQuestion {...props} />;
    case 'multi_select':  return <MultiSelectQuestion  {...props} />;
    case 'scale':         return <ScaleQuestion        {...props} />;
    case 'text':          return <TextQuestion         {...props} />;
    case 'scenario':      return <ScenarioQuestion     {...props} />;
    default:
      return <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary }}>Unsupported question type.</p>;
  }
}

/* ── 2px thin progress bar (editorial) ── */
function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ height: 2, background: V1.dividerSubtle, position: 'relative', marginBottom: 32 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: V1.teal600,
        transition: 'width 240ms ease',
      }} />
    </div>
  );
}

/* ── Exit confirmation modal ── */
function ExitConfirmModal({ open, onStay, onExit }: { open: boolean; onStay: () => void; onExit: () => void }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(6, 41, 38, 0.4)', // teal-900 at 40% — no shadow, just dim
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-confirm-title"
    >
      <div
        style={{
          background: V1.surface,
          border: `1px solid ${V1.border}`,
          maxWidth: 440,
          width: 'calc(100% - 48px)',
          padding: 32,
        }}
      >
        <div className="v1-eyebrow" style={{ marginBottom: 8 }}>Step away?</div>
        <h3 id="exit-confirm-title" className="v1-display" style={{ fontSize: V1.textH2, margin: '0 0 12px' }}>
          Your progress will be saved.
        </h3>
        <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 24px' }}>
          Come back anytime — NEXUS keeps your place.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onStay} className="v1-btn v1-btn-primary" style={{ padding: '12px 20px' }}>Stay</button>
          <button onClick={onExit} className="v1-btn v1-btn-secondary" style={{ padding: '12px 20px' }}>Exit to library</button>
        </div>
      </div>
    </div>
  );
}

/* ── Page component ── */
export function LensTakeFlowPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const slug = (code || '').toLowerCase();
  const canon = LENS_CANON[slug];

  const [phase, setPhase] = useState<Phase>('intro');
  const [definition, setDefinition] = useState<DiagnosticDefinition | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── Load diagnostic definition ── */
  useEffect(() => {
    if (!slug) { setPhase('notfound'); return; }
    if (!canon) { setPhase('notfound'); return; }
    let cancelled = false;
    (async () => {
      try {
        const def = await getDiagnostic(slug);
        if (cancelled) return;
        if (!def) { setPhase('notfound'); return; }
        setDefinition(def);
        // Resume anonymous attempt if one exists for this slug
        const resumed = resumeAnonAttempt(slug);
        if (resumed && Object.keys(resumed.answers).length > 0) {
          setAnswers(resumed.answers);
          setCurrentIndex(resumed.currentIndex);
        }
      } catch (err) {
        console.error('LensTakeFlowPage: getDiagnostic failed', err);
        if (!cancelled) { setErrorMsg('Could not load the lens definition.'); setPhase('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, [slug, canon]);

  /* ── Start: create attempt, enter question phase ── */
  const handleStart = useCallback(async () => {
    if (!definition) return;
    try {
      const aid = await createAttempt(slug, user?.id ?? null);
      setAttemptId(aid);
      setPhase('questions');
    } catch (err) {
      console.error('LensTakeFlowPage: createAttempt failed', err);
      setErrorMsg('Could not start the lens.');
      setPhase('error');
    }
  }, [definition, slug, user?.id]);

  /* ── Auto-save after each answer (anonymous + authenticated) ── */
  const persistAnswer = useCallback(async (qid: string, value: string | string[] | number) => {
    if (!attemptId || !slug) return;
    try {
      await saveResponse(attemptId, qid, value, slug, user?.id ?? null);
    } catch (err) {
      console.error('LensTakeFlowPage: saveResponse failed', err);
      // Silently continue — autosave is best-effort, user can retry
    }
  }, [attemptId, slug, user?.id]);

  /* ── Answer handler: route by question type ── */
  // Auto-advance types: single_select, scale, scenario
  // Submit-required types: multi_select, text
  const isAutoAdvance = (q?: DiagnosticQuestion) =>
    q && (q.type === 'single_select' || q.type === 'scale' || q.type === 'scenario');

  const handleAnswer = useCallback((qid: string, value: string | string[] | number) => {
    setAnswers((prev: AnswerMap) => ({ ...prev, [qid]: value as any }));
    void persistAnswer(qid, value);
  }, [persistAnswer]);

  const handleAutoAdvance = useCallback((qid: string, value: string | string[] | number) => {
    handleAnswer(qid, value);
    // Brief delay so the user sees their selection register, then advance
    setTimeout(() => {
      setCurrentIndex((prev: number) => prev + 1);
    }, 220);
  }, [handleAnswer]);

  const handleSubmitAdvance = useCallback(() => {
    setCurrentIndex((prev: number) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setCurrentIndex((prev: number) => Math.max(0, prev - 1));
  }, []);

  /* ── Completion: score attempt, get resultId, transition to complete ── */
  const completeLens = useCallback(async () => {
    if (!definition || !attemptId) return;
    setSubmitting(true);
    setPhase('analyzing');
    try {
      // Brief analyzing state (0.5-1s) — engine may return faster; we hold
      // a minimum 600ms to feel substantive without a spinner.
      const [completed] = await Promise.all([
        completeAttempt(attemptId, slug, user?.id ?? null, answers),
        new Promise<void>(resolve => setTimeout(resolve, 600)),
      ]);
      if (!completed || !completed.resultId) {
        throw new Error('Engine did not return a resultId.');
      }
      setResultId(completed.resultId);
      setPhase('complete');
    } catch (err) {
      console.error('LensTakeFlowPage: completeAttempt failed', err);
      setErrorMsg('Could not score your answers. Your progress is saved — try again in a moment.');
      setPhase('error');
    } finally {
      setSubmitting(false);
    }
  }, [definition, attemptId, slug, user?.id, answers]);

  /* ── Exit (with confirmation if mid-flow) ── */
  const handleExitRequest = useCallback(() => {
    if (phase === 'questions' && Object.keys(answers).length > 0) {
      setShowExitModal(true);
    } else {
      navigate('/nexus/lenses');
    }
  }, [phase, answers, navigate]);

  /* ── Derived: current question, progress ── */
  const questions = definition?.questions ?? [];
  const totalQ = definition?.meta.total_questions ?? questions.length;
  const currentQuestion = questions[currentIndex];
  const progressPct = totalQ > 0 ? ((currentIndex + 1) / totalQ) * 100 : 0;
  const questionPos = `${String(currentIndex + 1).padStart(2, '0')} / ${String(totalQ).padStart(2, '0')}`;
  const isLast = currentIndex >= totalQ - 1;
  const isCurrentAnswered = currentQuestion ? answers[currentQuestion.key] !== undefined : false;
  const canAdvance = isAutoAdvance(currentQuestion) ? true : isCurrentAnswered;

  /* ── Right rail content by phase ── */
  const rightRail = useMemo(() => {
    if (phase === 'intro') {
      return (
        <>
          <div className="v1-sidebar-section">
            <div className="v1-sidebar-label">{canon?.name}</div>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody, fontStyle: 'italic' }}>
              {canon?.descriptor}
            </p>
          </div>
          <div className="v1-sidebar-section">
            <div className="v1-sidebar-label">What it measures</div>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
              {canon?.measures}
            </p>
          </div>
          <div className="v1-sidebar-section">
            <div className="v1-mono" style={{ color: V1.textDim, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Time</span><span style={{ color: V1.textSecondary }}>{canon?.timeRange}</span>
            </div>
            <div className="v1-mono" style={{ color: V1.textDim, display: 'flex', justifyContent: 'space-between' }}>
              <span>Cost</span><span style={{ color: V1.textSecondary }}>{canon?.miles} mi · {canon?.tier}</span>
            </div>
          </div>
          <div className="v1-sidebar-section">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 1, flexShrink: 0, fontSize: 14, lineHeight: 1 }}>◆</span>
              <p className="v1-mono" style={{ color: V1.textMuted, lineHeight: V1.leadingLabel, textTransform: 'none', letterSpacing: 0, fontFamily: V1.bodyFont, fontSize: 11 }}>
                Your answers are private. Nothing leaves this thread without your say.
              </p>
            </div>
          </div>
        </>
      );
    }
    if (phase === 'questions' || phase === 'analyzing') {
      return (
        <>
          <div className="v1-sidebar-section">
            <div className="v1-sidebar-label">{canon?.name}</div>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody, fontStyle: 'italic' }}>
              {canon?.descriptor}
            </p>
          </div>
          <div className="v1-sidebar-section">
            <div className="v1-sidebar-label">Question {currentIndex + 1} of {totalQ}</div>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
              {phase === 'analyzing'
                ? 'Scoring your answers.'
                : `About ${canon?.timeRange.split('-')[1 - 0] || 'a few'} minutes remaining.`}
            </p>
          </div>
          <div className="v1-sidebar-section">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 1, flexShrink: 0, fontSize: 14, lineHeight: 1 }}>◆</span>
              <p className="v1-mono" style={{ color: V1.textMuted, lineHeight: V1.leadingLabel, textTransform: 'none', letterSpacing: 0, fontFamily: V1.bodyFont, fontSize: 11 }}>
                Your answers are private.
              </p>
            </div>
            <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '12px 0 0', lineHeight: V1.leadingBody }}>
              Need to step away? We'll save your progress.
            </p>
          </div>
        </>
      );
    }
    if (phase === 'complete') {
      return (
        <div className="v1-sidebar-section">
          <div className="v1-sidebar-label">Complete</div>
          <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodySm, color: V1.textSecondary, margin: '8px 0 0', lineHeight: V1.leadingBody }}>
            Your readout for {canon?.name} is ready.
          </p>
        </div>
      );
    }
    return null;
  }, [phase, canon, currentIndex, totalQ]);

  /* ── Main content by phase ── */
  const main = useMemo(() => {
    if (phase === 'notfound') {
      return (
        <div style={{ maxWidth: 640 }}>
          <div className="v1-eyebrow">Not found</div>
          <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>No lens here.</h1>
          <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary, marginBottom: 24 }}>This lens code is not in the catalog.</p>
          <Link to="/nexus/lenses" className="v1-btn v1-btn-secondary">Back to lenses <span aria-hidden="true">→</span></Link>
        </div>
      );
    }
    if (phase === 'error') {
      return (
        <div style={{ maxWidth: 640 }}>
          <div className="v1-eyebrow">Something went wrong</div>
          <h1 className="v1-display" style={{ fontSize: V1.textH1, margin: '8px 0 16px' }}>Could not load this lens.</h1>
          <p style={{ fontFamily: V1.bodyFont, color: V1.textSecondary, marginBottom: 24 }}>{errorMsg || 'Try again in a moment.'}</p>
          <Link to="/nexus/lenses" className="v1-btn v1-btn-secondary">Back to lenses <span aria-hidden="true">→</span></Link>
        </div>
      );
    }
    if (phase === 'intro') {
      return (
        <div style={{ maxWidth: 640 }}>
          <div className="v1-eyebrow">Diagnostic lens</div>
          <h1 className="v1-display reveal" style={{ fontSize: V1.textDisplay, margin: '8px 0 8px', lineHeight: V1.leadingDisplay }}>
            {canon?.name}
          </h1>
          <p className="v1-display reveal" style={{ fontStyle: 'italic', fontSize: V1.textBodyLg, color: V1.textSecondary, margin: '0 0 32px', lineHeight: V1.leadingBody }}>
            {canon?.descriptor}
          </p>

          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerRow}` }}>
            <div className="v1-eyebrow" style={{ marginBottom: 12 }}>What you'll get</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {canon?.whatYouGet.map((g, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text, marginBottom: 10, lineHeight: V1.leadingBody }}>
                  <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
            <div>
              <div className="v1-eyebrow">Estimated time</div>
              <div className="v1-mono" style={{ color: V1.text, marginTop: 4 }}>{canon?.timeRange}</div>
            </div>
            <div>
              <div className="v1-eyebrow">Cost</div>
              <div className="v1-mono" style={{ color: V1.text, marginTop: 4 }}>{canon?.miles} mi · {canon?.tier}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleStart} className="v1-btn v1-btn-primary" style={{ padding: '14px 24px' }}>
              Start {canon?.name} <span aria-hidden="true">→</span>
            </button>
            <Link to={`/nexus/lenses/${slug}`} className="v1-btn v1-btn-link">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      );
    }
    if (phase === 'questions' && currentQuestion) {
      const currentAnswer = answers[currentQuestion.key];
      return (
        <div style={{ maxWidth: 720 }}>
          <ProgressBar value={progressPct} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              style={{
                background: 'transparent', border: 'none', cursor: currentIndex === 0 ? 'default' : 'pointer',
                fontFamily: V1.monoFont, fontSize: V1.textCaption, letterSpacing: V1.trackingMono,
                textTransform: 'uppercase', color: currentIndex === 0 ? V1.textDim : V1.textSecondary,
                padding: 0,
              }}
            >
              <span aria-hidden="true">←</span> Back
            </button>
            <span className="v1-mono" style={{ color: V1.textDim }}>{questionPos}</span>
          </div>
          <h2 className="v1-display" style={{ fontSize: V1.textH2, margin: '0 0 24px', lineHeight: V1.leadingHeading, color: V1.text }}>
            {currentQuestion.prompt}
          </h2>
          <QuestionRenderer
            question={currentQuestion}
            currentAnswer={currentAnswer as any}
            onAnswer={(val) => {
              if (isAutoAdvance(currentQuestion)) {
                handleAutoAdvance(currentQuestion.key, val);
              } else {
                handleAnswer(currentQuestion.key, val);
              }
            }}
          />
          {/* Submit button for non-auto-advance types */}
          {!isAutoAdvance(currentQuestion) && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => {
                  if (isLast) {
                    void completeLens();
                  } else {
                    handleSubmitAdvance();
                  }
                }}
                disabled={!canAdvance || submitting}
                className="v1-btn v1-btn-primary"
                style={{ padding: '12px 24px' }}
              >
                {isLast ? 'Complete lens' : 'Continue'} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
          {/* Auto-advance types: when on last question, show a Complete button */}
          {isAutoAdvance(currentQuestion) && isLast && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => void completeLens()}
                disabled={!isCurrentAnswered || submitting}
                className="v1-btn v1-btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Complete lens <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    if (phase === 'analyzing') {
      return (
        <div style={{ maxWidth: 640 }}>
          <ProgressBar value={100} />
          <div className="v1-mono" style={{ color: V1.textDim, marginBottom: 16 }}>Analyzing...</div>
          <h2 className="v1-display" style={{ fontSize: V1.textH2, margin: 0, color: V1.text }}>
            Pulling your readout together.
          </h2>
        </div>
      );
    }
    if (phase === 'complete') {
      return (
        <div style={{ maxWidth: 640 }}>
          <div className="v1-eyebrow">Complete</div>
          <h1 className="v1-display" style={{ fontSize: V1.textDisplay, margin: '8px 0 16px', lineHeight: V1.leadingDisplay }}>
            Your readout is ready.
          </h1>
          <p style={{ fontFamily: V1.bodyFont, fontSize: V1.textBodyLg, color: V1.textSecondary, lineHeight: V1.leadingBody, margin: '0 0 32px', maxWidth: 560 }}>
            A still frame of where you stand on {canon?.descriptor.toLowerCase()}.
          </p>
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${V1.dividerRow}` }}>
            <div className="v1-eyebrow" style={{ marginBottom: 12 }}>What you'll see</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text, marginBottom: 10, lineHeight: V1.leadingBody }}>
                <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span>Overall position against the APAC executive benchmark.</span>
              </li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text, marginBottom: 10, lineHeight: V1.leadingBody }}>
                <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span>Dimension-by-dimension breakdown with what to work on.</span>
              </li>
              <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: V1.bodyFont, fontSize: V1.textBody, color: V1.text, marginBottom: 10, lineHeight: V1.leadingBody }}>
                <span aria-hidden="true" style={{ color: V1.teal600, marginTop: 2, flexShrink: 0 }}>✓</span>
                <span>Your archetype match.</span>
              </li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to={`/nexus/lenses/${slug}/readout/${resultId}`}
              className="v1-btn v1-btn-primary"
              style={{ padding: '14px 24px' }}
            >
              View readout <span aria-hidden="true">→</span>
            </Link>
            <Link
              to={`/nexus/chat?code=${slug}`}
              className="v1-btn v1-btn-secondary"
              style={{ padding: '14px 24px' }}
            >
              Talk about this with NEXUS
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }, [phase, canon, currentQuestion, answers, progressPct, questionPos, isLast, isCurrentAnswered, canAdvance, submitting, resultId, slug, handleStart, handleBack, handleAnswer, handleAutoAdvance, handleSubmitAdvance, completeLens, errorMsg]);

  /* ── Exit modal wiring ── */
  // Block native nav away during questions phase (best-effort)
  useEffect(() => {
    if (phase !== 'questions') return;
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase, answers]);

  if (!canon) {
    // notfound branch — main will render the notfound block; ensure shell renders
  }

  return (
    <div style={{ background: V1.bg, minHeight: '100vh', color: V1.text }}>
      <SEO page="assessments" />

      {/* Nav */}
      <nav className="v1-nav">
        <div className="v1-nav-inner">
          <Link to="/" className="v1-wordmark" aria-label="NEXUS home">
            NEXUS<span className="v1-dot">.</span>
          </Link>
          <div className="v1-nav-links v1-hidden-mobile">
            <Link to="/nexus/chat">Chat</Link>
            <Link to="/nexus/lenses" className="v1-active-link">Lenses</Link>
            <Link to="/nexus/milestones">Milestones</Link>
            <Link to="/nexus/insights">Insights</Link>
          </div>
          <div className="v1-nav-cta">
            <button onClick={handleExitRequest} className="v1-btn v1-btn-secondary">
              <span aria-hidden="true">←</span> Exit
            </button>
          </div>
        </div>
      </nav>

      {/* 3-column app shell */}
      <div className="v1-appshell" style={{ marginTop: V1.navHeight, minHeight: `calc(100vh - ${V1.navHeight})` }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Workspace</div>
              <Link to="/nexus/chat" className="v1-sidebar-link">Chat</Link>
              <Link to="/nexus/lenses" className="v1-sidebar-link v1-active">Lenses</Link>
              <Link to="/nexus/milestones" className="v1-sidebar-link">Milestones</Link>
              <Link to="/nexus/insights" className="v1-sidebar-link">Insights</Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Depth</div>
              {['Positioning', 'Influence', 'Transition', 'Enterprise China'].map(area => (
                <Link to="/nexus/lenses" key={area} className="v1-sidebar-link">{area}<span className="v1-sidebar-meta">practice</span></Link>
              ))}
              <Link to="/nexus/lenses" className="v1-sidebar-link">All eleven lenses <span aria-hidden="true">→</span></Link>
            </div>
            <div className="v1-sidebar-section">
              <div className="v1-sidebar-label">Human Layer</div>
              <Link to="/debrief/book" className="v1-sidebar-link">Book a debrief</Link>
              <Link to="/nexus/chat" className="v1-sidebar-link">Coaching packages</Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="v1-appshell-main" style={{ padding: `${V1.shellPad * 1.5}px`, overflow: 'auto' }}>
          {main}
        </main>

        {/* ── RIGHT RAIL ── */}
        <aside className="v1-appshell-col">
          <div className="v1-sidebar-sticky">
            {rightRail}
          </div>
        </aside>
      </div>

      {/* Exit confirmation modal */}
      <ExitConfirmModal
        open={showExitModal}
        onStay={() => setShowExitModal(false)}
        onExit={() => { setShowExitModal(false); navigate('/nexus/lenses'); }}
      />
    </div>
  );
}

export default LensTakeFlowPage;
