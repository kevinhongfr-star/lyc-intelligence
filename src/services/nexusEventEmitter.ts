// Phase 0.6: NEXUS Event Emitter
// Transactional outbox pattern for reliable DEX → NEXUS event delivery

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NexusEvent,
  NexusEventType,
  NexusEventMetadata,
  OutboxStatus,
} from '@/types/nexusEvents';
import { NEXUS_EVENT_VERSION, NEXUS_SOURCE } from '@/types/nexusEvents';
import { getNexusSignature } from '@/utils/nexusAuth';

const MAX_RETRY_COUNT = 10;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 300_000; // 5 minutes
const DELIVERY_TIMEOUT_MS = 10_000; // 10 seconds

// NEXUS Webhook URL - this is a public URL, not a secret
const NEXUS_WEBHOOK_URL = import.meta.env.VITE_NEXUS_WEBHOOK_URL || '';

/**
 * Generate a UUID v4 using crypto
 */
function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Build a NEXUS event envelope with standard metadata.
 */
export function buildNexusEvent<T = Record<string, unknown>>(
  orgId: string,
  eventType: NexusEventType,
  payload: T,
  correlationId?: string
): NexusEvent<T> {
  const eventId = generateId();
  const timestamp = new Date().toISOString();

  const metadata: NexusEventMetadata = {
    correlation_id: correlationId ?? generateId(),
    retry_count: 0,
  };

  return {
    event_id: eventId,
    event_type: eventType,
    timestamp,
    org_id: orgId,
    source: NEXUS_SOURCE,
    version: NEXUS_EVENT_VERSION,
    payload,
    metadata,
  };
}

/**
 * Emit a NEXUS event: persist to outbox, then attempt delivery.
 * Implements the transactional outbox pattern.
 */
export async function emitNexusEvent<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  orgId: string,
  eventType: NexusEventType,
  payload: T,
  correlationId?: string
): Promise<NexusEvent<T>> {
  const event = buildNexusEvent(orgId, eventType, payload, correlationId);

  // Step 1: Persist to outbox first (transactional outbox)
  await persistToOutbox(supabase, event);

  // Step 2: Attempt delivery (async, don't block if webhook not configured)
  if (NEXUS_WEBHOOK_URL) {
    // Fire and forget - don't await to avoid blocking the caller
    deliverEvent(supabase, event).catch(err => {
      console.error(`[nexusEmitter] Delivery failed for ${event.event_id}:`, err);
    });
  } else {
    console.warn('[nexusEmitter] NEXUS_WEBHOOK_URL not configured, event stored in outbox');
  }

  return event;
}

/**
 * Persist event to the outbox table.
 */
async function persistToOutbox<T>(
  supabase: SupabaseClient,
  event: NexusEvent<T>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('nexus_event_outbox')
      .insert({
        event_id: event.event_id,
        event: event as unknown as Record<string, unknown>,
        status: 'pending' as OutboxStatus,
        retry_count: 0,
        created_at: event.timestamp,
      });

    if (error) {
      console.error('[nexusEmitter] Failed to persist to outbox:', error);
      throw error;
    }
  } catch (err) {
    console.error('[nexusEmitter] Outbox persistence error:', err);
    throw err;
  }
}

/**
 * Deliver a single event to the NEXUS webhook endpoint.
 */
