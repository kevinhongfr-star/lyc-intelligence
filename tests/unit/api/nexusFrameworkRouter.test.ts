// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  selectFramework,
  getFrameworkPrompts,
  getRecommendedFrameworks,
  FRAMEWORK_DESCRIPTIONS,
  SCENARIO_FRAMEWORK_MAP,
  type FrameworkType,
} from '../../../api/_lib/nexusFrameworkRouter.js';

describe('FRAMEWORK_DESCRIPTIONS', () => {
  it('contains all 6 frameworks', () => {
    const types: FrameworkType[] = ['TRIDENT', 'SHIFT', 'CANVAS', 'STAR', 'GROWTH', 'SCALE'];
    for (const t of types) {
      expect(FRAMEWORK_DESCRIPTIONS[t]).toBeDefined();
      expect(FRAMEWORK_DESCRIPTIONS[t].description.length).toBeGreaterThan(0);
    }
  });

  it('TRIDENT description mentions career transition', () => {
    expect(FRAMEWORK_DESCRIPTIONS.TRIDENT.description).toMatch(/career|transition/i);
  });

  it('SHIFT description mentions self-understanding', () => {
    expect(FRAMEWORK_DESCRIPTIONS.SHIFT.description).toMatch(/self|understanding|strength/i);
  });

  it('CANVAS description mentions compensation', () => {
    expect(FRAMEWORK_DESCRIPTIONS.CANVAS.description).toMatch(/compensation|negotiation|salary/i);
  });

  it('STAR description mentions interview or behavioral', () => {
    expect(FRAMEWORK_DESCRIPTIONS.STAR.description).toMatch(/interview|behavioral|storytelling/i);
  });

  it('GROWTH description mentions skill development', () => {
    expect(FRAMEWORK_DESCRIPTIONS.GROWTH.description).toMatch(/skill|development|learning/i);
  });

  it('SCALE description mentions leadership', () => {
    expect(FRAMEWORK_DESCRIPTIONS.SCALE.description).toMatch(/leadership|scaling|management/i);
  });

  it('each framework has useCases array', () => {
    for (const key of Object.keys(FRAMEWORK_DESCRIPTIONS) as FrameworkType[]) {
      expect(FRAMEWORK_DESCRIPTIONS[key].useCases).toBeInstanceOf(Array);
      expect(FRAMEWORK_DESCRIPTIONS[key].useCases.length).toBeGreaterThan(0);
    }
  });
});

describe('SCENARIO_FRAMEWORK_MAP', () => {
  it('maps career_transition to TRIDENT as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['career_transition'];
    expect(mapping.primary).toBe('TRIDENT');
  });

  it('maps self_understanding to SHIFT as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['self_understanding'];
    expect(mapping.primary).toBe('SHIFT');
  });

  it('maps compensation_negotiation to CANVAS as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['compensation_negotiation'];
    expect(mapping.primary).toBe('CANVAS');
  });

  it('maps interview_prep to STAR as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['interview_prep'];
    expect(mapping.primary).toBe('STAR');
  });

  it('maps skill_development to GROWTH as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['skill_development'];
    expect(mapping.primary).toBe('GROWTH');
  });

  it('maps leadership_development to SCALE as primary', () => {
    const mapping = SCENARIO_FRAMEWORK_MAP['leadership_development'];
    expect(mapping.primary).toBe('SCALE');
  });

  it('all entries have primary and secondary arrays', () => {
    for (const key of Object.keys(SCENARIO_FRAMEWORK_MAP)) {
      const entry = SCENARIO_FRAMEWORK_MAP[key];
      expect(entry).toHaveProperty('primary');
      expect(entry).toHaveProperty('secondary');
      expect(Array.isArray(entry.secondary)).toBe(true);
    }
  });
});

describe('selectFramework', () => {
  it('selects TRIDENT for career_advisory intent', () => {
    const result = selectFramework('career_advisory', {});
    expect(result).toBe('TRIDENT');
  });

  it('selects SHIFT for self_understanding intent', () => {
    const result = selectFramework('self_understanding', {});
    expect(result).toBe('SHIFT');
  });

  it('selects CANVAS for compensation intent', () => {
    const result = selectFramework('compensation', {});
    expect(result).toBe('CANVAS');
  });

  it('selects GROWTH for skill_building intent', () => {
    const result = selectFramework('skill_building', {});
    expect(result).toBe('GROWTH');
  });

  it('selects TRIDENT when scenario is career_transition', () => {
    const result = selectFramework('career_advisory', { scenario: 'career_transition' });
    expect(result).toBe('TRIDENT');
  });

  it('selects SHIFT when scenario is self_understanding', () => {
    const result = selectFramework('career_advisory', { scenario: 'self_understanding' });
    expect(result).toBe('SHIFT');
  });

  it('selects CANVAS when scenario is compensation_negotiation', () => {
    const result = selectFramework('compensation', { scenario: 'compensation_negotiation' });
    expect(result).toBe('CANVAS');
  });

  it('selects STAR when scenario is interview_prep', () => {
    const result = selectFramework('career_advisory', { scenario: 'interview_prep' });
    expect(result).toBe('STAR');
  });

  it('selects GROWTH when scenario is skill_development', () => {
    const result = selectFramework('skill_building', { scenario: 'skill_development' });
    expect(result).toBe('GROWTH');
  });

  it('selects SCALE when scenario is leadership_development', () => {
    const result = selectFramework('coaching', { scenario: 'leadership_development' });
    expect(result).toBe('SCALE');
  });

  it('selects GROWTH for junior seniority', () => {
    const result = selectFramework('career_advisory', { seniority: 'junior' });
    expect(result).toBe('GROWTH');
  });

  it('selects SCALE for executive seniority', () => {
    const result = selectFramework('career_advisory', { seniority: 'executive' });
    expect(result).toBe('SCALE');
  });

  it('defaults to TRIDENT for unknown intent', () => {
    const result = selectFramework('unknown_intent', {});
    expect(result).toBe('TRIDENT');
  });

  it('scenario takes priority over seniority', () => {
    const result = selectFramework('career_advisory', {
      scenario: 'compensation_negotiation',
      seniority: 'executive',
    });
    expect(result).toBe('CANVAS');
  });
});

