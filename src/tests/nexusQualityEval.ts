/**
 * nexusQualityEval.ts — QA evaluation framework & test suite.
 *
 * Batch 2B / Ticket 8: 20+ evaluation prompts across personas and
 * scenarios, with golden responses and 8-dimension scoring.
 *
 * Run: npx tsx src/tests/nexusQualityEval.ts
 *
 * Test categories:
 *  1. Persona consistency (4 tests — one per persona)
 *  2. Lens introduction accuracy (3 tests)
 *  3. Soft gate handling (3 tests)
 *  4. Explorer onboarding (2 tests)
 *  5. Diagnostic accuracy (3 tests)
 *  6. Banned word detection (3 tests)
 *  7. Tone calibration (2 tests)
 *  8. Multi-lens transitions (2 tests)
 *  9. Edge cases (4 tests — user challenges, DEX AI, catalog request, tier question)
 */
import {
  QUALITY_DIMENSIONS,
  QUALITY_BAR,
  QUALITY_MAX,
  BANNED_WORDS,
  APPROVED_DIAGNOSTICS,
} from '../config/voiceStandard';
import { INSTRUMENT_MILE_COST, getInstrumentMileCost } from '../config/miles';
import { auditQuality } from '../nexus/qualityEnforcer';
import { auditBrandCompliance, containsTierNames, mentionsDexAI, containsCodenames, containsArchetypeLabels } from '../nexus/brandGuardrails';
import { auditDiagnosticAccuracy } from '../nexus/diagnosticGuardrails';

// ═══════════════════════════════════════════════════════════════════════
// Test case definitions
// ═══════════════════════════════════════════════════════════════════════

export interface EvalTestCase {
  id: string;
  category: string;
  prompt: string;
  /** Expected golden response (or key elements it must contain). */
  goldenResponse: string;
  /** Key assertions the response must pass. */
  assertions: Array<(response: string) => { pass: boolean; detail: string }>;
}

// ── 1. Persona consistency ─────────────────────────────────────────────

const personaTests: EvalTestCase[] = [
  {
    id: 'persona-guide-01',
    category: 'persona_consistency',
    prompt: 'I am not sure what my next career move should be.',
    goldenResponse: 'Guide persona: supportive, Socratic questioning, acknowledges before probing.',
    assertions: [
      (r) => ({ pass: r.includes('?'), detail: 'Guide should ask probing questions' }),
      (r) => ({ pass: r.length > 50, detail: 'Response should have substance' }),
      (r) => ({ pass: !r.toLowerCase().includes('i hope this helps'), detail: 'No AI-tells' }),
    ],
  },
  {
    id: 'persona-analyst-01',
    category: 'persona_consistency',
    prompt: 'Can you analyze my leadership profile results?',
    goldenResponse: 'Analyst persona: directive, data-driven, names patterns explicitly.',
    assertions: [
      (r) => ({ pass: !r.includes('!'), detail: 'No exclamation points' }),
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names' }),
    ],
  },
  {
    id: 'persona-strategist-01',
    category: 'persona_consistency',
    prompt: 'How do I position my company for the next 5 years?',
    goldenResponse: 'Strategist persona: strategic, big-picture, long-range planning, challenger questions.',
    assertions: [
      (r) => ({ pass: r.includes('?'), detail: 'Should ask strategic questions' }),
      (r) => ({ pass: containsCodenames(r).length === 0, detail: 'No internal codenames' }),
    ],
  },
  {
    id: 'persona-steward-01',
    category: 'persona_consistency',
    prompt: 'I want to develop my team over the long term.',
    goldenResponse: 'Steward persona: reflective, long-term, developmental arc.',
    assertions: [
      (r) => ({ pass: r.includes('?'), detail: 'Should ask reflective questions' }),
      (r) => ({ pass: containsArchetypeLabels(r).length === 0, detail: 'No archetype labels' }),
    ],
  },
];

// ── 2. Lens introduction accuracy ──────────────────────────────────────

