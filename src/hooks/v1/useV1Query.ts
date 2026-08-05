/**
 * useV1Query — RLS-aware read hook over the v1 API.
 *
 *   const { data, loading, error, refetch } = useV1Query('/client/dashboard');
 *
 * Features:
 *   - In-memory cache with TTL (default 30s)
 *   - `enabled` flag for conditional fetching
 *   - `select` for transforming raw data
 *   - `placeholderData` shown while the first fetch is in flight
 *   - Auto-refetch on window focus (opt-in)
 *   - `refetch()` for manual refresh
 *   - Cache invalidation via `invalidateQueries` from `useV1Mutation`
 *
 * RLS is enforced server-side: every request sends the httpOnly cookie
 * (credentials: 'include'), and the v1 router resolves the user before
 * returning any data.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { v1Client } from './v1Client';
import {
  buildCacheKey,
  invalidate,
  isStale,
  readCache,
  subscribe,
  writeCache,
} from './cache';
import {
  V1ApiError,
  type ListQueryParams,
  type UseV1QueryOptions,
  type UseV1QueryResult,
} from './types';

const DEFAULT_TTL_MS = 30_000;

export function useV1Query<T, R = T>(
  path: string,
  options: UseV1QueryOptions<T, R> = {},
): UseV1QueryResult<R> {
  const {
    params,
    enabled = true,
    cacheTtlMs = DEFAULT_TTL_MS,
    refetchOnWindowFocus = false,
    refetchOnMount = false,
    select,
    placeholderData,
  } = options;

  const cacheKey = buildCacheKey(path, params);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<V1ApiError | null>(null);
  const [data, setData] = useState<R | undefined>(() => {
    const cached = readCache<T>(cacheKey);
    if (!cached) return placeholderData;
    return select ? select(cached.data) : (cached.data as unknown as R);
  });
  const [stale, setStale] = useState<boolean>(() => isStale(readCache<T>(cacheKey)));

  // Track in-flight requests so we don't double-fire on a strict-mode
  // double-invoke or a re-render storm.
  const inFlight = useRef<Promise<R> | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchOnce = useCallback(
    async (opts: { force?: boolean } = {}): Promise<R | undefined> => {
      if (!enabled) return undefined;

      // Return fresh cache hit when not forcing + entry is not stale.
      const cached = readCache<T>(cacheKey);
      if (cached && !opts.force && !isStale(cached)) {
        const value = select ? select(cached.data) : (cached.data as unknown as R);
        if (mountedRef.current) {
          setData(value);
          setStale(false);
          setError(null);
          setLoading(false);
        }
        return value;
      }

      if (inFlight.current) return inFlight.current;

      if (mountedRef.current) {
        setLoading(true);
        // Mark as stale immediately so UI can show a background-refresh indicator.
        if (cached) setStale(true);
      }

      const promise = v1Client
        .get<T>(path, { params })
        .then((raw) => {
          if (cacheTtlMs > 0) writeCache(cacheKey, raw, cacheTtlMs);
          const value = select ? select(raw) : (raw as unknown as R);
          if (mountedRef.current) {
            setData(value);
            setError(null);
            setStale(false);
          }
          return value;
        })
        .catch((err: unknown) => {
          if (err instanceof V1ApiError) {
            if (mountedRef.current) setError(err);
          }
          throw err;
        })
        .finally(() => {
          inFlight.current = null;
          if (mountedRef.current) setLoading(false);
        });

      inFlight.current = promise;
      return promise;
    },
    [cacheKey, cacheTtlMs, enabled, path, params, select],
  );

  // Initial + dependency-change fetch
  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cached = readCache<T>(cacheKey);
    if (cached && !refetchOnMount && !isStale(cached)) {
      const value = select ? select(cached.data) : (cached.data as unknown as R);
      setData(value);
      setStale(false);
      setLoading(false);
      return;
    }

    // Stale-while-revalidate: show cached data, refetch in background.
    if (cached) {
      const value = select ? select(cached.data) : (cached.data as unknown as R);
      setData(value);
      setStale(true);
    }

    void fetchOnce({ force: refetchOnMount }).catch(() => {
      // Error already captured in state — swallow unhandled rejection.
    });

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, refetchOnMount]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;
    const onFocus = () => {
      void fetchOnce({ force: true }).catch(() => undefined);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchOnce, refetchOnWindowFocus]);

  // Subscribe to cache invalidations (from useV1Mutation.invalidateQueries)
  useEffect(() => {
    const unsub = subscribe(() => {
      const cached = readCache<T>(cacheKey);
      if (!cached) return;
      const value = select ? select(cached.data) : (cached.data as unknown as R);
      setData(value);
      setStale(isStale(cached));
    });
    return unsub;
  }, [cacheKey, select]);

  const refetch = useCallback(async (): Promise<R | undefined> => {
    return fetchOnce({ force: true });
  }, [fetchOnce]);

  return {
    data,
    loading,
    error,
    isStale: stale,
    refetch,
  };
}

/** Helper exported for `useV1Mutation` to invalidate cache entries. */
export function invalidateV1Queries(pathPrefix: string): void {
  invalidate(pathPrefix);
}

export type { ListQueryParams };
