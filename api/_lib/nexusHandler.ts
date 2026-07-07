/**
 * api/_lib/nexusHandler.ts
 * Routes:
 *   POST /api/nexus/chat       → Nexus chatbot with DeepSeek + unified persona
 *   POST /api/x/nexus/commands → NEXUS → DEX commands
 *   POST /api/x/nexus/webhook  → NEXUS webhook receiver
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';
import { handleNexusChat } from './nexusChatHandler.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || ''; // 'chat', 'commands', or 'webhook'
  const method = req.method || 'POST';

  try {
    // ── Nexus Chat (POST only) ──
    if (resource === 'chat' && method === 'POST') {
      return handleNexusChat(req, res);
    }

    // ── NEXUS Commands (POST only) ──
    if (resource === 'commands' && method === 'POST') {
      const body = req.body || {};
      const command = body;

      if (!command.command_id || !command.type || !command.org_id) {
        return res.status(400).json({ error: 'Invalid command format' });
      }

      // Log command
      await db.insert('nexus_command_log', {
        command_id: command.command_id,
        org_id: command.org_id,
        command_type: command.type,
        payload: command,
        status: 'received',
        received_at: new Date().toISOString(),
      });

      const processedAt = new Date().toISOString();

      // Process based on type
      let response: any = { command_id: command.command_id, processed_at: processedAt };

      switch (command.type) {
        case 'run_trident':
        case 'run_grid':
        case 'run_canvas':
        case 'run_wave':
        case 'run_lens':
        case 'run_benchmark':
          response.status = 'queued';
          response.assessment_type = command.type.replace('run_', '').toUpperCase();
          break;
        case 'sync_mandate_data':
          response.status = 'accepted';
          response.mandate_id = command.mandate_id;
          break;
        case 'get_candidate_profile':
          response.status = 'ok';
          response.data = { candidate_id: command.candidate_id };
          break;
        case 'get_mandate_details':
          response.status = 'ok';
          response.data = { mandate_id: command.mandate_id };
          break;
        default:
          response.status = 'failed';
          response.message = `Unknown command type: ${command.type}`;
      }

      // Update command log with response
      await db.update('nexus_command_log', {
        status: response.status === 'failed' ? 'failed' : 'completed',
        response,
        completed_at: processedAt,
      }, command.command_id, 'command_id');

      return res.status(200).json(response);
    }

    // ── NEXUS Webhook (POST only) ──
    if (resource === 'webhook' && method === 'POST') {
      const body = req.body || {};
      const event = body;

      if (!event.event_id) {
        return res.status(400).json({ error: 'Invalid event format' });
      }

      // Log incoming event
      await db.insert('nexus_event_log', {
        event_id: event.event_id,
        event_type: event.event_type,
        org_id: event.org_id,
        payload: event.payload,
        delivered_at: new Date().toISOString(),
        response_status: 200,
        direction: 'nexus_to_dex',
      });

      return res.status(200).json({
        received: true,
        event_id: event.event_id,
        message: 'Event received',
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[nexusHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
