/**
 * api/_lib/nexusChatHandler.ts
 * Dedicated Nexus chat endpoint with unified persona + DeepSeek SSE streaming
 *
 * S7-T01 (N1): Conversation Engine + Intent Router
 *   - 5-layer system prompt: (1) persona, (2) user context, (3) intent instructions,
 *     (4) tier modifiers, (5) safety guardrails
 *   - Intent classifier (11 intents) via DeepSeek Flash (< 500ms target)
 *   - Token/cost tracking with daily budget cap (¥50/day per user, tier-scaled)
 *   - Conversation persistence in `nexus_conversations` table
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
 *   userId?: string,    // authenticated user id (set by dispatcher)
 *   stream?: boolean,
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { insert, selectOne, update, isSupabaseConfigured } from './supabaseRest.js';
import {
  classifyIntent,
  getIntentTierPolicy,
  INTENT_CONFIG,
  type NexusIntent,
} from './nexusIntentRouter.js';
import {
  checkBudget,
  computeCostCNY,
  recordUsage,
  type BudgetStatus,
} from './nexusBudgetTracker.js';
import {
  retrieveRelevantMemories,
  extractAndStoreMemories,
  formatMemoriesForPrompt,
  touchMemories,
  WORKING_MEMORY_WINDOW,
} from './nexusMemoryHandler.js';
import {
  assembleUserContext,
} from './nexusUserContext.js';
import {
  retrieveRelevantContent,
} from './nexusRagHandler.js';
import { deductCredits } from './creditsHandler.js';

// ── DeepSeek Configuration ──
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
// Pro model for complex analysis (career advisory, market intel, etc.).
// Falls back to the standard model if not set.
const DEEPSEEK_PRO_MODEL = process.env.DEEPSEEK_PRO_MODEL || DEEPSEEK_MODEL;

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

// ── 5-Layer System Prompt Assembly (S7-T01 spec) ──
// Layers: (1) persona, (2) user context, (3) intent instructions,
//         (4) tier modifiers, (5) safety guardrails
function buildSystemPrompt(params: {
  seniority: SeniorityLevel;
  intent: NexusIntent;
  tier: string;
  userContext?: string;   // profile data, active mandates, credit balance
  memoryContext?: string; // past conversation summaries (S7-T02)
  documentContext?: string;
}): string {
  const { seniority, intent, tier, userContext, memoryContext, documentContext } = params;
  const tone = getToneCalibration(seniority);
  const intentCfg = INTENT_CONFIG[intent];
  const tierPolicy = getIntentTierPolicy(intent, tier);

  // ── Layer 1: Persona ──
  const layer1_persona = `You are Nexus, the executive advisory AI for LYC Partners.

## Identity
LYC Partners has placed 500+ executives across 47 markets. You carry that institutional knowledge into every conversation. You are not a generic AI assistant — you are a calibrated executive coach with deep domain expertise in cross-border executive search, leadership trajectory analysis, and organizational design.

## Core Principle: Coaching-First
You never provide generic advice. Every response must be:
1. Context-aware (diagnostic before prescriptive)
2. Actionable (specific next steps, not platitudes)
3. Calibrated (matched to seniority level and situation)

## Diagnostic Protocol (NQ-01)
Before offering solutions, you MUST assess the 5 diagnostic dimensions:
1. **Role** — mandate, scope, authority
2. **Situation** — organizational context, market position, team dynamics
3. **Constraint** — budget, timeline, political, regulatory
4. **Emotion** — motivation drivers, risk tolerance, emotional state
5. **Success** — definition of success, KPIs

Track progress with tags:
- [DIAGNOSTIC:COMPLETE] when all 5 dimensions understood
- [DIAGNOSTIC:PARTIAL:X/5] when partially complete
- [DIAGNOSTIC:NEEDED:dimension] when a specific dimension needs probing

## Milestone Tracking
- [MILESTONE:GOAL_DEFINED] when user articulates objective
- [MILESTONE:DIAGNOSTIC_STARTED] when diagnostic begins
- [MILESTONE:DIAGNOSTIC_COMPLETE] when 5 dimensions assessed
- [MILESTONE:SOLUTION_PATH] when actionable path proposed
- [MILESTONE:NEXT_STEPS] when concrete next actions defined

## Seniority Calibration
Current user seniority: ${seniority}
Tone: formality ${tone.formality}%, directness ${tone.directness}%, strategic depth ${tone.strategic_depth}%
Terminology: ${tone.terminology}
Word limit per response: ${tone.wordLimit} words`;

  // ── Layer 2: User Context ──
  const layer2_userContext = `
## User Context
${userContext || 'No authenticated user context available. Treat as anonymous/prospect.'}

## Memory Context
${memoryContext || 'No prior conversation context available. This is a new session.'}

${documentContext ? `## Uploaded Document Context\n${documentContext}` : ''}`;

  // ── Layer 3: Intent Instructions ──
  const layer3_intent = `
## Detected Intent: ${intentCfg.label}
${intentCfg.description}

### Intent-Specific Instructions
${intentCfg.instructions}

Route the conversation toward this intent's specialized framework. If the user pivots to a different topic, acknowledge and re-route at the next turn.`;

  // ── Layer 4: Tier Modifiers ──
  const layer4_tier = `
## Tier Modifier
Current user tier: ${tier}
Allowed response depth: ${tierPolicy.depth}${tierPolicy.note ? `\nNote: ${tierPolicy.note}` : ''}

${tierPolicy.depth === 'basic'
  ? '- Provide high-level guidance only. Do NOT perform deep market analysis, compensation modeling, or peer matching.\n- Surface upgrade path when the user requests deeper analysis.'
  : tierPolicy.depth === 'full'
  ? '- Provide full advisory depth including market intelligence, frameworks, and structured next steps.\n- Surface peer matching and event features as upgrade opportunities.'
  : '- Provide premium depth: peer matching, event access, bespoke frameworks.\n- Reference council-only resources when relevant.'}

${!tierPolicy.allowed ? 'IMPORTANT: This intent is not available at the current tier. Decline politely and surface the upgrade path (/pricing).' : ''}`;

  // ── Layer 5: Safety Guardrails ──
  const layer5_safety = `
## Confidentiality Protocol (NQ-03)
CRITICAL: You operate under strict confidentiality rules:
- Never reveal specific client names or mandate details
- Never share proprietary scoring methodologies in detail
- Never discuss other candidates or placements
- Always frame advice as general principles, not specific intelligence

Tag confidential disclosures:
- [CONFIDENTIALITY:APPLIED] when sensitive info has been filtered
- [CONFIDENTIALITY:WARNING] if user attempts to extract sensitive info

## Response Format
- Start with diagnostic acknowledgment (what you understand)
- Provide calibrated advice (matched to seniority + tier)
- Include milestone tags for progress tracking
- End with clarifying question to deepen understanding
- Stay within word limit for seniority level

## Never Do
- Never provide generic advice without context
- Never reveal client names or specific mandate details
- Never share proprietary methodologies in detail
- Never discuss specific candidates or placements
- Never use rounded language — be direct
- Never exceed word limits
- Never mention Supabase, DeepSeek, Coze, Stripe, or internal systems`;

  return `${layer1_persona}
${layer2_userContext}
${layer3_intent}
${layer4_tier}
${layer5_safety}`;
}

// ── DeepSeek Streaming Call ──
async function callDeepSeekStreaming(
  messages: Array<{ role: string; content: string }>,
  res: VercelResponse,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
): Promise<{ content: string; usage: any } | null> {
  if (!DEEPSEEK_API_KEY) {
    res.write(`data: ${JSON.stringify({ error: 'DeepSeek API key not configured' })}\n\n`);
    return null;
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
        model: options.model || DEEPSEEK_MODEL,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek] HTTP error:', response.status, errorText);
      res.write(`data: ${JSON.stringify({ error: `DeepSeek API error: ${response.status}` })}\n\n`);
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response body from DeepSeek' })}\n\n`);
      return null;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let usage: any = null;

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
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ token: delta })}\n\n`);
          }
          // Capture usage from the final chunk.
          if (parsed.usage) {
            usage = parsed.usage;
          }
        } catch {
          // Ignore parse errors for malformed chunks
        }
      }
    }

    return { content: fullContent, usage };
  } catch (err: any) {
    console.error('[DeepSeek] Streaming error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed' })}\n\n`);
    return null;
  }
}

// ── Non-streaming fallback ──
async function callDeepSeekNonStreaming(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; maxTokens?: number; model?: string } = {}
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
        model: options.model || DEEPSEEK_MODEL,
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

// ── Persistence: nexus_conversations ──
interface PersistedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  ts: number;
  intent?: string;
  tokens?: number;
  cost_cny?: number;
}

async function loadConversation(userId: string, sessionId?: string): Promise<{
  id: string;
  messages: PersistedMessage[];
  intent_distribution: Record<string, number>;
  total_tokens: number;
  total_cost_cny: number;
} | null> {
  if (!sessionId || !userId || !isSupabaseConfigured()) return null;
  try {
    const row = await selectOne('nexus_conversations', {
      column: 'id',
      value: sessionId,
      select: 'id,user_id,messages,intent_distribution,total_tokens,total_cost_cny',
    });
    if (!row || row.user_id !== userId) return null;
    return {
      id: row.id,
      messages: Array.isArray(row.messages) ? row.messages : [],
      intent_distribution: row.intent_distribution || {},
      total_tokens: row.total_tokens || 0,
      total_cost_cny: Number(row.total_cost_cny || 0),
    };
  } catch (e) {
    console.warn('[nexusChatHandler] loadConversation failed (non-blocking):', e);
    return null;
  }
}

async function createConversation(userId: string, title: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const row = await insert('nexus_conversations', {
      user_id: userId,
      title: title.slice(0, 200) || 'New Conversation',
      messages: [],
      intent_distribution: {},
      diagnostic_progress: 0,
      milestone_status: {},
      total_tokens: 0,
      total_cost_cny: 0,
    });
    return row?.id || null;
  } catch (e) {
    console.warn('[nexusChatHandler] createConversation failed (non-blocking):', e);
    return null;
  }
}

/**
 * Append a message to an existing conversation by reading the current messages
 * array, pushing the new message, and writing back. This is the safe pattern
 * for Supabase REST (no native JSONB append op without RPC).
 */
