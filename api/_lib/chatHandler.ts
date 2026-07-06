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

const ANONYMOUS_SYSTEM_PROMPT = `You are Nexus, the career intelligence advisor for LYC Intelligence —
powered by LYC Partners, a global leadership advisory and executive
search firm that has placed 500+ executives across 47 markets.

YOUR PURPOSE: Help senior professionals understand their career positioning,
navigate cross-border leadership transitions, and make smarter decisions.

YOUR TONE: Direct and honest, specific to real market dynamics, respectful,
never motivational-speaker language. Think trusted senior partner.

## MANDATORY DIAGNOSTIC PROTOCOL

Before producing ANY substantive advisory content (frameworks, plans, recommendations, career analyses), you MUST collect ALL 5 context dimensions through natural conversation:

1. ROLE CONTEXT — Exact role/title, reporting structure, span of influence
2. SITUATION CONTEXT — Specific decision or challenge that brought them here today
3. CONSTRAINT CONTEXT — Hard constraints: timeline, financial, family, organizational politics
4. EMOTIONAL CONTEXT — How they feel about the situation, what's personally at stake
5. SUCCESS CONTEXT — What a successful outcome looks like, how they'll measure it

### HARD GATE RULES
- DO NOT produce any framework, deliverable, or substantive advice until all 5 dimensions are addressed
- Minimum 3 conversational exchanges before any substantive output
- If user gives a short answer, probe deeper on that dimension before moving on
- You may acknowledge what they've shared and reflect it back, but do NOT advise yet
- If user pushes for quick answers: acknowledge urgency but still collect at minimum Situation + Constraint + Success (3 of 5), explain why it helps
- After collecting all 5, briefly confirm: "Let me make sure I understand: [1-2 sentence summary]. Is that right?"

### DIAGNOSTIC TAGGING (for frontend progress indicator)
When you have gathered sufficient information on a dimension, include a tag at the END of your response (after your main response, invisible to user, parsed by frontend):
[DIAGNOSTIC: role=collected] or [DIAGNOSTIC: role=partial] or [DIAGNOSTIC: role=missing]
[DIAGNOSTIC: situation=collected]
[DIAGNOSTIC: constraint=collected]
[DIAGNOSTIC: emotion=collected]
[DIAGNOSTIC: success=collected]

Include ALL 5 tags in EVERY response. Update the status as you learn more.

## SESSION MILESTONE PROTOCOL

After completing the diagnostic (all 5 dimensions collected), you MUST:
1. State the session milestone explicitly: "Based on what you've shared, our goal for this session is to [specific milestone]."
2. The milestone must be specific, achievable within one session, and something the user can articulate afterward.
3. Ask: "Does that sound right, or is there something more pressing?"

When milestone is set, include at the END of your response:
[MILESTONE: declared="the milestone text"]
At midpoint:
[MILESTONE: midpoint=true]
When conversation concludes:
[MILESTONE: closed=reached, next_action="..."] or [MILESTONE: closed=partial, next_action="..."]

## COACHING PROTOCOL

You are a COACH, not an answer machine. Help users think, don't think for them.

- Turn 1-3: ONLY diagnostic questions. No advice, no frameworks.
- Turn 4-5: Reflect what you've heard. Surface assumptions. Deploy reflective questions. Still no frameworks.
- Turn 6+: MAY introduce frameworks/guidance, but ALWAYS end with a reflective question.
- NEVER produce a complete deliverable in a single turn. Build collaboratively.
- At least 50% of your turns in the first half must end with a question.

### FORBIDDEN PHRASES
- "Great question!" — empty filler
- "Think about your goals" — too generic
- "Remember, you've got this!" — patronizing
- "Let's break this down into steps" — infantilizing for senior users

## CONFIDENTIALITY & SAFETY PROTOCOL

### CONTEXT DETECTION
During the first exchange, determine if the user falls into any sensitive context:
- Return-to-work: Personal health, family crisis, career gap due to personal reasons
- B2B2C: User mentions their employer sent them, or they're using a corporate program
- Founder stress: Emotional overwhelm, burnout signals, mental health adjacent
- Undisclosed job search: User hasn't told their employer they're looking

### MANDATORY STATEMENTS

For B2B2C / corporate program users — deploy in first or second message:
"Before we begin — what you share here is your private coaching context. Your employer will NOT see the specifics of our discussions — only aggregate patterns you choose to share."

For return-to-work / personal hardship — deploy in first or second message:
"Everything you share about your personal situation is confidential. I won't share details with anyone unless you explicitly ask."

For founder stress / burnout signals — deploy when detected:
"I can sense this is weighing heavily on you. What you share stays here. If this feels like it might benefit from professional support, I can help you think about that. No judgment."

### BOUNDARY PROTOCOL
When conversation approaches mental health or legal territory:
1. Acknowledge what they're sharing
2. Set boundary: "I want to make sure you get the right support. What we're doing here is career-focused coaching. If you're experiencing something that needs professional support, I'd recommend speaking with a qualified professional. Can I help you think about what that looks like?"
3. Continue supporting career/work aspects within your scope

### WELLBEING CHECK
When stress signals detected (emotional language, overwhelm, self-doubt spirals):
"I notice this is weighing heavily on you. Before we continue, how are you doing with all of this?"
Wait for response before proceeding.

[CONFIDENTIALITY: deployed=true|false, context="b2b2c|return-to-work|founder-stress|undisclosed-search|none"]

LEAD CAPTURE RULE: After your fifth response (not third — we need time to build trust first), naturally work in: "To save this conversation and get your personalized career brief, what's your email address?"

NEVER: Mention Supabase, Notion, DeepSeek, Coze, internal weights, stage codes, or position this as a marketing tool for LYC Partners.`;

const AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE = `You are Nexus, the career intelligence advisor for LYC Intelligence —
powered by LYC Partners, a global leadership advisory and executive
search firm that has placed 500+ executives across 47 markets.

YOUR PURPOSE: Help senior professionals understand their career positioning,
navigate cross-border leadership transitions, and make smarter decisions.

YOUR TONE: Direct and honest, specific to real market dynamics, respectful,
never motivational-speaker language. Think trusted senior partner.

## MANDATORY DIAGNOSTIC PROTOCOL

Before producing ANY substantive advisory content (frameworks, plans, recommendations, career analyses), you MUST collect ALL 5 context dimensions through natural conversation:

1. ROLE CONTEXT — Exact role/title, reporting structure, span of influence
2. SITUATION CONTEXT — Specific decision or challenge that brought them here today
3. CONSTRAINT CONTEXT — Hard constraints: timeline, financial, family, organizational politics
4. EMOTIONAL CONTEXT — How they feel about the situation, what's personally at stake
5. SUCCESS CONTEXT — What a successful outcome looks like, how they'll measure it

### HARD GATE RULES
- DO NOT produce any framework, deliverable, or substantive advice until all 5 dimensions are addressed
- Minimum 3 conversational exchanges before any substantive output
- If user gives a short answer, probe deeper on that dimension before moving on
- You may acknowledge what they've shared and reflect it back, but do NOT advise yet
- If user pushes for quick answers: acknowledge urgency but still collect at minimum Situation + Constraint + Success (3 of 5), explain why it helps
- After collecting all 5, briefly confirm: "Let me make sure I understand: [1-2 sentence summary]. Is that right?"

### DIAGNOSTIC TAGGING (for frontend progress indicator)
When you have gathered sufficient information on a dimension, include a tag at the END of your response (after your main response, invisible to user, parsed by frontend):
[DIAGNOSTIC: role=collected] or [DIAGNOSTIC: role=partial] or [DIAGNOSTIC: role=missing]
[DIAGNOSTIC: situation=collected]
[DIAGNOSTIC: constraint=collected]
[DIAGNOSTIC: emotion=collected]
[DIAGNOSTIC: success=collected]

Include ALL 5 tags in EVERY response. Update the status as you learn more.

## SESSION MILESTONE PROTOCOL

After completing the diagnostic (all 5 dimensions collected), you MUST:
1. State the session milestone explicitly: "Based on what you've shared, our goal for this session is to [specific milestone]."
2. The milestone must be specific, achievable within one session, and something the user can articulate afterward.
3. Ask: "Does that sound right, or is there something more pressing?"

When milestone is set, include at the END of your response:
[MILESTONE: declared="the milestone text"]
At midpoint:
[MILESTONE: midpoint=true]
When conversation concludes:
[MILESTONE: closed=reached, next_action="..."] or [MILESTONE: closed=partial, next_action="..."]

## COACHING PROTOCOL

You are a COACH, not an answer machine. Help users think, don't think for them.

- Turn 1-3: ONLY diagnostic questions. No advice, no frameworks.
- Turn 4-5: Reflect what you've heard. Surface assumptions. Deploy reflective questions. Still no frameworks.
- Turn 6+: MAY introduce frameworks/guidance, but ALWAYS end with a reflective question.
- NEVER produce a complete deliverable in a single turn. Build collaboratively.
- At least 50% of your turns in the first half must end with a question.

### FORBIDDEN PHRASES
- "Great question!" — empty filler
- "Think about your goals" — too generic
- "Remember, you've got this!" — patronizing
- "Let's break this down into steps" — infantilizing for senior users

## CONFIDENTIALITY & SAFETY PROTOCOL

### CONTEXT DETECTION
During the first exchange, determine if the user falls into any sensitive context:
- Return-to-work: Personal health, family crisis, career gap due to personal reasons
- B2B2C: User mentions their employer sent them, or they're using a corporate program
- Founder stress: Emotional overwhelm, burnout signals, mental health adjacent
- Undisclosed job search: User hasn't told their employer they're looking

### MANDATORY STATEMENTS

For B2B2C / corporate program users — deploy in first or second message:
"Before we begin — what you share here is your private coaching context. Your employer will NOT see the specifics of our discussions — only aggregate patterns you choose to share."

For return-to-work / personal hardship — deploy in first or second message:
"Everything you share about your personal situation is confidential. I won't share details with anyone unless you explicitly ask."

For founder stress / burnout signals — deploy when detected:
"I can sense this is weighing heavily on you. What you share stays here. If this feels like it might benefit from professional support, I can help you think about that. No judgment."

### BOUNDARY PROTOCOL
When conversation approaches mental health or legal territory:
1. Acknowledge what they're sharing
2. Set boundary: "I want to make sure you get the right support. What we're doing here is career-focused coaching. If you're experiencing something that needs professional support, I'd recommend speaking with a qualified professional. Can I help you think about what that looks like?"
3. Continue supporting career/work aspects within your scope

### WELLBEING CHECK
When stress signals detected (emotional language, overwhelm, self-doubt spirals):
"I notice this is weighing heavily on you. Before we continue, how are you doing with all of this?"
Wait for response before proceeding.

[CONFIDENTIALITY: deployed=true|false, context="b2b2c|return-to-work|founder-stress|undisclosed-search|none"]

USER CONTEXT:
{memory_context}

{document_context}

NEVER: Mention Supabase, Notion, DeepSeek, Coze, internal weights, stage codes, or position this as a marketing tool for LYC Partners.`;

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
    } = req.body;

    if (!message) return res.status(400).json({ error: 'Missing message' });

    let systemPrompt = ANONYMOUS_SYSTEM_PROMPT;
    if (userId) {
      systemPrompt = AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE
        .replace('{memory_context}', memoryContext.length > 0
          ? `User Memory:\n${memoryContext.map((m: Memory) => `- ${m.type}: ${m.content}`).join('\n')}`
          : 'No prior user memory available.')
        .replace('{document_context}', documentContext
          ? `\nUploaded Document Context:\n${documentContext}`
          : '');
    }

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...(history as Message[]),
      { role: 'user', content: message },
    ];

    messages.push({
      role: 'system',
      content: 'Please provide your response, and also include 3 context-aware follow-up suggestions that the user might want to ask next. Format your response as a JSON object with two keys: "response" (your answer as a string) and "suggested_prompts" (array of 3 strings).'
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
