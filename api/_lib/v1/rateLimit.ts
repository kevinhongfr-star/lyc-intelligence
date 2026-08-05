/**
 * v1 Sliding-window rate limiter.
 *
 * Uses an in-memory map of key → timestamp[]. For each check, entries
 * older than `windowMs` are pruned, and the remaining count is compared
 * against `maxRequests`.
 *
 * Key is typically a user id or IP. This is per-process state — in a
 * serverless environment each cold start gets its own store, which means
 * limits are per-instance, not global. Good enough for abuse deterrence;
 * upgrade to a Redis/Edge Function backed limiter when needed.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

/**
 * Create a rate-limit checker for a specific window/limit.
 * Returns a synchronous function that checks a given key.
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
): (key: string) => RateLimitResult {
  return (key: string): RateLimitResult => {
    const now = Date.now();
    const entry = store.get(key) || { timestamps: [] };

    // Prune entries outside the window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

    if (entry.timestamps.length >= maxRequests) {
      const oldest = entry.timestamps[0];
      store.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: windowMs - (now - oldest),
      };
    }

    entry.timestamps.push(now);
    store.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - entry.timestamps.length,
      retryAfterMs: 0,
    };
  };
}

/** Standard limit: 60 requests / minute per user */
export const defaultLimiter = createRateLimiter(60, 60 * 1000);

/** Stricter limit for auth endpoints: 10 requests / minute */
export const authLimiter = createRateLimiter(10, 60 * 1000);

/** Lenient limit for read-heavy endpoints: 300 requests / 5 minutes */
export const readLimiter = createRateLimiter(300, 5 * 60 * 1000);

/** Reset all state — test helper only */
export function _resetRateLimitStore(): void {
  store.clear();
}
