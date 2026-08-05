/**
 * B2C v1 rate limiters — per M4 security spec.
 *
 * | Endpoint group         | Limit          | Window   | Rationale
 * |------------------------|----------------|----------|------------------------------------------------
 * | chat.post              | 20 / user      | 1 min    | Generative LLM cost + human cadence ceiling
 * | chat.read              | 100 / user     | 1 min    | Conversation list / history read-heavy
 * | assessments.submit     | 5 / user       | 1 day    | Expensive scoring; avoid replay churn
 * | assessments.read       | 60 / user      | 1 min    | Wizards poll state frequently
 * | scores.compute         | 10 / user      | 1 day    | TRIDENT/CANVAS are heavyweight
 * | credits.write          | 5 / user       | 1 min    | Checkout / portal creation (Stripe is the limit)
 * | generic.read           | 300 / user     | 5 min    | Everything else GET (journey, profile, suggestions)
 * | generic.write          | 100 / user     | 1 min    | Everything else POST/PATCH/DELETE
 */

import { createRateLimiter } from '../rateLimit.js';

export const b2cChatPostLimiter = createRateLimiter(20, 60 * 1000);
export const b2cChatReadLimiter = createRateLimiter(100, 60 * 1000);
export const b2cAssessmentsSubmitLimiter = createRateLimiter(5, 24 * 60 * 60 * 1000);
export const b2cAssessmentsReadLimiter = createRateLimiter(60, 60 * 1000);
export const b2cScoresComputeLimiter = createRateLimiter(10, 24 * 60 * 60 * 1000);
export const b2cCreditsWriteLimiter = createRateLimiter(5, 60 * 1000);
export const b2cGenericReadLimiter = createRateLimiter(300, 5 * 60 * 1000);
export const b2cGenericWriteLimiter = createRateLimiter(100, 60 * 1000);

/**
 * Rate-limit key for a B2C endpoint. Prefer `user_id` for authenticated
 * callers (RLS-gated anyway); fall back to client IP when no user is set.
 */
export function b2cRateKey(userId: string | null, ip: string): string {
  return userId ? `b2c:${userId}` : `b2c:ip:${ip}`;
}
