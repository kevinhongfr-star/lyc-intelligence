import React from 'react';
import type { AssessmentQuestion } from './flow/types';
import type { CPDScenario } from '../../services/assessmentEngine';
import { INK, WHITE, G100, G200, G300, G400, G600, monoStyle } from './landing/shared';

export interface ScenarioQuestionProps {
  /** Either the new flow-types AssessmentQuestion OR the legacy CPDScenario.
   *  The adapter below detects and normalises to the same render shape. */
  question: AssessmentQuestion | CPDScenario;
  /** Selected option score */
  currentAnswer?: number;
  onAnswer: (score: number, index: number) => void;
  questionNumber: number;
  /** Total questions (denominator of progress label) */
  totalQuestions: number;
  accent?: string;
}

// ── SHAPE ADAPTER ───────────────────────────────────────────────────
/**
 * CPDScenario → AssessmentQuestion adapter.
 *  - CPDScenario fields: `prompt` is the old "scenario" text, `options.label/value`.
 *  - New AssessmentQuestion: `scenarioContext`, `entryExpectation`, `text`, `options.label/score/detail`.
 * `prompt` was doing double-duty; we now split (in engine.ts) `scenarioContext`
 * (setup), `entryExpectation` (prompt + framed question), `text` (short prompt).
 */
function toRenderShape(q: AssessmentQuestion | CPDScenario): {
  scenarioContext?: string;
  entryExpectation?: string;
  text: string;
  hint?: string;
  options: Array<{ label: string; detail?: string; score: number }>;
} {
  // New-shape (AssessmentQuestion): has type, options.score, scenarioContext?
  if ('type' in q) {
    return {
      scenarioContext: q.scenarioContext,
      entryExpectation: q.entryExpectation,
      text: q.text,
      hint: q.hint,
      options: (q.options || []).map((o) => ({ label: o.label, detail: o.detail, score: o.score })),
    };
  }
  // Legacy CPDScenario: prompt (string), options.value (1|2|3|4|5)
  return {
    scenarioContext: (q as CPDScenario).scenarioContext,
    entryExpectation: (q as CPDScenario).entryExpectation,
    text: (q as CPDScenario).prompt,
    options: (q as CPDScenario).options.map((o) => ({ label: o.label, score: Number(o.value) })),
  };
}

/**
 * #1323: Upgraded Scenario Question renderer.
 *
 * Shape:
 *   ┌─ Q n / TOTAL ─────────────────────────────────────┐
 *   │                                                    │
 *   │  SCENARIO (blockquote-styled italic setup)         │
 *   │  "Your division has been given a new 3y mandate…" │
 *   │                                                    │
 *   │  ENTRY EXPECTATION  →  "What do you do first?"    │
 *   │  ───────────────                                    │
 *   │  A  Lettered label  / option.detail                │
 *   │  B  …                                               │
 *   └────────────────────────────────────────────────────┘
 *
 * Accepts AssessmentQuestion directly from the new flow types so the
 * existing CPD wizard and the generic AssessmentFlow component share
 * exactly one scenario renderer.
 */
export function ScenarioQuestion({
  question,
  currentAnswer,
  onAnswer,
  questionNumber,
  totalQuestions,
  accent,
}: ScenarioQuestionProps) {
  const ACCENT = accent || '#C108AB'; // DS.accent legacy default
  const rs = toRenderShape(question);
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...monoStyle, fontSize: 11, color: G400, letterSpacing: '0.04em' }}>
          Question {questionNumber} of {totalQuestions}
        </span>
        <span style={{ ...monoStyle, fontSize: 11, color: ACCENT, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Scenario
        </span>
      </div>

      {/* Scenario setup — blockquote-styled "you are here" context */}
      {rs.scenarioContext && (
        <blockquote
          style={{
            margin: '0 0 24px 0',
            padding: '16px 24px',
            borderLeft: `3px solid ${ACCENT}`,
            background: G100,
            fontSize: 15,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: G600,
          }}
        >
          {rs.scenarioContext}
        </blockquote>
      )}

      {/* Entry-expectation prompt: "What would you do?" */}
      {rs.entryExpectation ? (
        <div style={{ marginBottom: 12 }}>
          <span style={{
            ...monoStyle,
            color: ACCENT,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Your call
          </span>
          <h3 style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontSize: 22,
            fontWeight: 700,
            color: INK,
            margin: '8px 0 4px 0',
            lineHeight: 1.3,
          }}>
            {rs.entryExpectation}
          </h3>
          {/* The main `text` (prompt) appears below as secondary framing */}
          <p style={{ margin: 0, color: G600, fontSize: 15, lineHeight: 1.55 }}>
            {rs.text}
          </p>
        </div>
      ) : (
        <h3 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
          color: INK,
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.35,
        }}>
          {rs.text}
        </h3>
      )}

      {rs.hint && (
        <p style={{ margin: '0 0 28px 0', color: G600, fontSize: 14, lineHeight: 1.55 }}>
          {rs.hint}
        </p>
      )}

      {/* Lettered answer options with optional detail body */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(rs.options || []).map((option, idx) => {
          const selected = currentAnswer === option.score;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onAnswer(option.score, idx)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '18px 20px',
                background: selected ? `${ACCENT}14` : WHITE,
                border: `1px solid ${selected ? ACCENT : G200}`,
                color: INK,
                fontSize: 15,
                fontWeight: selected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                minHeight: 56,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.background = G100;
                }
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = G200;
                  e.currentTarget.style.background = WHITE;
                }
              }}
            >
              <div
                aria-hidden
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 32,
                  height: 32,
                  background: selected ? ACCENT : WHITE,
                  color: selected ? WHITE : INK,
                  border: `1px solid ${selected ? ACCENT : G300}`,
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                }}
              >
                {String.fromCharCode(65 + idx)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: selected ? 600 : 500, color: INK, lineHeight: 1.4 }}>
                  {option.label}
                </div>
                {option.detail && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 13.5,
                    color: G600,
                    lineHeight: 1.5,
                  }}>
                    {option.detail}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
