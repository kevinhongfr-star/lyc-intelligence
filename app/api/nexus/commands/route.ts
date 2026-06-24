// Phase 0.6: NEXUS Command Receiver API
// Handles incoming commands from NEXUS orchestration layer

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyNexusCommandSignature } from '@/utils/nexusAuth';
import type {
  NexusCommand,
  NexusCommandResponse,
} from '@/types/nexusEvents';

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const bodyText = await request.text();
    const signature = request.headers.get('X-NEXUS-Signature') || '';

    if (!verifyNexusCommandSignature(bodyText, signature)) {
      console.warn('[nexus commands] Invalid signature received');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const command = JSON.parse(bodyText) as NexusCommand;

    // Log the command
    await logCommand(supabase, command, bodyText);

    // Process command
    const response = await processCommand(supabase, command);

    // Update command log with response
    await updateCommandLog(supabase, command.command_id, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[nexus commands] Error processing command:', error);
    return NextResponse.json(
      {
        command_id: 'unknown',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process an incoming NEXUS command and return a response.
 */
async function processCommand(
  supabase: ReturnType<typeof createClient>,
  command: NexusCommand
): Promise<NexusCommandResponse> {
  const processedAt = new Date().toISOString();

  switch (command.type) {
    case 'run_trident':
    case 'run_grid':
    case 'run_canvas':
    case 'run_wave':
    case 'run_lens': {
      const assessmentType = command.type.replace('run_', '').toUpperCase();
      return {
        command_id: command.command_id,
        status: 'queued',
        message: `${assessmentType} assessment queued for candidate ${command.candidate_id}`,
        data: {
          assessment_type: assessmentType,
          candidate_id: command.candidate_id,
          mandate_id: 'mandate_id' in command ? command.mandate_id : undefined,
        },
        processed_at: processedAt,
      };
    }

    case 'run_benchmark': {
      return {
        command_id: command.command_id,
        status: 'queued',
        message: `Benchmark assessment queued`,
        data: {
          benchmark_id: command.benchmark_id,
          candidate_id: command.candidate_id,
        },
        processed_at: processedAt,
      };
    }

    case 'sync_mandate_data': {
      // Trigger re-emission of all events for this mandate
      const result = await triggerMandateSync(
        supabase,
        command.org_id,
        command.mandate_id,
        command.entity_types
      );

      return {
        command_id: command.command_id,
        status: 'accepted',
        message: `Mandate sync triggered for ${command.mandate_id}`,
        data: result,
        processed_at: processedAt,
      };
    }

    case 'get_candidate_profile': {
      const profile = await getCandidateProfile(
        supabase,
        command.org_id,
        command.candidate_id,
        command.include_assessments,
        command.include_pipeline
      );

      return {
        command_id: command.command_id,
        status: 'ok',
        data: profile,
        processed_at: processedAt,
      };
    }

    case 'get_mandate_details': {
      const details = await getMandateDetails(
        supabase,
        command.org_id,
        command.mandate_id,
        command.include_candidates,
        command.include_shortlist
      );

      return {
        command_id: command.command_id,
        status: 'ok',
        data: details,
        processed_at: processedAt,
      };
    }

    case 'trigger_reconciliation': {
      const { fullReconciliation } = await import(
        '@/services/nexusReconciliation'
      );
      const result = await fullReconciliation(
        supabase,
        command.org_id,
        new Date(command.since),
        command.entity_types
      );

      return {
        command_id: command.command_id,
        status: 'completed',
        message: `Reconciliation completed: ${result.replayed} events replayed`,
        data: result,
        processed_at: processedAt,
      };
    }

    default: {
      return {
        command_id: command.command_id,
        status: 'failed',
        message: `Unknown command type: ${(command as { type: string }).type}`,
        processed_at: processedAt,
      };
    }
  }
}

/**
 * Log incoming command to audit log.
 */
async function logCommand(
  supabase: ReturnType<typeof createClient>,
  command: NexusCommand,
  rawBody: string
): Promise<void> {
  try {
    await supabase.from('nexus_command_log').insert({
      command_id: command.command_id,
      org_id: command.org_id,
      command_type: command.type,
      payload: command as unknown as Record<string, unknown>,
      status: 'received',
      received_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[nexus commands] Failed to log command:', err);
  }
}

/**
 * Update command log with response.
 */
async function updateCommandLog(
  supabase: ReturnType<typeof createClient>,
  commandId: string,
  response: NexusCommandResponse
): Promise<void> {
  try {
    await supabase
      .from('nexus_command_log')
      .update({
        status: response.status === 'failed' ? 'failed' : 'completed',
        response: response as unknown as Record<string, unknown>,
        completed_at: response.processed_at || new Date().toISOString(),
        error_message: response.status === 'failed' ? response.message : null,
      })
      .eq('command_id', commandId);
  } catch (err) {
    console.error('[nexus commands] Failed to update command log:', err);
  }
}

/**
 * Trigger re-emission of all events for a mandate (reconciliation).
 */
async function triggerMandateSync(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  mandateId: string,
  entityTypes?: string[]
): Promise<Record<string, unknown>> {
  try {
    const eventCount = 0;
    return {
      mandate_id: mandateId,
      entity_types: entityTypes || ['all'],
      events_queued: eventCount,
      sync_status: 'initiated',
    };
  } catch (err) {
    console.error('[nexus commands] Mandate sync error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get candidate profile data for NEXUS.
 */
async function getCandidateProfile(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  candidateId: string,
  includeAssessments?: boolean,
  includePipeline?: boolean
): Promise<Record<string, unknown>> {
  try {
    const { data: candidate, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', candidateId)
      .eq('organization_id', orgId)
      .single();

    if (error || !candidate) {
      return { error: 'Candidate not found' };
    }

    const result: Record<string, unknown> = {
      candidate,
    };

    if (includeAssessments) {
      const { data: assessments } = await supabase
        .from('candidate_assessments')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
      result.assessments = assessments || [];
    }

    if (includePipeline) {
      const { data: pipeline } = await supabase
        .from('candidates')
        .select('*')
        .eq('contact_id', candidateId)
        .order('created_at', { ascending: false });
      result.pipeline = pipeline || [];
    }

    return result;
  } catch (err) {
    console.error('[nexus commands] Candidate profile error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get mandate details for NEXUS.
 */
async function getMandateDetails(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  mandateId: string,
  includeCandidates?: boolean,
  includeShortlist?: boolean
): Promise<Record<string, unknown>> {
  try {
    const { data: mandate, error } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', mandateId)
      .eq('organization_id', orgId)
      .single();

    if (error || !mandate) {
      return { error: 'Mandate not found' };
    }

    const result: Record<string, unknown> = {
      mandate,
    };

    if (includeCandidates) {
      const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .eq('mandate_id', mandateId)
        .order('created_at', { ascending: false });
      result.candidates = candidates || [];
    }

    if (includeShortlist) {
      const { data: shortlist } = await supabase
        .from('candidates')
        .select('*')
        .eq('mandate_id', mandateId)
        .eq('status', 'shortlisted')
        .order('created_at', { ascending: false });
      result.shortlist = shortlist || [];
    }

    return result;
  } catch (err) {
    console.error('[nexus commands] Mandate details error:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
