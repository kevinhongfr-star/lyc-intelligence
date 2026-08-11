import type { SkipCondition, AnswerMap, ContextAnswerMap } from './types';

/**
 * #1323: Skip-rule evaluator.
 *
 * Pulls `key` from contextAnswers first (string match), then from answers
 * (scalar or array). Skips = returns `true` when the condition holds.
 *
 * Supports:
 *  - answerEquals  : scalar equality (numbers are compared numerically)
 *  - answerIn      : set-membership (useful for "any of these seniorities")
 *  - scoreGt/Lt    : numeric threshold comparisons (number answers only)
 *  - allOf/anyOf   : compositional and / or
 *  - neg           : not / inverse
 */
export function evaluateSkipCondition(
  condition: SkipCondition,
  answers: AnswerMap,
  contextAnswers: ContextAnswerMap,
): boolean {
  // ── atom lookups ─────────────────────────────────────────────────
  const lookup = (key: string): string | number | Array<number> | undefined => {
    if (Object.prototype.hasOwnProperty.call(contextAnswers, key)) return contextAnswers[key];
    if (Object.prototype.hasOwnProperty.call(answers, key)) return answers[key];
    return undefined;
  };
  const asNumber = (v: unknown): number | null => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const asStringSet = (v: unknown): Set<string> => {
    if (v == null) return new Set<string>();
    if (Array.isArray(v)) return new Set(v.map((x) => String(x)));
    return new Set([String(v)]);
  };

  // ── branches ─────────────────────────────────────────────────────
  if ('answerEquals' in condition) {
    const { key, value } = condition.answerEquals;
    const actual = lookup(key);
    if (actual === undefined) return false;
    if (typeof value === 'number') {
      return asNumber(actual) === value;
    }
    return asStringSet(actual).has(String(value));
  }

  if ('answerIn' in condition) {
    const { key, values } = condition.answerIn;
    const actual = lookup(key);
    if (actual === undefined) return false;
    const allowed = new Set(values.map((v) => (typeof v === 'number' ? v : String(v))));
    const actualSet = Array.isArray(actual) ? actual.map((x) => (typeof x === 'number' ? x : String(x))) : [actual];
    return actualSet.some((a) => allowed.has(a as any));
  }

  if ('scoreGt' in condition) {
    const n = asNumber(lookup(condition.scoreGt.key));
    return n != null && n > condition.scoreGt.threshold;
  }
  if ('scoreLt' in condition) {
    const n = asNumber(lookup(condition.scoreLt.key));
    return n != null && n < condition.scoreLt.threshold;
  }
  if ('allOf' in condition) return condition.allOf.every((c) => evaluateSkipCondition(c, answers, contextAnswers));
  if ('anyOf' in condition) return condition.anyOf.some((c) => evaluateSkipCondition(c, answers, contextAnswers));
  if ('neg' in condition) return !evaluateSkipCondition(condition.neg, answers, contextAnswers);

  return false;
}

/** Returns a filter function that, given a question list, yields only the
 *  questions the user should see given their current context + answers. */
export function filterApplicable(
  questions: Array<{ id: string; skipIf?: SkipCondition }>,
  answers: AnswerMap,
  contextAnswers: ContextAnswerMap,
) {
  return questions.filter((q) => !q.skipIf || !evaluateSkipCondition(q.skipIf, answers, contextAnswers));
}
