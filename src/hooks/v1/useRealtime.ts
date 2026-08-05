/**
 * useRealtime — typed Supabase Realtime hook for the v1 publication.
 *
 * The v1 backend relies on Postgres RLS + Supabase Realtime publication
 * for live updates. RLS still applies: subscribers only receive events
 * for rows they're allowed to read.
 *
 * Two flavours:
 *   - `useRealtime(table, options)` — accumulates the latest payload
 *   - `useRealtimeRefresh(table, options)` — fires a callback (e.g. refetch)
 *
 * Both auto-cleanup the channel on unmount.
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeEnvelope, UseRealtimeOptions } from './types';

export type { RealtimeEnvelope } from './types';

export interface UseRealtimeResult<T extends Record<string, unknown>> {
  latest: RealtimeEnvelope<T> | null;
  isConnected: boolean;
}

/**
 * Build the typed `postgres_changes` filter object expected by the
 * Supabase SDK. The SDK's `.on()` overloads require `event` to be a
 * literal string union — we cast through this helper so callers can
 * pass a runtime string without tripping overload resolution.
 */
function buildFilter(args: {
  event: string;
  schema: string;
  table: string;
  filter?: string;
}): {
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  filter?: string;
} {
  return {
    event: args.event as '*' | 'INSERT' | 'UPDATE' | 'DELETE',
    schema: args.schema,
    table: args.table,
    ...(args.filter ? { filter: args.filter } : {}),
  };
}

/**
 * Subscribe to a single table + (optional) filter, accumulate the latest
 * payload in state. RLS enforced by Supabase.
 */
export function useRealtime<T extends Record<string, unknown> = Record<string, unknown>>(
  table: string,
  options: UseRealtimeOptions<T> = {},
): UseRealtimeResult<T> {
  const {
    filter,
    events = ['*'],
    onPayload,
    enabled = true,
    schema = 'public',
  } = options;

  const [latest, setLatest] = useState<RealtimeEnvelope<T> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const cbRef = useRef(onPayload);
  cbRef.current = onPayload;

  const eventKey =
    events.length === 1 && events[0] === '*' ? '*' : events.join(',');

  useEffect(() => {
    if (!enabled) return;
    if (!supabase) return;

    const channelName = `v1-rt-${table}-${filter ?? 'all'}`;

    const handler = (payload: unknown) => {
      const envelope = payload as RealtimeEnvelope<T>;
      setLatest(envelope);
      if (cbRef.current) cbRef.current(envelope);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        buildFilter({ event: eventKey, schema, table, filter }),
        handler,
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      setIsConnected(false);
      void supabase.removeChannel(channel);
    };
  }, [table, filter, eventKey, schema, enabled]);

  return { latest, isConnected };
}

/**
 * Subscribe to a single table + (optional) filter and call `onChanges`
 * whenever an event lands. Useful for triggering a `useV1Query.refetch()`.
 *
 *   useRealtimeRefresh({ table: 'candidate_applications', onChanges: refetch });
 */
export interface UseRealtimeRefreshOptions {
  table: string;
  filter?: string;
  onChanges: () => void;
  events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[];
  /** Debounce window in ms (default 500). */
  debounceMs?: number;
  enabled?: boolean;
}

export function useRealtimeRefresh(opts: UseRealtimeRefreshOptions): void {
  const { table, filter, onChanges, events = ['*'], debounceMs = 500, enabled = true } = opts;

  const cbRef = useRef(onChanges);
  cbRef.current = onChanges;

  const eventKey =
    events.length === 1 && events[0] === '*' ? '*' : events.join(',');

  useEffect(() => {
    if (!enabled) return;
    if (!supabase) return;

    const channelName = `v1-rt-refresh-${table}-${filter ?? 'all'}`;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        cbRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        buildFilter({ event: eventKey, schema: 'public', table, filter }),
        trigger,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [table, filter, eventKey, debounceMs, enabled]);
}
