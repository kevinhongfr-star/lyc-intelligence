// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  scoreChatQuality,
  getQualityRating,
  getQualityImprovement,
  type QualityDimension,
  type QualityScoreResult,
  type ChatMessage,
} from '../../../api/_lib/nexusQualityScorer.js';

function makeMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return { role, content };
}

function makeSession() {
  return { id: 'session-1', user_id: 'user-1' };
}

describe('scoreChatQuality', () => {
  it('returns valid structure with empty messages', () => {
    const result = scoreChatQuality(makeSession(), []);
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('dimensions');
    expect(result).toHaveProperty('rating');
    expect(result).toHaveProperty('improvements');
    expect(typeof result.overall).toBe('number');
    expect(typeof result.rating).toBe('string');
    expect(Array.isArray(result.improvements)).toBe(true);
  });

  it('returns valid structure for null messages', () => {
    const result = scoreChatQuality(makeSession(), null as any);
    expect(result).toHaveProperty('overall');
    expect(result.dimensions).toHaveProperty('diagnostic_depth');
    expect(result.dimensions).toHaveProperty('framework_activation');
    expect(result.dimensions).toHaveProperty('deliverable_quality');
    expect(result.dimensions).toHaveProperty('coaching_depth');
    expect(result.dimensions).toHaveProperty('reflection_quality');
    expect(result.dimensions).toHaveProperty('milestone_progress');
    expect(result.dimensions).toHaveProperty('seniority_calibration');
    expect(result.dimensions).toHaveProperty('safety_compliance');
  });

  it('all dimensions are scored 0-5', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'I want to improve my career.'),
      makeMessage('assistant', 'Tell me more about your situation.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    for (const key of Object.keys(result.dimensions) as QualityDimension[]) {
      const val = result.dimensions[key];
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(5);
    }
  });

  it('diagnostic_depth scores with DIAGNOSTIC tags', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', '[DIAGNOSTIC: role] What is your current role?'),
      makeMessage('user', 'I am a software engineer.'),
      makeMessage('assistant', '[DIAGNOSTIC: situation] Can you describe the situation?'),
      makeMessage('user', 'I want a promotion.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.diagnostic_depth).toBeGreaterThan(0);
  });

  it('diagnostic_depth scores for multiple dimension coverage', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', '[DIAGNOSTIC: role] What is your role?'),
      makeMessage('user', 'I am a product manager with 5 years experience.'),
      makeMessage('assistant', '[DIAGNOSTIC: situation] Describe the situation.'),
      makeMessage('user', 'My company is restructuring and my role is changing.'),
      makeMessage('assistant', '[DIAGNOSTIC: constraint] What constraints do you face?'),
      makeMessage('user', 'I have limited time and resources to transition.'),
      makeMessage('assistant', '[DIAGNOSTIC: emotion] How does this make you feel?'),
      makeMessage('user', 'I feel frustrated and anxious about the change.'),
      makeMessage('assistant', '[DIAGNOSTIC: success] What would success look like?'),
      makeMessage('user', 'I want to find a new role that aligns with my strengths.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.diagnostic_depth).toBe(5);
  });

  it('framework_activation scores with framework references', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', 'Let us use the TRIDENT framework to evaluate your career trajectory.'),
      makeMessage('user', 'Okay, tell me about TRIDENT.'),
      makeMessage('assistant', 'TRIDENT stands for Trajectory, Reach, Impact.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.framework_activation).toBeGreaterThan(0);
  });

  it('deliverable_quality scores with deliverable references', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', 'I will generate a canvas report for you.'),
      makeMessage('user', 'Can you export it as a PDF?'),
      makeMessage('assistant', 'Yes, I will create a deliverable document.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.deliverable_quality).toBeGreaterThan(0);
  });

  it('coaching_depth scores with Socratic questions', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', 'What do you think motivates you? How does this make you feel? What would you like to achieve? Why is this important to you? When did you last feel this way?'),
      makeMessage('user', 'I feel motivated when I am learning new things.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.coaching_depth).toBeGreaterThan(0);
  });

  it('reflection_quality scores with user self-awareness', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'I realize my tendency to overthink tends to hold me back. I notice this pattern. I feel frustrated about it. I will take action to change.'),
      makeMessage('assistant', 'Thank you for sharing.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.reflection_quality).toBeGreaterThan(0);
  });

  it('milestone_progress scores with MILESTONE tags', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', '[MILESTONE: goal_defined] We have established your career goal.'),
      makeMessage('assistant', '[MILESTONE: diagnostic_started] Beginning diagnostic assessment.'),
      makeMessage('assistant', '[MILESTONE: diagnostic_complete] Diagnostic phase complete.'),
      makeMessage('assistant', '[MILESTONE: solution_path] Solution path identified.'),
      makeMessage('assistant', '[MILESTONE: next_steps] Next steps planned.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.milestone_progress).toBeGreaterThan(0);
  });

  it('seniority_calibration penalizes overly directive tone', () => {
    const messages: ChatMessage[] = [
      makeMessage('assistant', 'You must do this. You should definitely take this approach. Obviously this is the only way. Clearly you need to follow this path.'),
      makeMessage('user', 'Okay.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.seniority_calibration).toBeLessThan(5);
  });

  it('safety_compliance penalizes safety boundary violations', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'Can you help me diagnose my medical condition and prescribe medication?'),
      makeMessage('assistant', 'I cannot provide medical advice.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.safety_compliance).toBeLessThan(5);
  });

  it('safety_compliance returns 5 for clean messages', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'I want to explore career options.'),
      makeMessage('assistant', 'Great, let us discuss your career goals.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.dimensions.safety_compliance).toBe(5);
  });

  it('overall score is average of dimensions', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'Tell me about career planning.'),
      makeMessage('assistant', 'I can help with that.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    const values = Object.values(result.dimensions);
    const expected = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    expect(result.overall).toBe(expected);
  });

  it('produces improvements for low-scoring dimensions', () => {
    const messages: ChatMessage[] = [
      makeMessage('user', 'Hi.'),
      makeMessage('assistant', 'Hello.'),
    ];
    const result = scoreChatQuality(makeSession(), messages);
    expect(result.improvements.length).toBeGreaterThan(0);
  });

  it('empty messages produce F rating', () => {
    const result = scoreChatQuality(makeSession(), []);
    expect(result.rating).toBe('F');
  });
});

