/**
 * v1 Simple in-memory cache.
 *
 * TTL-based key/value store for caching expensive lookups (e.g. profile
 * reads, permission checks, common list endpoints). Per-process — won't
 * survive cold starts or scale across instances. Sufficient for single-
 * function hot-path optimization.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Get a value from cache. Returns null if missing or expired. */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

/** Set a value with TTL in milliseconds. */
export function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/** Get or compute — if the key is missing, run fn() and cache the result. */
export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) return cached;
  const value = await fn();
  setCache(key, value, ttlMs);
  return value;
}

/** Delete a specific key. */
export function deleteCache(key: string): boolean {
  return cache.delete(key);
}

/** Clear all cache entries. */
export function clearCache(): void {
  cache.clear();
}

/** Delete all keys matching a prefix. */
export function deleteCachePrefix(prefix: string): number {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}
