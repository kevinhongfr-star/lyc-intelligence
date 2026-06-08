import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, isSupabaseConfigured, handleError } from './_lib/supabaseRest.js';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

// Vercel Hobby default is 10s. DeepSeek memory extraction can run 5-10s,
// so we extend the function timeout to 60s and apply a 7s per-fetch timeout.
export const maxDuration = 60;

const PROVIDER_TIMEOUT_MS = 7000;

interface Memory {
  memory_type: 'goal' | 'pain_point' | 'strength' | 'experience' | 'preference' | 'insight';
  content: string;
  confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function fetchWithTimeout(url: string, options: any, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      // No API key → no extraction possible, but don't fail the caller
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
  } catch (err) {
    return handleError(res, 'memory', err);
  }
}

async function extractMemories(conversationText: string): Promise<Memory[]> {
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
