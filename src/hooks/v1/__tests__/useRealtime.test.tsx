/**
 * Tests for useRealtime — typed Supabase Realtime hook.
 *
 * Mocks `@/lib/supabase/client` and asserts:
 *   - The hook opens a channel with the right name + filter
 *   - The callback is invoked when payloads arrive
 *   - isConnected reflects the SUBSCRIBED status
 *   - enabled: false does not open a channel
 *   - useRealtimeRefresh debounces calls to onChanges
 *   - Channels are removed on unmount
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { RealtimeEnvelope } from '../types';

// ── Mock supabase client ──────────────────────────────────────────
// Each test resets the captured callbacks via beforeEach.

interface MockSupabase {
  channel: ReturnType<typeof vi.fn>;
  removeChannel: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn> & {
    lastCb?: (status: string) => void;
  };
  onCallbackRef: { current: ((payload: unknown) => void) | null };
  mockChannel: unknown;
}

function buildMockSupabase(): MockSupabase {
  const onCallbackRef: { current: ((payload: unknown) => void) | null } = { current: null };

  const mockChannel = {
    on: vi.fn((_type: string, _filter: unknown, cb: (payload: unknown) => void) => {
      onCallbackRef.current = cb;
      return mockChannel;
    }),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      (subscribe as unknown as { lastCb?: (s: string) => void }).lastCb = cb;
      return mockChannel;
    }),
  };

  const subscribe = mockChannel.subscribe as MockSupabase['subscribe'];
  const channel = vi.fn(() => mockChannel);
  const removeChannel = vi.fn();

  return {
    channel,
    removeChannel,
    on: mockChannel.on as unknown as MockSupabase['on'],
    subscribe,
    onCallbackRef,
    mockChannel,
  };
}

const mockSupabase = buildMockSupabase();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockSupabase.channel(...args),
    removeChannel: (...args: unknown[]) => mockSupabase.removeChannel(...args),
  },
  isSupabaseConfigured: true,
}));

// Import after the mock is registered.
import { useRealtime, useRealtimeRefresh } from '../useRealtime';

interface Row {
  id: string;
  name: string;
  [key: string]: unknown;
}

const SAMPLE_PAYLOAD: RealtimeEnvelope<Row> = {
  schema: 'public',
  table: 'items',
  commit_timestamp: '2026-01-01T00:00:00Z',
  errors: [],
  eventType: 'INSERT',
  new: { id: '1', name: 'New' },
  old: {},
};

describe('useRealtime', () => {
  beforeEach(() => {
    mockSupabase.onCallbackRef.current = null;
    mockSupabase.channel.mockClear();
    mockSupabase.removeChannel.mockClear();
    mockSupabase.on.mockClear();
    mockSupabase.subscribe.mockClear();
    mockSupabase.subscribe.lastCb = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens a channel with the right name and filter', async () => {
    const { result } = renderHook(() =>
      useRealtime<Row>('items', { filter: 'id=eq.1' }),
    );

    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());

    const channelName = mockSupabase.channel.mock.calls[0]?.[0] as string;
    expect(channelName).toBe('v1-rt-items-id=eq.1');

    // The filter passed to .on() should include table + filter
    const onCallArgs = mockSupabase.on.mock.calls[0];
    expect(onCallArgs?.[0]).toBe('postgres_changes');
    expect(onCallArgs?.[1]).toMatchObject({
      event: '*',
      schema: 'public',
      table: 'items',
      filter: 'id=eq.1',
    });

    expect(result.current.latest).toBeNull();
  });

  it('accumulates the latest payload in state', async () => {
    const { result } = renderHook(() => useRealtime<Row>('items'));

    await waitFor(() => expect(mockSupabase.onCallbackRef.current).not.toBeNull());

    // Fire a payload via the captured callback
    mockSupabase.onCallbackRef.current?.(SAMPLE_PAYLOAD);

    await waitFor(() => expect(result.current.latest).toEqual(SAMPLE_PAYLOAD));
  });

  it('invokes onPayload callback when a payload arrives', async () => {
    const onPayload = vi.fn();
    renderHook(() => useRealtime<Row>('items', { onPayload }));

    await waitFor(() => expect(mockSupabase.onCallbackRef.current).not.toBeNull());

    mockSupabase.onCallbackRef.current?.(SAMPLE_PAYLOAD);

    expect(onPayload).toHaveBeenCalledWith(SAMPLE_PAYLOAD);
  });

  it('sets isConnected=true when subscribe reports SUBSCRIBED', async () => {
    const { result } = renderHook(() => useRealtime<Row>('items'));

    await waitFor(() => expect(mockSupabase.subscribe).toHaveBeenCalled());

    mockSupabase.subscribe.lastCb?.('SUBSCRIBED');

    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });

  it('enabled: false does not open a channel', () => {
    renderHook(() => useRealtime<Row>('items', { enabled: false }));

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });

  it('removes the channel on unmount', async () => {
    const { unmount } = renderHook(() => useRealtime<Row>('items'));

    await waitFor(() => expect(mockSupabase.channel).toHaveBeenCalled());

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalled();
  });
});

describe('useRealtimeRefresh', () => {
  beforeEach(() => {
    mockSupabase.onCallbackRef.current = null;
    mockSupabase.channel.mockClear();
    mockSupabase.removeChannel.mockClear();
    mockSupabase.on.mockClear();
    mockSupabase.subscribe.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debounces onChanges calls by default (500ms)', async () => {
    const onChanges = vi.fn();
    renderHook(() =>
      useRealtimeRefresh({ table: 'items', onChanges, debounceMs: 500 }),
    );

    // Wait for the channel to be set up using real timers
    await waitFor(() => expect(mockSupabase.onCallbackRef.current).not.toBeNull());

    // Switch to fake timers for the debounce window
    vi.useFakeTimers();

    // Fire multiple payloads quickly
    mockSupabase.onCallbackRef.current?.(SAMPLE_PAYLOAD);
    mockSupabase.onCallbackRef.current?.(SAMPLE_PAYLOAD);
    mockSupabase.onCallbackRef.current?.(SAMPLE_PAYLOAD);

    // onChanges should not be called yet (debounced)
    expect(onChanges).not.toHaveBeenCalled();

    // Advance the fake timer past the debounce window
    vi.advanceTimersByTime(500);

    expect(onChanges).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('enabled: false skips subscription', () => {
    const onChanges = vi.fn();
    renderHook(() =>
      useRealtimeRefresh({ table: 'items', onChanges, enabled: false }),
    );

    expect(mockSupabase.channel).not.toHaveBeenCalled();
  });
});