async function appendMessageToArray(
  conversationId: string,
  userId: string,
  newMessage: PersistedMessage,
  usageDelta: { tokens: number; cost_cny: number; intent?: NexusIntent },
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const existing = await loadConversation(userId, conversationId);
    if (!existing) return;

    const updatedMessages = [...existing.messages, newMessage];
    const intentDistribution = { ...existing.intent_distribution };
    if (usageDelta.intent) {
      intentDistribution[usageDelta.intent] =
        (intentDistribution[usageDelta.intent] || 0) + 1;
    }

    await update(
      'nexus_conversations',
      {
        messages: updatedMessages,
        intent_distribution: intentDistribution,
        total_tokens: existing.total_tokens + usageDelta.tokens,
        total_cost_cny: Math.round((existing.total_cost_cny + usageDelta.cost_cny) * 1_000_000) / 1_000_000,
        updated_at: new Date().toISOString(),
      },
      conversationId,
    );
  } catch (e) {
    console.warn('[nexusChatHandler] appendMessageToArray failed (non-blocking):', e);
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
    profile,
    history = [],
    tier = 'free',
    userId: bodyUserId,
    stream: preferStream = true,
    memoryContext,
    documentContext,
  } = req.body || {};

  if (!message && (!providedMessages || providedMessages.length === 0)) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // Resolve authenticated user id (set by dispatcher via __authenticatedUser
  // or passed in the body for backward compatibility).
  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  const userId = authUser?.id || bodyUserId;

  // ── User Context Assembly (S7-T03) ──
  // Fetch profile, credits, active mandates, and conversation history in
  // parallel. Resolves the effective tier from profile + credits + Stripe
  // status (falls back to the body tier param). All fetches are non-blocking.
  const { context: userCtx, promptString: userContextPrompt } = await assembleUserContext({
    userId,
    email: authUser?.email,
    role: authUser?.role,
    bodyTier: tier,
    profile,
  });
  // The resolved tier overrides the body tier for all downstream gating.
  const effectiveTier = userCtx.tier;

  // ── Budget enforcement (authenticated users only) ──
  let budgetStatus: BudgetStatus | null = null;
  if (userId) {
    budgetStatus = await checkBudget(userId, effectiveTier);
    if (budgetStatus.exceeded) {
      return res.status(429).json({
        error: 'Daily budget exceeded',
        success: false,
        budget: budgetStatus,
        message: `You have reached your daily Nexus usage cap (¥${budgetStatus.budget_cny.toFixed(2)}). Try again tomorrow or upgrade your plan.`,
      });
    }
  }

  // ── Credit gate (S7-T07) ──
  // Server-side safety net: paid tiers (member/basic/pro) require ≥1 credit per
  // message. Council tier is unlimited. Free tier relies on the client-side
  // CreditGate (5-message Executive Introduction, then 1 credit/message).
  // The client (CreditGate.tsx) already deducts on approval; this gate only
  // blocks the AI call when credits are truly exhausted (catches bypassed /
  // stale clients). Returns a 200 with upgrade_required so the frontend can
  // surface the upgrade modal identically to the client-side path.
  const CREDIT_REQUIRED_TIERS = ['member', 'basic', 'pro'];
  if (
    userId &&
    CREDIT_REQUIRED_TIERS.includes(effectiveTier) &&
    userCtx.creditBalance !== null &&
    userCtx.creditBalance < 1
  ) {
    return res.status(200).json({
      response: "You're out of credits. To continue your conversation with Nexus, add credits or upgrade to Council for unlimited advisory.",
      suggested_prompts: [
        'Show me credit packs',
        'Tell me about Council membership',
      ],
      upgrade_required: true,
      credit_balance: userCtx.creditBalance,
      tier: effectiveTier,
      intent: 'system_nav',
      intent_label: 'System',
      budget: budgetStatus,
      user_context: {
        tier: effectiveTier,
        seniority: userCtx.seniority,
        credit_balance: userCtx.creditBalance,
        active_mandates: userCtx.activeMandateCount,
        conversation_count: userCtx.recentConversationCount,
      },
    });
  }

  // ── Intent classification (S7-T01) ──
  const intentResult = await classifyIntent(message || (providedMessages?.slice(-1)[0]?.content || ''));
  const intent = intentResult.intent;
  const tierPolicy = getIntentTierPolicy(intent, effectiveTier);

  // ── Memory retrieval (S7-T02) ──
  // If the caller didn't pass a memoryContext, retrieve relevant memories
  // from nexus_memory using the user's message as the query.
  let effectiveMemoryContext = memoryContext;
  let retrievedMemoryCount = 0;
  if (userId && !effectiveMemoryContext) {
    try {
      const memories = await retrieveRelevantMemories(userId, message || '', 8);
      retrievedMemoryCount = memories.length;
      if (memories.length > 0) {
        effectiveMemoryContext = formatMemoriesForPrompt(memories);
        // Touch retrieved memories to keep them warm (best-effort).
        touchMemories(memories.map((m) => m.id)).catch(() => {});
      }
    } catch (e) {
      console.warn('[nexusChatHandler] memory retrieval failed (non-blocking):', e);
    }
  }

  // ── RAG content retrieval (S7-T04) ──
  // Retrieve top-k relevant chunks from nexus_content_chunks based on the
  // user's message. Injected into the system prompt as documentContext.
  // Skipped for system_nav / out_of_scope intents (no knowledge base needed).
  // Caller-supplied documentContext (e.g. uploaded file) takes precedence.
  let effectiveDocumentContext = documentContext;
  let ragCitations: Array<{ title: string; source: string | null; category: string; score: number }> = [];
  const QUERY_FREE_INTENTS: NexusIntent[] = ['system_nav', 'out_of_scope'];
  if (!effectiveDocumentContext && message && !QUERY_FREE_INTENTS.includes(intent)) {
    try {
      const rag = await retrieveRelevantContent(message, 5, userId);
      if (rag.formattedContext) {
        effectiveDocumentContext = rag.formattedContext;
        ragCitations = rag.citations;
      }
    } catch (e) {
      console.warn('[nexusChatHandler] RAG retrieval failed (non-blocking):', e);
    }
  }

  // Detect seniority (used for tone calibration in Layer 1).
  const seniority = detectSeniorityLevel(profile);

  // Build 5-layer system prompt.
  // Layer 2 (user context) now uses the S7-T03 enriched assembly:
  // profile data, credit balance, active mandates, conversation history.
  const systemPrompt = buildSystemPrompt({
    seniority,
    intent,
    tier: effectiveTier,
    userContext: userContextPrompt,
    memoryContext: effectiveMemoryContext,
    documentContext: effectiveDocumentContext,
  });

  // Build message array.
  // Working memory window: spec mandates last 20 messages (S7-T02).
  const historyArr = (history as Array<{ role: string; content: string }>) || [];
  const truncatedHistory = historyArr.slice(-WORKING_MEMORY_WINDOW);
  const chatMessages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...truncatedHistory,
  ];

  if (message) {
    chatMessages.push({ role: 'user', content: message });
  }

  if (providedMessages) {
    chatMessages.push(...providedMessages.slice(-WORKING_MEMORY_WINDOW));
  }

  // If the intent is not allowed at this tier, short-circuit with an upgrade message.
  if (!tierPolicy.allowed) {
    const upgradeResponse = `This feature requires a Council membership. I'd love to help you with ${INTENT_CONFIG[intent].label.toLowerCase()} — let me direct you to our [pricing page](/pricing) to explore Council tiers.\n\nOnce upgraded, you'll unlock peer connections, exclusive events, and premium advisory.`;
    return res.status(200).json({
      response: upgradeResponse,
      suggested_prompts: [
        'Tell me about Council membership benefits',
        'What other features can I use right now?',
        'Show me open mandates',
      ],
      intent,
      intent_label: INTENT_CONFIG[intent].label,
      intent_confidence: intentResult.confidence,
      tier_policy: tierPolicy,
      retrieved_memories: retrievedMemoryCount,
      citations: ragCitations,
      usage: { tokens: 0 },
      budget: budgetStatus,
      // S7-T03: user context metadata for the frontend.
      user_context: {
        tier: effectiveTier,
        seniority: userCtx.seniority,
        credit_balance: userCtx.creditBalance,
        active_mandates: userCtx.activeMandateCount,
        conversation_count: userCtx.recentConversationCount,
      },
    });
  }

  // Pick model: Pro for complex intents, Flash-tier for simple ones.
  const COMPLEX_INTENTS: NexusIntent[] = ['career_advisory', 'market_intel', 'compensation', 'coaching', 'self_understanding'];
  const model = COMPLEX_INTENTS.includes(intent) ? DEEPSEEK_PRO_MODEL : DEEPSEEK_MODEL;

  // Check if streaming is preferred and supported.
  const acceptHeader = req.headers['accept'] || '';
  const wantsStream = preferStream && acceptHeader.includes('text/event-stream');

  // ── Resolve or create conversation ──
  let conversationId = session_id;
  if (userId && !conversationId) {
    conversationId = await createConversation(userId, (message || '').slice(0, 80));
  }

  // Persist user message (best-effort, non-blocking).
  if (userId && conversationId) {
    const userMsg: PersistedMessage = {
      role: 'user',
      content: message || '',
      ts: Date.now(),
      intent,
    };
    // Don't await — fire and forget to keep latency low.
    appendMessageToArray(conversationId, userId, userMsg, { tokens: 0, cost_cny: 0, intent }).catch(() => {});
  }

  if (wantsStream) {
    // Set SSE headers.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.status(200);

    // Emit intent metadata as the first event so the client can render a badge.
    res.write(`data: ${JSON.stringify({
      meta: {
        intent,
        intent_label: INTENT_CONFIG[intent].label,
        intent_confidence: intentResult.confidence,
        intent_latency_ms: intentResult.latency_ms,
        tier_policy: tierPolicy,
        model,
        budget: budgetStatus,
        session_id: conversationId,
        retrieved_memories: retrievedMemoryCount,
        // S7-T04: retrieved content citations for grounding display.
        citations: ragCitations,
        // S7-T03: user context metadata for the frontend.
        user_context: {
          tier: effectiveTier,
          seniority: userCtx.seniority,
          credit_balance: userCtx.creditBalance,
          active_mandates: userCtx.activeMandateCount,
          conversation_count: userCtx.recentConversationCount,
        },
      },
    })}\n\n`);

    const result = await callDeepSeekStreaming(chatMessages, res, { model });
    res.write(`data: [DONE]\n\n`);
    res.end();

    // Record usage + persist assistant message (best-effort).
    if (userId) {
      const inputTokens = (result?.usage?.prompt_tokens) || estimateTokens(JSON.stringify(chatMessages));
      const outputTokens = (result?.usage?.completion_tokens) || estimateTokens(result?.content || '');
      const totalTokens = inputTokens + outputTokens;
      const costCny = computeCostCNY(inputTokens, outputTokens);

      recordUsage({
        user_id: userId,
        intent,
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        cost_cny: costCny,
      }).catch(() => {});

      if (conversationId && result?.content) {
        const assistantMsg: PersistedMessage = {
          role: 'assistant',
          content: result.content,
          ts: Date.now(),
          intent,
          tokens: totalTokens,
          cost_cny: costCny,
        };
        appendMessageToArray(conversationId, userId, assistantMsg, {
          tokens: totalTokens,
          cost_cny: costCny,
        }).catch(() => {});
      }

      // S7-T02: trigger memory extraction (best-effort, non-blocking).
      if (result?.content && message) {
        extractAndStoreMemories({
          userId,
          conversationId: conversationId || undefined,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: result.content },
          ],
        }).catch(() => {});
      }
    }
    return;
  }

  // ── Non-streaming response ──
  const result = await callDeepSeekNonStreaming(chatMessages, { model });

  if (!result) {
    return res.status(500).json({
      error: 'AI service unavailable',
      response: 'Sorry, I am having trouble responding right now. Please try again later.',
      suggested_prompts: [
        'How do I start the career assessment?',
        'What is cross-border readiness?',
        'How does Score Match work?',
      ],
      intent,
    });
  }

  // Parse tags from response.
  const responseText = result.content;
  const diagnosticMatch = responseText.match(/\[DIAGNOSTIC:([^\]]+)\]/g) || [];
  const milestoneMatch = responseText.match(/\[MILESTONE:([^\]]+)\]/g) || [];

  // Record usage + persist assistant message.
  let usageReport: { tokens: number; cost_cny: number } | undefined;
  if (userId) {
    const inputTokens = result.usage?.prompt_tokens || estimateTokens(JSON.stringify(chatMessages));
    const outputTokens = result.usage?.completion_tokens || estimateTokens(responseText);
    const totalTokens = inputTokens + outputTokens;
    const costCny = computeCostCNY(inputTokens, outputTokens);
    usageReport = { tokens: totalTokens, cost_cny: costCny };

    recordUsage({
      user_id: userId,
      intent,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_cny: costCny,
    }).catch(() => {});

    if (conversationId) {
      const assistantMsg: PersistedMessage = {
        role: 'assistant',
        content: responseText,
        ts: Date.now(),
        intent,
        tokens: totalTokens,
        cost_cny: costCny,
      };
      appendMessageToArray(conversationId, userId, assistantMsg, {
        tokens: totalTokens,
        cost_cny: costCny,
      }).catch(() => {});
    }

    // S7-T02: trigger memory extraction (best-effort, non-blocking).
    if (message) {
      extractAndStoreMemories({
        userId,
        conversationId: conversationId || undefined,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: responseText },
        ],
      }).catch(() => {});
    }
  }

  return res.status(200).json({
    response: responseText,
    suggested_prompts: [
      'Can you elaborate on that?',
      'What are my next steps?',
      'How does this apply to my specific situation?',
    ],
    diagnostic_tags: diagnosticMatch,
    milestone_tags: milestoneMatch,
    intent,
    intent_label: INTENT_CONFIG[intent].label,
    intent_confidence: intentResult.confidence,
    intent_latency_ms: intentResult.latency_ms,
    tier_policy: tierPolicy,
    retrieved_memories: retrievedMemoryCount,
    // S7-T04: retrieved content citations (title/source/category/score).
    citations: ragCitations,
    usage: {
      ...(result.usage || {}),
      total_tokens: result.usage?.total_tokens || usageReport?.tokens || 0,
      cost_cny: usageReport?.cost_cny || 0,
    },
    budget: budgetStatus,
    session_id: conversationId,
    seniority,
    model,
    // S7-T03: enriched user context for the frontend (tier, credits, mandates).
    user_context: {
      tier: effectiveTier,
      seniority: userCtx.seniority,
      credit_balance: userCtx.creditBalance,
      active_mandates: userCtx.activeMandateCount,
      conversation_count: userCtx.recentConversationCount,
    },
  });
}

// Rough token estimate (~4 chars/token for English). Used when the API doesn't
// return usage (e.g. some streaming chunks).
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
