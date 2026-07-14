import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePrefetchOptions<T> {
  fetcher: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
}

interface UsePrefetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: unknown | null;
  prefetch: () => Promise<T | null>;
  reset: () => void;
}

export function usePrefetch<T>({
  fetcher,
  enabled = true,
  staleTime = 0,
  onSuccess,
  onError,
}: UsePrefetchOptions<T>): UsePrefetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const lastFetchRef = useRef<number>(0);
  const promiseRef = useRef<Promise<T> | null>(null);

  const prefetch = useCallback(async (): Promise<T | null> => {
    if (!enabled) return null;

    if (promiseRef.current) {
      return promiseRef.current;
    }

    const now = Date.now();
    if (staleTime > 0 && data && now - lastFetchRef.current < staleTime) {
      return data;
    }

    setIsLoading(true);
    setError(null);

    const promise = fetcher();
    promiseRef.current = promise;

    try {
      const result = await promise;
      setData(result);
      lastFetchRef.current = Date.now();
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      onError?.(err);
      return null;
    } finally {
      setIsLoading(false);
      promiseRef.current = null;
    }
  }, [fetcher, enabled, staleTime, data, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    lastFetchRef.current = 0;
    promiseRef.current = null;
  }, []);

  return { data, isLoading, error, prefetch, reset };
}

export function useHoverPrefetch<T extends HTMLElement>(
  prefetch: () => void,
  options: { delay?: number; enabled?: boolean } = {}
): React.RefObject<T> {
  const { delay = 100, enabled = true } = options;
  const ref = useRef<T>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const handleMouseEnter = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => prefetch(), delay);
    };

    const handleMouseLeave = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prefetch, delay, enabled]);

  return ref;
}
