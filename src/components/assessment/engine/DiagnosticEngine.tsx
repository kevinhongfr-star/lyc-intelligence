/**
 * DiagnosticEngine.tsx — Canonical branching-native assessment question engine.
 *
 * #1277: Branching-native architecture.
 *   - 5 question types: single_select, multi_select, scale, text, scenario
 *   - Skip logic: skip_question | jump_to | end_assessment
 *   - Dependency (prerequisite) checking
 *   - Progress = answered / total REACHABLE (non-skipped, dep-met) questions
 *   - Backtracking: changing an answer re-evaluates downstream skip logic;
 *     all answers persist even if later skipped (no data loss).
 *
 * #1341: Data flow.
 *   - start → createAttempt(slug, userId)
 *   - each answer → saveResponse(attemptId, key, answer, slug, userId)
 *   - submit → completeAttempt(attemptId, slug, userId, answers)
 *   - localStorage cache/fallback handled by diagnosticApi.ts
 *   - resume → resumeAnonAttempt(slug) on mount
 *
 * Self-contained: loads its definition via getDiagnostic(slug), manages its
 * own state, and calls the API service functions.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Info, Loader2, AlertTriangle } from 'lucide-react';
import {
  INK, OFF, G100, G200, G300, G400, G600, WHITE,
  monoStyle, containerStyle, btnBase,
  useScrollReveal, ctaCompressHandlers, RevealStyles,
} from '../landing/shared';
import type { DiagnosticEngineProps, EnginePhase } from './types';
import type {
  DiagnosticDefinition,
  DiagnosticQuestion,
  SkipRule,
  QuestionDependency,
} from '@/types/assessment';
import type { AnswerMap, AnswerValue } from '@/services/diagnosticScoring';
import { getDiagnostic } from '@/data/diagnostics';
import {
  createAttempt,
  saveResponse,
  completeAttempt,
  resumeAnonAttempt,
} from '@/services/diagnosticApi';
import { useAuthStore } from '@/stores/authStore';

// ── CONSTANTS ──────────────────────────────────────────────────────

/** Sentinel returned by getNextIndex when no further question is reachable. */
const END = -1;
/** Auto-advance delay for scale / single_select / scenario (ms). */
const AUTO_ADVANCE_MS = 260;
/** Functional submitting delay (ms). */
const SUBMIT_DELAY_MS = 350;

const FONT_HEAD = "'Crimson Pro', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'IBM Plex Mono', 'Courier New', monospace";

// ── TYPED ANSWER ACCESSORS (avoid `as` casts) ─────────────────────

function getNumberAnswer(answers: AnswerMap, key: string): number | undefined {
  const v = answers[key];
  return typeof v === 'number' ? v : undefined;
}
function getStringAnswer(answers: AnswerMap, key: string): string | undefined {
  const v = answers[key];
  return typeof v === 'string' ? v : undefined;
}
function getArrayAnswer(answers: AnswerMap, key: string): string[] | undefined {
  const v = answers[key];
  return Array.isArray(v) ? v : undefined;
}

// ── CONDITION EVALUATION (#1277 skip logic + dependency) ──────────