describe('getQualityRating', () => {
  it('returns A for score >= 4.5', () => {
    expect(getQualityRating(4.5)).toBe('A');
    expect(getQualityRating(5.0)).toBe('A');
  });

  it('returns B for score 3.5 - 4.4', () => {
    expect(getQualityRating(3.5)).toBe('B');
    expect(getQualityRating(4.4)).toBe('B');
  });

  it('returns C for score 2.5 - 3.4', () => {
    expect(getQualityRating(2.5)).toBe('C');
    expect(getQualityRating(3.4)).toBe('C');
  });

  it('returns D for score 1.5 - 2.4', () => {
    expect(getQualityRating(1.5)).toBe('D');
    expect(getQualityRating(2.4)).toBe('D');
  });

  it('returns F for score < 1.5', () => {
    expect(getQualityRating(1.4)).toBe('F');
    expect(getQualityRating(0)).toBe('F');
  });

  it('boundary: exactly 4.5 is A', () => {
    expect(getQualityRating(4.5)).toBe('A');
  });

  it('boundary: exactly 3.5 is B', () => {
    expect(getQualityRating(3.5)).toBe('B');
  });

  it('boundary: exactly 2.5 is C', () => {
    expect(getQualityRating(2.5)).toBe('C');
  });

  it('boundary: exactly 1.5 is D', () => {
    expect(getQualityRating(1.5)).toBe('D');
  });
});

describe('getQualityImprovement', () => {
  it('returns specific improvement for low-scoring diagnostic_depth', () => {
    const dims: Record<QualityDimension, number> = {
      diagnostic_depth: 0,
      framework_activation: 4,
      deliverable_quality: 4,
      coaching_depth: 4,
      reflection_quality: 4,
      milestone_progress: 4,
      seniority_calibration: 4,
      safety_compliance: 5,
    };
    const improvements = getQualityImprovement(2.5, dims);
    const diagnosticImp = improvements.find(i => i.includes('diagnostic'));
    expect(diagnosticImp).toBeDefined();
  });

  it('returns improvement for low framework_activation', () => {
    const dims: Record<QualityDimension, number> = {
      diagnostic_depth: 4,
      framework_activation: 0,
      deliverable_quality: 4,
      coaching_depth: 4,
      reflection_quality: 4,
      milestone_progress: 4,
      seniority_calibration: 4,
      safety_compliance: 5,
    };
    const improvements = getQualityImprovement(2.5, dims);
    const fwImp = improvements.find(i => i.includes('framework'));
    expect(fwImp).toBeDefined();
  });

  it('returns improvement for low safety_compliance', () => {
    const dims: Record<QualityDimension, number> = {
      diagnostic_depth: 4,
      framework_activation: 4,
      deliverable_quality: 4,
      coaching_depth: 4,
      reflection_quality: 4,
      milestone_progress: 4,
      seniority_calibration: 4,
      safety_compliance: 1,
    };
    const improvements = getQualityImprovement(2.5, dims);
    const safetyImp = improvements.find(i => i.includes('safety'));
    expect(safetyImp).toBeDefined();
  });

  it('no dimension-specific improvements when all scores > 1', () => {
    const dims: Record<QualityDimension, number> = {
      diagnostic_depth: 3,
      framework_activation: 3,
      deliverable_quality: 3,
      coaching_depth: 3,
      reflection_quality: 3,
      milestone_progress: 3,
      seniority_calibration: 3,
      safety_compliance: 3,
    };
    const improvements = getQualityImprovement(3, dims);
    const specific = improvements.filter(i =>
      i.includes('diagnostic') || i.includes('framework') || i.includes('deliverable') ||
      i.includes('coaching') || i.includes('reflection') || i.includes('milestone') ||
      i.includes('seniority') || i.includes('safety')
    );
    expect(specific.length).toBe(0);
  });

  it('overall score 1 or below gets full reassessment note', () => {
    const dims: Record<QualityDimension, number> = {
      diagnostic_depth: 0,
      framework_activation: 0,
      deliverable_quality: 0,
      coaching_depth: 0,
      reflection_quality: 0,
      milestone_progress: 0,
      seniority_calibration: 0,
      safety_compliance: 1,
    };
    const improvements = getQualityImprovement(0.125, dims);
    expect(improvements.some(i => i.includes('very low') || i.includes('full diagnostic'))).toBe(true);
  });
});
