/**
 * Tests for useV1Query — RLS-aware query hook.
 *
 * Mocks `v1Client.get` and asserts:
 *   - loading + data lifecycle (idle → loading → success)
 *   - error capture on failure
 *   - cache hits skip the network
 *   - refetch forces a network call
 *   - `enabled: false` skips fetching
 *   - `select` transforms the response
 *   - `placeholderData` shows during initial fetch
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useV1Query } from '../useV1Query';
import { __resetCacheForTests } from '../cache';
import * as v1ClientMod from '../v1Client';
import { V1ApiError } from '../types';

type GetMock = ReturnType<typeof vi.fn>;

describe('useV1Query', () => {
  let getMock: GetMock;

  beforeEach(() => {
    __resetCacheForTests();
    getMock = vi.fn();
    vi.spyOn(v1ClientMod, 'v1Client', 'get').mockReturnValue({
      ...v1ClientMod.v1Client,
      get: getMock,
    } as unknown as typeof v1ClientMod.v1Client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetCacheForTests();
  });

  it('starts in loading state, then resolves with data', async () => {
    getMock.mockResolvedValue({ id: 1, name: 'Item' });

    const { result } = renderHook(() => useV1Query<{ id: number; name: string }>('/items/1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ id: 1, name: 'Item' });
    expect(result.current.error).toBeNull();
    expect(result.current.isStale).toBe(false);
  });

  it('captures errors and exposes them in state', async () => {
    getMock.mockRejectedValue(new V1ApiError('Not found', { status: 404 }));

    const { result } = renderHook(() => useV1Query('/items/missing'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(V1ApiError);
    expect(result.current.error?.status).toBe(404);
    expect(result.current.error?.message).toBe('Not found');
  });

  it('serves cache hits without re-fetching', async () => {
    getMock.mockResolvedValue({ id: 1, name: 'Cached' });

    const { result: first } = renderHook(() => useV1Query<{ id: number }>('/items/1'));
    await waitFor(() => expect(first.current.data).toBeDefined());

    // Second mount with the same path should NOT call get again.
    getMock.mockClear();
    const { result: second } = renderHook(() => useV1Query<{ id: number }>('/items/1'));
    await waitFor(() => expect(second.current.data).toBeDefined());

    expect(second.current.data).toEqual({ id: 1, name: 'Cached' });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('refetch forces a network call even when cache is fresh', async () => {
    getMock.mockResolvedValueOnce({ id: 1, name: 'Old' });
    getMock.mockResolvedValueOnce({ id: 1, name: 'New' });

    const { result } = renderHook(() => useV1Query<{ id: number; name: string }>('/items/1'));
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.name).toBe('Old');

    const refreshed = await result.current.refetch();
    expect(refreshed?.name).toBe('New');
    // State update happens via setData + cache subscriber — wait for it.
    await waitFor(() => expect(result.current.data?.name).toBe('New'));
  });

  it('enabled: false does not fetch on mount', async () => {
    getMock.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() =>
      useV1Query<{ id: number }>('/items/1', { enabled: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('select transforms the raw data', async () => {
    getMock.mockResolvedValue({ items: [{ id: 1 }, { id: 2 }] });

    const { result } = renderHook(() =>
      useV1Query<{ items: { id: number }[] }, number>(
        '/items',
        { select: (d) => d.items.length },
      ),
    );

    await waitFor(() => expect(result.current.data).toBe(2));
  });

  it('placeholderData is shown while the first fetch is in flight', async () => {
    getMock.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() =>
      useV1Query<{ id: number }>('/items/1', { placeholderData: { id: 0 } }),
    );

    expect(result.current.data).toEqual({ id: 0 });

    await waitFor(() => expect(result.current.data).toEqual({ id: 1 }));
  });

  it('passes params through to v1Client.get', async () => {
    getMock.mockResolvedValue([]);

    renderHook(() =>
      useV1Query<unknown[]>('/items', { params: { page: 3, page_size: 25 } }),
    );

    await waitFor(() => expect(getMock).toHaveBeenCalled());
    const [path, opts] = getMock.mock.calls[0] as [string, { params?: Record<string, unknown> }];
    expect(path).toBe('/items');
    expect(opts.params).toEqual({ page: 3, page_size: 25 });
  });

  it('multiple hooks sharing the same path + params share cache', async () => {
    getMock.mockResolvedValue({ id: 1, name: 'Shared' });

    const { result: a } = renderHook(() => useV1Query<{ id: number }>('/items/1'));
    await waitFor(() => expect(a.current.data).toBeDefined());

    getMock.mockClear();
    const { result: b } = renderHook(() => useV1Query<{ id: number }>('/items/1'));
    await waitFor(() => expect(b.current.data).toBeDefined());

    expect(b.current.data).toEqual({ id: 1, name: 'Shared' });
    expect(getMock).not.toHaveBeenCalled();
  });

  it('unmount sets mountedRef to false without crashing', async () => {
    getMock.mockResolvedValue({ id: 1 });

    const { result, unmount } = renderHook(() => useV1Query<{ id: number }>('/items/1'));

    act(() => unmount());

    // The hook should not crash on unmount — the test passes by not throwing.
    expect(result.current).toBeDefined();
  });
});