/** Loose equality that bridges number/string and array-contains semantics. */
function looseEqual(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (actual == null || expected == null) return false;
  if (typeof actual === 'number' && typeof expected === 'string') {
    return String(actual) === expected;
  }
  if (typeof actual === 'string' && typeof expected === 'number') {
    return actual === String(expected);
  }
  // multi_select answer: array contains the expected value.
  if (Array.isArray(actual)) {
    const expStr = String(expected);
    return actual.some((a) => String(a) === expStr);
  }
  return false;
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Evaluate a skip-rule / dependency condition against the current answers. */
function evaluateCondition(
  condition: { question_id: string; operator: string; value: string | number | string[] },
  answers: AnswerMap,
): boolean {
  const actual = answers[condition.question_id];
  const expected = condition.value;
  switch (condition.operator) {
    case 'equals':
      return looseEqual(actual, expected);
    case 'not_equals':
      return !looseEqual(actual, expected);
    case 'greater_than': {
      const a = toNumber(actual);
      const b = toNumber(expected);
      return a !== null && b !== null && a > b;
    }
    case 'less_than': {
      const a = toNumber(actual);
      const b = toNumber(expected);
      return a !== null && b !== null && a < b;
    }
    case 'in': {
      const arr = Array.isArray(expected) ? expected : [expected];
      return arr.some((e) => looseEqual(actual, e));
    }
    case 'not_in': {
      const arr = Array.isArray(expected) ? expected : [expected];
      return !arr.some((e) => looseEqual(actual, e));
    }
    default:
      return false;
  }
}

function dependencyMet(dep: QuestionDependency, answers: AnswerMap): boolean {
  return evaluateCondition(
    { question_id: dep.question_id, operator: dep.operator, value: dep.value },
    answers,
  );
}

/** First matching skip-rule for a question, or null. */
function getMatchingSkipRule(q: DiagnosticQuestion, answers: AnswerMap): SkipRule | null {
  if (!q.skip_logic || q.skip_logic.length === 0) return null;
  for (const rule of q.skip_logic) {
    if (evaluateCondition(rule.condition, answers)) return rule;
  }
  return null;
}

/**
 * A question is "skipped" (not reachable, not counted) when:
 *  - its dependency prerequisite is unmet, OR
 *  - one of its own skip_logic rules matches with action `skip_question`.
 * (jump_to / end_assessment rules affect navigation but do not by themselves
 * remove the question from the active set — they are followed at nav time.)
 */
function isSkipped(q: DiagnosticQuestion, answers: AnswerMap): boolean {
  if (q.dependency && !dependencyMet(q.dependency, answers)) return true;
  const rule = getMatchingSkipRule(q, answers);
  return !!rule && rule.action === 'skip_question';
}

function isAnswered(q: DiagnosticQuestion, answers: AnswerMap): boolean {
  const v = answers[q.key];
  if (v === undefined || v === null) return false;
  switch (q.type) {
    case 'multi_select':
      return Array.isArray(v) && v.length > 0;
    case 'text':
    case 'single_select':
      return typeof v === 'string' && v.trim().length > 0;
    case 'scale':
    case 'scenario':
      return typeof v === 'number';
    default:
      return false;
  }
}

/** Whether the user may advance past the current question. */
function canAdvance(q: DiagnosticQuestion, answers: AnswerMap): boolean {
  if (!q.required) return true;
  return isAnswered(q, answers);
}

// ── NAVIGATION (#1277 skip + branch + dependency aware) ───────────

function findIndexByKey(questions: DiagnosticQuestion[], key: string): number {
  return questions.findIndex((q) => q.key === key);
}

/**
 * Resolve the next question index after `currentIndex`, following jump_to /
 * end_assessment rules and skipping dependency-blocked / skip_question items.
 * Returns END (-1) when the assessment should advance to review.
 */
function getNextIndex(
  questions: DiagnosticQuestion[],
  currentIndex: number,
  answers: AnswerMap,
): number {
  const currentQ = questions[currentIndex];

  // 1. Post-answer routing: the current question's own skip_logic can branch.
  if (currentQ) {
    const rule = getMatchingSkipRule(currentQ, answers);
    if (rule) {
      if (rule.action === 'end_assessment') return END;
      if (rule.action === 'jump_to' && rule.target) {
        const t = findIndexByKey(questions, rule.target);
        if (t >= 0 && !isSkipped(questions[t], answers)) return t;
      }
      // skip_question on the just-answered question → fall through to linear walk.
    }
  }

  // 2. Linear walk forward over non-skipped questions, honouring reach-time rules.
  const visited = new Set<number>();
  let i = currentIndex + 1;
  while (i < questions.length && !visited.has(i)) {
    visited.add(i);
    const q = questions[i];
    if (isSkipped(q, answers)) {
      i++;
      continue;
    }
    const rule = getMatchingSkipRule(q, answers);
    if (rule) {
      if (rule.action === 'skip_question') {
        i++;
        continue;
      }
      if (rule.action === 'end_assessment') return END;
      if (rule.action === 'jump_to' && rule.target) {
        const t = findIndexByKey(questions, rule.target);
        if (t >= 0 && !isSkipped(questions[t], answers)) return t;
        i++;
        continue;
      }
    }
    return i;
  }
  return END;
}

/** Previous reachable question index, or -1 if before the first. */
function getPrevIndex(
  questions: DiagnosticQuestion[],
  currentIndex: number,
  answers: AnswerMap,
): number {
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (!isSkipped(questions[i], answers)) return i;
  }
  return -1;
}

/** All reachable (non-skipped) questions given current answers. */
function getActiveQuestions(
  questions: DiagnosticQuestion[],
  answers: AnswerMap,
): DiagnosticQuestion[] {
  return questions.filter((q) => !isSkipped(q, answers));
}