const lensTests: EvalTestCase[] = [
  {
    id: 'lens-intro-01',
    category: 'lens_introduction',
    prompt: 'I want to understand my competitive position in the market.',
    goldenResponse: 'Should mention LEAP — competitive positioning with correct descriptor.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('LEAP'), detail: 'Should reference LEAP' }),
      (r) => ({ pass: r.toLowerCase().includes('competitive positioning'), detail: 'Should include descriptor "competitive positioning"' }),
    ],
  },
  {
    id: 'lens-intro-02',
    category: 'lens_introduction',
    prompt: 'How do people see my professional brand?',
    goldenResponse: 'Should mention PRISM — professional branding.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('PRISM'), detail: 'Should reference PRISM' }),
      (r) => ({ pass: r.toLowerCase().includes('professional branding'), detail: 'Should include descriptor' }),
    ],
  },
  {
    id: 'lens-intro-03',
    category: 'lens_introduction',
    prompt: 'I need to assess my AI readiness as a leader.',
    goldenResponse: 'Should mention SPARK — AI leadership readiness.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('SPARK'), detail: 'Should reference SPARK' }),
      (r) => ({ pass: r.toLowerCase().includes('ai leadership readiness'), detail: 'Should include descriptor' }),
    ],
  },
];

// ── 3. Soft gate handling ──────────────────────────────────────────────

const softGateTests: EvalTestCase[] = [
  {
    id: 'softgate-01',
    category: 'soft_gate',
    prompt: 'Can I run the CPI assessment?',
    goldenResponse: 'Soft gate: acknowledge, state value, offer alternative, no tier names.',
    assertions: [
      (r) => {
        const tiers = containsTierNames(r);
        return { pass: tiers.length === 0, detail: `Should not mention tier names: ${tiers.join(', ')}` };
      },
      (r) => ({ pass: !r.toLowerCase().includes("you can't"), detail: 'Should not say "you can\'t"' }),
      (r) => ({ pass: r.toLowerCase().includes('alternative') || r.toLowerCase().includes('directional') || r.toLowerCase().includes('instead'), detail: 'Should offer an alternative' }),
    ],
  },
  {
    id: 'softgate-02',
    category: 'soft_gate',
    prompt: 'I want to do all the assessments at once.',
    goldenResponse: 'Should not hard-block. Offer what is available, mention mile costs.',
    assertions: [
      (r) => ({ pass: !r.toLowerCase().includes('error'), detail: 'Should not show error' }),
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names' }),
    ],
  },
  {
    id: 'softgate-03',
    category: 'soft_gate',
    prompt: 'What if I need more miles?',
    goldenResponse: 'Should point to upgrade path without naming tiers or being salesy.',
    assertions: [
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names' }),
      (r) => ({ pass: !r.toLowerCase().includes('buy now') && !r.toLowerCase().includes('upgrade now'), detail: 'No sales pressure' }),
    ],
  },
];

// ── 4. Explorer onboarding ─────────────────────────────────────────────

const explorerTests: EvalTestCase[] = [
  {
    id: 'explorer-01',
    category: 'explorer_onboarding',
    prompt: 'What assessments do I have access to?',
    goldenResponse: 'Should mention LEAP and PRISM as complimentary, no miles required.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('LEAP'), detail: 'Should mention LEAP' }),
      (r) => ({ pass: r.toUpperCase().includes('PRISM'), detail: 'Should mention PRISM' }),
      (r) => ({ pass: r.toLowerCase().includes('complimentary') || !r.toLowerCase().includes('free'), detail: 'Should say "complimentary" not "free"' }),
    ],
  },
  {
    id: 'explorer-02',
    category: 'explorer_onboarding',
    prompt: 'I already did LEAP and PRISM, what else can I do?',
    goldenResponse: 'Should soft gate — no more complimentary tokens, point to expanded access.',
    assertions: [
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names' }),
      (r) => ({ pass: !r.toLowerCase().includes("you can't"), detail: 'No hard block' }),
    ],
  },
];

// ── 5. Diagnostic accuracy ─────────────────────────────────────────────

