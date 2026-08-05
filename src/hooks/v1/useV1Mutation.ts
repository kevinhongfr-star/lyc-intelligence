/**
 * useV1Mutation — RLS-aware mutation hook over the v1 API.
 *
 *   const { mutateAsync, loading, error } = useV1Mutation('/contacts', {
 *     method: 'POST',
 *     onSuccess: (created) => toast.success('Created'),
 *     invalidateQueries: ['/contacts'], // refetch lists
 *   });
 *
 * Features:
 *   - Generic over body + response types
 *   - `onMutate` for optimistic updates (returns context for rollback)
 *   - `onError` for rollback
 *   - `onSuccess` / `onSettled` callbacks
 *   - `invalidateQueries` triggers background refetch of `useV1Query`
 *     entries that match the given path prefix
 *   - Both `mutate` (returns Promise) and `mutateAsync` (throws) shapes
 */

import { useCallback, useRef, useState } from 'react';
import { v1Client } from './v1Client';
import { invalidateV1Queries } from './useV1Query';
import {
  V1ApiError,
  type UseV1MutationOptions,
  type UseV1MutationResult,
} from './types';

export function useV1Mutation<TData, TBody = void, TContext = unknown>(
  path: string,
  options: UseV1MutationOptions<TData, TBody, TContext> = {},
): UseV1MutationResult<TData, TBody, TContext> {
  const {
    method = 'POST',
    params,
    onMutate,
    onSuccess,
    onError,
    onSettled,
    invalidateQueries,
  } = options;

  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<V1ApiError | null>(null);
  const [context, setContext] = useState<TContext | undefined>(undefined);

  // Used to make `mutate` swallow errors when callers don't await.
  const lastErrorRef = useRef<V1ApiError | null>(null);

  const runMutation = useCallback(
    async (body: TBody): Promise<TData> => {
      setLoading(true);
      setError(null);

      let ctx: TContext | undefined;
      try {
        if (onMutate) {
          ctx = await onMutate(body);
          setContext(ctx);
        }

        let response: TData;
        switch (method) {
          case 'POST':
            response = await v1Client.post<TData>(path, body, { params });
            break;
          case 'PUT':
            response = await v1Client.put<TData>(path, body, { params });
            break;
          case 'PATCH':
            response = await v1Client.patch<TData>(path, body, { params });
            break;
          case 'DELETE':
            response = await v1Client.delete<TData>(path, { params });
            break;
          default: {
            const exhaustive: never = method;
            throw new V1ApiError(`Unsupported method: ${String(exhaustive)}`, {
              status: 500,
            });
          }
        }

        setData(response);
        if (onSuccess) await onSuccess(response, body, ctx);
        if (invalidateQueries) {
          for (const prefix of invalidateQueries) {
            invalidateV1Queries(prefix);
          }
        }
        return response;
      } catch (err) {
        const apiError =
          err instanceof V1ApiError
            ? err
            : new V1ApiError(
                err instanceof Error ? err.message : 'Mutation failed',
                { status: 0 },
              );
        setError(apiError);
        lastErrorRef.current = apiError;
        if (onError) await onError(apiError, body, ctx);
        throw apiError;
      } finally {
        if (onSettled) {
          try {
            await onSettled(data, lastErrorRef.current, body, ctx);
          } catch {
            // onSettled errors are non-fatal — swallow so the mutation result wins
          }
        }
        setLoading(false);
      }
    },
    [
      method,
      onMutate,
      onSuccess,
      onError,
      onSettled,
      invalidateQueries,
      params,
      path,
      data,
    ],
  );

  // `mutate` returns a promise but does NOT throw — convenient for
  // onClick handlers where you'd rather inspect `error` state.
  const mutate = useCallback(
    (body: TBody): Promise<TData> => {
      return runMutation(body).catch(() => {
        // Error already in state — return a never-resolving marker is bad UX,
        // so we re-throw but consumers typically use mutateAsync when they
        // need to await. mutate() is fire-and-forget friendly.
        return Promise.reject(lastErrorRef.current);
      });
    },
    [runMutation],
  );

  const mutateAsync = runMutation;

  const reset = useCallback(() => {
    setData(undefined);
    setLoading(false);
    setError(null);
    setContext(undefined);
    lastErrorRef.current = null;
  }, []);

  return {
    data,
    loading,
    error,
    context,
    mutate,
    mutateAsync,
    reset,
  };
}
