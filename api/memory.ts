import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

interface Memory {
  memory_type: 'goal' | 'pain_point' | 'strength' | 'experience' | 'preference' | 'insight' | 'assessment_note' | 'document_note';
  content: string;
  confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  if (!supabase) return res.status(200).json({ memories: [] });

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[Memory GET] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch memories' });
  }
  return res.status(200).json({ memories: data || [] });
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const memoryId = req.query.memoryId as string;
  if (!memoryId) return res.status(400).json({ error: 'Memory ID required' });
  if (!supabase) return res.status(200).json({ success: true });

  const { error } = await supabase
    .from('memories')
    .update({ is_active: false })
    .eq('id', memoryId);

  if (error) {
    console.error('[Memory DELETE] Error:', error);
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
  return res.status(200).json({ success: true });
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { userId, messages, sessionId, explicitGoal } = req.body;

  if (!userId) return res.status(400).json({ error: 'User ID required' });

  if (explicitGoal) {
    await storeExplicitMemory(userId, explicitGoal, sessionId);
    return res.status(200).json({ success: true, message: 'Goal stored' });
  }

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'Messages required for extraction' });
  }

  if (DEEPSEEK_API_KEY && supabase) {
    try {
      const conversationText = messages.map((m: ChatMessage) => 
        `${m.role}: ${m.content}`
      ).join('\n\n');

      const memories = await extractMemories(conversationText);
      for (const memory of memories) {
        await storeExtractedMemory(userId, memory, sessionId);
      }
      return res.status(200).json({ success: true, memories_extracted: memories.length });
    } catch (e) {
      console.error('[Memory API] Extraction failed:', e);
      return res.status(500).json({ error: 'Extraction failed' });
    }
  }

  return res.status(200).json({ success: true, memories_extracted: 0 });
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
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: extractionPrompt }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) throw new Error('DeepSeek API failed');

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    const memories = JSON.parse(content);
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

async function storeExplicitMemory(userId: string, content: string, sessionId?: string) {
  if (!supabase) return;
  await supabase.from('memories').insert({
    user_id: userId,
    memory_type: 'goal',
    content,
    source: 'explicit_user_input',
    session_id: sessionId || null,
    confidence: 1.0,
    is_active: true
  });
}

async function storeExtractedMemory(userId: string, memory: Memory, sessionId?: string) {
  if (!supabase) return;
  await supabase.from('memories').insert({
    user_id: userId,
    memory_type: memory.memory_type,
    content: memory.content,
    source: 'conversation_extraction',
    session_id: sessionId || null,
    confidence: memory.confidence,
    is_active: true
  });
}
