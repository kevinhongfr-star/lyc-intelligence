/**
 * In-memory cache for `useV1Query`.
 *
 * Module-level singleton — shared across all hook instances within the
 * same browser tab. Entries expire after their `expiresAt` and are
 * considered stale (still returned, but flagged) once expired.
 *
 * The cache is intentionally simple (Map + TTL) to keep the bundle small.
 * For larger apps, swap this out for TanStack Query.
 */

type CacheKey = string;

interface Entry<T> {
  data: T;
  expiresAt: number;
  fetchedAt: number;
}

const store = new Map<CacheKey, Entry<unknown>>();
const subscribers = new Set<() => void>();

function notify(): void {
  for (const sub of subscribers) sub();
}

export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function readCache<T>(key: CacheKey): Entry<T> | undefined {
  return store.get(key) as Entry<T> | undefined;
}

export function writeCache<T>(key: CacheKey, data: T, ttlMs: number): void {
  const now = Date.now();
  store.set(key, {
    data,
    expiresAt: now + ttlMs,
    fetchedAt: now,
  });
  notify();
}

export function invalidate(keyPrefix: string): void {
  if (keyPrefix === '' || keyPrefix === '*') {
    store.clear();
    notify();
    return;
  }
  let changed = false;
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key);
      changed = true;
    }
  }
  if (changed) notify();
}

export function isStale<T>(entry: Entry<T> | undefined): boolean {
  if (!entry) return true;
  return Date.now() >= entry.expiresAt;
}

export function clearCache(): void {
  store.clear();
  notify();
}

/** Build a stable cache key from a path + params object. */
export function buildCacheKey(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  const sortedKeys = Object.keys(params).sort();
  const parts = sortedKeys
    .filter((k) => params[k] !== undefined && params[k] !== null)
    .map((k) => `${k}=${String(params[k])}`);
  return parts.length ? `${path}?${parts.join('&')}` : path;
}

/** Test-only helper — clears the singleton between unit tests. */
export function __resetCacheForTests(): void {
  store.clear();
  subscribers.clear();
}
