/**
 * useRealtime — Supabase Realtime subscription hook (S1-T07)
 *
 * Provides a simple way to subscribe to Postgres Changes on any table
 * and trigger a callback when data changes. Automatically cleans up
 * the subscription on unmount.
 *
 * Usage:
 *   useRealtimeRefresh({
 *     table: 'contacts',
 *     filter: `candidate_id=eq.${userId}`,
 *     onChanges: () => refetch(),
 *   });
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

interface RealtimeOptions {
  /** Table name to watch */
  table: string;
  /** Optional Postgres filter (e.g. "candidate_id=eq.USER_ID") */
  filter?: string;
  /** Called when any INSERT/UPDATE/DELETE occurs on the matching rows */
  onChanges: () => void;
  /** Event types to listen for (default: all) */
  events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[];
  /** Debounce window in ms (default: 500) — batches rapid changes */
  debounceMs?: number;
  /** Whether to enable the subscription (default: true) */
  enabled?: boolean;
}

export function useRealtimeRefresh({
  table,
  filter,
  onChanges,
  events = ['*'],
  debounceMs = 500,
  enabled = true,
}: RealtimeOptions) {
  const callbackRef = useRef(onChanges);
  callbackRef.current = onChanges;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${filter ?? 'all'}`;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callbackRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: events.length === 1 && events[0] === '*' ? '*' : events.join(','),
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        triggerRefresh,
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [table, filter, events.join(','), debounceMs, enabled]);
}

/**
 * Subscribe to multiple tables at once. Useful when a view depends on
 * several underlying tables (e.g., v_pipeline_rankings depends on
 * contacts, mandates, scoring_config).
 */
export function useMultiTableRealtimeRefresh(
  subscriptions: Array<{ table: string; filter?: string }>,
  onChanges: () => void,
  options?: { debounceMs?: number; enabled?: boolean },
) {
  const callbackRef = useRef(onChanges);
  callbackRef.current = onChanges;
  const debounceMs = options?.debounceMs ?? 500;
  const enabled = options?.enabled ?? true;

  const key = subscriptions.map(s => `${s.table}:${s.filter ?? ''}`).join('|');

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        callbackRef.current();
      }, debounceMs);
    };

    const channels = subscriptions.map((sub, i) => {
      const channelName = `multi-rt-${i}-${sub.table}-${sub.filter ?? 'all'}`;
      return supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: sub.table,
            ...(sub.filter ? { filter: sub.filter } : {}),
          },
          triggerRefresh,
        )
        .subscribe();
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [key, debounceMs, enabled]);
}
