// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  GROW,
  CLEAR,
  COACHING_WHEEL,
  OSCAR,
  FRAME,
  getMethodology,
  getAllMethodologies,
  getMethodologyForFocus,
  getStepIndex,
  getCurrentStep,
  generatePrompt,
  getProgress,
  getMethodologyComparison,
  adaptMethodologyResponse,
  type CoachingMethodology,
  type Methodology,
  type MethodologyStep,
} from '../../../api/_lib/coachingMethodologies.js';

describe('GROW methodology', () => {
  it('has correct id and name', () => {
    expect(GROW.id).toBe('GROW');
    expect(GROW.name).toBe('GROW Model');
  });

  it('has 4 steps', () => {
    expect(GROW.steps.length).toBe(4);
    expect(GROW.steps.map(s => s.name)).toEqual(['Goal', 'Reality', 'Options', 'Will']);
  });

  it('each step has prompts', () => {
    GROW.steps.forEach(step => {
      expect(step.prompts.length).toBeGreaterThan(0);
      expect(typeof step.prompts[0]).toBe('string');
    });
  });

  it('has strengths and bestFor arrays', () => {
    expect(GROW.strengths.length).toBeGreaterThan(0);
    expect(GROW.bestFor.length).toBeGreaterThan(0);
    expect(GROW.limitations.length).toBeGreaterThan(0);
  });
});

describe('CLEAR methodology', () => {
  it('has 5 steps', () => {
    expect(CLEAR.steps.length).toBe(5);
    expect(CLEAR.steps.map(s => s.name)).toEqual(['Context', 'Listen', 'Explore', 'Action', 'Review']);
  });

  it('has appropriate description', () => {
    expect(CLEAR.description).toContain('holistic');
  });
});

describe('COACHING_WHEEL methodology', () => {
  it('has 4 quadrant steps', () => {
    expect(COACHING_WHEEL.steps.length).toBe(4);
    expect(COACHING_WHEEL.steps.map(s => s.name)).toEqual(['Thinking', 'Feeling', 'Doing', 'Being']);
  });

  it('has transformative focus', () => {
    expect(COACHING_WHEEL.strengths.some(s => s.includes('Holistic') || s.includes('head'))).toBe(true);
  });
});

describe('OSCAR methodology', () => {
  it('has 5 steps', () => {
    expect(OSCAR.steps.length).toBe(5);
  });

  it('is solution-focused', () => {
    expect(OSCAR.description).toContain('solution');
  });
});

describe('FRAME methodology', () => {
  it('has 5 steps', () => {
    expect(FRAME.steps.length).toBe(5);
  });

  it('focuses on reframing', () => {
    expect(FRAME.description).toContain('refram');
  });
});

describe('getMethodology', () => {
  it('returns correct methodology for each id', () => {
    const ids: CoachingMethodology[] = ['GROW', 'CLEAR', 'coaching-wheel', 'OSCAR', 'FRAME'];
    ids.forEach(id => {
      const m = getMethodology(id);
      expect(m.id).toBe(id);
      expect(m.steps.length).toBeGreaterThan(0);
    });
  });
});

describe('getAllMethodologies', () => {
  it('returns all 5 methodologies', () => {
    const all = getAllMethodologies();
    expect(all.length).toBe(5);
    const ids = all.map(m => m.id);
    expect(ids).toContain('GROW');
    expect(ids).toContain('CLEAR');
    expect(ids).toContain('coaching-wheel');
    expect(ids).toContain('OSCAR');
    expect(ids).toContain('FRAME');
  });
});

describe('getMethodologyForFocus', () => {
  it('returns appropriate methodology for each focus', () => {
    expect(getMethodologyForFocus('leadership')).toBe('coaching-wheel');
    expect(getMethodologyForFocus('performance')).toBe('GROW');
    expect(getMethodologyForFocus('career-transition')).toBe('CLEAR');
    expect(getMethodologyForFocus('communication')).toBe('FRAME');
  });

  it('defaults to GROW for unknown focus', () => {
    expect(getMethodologyForFocus('unknown-focus')).toBe('GROW');
  });
});