describe('getFrameworkPrompts', () => {
  it('returns prompts for each framework', () => {
    const frameworks: FrameworkType[] = ['TRIDENT', 'SHIFT', 'CANVAS', 'STAR', 'GROWTH', 'SCALE'];
    for (const fw of frameworks) {
      const prompts = getFrameworkPrompts(fw);
      expect(prompts).toHaveProperty('systemPrompt');
      expect(prompts).toHaveProperty('userPrompt');
      expect(prompts).toHaveProperty('followUpPrompts');
      expect(typeof prompts.systemPrompt).toBe('string');
      expect(typeof prompts.userPrompt).toBe('string');
      expect(Array.isArray(prompts.followUpPrompts)).toBe(true);
      expect(prompts.followUpPrompts.length).toBeGreaterThan(0);
    }
  });

  it('TRIDENT system prompt mentions Trajectory Reach Impact', () => {
    const prompts = getFrameworkPrompts('TRIDENT');
    expect(prompts.systemPrompt).toMatch(/Trajectory|Reach|Impact/i);
  });

  it('SHIFT system prompt mentions Strengths Motivations', () => {
    const prompts = getFrameworkPrompts('SHIFT');
    expect(prompts.systemPrompt).toMatch(/Strengths|Motivations|self/i);
  });

  it('CANVAS system prompt mentions compensation or negotiation', () => {
    const prompts = getFrameworkPrompts('CANVAS');
    expect(prompts.systemPrompt).toMatch(/compensation|negotiation|salary/i);
  });

  it('STAR system prompt mentions Situation Task Action Result', () => {
    const prompts = getFrameworkPrompts('STAR');
    expect(prompts.systemPrompt).toMatch(/Situation|Task|Action|Result/i);
  });

  it('GROWTH system prompt mentions Goals Gaps', () => {
    const prompts = getFrameworkPrompts('GROWTH');
    expect(prompts.systemPrompt).toMatch(/Goals|Gaps|skill/i);
  });

  it('SCALE system prompt mentions Strategy Communication Leadership', () => {
    const prompts = getFrameworkPrompts('SCALE');
    expect(prompts.systemPrompt).toMatch(/Strategy|Communication|Leadership/i);
  });

  it('userPrompt incorporates scenario context', () => {
    const prompts = getFrameworkPrompts('TRIDENT', { scenario: 'career_transition' });
    expect(prompts.userPrompt).toMatch(/career_transition/i);
  });

  it('followUpPrompts are framework-specific', () => {
    const tridentPrompts = getFrameworkPrompts('TRIDENT').followUpPrompts.join(' ');
    const shiftPrompts = getFrameworkPrompts('SHIFT').followUpPrompts.join(' ');
    expect(tridentPrompts).not.toBe(shiftPrompts);
  });
});

describe('getRecommendedFrameworks', () => {
  it('returns TRIDENT and SHIFT for career_advisory', () => {
    const result = getRecommendedFrameworks('career_advisory');
    expect(result).toContain('TRIDENT');
    expect(result).toContain('SHIFT');
  });

  it('returns SHIFT for self_understanding', () => {
    const result = getRecommendedFrameworks('self_understanding');
    expect(result).toContain('SHIFT');
  });

  it('returns CANVAS for compensation', () => {
    const result = getRecommendedFrameworks('compensation');
    expect(result).toContain('CANVAS');
  });

  it('returns GROWTH for skill_building', () => {
    const result = getRecommendedFrameworks('skill_building');
    expect(result).toContain('GROWTH');
  });

  it('returns default frameworks for unknown intent', () => {
    const result = getRecommendedFrameworks('unknown_intent');
    expect(result.length).toBeGreaterThan(0);
  });

  it('never returns empty array', () => {
    const intents = ['career_advisory', 'self_understanding', 'compensation', 'opportunity', 'coaching', 'unknown'];
    for (const intent of intents) {
      const result = getRecommendedFrameworks(intent);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
