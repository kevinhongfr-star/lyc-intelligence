// Phase 0.6: NEXUS Webhook Receiver
// Receives events from NEXUS (NEXUS → DEX direction)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyNexusSignature } from '@/utils/nexusAuth';
import type { NexusEvent, NexusWebhookResponse } from '@/types/nexusEvents';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const bodyText = await request.text();
    const signature = request.headers.get('X-NEXUS-Signature') || '';
    const eventType = request.headers.get('X-NEXUS-Event-Type') || '';
    const eventId = request.headers.get('X-NEXUS-Event-Id') || '';

    if (!verifyNexusSignature(bodyText, signature)) {
      console.warn('[nexus webhook] Invalid signature received');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(bodyText) as NexusEvent;

    // Log the incoming event
    await logIncomingEvent(supabase, event, eventType);

    // Process the event
    const processed = await processNexusEvent(supabase, event);

    const response: NexusWebhookResponse = {
      received: true,
      event_id: event.event_id || eventId,
      message: processed ? 'Event processed' : 'Event received',
    };

    return NextResponse.json(response, { status: processed ? 200 : 202 });
  } catch (error) {
    console.error('[nexus webhook] Error processing webhook:', error);
    return NextResponse.json(
      {
        received: false,
        event_id: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process an incoming NEXUS event.
 * Returns true if the event was fully processed, false if queued.
 */
async function processNexusEvent(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent
): Promise<boolean> {
  switch (event.event_type) {
    case 'assessment.completed':
      return await handleAssessmentCompleted(supabase, event);

    case 'candidate.status_changed':
      return await handleCandidateStatusChanged(supabase, event);

    case 'mandate.updated':
      return await handleMandateUpdated(supabase, event);

    default:
      console.log(
        `[nexus webhook] Event type ${event.event_type} received but no handler implemented`
      );
      return false; // Queued / acknowledged but not processed
  }
}

/**
 * Handle assessment completed event from NEXUS.
 */
async function handleAssessmentCompleted(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent
): Promise<boolean> {
  try {
    const payload = event.payload as {
      candidate_id: string;
      mandate_id: string;
      assessment_type: string;
      scores: Record<string, number>;
      overall_score: number;
      completed_at: string;
    };

    console.log(
      `[nexus webhook] Assessment completed: ${payload.assessment_type} for candidate ${payload.candidate_id}`
    );

    // Update sync state
    await updateSyncStateFromEvent(supabase, event, 'synced');

    return true;
  } catch (err) {
    console.error('[nexus webhook] handleAssessmentCompleted error:', err);
    await updateSyncStateFromEvent(supabase, event, 'failed');
    return false;
  }
}

/**
 * Handle candidate status changed event from NEXUS.
 */
async function handleCandidateStatusChanged(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent
): Promise<boolean> {
  try {
    const payload = event.payload as {
      candidate_id: string;
      mandate_id: string;
      from_status: string;
      to_status: string;
    };

    console.log(
      `[nexus webhook] Candidate status changed: ${payload.from_status} → ${payload.to_status}`
    );

    await updateSyncStateFromEvent(supabase, event, 'synced');
    return true;
  } catch (err) {
    console.error('[nexus webhook] handleCandidateStatusChanged error:', err);
    await updateSyncStateFromEvent(supabase, event, 'failed');
    return false;
  }
}

/**
 * Handle mandate updated event from NEXUS.
 */
async function handleMandateUpdated(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent
): Promise<boolean> {
  try {
    const payload = event.payload as {
      mandate_id: string;
      updated_fields: string[];
    };

    console.log(
      `[nexus webhook] Mandate updated: ${payload.mandate_id}, fields: ${payload.updated_fields.join(', ')}`
    );

    await updateSyncStateFromEvent(supabase, event, 'synced');
    return true;
  } catch (err) {
    console.error('[nexus webhook] handleMandateUpdated error:', err);
    await updateSyncStateFromEvent(supabase, event, 'failed');
    return false;
  }
}

/**
 * Log incoming NEXUS event to audit log.
 */
async function logIncomingEvent(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent,
  eventType: string
): Promise<void> {
  try {
    await supabase.from('nexus_event_log').insert({
      event_id: event.event_id,
      event_type: eventType || event.event_type,
      org_id: event.org_id,
      payload: event.payload as unknown as Record<string, unknown>,
      delivered_at: new Date().toISOString(),
      response_status: 200,
      direction: 'nexus_to_dex',
    });
  } catch (err) {
    console.error('[nexus webhook] Failed to log event:', err);
  }
}

/**
 * Update sync state based on incoming event.
 */
async function updateSyncStateFromEvent(
  supabase: ReturnType<typeof createClient>,
  event: NexusEvent,
  status: 'synced' | 'pending' | 'failed' | 'conflict'
): Promise<void> {
  try {
    const payload = event.payload as Record<string, unknown>;

    const idFields = [
      'mandate_id',
      'candidate_id',
      'placement_id',
      'assessment_id',
    ];
    const typeMap: Record<string, string> = {
      mandate_id: 'mandate',
      candidate_id: 'candidate',
      placement_id: 'placement',
      assessment_id: 'assessment',
    };

    for (const field of idFields) {
      if (payload[field] && typeof payload[field] === 'string') {
        const entityType = typeMap[field] || field.replace('_id', '');
        const entityId = payload[field] as string;

        await supabase
          .from('nexus_sync_state')
          .upsert(
            {
              org_id: event.org_id,
              entity_type: entityType,
              entity_id: entityId,
              last_synced_at: new Date().toISOString(),
              last_event_id: event.event_id,
              sync_status: status,
            },
            { onConflict: 'org_id, entity_type, entity_id' }
          );
        break;
      }
    }
  } catch (err) {
    console.error('[nexus webhook] Failed to update sync state:', err);
  }
}