const diagnosticTests: EvalTestCase[] = [
  {
    id: 'diag-accuracy-01',
    category: 'diagnostic_accuracy',
    prompt: 'How much does CPI cost in miles?',
    goldenResponse: 'Should state 5 miles for CPI.',
    assertions: [
      (r) => ({ pass: r.includes('5') && r.toLowerCase().includes('miles'), detail: 'Should state 5 miles' }),
    ],
  },
  {
    id: 'diag-accuracy-02',
    category: 'diagnostic_accuracy',
    prompt: 'What does FORGE measure?',
    goldenResponse: 'Should say "sales excellence capability" — the canon descriptor.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('FORGE'), detail: 'Should reference FORGE' }),
      (r) => ({ pass: r.toLowerCase().includes('sales excellence'), detail: 'Should include canon descriptor' }),
    ],
  },
  {
    id: 'diag-accuracy-03',
    category: 'diagnostic_accuracy',
    prompt: 'Tell me about the MOSAIC diagnostic.',
    goldenResponse: 'Should say "institutional trust and relationship velocity".',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('MOSAIC'), detail: 'Should reference MOSAIC' }),
      (r) => ({ pass: r.toLowerCase().includes('institutional trust'), detail: 'Should include canon descriptor' }),
    ],
  },
];

// ── 6. Banned word detection ───────────────────────────────────────────

const bannedWordTests: EvalTestCase[] = [
  {
    id: 'banned-01',
    category: 'banned_words',
    prompt: 'Tell me about your platform.',
    goldenResponse: 'Should not use "platform" — should use "tool", "assessment", or "diagnostic".',
    assertions: [
      (r) => {
        const audit = auditBrandCompliance(r);
        const hasPlatform = audit.hardViolations.some(v => v.word === 'platform') || audit.softFlags.some(v => v.word === 'platform');
        return { pass: !hasPlatform, detail: 'Should not use "platform"' };
      },
    ],
  },
  {
    id: 'banned-02',
    category: 'banned_words',
    prompt: 'Is this service free?',
    goldenResponse: 'Should not use "free" — should use "complimentary".',
    assertions: [
      (r) => {
        const audit = auditBrandCompliance(r);
        const hasFree = audit.hardViolations.some(v => v.word === 'free');
        return { pass: !hasFree, detail: 'Should not use "free"' };
      },
    ],
  },
  {
    id: 'banned-03',
    category: 'banned_words',
    prompt: 'Can you leverage your framework to help me?',
    goldenResponse: 'Should not use "leverage" or "framework".',
    assertions: [
      (r) => {
        const audit = auditBrandCompliance(r);
        const hasBanned = audit.hardViolations.some(v => v.word === 'leverage' || v.word === 'framework');
        return { pass: !hasBanned, detail: 'Should not use "leverage" or "framework"' };
      },
    ],
  },
];

// ── 7. Tone calibration ────────────────────────────────────────────────

const toneTests: EvalTestCase[] = [
  {
    id: 'tone-01',
    category: 'tone_calibration',
    prompt: 'I am feeling lost in my career.',
    goldenResponse: 'Should be empathetic but professional. No casual language, no exclamation points.',
    assertions: [
      (r) => ({ pass: !r.includes('!'), detail: 'No exclamation points' }),
      (r) => ({ pass: !r.toLowerCase().includes('hey') && !r.toLowerCase().includes('cool'), detail: 'No casual language' }),
    ],
  },
  {
    id: 'tone-02',
    category: 'tone_calibration',
    prompt: 'I think I am ready for a CEO role.',
    goldenResponse: 'Should be direct, probe assumptions, not flattering.',
    assertions: [
      (r) => ({ pass: !r.toLowerCase().includes('amazing') && !r.toLowerCase().includes('awesome'), detail: 'No flattery' }),
      (r) => ({ pass: r.includes('?'), detail: 'Should probe with questions' }),
    ],
  },
];

// ── 8. Multi-lens transitions ──────────────────────────────────────────

const multiLensTests: EvalTestCase[] = [
  {
    id: 'multilens-01',
    category: 'multi_lens',
    prompt: 'I want to understand both my competitive position and my professional brand.',
    goldenResponse: 'Should mention both LEAP and PRISM, state combined cost.',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('LEAP'), detail: 'Should mention LEAP' }),
      (r) => ({ pass: r.toUpperCase().includes('PRISM'), detail: 'Should mention PRISM' }),
      (r) => ({ pass: r.includes('6') || r.toLowerCase().includes('combined'), detail: 'Should mention combined cost (3+3=6)' }),
    ],
  },
  {
    id: 'multilens-02',
    category: 'multi_lens',
    prompt: 'Can I do SPARK and FORGE together?',
    goldenResponse: 'Should mention combined cost (1+3=4 miles).',
    assertions: [
      (r) => ({ pass: r.toUpperCase().includes('SPARK'), detail: 'Should mention SPARK' }),
      (r) => ({ pass: r.toUpperCase().includes('FORGE'), detail: 'Should mention FORGE' }),
    ],
  },
];

