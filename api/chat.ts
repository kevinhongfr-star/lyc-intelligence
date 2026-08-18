import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * /api/chat — NEXUS chat proxy (serverless function).
 *
 * Self-contained — no imports from src/ to keep bundle size small.
 * Calls DeepSeek API directly with a lightweight system prompt.
 *
 * POST { message, history, userId, tier } → { response }
 * GET → { ok: true, guest_limit: 3, has_key: boolean }
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const GUEST_LIMIT = 3;

// In-memory guest counter (per-function-instance, resets on cold start)
const guestCounts = new Map<string, number>();

function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return (req.headers['x-real-ip'] as string) || 'unknown';
}

function rateLimitCheck(req: VercelRequest, isAuthed: boolean): { ok: boolean; error?: string; remaining?: number } {
  if (isAuthed) return { ok: true };
  
  const ip = getClientIp(req);
  const count = (guestCounts.get(ip) || 0) + 1;
  guestCounts.set(ip, count);
  
  if (count > GUEST_LIMIT) {
    return { ok: false, error: 'Guest limit reached. Sign up for unlimited access.', remaining: 0 };
  }
  return { ok: true, remaining: GUEST_LIMIT - count };
}

const NEXUS_SYSTEM_PROMPT = `You are NEXUS, an Executive Intelligence layer for leaders.
You help executives understand themselves, their leadership, and their career trajectory.
Be incisive, data-informed, and direct. No fluff. No generic advice.
Frame insights around the user's specific context. Ask clarifying questions when needed.
Always refer to yourself as NEXUS, never "the AI" or "the coach."
Keep responses focused — 3-5 paragraphs max. Use concrete examples.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      guest_limit: GUEST_LIMIT,
      has_key: !!DEEPSEEK_API_KEY,
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  
  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ ok: false, error: 'Chat service not configured' });
  }
  
  try {
    const { message, history = [], tier = 'explorer' } = req.body || {};
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ ok: false, error: 'Message is required' });
    }
    
    // Check rate limit for guests
    const authHeader = req.headers['authorization'];
    const isAuthed = !!(authHeader && authHeader.startsWith('Bearer '));
    
    const rl = rateLimitCheck(req, isAuthed);
    if (!rl.ok) {
      return res.status(429).json({ ok: false, error: rl.error, remaining: 0 });
    }
    
    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: NEXUS_SYSTEM_PROMPT },
    ];
    
    // Add history (last 10 turns to keep context manageable)
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    for (const msg of recentHistory) {
      if (msg && msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    
    // Add current user message
    messages.push({ role: 'user', content: message });
    
    // Call DeepSeek
    const apiResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('DeepSeek API error:', apiResponse.status, errorText.slice(0, 200));
      return res.status(502).json({ ok: false, error: 'Chat service unavailable' });
    }
    
    const data = await apiResponse.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    return res.status(200).json({
      ok: true,
      response: responseText,
      remaining: rl.remaining,
      model: data.model || 'deepseek-chat',
    });
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
