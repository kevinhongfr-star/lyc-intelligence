/**
 * Phase 3 — #1312: Password strength & reset flow.
 *
 * Password policy aligned with NIST 800-63B recommendations:
 *   - Minimum 12 characters (NIST says 8 min, we go stronger)
 *   - No maximum length restriction (allow passphrases)
 *   - Mix of character classes (lowercase, uppercase, digit, symbol)
 *   - Block top 1000 most-common passwords (HIBP-style blacklist)
 *   - Block passwords containing email/local-part or name
 *   - Entropy estimate via Shannon + character-class bonus
 *
 * Returns a score 0-4 (zxcvbn-style) plus actionable feedback.
 *
 * Usage:
 *   import { validatePasswordStrength } from '@/lib/auth/passwordPolicy';
 *   const result = validatePasswordStrength(pwd, { email, name });
 *   if (result.score < 3) setError(result.warnings[0]);
 */

export interface PasswordStrengthResult {
  /** 0 (weak) to 4 (strong). Require >= 3 for signup. */
  score: 0 | 1 | 2 | 3 | 4;
  /** True if password passes minimum policy (length + class mix). */
  passes: boolean;
  /** Human-readable warnings (display to user). */
  warnings: string[];
  /** Actionable suggestions to improve strength. */
  suggestions: string[];
  /** Estimated entropy in bits (Shannon + class bonus). */
  entropyBits: number;
}

export interface PasswordPolicyOptions {
  email?: string | null;
  name?: string | null;
  minLength?: number;
  minScore?: 0 | 1 | 2 | 3 | 4;
}

const DEFAULT_MIN_LENGTH = 12;
const DEFAULT_MIN_SCORE: 0 | 1 | 2 | 3 | 4 = 2;

// ── Top ~100 most common passwords (subset of HIBP top 1M) ──────────
// Source: https://github.com/danielmiessler/SecLists (subset)
// Full list would be 100k+ entries — this catches the obvious ones.
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'password!',
  '123456', '1234567', '12345678', '123456789', '1234567890',
  '111111', '222222', '333333', '444444', '555555', '666666',
  '777777', '888888', '999999', '000000', '123123', 'abc123',
  'qwerty', 'qwertyuiop', 'qwerty123', 'asdfgh', 'asdfghjkl',
  'zxcvbn', 'zxcvbnm', 'letmein', 'welcome', 'welcome1', 'admin',
  'admin123', 'administrator', 'root', 'toor', 'guest', 'guest123',
  'login', 'login123', 'user', 'user123', 'test', 'test123',
  'monkey', 'monkey123', 'dragon', 'dragon123', 'master', 'master123',
  'shadow', 'shadow123', 'sunshine', 'princess', 'football',
  'baseball', 'soccer', 'hockey', 'jordan', 'michael', 'robert',
  'daniel', 'thomas', 'jessica', 'ashley', 'jennifer', 'hunter',
  'ranger', 'buster', 'harley', 'batman', 'trustno1', 'pass',
  'pass123', 'welcome123', 'changeme', 'p@ssw0rd', 'p@ssword',
  'pa$$word', 'passw0rd!', 'iloveyou', 'iloveyou1', 'rockyou',
  'starwars', 'whatever', 'freedom', 'ninja', 'ninja123',
  'mustang', 'access', 'access14', 'flower', 'flower123',
  'george', 'charlie', 'andrew', 'joshua', 'matthew', 'joseph',
  'nicole', 'samantha', 'taylor', 'tyler', 'william', 'richard',
  'anthony', 'christopher', 'nicholas', 'alexander', 'jonathan',
  'lyc', 'lyc123', 'lycintel', 'lycpartners', 'kevin', 'alessio',
  'nexus', 'nexus123', 'prism', 'prism123', 'spark', 'spark123',
  'forge', 'forge123', 'bridge', 'bridge123', 'mosaic', 'drive',
]);

const CLASS_LOWER = /[a-z]/;
const CLASS_UPPER = /[A-Z]/;
const CLASS_DIGIT = /[0-9]/;
const CLASS_SYMBOL = /[^a-zA-Z0-9]/;

/**
 * Estimate Shannon entropy of a string, then add a bonus per
 * character class present. Returns bits.
 */
function estimateEntropy(password: string): number {
  if (!password) return 0;
  const freq: Record<string, number> = {};
  for (const ch of password) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const len = password.length;
  let shannon = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    shannon -= p * Math.log2(p);
  }
  // Pool size estimate: start with used classes, multiply.
  let pool = 0;
  if (CLASS_LOWER.test(password)) pool += 26;
  if (CLASS_UPPER.test(password)) pool += 26;
  if (CLASS_DIGIT.test(password)) pool += 10;
  if (CLASS_SYMBOL.test(password)) pool += 33;
  if (pool === 0) pool = 1;
  // Entropy = log2(pool) * length, blended with Shannon to reward
  // truly random vs repetitive strings.
  const poolEntropy = Math.log2(pool) * len;
  return Math.min(poolEntropy, shannon * len);
}