/** True when no further reachable question exists after the current one. */
function isLastReachable(
  questions: DiagnosticQuestion[],
  currentIndex: number,
  answers: AnswerMap,
): boolean {
  return getNextIndex(questions, currentIndex, answers) === END;
}

// ── ANSWER FORMATTING (review screen) ─────────────────────────────

function formatAnswer(q: DiagnosticQuestion, answers: AnswerMap): string {
  const v = answers[q.key];
  if (v === undefined || v === null) return '—';
  switch (q.type) {
    case 'scale':
    case 'scenario': {
      const n = typeof v === 'number' ? v : undefined;
      const max = q.scale_max ?? 5;
      return n !== undefined ? `${n} / ${max}` : '—';
    }
    case 'single_select': {
      if (typeof v !== 'string') return '—';
      const opt = q.options?.find((o) => o.value === v);
      return opt?.label ?? v;
    }
    case 'multi_select': {
      if (!Array.isArray(v)) return '—';
      if (v.length === 0) return '—';
      const labels = v
        .map((val) => q.options?.find((o) => o.value === val)?.label ?? val)
        .filter(Boolean);
      return labels.length > 0 ? labels.join(', ') : `${v.length} selected`;
    }
    case 'text':
      return typeof v === 'string' && v.trim().length > 0 ? v.trim() : '—';
    default:
      return '—';
  }
}

// ── RENDERERS ─────────────────────────────────────────────────────

interface RendererShared {
  question: DiagnosticQuestion;
  answers: AnswerMap;
  accent: string;
}