// ── 9. Edge cases ──────────────────────────────────────────────────────

const edgeCaseTests: EvalTestCase[] = [
  {
    id: 'edge-01',
    category: 'edge_case',
    prompt: 'Are you an AI?',
    goldenResponse: 'Should not say "as an AI" or "I am a language model". Redirect to coaching.',
    assertions: [
      (r) => ({ pass: !r.toLowerCase().includes('as an ai'), detail: 'Should not say "as an AI"' }),
      (r) => ({ pass: !r.toLowerCase().includes('language model'), detail: 'Should not say "language model"' }),
    ],
  },
  {
    id: 'edge-02',
    category: 'edge_case',
    prompt: 'What is DEX AI?',
    goldenResponse: 'Should not mention DEX AI unless directly asked (which it is here). Brief redirect.',
    assertions: [
      (r) => ({ pass: r.length > 20, detail: 'Should provide a brief response' }),
    ],
  },
  {
    id: 'edge-03',
    category: 'edge_case',
    prompt: 'Show me all your assessments and prices.',
    goldenResponse: 'Should not present a catalog. NEXUS recommends based on conversation.',
    assertions: [
      (r) => ({ pass: !r.toLowerCase().includes('catalog'), detail: 'Should not present catalog' }),
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names' }),
    ],
  },
  {
    id: 'edge-04',
    category: 'edge_case',
    prompt: 'What tier am I on?',
    goldenResponse: 'Should redirect to platform/account, not discuss tiers in chat.',
    assertions: [
      (r) => ({ pass: containsTierNames(r).length === 0, detail: 'No tier names in response' }),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════
// All test cases
// ═══════════════════════════════════════════════════════════════════════

export const ALL_TEST_CASES: EvalTestCase[] = [
  ...personaTests,
  ...lensTests,
  ...softGateTests,
  ...explorerTests,
  ...diagnosticTests,
  ...bannedWordTests,
  ...toneTests,
  ...multiLensTests,
  ...edgeCaseTests,
];

// ═══════════════════════════════════════════════════════════════════════
// Scoring implementation
// ═══════════════════════════════════════════════════════════════════════

export interface EvalResult {
  testCaseId: string;
  category: string;
  prompt: string;
  response: string;
  assertionsPassed: number;
  assertionsTotal: number;
  qualityScore: number;
  brandPassed: boolean;
  diagnosticPassed: boolean;
  overallPass: boolean;
  details: string[];
}

/**
 * Score a response against a test case.
 */
export function scoreResponse(testCase: EvalTestCase, response: string): EvalResult {
  const details: string[] = [];
  let assertionsPassed = 0;

  for (const assertion of testCase.assertions) {
    const result = assertion(response);
    if (result.pass) {
      assertionsPassed++;
    } else {
      details.push(`FAIL: ${result.detail}`);
    }
  }

  const quality = auditQuality(response);
  const brand = auditBrandCompliance(response);
  const diagnostic = auditDiagnosticAccuracy(response);

  const overallPass = assertionsPassed === testCase.assertions.length
    && quality.passes
    && brand.passed;

  return {
    testCaseId: testCase.id,
    category: testCase.category,
    prompt: testCase.prompt,
    response,
    assertionsPassed,
    assertionsTotal: testCase.assertions.length,
    qualityScore: quality.overall,
    brandPassed: brand.passed,
    diagnosticPassed: diagnostic.passed,
    overallPass,
    details,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Test runner (for manual execution)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Run the full evaluation suite against a set of responses.
 * The responses must be provided (from NEXUS chat or mock).
 */
export function runEvalSuite(
  responses: Record<string, string>,
): { results: EvalResult[]; summary: string; passRate: number; avgQuality: number } {
  const results: EvalResult[] = [];

  for (const testCase of ALL_TEST_CASES) {
    const response = responses[testCase.id] ?? '[NO RESPONSE]';
    results.push(scoreResponse(testCase, response));
  }

  const passed = results.filter((r) => r.overallPass).length;
  const passRate = (passed / results.length) * 100;
  const avgQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;

  const summary = `${passed}/${results.length} passed (${passRate.toFixed(0)}%). Avg quality: ${avgQuality.toFixed(1)}/${QUALITY_MAX}`;

  return { results, summary, passRate, avgQuality };
}

// ═══════════════════════════════════════════════════════════════════════
// Config verification tests (runnable without LLM responses)
// ═══════════════════════════════════════════════════════════════════════

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, detail?: string) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ FAIL: ' + name + (detail ? ' — ' + detail : '')); }
}

function runConfigTests() {
  console.log('\n═══════════════════════════════════════════');
  console.log('NEXUS QUALITY EVAL — Config Verification');
  console.log('═══════════════════════════════════════════\n');

  // ── Quality dimensions ──
  console.log('--- Quality Dimensions ---');
  assert('8 quality dimensions defined', QUALITY_DIMENSIONS.length === 8);
  const totalWeight = QUALITY_DIMENSIONS.reduce((s, d) => s + d.weight, 0);
  assert('Weights sum to 100', totalWeight === 100, `got ${totalWeight}`);
  assert('Quality bar = 3.8', QUALITY_BAR === 3.8);
  assert('Quality max = 5.0', QUALITY_MAX === 5.0);

  // Verify dimension IDs match spec
  const expectedIds = ['canon_alignment', 'coach_presence', 'insight_quality', 'question_quality', 'structural_clarity', 'appropriate_depth', 'diagnostic_accuracy', 'brand_compliance'];
  for (const id of expectedIds) {
    assert(`Dimension "${id}" exists`, QUALITY_DIMENSIONS.some(d => d.id === id));
  }

  // ── Banned words ──
  console.log('\n--- Banned Words ---');
  const bannedWordList = BANNED_WORDS.map(w => w.word);
  const requiredBanned = ['free', 'framework', 'platform', 'leverage', 'synergy', 'navigate', 'disrupt', 'flywheel', 'funnel', 'signals', 'stages', 'taxonomy', 'architecture', 'architect', 'warrior', 'hunt', 'war', 'force', 'quiet', 'burn', 'ignite', 'flame', 'forced', 'forcing'];
  for (const word of requiredBanned) {
    assert(`"${word}" is banned`, bannedWordList.includes(word));
  }

  // ── Approved diagnostics ──
  console.log('\n--- Approved Diagnostics ---');
  assert('11 approved diagnostics', APPROVED_DIAGNOSTICS.length === 11, `got ${APPROVED_DIAGNOSTICS.length}`);
  const requiredDiag = ['SPARK', 'PRISM', 'MOSAIC', 'BRIDGE', 'IMPACT', 'DRIVE', 'FORGE', 'LEAP', 'QUEST', 'COACH', 'CPI'];
  for (const code of requiredDiag) {
    assert(`Diagnostic "${code}" in approved list`, APPROVED_DIAGNOSTICS.some(d => d.code === code));
  }
  // Codenames must NOT be in approved diagnostics list
  assert('Codename SHIFT not in approved list', !APPROVED_DIAGNOSTICS.some(d => d.code === 'SHIFT'));
  assert('Codename CANVAS not in approved list', !APPROVED_DIAGNOSTICS.some(d => d.code === 'CANVAS'));

  // ── Mile cost accuracy ──
  console.log('\n--- Mile Cost Accuracy ---');
  assert('SPARK = 1 mile', getInstrumentMileCost('SPARK') === 1);
  assert('PRISM = 2 miles', getInstrumentMileCost('PRISM') === 2);
  assert('FORGE = 3 miles', getInstrumentMileCost('FORGE') === 3);
  assert('CPI = 5 miles', getInstrumentMileCost('CPI') === 5);
  assert('COACH = 1 mile', getInstrumentMileCost('COACH') === 1);

  // ── Eval test cases ──
  console.log('\n--- Eval Test Cases ---');
  assert('20+ eval test cases', ALL_TEST_CASES.length >= 20, `got ${ALL_TEST_CASES.length}`);

  // Category coverage
  const categories = new Set(ALL_TEST_CASES.map(t => t.category));
  const requiredCategories = ['persona_consistency', 'lens_introduction', 'soft_gate', 'explorer_onboarding', 'diagnostic_accuracy', 'banned_words', 'tone_calibration', 'multi_lens', 'edge_case'];
  for (const cat of requiredCategories) {
    assert(`Category "${cat}" has test cases`, categories.has(cat));
  }

  // ── Quality audit on sample responses ──
  console.log('\n--- Quality Audit (sample responses) ---');

  // Good response
  const goodResponse = 'The pattern you are describing connects to how you position yourself competitively. LEAP — competitive positioning would give us a structured read on this. It costs 3 miles. Want me to run it?';
  const goodAudit = auditQuality(goodResponse);
  assert('Good response passes quality bar', goodAudit.passes, goodAudit.summary);

  // Bad response (AI-tell)
  const badResponse = "I hope this helps! Let me know if you need anything else. Feel free to ask!";
  const badAudit = auditQuality(badResponse);
  assert('Bad response (AI-tells) fails quality bar', !badAudit.passes, badAudit.summary);

  // ── Brand compliance on sample ──
  console.log('\n--- Brand Compliance (sample responses) ---');
  const compliantResponse = 'Your competitive position is worth examining structurally. LEAP would give us that read.';
  const compliantAudit = auditBrandCompliance(compliantResponse);
  assert('Compliant response passes brand audit', compliantAudit.passed, compliantAudit.summary);

  const nonCompliantResponse = 'Our platform leverages a great framework to help you navigate your career. It is free!';
  const nonCompliantAudit = auditBrandCompliance(nonCompliantResponse);
  assert('Non-compliant response fails brand audit', !nonCompliantAudit.passed, nonCompliantAudit.summary);

  // ── Diagnostic accuracy on sample ──
  console.log('\n--- Diagnostic Accuracy (sample responses) ---');
  const accurateResponse = 'FORGE — sales excellence capability measures your sales leadership readiness. It costs 3 miles.';
  const accurateAudit = auditDiagnosticAccuracy(accurateResponse);
  assert('Accurate diagnostic response passes', accurateAudit.passed, accurateAudit.summary);

  // ── Banned word coverage ──
  console.log('\n--- Banned Word Coverage ---');
  const testBannedText = 'This platform uses leverage within a framework to navigate your career. It is free and seamless!';
  const bannedAudit = auditBrandCompliance(testBannedText);
  assert('Banned text detected: platform', bannedAudit.hardViolations.some(v => v.word === 'platform'));
  assert('Banned text detected: leverage', bannedAudit.hardViolations.some(v => v.word === 'leverage'));
  assert('Banned text detected: framework', bannedAudit.hardViolations.some(v => v.word === 'framework'));
  assert('Banned text detected: free', bannedAudit.hardViolations.some(v => v.word === 'free'));
  assert('Banned text detected: seamless', bannedAudit.hardViolations.some(v => v.word === 'seamless'));

  // ── Tier name suppression ──
  console.log('\n--- Tier Name Suppression ---');
  assert('Tier name "Starter tier" detected', containsTierNames('You are on the Starter tier').length > 0);
  assert('No tier names in clean text', containsTierNames('Your access level is configured').length === 0);

  // ── DEX AI suppression ──
  console.log('\n--- DEX AI Suppression ---');
  assert('DEX AI mention detected', mentionsDexAI('DEX AI is a great tool'));
  assert('No DEX AI in clean text', !mentionsDexAI('Let us explore your options'));

  // ── Codename suppression ──
  console.log('\n--- Codename Suppression ---');
  assert('Codename TRIDENT detected', containsCodenames('The TRIDENT method shows').includes('TRIDENT'));
  assert('Codename SHIFT detected', containsCodenames('SHIFT is a composite').includes('SHIFT'));
  assert('No codenames in clean text', containsCodenames('The composite analysis shows').length === 0);

  // ── Archetype label suppression ──
  console.log('\n--- Archetype Label Suppression ---');
  assert('Archetype "The Architect" detected', containsArchetypeLabels('You are The Architect').length > 0);
  assert('Archetype "The Pioneer" detected', containsArchetypeLabels('You are The Pioneer').length > 0);
  assert('No archetypes in clean text', containsArchetypeLabels('You tend toward strategic thinking').length === 0);

  // ── Summary ──
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`NEXUS QUALITY EVAL: ${pass} passed · ${fail} FAILED`);
  console.log(`Test cases: ${ALL_TEST_CASES.length} across ${categories.size} categories`);
  console.log(`═══════════════════════════════════════════`);
  process.exit(fail > 0 ? 1 : 0);
}

// Run if executed directly (ESM-compatible)
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  runConfigTests();
}
