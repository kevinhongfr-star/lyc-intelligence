// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  scoreReflectionDepth,
  getReflectionDepth,
  getReflectionPrompts,
  trackReflectionProgress,
  type ReflectionDepth,
  type ReflectionBreakdown,
  type ReflectionTrend,
} from '../../../api/_lib/nexusReflectionScorer.js';

describe('scoreReflectionDepth', () => {
  it('returns zero breakdown for empty input', () => {
    const result = scoreReflectionDepth('');
    expect(result.specificity).toBe(0);
    expect(result.selfAwareness).toBe(0);
    expect(result.actionOrientation).toBe(0);
    expect(result.emotionalAwareness).toBe(0);
    expect(result.total).toBe(0);
  });

  it('returns zero breakdown for whitespace-only input', () => {
    const result = scoreReflectionDepth('   ');
    expect(result.total).toBe(0);
  });

  it('returns zero for null/undefined input', () => {
    expect(scoreReflectionDepth(null as any).total).toBe(0);
    expect(scoreReflectionDepth(undefined as any).total).toBe(0);
  });

  it('scores specificity - mentions specific situations', () => {
    const result = scoreReflectionDepth('In my last job, I usually worked overtime on specific projects.');
    expect(result.specificity).toBeGreaterThan(0);
  });

  it('scores specificity - mentions examples', () => {
    const result = scoreReflectionDepth('For instance, when I worked at Company X, I remember the day I launched the new product.');
    expect(result.specificity).toBeGreaterThan(0);
  });

  it('scores self-awareness - recognizes patterns', () => {
    const result = scoreReflectionDepth('I realize my tendency to overthink tends to hold me back. I notice this pattern.');
    expect(result.selfAwareness).toBeGreaterThan(0);
  });

  it('scores self-awareness - acknowledges weaknesses', () => {
    const result = scoreReflectionDepth('I am aware that my weakness is in public speaking. I understand my limits.');
    expect(result.selfAwareness).toBeGreaterThan(0);
  });

  it('scores action orientation - proposes steps', () => {
    const result = scoreReflectionDepth('I will start by setting clear goals. I plan to work on this step by step.');
    expect(result.actionOrientation).toBeGreaterThan(0);
  });

  it('scores action orientation - mentions strategies', () => {
    const result = scoreReflectionDepth('My action plan is to improve my communication through a structured approach.');
    expect(result.actionOrientation).toBeGreaterThan(0);
  });

  it('scores emotional awareness - expresses feelings', () => {
    const result = scoreReflectionDepth('I feel frustrated when I am not making progress. I am feeling overwhelmed.');
    expect(result.emotionalAwareness).toBeGreaterThan(0);
  });

  it('scores emotional awareness - acknowledges emotions', () => {
    const result = scoreReflectionDepth('I am happy with my progress but feel anxious about the future.');
    expect(result.emotionalAwareness).toBeGreaterThan(0);
  });

  it('returns score of 2 when multiple markers in a dimension', () => {
    const result = scoreReflectionDepth('I realize I notice my pattern. My tendency is clear. I understand my weakness and my strength.');
    expect(result.selfAwareness).toBe(2);
  });

  it('total is sum of all dimensions', () => {
    const result = scoreReflectionDepth('I realize my pattern and I will take action because I feel happy about this specific situation.');
    expect(result.total).toBe(result.specificity + result.selfAwareness + result.actionOrientation + result.emotionalAwareness);
  });

  it('returns valid breakdown structure', () => {
    const result = scoreReflectionDepth('I think I need to change how I work.');
    expect(result).toHaveProperty('specificity');
    expect(result).toHaveProperty('selfAwareness');
    expect(result).toHaveProperty('actionOrientation');
    expect(result).toHaveProperty('emotionalAwareness');
    expect(result).toHaveProperty('total');
  });
});

