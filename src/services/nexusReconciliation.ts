// Phase 0.6: NEXUS Reconciliation Service
// Retry failed events and full reconciliation capabilities

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NexusEvent, NexusEventOutbox, OutboxStatus } from '@/types/nexusEvents';
import { deliverEvent } from '@/services/nexusEventEmitter';

const MAX_EVENTS_PER_RUN = 50;
const MAX_RETRY_COUNT = 10;

/**
 * Reconcile the outbox: retry pending and failed events.
 * Respects exponential backoff via next_retry_at.
 * Runs every 5 minutes via Vercel Cron.
 */
export async function reconcileOutbox(
  supabase: SupabaseClient
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  console.log('[nexusReconciliation] Starting outbox reconciliation...');

  const now = new Date().toISOString();

  try {
    // Fetch events that are pending, retrying, or failed (up to max per run)
    const { data: pending, error } = await supabase
      .from('nexus_event_outbox')
      .select('*')
      .in('status', ['pending', 'retrying', 'failed'] as OutboxStatus[])
      .order('created_at', { ascending: true })
      .limit(MAX_EVENTS_PER_RUN);

    if (error) {
      console.error('[nexusReconciliation] Failed to fetch pending events:', error);
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    if (!pending || pending.length === 0) {
      console.log('[nexusReconciliation] No pending events to process');
      return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    }

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`[nexusReconciliation] Found ${pending.length} events to process`);

    for (const row of pending as NexusEventOutbox[]) {
      // Skip if next_retry_at is in the future (exponential backoff)
      if (row.next_retry_at && row.next_retry_at > now) {
        skipped++;
        continue;
      }

      // Skip if max retries exceeded
      if (row.retry_count >= MAX_RETRY_COUNT && row.status === 'failed') {
        skipped++;
        continue;
      }

      try {
        const event = row.event as NexusEvent;
        const updatedEvent = {
          ...event,
          metadata: {
            ...event.metadata,
            retry_count: row.retry_count,
          },
        };

        const result = await deliverEvent(supabase, updatedEvent);

        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(
          `[nexusReconciliation] Error processing event ${row.event_id}:`,
          err
        );
        failed++;
      }
    }

    console.log('[nexusReconciliation] Reconciliation complete:', {
      processed: pending.length,
      succeeded,
      failed,
      skipped,
    });

    return {
      processed: pending.length,
      succeeded,
      failed,
      skipped,
    };
  } catch (err) {
    console.error('[nexusReconciliation] Fatal error:', err);
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
  }
}

/**
 * Full reconciliation: re-emit all events for an org since a given timestamp.
 * Used when NEXUS has been down and needs to catch up.
 */
export async function fullReconciliation(
  supabase: SupabaseClient,
  orgId: string,
  since: Date,
  entityTypes?: string[]
): Promise<{
  replayed: number;
  succeeded: number;
  failed: number;
}> {
  console.log(
    `[nexusReconciliation] Starting full reconciliation for org ${orgId} since ${since.toISOString()}`
  );

  try {
    let query = supabase
      .from('nexus_event_log')
      .select('*')
      .eq('org_id', orgId)
      .eq('direction', 'dex_to_nexus')
      .gte('delivered_at', since.toISOString())
      .order('delivered_at', { ascending: true });

    const { data: events, error } = await query;

    if (error) {
      console.error('[nexusReconciliation] Failed to fetch event log:', error);
      return { replayed: 0, succeeded: 0, failed: 0 };
    }

    if (!events || events.length === 0) {
      console.log('[nexusReconciliation] No events to replay');
      return { replayed: 0, succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    for (const eventLog of events) {
      try {
        const event = eventLog.payload as NexusEvent;

        // Filter by entity type if specified
        if (entityTypes && entityTypes.length > 0) {
          const entityType = extractEntityTypeFromEvent(event);
          if (entityType && !entityTypes.includes(entityType)) {
            continue;
          }
        }

        const result = await deliverEvent(supabase, event);
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(
          `[nexusReconciliation] Error replaying event ${eventLog.event_id}:`,
          err
        );
        failed++;
      }
    }

    console.log('[nexusReconciliation] Full reconciliation complete:', {
      total_events: events.length,
      replayed: succeeded + failed,
      succeeded,
      failed,
    });

    return {
      replayed: succeeded + failed,
      succeeded,
      failed,
    };
  } catch (err) {
    console.error('[nexusReconciliation] Full reconciliation error:', err);
    return { replayed: 0, succeeded: 0, failed: 0 };
  }
}

/**
 * Get outbox statistics for monitoring.
 */
export async function getOutboxStats(
  supabase: SupabaseClient,
  orgId?: string
): Promise<{
  total: number;
  pending: number;
  delivered: number;
  failed: number;
  retrying: number;
}> {
  try {
    const stats = {
      total: 0,
      pending: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
    };

    // Count by status
    const statuses: OutboxStatus[] = ['pending', 'delivered', 'failed', 'retrying'];

    for (const status of statuses) {
      let query = supabase
        .from('nexus_event_outbox')
        .select('event_id', { count: 'exact', head: true })
        .eq('status', status);

      if (orgId) {
        // Can't filter by org_id directly since it's nested in JSONB event
        // For now, return all; org-specific stats would need a dedicated column
      }

      const { count } = await query;
      stats[status] = count || 0;
      stats.total += count || 0;
    }

    return stats;
  } catch (err) {
    console.error('[nexusReconciliation] Failed to get outbox stats:', err);
    return { total: 0, pending: 0, delivered: 0, failed: 0, retrying: 0 };
  }
}

/**
 * Get sync state for a specific entity or org.
 */
export async function getSyncState(
  supabase: SupabaseClient,
  orgId: string,
  entityType?: string,
  entityId?: string
): Promise<Array<{
  entity_type: string;
  entity_id: string;
  last_synced_at: string;
  sync_status: string;
}>> {
  try {
    let query = supabase
      .from('nexus_sync_state')
      .select('entity_type, entity_id, last_synced_at, sync_status')
      .eq('org_id', orgId)
      .order('last_synced_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error('[nexusReconciliation] Failed to get sync state:', error);
      return [];
    }

    return data as Array<{
      entity_type: string;
      entity_id: string;
      last_synced_at: string;
      sync_status: string;
    }>;
  } catch (err) {
    console.error('[nexusReconciliation] Sync state error:', err);
    return [];
  }
}

/**
 * Extract entity type from an event for filtering
 */
function extractEntityTypeFromEvent(event: NexusEvent): string | null {
  const payload = event.payload as Record<string, unknown>;

  const typeMap: Record<string, string> = {
    mandate_id: 'mandate',
    candidate_id: 'candidate',
    placement_id: 'placement',
    feedback_id: 'client_feedback',
    assessment_id: 'assessment',
    shortlist_id: 'shortlist',
    benchmark_id: 'benchmark',
  };

  for (const [field, type] of Object.entries(typeMap)) {
    if (payload[field] && typeof payload[field] === 'string') {
      return type;
    }
  }

  return null;
}

export default {
  reconcileOutbox,
  fullReconciliation,
  getOutboxStats,
  getSyncState,
};
