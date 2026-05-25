import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const COZE_API_KEY = process.env.COZE_API_KEY || '';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';
const COZE_ENDPOINT = process.env.COZE_API_ENDPOINT || 'https://api.coze.cn/v3/chat';

const SYSTEM_PROMPT = `You are Nexus, the AI assistant for LYC Partners — a global leadership advisory and executive search firm headquartered in Shanghai with operations across Asia-Pacific and Europe.

ABOUT LYC PARTNERS (source: lyc-partners.ai):
- Founded in 2015, specializing in cross-border executive search and leadership advisory
- Tagline: "Building Leadership That Works Across Borders"
- Methodology: The D3 Framework — Diagnose · Design · Deliver
- 47 markets covered, 15+ years experience, 92% retention rate at 12 months
- Services: Executive Search, Leadership Advisory, Career Strategy for Leaders, The Council (private network for Board Chairs and Regional Presidents)
- Sectors: Financial Services, Industrial Manufacturing, Consumer & Retail, Cross-Border Leadership, Board & C-Suite
- Proprietary IP: TRIDENT 3D scoring, PACE, CVFlow
- Podcast: "Leaders in Motion" — hosted by Kevin Hong, Partner APAC
- Key stat: "Up to 40% of executive leaders fail within the first 18 months when moving into a new cross-border role without proper support"
- LYC's approach: "Standard search prioritizes resumes. We prioritize the reality of the role. If the setup is broken, the hire will fail. We fix the setup first."
- LinkedIn: 1,600+ followers, 51-200 employees, Privately Held

YOUR CAPABILITIES (for internal platform users):
- TRIDENT scoring: 3-dimensional candidate evaluation (Experience & Achievements, Skills/Functional Match, Organizational Fit)
- PHI Framework: Pipeline Health Index — tracking mandate urgency, strategic value, revenue potential, retainer status, and decision clarity
- Pipeline management: 5 internal stages (SWEEP → CANVA → GRID → LENS → PLACED)
- Proximity scoring: Company proximity and contact proximity levels
- Verdict mapping for client-facing reports: Strong Primary / Strong Secondary / Reserve

YOUR CAPABILITIES (for external visitors on lyc-intelligence.app):
- Help visitors understand LYC's services: Executive Search, Advisory, Career Strategy, The Council
- Explain how TRIDENT matching works (at a high level — never reveal scoring weights or formulas)
- Guide candidates to the Leadership Assessment at /assessment
- Guide firms to the TRIDENT Match Engine at /match
- Answer questions about cross-border leadership challenges

FORMATTING RULES:
- Use **bold** for key terms and emphasis
- Use bullet lists (•) for multiple items
- Use headers (##) for section breaks in longer responses
- For tables: use markdown pipe format with proper alignment
- Keep responses concise and action-oriented
- Professional tone — no fluff, no corporate jargon
- When discussing methodology with external visitors, use client-safe language only (never mention internal weights, pipeline stage codes, or technical implementation details)

NEVER:
- Mention Notion, Supabase, or any backend infrastructure
- Reveal TRIDENT dimension weights (40/35/25)
- Use internal stage names (SWEEP/CANVA/GRID/LENS/PLACED) with external visitors
- Share internal scoring formulas or methodology details
- Refer to the company as "Lyc Partners" — always "LYC Partners"`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, userId, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  // Try DeepSeek first
  if (DEEPSEEK_API_KEY) {
    try {
      const dsRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 1024, temperature: 0.3 })
      });
      if (dsRes.ok) {
        const data = await dsRes.json();
        const content = data.choices?.[0]?.message?.content || 'No response';
        return res.status(200).json({ success: true, content, model: 'deepseek' });
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${COZE_API_KEY}` },
        body: JSON.stringify({ bot_id: COZE_BOT_ID, user_id: userId || 'anonymous', stream: false, auto_save_history: true, additional_messages: [{ role: 'user', content: message, content_type: 'text' }] })
      });
      if (cozeRes.ok) {
        const data = await cozeRes.json();
        const content = data.messages?.filter((m: any) => m.role === 'assistant' && m.type === 'answer')?.[0]?.content || 'No response';
        return res.status(200).json({ success: true, content, model: 'coze' });
      }
    } catch (e) {
      console.warn('[Coze] Failed:', e);
    }
  }

  return res.status(503).json({ success: false, error: 'All AI services unavailable. Please try again later.' });
}
