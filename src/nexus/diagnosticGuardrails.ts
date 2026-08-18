/**
 * diagnosticGuardrails.ts — Diagnostic accuracy enforcement.
 *
 * Batch 2B / Ticket 5: Ensures all diagnostic references in NEXUS
 * responses match canon exactly. No invented dimensions, scores,
 * or descriptors. No score inflation or sugarcoating.
 */
import {
  APPROVED_DIAGNOSTICS,
  DIAGNOSTIC_MAP,
  getDiagnosticDescriptor,
  isApprovedDiagnostic,
} from '@/config/voiceStandard';
import { getInstrumentMileCost, INSTRUMENT_MILE_COST } from '@/config/miles';

export interface DiagnosticViolation {
  type: 'unknown_diagnostic' | 'wrong_descriptor' | 'wrong_mile_cost' | 'invented_dimension' | 'score_inflation';
  message: string;
  context: string;
}

export interface DiagnosticAuditResult {
  passed: boolean;
  violations: DiagnosticViolation[];
  diagnosticsReferenced: string[];
  summary: string;
}

/**
 * Extract all diagnostic codes mentioned in a text.
 */
export function extractDiagnosticReferences(text: string): string[] {
  const codes = APPROVED_DIAGNOSTICS.map((d) => d.code);
  const upper = text.toUpperCase();
  const found = new Set<string>();
  for (const code of codes) {
    // Match as a word boundary to avoid partial matches
    const re = new RegExp(`\\b${code}\\b`);
    if (re.test(upper)) {
      found.add(code);
    }
  }
  return [...found];
}

/**
 * Check if a text contains any diagnostic-like words that are NOT
 * in the approved list (potential invented diagnostics).
 */
export function detectInventedDiagnostics(text: string): string[] {
  // Common patterns that look like diagnostic names but aren't approved
  const suspiciousPatterns = [
    /\b([A-Z]{3,6})\s+(?:assessment|diagnostic|test|profile|instrument|framework)\b/g,
  ];
  const approved = new Set(APPROVED_DIAGNOSTICS.map((d) => d.code));
  const found: string[] = [];

  for (const re of suspiciousPatterns) {
    const matches = text.matchAll(re);
    for (const match of matches) {
      const code = match[1]?.toUpperCase();
      if (code && !approved.has(code)) {
        found.push(match[0]);
      }
    }
  }
  return found;
}

/**
 * Check descriptor accuracy — when a diagnostic is first mentioned,
 * its descriptor should match canon.
 */
export function checkDescriptorAccuracy(text: string): DiagnosticViolation[] {
  const violations: DiagnosticViolation[] = [];
  const upper = text.toUpperCase();

  for (const diag of APPROVED_DIAGNOSTICS) {
    // Find first mention of this diagnostic
    const re = new RegExp(`\\b${diag.code}\\b`, 'g');
    const match = re.exec(upper);
    if (!match) continue;

    // Check if a descriptor follows the code
    const afterCode = text.slice(match.index + diag.code.length, match.index + diag.code.length + 100);
    // If the text includes a descriptor-like phrase, check it matches
    if (afterCode.includes('—') || afterCode.includes('-')) {
      const descriptorPart = afterCode.split(/[—-]/)[1]?.trim().split(/[.,\n]/)[0]?.trim();
      if (descriptorPart && descriptorPart.length > 5) {
        // Allow partial match (canon descriptor might be paraphrased slightly)
        const canonLower = diag.descriptor.toLowerCase();
        const textLower = descriptorPart.toLowerCase();
        const words = canonLower.split(/\s+/);
        const overlap = words.filter((w) => textLower.includes(w)).length;
        if (overlap < Math.ceil(words.length * 0.5)) {
          violations.push({
            type: 'wrong_descriptor',
            message: `${diag.code} descriptor mismatch: expected "${diag.descriptor}", found "${descriptorPart}"`,
            context: afterCode.slice(0, 80),
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Check mile cost accuracy — if a response mentions a mile cost for
 * a diagnostic, it must match the canon value.
 */
export function checkMileCostAccuracy(text: string): DiagnosticViolation[] {
  const violations: DiagnosticViolation[] = [];
  const lower = text.toLowerCase();

  for (const [code, canonCost] of Object.entries(INSTRUMENT_MILE_COST)) {
    if (canonCost === 0) continue;

    // Look for patterns like "CPI costs 5 miles" or "5 miles for CPI"
    const patterns = [
      new RegExp(`${code}\\s*(?:costs?|is|requires?)\\s*(\\d+)\\s*miles?`, 'i'),
      new RegExp(`(\\d+)\\s*miles?\\s*(?:for|to take|to run)\\s*${code}`, 'i'),
    ];

    for (const re of patterns) {
      const match = text.match(re);
      if (match) {
        const statedCost = parseInt(match[1], 10);
        if (statedCost !== canonCost) {
          violations.push({
            type: 'wrong_mile_cost',
            message: `${code} mile cost mismatch: stated ${statedCost}, canon ${canonCost}`,
            context: match[0],
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Detect score inflation — phrases that sugarcoat or inflate results.
 */
export function detectScoreInflation(text: string): string[] {
  const inflationPatterns = [
    /\bexceptional\s+(?:score|result|performance)\b/i,
    /\boutstanding\s+(?:score|result|performance)\b/i,
    /\bperfect\s+(?:score|result)\b/i,
    /\btop\s+(?:1%|percent|tier)\b/i,
    /\bbest\s+(?:score|result|possible)\b/i,
    /\byou'?re\s+(?:a\s+)?(?:natural|born|exceptional)\s+leader\b/i,
    /\bremarkable\s+(?:strength|ability|talent)\b/i,
  ];
  const found: string[] = [];
  for (const re of inflationPatterns) {
    const match = text.match(re);
    if (match) found.push(match[0]);
  }
  return found;
}

/**
 * Full diagnostic accuracy audit.
 */
export function auditDiagnosticAccuracy(text: string): DiagnosticAuditResult {
  const violations: DiagnosticViolation[] = [];
  const referenced = extractDiagnosticReferences(text);

  // Check for invented diagnostics
  const invented = detectInventedDiagnostics(text);
  for (const inv of invented) {
    violations.push({
      type: 'invented_dimension',
      message: `Potential invented diagnostic: "${inv}"`,
      context: inv,
    });
  }

  // Check descriptor accuracy
  violations.push(...checkDescriptorAccuracy(text));

  // Check mile cost accuracy
  violations.push(...checkMileCostAccuracy(text));

  // Check for score inflation
  const inflation = detectScoreInflation(text);
  for (const phrase of inflation) {
    violations.push({
      type: 'score_inflation',
      message: `Score inflation detected: "${phrase}"`,
      context: phrase,
    });
  }

  const passed = violations.length === 0;
  const summary = passed
    ? `PASS — ${referenced.length} diagnostic(s) referenced, all accurate`
    : `FAIL — ${violations.length} violation(s) across ${referenced.length} diagnostic(s)`;

  return { passed, violations, diagnosticsReferenced: referenced, summary };
}

/**
 * Get the correct first-mention format for a diagnostic.
 * Format: "CODE — descriptor" (e.g., "LEAP — competitive positioning")
 */
export function formatFirstMention(code: string): string {
  const diag = getDiagnosticDescriptor(code);
  if (!diag) return code;
  return `${diag.fullName}`;
}

/**
 * Get the correct mile cost statement for a diagnostic.
 */
export function formatMileCostStatement(code: string): string {
  const cost = getInstrumentMileCost(code);
  if (cost === 0) return 'complimentary';
  return `${cost} ${cost === 1 ? 'mile' : 'miles'}`;
}