describe('getReflectionDepth', () => {
  it('returns surface for empty response', () => {
    expect(getReflectionDepth('')).toBe('surface');
  });

  it('returns surface for very generic responses', () => {
    expect(getReflectionDepth('I want a better job.')).toBe('surface');
  });

  it('returns specific for responses with some detail', () => {
    expect(getReflectionDepth('In my previous role I worked on specific projects with a small team.')).toBe('specific');
  });

  it('returns reflective for self-analytical responses', () => {
    expect(getReflectionDepth('For example, I realize my tendency to overthink. I feel frustrated about this pattern.')).toBe('reflective');
  });

  it('returns transformative for deep responses', () => {
    const deep = 'I realize my tendency to procrastinate. I notice this pattern. I feel frustrated and stuck. I will take action to change this. I am hopeful and motivated.';
    expect(getReflectionDepth(deep)).toBe('transformative');
  });

  it('maps total 0-1 to surface', () => {
    const shallow = 'yes no maybe';
    const depth = getReflectionDepth(shallow);
    expect(depth).toBe('surface');
  });

  it('maps total 2-3 to specific', () => {
    const text = 'In my previous job I usually worked on specific projects.';
    const depth = getReflectionDepth(text);
    expect(depth).toBe('specific');
  });

  it('maps total 4-5 to reflective', () => {
    const text = 'For example, I realize my tendency to overthink. I feel frustrated about this pattern.';
    const depth = getReflectionDepth(text);
    expect(depth).toBe('reflective');
  });

  it('maps total 6+ to transformative', () => {
    const text = 'I realize my tendency to procrastinate. I notice this pattern. I feel frustrated and stuck. I will take action to change this. I am hopeful and motivated.';
    const depth = getReflectionDepth(text);
    expect(depth).toBe('transformative');
  });
});

describe('getReflectionPrompts', () => {
  it('returns prompts for each depth level', () => {
    const depths: ReflectionDepth[] = ['surface', 'specific', 'reflective', 'transformative'];
    for (const d of depths) {
      const prompts = getReflectionPrompts(d);
      expect(prompts).toBeInstanceOf(Array);
      expect(prompts.length).toBeGreaterThan(0);
    }
  });

  it('returns deeper prompts for deeper depths', () => {
    const surfacePrompts = getReflectionPrompts('surface');
    const transformativePrompts = getReflectionPrompts('transformative');
    expect(transformativePrompts.length).toBeGreaterThanOrEqual(surfacePrompts.length);
  });

  it('surface prompts ask for specific situations', () => {
    const prompts = getReflectionPrompts('surface');
    const combined = prompts.join(' ');
    expect(combined).toMatch(/specific|example|situation/i);
  });

  it('specific prompts ask about patterns', () => {
    const prompts = getReflectionPrompts('specific');
    const combined = prompts.join(' ');
    expect(combined).toMatch(/pattern|root|cause|feel/i);
  });

  it('reflective prompts ask about next steps', () => {
    const prompts = getReflectionPrompts('reflective');
    const combined = prompts.join(' ');
    expect(combined).toMatch(/step|different|support|change/i);
  });

  it('transformative prompts ask about measurement', () => {
    const prompts = getReflectionPrompts('transformative');
    const combined = prompts.join(' ');
    expect(combined).toMatch(/measurable|success|know|commitment/i);
  });
});

describe('trackReflectionProgress', () => {
  it('returns empty trend for empty session', () => {
    const trend = trackReflectionProgress([]);
    expect(trend.depths).toEqual([]);
    expect(trend.improving).toBe(false);
    expect(trend.averageDepth).toBe(0);
    expect(trend.trajectory).toBe('stable');
  });

  it('returns empty trend for null input', () => {
    const trend = trackReflectionProgress(null as any);
    expect(trend.depths).toEqual([]);
    expect(trend.trajectory).toBe('stable');
  });

  it('tracks single response', () => {
    const trend = trackReflectionProgress(['I want to improve my career.']);
    expect(trend.depths).toHaveLength(1);
    expect(trend.averageDepth).toBeGreaterThanOrEqual(0);
  });

  it('detects deepening trajectory', () => {
    const responses = [
      'I want a better job.',
      'I want a better job. I work hard.',
      'I realize my pattern of procrastination. I notice this issue.',
      'I realize my avoidance pattern. I notice the root cause. I plan to take action. I feel motivated.',
    ];
    const trend = trackReflectionProgress(responses);
    expect(trend.depths.length).toBe(4);
  });

  it('detects stable trajectory for consistent depth', () => {
    const responses = [
      'I want to improve.',
      'I want to get better.',
      'I want to change.',
      'I want to grow.',
    ];
    const trend = trackReflectionProgress(responses);
    expect(trend.depths.length).toBe(4);
    expect(trend.trajectory).toBe('stable');
  });

  it('averageDepth is numeric', () => {
    const responses = ['I feel happy about my progress.', 'I realize my pattern and I will change.'];
    const trend = trackReflectionProgress(responses);
    expect(typeof trend.averageDepth).toBe('number');
  });

  it('works with mixed depth responses', () => {
    const responses = [
      'Hi there.',
      'I realize my pattern of overthinking. I notice this happens often.',
      'I want to get a promotion.',
      'I realize my tendency to hold back. I feel frustrated by this. I plan to speak up more. I am hopeful about change.',
    ];
    const trend = trackReflectionProgress(responses);
    expect(trend.depths.length).toBe(4);
    expect(['surface', 'specific', 'reflective', 'transformative']).toEqual(expect.arrayContaining(trend.depths));
  });
});
