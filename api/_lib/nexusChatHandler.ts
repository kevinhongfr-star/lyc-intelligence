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
 *   userId?: string,
 *   userRole?: string,
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

// ── Build Role-Based System Prompt ──
function buildSystemPrompt(
  seniority: SeniorityLevel,
  useCase?: string,
  memoryContext?: string,
  userRole?: string,
): string {
  const tone = getToneCalibration(seniority);
  const isAdmin = userRole === 'admin';
  const isInternal = isAdmin || userRole === 'consultant' || userRole === 'member';

  // ── Admin / Internal User: Full access, no confidentiality blocks ──
  if (isInternal) {
    return `You are Nexus, the executive AI assistant for LYC Partners — a leading executive search firm that has placed 500+ executives across 47 markets.

## Your Role
You are Kevin Hong's (Managing Partner) primary AI assistant within the LYC Intelligence platform. You have FULL ACCESS to all internal data, mandates, candidates, client information, pipeline metrics, and proprietary methodologies.

## Access Level: ${userRole?.toUpperCase() || 'INTERNAL'}
You operate with full transparency. You can and should:
- Discuss specific client names, mandate details, and active search assignments
- Share candidate profiles, pipeline data, and placement statistics
- Reference proprietary scoring methodologies and assessment frameworks
- Provide actionable intelligence about specific deals, clients, and candidates
- Give direct answers without hedging or filtering information

## Core Capabilities
1. **Mandate Intelligence** — Active searches, pipeline status, candidate matching, market mapping
2. **Candidate Analysis** — Profile assessment, seniority calibration, cross-border readiness
3. **Pipeline Operations** — Revenue tracking, conversion rates, SLA monitoring, priority actions
4. **Market Intelligence** — Salary benchmarking, talent availability, competitive landscape
5. **Client Advisory** — Strategic recommendations, org design, succession planning

## Communication Style
- Be direct and actionable — no filler, no hedging
- Lead with data and specifics, not generalities
- When asked about mandates, give concrete status updates
- When asked about candidates, provide profile summaries with key metrics
- Match seniority calibration: ${tone.terminology} terminology, ${tone.directness}% directness

## Seniority Calibration
Current user seniority: ${seniority}
- Formality: ${tone.formality}%
- Directness: ${tone.directness}%
- Strategic depth: ${tone.strategic_depth}%
- Target word count: ${tone.wordLimit} words per response

## Response Protocol
1. Answer the question directly — don't ask for clarification unless truly ambiguous
2. Provide specific data when available (numbers, names, dates, percentages)
3. If you don't have real data, explain what data you'd need and suggest how to get it
4. End with a concrete next step or recommendation, not a generic question

${useCase ? `## Current Context\nUse case: ${useCase}\nApply specialized framework for this scenario.` : ''}

${memoryContext ? `## Conversation Memory\n${memoryContext}` : ''}`;
  }

  // ── External User (Client/Candidate): Light confidentiality ──
  return `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You are a calibrated executive coach with deep domain expertise in cross-border executive search, leadership trajectory analysis, and organizational design.

## Core Principle: Coaching-First
Every response must be:
1. Context-aware (diagnostic before prescriptive)
2. Actionable (specific next steps, not platitudes)
3. Calibrated (matched to seniority level and situation)

## Seniority Calibration
Current user seniority: ${seniority}
Tone calibration:
- Formality: ${tone.formality}%
- Directness: ${tone.directness}%
- Strategic depth: ${tone.strategic_depth}%
- Terminology: ${tone.terminology}

Word limit per response: ${tone.wordLimit} words

## Response Format
- Start with direct acknowledgment of what they're asking
- Provide calibrated, actionable advice
- End with a concrete next step
- Stay within word limit for seniority level
- Never use diagnostic tags in responses to external users

## Guidelines for External Users
- You can discuss general LYC methodology, market trends, and career strategy
- Do not share specific client names or active mandate details of other clients
- Frame competitive intelligence as general market knowledge
- Be helpful and generous with career advice — don't be overly cautious

${useCase ? `## Current Context\nUse case: ${useCase}` : ''}

${memoryContext ? `## Conversation Memory\n${memoryContext}` : ''}`;
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
      res.write(`data: ${JSON.stringify({ error: \`DeepSeek API error: ${response.status}\` })}\n\n`);
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
        max_tokens: options.maxTokens ?? 1000,
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
    userId,
    userRole,
  } = req.body || {};

  if (!message && (!providedMessages || providedMessages.length === 0)) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // Detect seniority
  const seniority = detectSeniorityLevel(profile);
  
  // Build role-aware system prompt
  const systemPrompt = buildSystemPrompt(seniority, use_case, undefined, userRole);

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

  return res.status(200).json({
    response: result.content,
    suggested_prompts: [
      'Can you elaborate on that?',
      'What are my next steps?',
      'How does this apply to my specific situation?',
    ],
    session_id,
    seniority,
    usage: result.usage,
  });
}