function ScaleRenderer({ question, answers, accent, onSelect }: RendererShared & { onSelect: (n: number) => void }) {
  const min = question.scale_min ?? 1;
  const max = question.scale_max ?? 5;
  const labels = question.scale_labels ?? {};
  const value = getNumberAnswer(answers, question.key);

  const values: number[] = [];
  for (let n = min; n <= max; n++) values.push(n);
  const lowLabel = labels[String(min)];
  const highLabel = labels[String(max)];

  return (
    <div role="radiogroup" aria-label={question.prompt}>
      {values.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
          <span style={{ ...monoStyle, color: G600, fontSize: 10 }}>{lowLabel ?? 'Low'}</span>
          <span style={{ ...monoStyle, color: accent, fontSize: 10 }}>{highLabel ?? 'High'}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        {values.map((n) => {
          const selected = value === n;
          const label = labels[String(n)];
          return (
            <button
              key={n}
              type="button"
              aria-pressed={selected}
              aria-label={`Rate ${n}${label ? ` — ${label}` : ''}`}
              onClick={() => onSelect(n)}
              style={{
                flex: 1,
                minHeight: 56,
                background: selected ? accent : WHITE,
                border: `1px solid ${selected ? accent : G200}`,
                cursor: 'pointer',
                fontFamily: FONT_BODY,
                fontSize: 18,
                fontWeight: 600,
                color: selected ? WHITE : INK,
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              {n}
            </button>
          );
        })}
      </div>
      {Object.keys(labels).length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {values.map((n) => (
            <span
              key={n}
              style={{
                ...monoStyle,
                flex: 1,
                textAlign: 'center',
                color: G400,
                fontSize: 9,
                lineHeight: 1.3,
                minHeight: 12,
              }}
            >
              {labels[String(n)] ?? ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SingleSelectRenderer({ question, answers, accent, onSelect }: RendererShared & { onSelect: (value: string) => void }) {
  const value = getStringAnswer(answers, question.key);
  const options = question.options ?? [];

  return (
    <div role="radiogroup" aria-label={question.prompt} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map((opt, i) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            aria-label={`${String.fromCharCode(65 + i)}. ${opt.label}`}
            onClick={() => onSelect(opt.value)}
            style={{
              width: '100%',
              padding: '20px 24px',
              background: selected ? accent : WHITE,
              border: `1px solid ${selected ? accent : G200}`,
              cursor: 'pointer',
              fontFamily: FONT_BODY,
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
            <span
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                border: `1px solid ${selected ? WHITE : G300}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 500,
                color: selected ? WHITE : G600,
              }}
            >
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

function MultiSelectRenderer({ question, answers, accent, onToggle }: RendererShared & { onToggle: (value: string) => void }) {
  const value = getArrayAnswer(answers, question.key) ?? [];
  const options = question.options ?? [];
  const maxSel = question.max_selections ?? options.length;

  return (
    <div role="group" aria-label={question.prompt}>
      <div style={{ ...monoStyle, color: G600, fontSize: 10, marginBottom: 16 }}>
        Select up to {maxSel}
        {value.length > 0 ? ` · ${value.length} selected` : ''}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {options.map((opt, i) => {
          const isSelected = value.includes(opt.value);
          const atMax = value.length >= maxSel && !isSelected;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              disabled={atMax}
              aria-label={`${String.fromCharCode(65 + i)}. ${opt.label}`}
              onClick={() => onToggle(opt.value)}
              style={{
                width: '100%',
                padding: '20px 24px',
                background: isSelected ? accent : WHITE,
                border: `1px solid ${isSelected ? accent : G200}`,
                cursor: atMax ? 'not-allowed' : 'pointer',
                opacity: atMax ? 0.4 : 1,
                fontFamily: FONT_BODY,
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
              <span
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  border: `1px solid ${isSelected ? WHITE : G300}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? WHITE : 'transparent',
                }}
              >
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

function TextRenderer({
  question,
  answers,
  accent,
  onChange,
  onBlur,
}: RendererShared & { onChange: (value: string) => void; onBlur: () => void }) {
  const value = getStringAnswer(answers, question.key) ?? '';
  // Defensive read for an optional max_length (canonical type is open to extension).
  const maxLen = (question as DiagnosticQuestion & { max_length?: number }).max_length;

  return (
    <div>
      <textarea
        value={value}
        aria-label={question.prompt}
        placeholder="Type your response…"
        onChange={(e) => {
          const next = typeof maxLen === 'number' ? e.target.value.slice(0, maxLen) : e.target.value;
          onChange(next);
        }}
        onBlur={onBlur}
        rows={5}
        style={{
          width: '100%',
          padding: '16px 18px',
          background: WHITE,
          border: `1px solid ${G200}`,
          fontFamily: FONT_BODY,
          fontSize: 15,
          lineHeight: 1.6,
          color: INK,
          resize: 'vertical',
          minHeight: 132,
          transition: 'border-color 200ms ease',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = accent;
        }}
        onMouseLeave={(e) => {
          if (e.currentTarget !== document.activeElement) {
            e.currentTarget.style.borderColor = G200;
          }
        }}
      />
      {typeof maxLen === 'number' && (
        <div style={{ ...monoStyle, color: G400, fontSize: 9, marginTop: 8, textAlign: 'right' }}>
          {value.length} / {maxLen}
        </div>
      )}
    </div>
  );
}

/** Scenario = scenario block above the prompt + scale renderer below. */
function ScenarioRenderer(props: RendererShared & { onSelect: (n: number) => void }) {
  const { question, accent, onSelect } = props;
  return (
    <div>
      <div style={{ marginBottom: 28, padding: '20px 24px', background: G100, borderLeft: `3px solid ${accent}` }}>
        <span style={{ ...monoStyle, color: accent, fontSize: 9, marginBottom: 8, display: 'block' }}>
          Scenario
        </span>
        <p style={{ fontSize: 16, color: G600, lineHeight: 1.65, margin: 0, fontFamily: FONT_BODY }}>
          {question.scenario}
        </p>
      </div>
      <ScaleRenderer {...props} onSelect={onSelect} />
    </div>
  );
}

// ── PHASE SCREENS ──────────────────────────────────────────────────

function GuestBanner() {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        marginBottom: 32,
        background: G100,
        border: `1px solid ${G200}`,
      }}
    >
      <Info style={{ width: 16, height: 16, color: G600, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: G600, lineHeight: 1.5 }}>
        You're taking this as a guest. Create an account to save your results.
      </span>
    </div>
  );
}

function NotFoundScreen({ slug }: { slug: string }) {
  return (
    <div style={{ ...containerStyle, padding: '120px 32px', textAlign: 'center' }}>
      <AlertTriangle style={{ width: 40, height: 40, color: G400, marginBottom: 24 }} />
      <h1 style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 700, color: INK, marginBottom: 12 }}>
        Assessment unavailable
      </h1>
      <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
        The diagnostic “{slug}” could not be loaded. It may not be published yet.
      </p>
    </div>
  );
}

function IntroScreen({
  definition,
  accent,
  isGuest,
  onBegin,
}: {
  definition: DiagnosticDefinition;
  accent: string;
  isGuest: boolean;
  onBegin: () => void;
}) {
  const { meta } = definition;
  const totalQuestions = meta.total_questions || definition.questions.length;
  const minutes = Math.max(1, Math.round(totalQuestions * 0.5));
  const expectations = [
    `${totalQuestions} questions, about ${minutes} minutes`,
    'Answer honestly — there are no right or wrong answers',
    'You can go back and change any answer before submitting',
    'Your progress is saved automatically',
  ];

  return (
    <div className={`diag-engine-intro`} style={{ maxWidth: 680, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ ...monoStyle, color: accent, fontSize: 10, marginBottom: 16 }}>
          {meta.title} · Diagnostic
        </div>
        <h1
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 36,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.15,
            marginBottom: 14,
          }}
        >
          {meta.title}
        </h1>
        <p style={{ fontSize: 16, color: G600, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
          {meta.subtitle}
        </p>
        <div style={{ ...monoStyle, color: G400, fontSize: 10, marginTop: 20 }}>
          {totalQuestions} questions · ~{minutes} minutes
        </div>
      </div>

      {isGuest && <GuestBanner />}

      <div style={{ border: `1px solid ${G200}`, background: WHITE, marginBottom: 40 }}>
        {expectations.map((exp, i) => (
          <div
            key={i}
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              borderBottom: i < expectations.length - 1 ? `1px solid ${G200}` : 'none',
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                border: `1px solid ${accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FONT_MONO,
                fontSize: 11,
                fontWeight: 500,
                color: accent,
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 15, color: INK, lineHeight: 1.5, flex: 1 }}>{exp}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onBegin}
          aria-label="Begin assessment"
          style={{
            ...btnBase,
            background: accent,
            color: WHITE,
            borderColor: accent,
            padding: '16px 36px',
            fontSize: 15,
            fontWeight: 600,
          }}
          {...ctaCompressHandlers}
        >
          Begin Assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}

function SubmittingScreen({ accent, title }: { accent: string; title: string }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 style={{ width: 48, height: 48, color: accent, animation: 'diag-spin 1s linear infinite' }} />
      <h2 style={{ fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 700, color: INK, marginTop: 32, marginBottom: 8 }}>
        Analyzing your responses…
      </h2>
      <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, textAlign: 'center', maxWidth: 400 }}>
        Scoring your {title} answers across every dimension and preparing your personalized report.
      </p>
      <style>{`@keyframes diag-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ReviewScreen({
  questions,
  answers,
  accent,
  onEdit,
}: {
  questions: DiagnosticQuestion[];
  answers: AnswerMap;
  accent: string;
  onEdit: (indexInActive: number) => void;
}) {
  const answered = questions.filter((q) => isAnswered(q, answers)).length;
  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ ...monoStyle, color: accent, marginBottom: 16 }}>Review</div>
        <h1 style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 12 }}>
          Ready to submit?
        </h1>
        <p style={{ fontSize: 16, color: G600, lineHeight: 1.6 }}>
          {answered} of {questions.length} questions answered. Review your responses below before submitting.
        </p>
      </div>
      <div style={{ border: `1px solid ${G200}`, background: WHITE }}>
        {questions.map((q, i) => {
          const display = formatAnswer(q, answers);
          const unanswered = !isAnswered(q, answers);
          return (
            <button
              key={q.key}
              type="button"
              onClick={() => onEdit(i)}
              aria-label={`Edit question ${i + 1}: ${q.prompt}`}
              style={{
                width: '100%',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                borderBottom: i < questions.length - 1 ? `1px solid ${G200}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ flex: 1, paddingRight: 24 }}>
                <div style={{ ...monoStyle, color: G400, fontSize: 9, marginBottom: 4 }}>Q{i + 1}</div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>
                  {q.prompt}
                </div>
                <div style={{ fontSize: 13, color: unanswered ? G400 : G600, fontStyle: unanswered ? 'italic' : 'normal' }}>
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

// ── MAIN COMPONENT ─────────────────────────────────────────────────

export function DiagnosticEngine(props: DiagnosticEngineProps) {
  const { slug, userId, accent: accentProp, onComplete } = props;

  // Auth store fallback so the engine is self-contained when the parent does
  // not pass an explicit userId (userId === null → check the active session).
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const effectiveUserId = userId ?? authUserId;
  const isGuest = effectiveUserId === null;

  const definition = useMemo<DiagnosticDefinition | null>(() => getDiagnostic(slug), [slug]);
  const questions = definition?.questions ?? [];
  const accent = accentProp ?? definition?.meta.accent_color ?? INK;

  const prefix = `diag-engine-${slug}`;
  useScrollReveal(prefix);

  // ── STATE ───────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<EnginePhase>('intro');
  const [hydrated, setHydrated] = useState(false);

  // attemptId is stored in a ref to avoid stale-closure races across the
  // async createAttempt → first saveResponse sequence.
  const attemptIdRef = useRef<string | null>(null);
  const [, setAttemptId] = useState<string | null>(null);

  const ensureAttempt = useCallback(async (): Promise<string> => {
    if (attemptIdRef.current) return attemptIdRef.current;
    const id = await createAttempt(slug, effectiveUserId);
    attemptIdRef.current = id;
    setAttemptId(id);
    return id;
  }, [slug, effectiveUserId]);

  const persistAnswer = useCallback(
    (key: string, value: AnswerValue) => {
      void ensureAttempt().then((id) => {
        void saveResponse(id, key, value, slug, effectiveUserId);
      });
    },
    [ensureAttempt, slug, effectiveUserId],
  );

  // ── RESUME ON MOUNT ──────────────────────────────────────────────
  useEffect(() => {
    const resumed = resumeAnonAttempt(slug);
    if (resumed && resumed.answers && Object.keys(resumed.answers).length > 0) {
      setAnswers(resumed.answers);
      const maxIdx = Math.max(0, questions.length - 1);
      setCurrentIndex(Math.min(Math.max(0, resumed.currentIndex ?? 0), maxIdx));
      setPhase('questions');
      void ensureAttempt();
    }
    setHydrated(true);
    // Mount-only resume; questions/ensureAttempt are stable for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ── DERIVED ─────────────────────────────────────────────────────
  const currentQ = questions[currentIndex];
  const activeQuestions = useMemo(() => getActiveQuestions(questions, answers), [questions, answers]);
  const answeredCount = activeQuestions.filter((q) => isAnswered(q, answers)).length;
  const totalActive = activeQuestions.length;
  const progressPct = totalActive > 0 ? Math.round((answeredCount / totalActive) * 100) : 0;

  const activePosition = currentQ ? activeQuestions.findIndex((q) => q.key === currentQ.key) : -1;
  const positionLabel = activePosition >= 0 ? activePosition + 1 : 1;

  const advance = useCallback(
    (fromAnswers: AnswerMap) => {
      window.setTimeout(() => {
        const ni = getNextIndex(questions, currentIndex, fromAnswers);
        if (ni === END) setPhase('review');
        else setCurrentIndex(ni);
      }, AUTO_ADVANCE_MS);
    },
    [questions, currentIndex],
  );

  // ── ANSWER HANDLERS ──────────────────────────────────────────────
  const handleScaleSelect = useCallback(
    (value: number) => {
      if (!currentQ) return;
      const next = { ...answers, [currentQ.key]: value };
      setAnswers(next);
      persistAnswer(currentQ.key, value);
      advance(next);
    },
    [currentQ, answers, persistAnswer, advance],
  );

  const handleSingleSelect = useCallback(
    (value: string) => {
      if (!currentQ) return;
      const next = { ...answers, [currentQ.key]: value };
      setAnswers(next);
      persistAnswer(currentQ.key, value);
      advance(next);
    },
    [currentQ, answers, persistAnswer, advance],
  );

  const handleMultiToggle = useCallback(
    (value: string) => {
      if (!currentQ) return;
      const current = getArrayAnswer(answers, currentQ.key) ?? [];
      const maxSel = currentQ.max_selections ?? currentQ.options?.length ?? 0;
      let nextArr: string[];
      if (current.includes(value)) {
        nextArr = current.filter((v) => v !== value);
      } else if (current.length >= maxSel) {
        return; // at max — ignore
      } else {
        nextArr = [...current, value];
      }
      const next = { ...answers, [currentQ.key]: nextArr };
      setAnswers(next);
      persistAnswer(currentQ.key, nextArr);
    },
    [currentQ, answers, persistAnswer],
  );

  const handleTextChange = useCallback(
    (value: string) => {
      if (!currentQ) return;
      setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    },
    [currentQ],
  );

  const handleTextBlur = useCallback(() => {
    if (!currentQ) return;
    const v = getStringAnswer(answers, currentQ.key);
    if (v !== undefined) persistAnswer(currentQ.key, v);
  }, [currentQ, answers, persistAnswer]);

  // ── NAVIGATION ───────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!currentQ) return;
    if (currentQ.type === 'text') {
      const v = getStringAnswer(answers, currentQ.key);
      if (v !== undefined) persistAnswer(currentQ.key, v);
    }
    const ni = getNextIndex(questions, currentIndex, answers);
    if (ni === END) setPhase('review');
    else setCurrentIndex(ni);
  }, [currentQ, questions, currentIndex, answers, persistAnswer]);

  const goBack = useCallback(() => {
    const pi = getPrevIndex(questions, currentIndex, answers);
    if (pi < 0) setPhase('intro');
    else setCurrentIndex(pi);
  }, [questions, currentIndex, answers]);

  const handleBegin = useCallback(async () => {
    await ensureAttempt();
    setCurrentIndex(0);
    setPhase('questions');
  }, [ensureAttempt]);

  const handleEditFromReview = useCallback(
    (indexInActive: number) => {
      const target = activeQuestions[indexInActive];
      if (!target) return;
      const realIdx = findIndexByKey(questions, target.key);
      if (realIdx >= 0) {
        setCurrentIndex(realIdx);
        setPhase('questions');
      }
    },
    [activeQuestions, questions],
  );

  // If the current question is out of range or became skipped (e.g. after a
  // backtrack that toggled a dependency), advance to the next reachable one.
  useEffect(() => {
    if (phase !== 'questions' || questions.length === 0) return;
    if (currentQ && !isSkipped(currentQ, answers)) return;
    const ni = getNextIndex(questions, currentIndex, answers);
    if (ni === END) setPhase('review');
    else setCurrentIndex(ni);
  }, [phase, questions, currentQ, answers, currentIndex]);

  // ── SUBMIT ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setPhase('submitting');
    try {
      const id = await ensureAttempt();
      const [res] = await Promise.all([
        completeAttempt(id, slug, effectiveUserId, answers),
        new Promise<void>((resolve) => window.setTimeout(resolve, SUBMIT_DELAY_MS)),
      ]);
      onComplete?.(res.resultId);
    } catch (err) {
      console.error('[DiagnosticEngine] submit failed:', err);
      setPhase('review');
    }
  }, [ensureAttempt, slug, effectiveUserId, answers, onComplete]);

  // ── KEYBOARD ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'questions' || !currentQ) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea';

      if (e.key === 'Backspace' && !typing) {
        e.preventDefault();
        goBack();
        return;
      }
      if (e.key === 'Enter' && !typing) {
        if (canAdvance(currentQ, answers)) {
          e.preventDefault();
          goNext();
        }
        return;
      }
      if (typing) return;

      const n = parseInt(e.key, 10);
      if (Number.isNaN(n)) return;

      if (currentQ.type === 'scale' || currentQ.type === 'scenario') {
        const min = currentQ.scale_min ?? 1;
        const max = currentQ.scale_max ?? 5;
        if (n >= min && n <= max) handleScaleSelect(n);
      } else if (currentQ.type === 'single_select' && currentQ.options) {
        if (n >= 1 && n <= currentQ.options.length) {
          handleSingleSelect(currentQ.options[n - 1].value);
        }
      } else if (currentQ.type === 'multi_select' && currentQ.options) {
        if (n >= 1 && n <= currentQ.options.length) {
          handleMultiToggle(currentQ.options[n - 1].value);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, currentQ, answers, goBack, goNext, handleScaleSelect, handleSingleSelect, handleMultiToggle]);

  // ── RENDER: EARLY RETURNS ───────────────────────────────────────
  if (!definition) {
    return (
      <div style={{ background: OFF, minHeight: '100vh', color: INK, fontFamily: FONT_BODY }}>
        <NotFoundScreen slug={slug} />
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div
        style={{
          background: OFF,
          minHeight: '100vh',
          color: INK,
          fontFamily: FONT_BODY,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RevealStyles prefix={prefix} />
        <Loader2 style={{ width: 36, height: 36, color: accent, animation: 'diag-spin 1s linear infinite' }} />
        <style>{`@keyframes diag-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div style={{ background: OFF, minHeight: '100vh', padding: '80px 32px', color: INK, fontFamily: FONT_BODY }}>
        <RevealStyles prefix={prefix} />
        <SubmittingScreen accent={accent} title={definition.meta.title} />
      </div>
    );
  }

  const showProgressBar = phase === 'questions' || phase === 'review';
  const isLast = phase === 'questions' && currentQ ? isLastReachable(questions, currentIndex, answers) : false;
  // Show the Next/Review button for multi_select & text (manual advance), and
  // for every type when on the last reachable question (Review affordance).
  const showNextButton =
    phase === 'questions' &&
    !!currentQ &&
    (currentQ.type === 'multi_select' || currentQ.type === 'text' || isLast);

  return (
    <div
      style={{
        background: OFF,
        minHeight: '100vh',
        color: INK,
        fontFamily: FONT_BODY,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <RevealStyles prefix={prefix} />
      <style>{`
        .diag-q-enter { animation: diag-q-enter 350ms cubic-bezier(0.16,1,0.3,1); }
        @keyframes diag-q-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) {
          .diag-engine-intro h1 { font-size: 28px !important; }
        }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(245,245,243,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${G200}`,
        }}
      >
        <div
          style={{
            ...containerStyle,
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 16,
              fontWeight: 700,
              color: INK,
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
            }}
          >
            {definition.meta.title}
            <span
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: G400,
              }}
            >
              {definition.meta.subtitle}
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.history.back();
            }}
            aria-label="Exit assessment"
            style={{
              fontSize: 13,
              color: G600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 120ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = INK)}
            onMouseLeave={(e) => (e.currentTarget.style.color = G600)}
          >
            Exit
          </button>
        </div>
        {/* Progress bar */}
        <div
          role="progressbar"
          aria-label="Assessment progress"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 3, background: showProgressBar ? G200 : 'transparent', position: 'relative' }}
        >
          {showProgressBar && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${progressPct}%`,
                background: accent,
                transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
              }}
            />
          )}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
        }}
      >
        {phase === 'intro' && (
          <IntroScreen
            definition={definition}
            accent={accent}
            isGuest={isGuest}
            onBegin={() => {
              void handleBegin();
            }}
          />
        )}

        {phase === 'questions' && currentQ && (
          <div className="diag-q-enter" style={{ maxWidth: 680, width: '100%' }} key={currentQ.key}>
            {/* Progress label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <span style={{ ...monoStyle, color: G400, fontSize: 10 }}>
                Question {positionLabel} of {totalActive}
              </span>
              <span style={{ ...monoStyle, color: accent, fontSize: 10 }}>
                {answeredCount} answered
              </span>
            </div>

            {/* Question prompt */}
            <h1
              style={{
                fontFamily: FONT_HEAD,
                fontSize: 28,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.3,
                marginBottom: 8,
              }}
            >
              {currentQ.prompt}
            </h1>
            <div style={{ height: 40 }} />

            {/* Answer area */}
            {currentQ.type === 'scale' && (
              <ScaleRenderer question={currentQ} answers={answers} accent={accent} onSelect={handleScaleSelect} />
            )}
            {currentQ.type === 'scenario' && (
              <ScenarioRenderer question={currentQ} answers={answers} accent={accent} onSelect={handleScaleSelect} />
            )}
            {currentQ.type === 'single_select' && (
              <SingleSelectRenderer question={currentQ} answers={answers} accent={accent} onSelect={handleSingleSelect} />
            )}
            {currentQ.type === 'multi_select' && (
              <MultiSelectRenderer question={currentQ} answers={answers} accent={accent} onToggle={handleMultiToggle} />
            )}
            {currentQ.type === 'text' && (
              <TextRenderer
                question={currentQ}
                answers={answers}
                accent={accent}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
              />
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 }}>
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back to previous question"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  fontWeight: 500,
                  color: INK,
                  transition: 'opacity 120ms ease',
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>

              {showNextButton && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance(currentQ, answers)}
                  aria-label={isLast ? 'Review answers' : 'Next question'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 24px',
                    background: canAdvance(currentQ, answers) ? accent : G200,
                    border: 'none',
                    cursor: canAdvance(currentQ, answers) ? 'pointer' : 'not-allowed',
                    fontFamily: FONT_BODY,
                    fontSize: 14,
                    fontWeight: 500,
                    color: canAdvance(currentQ, answers) ? WHITE : G400,
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                  {...ctaCompressHandlers}
                >
                  {isLast ? 'Review' : 'Next'}
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'review' && (
          <div style={{ maxWidth: 680, width: '100%' }}>
            <ReviewScreen
              questions={activeQuestions}
              answers={answers}
              accent={accent}
              onEdit={handleEditFromReview}
            />
            {/* Submit bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48 }}>
              <button
                type="button"
                onClick={() => {
                  const lastActive = activeQuestions[activeQuestions.length - 1];
                  if (lastActive) {
                    const realIdx = findIndexByKey(questions, lastActive.key);
                    if (realIdx >= 0) {
                      setCurrentIndex(realIdx);
                      setPhase('questions');
                    }
                  }
                }}
                aria-label="Back to last question"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  fontWeight: 500,
                  color: INK,
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                aria-label="Submit assessment"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 32px',
                  background: accent,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontSize: 15,
                  fontWeight: 600,
                  color: WHITE,
                  transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                }}
                {...ctaCompressHandlers}
              >
                Submit Assessment <Check style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
