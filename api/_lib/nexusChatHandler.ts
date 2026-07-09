/**
 * api/_lib/nexusChatHandler.ts
 * Dedicated Nexus chat endpoint with unified persona + DeepSeek SSE streaming
 * 
 * Routes:
 *   POST /api/nexus/chat — Main chat endpoint
 * 
 * Body: { 
 *   message: string,
 *   messages?: Array<{role, content}>,
 *   session_id?: string,
 *   use_case?: string,
 *   profile?: { title?: string, company?: string },
 *   history?: Array<{role, content}>,
 *   tier?: string,
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromRequest } from './adminAuth.js';

// ── DeepSeek Configuration ──
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// ── Rate limiter (in-memory, per-instance) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (entry && now < entry.resetAt) {
    if (entry.count >= maxRequests) return false;
    entry.count++;
    return true;
  }
  rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
  return true;
}

function getClientIp(req: VercelRequest): string {
  return ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
    (req.headers['x-real-ip'] as string) ||
    'unknown';
}

// ── Seniority Detection ──
type SeniorityLevel = 'c_suite' | 'vp' | 'director' | 'manager' | 'individual';

function detectSeniorityLevel(profile?: { title?: string }): SeniorityLevel {
  if (!profile?.title) return 'director';
  const title = profile.title.toLowerCase();
  if (/ceo|cfo|coo|cto|cio|cmo|president|chief|managing director|md/i.test(title)) return 'c_suite';
  if (/vp|vice president|vice-president|head of|director general/i.test(title)) return 'vp';
  if (/director|senior director|executive director/i.test(title)) return 'director';
  if (/manager|senior manager|lead|team lead|supervisor/i.test(title)) return 'manager';
  return 'individual';
}

function getToneCalibration(level: SeniorityLevel) {
  const calibrations = {
    c_suite: { formality: 90, directness: 85, strategic_depth: 95, terminology: 'executive', wordLimit: '100-150' },
    vp: { formality: 80, directness: 75, strategic_depth: 85, terminology: 'executive', wordLimit: '150-200' },
    director: { formality: 70, directness: 65, strategic_depth: 70, terminology: 'professional', wordLimit: '150-250' },
    manager: { formality: 60, directness: 55, strategic_depth: 50, terminology: 'accessible', wordLimit: '150-250' },
    individual: { formality: 50, directness: 50, strategic_depth: 40, terminology: 'accessible', wordLimit: '150-250' },
  };
  return calibrations[level];
}

// ── Build Unified System Prompt ──
function buildSystemPrompt(
  seniority: SeniorityLevel,
  useCase?: string,
  memoryContext?: string
): string {
  const tone = getToneCalibration(seniority);
  
  return `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You carry that institutional knowledge into every conversation. You are not a generic AI assistant — you are a calibrated executive coach with deep domain expertise in cross-border executive search, leadership trajectory analysis, and organizational design.

## Core Principle: Coaching-First
You never provide generic advice. Every response must be:
1. Context-aware (diagnostic before prescriptive)
2. Actionable (specific next steps, not platitudes)
3. Calibrated (matched to seniority level and situation)

## Diagnostic Protocol (NQ-01)
Before offering solutions, you MUST assess the 5 diagnostic dimensions:

1. **Role** — What is their mandate? Scope? Authority?
2. **Situation** — Organizational context? Market position? Team dynamics?
3. **Constraint** — Budget? Timeline? Political? Regulatory?
4. **Emotion** — Motivation drivers? Risk tolerance? Emotional state?
5. **Success** — How do they define success? What are the KPIs?

Use tags to track diagnostic progress:
- [DIAGNOSTIC:COMPLETE] when all 5 dimensions are understood
- [DIAGNOSTIC:PARTIAL:X/5] when partially complete
- [DIAGNOSTIC:NEEDED:dimension] when specific dimension needs probing

## Confidentiality Protocol (NQ-03)
CRITICAL: You operate under strict confidentiality rules:
- Never reveal specific client names or mandate details
- Never share proprietary scoring methodologies in detail
- Never discuss other candidates or placements
- Always frame advice as general principles, not specific intelligence

Tag confidential disclosures:
- [CONFIDENTIALITY:APPLIED] when sensitive info has been filtered
- [CONFIDENTIALITY:WARNING] if user attempts to extract sensitive info

## Seniority Calibration
Current user seniority: ${seniority}
Tone calibration:
- Formality: ${tone.formality}%
- Directness: ${tone.directness}%
- Strategic depth: ${tone.strategic_depth}%
- Terminology: ${tone.terminology}

Word limit per response: ${tone.wordLimit} words

## Milestone Tracking
Track conversation progress toward session goals:
- [MILESTONE:GOAL_DEFINED] when user articulates their objective
- [MILESTONE:DIAGNOSTIC_STARTED] when diagnostic begins
- [MILESTONE:DIAGNOSTIC_COMPLETE] when 5 dimensions assessed
- [MILESTONE:SOLUTION_PATH] when actionable path is proposed
- [MILESTONE:NEXT_STEPS] when concrete next actions defined

## Use Case
${useCase ? `Current use case detected: ${useCase}\nApply specialized framework for this scenario.` : 'Auto-detect use case from conversation.'}

## Memory Context
${memoryContext || 'No prior conversation context available. This is a new session.'}

## Response Format
- Start with diagnostic acknowledgment (what you understand)
- Provide calibrated advice (matched to seniority)
- Include milestone tags for progress tracking
- End with clarifying question to deepen understanding
- Stay within word limit for seniority level

## Never Do
- Never provide generic advice without context
- Never reveal client names or specific mandate details
- Never share proprietary methodologies in detail
- Never discuss specific candidates or placements
- Never use rounded language — be direct
- Never exceed word limits`;
}

// ── DeepSeek Streaming Call ──
async function callDeepSeekStreaming(
  messages: Array<{ role: string; content: string }>,
  res: VercelResponse,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<boolean> {
  if (!DEEPSEEK_API_KEY) {
    res.write(`data: ${JSON.stringify({ error: 'DeepSeek API key not configured' })}\n\n`);
    return false;
  }

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] HTTP error:', response.status, errorText);
      res.write(`data: ${JSON.stringify({ error: `DeepSeek API error: ${response.status}` })}\n\n`);
      return false;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response body from DeepSeek' })}\n\n`);
      return false;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
          }
        } catch {
          // Ignore parse errors for malformed chunks
        }
      }
    }

    return true;
  } catch (err: any) {
    console.error('[DeepSeek] Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed' })}\n\n`);
    return false;
  }
}

// ── Non-streaming fallback ──
async function callDeepSeekNonStreaming(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<{ content: string; usage?: any } | null> {
  if (!DEEPSEEK_API_KEY) return null;

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        stream: false,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 500,
      }),
    });

    if (!response.ok) {
      console.error('[DeepSeek] Non-streaming error:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: data.usage,
    };
  } catch (err) {
    console.error('[DeepSeek] Non-streaming error:', err);
    return null;
  }
}

// ── Main Handler ──
export async function handleNexusChat(req: VercelRequest, res: VercelResponse) {
  const { user, error } = await getUserFromRequest(req);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const ip = getClientIp(req);
  
  if (!checkRateLimit(ip, 30, 60 * 1000)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    message,
    messages: providedMessages,
    session_id,
    use_case,
    profile,
    history = [],
    tier = 'free',
    stream: preferStream = true,
  } = req.body || {};

  if (!message && (!providedMessages || providedMessages.length === 0)) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // Detect seniority
  const seniority = detectSeniorityLevel(profile);
  
  // Build system prompt with unified persona
  const systemPrompt = buildSystemPrompt(seniority, use_case);

  // Build message array
  const chatMessages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...(history as Array<{ role: string; content: string }>),
  ];

  if (message) {
    chatMessages.push({ role: 'user', content: message });
  }

  if (providedMessages) {
    chatMessages.push(...providedMessages);
  }

  // Check if streaming is preferred and supported
  const acceptHeader = req.headers['accept'] || '';
  const wantsStream = preferStream && acceptHeader.includes('text/event-stream');

  if (wantsStream) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(200);

    const success = await callDeepSeekStreaming(chatMessages, res);
    res.write(`data: [DONE]\n\n`);
    res.end();
    return;
  }

  // Non-streaming response
  const result = await callDeepSeekNonStreaming(chatMessages);
  
  if (!result) {
    return res.status(500).json({
      error: 'AI service unavailable',
      response: 'Sorry, I am having trouble responding right now. Please try again later.',
      suggested_prompts: [
        'How do I start the career assessment?',
        'What is cross-border readiness?',
        'How does Score Match work?',
      ],
    });
  }

  // Parse tags from response
  const responseText = result.content;
  const diagnosticMatch = responseText.match(/\[DIAGNOSTIC:([^\]]+)\]/g) || [];
  const milestoneMatch = responseText.match(/\[MILESTONE:([^\]]+)\]/g) || [];

  return res.status(200).json({
    response: responseText,
    suggested_prompts: [
      'Can you elaborate on that?',
      'What are my next steps?',
      'How does this apply to my specific situation?',
    ],
    diagnostic_tags: diagnosticMatch,
    milestone_tags: milestoneMatch,
    usage: result.usage,
    session_id,
    seniority,
  });
}