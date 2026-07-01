/**
 * Agents invoke handler — DEX Platform Foundation T1
 *
 * Route:
 *   POST /api/agents/invoke — Consultant triggers an agent run (D-1: must be human)
 *
 * Flow:
 *   1. Validate caller is authenticated human (no agent_id)
 *   2. Create agent_actions record with status=pending
 *   3. Call DeepSeek API via Coze orchestration
 *   4. Update agent_actions.output_data with results
 *   5. Return pending action to consultant for review (L2)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, update, selectOne, isSupabaseConfigured, handleError } from './supabaseRest.js';
import { getUserFromRequest } from './adminAuth.js';

export const maxDuration = 60;

const VALID_AGENTS = ['trident', 'canvas', 'grid', 'sweep', 'alessio'];
const VALID_ACTION_TYPES = ['score', 'narrate', 'map', 'research', 'notify', 'draft', 'enrich', 'parse'];

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

export async function handleAgentsInvoke(req: VercelRequest, res: VercelResponse) {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Supabase not configured',
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Verify human caller (D-1: must be human, not an agent)
    const { user, error } = await getUserFromRequest(req);
    if (error || !user) {
      return res.status(401).json({ success: false, error: error || 'Unauthorized' });
    }

    const {
      agent_id,
      action_type,
      contact_id,
      mandate_id,
      company_id,
      parameters = {},
    } = req.body || {};

    // Validate agent_id
    if (!agent_id || !VALID_AGENTS.includes(agent_id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent_id. Must be one of: ${VALID_AGENTS.join(', ')}`,
      });
    }

    // Validate action_type
    if (!action_type || !VALID_ACTION_TYPES.includes(action_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`,
      });
    }

    // Get contact data if contact_id provided
    let contactData: any = null;
    if (contact_id) {
      const contact = await selectOne('contacts', {
        column: 'id',
        value: contact_id,
        select: 'id, name, email, current_title, linkedin_url, career_history, education, trident_scores, canvas_profile',
      });
      if (!contact) {
        return res.status(400).json({ success: false, error: 'contact_id not found' });
      }
      contactData = contact;
    }

    // Create pending agent action record
    const inputData = {
      agent_id,
      action_type,
      contact_id,
      mandate_id,
      company_id,
      parameters,
      contact_fields: contactData || null,
      invoked_by: user.id,
      invoked_at: new Date().toISOString(),
    };

    const actionRecord = await insert('agent_actions', {
      agent_id,
      action_type,
      triggered_by: user.id,
      contact_id: contact_id || null,
      mandate_id: mandate_id || null,
      company_id: company_id || null,
      input_data: inputData,
      output_data: {},
      status: 'pending',
      metadata: { parameters },
    }, 15000);

    // Call DeepSeek via Coze orchestration (async — don't wait for completion)
    // In production, this would be handled by a background job via Coze
    setImmediate(async () => {
      try {
        const outputData = await callAgentAI(agent_id, action_type, contactData, parameters);
        await update('agent_actions', { column: 'id', value: actionRecord.id }, {
          output_data: outputData,
        }, 15000);
      } catch (e) {
        console.error(`[agents/invoke] AI call failed for action ${actionRecord.id}:`, e);
        await update('agent_actions', { column: 'id', value: actionRecord.id }, {
          status: 'failed',
          error_message: String(e),
        }, 15000);
      }
    });

    return res.status(202).json({
      success: true,
      message: 'Agent invoked — pending review',
      action_id: actionRecord.id,
      status: 'pending',
    });
  } catch (err) {
    return handleError(res, 'agents/invoke', err);
  }
}

async function callAgentAI(
  agentId: string,
  actionType: string,
  contactData: any,
  parameters: Record<string, any>
): Promise<any> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  // Build prompt based on agent and action type
  const prompt = buildAgentPrompt(agentId, actionType, contactData, parameters);

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: agentId === 'canvas' ? 'deepseek-chat' : 'deepseek-chat',
      messages: [
        { role: 'system', content: getAgentSystemPrompt(agentId) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  // Parse JSON output from the model
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { raw_output: content };
  } catch {
    return { raw_output: content };
  }
}

function getAgentSystemPrompt(agentId: string): string {
  const prompts: Record<string, string> = {
    trident: `You are TRIDENT, an executive assessment agent. Analyze candidate data and provide structured scoring across D1 (Experience), D2 (Capabilities), D3 (Leadership). Return JSON with D1, D2, D3 scores (0-100), evidence array, composite score, and verdict.`,
    canvas: `You are CANVAS, a candidate narration agent. Generate a rich executive profile from candidate data. Return JSON with executive_summary, career_arc, distinguishing_signals, risk_factors, growth_trajectory, and six_dimensions scoring.`,
    grid: `You are GRID, a market mapping agent. Map target companies and candidates. Return JSON with company_list, candidate_count, sector_analysis, and minimum_standards assessment.`,
    sweep: `You are SWEEP, a talent sourcing agent. Find candidates matching criteria. Return JSON with candidate_list and match_reasons.`,
    alessio: `You are ALESSIO, a research agent. Research companies and contacts. Return JSON with findings, sources, and key_insights.`,
  };
  return prompts[agentId] || 'You are a helpful AI agent.';
}

function buildAgentPrompt(
  agentId: string,
  actionType: string,
  contactData: any,
  parameters: Record<string, any>
): string {
  if (actionType === 'score' && contactData) {
    return `Score this candidate:
Name: ${contactData.name || 'N/A'}
Title: ${contactData.current_title || 'N/A'}
LinkedIn: ${contactData.linkedin_url || 'N/A'}
Career History: ${JSON.stringify(contactData.career_history || [])}
Education: ${JSON.stringify(contactData.education || [])}

Provide structured scores and analysis in JSON format.`;
  }

  if (actionType === 'narrate' && contactData) {
    return `Generate an executive narration for:
Name: ${contactData.name || 'N/A'}
Title: ${contactData.current_title || 'N/A'}
Career History: ${JSON.stringify(contactData.career_history || [])}
Education: ${JSON.stringify(contactData.education || [])}

Provide a comprehensive executive profile in JSON format.`;
  }

  if (actionType === 'map') {
    return `Map target companies for mandate with parameters: ${JSON.stringify(parameters)}. Return JSON with company list and analysis.`;
  }

  return `Agent: ${agentId}, Action: ${actionType}, Parameters: ${JSON.stringify(parameters)}`;
}
