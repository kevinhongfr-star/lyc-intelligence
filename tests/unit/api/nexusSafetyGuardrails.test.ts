// @vitest-environment node

import { describe, expect, it } from 'vitest';

import {
  classifySafetyBoundary,
  getSafetyRedirection,
  assessModelConfidence,
  generateHumilityNote,
  SAFETY_BOUNDARY_PATTERNS,
  type SafetyBoundaryType,
} from '../../../api/_lib/nexusSafetyGuardrails.js';

describe('SAFETY_BOUNDARY_PATTERNS', () => {
  it('contains config for all boundary types', () => {
    const types = SAFETY_BOUNDARY_PATTERNS.map(p => p.type);
    expect(types).toEqual(expect.arrayContaining(['medical', 'legal', 'financial', 'illegal_unethical', 'relationship_advice']));
  });

  it('each config has keywords and patterns arrays', () => {
    for (const config of SAFETY_BOUNDARY_PATTERNS) {
      expect(config.keywords).toBeInstanceOf(Array);
      expect(config.keywords.length).toBeGreaterThan(0);
      expect(config.patterns).toBeInstanceOf(Array);
      expect(config.patterns.length).toBeGreaterThan(0);
    }
  });
});

describe('classifySafetyBoundary', () => {
  it('returns null for empty input', () => {
    expect(classifySafetyBoundary('')).toBeNull();
    expect(classifySafetyBoundary('   ')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(classifySafetyBoundary(null as any)).toBeNull();
    expect(classifySafetyBoundary(undefined as any)).toBeNull();
    expect(classifySafetyBoundary(123 as any)).toBeNull();
  });

  it('detects medical boundary - diagnosis', () => {
    expect(classifySafetyBoundary('Can you help me diagnose what rash I have?')).toBe('medical');
  });

  it('detects medical boundary - treatment', () => {
    expect(classifySafetyBoundary('What treatment should I take for my condition?')).toBe('medical');
  });

  it('detects medical boundary - cure', () => {
    expect(classifySafetyBoundary('How to cure this infection quickly?')).toBe('medical');
  });

  it('detects medical boundary - symptoms', () => {
    expect(classifySafetyBoundary('I have symptoms of diabetes, what should I do?')).toBe('medical');
  });

  it('detects legal boundary - lawsuit', () => {
    expect(classifySafetyBoundary('Should I file a lawsuit against my employer?')).toBe('legal');
  });

  it('detects legal boundary - attorney', () => {
    expect(classifySafetyBoundary('Can you recommend an attorney for my case?')).toBe('legal');
  });

  it('detects legal boundary - court', () => {
    expect(classifySafetyBoundary('I have to appear in court next week')).toBe('legal');
  });

  it('detects legal boundary - legal rights', () => {
    expect(classifySafetyBoundary('What are my legal rights in this situation?')).toBe('legal');
  });

  it('detects financial boundary - invest', () => {
    expect(classifySafetyBoundary('How should I invest my savings?')).toBe('financial');
  });

  it('detects financial boundary - retirement', () => {
    expect(classifySafetyBoundary('I need to plan for retirement, where should I put my money?')).toBe('financial');
  });

  it('detects financial boundary - crypto', () => {
    expect(classifySafetyBoundary('Is bitcoin a good investment right now?')).toBe('financial');
  });

  it('detects financial boundary - mortgage', () => {
    expect(classifySafetyBoundary('Should I get a mortgage or rent?')).toBe('financial');
  });

  it('detects illegal_unethical boundary - hacking', () => {
    expect(classifySafetyBoundary('How to hack into my ex\'s email account?')).toBe('illegal_unethical');
  });

  it('detects illegal_unethical boundary - forge', () => {
    expect(classifySafetyBoundary('Can you help me forge a signature on this document?')).toBe('illegal_unethical');
  });

  it('detects illegal_unethical boundary - steal', () => {
    expect(classifySafetyBoundary('How can I steal the code from my competitor?')).toBe('illegal_unethical');
  });

  it('detects illegal_unethical boundary - cheat', () => {
    expect(classifySafetyBoundary('Is there a way to cheat on this exam without getting caught?')).toBe('illegal_unethical');
  });

  it('detects illegal_unethical boundary - fake', () => {
    expect(classifySafetyBoundary('Make it look fake so no one will notice')).toBe('illegal_unethical');
  });

  it('detects relationship_advice boundary - breakup', () => {
    expect(classifySafetyBoundary('How to get over a breakup?')).toBe('relationship_advice');
  });

  it('detects relationship_advice boundary - divorce', () => {
    expect(classifySafetyBoundary('Should I divorce my wife?')).toBe('relationship_advice');
  });

  it('detects relationship_advice boundary - cheating', () => {
    expect(classifySafetyBoundary('My boyfriend is cheating on me, what should I do?')).toBe('relationship_advice');
  });

  it('detects relationship_advice boundary - partner', () => {
    expect(classifySafetyBoundary('How to deal with my partner\'s bad habits?')).toBe('relationship_advice');
  });

  it('returns out_of_scope for general career questions', () => {
    const result = classifySafetyBoundary('How can I improve my career prospects?');
    expect(result).toBe('out_of_scope');
  });

  it('returns out_of_scope for neutral questions', () => {
    const result = classifySafetyBoundary('What skills are valued in the workplace?');
    expect(result).toBe('out_of_scope');
  });

  it('detects boundary case-insensitively', () => {
    expect(classifySafetyBoundary('DIAGNOSIS please help')).toBe('medical');
    expect(classifySafetyBoundary('Lawsuit advice needed')).toBe('legal');
    expect(classifySafetyBoundary('INVEST in stocks')).toBe('financial');
  });

  it('detects medical with multi-word patterns', () => {
    expect(classifySafetyBoundary('What should I do for this severe pain in my chest?')).toBe('medical');
  });

  it('detects illegal with multi-word patterns', () => {
    expect(classifySafetyBoundary('How do I hack into a server?')).toBe('illegal_unethical');
  });

  it('detects relationship with multi-word patterns', () => {
    expect(classifySafetyBoundary('How to deal with my husband cheating?')).toBe('relationship_advice');
  });
});

describe('getSafetyRedirection', () => {
  it('returns a redirection message for each boundary type', () => {
    const types: SafetyBoundaryType[] = ['medical', 'legal', 'financial', 'illegal_unethical', 'relationship_advice', 'out_of_scope'];
    for (const t of types) {
      const msg = getSafetyRedirection(t);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it('medical redirection mentions not being a medical professional', () => {
    const msg = getSafetyRedirection('medical');
    expect(msg).toMatch(/not a medical professional/i);
  });

  it('legal redirection mentions not being a lawyer', () => {
    const msg = getSafetyRedirection('legal');
    expect(msg).toMatch(/not a lawyer|not a legal/i);
  });

  it('financial redirection mentions not being a financial advisor', () => {
    const msg = getSafetyRedirection('financial');
    expect(msg).toMatch(/not a licensed financial|not a financial advisor/i);
  });

  it('illegal_unethical redirection refuses assistance', () => {
    const msg = getSafetyRedirection('illegal_unethical');
    expect(msg).toMatch(/cannot assist|cannot help/i);
  });

  it('relationship_advice redirection suggests professional counseling', () => {
    const msg = getSafetyRedirection('relationship_advice');
    expect(msg).toMatch(/counselor|therapist|professional/i);
  });

  it('out_of_scope redirection returns to core expertise', () => {
    const msg = getSafetyRedirection('out_of_scope');
    expect(msg).toMatch(/career|professional/i);
  });

  it('falls back to out_of_scope for unknown types', () => {
    const msg = getSafetyRedirection('unknown_type' as SafetyBoundaryType);
    expect(msg).toBe(getSafetyRedirection('out_of_scope'));
  });
});

describe('assessModelConfidence', () => {
  it('returns default 50 for empty input', () => {
    expect(assessModelConfidence('')).toBe(50);
    expect(assessModelConfidence(null as any)).toBe(50);
  });

  it('scores high for overconfident language', () => {
    const text = 'Obviously this is the best approach. You must do this. I guarantee it will work. Everyone knows this.';
    const score = assessModelConfidence(text);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('scores lower for hedged language', () => {
    const text = 'Perhaps this might work. I think it could be helpful. It seems like a reasonable approach, possibly.';
    const score = assessModelConfidence(text);
    expect(score).toBeLessThan(70);
  });

  it('clamps score to 0 minimum', () => {
    const text = 'Maybe perhaps possibly I think it seems';
    const score = assessModelConfidence(text);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('clamps score to 100 maximum', () => {
    const text = 'Obviously clearly certainly definitely absolutely guarantee 100% will must always everyone knows';
    const score = assessModelConfidence(text);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('neutral text scores in middle range', () => {
    const text = 'Consider your options carefully and make a decision based on your circumstances.';
    const score = assessModelConfidence(text);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(90);
  });

  it('detects overconfidence markers - obviously', () => {
    const score = assessModelConfidence('Obviously this is the right answer.');
    expect(score).toBeGreaterThan(70);
  });

  it('detects overconfidence markers - guarantee', () => {
    const score = assessModelConfidence('I guarantee this will work perfectly.');
    expect(score).toBeGreaterThan(70);
  });

  it('detects overconfidence markers - you must', () => {
    const score = assessModelConfidence('You must do it this way. There is no other option.');
    expect(score).toBeGreaterThan(70);
  });

  it('detects hedging - maybe', () => {
    const score = assessModelConfidence('Maybe you could consider this approach.');
    expect(score).toBeLessThan(70);
  });

  it('detects hedging - i think', () => {
    const score = assessModelConfidence('I think this might work for you.');
    expect(score).toBeLessThan(70);
  });
});

describe('generateHumilityNote', () => {
  it('returns empty string for high confidence (>=70)', () => {
    expect(generateHumilityNote(70)).toBe('');
    expect(generateHumilityNote(80)).toBe('');
    expect(generateHumilityNote(100)).toBe('');
  });

  it('returns a note for moderate confidence (50-69)', () => {
    const note = generateHumilityNote(55);
    expect(note.length).toBeGreaterThan(0);
    expect(typeof note).toBe('string');
  });

  it('returns a note for low confidence (30-49)', () => {
    const note = generateHumilityNote(35);
    expect(note.length).toBeGreaterThan(0);
  });

  it('returns a note for very low confidence (<30)', () => {
    const note = generateHumilityNote(10);
    expect(note.length).toBeGreaterThan(0);
  });

  it('notes contain humility language', () => {
    const note = generateHumilityNote(40);
    expect(note).toMatch(/limitation|general|unique|individual|circumstances|context/i);
  });

  it('very low confidence still returns a valid humility note', () => {
    const moderate = generateHumilityNote(55);
    const veryLow = generateHumilityNote(10);
    expect(moderate.length).toBeGreaterThan(0);
    expect(veryLow.length).toBeGreaterThan(0);
  });

  it('returns empty string for exactly 70', () => {
    expect(generateHumilityNote(70)).toBe('');
  });
});