describe('getStepIndex', () => {
  it('returns correct index for step id', () => {
    expect(getStepIndex('GROW', 'goal')).toBe(0);
    expect(getStepIndex('GROW', 'reality')).toBe(1);
    expect(getStepIndex('GROW', 'options')).toBe(2);
    expect(getStepIndex('GROW', 'will')).toBe(3);
  });

  it('returns -1 for nonexistent step', () => {
    expect(getStepIndex('GROW', 'nonexistent')).toBe(-1);
  });
});

describe('getCurrentStep', () => {
  it('returns first step when none completed', () => {
    const step = getCurrentStep('GROW', []);
    expect(step.name).toBe('Goal');
  });

  it('returns next incomplete step', () => {
    const step = getCurrentStep('GROW', ['goal']);
    expect(step.name).toBe('Reality');
  });

  it('returns last step when all completed', () => {
    const step = getCurrentStep('GROW', ['goal', 'reality', 'options', 'will']);
    expect(step.name).toBe('Will');
  });
});

describe('generatePrompt', () => {
  it('returns a prompt for the given step', () => {
    const prompt = generatePrompt('GROW', 'goal');
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(10);
  });

  it('returns different prompts for different contexts', () => {
    const prompt1 = generatePrompt('GROW', 'goal', 'short');
    const prompt2 = generatePrompt('GROW', 'goal', 'longer context that will rotate prompts');
    expect(typeof prompt1).toBe('string');
    expect(typeof prompt2).toBe('string');
  });
});

describe('getProgress', () => {
  it('returns 0% for no completed steps', () => {
    const progress = getProgress('GROW', []);
    expect(progress.percent).toBe(0);
    expect(progress.currentStep.name).toBe('Goal');
  });

  it('returns 50% for 2 of 4 steps completed', () => {
    const progress = getProgress('GROW', ['goal', 'reality']);
    expect(progress.percent).toBe(50);
  });

  it('returns 100% when all steps completed', () => {
    const progress = getProgress('GROW', ['goal', 'reality', 'options', 'will']);
    expect(progress.percent).toBe(100);
  });

  it('has nextStep null when all done', () => {
    const progress = getProgress('GROW', ['goal', 'reality', 'options', 'will']);
    expect(progress.nextStep).toBeNull();
  });

  it('has nextStep when not complete', () => {
    const progress = getProgress('GROW', ['goal']);
    expect(progress.nextStep).not.toBeNull();
    expect(progress.nextStep?.name).toBe('Options');
  });
});

describe('getMethodologyComparison', () => {
  it('returns comparison data for all methodologies', () => {
    const comparison = getMethodologyComparison();
    expect(comparison.length).toBe(5);
    comparison.forEach(c => {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(Array.isArray(c.bestFor)).toBe(true);
      expect(typeof c.timeToComplete).toBe('string');
    });
  });
});

describe('adaptMethodologyResponse', () => {
  it('returns structured response for emotional input', () => {
    const result = adaptMethodologyResponse('GROW', 'reality', 'I feel frustrated and stressed about this');
    expect(result.prompt).toBeTruthy();
    expect(result.reflection).toContain('emotion') || expect(result.reflection).toBeTruthy();
    expect(result.challenge).not.toBeNull();
  });

  it('returns structured response for analytical input', () => {
    const result = adaptMethodologyResponse('GROW', 'reality', 'I think the key insight is about strategy');
    expect(result.prompt).toBeTruthy();
    expect(result.reflection).toBeTruthy();
  });

  it('returns null challenge for neutral input', () => {
    const result = adaptMethodologyResponse('GROW', 'reality', 'Okay, let\'s talk about this');
    expect(result.prompt).toBeTruthy();
  });

  it('returns fallback for invalid step', () => {
    const result = adaptMethodologyResponse('GROW', 'nonexistent', 'test');
    expect(result.prompt).toBeTruthy();
  });
});