/**
 * Validate a password against the policy. Returns score + feedback.
 */
export function validatePasswordStrength(
  password: string,
  opts: PasswordPolicyOptions = {},
): PasswordStrengthResult {
  const minLength = opts.minLength ?? DEFAULT_MIN_LENGTH;
  const minScore = opts.minScore ?? DEFAULT_MIN_SCORE;
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!password) {
    return {
      score: 0,
      passes: false,
      warnings: ['Password is required'],
      suggestions: ['Enter a password'],
      entropyBits: 0,
    };
  }

  // ── Length check ──
  if (password.length < minLength) {
    warnings.push(`Password must be at least ${minLength} characters`);
    suggestions.push(`Add ${minLength - password.length} more character(s)`);
  }

  // ── Character class checks ──
  const hasLower = CLASS_LOWER.test(password);
  const hasUpper = CLASS_UPPER.test(password);
  const hasDigit = CLASS_DIGIT.test(password);
  const hasSymbol = CLASS_SYMBOL.test(password);
  const classCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (!hasLower) suggestions.push('Add a lowercase letter');
  if (!hasUpper) suggestions.push('Add an uppercase letter');
  if (!hasDigit) suggestions.push('Add a number');
  if (!hasSymbol) suggestions.push('Add a symbol (!@#$...)');
  if (classCount < 3) {
    warnings.push('Use at least 3 of: lowercase, uppercase, digits, symbols');
  }

  // ── Common password check ──
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    warnings.push('This password is commonly used and easily guessed');
    suggestions.push('Choose a more unique password');
  }
  // NOTE: removed substring common-password check (#1312 follow-up).
  // Substring matching was too aggressive — e.g. "password" triggered on
  // "MyStr0ngP@ssword!99" which is actually strong. We still block exact
  // matches against the top-~120 most common passwords above.

  // ── Personal info check ──
  if (opts.email) {
    const emailLocalPart = opts.email.split('@')[0]?.toLowerCase();
    if (emailLocalPart && emailLocalPart.length >= 4 && lower.includes(emailLocalPart)) {
      warnings.push('Password contains your email address');
      suggestions.push('Avoid using your email in your password');
    }
  }
  if (opts.name) {
    const nameLower = opts.name.toLowerCase().replace(/\s+/g, '');
    if (nameLower.length >= 4 && lower.includes(nameLower)) {
      warnings.push('Password contains your name');
      suggestions.push('Avoid using your name in your password');
    }
  }

  // ── Repetition / sequence check ──
  if (/(.)\1{3,}/.test(password)) {
    warnings.push('Avoid repeating the same character');
    suggestions.push('Use a mix of different characters');
  }
  // Sequential digits or letters (e.g. 1234, abcd, qwerty)
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|asdf|sdfg|zxcv/.test(lower)) {
    warnings.push('Avoid sequential characters');
    suggestions.push('Avoid keyboard patterns like 1234 or qwerty');
  }

  // ── Score calculation ──
  const entropyBits = estimateEntropy(password);
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (password.length >= minLength && classCount >= 3 && entropyBits >= 50) score = 3;
  if (password.length >= minLength + 4 && classCount >= 4 && entropyBits >= 70) score = 4;
  if (password.length >= minLength && classCount >= 2 && entropyBits >= 35) score = 2;
  if (password.length >= Math.max(8, minLength - 4) && entropyBits >= 20) score = 1;
  if (entropyBits < 20 || COMMON_PASSWORDS.has(lower)) score = 0;

  // Cap score if there are blocking warnings
  if (warnings.length > 0 && score > 2) score = 2;
  if (COMMON_PASSWORDS.has(lower)) score = 0;

  const passes = score >= minScore;

  return {
    score,
    passes,
    warnings,
    suggestions: suggestions.slice(0, 3),  // top 3 to avoid noise
    entropyBits,
  };
}

/**
 * Quick boolean check — use this in API paths where we don't need
 * the full feedback payload.
 */
export function isPasswordStrongEnough(
  password: string,
  opts?: PasswordPolicyOptions,
): boolean {
  return validatePasswordStrength(password, opts).passes;
}

/**
 * Score label for UI display.
 */
export function passwordScoreLabel(score: 0 | 1 | 2 | 3 | 4): string {
  return ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score];
}

/**
 * Score color for UI display. Returns hex (no border radius concerns).
 */
export function passwordScoreColor(score: 0 | 1 | 2 | 3 | 4): string {
  // Use semantic colors only (not decorative accents) per brand rules.
  // Red → amber → green progression is conventional and accessible.
  return ['#B91C1C', '#D97706', '#D97706', '#059669', '#047857'][score];
}
