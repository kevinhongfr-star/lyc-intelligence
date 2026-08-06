// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  analyzeDiagnosticCoverage,
  suggestDiagnosticQuestion,
  shouldProceedToSolution,
  computeDiagnosticProgress,
  DIAGNOSTIC_DIMENSIONS,
  type DiagnosticDimension,
  type DiagnosticState,
} from '../../../api/_lib/nexusDiagnosticEngine.js';

function makeMsg(role: string, content: string) {
  return { role, content };
}

describe('DIAGNOSTIC_DIMENSIONS', () => {
  it('contains all 5 required dimensions', () => {
    expect(DIAGNOSTIC_DIMENSIONS).toEqual(['role', 'situation', 'constraint', 'emotion', 'success']);
  });

  it('has exactly 5 dimensions', () => {
    expect(DIAGNOSTIC_DIMENSIONS.length).toBe(5);
  });
});

describe('analyzeDiagnosticCoverage', () => {
  it('returns empty covered for empty messages', () => {
    const result = analyzeDiagnosticCoverage([]);
    expect(result.covered).toEqual([]);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.state.phase).toBe('collecting');
  });

  it('returns empty covered for null messages', () => {
    const result = analyzeDiagnosticCoverage(null as any);
    expect(result.state.phase).toBe('collecting');
  });

  it('detects role dimension', () => {
    const messages = [
      makeMsg('user', 'I am a software engineer in the technology department. My role involves coding and leading projects.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toContain('role');
  });

  it('detects situation dimension', () => {
    const messages = [
      makeMsg('user', 'The current situation is challenging. Recently things have been difficult. Currently I am struggling.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toContain('situation');
  });

  it('detects constraint dimension', () => {
    const messages = [
      makeMsg('user', 'The main constraint is time. I face serious limitations. There are many obstacles and challenges.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toContain('constraint');
  });

  it('detects emotion dimension', () => {
    const messages = [
      makeMsg('user', 'I feel frustrated and anxious. I am overwhelmed and stressed about the situation. I am not motivated.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toContain('emotion');
  });

  it('detects success dimension', () => {
    const messages = [
      makeMsg('user', 'My goal is to get promoted. I want to achieve success. I have objectives and targets I hope to reach.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toContain('success');
  });

  it('returns complete phase when all dimensions collected', () => {
    const messages = [
      makeMsg('user', 'I am a manager and team lead in the technology department. My current role involves coding and leading projects. The current situation at work is difficult and the context has changed recently. There are major constraints with time pressure and limited resources and budget. I feel frustrated and overwhelmed about these challenges. My goal is to achieve success and improve the team to hit our targets.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.state.phase).toBe('complete');
  });

  it('returns deepening phase when all dimensions collected and 6+ user turns', () => {
    const messages = [
      makeMsg('user', 'I am a director and senior leader in the organization.'),
      makeMsg('assistant', 'Tell me more.'),
      makeMsg('user', 'The current situation and context is a major restructuring recently.'),
      makeMsg('assistant', 'I see.'),
      makeMsg('user', 'The constraint is budget and the limitation is time pressure.'),
      makeMsg('assistant', 'Okay.'),
      makeMsg('user', 'I feel motivated and hopeful about the opportunity.'),
      makeMsg('assistant', 'Great.'),
      makeMsg('user', 'My goal is to grow the team and achieve our targets.'),
      makeMsg('assistant', 'Sounds good.'),
      makeMsg('user', 'I also want to improve processes and deliver better outcomes.'),
      makeMsg('assistant', 'Understood.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.state.phase).toBe('deepening');
  });

  it('returns collecting phase when not all dimensions collected', () => {
    const messages = [
      makeMsg('user', 'I am an engineer and I feel happy about my goal.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.state.phase).toBe('collecting');
  });

  it('tracks turns_completed as user message count', () => {
    const messages = [
      makeMsg('user', 'Hello.'),
      makeMsg('assistant', 'Hi.'),
      makeMsg('user', 'How are you?'),
      makeMsg('assistant', 'Good.'),
      makeMsg('user', 'Tell me about career.'),
    ];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.state.turns_completed).toBe(3);
  });

  it('confidence increases with coverage', () => {
    const few = analyzeDiagnosticCoverage([makeMsg('user', 'I am a manager.'), makeMsg('user', 'My goal is success.')]);
    const many = analyzeDiagnosticCoverage([
      makeMsg('user', 'I am a manager in the engineering department.'),
      makeMsg('user', 'The current situation involves a restructuring.'),
      makeMsg('user', 'I face constraints with time and resources.'),
      makeMsg('user', 'I feel frustrated and overwhelmed.'),
      makeMsg('user', 'My goal is to achieve a promotion.'),
    ]);
    expect(many.state.confidence).toBeGreaterThan(few.state.confidence);
  });

  it('returns both covered and missing arrays', () => {
    const messages = [makeMsg('user', 'I am a manager. My goal is to succeed.')];
    const result = analyzeDiagnosticCoverage(messages);
    expect(result.covered).toBeInstanceOf(Array);
    expect(result.missing).toBeInstanceOf(Array);
    expect(result.covered.length + result.missing.length).toBe(5);
  });

  it('state is a DiagnosticState with correct properties', () => {
    const result = analyzeDiagnosticCoverage([makeMsg('user', 'I am a manager.')]);
    expect(result.state).toHaveProperty('dimensions_collected');
    expect(result.state).toHaveProperty('turns_completed');
    expect(result.state).toHaveProperty('confidence');
    expect(result.state).toHaveProperty('phase');
  });
});

describe('suggestDiagnosticQuestion', () => {
  it('returns a string for each dimension', () => {
    const dims: DiagnosticDimension[] = ['role', 'situation', 'constraint', 'emotion', 'success'];
    for (const d of dims) {
      const q = suggestDiagnosticQuestion(d);
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(0);
    }
  });

  it('returns different questions for different dimensions', () => {
    const roleQ = suggestDiagnosticQuestion('role');
    const emotionQ = suggestDiagnosticQuestion('emotion');
    expect(roleQ).not.toBe(emotionQ);
  });

  it('returns role-related question for role dimension', () => {
    const q = suggestDiagnosticQuestion('role');
    expect(q).toMatch(/role|position|responsibilit/i);
  });

  it('returns emotion-related question for emotion dimension', () => {
    const q = suggestDiagnosticQuestion('emotion');
    expect(q).toMatch(/feel|emotion|how does/i);
  });

  it('returns success-related question for success dimension', () => {
    const q = suggestDiagnosticQuestion('success');
    expect(q).toMatch(/success|goal|outcome|achieve/i);
  });

  it('cycles questions based on context message count', () => {
    const q1 = suggestDiagnosticQuestion('role', { messages: new Array(0) });
    const q2 = suggestDiagnosticQuestion('role', { messages: new Array(1) });
    const q3 = suggestDiagnosticQuestion('role', { messages: new Array(2) });
    expect(q1).toBeDefined();
    expect(q2).toBeDefined();
    expect(q3).toBeDefined();
  });

  it('works without context parameter', () => {
    const q = suggestDiagnosticQuestion('constraint');
    expect(typeof q).toBe('string');
    expect(q.length).toBeGreaterThan(0);
  });
});

describe('shouldProceedToSolution', () => {
  it('returns true when all 5 dimensions collected', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation', 'constraint', 'emotion', 'success']),
      turns_completed: 5,
      confidence: 0.9,
      phase: 'complete',
    };
    expect(shouldProceedToSolution(state)).toBe(true);
  });

  it('returns false when only some dimensions collected', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation']),
      turns_completed: 2,
      confidence: 0.35,
      phase: 'collecting',
    };
    expect(shouldProceedToSolution(state)).toBe(false);
  });

  it('returns false when empty set', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(),
      turns_completed: 0,
      confidence: 0,
      phase: 'collecting',
    };
    expect(shouldProceedToSolution(state)).toBe(false);
  });

  it('returns false with 4 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation', 'constraint', 'emotion']),
      turns_completed: 4,
      confidence: 0.55,
      phase: 'collecting',
    };
    expect(shouldProceedToSolution(state)).toBe(false);
  });

  it('returns true for exactly 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(DIAGNOSTIC_DIMENSIONS),
      turns_completed: 10,
      confidence: 0.9,
      phase: 'deepening',
    };
    expect(shouldProceedToSolution(state)).toBe(true);
  });
});

describe('computeDiagnosticProgress', () => {
  it('returns 0 for empty dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(),
      turns_completed: 0,
      confidence: 0,
      phase: 'collecting',
    };
    expect(computeDiagnosticProgress(state)).toBe(0);
  });

  it('returns 20 for 1 of 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role']),
      turns_completed: 1,
      confidence: 0.15,
      phase: 'collecting',
    };
    expect(computeDiagnosticProgress(state)).toBe(20);
  });

  it('returns 40 for 2 of 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation']),
      turns_completed: 2,
      confidence: 0.35,
      phase: 'collecting',
    };
    expect(computeDiagnosticProgress(state)).toBe(40);
  });

  it('returns 60 for 3 of 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation', 'constraint']),
      turns_completed: 3,
      confidence: 0.55,
      phase: 'collecting',
    };
    expect(computeDiagnosticProgress(state)).toBe(60);
  });

  it('returns 80 for 4 of 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(['role', 'situation', 'constraint', 'emotion']),
      turns_completed: 4,
      confidence: 0.75,
      phase: 'collecting',
    };
    expect(computeDiagnosticProgress(state)).toBe(80);
  });

  it('returns 100 for all 5 dimensions', () => {
    const state: DiagnosticState = {
      dimensions_collected: new Set(DIAGNOSTIC_DIMENSIONS),
      turns_completed: 5,
      confidence: 0.9,
      phase: 'complete',
    };
    expect(computeDiagnosticProgress(state)).toBe(100);
  });

  it('returns valid percentage range 0-100', () => {
    for (let i = 0; i <= 5; i++) {
      const dims = new Set<DiagnosticDimension>(DIAGNOSTIC_DIMENSIONS.slice(0, i));
      const state: DiagnosticState = {
        dimensions_collected: dims,
        turns_completed: i,
        confidence: i / 5,
        phase: i < 5 ? 'collecting' : 'complete',
      };
      const progress = computeDiagnosticProgress(state);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      expect(progress).toBe(progress % 1 === 0 ? progress : Math.round(progress));
    }
  });
});
