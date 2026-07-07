/**
 * chatHandler.ts — Consolidated handler for chat, memory, and email
 *
 * Routes via api/chat/[[...path]].ts:
 *   (no path)  → POST   /api/chat  chat (Nexus AI assistant)
 *   memory     → POST   /api/chat/memory  extract & store memories
 *   email      → POST   /api/chat/email   send transactional email
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured } from './supabaseRest.js';
import { sendEmail } from './email.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const COZE_API_KEY = process.env.COZE_API_KEY || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';
const COZE_ENDPOINT = process.env.COZE_API_ENDPOINT || 'https://api.coze.cn/v3/chat';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

// Unified Nexus Persona — uses buildNexusSystemPrompt from nexusPersona.ts
// This imports the coaching-first approach with diagnostic protocol (NQ-01) and confidentiality (NQ-03)

// For anonymous/guest users (before profile completion)
const ANONYMOUS_SYSTEM_PROMPT = `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You carry that institutional knowledge into every conversation. You are not a generic AI assistant — you are a calibrated executive coach.

## Core Principle: Coaching-First
Every response must be context-aware, actionable, and calibrated. No generic advice.

## Diagnostic Protocol (NQ-01)
Before offering solutions, assess the 5 diagnostic dimensions:
1. **Role** — What is their mandate? Scope? Authority?
2. **Situation** — Organizational context? Market position?
3. **Constraint** — Budget? Timeline? Political?
4. **Emotion** — Motivation drivers? Risk tolerance?
5. **Success** — How do they define success?

Use tags to track progress:
- [DIAGNOSTIC:PARTIAL:X/5] when partially complete
- [DIAGNOSTIC:COMPLETE] when all 5 dimensions understood
- [MILESTONE:GOAL_DEFINED] when objective articulated
- [MILESTONE:DIAGNOSTIC_STARTED] when diagnostic begins

## Confidentiality Protocol (NQ-03)
Never reveal client names, mandate details, proprietary methodologies, or specific candidates/placements.

## Lead Capture Rule
After 2-3 exchanges, naturally ask: "To save this conversation and unlock your personalized career brief, what's your email address?"

## Response Format
- Start with diagnostic acknowledgment
- Provide calibrated advice (matched to seniority)
- End with clarifying question
- Keep concise (150-250 words for anonymous users)

## Never
- Never provide generic advice
- Never mention Supabase, Notion, DeepSeek, Coze, internal systems
- Never reveal confidential client or candidate info`;

// For authenticated users — template will be replaced with full persona from nexusPersona.ts
const AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE = `{full_persona}

USER MEMORY:
{memory_context}

{document_context}`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Memory {
  id: string;
  type: string;
  content: string;
  timestamp: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PROVIDER_TIMEOUT_MS = 7000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= limit) return true;
  entry.count++;
  return false;
}

async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';

  // ── Email ──────────────────────────────────────────────────────────────────
  if (resource === 'email') {
    return handleEmail(req, res);
  }

  // ── Memory ─────────────────────────────────────────────────────────────────
  if (resource === 'memory') {
    return handleMemory(req, res);
  }

  // ── Chat (Nexus) ───────────────────────────────────────────────────────────
  return handleChat(req, res);
}

// ── Email Handler ─────────────────────────────────────────────────────────────

async function handleEmail(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await sendEmail(type, data);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[email] Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      sent: false,
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined,
    });
  }
}

// ── Memory Handler ─────────────────────────────────────────────────────────────

interface ExtractedMemory {
  memory_type: 'goal' | 'pain_point' | 'strength' | 'experience' | 'preference' | 'insight';
  content: string;
  confidence: number;
}

async function handleMemory(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId, messages, sessionId, explicitGoal } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!isSupabaseConfigured()) {
      return res.status(500).json({ error: 'Server configuration error: Supabase not configured', success: false });
    }

    // Handle explicit goal storage
    if (explicitGoal) {
      await insert('memories', {
        user_id: userId,
        memory_type: 'goal',
        content: explicitGoal,
        source: 'explicit_user_input',
        session_id: sessionId || null,
        confidence: 1.0,
        is_active: true,
      });
      return res.status(200).json({ success: true, message: 'Goal stored' });
    }

    // Handle memory extraction from conversation
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages required for extraction' });
    }

    if (!DEEPSEEK_API_KEY) {
      console.warn('[Memory] DEEPSEEK_API_KEY missing — skipping extraction');
      return res.status(200).json({ success: true, memories_extracted: 0 });
    }

    try {
      const conversationText = messages.map((m: ChatMessage) => `${m.role}: ${m.content}`).join('\n\n');
      const memories = await extractMemories(conversationText);

      let stored = 0;
      for (const memory of memories) {
        try {
          await insert('memories', {
            user_id: userId,
            memory_type: memory.memory_type,
            content: memory.content,
            source: 'conversation_extraction',
            session_id: sessionId || null,
            confidence: memory.confidence,
            is_active: true,
          });
          stored++;
        } catch (e) {
          console.error('[Memory] Store memory failed:', e);
        }
      }

      return res.status(200).json({ success: true, memories_extracted: stored });
    } catch (e) {
      console.error('[Memory API] Extraction failed:', e);
      return res.status(500).json({ error: 'Extraction failed', success: false });
    }
  } catch (err: any) {
    console.error('[Memory] Unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error', success: false });
  }
}

async function extractMemories(conversationText: string): Promise<ExtractedMemory[]> {
  const extractionPrompt = `Analyze this conversation and extract important career intelligence.
Return JSON array of memory objects (max 5, min confidence 0.6):
[{
  "memory_type": "goal|pain_point|strength|experience|preference|insight",
  "content": "Concise statement in third person (e.g., 'User wants to transition to APAC CFO role')",
  "confidence": 0.0-1.0
}]

Only extract clear, durable insights. Return empty array if no strong insights found.

Conversation:
${conversationText}`;

  try {
    const response = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: extractionPrompt }],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    }, PROVIDER_TIMEOUT_MS);

    if (!response.ok) {
      throw new Error(`DeepSeek API failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    let memories: any;
    try {
      memories = JSON.parse(content);
    } catch {
      return [];
    }
    if (!Array.isArray(memories)) return [];

    return memories
      .filter((m: any) =>
        m.memory_type &&
        m.content &&
        m.confidence >= 0.6 &&
        ['goal', 'pain_point', 'strength', 'experience', 'preference', 'insight'].includes(m.memory_type)
      )
      .slice(0, 5);
  } catch (e) {
    console.error('[Memory] Extraction error:', e);
    return [];
  }
}

// ── Chat Handler (Nexus AI) ──────────────────────────────────────────────────

async function handleChat(req: VercelRequest, res: VercelResponse) {
  try {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip, 30, 60 * 1000)) {
      return res.status(429).json({ error: 'Rate limit exceeded', response: 'Too many requests. Please wait a moment and try again.' });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const {
      message,
      history = [],
      userId,
      tier = 'free',
      memoryContext = [],
      documentContext = '',
      messageCount = 0,
      profile, // User profile for seniority detection
    } = req.body;

    if (!message) return res.status(400).json({ error: 'Missing message' });

    // Detect seniority level for tone calibration
    const seniorityLevel = detectSeniorityLevel(profile, history);
    
    let systemPrompt = ANONYMOUS_SYSTEM_PROMPT;
    if (userId) {
      // For authenticated users, use full persona with seniority calibration
      const memoryContextStr = memoryContext.length > 0
        ? `User Memory:\n${memoryContext.map((m: Memory) => `- ${m.type}: ${m.content}`).join('\n')}`
        : 'No prior user memory available.';
      const documentContextStr = documentContext
        ? `\nUploaded Document Context:\n${documentContext}`
        : '';
      
      // Build full persona with seniority calibration
      const fullPersona = buildFullPersona(seniorityLevel);
      
      systemPrompt = AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE
        .replace('{full_persona}', fullPersona)
        .replace('{memory_context}', memoryContextStr)
        .replace('{document_context}', documentContextStr);
    }

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(history as Message[]),
      { role: 'user', content: message },
    ];

    messages.push({
      role: 'system',
      content: 'Please provide your response with diagnostic/milestone tags for tracking, and also include 3 context-aware follow-up suggestions. Format as JSON: {"response": "your answer", "suggested_prompts": ["prompt1", "prompt2", "prompt3"], "diagnostic_status": "none|partial|complete", "milestones": {"goal_defined": false, "diagnostic_started": false, ...}}'
    });

    if (tier === 'council' && CLAUDE_API_KEY) {
      const result = await tryClaude(messages);
      if (result) {
        return res.status(200).json(result);
      }
    }

    if (DEEPSEEK_API_KEY) {
      const result = await tryDeepSeekStreaming(messages, res);
      if (result) return;

      const fallbackResult = await tryDeepSeekNonStreaming(messages);
      if (fallbackResult) {
        return res.status(200).json(fallbackResult);
      }
    }

    if (COZE_API_KEY && COZE_BOT_ID) {
      const result = await tryCoze(messages, userId);
      if (result) {
        return res.status(200).json(result);
      }
    }

    return res.status(200).json({
      response: 'Sorry, I am having trouble responding right now. Please try again later.',
      suggested_prompts: [
        'How do I start the career assessment?',
        'What is cross-border readiness?',
        'How does Score Match work?',
      ],
      diagnostic_status: 'none',
      milestones: {},
      usage: { tokens: 0 }
    });
  } catch (err: any) {
    console.error('[chat] Unhandled error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      response: 'Sorry, something went wrong on our end. Please try again in a moment.',
      details: process.env.NODE_ENV === 'development' ? String(err?.message || err) : undefined
    });
  }
}

// Seniority detection (simplified server-side version)
function detectSeniorityLevel(
  profile?: { title?: string; company?: string },
  conversationHistory?: Array<{ role: string; content: string }>
): 'c_suite' | 'vp' | 'director' | 'manager' | 'individual' {
  if (!profile?.title) return 'director'; // Default
  
  const title = profile.title.toLowerCase();
  
  if (/ceo|cfo|coo|cto|cio|cmo|president|chief|managing director|md/i.test(title)) {
    return 'c_suite';
  }
  if (/vp|vice president|vice-president|head of|director general/i.test(title)) {
    return 'vp';
  }
  if (/director|senior director|executive director/i.test(title)) {
    return 'director';
  }
  if (/manager|senior manager|lead|team lead|supervisor/i.test(title)) {
    return 'manager';
  }
  
  return 'individual';
}

// Build full persona with seniority calibration
function buildFullPersona(seniority: string): string {
  const toneSettings = {
    c_suite: { formality: 90, directness: 85, strategic_depth: 95, terminology: 'executive' },
    vp: { formality: 80, directness: 75, strategic_depth: 85, terminology: 'executive' },
    director: { formality: 70, directness: 65, strategic_depth: 70, terminology: 'professional' },
    manager: { formality: 60, directness: 55, strategic_depth: 50, terminology: 'accessible' },
    individual: { formality: 50, directness: 50, strategic_depth: 40, terminology: 'accessible' },
  };
  
  const tone = toneSettings[seniority] || toneSettings.director;
  
  return `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You carry that institutional knowledge.

## Core Principle: Coaching-First
Every response must be context-aware, actionable, and calibrated.

## Diagnostic Protocol (NQ-01)
Assess 5 dimensions before solutions: Role, Situation, Constraint, Emotion, Success.
Use tags: [DIAGNOSTIC:PARTIAL:X/5], [DIAGNOSTIC:COMPLETE], [MILESTONE:GOAL_DEFINED], etc.

## Confidentiality Protocol (NQ-03)
Never reveal client names, mandate details, proprietary methodologies.

## Seniority Calibration
User seniority: ${seniority}
Tone: Formality ${tone.formality}%, Directness ${tone.directness}%, Strategic depth ${tone.strategic_depth}%
Terminology: ${tone.terminology}

${seniority === 'c_suite' ? 'Speak at board level. Focus on strategic implications, market dynamics, shareholder value. Be direct and time-efficient.' :
  seniority === 'vp' ? 'Speak at leadership level. Balance strategy with execution. Use professional terminology.' :
  'Speak at management level. Focus on practical implementation. Use accessible terminology.'}

## Response Format
- Start with diagnostic acknowledgment
- Provide calibrated advice
- End with clarifying question
- Include tracking tags
- Word limit: ${seniority === 'c_suite' ? '100-150' : seniority === 'vp' ? '150-200' : '150-250'} words`;
}

async function tryClaude(messages: Message[]): Promise<{ response: string; suggested_prompts: string[]; usage: { tokens: number } } | null> {
  try {
    const claudeRes = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        system: messages.find(m => m.role === 'system')?.content,
      })
    }, PROVIDER_TIMEOUT_MS);

    if (claudeRes.ok) {
      const data = await claudeRes.json();
      const content = data.content?.[0]?.text || 'No response';
      const tokensUsed = data.usage?.total_tokens || 0;
      const parsed = parseAIResponse(content);
      return {
        response: parsed.response,
        suggested_prompts: parsed.suggested_prompts,
        usage: { tokens: tokensUsed }
      };
    }
  } catch (e) {
    console.warn('[Claude] Failed:', e);
  }
  return null;
}

async function tryDeepSeekStreaming(messages: Message[], res: VercelResponse): Promise<boolean> {
  try {
    const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 2048,
        temperature: 0.3,
        stream: true,
      })
    });

    if (!dsRes.ok || !dsRes.body) return false;

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive',
    });

    const reader = dsRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) {
            fullContent += content;
            res.write(JSON.stringify({ response: fullContent, suggested_prompts: [] }) + '\n');
          }
        } catch (e) {
          console.warn('[DeepSeek Streaming] Parse error:', e);
        }
      }
    }

    const parsed = parseAIResponse(fullContent);
    res.write(JSON.stringify({
      response: parsed.response,
      suggested_prompts: parsed.suggested_prompts,
      usage: { tokens: 0 }
    }) + '\n');
    res.end();
    return true;
  } catch (e) {
    console.warn('[DeepSeek Streaming] Failed:', e);
    return false;
  }
}

async function tryDeepSeekNonStreaming(messages: Message[]): Promise<{ response: string; suggested_prompts: string[]; usage: { tokens: number } } | null> {
  try {
    const dsRes = await fetchWithTimeout('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 2048,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })
    }, PROVIDER_TIMEOUT_MS);

    if (dsRes.ok) {
      const data = await dsRes.json();
      const content = data.choices?.[0]?.message?.content || '{"response":"No response","suggested_prompts":[]}';
      const tokensUsed = data.usage?.total_tokens || 0;
      const parsed = parseAIResponse(content);
      return {
        response: parsed.response,
        suggested_prompts: parsed.suggested_prompts,
        usage: { tokens: tokensUsed }
      };
    }
  } catch (e) {
    console.warn('[DeepSeek Non-Streaming] Failed:', e);
  }
  return null;
}

async function tryCoze(messages: Message[], userId: string | undefined): Promise<{ response: string; suggested_prompts: string[]; usage: { tokens: number } } | null> {
  try {
    const cozeRes = await fetchWithTimeout(COZE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${COZE_API_KEY}`
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        user_id: userId || 'anonymous',
        stream: false,
        auto_save_history: true,
        additional_messages: [{
          role: 'user',
          content: JSON.stringify(messages),
          content_type: 'text'
        }]
      })
    }, PROVIDER_TIMEOUT_MS);

    if (cozeRes.ok) {
      const data = await cozeRes.json();
      const content = data.messages?.filter((m: any) => m.role === 'assistant' && m.type === 'answer')?.[0]?.content || '{"response":"No response","suggested_prompts":[]}';
      const parsed = parseAIResponse(content);
      return {
        response: parsed.response,
        suggested_prompts: parsed.suggested_prompts,
        usage: { tokens: 0 }
      };
    }
  } catch (e) {
    console.warn('[Coze] Failed:', e);
  }
  return null;
}

function parseAIResponse(content: string) {
  try {
    const parsed = JSON.parse(content);
    return {
      response: parsed.response || parsed.answer || content,
      suggested_prompts: parsed.suggested_prompts || parsed.suggestions || [
        'How does this apply to my situation?',
        'What should I do next?',
        'Can you give an example?',
      ]
    };
  } catch (e) {
    return {
      response: content,
      suggested_prompts: [
        'How does this apply to my situation?',
        'What should I do next?',
        'Can you give an example?',
      ]
    };
  }
}
