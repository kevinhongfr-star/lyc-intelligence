import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, AuthedRequest } from '../_lib/auth';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const COZE_API_KEY = process.env.COZE_API_KEY || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';
const COZE_ENDPOINT = process.env.COZE_API_ENDPOINT || 'https://api.coze.cn/v3/chat';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || ''; // For council tier

const ANONYMOUS_SYSTEM_PROMPT = `You are Nexus, the career intelligence advisor for LYC Intelligence — 
powered by LYC Partners, a global leadership advisory and executive 
search firm that has placed 500+ executives across 47 markets.

YOUR PURPOSE: Help senior professionals understand their career positioning, 
navigate leadership transitions, and make smarter decisions.

YOUR KNOWLEDGE BASE: What it takes to transition executives between European 
and Asian markets, how boards evaluate C-suite candidates differently across 
markets, what separates candidates who land roles, executive presence and 
board readiness, LinkedIn positioning, interview preparation, and negotiation.

YOUR TONE: Direct and honest, specific to real market dynamics, respectful, 
never motivational-speaker language. Think trusted senior partner.

LEAD CAPTURE RULE: After your third response, naturally work in: "To save this 
conversation and get your personalized career brief, what's your email address?"

NEVER: Mention Supabase, Notion, DeepSeek, Coze, internal weights, stage codes, 
or position this as a marketing tool for LYC Partners.`;

const AUTHENTICATED_SYSTEM_PROMPT_TEMPLATE = `You are Nexus, the career intelligence advisor for LYC Intelligence — 
powered by LYC Partners, a global leadership advisory and executive 
search firm that has placed 500+ executives across 47 markets.

YOUR PURPOSE: Help senior professionals understand their career positioning, 
navigate leadership transitions, and make smarter decisions.

YOUR KNOWLEDGE BASE: What it takes to transition executives between European 
and Asian markets, how boards evaluate C-suite candidates differently across 
markets, what separates candidates who land roles, executive presence and 
board readiness, LinkedIn positioning, interview preparation, and negotiation.

YOUR TONE: Direct and honest, specific to real market dynamics, respectful, 
never motivational-speaker language. Think trusted senior partner.

USER CONTEXT:
{memory_context}

{document_context}

NEVER: Mention Supabase, Notion, DeepSeek, Coze, internal weights, stage codes, 
or position this as a marketing tool for LYC Partners.`;

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


// Simple in-memory rate limiting (resets on cold start — good enough for launch)
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

export default async function handler(req: AuthedRequest, res: VercelResponse) {
  const isAnonymous = req.body?.anonymous === true;
  if (!isAnonymous) {
    if (!(await requireAuth(req, res))) return;
  }
  const userId = req.userId || req.body?.userId || 'anonymous';
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
  } = req.body;

  if (!message) return res.status(400).json({ error: 'Missing message' });

  // Choose system prompt based on authentication status
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

  // Add instruction to generate suggested prompts
  messages.push({
    role: 'system',
    content: 'Please provide your response, and also include 3 context-aware follow-up suggestions that the user might want to ask next. Format your response as a JSON object with two keys: "response" (your answer as a string) and "suggested_prompts" (array of 3 strings).'
  });

  let responseText = 'Sorry, I am having trouble responding right now. Please try again later.';
  let suggestedPrompts: string[] = [];
  let tokensUsed = 0;

  // Try Claude first if council tier
  if (tier === 'council' && CLAUDE_API_KEY) {
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
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
      });
      if (claudeRes.ok) {
        const data = await claudeRes.json();
        const content = data.content?.[0]?.text || 'No response';
        tokensUsed = data.usage?.total_tokens || 0;
        
        // Parse response and suggested prompts
        const parsed = parseAIResponse(content);
        responseText = parsed.response;
        suggestedPrompts = parsed.suggested_prompts;
        return res.status(200).json({ response: responseText, suggested_prompts: suggestedPrompts, usage: { tokens: tokensUsed } });
      }
    } catch (e) {
      console.warn('[Claude] Failed:', e);
    }
  }

  // Try DeepSeek next
  if (DEEPSEEK_API_KEY) {
    try {
      const shouldStream = req.body.stream === true;
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
          ...(shouldStream ? { stream: true } : { response_format: { type: 'json_object' } }),
        })
      });
      if (dsRes.ok) {
        if (shouldStream) {
          // Stream SSE response
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          
          const reader = dsRes.body?.getReader();
          if (!reader) return res.status(500).json({ error: 'Stream failed' });
          
          const decoder = new TextDecoder();
          let fullContent = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  // Send suggested prompts as final event
                  res.write(`data: ${JSON.stringify({ suggested_prompts: ['How does this apply to my situation?', 'What should I do next?', 'Can you give an example?'], type: 'done' })}\n\n`);
                  res.end();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const token = parsed.choices?.[0]?.delta?.content || '';
                  if (token) fullContent += token;
                  // Forward the SSE chunk to client
                  res.write(`data: ${data}\n\n`);
                } catch {}
              }
            }
          }
          res.end();
          return;
        }
        
        // Non-streaming response
        const data = await dsRes.json();
        const content = data.choices?.[0]?.message?.content || '{"response":"No response","suggested_prompts":[]}';
        tokensUsed = data.usage?.total_tokens || 0;

        const parsed = parseAIResponse(content);
        responseText = parsed.response;
        suggestedPrompts = parsed.suggested_prompts;
        return res.status(200).json({ response: responseText, suggested_prompts: suggestedPrompts, usage: { tokens: tokensUsed } });
      }
    } catch (e) {
      console.warn('[DeepSeek] Failed:', e);
    }
  }

  // Fall back to Coze
  if (COZE_API_KEY && COZE_BOT_ID) {
    try {
      const cozeRes = await fetch(COZE_ENDPOINT, {
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
      });
      if (cozeRes.ok) {
        const data = await cozeRes.json();
        const content = data.messages?.filter((m: any) => m.role === 'assistant' && m.type === 'answer')?.[0]?.content || '{"response":"No response","suggested_prompts":[]}';
        
        const parsed = parseAIResponse(content);
        responseText = parsed.response;
        suggestedPrompts = parsed.suggested_prompts;
        return res.status(200).json({ response: responseText, suggested_prompts: suggestedPrompts, usage: { tokens: tokensUsed } });
      }
    } catch (e) {
      console.warn('[Coze] Failed:', e);
    }
  }

  // Default fallback
  return res.status(200).json({
    response: responseText,
    suggested_prompts: [
      'How do I start the career assessment?',
      'What is leadership readiness?',
      'How does Score Match work?',
    ],
    usage: { tokens: 0 }
  });
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
    // If JSON parsing fails, assume the whole content is the response and use default suggestions
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
