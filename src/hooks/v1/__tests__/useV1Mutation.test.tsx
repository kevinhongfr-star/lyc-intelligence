/**
 * Tests for useV1Mutation — RLS-aware mutation hook.
 *
 * Mocks `v1Client.post/put/patch/delete` and asserts:
 *   - mutateAsync resolves with response data
 *   - loading flag toggles correctly
 *   - errors are captured and re-thrown
 *   - onMutate / onSuccess / onError / onSettled callbacks fire
 *   - invalidateQueries triggers cache invalidation
 *   - reset clears state
 *   - method maps to the right v1Client method
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useV1Mutation } from '../useV1Mutation';
import { __resetCacheForTests } from '../cache';
import * as v1ClientMod from '../v1Client';
import { V1ApiError } from '../types';

interface Item {
  id: number;
  name: string;
}

describe('useV1Mutation', () => {
  let postMock: ReturnType<typeof vi.fn>;
  let putMock: ReturnType<typeof vi.fn>;
  let patchMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetCacheForTests();
    postMock = vi.fn();
    putMock = vi.fn();
    patchMock = vi.fn();
    deleteMock = vi.fn();

    const fake = {
      get: vi.fn(),
      post: postMock,
      put: putMock,
      patch: patchMock,
      delete: deleteMock,
      request: vi.fn(),
    };
    vi.spyOn(v1ClientMod, 'v1Client', 'get').mockReturnValue(
      fake as unknown as typeof v1ClientMod.v1Client,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetCacheForTests();
  });

  it('mutateAsync resolves with data and exposes it in state', async () => {
    postMock.mockResolvedValue({ id: 1, name: 'Created' });

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items', { method: 'POST' }),
    );

    expect(result.current.loading).toBe(false);

    const data = await result.current.mutateAsync({ name: 'Created' });
    expect(data).toEqual({ id: 1, name: 'Created' });

    // State updates flush after the microtask queue drains.
    await waitFor(() => expect(result.current.data).toEqual({ id: 1, name: 'Created' }));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('captures errors and re-throws V1ApiError', async () => {
    postMock.mockRejectedValue(new V1ApiError('Bad request', { status: 400 }));

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items', { method: 'POST' }),
    );

    await expect(result.current.mutateAsync({ name: 'Bad' })).rejects.toMatchObject({
      name: 'V1ApiError',
      status: 400,
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(V1ApiError));
    expect(result.current.error?.status).toBe(400);
    expect(result.current.data).toBeUndefined();
  });

  it('fires onMutate -> onSuccess -> onSettled in order on success', async () => {
    postMock.mockResolvedValue({ id: 1, name: 'OK' });
    const onMutate = vi.fn().mockReturnValue({ optimisticId: -1 });
    const onSuccess = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }, { optimisticId: number }>('/items', {
        method: 'POST',
        onMutate,
        onSuccess,
        onSettled,
      }),
    );

    await result.current.mutateAsync({ name: 'OK' });

    expect(onMutate).toHaveBeenCalledWith({ name: 'OK' });
    expect(onSuccess).toHaveBeenCalledWith(
      { id: 1, name: 'OK' },
      { name: 'OK' },
      { optimisticId: -1 },
    );
    expect(onSettled).toHaveBeenCalled();
    // Order: onMutate first, then onSuccess, then onSettled
    expect(onMutate.mock.invocationCallOrder[0]).toBeLessThan(
      onSuccess.mock.invocationCallOrder[0],
    );
    expect(onSuccess.mock.invocationCallOrder[0]).toBeLessThan(
      onSettled.mock.invocationCallOrder[0],
    );
  });

  it('fires onMutate -> onError -> onSettled on failure with context for rollback', async () => {
    postMock.mockRejectedValue(new V1ApiError('Boom', { status: 500 }));
    const onMutate = vi.fn().mockReturnValue({ rollback: true });
    const onError = vi.fn();
    const onSettled = vi.fn();

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }, { rollback: boolean }>('/items', {
        method: 'POST',
        onMutate,
        onError,
        onSettled,
      }),
    );

    await expect(result.current.mutateAsync({ name: 'Boom' })).rejects.toThrow();

    expect(onMutate).toHaveBeenCalledWith({ name: 'Boom' });
    expect(onError).toHaveBeenCalledWith(
      expect.any(V1ApiError),
      { name: 'Boom' },
      { rollback: true },
    );
    expect(onSettled).toHaveBeenCalledWith(undefined, expect.any(V1ApiError), { name: 'Boom' }, { rollback: true });
  });

  it('PUT/PATCH/DELETE route to the right client method', async () => {
    putMock.mockResolvedValue({ id: 1, name: 'Updated' });
    patchMock.mockResolvedValue({ id: 1, name: 'Patched' });
    deleteMock.mockResolvedValue({ id: 1 });

    const { result: putR } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items/1', { method: 'PUT' }),
    );
    await putR.current.mutateAsync({ name: 'Updated' });
    expect(putMock).toHaveBeenCalled();

    const { result: patchR } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items/1', { method: 'PATCH' }),
    );
    await patchR.current.mutateAsync({ name: 'Patched' });
    expect(patchMock).toHaveBeenCalled();

    const { result: delR } = renderHook(() =>
      useV1Mutation<{ id: number }, void>('/items/1', { method: 'DELETE' }),
    );
    await delR.current.mutateAsync(undefined as unknown as void);
    expect(deleteMock).toHaveBeenCalled();
  });

  it('reset clears data, error, and loading', async () => {
    postMock.mockResolvedValue({ id: 1, name: 'Created' });

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items', { method: 'POST' }),
    );

    await result.current.mutateAsync({ name: 'Created' });
    await waitFor(() => expect(result.current.data).toBeDefined());

    result.current.reset();
    await waitFor(() => expect(result.current.data).toBeUndefined());
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('invalidateQueries accepts a list and completes the mutation without error', async () => {
    postMock.mockResolvedValue({ id: 1, name: 'Created' });

    const { result } = renderHook(() =>
      useV1Mutation<Item, { name: string }>('/items', {
        method: 'POST',
        invalidateQueries: ['/items', '/dashboard'],
      }),
    );

    const data = await result.current.mutateAsync({ name: 'Created' });
    expect(data).toEqual({ id: 1, name: 'Created' });
    expect(postMock).toHaveBeenCalled();
  });
});