export async function deliverEvent<T>(
  supabase: SupabaseClient,
  event: NexusEvent<T>
): Promise<{ success: boolean; responseStatus?: number; responseBody?: string }> {
  if (!NEXUS_WEBHOOK_URL) {
    return { success: false, responseBody: 'No webhook URL configured' };
  }

  const payloadJson = JSON.stringify(event);
  let signature: string;

  try {
    signature = await getNexusSignature(payloadJson, 'webhook');
  } catch (err) {
    return { success: false, responseBody: 'Failed to get signature' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const response = await fetch(NEXUS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NEXUS-Signature': signature,
        'X-NEXUS-Event-Type': event.event_type,
        'X-NEXUS-Event-Id': event.event_id,
      },
      body: payloadJson,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    if (response.ok) {
      // Mark as delivered
      await markAsDelivered(supabase, event.event_id, response.status, responseBody);

      // Log to event audit log
      await logEvent(supabase, event, response.status, responseBody);

      // Update sync state
      await updateSyncState(supabase, event);

      return { success: true, responseStatus: response.status, responseBody };
    } else {
      // Mark as failed, schedule retry
      const retryCount = event.metadata.retry_count + 1;
      const nextRetryAt = calculateNextRetry(retryCount);

      await markAsFailed(
        supabase,
        event.event_id,
        `HTTP ${response.status}`,
        retryCount,
        nextRetryAt
      );

      return {
        success: false,
        responseStatus: response.status,
        responseBody,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const retryCount = event.metadata.retry_count + 1;
    const nextRetryAt = calculateNextRetry(retryCount);

    await markAsFailed(
      supabase,
      event.event_id,
      errorMessage,
      retryCount,
      nextRetryAt
    );

    return { success: false, responseBody: errorMessage };
  }
}

/**
 * Calculate next retry time using exponential backoff.
 */
function calculateNextRetry(retryCount: number): string {
  const backoffMs = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, Math.max(0, retryCount - 1)),
    MAX_BACKOFF_MS
  );
  return new Date(Date.now() + backoffMs).toISOString();
}

/**
 * Mark event as delivered in the outbox.
 */
async function markAsDelivered(
  supabase: SupabaseClient,
  eventId: string,
  responseStatus: number,
  responseBody: string
): Promise<void> {
  try {
    await supabase
      .from('nexus_event_outbox')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('event_id', eventId);

    // Log success
    console.debug(`[nexusEmitter] Event ${eventId} delivered`);
  } catch (err) {
    console.error('[nexusEmitter] Failed to mark as delivered:', err);
  }
}

/**
 * Mark event as failed in the outbox.
 */
async function markAsFailed(
  supabase: SupabaseClient,
  eventId: string,
  error: string,
  retryCount: number,
  nextRetryAt: string
): Promise<void> {
  try {
    const status = retryCount >= MAX_RETRY_COUNT ? 'failed' : 'retrying';

    await supabase
      .from('nexus_event_outbox')
      .update({
        status,
        retry_count: retryCount,
        last_error: error,
        next_retry_at: status === 'retrying' ? nextRetryAt : null,
      })
      .eq('event_id', eventId);

    console.warn(
      `[nexusEmitter] Event ${eventId} ${status} (retry ${retryCount}/${MAX_RETRY_COUNT}): ${error}`
    );
  } catch (err) {
    console.error('[nexusEmitter] Failed to mark as failed:', err);
  }
}

/**
 * Log event to the audit log.
 */
async function logEvent<T>(
  supabase: SupabaseClient,
  event: NexusEvent<T>,
  responseStatus: number,
  responseBody: string
): Promise<void> {
  try {
    await supabase
      .from('nexus_event_log')
      .insert({
        event_id: event.event_id,
        event_type: event.event_type,
        org_id: event.org_id,
        payload: event.payload as unknown as Record<string, unknown>,
        delivered_at: new Date().toISOString(),
        response_status: responseStatus,
        response_body: responseBody.substring(0, 1000),
        direction: 'dex_to_nexus',
      });
  } catch (err) {
    console.error('[nexusEmitter] Failed to log event:', err);
  }
}

/**
 * Update sync state for the entity referenced in the event.
 */
async function updateSyncState<T>(
  supabase: SupabaseClient,
  event: NexusEvent<T>
): Promise<void> {
  try {
    const entityInfo = extractEntityInfo(event);
    if (!entityInfo) return;

    const { entityType, entityId } = entityInfo;

    await supabase
      .from('nexus_sync_state')
      .upsert(
        {
          org_id: event.org_id,
          entity_type: entityType,
          entity_id: entityId,
          last_synced_at: new Date().toISOString(),
          last_event_id: event.event_id,
          sync_status: 'synced',
        },
        {
          onConflict: 'org_id, entity_type, entity_id',
        }
      );
  } catch (err) {
    console.error('[nexusEmitter] Failed to update sync state:', err);
  }
}

/**
 * Extract entity type and ID from an event payload.
 */
function extractEntityInfo<T>(
  event: NexusEvent<T>
): { entityType: string; entityId: string } | null {
  const payload = event.payload as Record<string, unknown>;

  // Try common ID fields
  const idFields = [
    'mandate_id',
    'candidate_id',
    'placement_id',
    'feedback_id',
    'assessment_id',
    'shortlist_id',
    'benchmark_id',
  ];

  const typeMap: Record<string, string> = {
    mandate_id: 'mandate',
    candidate_id: 'candidate',
    placement_id: 'placement',
    feedback_id: 'client_feedback',
    assessment_id: 'assessment',
    shortlist_id: 'shortlist',
    benchmark_id: 'benchmark',
  };

  for (const field of idFields) {
    if (payload[field] && typeof payload[field] === 'string') {
      return {
        entityType: typeMap[field] || field.replace('_id', ''),
        entityId: payload[field] as string,
      };
    }
  }

  return null;
}

export default {
  emitNexusEvent,
  deliverEvent,
  buildNexusEvent,
};
