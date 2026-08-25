import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '@/stores/toastStore';
import {
  ArrowRight, Shield, Loader2, RefreshCw, Paperclip,
  Crown, MessageSquare, Plus, CreditCard, Menu, X, Sparkles, Zap, Award
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';
import { supabase } from '@/lib/supabase';
import {
  getUserAssessmentContext,
  buildAssessmentContextForNexus,
} from '@/nexus/assessmentContext';
import { CreditGate } from './CreditGate';
import { CareerInsight } from './CareerInsight';
import { CouncilUpsell } from './CouncilUpsell';
import { DiagnosticProgressBar, parseDiagnosticProgress, DEFAULT_DIAGNOSTIC_DIMENSIONS } from './DiagnosticProgressBar';
import { MilestoneBanner, parseMilestones, DEFAULT_MILESTONES } from './MilestoneBanner';
import { ProactiveSuggestionsPanel } from './ProactiveSuggestionsPanel';
import { MilesBadge } from './MilesBadge';
import { AssessmentCtaCard } from './AssessmentCtaCard';
import { stripTagsForDisplay } from '@/services/nexusPersona';
import {
  fetchMilesBalance,
  ASSESSMENT_MILES_COSTS,
} from '@/services/monetizationService';
import {
  NEXUS_ASSESSMENT_KB,
  runRecommendationEngine,
  buildNexusSystemPrompt,
  canonicalTierLabel,
  TIER_KEYS_CANONICAL,
  NEXUS_INTRO_QUESTIONS,
  type AssessmentRecommendationResult,
} from '@/nexus/nexusKnowledge';
import {
  earnNexusMiles,
  ExplorationEarningTracker,
  isCompletedReflection,
} from '@/nexus/nexusMilesService';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

const DS = {
  headingFont: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  // LYC Brand: Zero border-radius
  radius: '0px',
  radiusSm: '0px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  /** Extended metadata for product-aware rendering (recommendations, CTAs, earning events) */
  metadata?: {
    type?: 'recommendation' | 'earning' | 'reflection_prompt';
    instrumentCode?: string;
    recommendation?: AssessmentRecommendationResult;
    earningAction?: string;
    earningAmount?: number;
    earningMessage?: string;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface NEXUSChatProps {
  showHeader?: boolean;
  initialPrompts?: string[];
  onMessageSent?: () => void;
  onCreditCheck?: () => Promise<{ balance: number; tier: string } | null>;
}

/**
 * Map legacy credit-tier strings (from creditService) into the canonical
 * five-tier model: Explorer / Starter / Pro / Executive / Council.
 *
 * Executive Introduction = Explorer, the entry-level tier that does not earn miles.
 */
function mapToCanonicalTier(tierStr: string | null | undefined): TIER_KEYS_CANONICAL {
  if (!tierStr) return TIER_KEYS_CANONICAL.EXPLORER;
  const t = tierStr.toLowerCase();
  if (t.includes('council')) return TIER_KEYS_CANONICAL.COUNCIL;
  if (t.includes('executive')) return TIER_KEYS_CANONICAL.EXECUTIVE;
  if (t.includes('pro')) return TIER_KEYS_CANONICAL.PRO;
  if (t.includes('starter') || t.includes('basic')) return TIER_KEYS_CANONICAL.STARTER;
  return TIER_KEYS_CANONICAL.EXPLORER;
}

export function NEXUSChat({ showHeader = true, initialPrompts, onMessageSent }: NEXUSChatProps) {
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm NEXUS. I ask the questions most executives skip. Tell me a little about where you are, and we'll work through it together.",
    },
  ]);
  /**
   * #1324: Assessment context string for the user (built from their actual
   * assessment_results). Injected into the NEXUS system prompt and forwarded
   * to the chat API so NEXUS can reference the user's real scores.
   */
  const [assessmentContextStr, setAssessmentContextStr] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'error'>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    initialPrompts || NEXUS_INTRO_QUESTIONS,
  );
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditTier, setCreditTier] = useState('explorer');
  /** Canonical tier key used by miles economy & tier gating */
  const canonicalTier = useMemo<TIER_KEYS_CANONICAL>(
    () => mapToCanonicalTier(creditTier),
    [creditTier],
  );
  /**
   * #1324: Enriched NEXUS system prompt. When the user's assessment context
   * is available, it is appended to the prompt so NEXUS can reference the
   * user's actual results during the conversation. When the user arrives via
   * an "Ask NEXUS" CTA with a `code` param, the specific instrument's
   * framework context is also injected so NEXUS grounds its answer in the
   * right methodology.
   */
  const codeParam = searchParams.get('code');
  const frameworkContext = useMemo(() => {
    if (!codeParam) return '';
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return '';
    const dimList = info.dimensions.map(d => `${d.name} (${d.lowLabel} → ${d.highLabel})`).join('; ');
    return [
      `=== CURRENT ASSESSMENT CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Ground your answer in this instrument's framework. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const combinedContext = useMemo(
    () => [frameworkContext, assessmentContextStr].filter(Boolean).join('\n\n'),
    [frameworkContext, assessmentContextStr],
  );

  const nexusPrompt = useMemo(
    () => buildNexusSystemPrompt(combinedContext || undefined),
    [combinedContext],
  );
  /** Miles balance, fetched on mount + CTA actions. */
  const [milesBalance, setMilesBalance] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  /** Exploration earning tracker — resets per sessionId */
  const explorationTracker = useMemo<ExplorationEarningTracker | null>(
    () => (sessionId ? new ExplorationEarningTracker(sessionId) : null),
    [sessionId],
  );

  /**
   * Reflection-mode flag: set to true when the assistant just asked a guided
   * reflection prompt (detected via heuristics on the last assistant message).
   * Reset to false once we have a reply (reflection earned or failed).
   */
  const [awaitingReflectionReply, setAwaitingReflectionReply] = useState(false);

  // S7-T01: intent router + token/budget tracking
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [lastIntentLabel, setLastIntentLabel] = useState<string | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<{
    spent_cny: number; budget_cny: number; remaining_cny: number; utilization_pct: number;
  } | null>(null);
  const [lastUsageTokens, setLastUsageTokens] = useState<number | null>(null);

  // S7-T02: retrieved-memory indicator
  const [retrievedMemories, setRetrievedMemories] = useState<number | null>(null);

  // S7-T03: enriched user context (tier, credits, active mandates)
  const [userContextMeta, setUserContextMeta] = useState<{
    tier: string;
    seniority: string;
    credit_balance: number | null;
    active_mandates: number;
    conversation_count: number;
  } | null>(null);

  // S7-T04: retrieved content citations from the RAG content library.
  // Reset to null when a new turn starts so stale citations don't linger.
  const [citations, setCitations] = useState<
    Array<{ title: string; source: string | null; category: string; score: number }> | null
  >(null);
  
  // Diagnostic tracking state
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticDimensions, setDiagnosticDimensions] = useState(DEFAULT_DIAGNOSTIC_DIMENSIONS);
  
  // Milestone tracking state
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [currentGoal, setCurrentGoal] = useState<string | undefined>(undefined);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const INTRO_TIER_LIMIT = 5;

  // ── Chat Persistence Helpers ──
  async function createChatSession(userId: string, title?: string) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
        use_case: null,
        diagnostic_progress: 0,
        diagnostic_dimensions: [],
        milestone_status: {},
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create chat session:', error);
      return null;
    }
    return data;
  }

  async function persistChatMessage(
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ) {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        metadata: metadata || {},
      });
    
    if (error) {
      console.error('Failed to persist chat message:', error);
    }
  }

  async function updateSessionDiagnostic(
    sessionId: string,
    progress: number,
    dimensions: any[],
    milestones: any
  ) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        diagnostic_progress: progress,
        diagnostic_dimensions: dimensions,
        milestone_status: milestones,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Failed to update session diagnostic:', error);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    const loadSession = async () => {
      if (user?.id) {
        await checkAndGrantDailyCredits(user.id);
        const creditInfo = await getCreditBalance(user.id);
        if (creditInfo) {
          setCreditBalance(creditInfo.balance);
          setCreditTier(creditInfo.tier);
        }

        // Fetch miles balance in parallel — the monetization currency
        try {
          const mb = await fetchMilesBalance();
          setMilesBalance(mb.balance);
        } catch (e) {
          console.warn('[NEXUSChat] fetchMilesBalance failed (will retry on CTA):', e);
        }
        
        const savedSession = localStorage.getItem(`nexus_chat_${user.id}`);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setMessages(parsed.messages || messages);
            setSessionId(parsed.sessionId);
            setMessageCount(parsed.messageCount || 0);
          } catch (e) {
            console.error('[NEXUSChat] Failed to load saved session:', e);
          }
        } else {
          const newId = `session_${Date.now()}`;
          setSessionId(newId);
        }
      }
    };
    loadSession();
  }, [user?.id]);

  // #1324: Load the user's assessment context on mount so NEXUS can reference
  // their actual assessment_results. Built into the system prompt (see
  // nexusPrompt memo) and forwarded to the chat API (see sendMessage body).
  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setAssessmentContextStr('');
      return;
    }
    getUserAssessmentContext(user.id)
      .then((results) => {
        if (cancelled) return;
        const ctx = buildAssessmentContextForNexus(results);
        setAssessmentContextStr(ctx.contextString);
      })
      .catch((e) => {
        console.warn('[NEXUSChat] assessment context load failed (non-fatal):', e);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // #1324: Pre-fill the input from the `q` query param (e.g. arriving from an
  // "Ask NEXUS about this" CTA on the results page). Only pre-fills — the user
  // reviews and sends, so credits are never spent without intent.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setInput(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (user?.id && sessionId) {
      localStorage.setItem(`nexus_chat_${user.id}`, JSON.stringify({
        sessionId,
        messages,
        messageCount,
        updatedAt: Date.now()
      }));
    }
  }, [messages, user?.id, sessionId, messageCount]);

  const getContextWindow = useCallback(() => {
    // S7-T02: working memory window = last 20 messages (per spec).
    return messages.slice(-20);
  }, [messages]);

  const sendMessage = async (userMsg: string) => {
    setAiState('thinking');
    setStreamingContent('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg,
          history: getContextWindow(),
          session_id: sessionId,
          use_case: null, // Auto-detect by persona
          profile: {
            // profile is UserProfile (no title/company guaranteed). Pass through
            // any extended fields from DB, fallback to known context keys.
            title: (profile as any)?.title || profile?.icp || null,
            company: (profile as any)?.company || (profile as any)?.company_name || null,
          },
          tier: profile?.tier || creditTier,
          stream: false, // Use non-streaming for reliable tag parsing
          // #1324: forward the user's assessment context so the server-side
          // persona can inject the user's actual results into the system prompt.
          assessment_context: combinedContext || undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      if (!res.ok) {
        let serverMsg = 'API failed';
        try {
          const errBody = await res.json();
          serverMsg = errBody.response || errBody.error || serverMsg;
        } catch {}
        throw new Error(serverMsg);
      }

      const data = await res.json();
      handleResponse(data, userMsg);
    } catch (e: any) {
      clearTimeout(timeout);
      console.error('Chat failed:', e);
      const isAbort = e?.name === 'AbortError';
      setAiState('error');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAbort
          ? 'NEXUS is temporarily unavailable — please retry in a moment. If the issue persists, reload the page.'
          : 'NEXUS is temporarily unavailable — please retry in a moment. If the issue persists, reload the page.'
      }]);
      setStreamingContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (
    data: {
      response: string;
      suggested_prompts?: string[];
      diagnostic_tags?: string[];
      milestone_tags?: string[];
      seniority?: string;
      intent?: string;
      intent_label?: string;
      intent_confidence?: number;
      usage?: { total_tokens?: number; cost_cny?: number };
      budget?: { spent_cny: number; budget_cny: number; remaining_cny: number; utilization_pct: number } | null;
      retrieved_memories?: number;
      user_context?: { tier: string; seniority: string; credit_balance: number | null; active_mandates: number; conversation_count: number };
      citations?: Array<{ title: string; source: string | null; category: string; score: number }>;
    },
    /** The user message that triggered this response. Used to run recommendation engine */
    triggeringUserMsg?: string,
  ) => {
    // Strip diagnostic/milestone tags for display
    const displayContent = stripTagsForDisplay(data.response);

    // Append assistant message first
    const assistantMsg: Message = { role: 'assistant', content: displayContent };

    // Mark reflection prompt flag so NEXT user reply counts toward reflection earning
    if (isReflectionPrompt(displayContent)) {
      assistantMsg.metadata = { type: 'reflection_prompt' };
    }

    const newMessages: Message[] = [assistantMsg];

    // ── Recommendation engine: run over triggering user msg + assistant reply combined
    // (Both together give a much better signal than the user msg alone.)
    if (triggeringUserMsg) {
      const recommendation = runRecommendationEngine(
        `${triggeringUserMsg}\n\n${displayContent}`,
      ) || runRecommendationEngine(triggeringUserMsg);
      if (recommendation) {
        const kb = NEXUS_ASSESSMENT_KB[recommendation.instrumentCode];
        if (kb) {
          // Append the assessment CTA meta-message right after the assistant
          // reply. The renderer detects `type: recommendation` and renders the
          // product CTA card in-stream (distinct from a chat bubble).
          newMessages.push({
            role: 'assistant',
            content: '',
            metadata: {
              type: 'recommendation',
              instrumentCode: recommendation.instrumentCode,
              recommendation,
            },
          });
        }
      }
    }

    setMessages((prev) => [...prev, ...newMessages]);
    setSuggestedPrompts(data.suggested_prompts || suggestedPrompts);
    setAiState('idle');
    setStreamingContent(null);

    // If this assistant message is a reflection prompt, flip the awaiting flag
    if (assistantMsg.metadata?.type === 'reflection_prompt') {
      setAwaitingReflectionReply(true);
    }

    // S7-T01: surface intent + usage metadata
    if (data.intent) setLastIntent(data.intent);
    if (data.intent_label) setLastIntentLabel(data.intent_label);
    if (data.budget) setBudgetStatus(data.budget);
    if (data.usage?.total_tokens !== undefined) setLastUsageTokens(data.usage.total_tokens);

    // S7-T02: surface retrieved-memory count
    if (data.retrieved_memories !== undefined) setRetrievedMemories(data.retrieved_memories);

    // S7-T03: surface enriched user context (tier, credits, active mandates)
    if (data.user_context) setUserContextMeta(data.user_context);

    // S7-T04: surface retrieved content citations from the RAG library.
    setCitations(Array.isArray(data.citations) && data.citations.length > 0 ? data.citations : null);
    
    // Parse diagnostic progress from raw response (before stripping)
    const diagnostic = parseDiagnosticProgress(data.response);
    setDiagnosticProgress(diagnostic.progress);
    setDiagnosticDimensions(diagnostic.dimensions);
    
    // Parse milestones from raw response
    const parsedMilestones = parseMilestones(data.response);
    setMilestones(parsedMilestones);
    
    // Extract current goal from response if present
    const goalMatch = data.response.match(/\[GOAL:([^\]]+)\]/);
    if (goalMatch) {
      setCurrentGoal(goalMatch[1]);
    }
    
    // Persist chat to Supabase if user is authenticated
    if (user?.id && sessionId) {
      persistChatMessage(user.id, sessionId, 'assistant', data.response, {
        diagnostic_tags: data.diagnostic_tags,
        milestone_tags: data.milestone_tags,
        seniority: data.seniority,
      });
      
      // Update session diagnostic progress
      updateSessionDiagnostic(sessionId, diagnostic.progress, diagnostic.dimensions, {
        goal_defined: data.response.includes('[MILESTONE:GOAL_DEFINED]'),
        diagnostic_started: data.response.includes('[MILESTONE:DIAGNOSTIC_STARTED]'),
        diagnostic_complete: data.response.includes('[MILESTONE:DIAGNOSTIC_COMPLETE]'),
        solution_path: data.response.includes('[MILESTONE:SOLUTION_PATH]'),
        next_steps: data.response.includes('[MILESTONE:NEXT_STEPS]'),
      });
    }
    
    if (user?.id) {
      getCreditBalance(user.id).then(info => {
        if (info) setCreditBalance(info.balance);
      });
    }
  };

  const handleCreditApproval = (reason: 'intro_tier' | 'credit_deducted') => {
    setPendingApproval(false);
    if (reason === 'credit_deducted' && user?.id) {
      getCreditBalance(user.id).then(info => {
        if (info) setCreditBalance(info.balance);
      });
    }
    // Fallback: if the input was already cleared but we have lastUserMessage
    // from the attempt, put it back and send. Otherwise just trigger send()
    // for whatever text is currently in input.
    if (!input.trim() && lastUserMessage) {
      setInput(lastUserMessage);
      // Wait a tick so setState applies before send() reads input.
      setTimeout(() => send(), 0);
      return;
    }
    send();
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const newMessageCount = messageCount + 1;

    // ── Miles earning checks (run BEFORE appending the message so state is
    //    consistent): reflection (if awaitingReflectionReply), exploration (turn count).
    //
    // We intentionally do NOT block the chat flow on earning — earnings are
    // fire-and-forget so the user experience stays snappy.
    let promisedEarnings: Promise<any> | null = null;

    // Reflection earning: +3 mi
    if (awaitingReflectionReply && isCompletedReflection(userMsg, awaitingReflectionReply)) {
      promisedEarnings = Promise.all([
        promisedEarnings,
        awardEarnedMiles('reflection_prompt', { sessionId: sessionId || undefined }),
      ]);
      setAwaitingReflectionReply(false);
    }

    // Framework exploration earning: +5 mi (triggers once per session after threshold turns)
    if (explorationTracker && explorationTracker.countTurn(userMsg)) {
      promisedEarnings = Promise.all([
        promisedEarnings,
        awardEarnedMiles('framework_exploration', { sessionId: sessionId || undefined }),
      ]);
    }
    
    if (newMessageCount > INTRO_TIER_LIMIT && canonicalTier === TIER_KEYS_CANONICAL.EXPLORER && creditBalance < 1) {
      setPendingApproval(true);
      return;
    }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setMessageCount(newMessageCount);
    setLastUserMessage(userMsg);
    
    onMessageSent?.();
    
    // Create session if authenticated and no session exists
    let currentSessionId = sessionId;
    if (user?.id && !currentSessionId) {
      const session = await createChatSession(user.id, userMsg.substring(0, 50));
      if (session) {
        currentSessionId = session.id;
        setSessionId(session.id);
      }
    }
    
    // Persist user message
    if (user?.id && currentSessionId) {
      await persistChatMessage(user.id, currentSessionId, 'user', userMsg);
    }
    
    // Run earnings in background
    if (promisedEarnings) {
      Promise.resolve(promisedEarnings).catch((e) =>
        console.warn('[NEXUSChat] earning award failed (non-fatal):', e),
      );
    }
    
    await sendMessage(userMsg);
  };

  const retry = async () => {
    if (lastUserMessage) {
      setAiState('thinking');
      setLoading(true);
      await sendMessage(lastUserMessage);
    }
  };

  const handleDocumentUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('File size exceeds 10MB limit');
        return;
      }

      toast.warning('Document upload unavailable — please retry later');
    };
    input.click();
  }, [sendMessage]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const createNewSession = () => {
    const newId = `session_${Date.now()}`;
    setSessionId(newId);
    setMessages([{
      role: 'assistant',
      content: "I'm NEXUS. I ask the questions most executives skip. Tell me a little about where you are, and we'll work through it together.",
    }]);
    setMessageCount(0);
    setShowSidebar(false);
    setAwaitingReflectionReply(false);
  };

  const shouldShowUpsell = () => {
    // "free" tier internally maps to Explorer (Executive Introduction); keep the
    // existing gating but use "Executive Introduction" copy in UI.
    if (canonicalTier !== TIER_KEYS_CANONICAL.EXPLORER) return null;
    if (messageCount === INTRO_TIER_LIMIT) return 'trial' as const;
    if (messageCount > 0 && messageCount % 5 === 0) return 'insight' as const;
    if (messageCount >= 10) return 'usage' as const;
    return null;
  };

  /**
   * Earn miles helper — calls the service, updates local balance, shows toast,
   * and optionally appends an earning meta-message into the chat stream.
   */
  const awardEarnedMiles = useCallback(
    async (action: Parameters<typeof earnNexusMiles>[0], opts?: Parameters<typeof earnNexusMiles>[1]) => {
      const result = await earnNexusMiles(action, {
        ...opts,
        tierKey: canonicalTier,
      });
      if (result.earned && result.newBalance) {
        setMilesBalance(result.newBalance);
      }
      if (result.earned) {
        toast.success(`+${result.amount} mi earned · ${result.message}`, 3500);
        // Append subtle earning acknowledgement into chat stream
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.metadata?.earningAction === result.action) return prev;
          return [
            ...prev,
            {
              role: 'assistant',
              content: `+${result.amount} mi earned · ${result.message}`,
              metadata: {
                type: 'earning',
                earningAction: result.action,
                earningAmount: result.amount,
                earningMessage: result.message,
              },
            },
          ];
        });
      }
      return result;
    },
    [canonicalTier],
  );

  /**
   * Heuristic: detect when the assistant's last reply was a guided reflection
   * prompt (so the next user reply counts as a completed reflection).
   */
  function isReflectionPrompt(text: string): boolean {
    if (!text) return false;
    const lc = text.toLowerCase();
    const markers = [
      'take 2 minutes',
      'write this down',
      'reflect on this',
      'answer these three questions',
      'think about the last 12 months',
      'before we continue — answer one question for yourself',
      'exercise: ',
      'guided reflection',
      'journal',
    ];
    return markers.some((m) => lc.includes(m));
  }

  const upsellTrigger = shouldShowUpsell();
  // ── v3.5 Design System Tokens (inline to avoid import churn) ──
  const V = {
    // Fonts
    displayFont: "'Crimson Pro', Georgia, serif",
    bodyFont: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    monoFont: "'IBM Plex Mono', 'Courier New', monospace",
    // Ocean (primary brand)
    ocean800: '#0F2C4A',
    ocean700: '#183F5E',
    ocean600: '#1E537A',
    ocean500: '#2A6A95',
    ocean400: '#3E86B5',
    ocean300: '#6BA8CD',
    ocean100: '#CFE1EE',
    ocean50: '#EAF2F8',
    // Teal (secondary accent)
    teal700: '#0B5D6B',
    teal600: '#0E7B8A',
    teal500: '#1293A6',
    teal400: '#2DB0C2',
    teal300: '#5AC6D5',
    teal100: '#BFE9F0',
    teal50: '#E1F5F8',
    // Fuchsia (flagship accent)
    fuchsia700: '#A0078A',
    fuchsia600: '#C108AB',
    fuchsia500: '#D814C0',
    fuchsia400: '#E83CD2',
    // Neutrals
    ink900: '#0A0A0A',
    ink800: '#1a1a1a',
    ink700: '#333333',
    ink500: '#666666',
    ink400: '#999999',
    ink200: '#e0e0e0',
    ink100: '#f0f0f0',
    ink50: '#fafafa',
    cream: '#FAFAFA',
    white: '#ffffff',
    // Layout
    sidebarW: '260px',
    topbarH: 64,
    railW: 240,
  };

  // Helper: format time for message timestamps
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // ── NEXUS Fairy Avatar Component (inline) ──
  const FairyAvatar = () => (
    <div style={{
      width: 28, height: 28, flexShrink: 0, marginTop: 2,
      position: 'relative', overflow: 'visible',
    }}>
      <style>{`
        @keyframes nf-drift { 0%,100%{transform:translate(0,0)} 25%{transform:translate(0.5px,-0.5px)} 50%{transform:translate(0,-1px)} 75%{transform:translate(-0.5px,-0.5px)} }
        @keyframes nf-t1 { 0%{transform:translate(-8px,-5px);opacity:.9} 25%{transform:translate(0,0);opacity:.6} 50%{transform:translate(8px,5px);opacity:.9} 75%{transform:translate(0,0);opacity:.5} 100%{transform:translate(-8px,-5px);opacity:.9} }
        @keyframes nf-t2 { 0%{transform:translate(6px,-6px);opacity:.7} 33%{transform:translate(-4px,-2px);opacity:1} 66%{transform:translate(2px,6px);opacity:.6} 100%{transform:translate(6px,-6px);opacity:.7} }
        @keyframes nf-f1 { 0%{transform:translate(-6px,4px);opacity:1} 50%{transform:translate(6px,-4px);opacity:.5} 100%{transform:translate(-6px,4px);opacity:1} }
        @keyframes nf-f2 { 0%{transform:rotate(0deg) translateX(4px) rotate(0deg);opacity:.8} 100%{transform:rotate(360deg) translateX(4px) rotate(-360deg);opacity:.8} }
        @keyframes nf-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
        @media (min-width: 1024px) {
          #nexus-sidebar-v35 { transform: translateX(0) !important; }
        }
        @media (max-width: 1023px) {
          #nexus-main-v35 { margin-left: 0 !important; }
          #nexus-sidebar-v35 { width: 280px !important; }
        }
        @media (max-width: 1023px) {
          #nexus-composer-wrap { left: 0 !important; padding: 20px 16px 24px !important; }
          #nexus-composer-inner { margin-left: 0 !important; max-width: 100% !important; }
        }

        .nf-wrap { position:absolute; inset:0; animation:nf-drift 4s ease-in-out infinite; }
        .nf-dot { position:absolute; border-radius:50%; top:50%; left:50%; will-change:transform,opacity; }
        .nf-dt1 { width:2px; height:2px; background:#5AC6D5; margin-left:-1px; margin-top:-1px; box-shadow:0 0 5px #2DB0C2, 0 0 10px rgba(45,176,194,.6); animation:nf-t1 3.5s ease-in-out infinite; }
        .nf-dt2 { width:1.5px; height:1.5px; background:#8EDBE5; margin-left:-0.75px; margin-top:-0.75px; box-shadow:0 0 3px #5AC6D5; animation:nf-t2 4.8s ease-in-out infinite; }
        .nf-df1 { width:2.5px; height:2.5px; background:#E83CD2; margin-left:-1.25px; margin-top:-1.25px; box-shadow:0 0 6px #C108AB, 0 0 12px rgba(193,8,171,.5); animation:nf-f1 2.8s ease-in-out infinite; }
        .nf-df2 { width:1.5px; height:1.5px; background:#D814C0; margin-left:-0.75px; margin-top:-0.75px; box-shadow:0 0 3px #A0078A; animation:nf-f2 2s linear infinite; }
        .nf-focal { position:absolute; width:4px; height:4px; top:50%; left:50%; margin-left:-2px; margin-top:-2px; background:#C108AB; border-radius:50%; box-shadow:0 0 8px #C108AB, 0 0 16px rgba(193,8,171,.7); animation:nf-pulse 2.2s ease-in-out infinite; }
      `}</style>
      <div className="nf-wrap">
        <span className="nf-dot nf-dt1" />
        <span className="nf-dot nf-dt2" />
        <span className="nf-dot nf-df1" />
        <span className="nf-dot nf-df2" />
        <span className="nf-focal" />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: V.cream,
      display: 'flex',
      fontFamily: V.bodyFont,
      color: V.ink900,
      lineHeight: 1.6,
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Mobile overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
          display: showSidebar ? 'block' : 'none',
        }}
        onClick={() => setShowSidebar(false)}
      />

      {/* ── Sidebar (v3.5 dark style) ── */}
      <aside id="nexus-sidebar-v35"
        style={{
          width: V.sidebarW,
          background: V.ink900,
          color: V.cream,
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 50,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)', // overidden on desktop by #nexus-sidebar-v35 media query
          transition: 'transform 250ms ease',
        }}

      >
        {/* Brand block */}
        <div style={{
          padding: '28px 24px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => setShowSidebar(false)}
            style={{
              display: 'block', marginBottom: 10, background: 'none', border: 'none',
              color: V.ink400, cursor: 'pointer', padding: 4,
            }}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <div style={{
            fontFamily: V.displayFont,
            fontSize: 22, fontWeight: 600,
            color: V.cream, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            NEXUS<span style={{ color: V.fuchsia600 }}>.</span>
          </div>
          <div style={{
            marginTop: 6, fontFamily: V.monoFont, fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: V.ink500, fontWeight: 400,
          }}>
            Executive intelligence
          </div>
          {/* Tier badge */}
          {user && (
            <div style={{
              marginTop: 16, padding: '7px 11px',
              background: 'rgba(15, 44, 74, 0.4)',
              border: '1px solid rgba(42, 106, 149, 0.25)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 5, height: 5, background: V.teal400, flexShrink: 0, borderRadius: '50%' }} />
              <span style={{
                fontFamily: V.monoFont, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: V.ocean200 || V.ocean300, fontWeight: 500,
              }}>
                {canonicalTierLabel(canonicalTier)}
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '18px 10px' }}>
          {/* New Chat button */}
          <button
            onClick={createNewSession}
            style={{
              width: 'calc(100% - 20px)', margin: '0 10px 18px', padding: '10px 14px',
              background: 'transparent', color: V.cream,
              border: `1px solid rgba(255,255,255,0.12)`,
              fontFamily: V.bodyFont, fontSize: '0.82rem', fontWeight: 500,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            New Chat
          </button>

          {/* Conversations list */}
          <div style={{
            fontFamily: V.monoFont, fontSize: 9.5,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: V.ink500, fontWeight: 500,
            padding: '0 14px 8px',
          }}>
            Conversations
          </div>
          <div style={{ padding: '0 4px' }}>
            {sessions.length > 0 ? sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  setSessionId(session.id);
                  setMessages(session.messages || []);
                  setMessageCount(session.messages?.length || 0);
                  setShowSidebar(false);
                }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 12px', background: 'transparent',
                  border: 'none',
                  borderLeft: session.id === sessionId
                    ? `2px solid ${V.ocean400}` : '2px solid transparent',
                  color: session.id === sessionId ? V.cream : V.ink400,
                  fontSize: '0.78rem', fontWeight: session.id === sessionId ? 500 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'all 150ms ease',
                  background: session.id === sessionId ? 'rgba(15, 44, 74, 0.35)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (session.id !== sessionId) {
                    e.currentTarget.style.color = V.cream;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (session.id !== sessionId) {
                    e.currentTarget.style.color = V.ink400;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.title}
                </div>
                <div style={{
                  fontFamily: V.monoFont, fontSize: 9.5,
                  color: V.ink500, marginTop: 2,
                  letterSpacing: '0.08em',
                }}>
                  {session.messages?.length || 0} messages
                </div>
              </button>
            )) : (
              <div style={{
                padding: '8px 14px', fontSize: '0.75rem',
                color: V.ink500, fontStyle: 'italic',
              }}>
                No saved conversations
              </div>
            )}
          </div>

          {/* Miles panel (for signed-in users) */}
          {user?.id && milesBalance !== null && (
            <div style={{
              margin: '24px 10px 18px', padding: 14,
              background: 'rgba(15, 44, 74, 0.25)',
              border: '1px solid rgba(42, 106, 149, 0.18)',
            }}>
              <div style={{
                fontFamily: V.monoFont, fontSize: 9.5,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: V.ocean300, marginBottom: 6,
              }}>
                Miles Balance
              </div>
              <div style={{
                fontFamily: V.displayFont, fontSize: 26,
                fontWeight: 400, color: V.cream,
                lineHeight: 1, letterSpacing: '-0.02em',
              }}>
                {milesBalance}<span style={{
                  fontFamily: V.bodyFont, fontSize: '0.7rem',
                  color: V.ink400, fontWeight: 400,
                  marginLeft: 4, letterSpacing: 0,
                }}> miles</span>
              </div>
              <div style={{
                marginTop: 10, height: 2,
                background: 'rgba(255,255,255,0.08)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${Math.min(100, (milesBalance / 50) * 100)}%`,
                  background: V.ocean400,
                }} />
              </div>
            </div>
          )}

          {/* Quick links */}
          <div style={{
            fontFamily: V.monoFont, fontSize: 9.5,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: V.ink500, fontWeight: 500,
            padding: '16px 14px 8px',
          }}>
            Explore
          </div>
          {[
            { href: '/assessment', label: 'Assessments' },
            { href: '/match', label: 'Score Match' },
            { href: '/b2b', label: 'For Firms' },
            { href: '/pricing', label: 'Pricing' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px',
                color: V.ink400, fontSize: '0.8rem',
                textDecoration: 'none',
                borderLeft: '2px solid transparent',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = V.cream;
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = V.ink400;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Sidebar footer — user info */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 6 }}>
              <div style={{
                width: 30, height: 30,
                background: V.ocean700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: V.displayFont, fontSize: 12, fontWeight: 600,
                color: V.cream, flexShrink: 0,
              }}>
                {profile?.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem', fontWeight: 500, color: V.cream,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {profile?.name || user.email?.split('@')[0] || 'User'}
                </div>
                <div style={{
                  fontSize: '0.68rem', color: V.ink500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {user.email}
                </div>
              </div>
            </div>
          ) : (
            <a
              href="/login"
              style={{
                display: 'block', textAlign: 'center',
                padding: '8px 16px', fontSize: '0.8rem',
                color: V.cream, textDecoration: 'none',
                border: `1px solid rgba(255,255,255,0.15)`,
                fontWeight: 500,
              }}
            >
              Sign in
            </a>
          )}
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div id="nexus-main-v35" style={{
        flex: 1,
        marginLeft: '260px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: V.cream,
      }}>
        {/* Top bar */}
        {showHeader && (
          <header style={{
            height: V.topbarH,
            background: V.white,
            borderBottom: `1px solid ${V.ink100}`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 48px',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowSidebar(true)}
                style={{
                  display: 'none', background: 'none', border: 'none',
                  cursor: 'pointer', color: V.ink500, padding: 4,
                }}
                className="lg:hidden"
              >
                <Menu style={{ width: 18, height: 18 }} />
              </button>
              <span style={{
                fontFamily: V.monoFont, fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: V.ocean600, fontWeight: 500,
              }}>
                NEXUS Chat
              </span>
              <span style={{ width: 1, height: 16, background: V.ink200 }} />
              <span style={{
                fontFamily: V.displayFont, fontSize: '1.05rem',
                fontWeight: 500, color: V.ink900,
                letterSpacing: '-0.01em',
              }}>
                {sessionId ? 'Active session' : 'New conversation'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Citations badge */}
              {citations && citations.length > 0 && (
                <div
                  title={`Grounded on ${citations.length} source${citations.length === 1 ? '' : 's'}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', fontSize: 11,
                    background: V.ocean50,
                    border: `1px solid ${V.ocean100}`,
                    color: V.ocean700, fontWeight: 500,
                    fontFamily: V.bodyFont,
                  }}
                >
                  <Shield style={{ width: 12, height: 12 }} />
                  {citations.length} source{citations.length === 1 ? '' : 's'}
                </div>
              )}
              {/* Miles badge */}
              {user?.id && (
                <MilesBadge balance={milesBalance ?? 0} size="sm" />
              )}
              {/* Intent badge */}
              {lastIntentLabel && (
                <div
                  title={`Intent: ${lastIntentLabel}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', fontSize: 11,
                    background: '#F3F0FF', border: '1px solid #EDE9FE',
                    color: '#6D28D9', fontWeight: 500,
                  }}
                >
                  <Sparkles style={{ width: 12, height: 12 }} />
                  {lastIntentLabel}
                </div>
              )}
              {/* Budget */}
              {budgetStatus && (
                <div
                  title={`Daily budget: ¥${budgetStatus.spent_cny.toFixed(2)} / ¥${budgetStatus.budget_cny.toFixed(2)}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', fontSize: 11,
                    background: V.ink50, border: `1px solid ${V.ink100}`,
                    color: V.ink700, fontWeight: 500,
                  }}
                >
                  <Zap style={{ width: 12, height: 12 }} />
                  ¥{budgetStatus.spent_cny.toFixed(1)}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Chat + Right Rail container */}
        <div style={{
          flex: 1,
          display: 'flex',
          maxWidth: 1120,
          width: '100%',
          margin: '0 auto',
          padding: '40px 48px 140px',
          gap: 56,
        }}>
          {/* ── Messages Area ── */}
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
            gap: 40,
          }}>
            {/* Welcome / Onboarding (only for first message, no user msgs yet) */}
            {messageCount === 0 && messages.length <= 1 && showHeader && (
              <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                <div style={{
                  fontFamily: V.displayFont,
                  fontSize: 28, fontWeight: 600, color: V.ink900,
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  marginBottom: 8,
                }}>
                  NEXUS<span style={{ color: V.fuchsia600 }}>.</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: V.ink500 }}>
                  Executive intelligence. Always on.
                </div>
              </div>
            )}

            {/* Proactive Suggestions */}
            {user?.id && <ProactiveSuggestionsPanel />}

            {/* Diagnostic progress */}
            {diagnosticProgress > 0 && (
              <DiagnosticProgressBar
                dimensions={diagnosticDimensions}
                progress={diagnosticProgress}
              />
            )}

            {/* Milestones */}
            {(milestones.some(m => m.complete) || currentGoal) && (
              <MilestoneBanner
                milestones={milestones}
                currentGoal={currentGoal}
              />
            )}

            {/* Messages list */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', gap: 40,
            }}>
              {messages.map((m, i) => {
                const type = m.metadata?.type;

                // Recommendation meta-message
                if (type === 'recommendation' && m.metadata?.instrumentCode) {
                  const code = m.metadata.instrumentCode;
                  const kb = NEXUS_ASSESSMENT_KB[code];
                  if (!kb) return null;
                  const rec = m.metadata.recommendation;
                  return (
                    <div key={`rec-${i}`} style={{ alignSelf: 'stretch', width: '100%' }}>
                      <AssessmentCtaCard
                        kb={kb}
                        rationale={rec?.rationaleText}
                        outcome={rec?.outcomeText}
                        currentMilesBalance={milesBalance}
                        onMilesBalanceChange={(newBal) => setMilesBalance(newBal)}
                      />
                    </div>
                  );
                }

                // Earning meta-message
                if (type === 'earning') {
                  const amt = m.metadata?.earningAmount || 0;
                  const desc = m.metadata?.earningMessage || 'Miles earned';
                  return (
                    <div
                      key={`earn-${i}`}
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px',
                        background: `${V.fuchsia600}15`,
                        border: `1px solid ${V.fuchsia600}40`,
                        fontFamily: V.monoFont,
                        fontSize: 11, letterSpacing: '0.06em',
                        color: V.fuchsia600,
                      }}
                    >
                      <Sparkles style={{ width: 11, height: 11 }} />
                      +{amt} mi · {desc}
                    </div>
                  );
                }

                // User message
                if (m.role === 'user') {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ maxWidth: 460 }}>
                        <div style={{
                          padding: '14px 18px',
                          background: V.ocean700,
                          color: V.cream,
                          fontSize: '0.9rem', lineHeight: 1.6,
                          textAlign: 'left',
                        }}>
                          {m.content}
                        </div>
                        <div style={{
                          textAlign: 'right', marginTop: 6,
                          fontFamily: V.monoFont, fontSize: 9.5,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: V.ink400,
                        }}>
                          you
                        </div>
                      </div>
                    </div>
                  );
                }

                // Assistant (NEXUS) message
                return (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <FairyAvatar />
                    <div style={{ flex: 1, minWidth: 0, maxWidth: 640 }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 12,
                        marginBottom: 12,
                      }}>
                        <span style={{
                          fontFamily: V.displayFont,
                          fontSize: '0.95rem', fontWeight: 500,
                          color: V.ink900,
                        }}>NEXUS</span>
                        {m.timestamp && (
                          <span style={{
                            fontFamily: V.monoFont, fontSize: 9.5,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            color: V.ink400,
                          }}>{formatTime(m.timestamp)}</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '0.95rem', lineHeight: 1.75,
                        color: V.ink700,
                      }}>
                        {m.content}
                      </div>
                      <div style={{
                        marginTop: 20, paddingTop: 14,
                        borderTop: `1px solid ${V.ink100}`,
                        display: 'flex', alignItems: 'center', gap: 20,
                      }}>
                        <span style={{
                          fontFamily: V.monoFont, fontSize: 9.5,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: V.ink400, cursor: 'pointer',
                          fontWeight: 500,
                          transition: 'color 150ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = V.ink700; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = V.ink400; }}
                        onClick={() => {
                          navigator.clipboard?.writeText(m.content);
                        }}
                        >
                          Copy
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Streaming indicator */}
              {streamingContent && (
                <div style={{ display: 'flex', gap: 14 }}>
                  <FairyAvatar />
                  <div style={{
                    flex: 1, maxWidth: 640,
                    padding: 0, fontSize: '0.95rem', lineHeight: 1.75,
                    color: V.ink700,
                  }}>
                    {streamingContent}
                    <span style={{
                      display: 'inline-block', width: 2, height: '1em',
                      background: V.ink400, marginLeft: 2,
                      verticalAlign: 'text-bottom',
                      animation: 'nf-pulse 1s ease-in-out infinite',
                    }} />
                  </div>
                </div>
              )}

              {/* Thinking state */}
              {aiState === 'thinking' && !streamingContent && (
                <div style={{ display: 'flex', gap: 14 }}>
                  <FairyAvatar />
                  <div style={{
                    padding: '14px 18px',
                    fontFamily: V.monoFont,
                    fontSize: 11, letterSpacing: '0.15em',
                    color: V.ink400,
                  }}>
                    <span style={{ animation: 'nf-pulse 1.2s ease-in-out infinite' }}>···</span>
                  </div>
                </div>
              )}

              {/* Error state */}
              {aiState === 'error' && (
                <div style={{
                  alignSelf: 'flex-start', width: '100%', maxWidth: 400,
                  background: 'rgba(193, 8, 171, 0.08)',
                  border: `1px solid rgba(193, 8, 171, 0.25)`,
                  padding: 16,
                }}>
                  <p style={{ fontSize: '0.85rem', color: V.ink700, marginBottom: 12 }}>
                    NEXUS is temporarily unavailable — want to try again?
                  </p>
                  <button
                    onClick={retry}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px',
                      background: V.fuchsia600, color: '#fff', border: 'none',
                      fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                      fontFamily: V.bodyFont,
                    }}
                  >
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    Retry
                  </button>
                </div>
              )}

              {/* Upsell & career insight (keep existing) */}
              {upsellTrigger && (
                <CouncilUpsell
                  trigger={upsellTrigger}
                  messageCount={messageCount}
                  onUpgrade={() => setShowUpgradeModal(true)}
                />
              )}
              <CareerInsight
                messageCount={messageCount}
                conversationHistory={messages}
                onUpgrade={() => setShowUpgradeModal(true)}
              />

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* ── Right Context Rail ── */}
          {showHeader && messages.length > 1 && (
            <aside style={{
              width: V.railW, flexShrink: 0, paddingTop: 4,
            }}>
              {/* Session info */}
              <div style={{ marginBottom: 28 }}>
                <div style={{
                  fontFamily: V.monoFont, fontSize: 9.5,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: V.ink400, marginBottom: 12,
                  paddingBottom: 10, borderBottom: `1px solid ${V.ink100}`,
                  fontWeight: 500,
                }}>
                  Session
                </div>
                <div style={{
                  padding: '8px 0',
                  borderBottom: `1px solid ${V.ink50}`,
                }}>
                  <div style={{ fontSize: '0.72rem', color: V.ink500, marginBottom: 3 }}>
                    Messages
                  </div>
                  <div style={{ fontSize: '0.82rem', color: V.ink900, fontWeight: 500 }}>
                    {messageCount} turns
                  </div>
                </div>
                {user?.id && milesBalance !== null && (
                  <div style={{
                    padding: '8px 0',
                    borderBottom: `1px solid ${V.ink50}`,
                  }}>
                    <div style={{ fontSize: '0.72rem', color: V.ink500, marginBottom: 3 }}>
                      Miles balance
                    </div>
                    <div style={{
                      fontFamily: V.monoFont, fontSize: '0.7rem',
                      fontWeight: 500, color: V.ocean600,
                      letterSpacing: '0.05em',
                    }}>
                      {milesBalance} mi
                    </div>
                  </div>
                )}
              </div>

              {/* Try next */}
              {suggestedPrompts.length > 0 && messageCount > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    fontFamily: V.monoFont, fontSize: 9.5,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: V.ink400, marginBottom: 12,
                    paddingBottom: 10, borderBottom: `1px solid ${V.ink100}`,
                    fontWeight: 500,
                  }}>
                    Try next
                  </div>
                  {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                    <div
                      key={i}
                      onClick={() => handlePromptSelect(prompt)}
                      style={{
                        padding: '9px 11px',
                        border: `1px solid ${V.ink100}`,
                        marginBottom: 6,
                        fontSize: '0.76rem', color: V.ink700,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        lineHeight: 1.45,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = V.ocean300;
                        e.currentTarget.style.background = V.ocean50;
                        e.currentTarget.style.color = V.ocean700;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = V.ink100;
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = V.ink700;
                      }}
                    >
                      {prompt}
                    </div>
                  ))}
                </div>
              )}

              {/* Citations (if present) */}
              {citations && citations.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{
                    fontFamily: V.monoFont, fontSize: 9.5,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: V.ink400, marginBottom: 12,
                    paddingBottom: 10, borderBottom: `1px solid ${V.ink100}`,
                    fontWeight: 500,
                  }}>
                    Sources
                  </div>
                  {citations.slice(0, 4).map((c, i) => (
                    <div key={i} style={{
                      padding: '8px 0',
                      borderBottom: `1px solid ${V.ink50}`,
                    }}>
                      <div style={{
                        fontSize: '0.76rem', color: V.ink900,
                        fontWeight: 500, lineHeight: 1.4,
                      }}>
                        {c.title}
                      </div>
                      {c.source && (
                        <div style={{
                          fontSize: '0.68rem', color: V.ink400,
                          marginTop: 2, fontFamily: V.monoFont,
                        }}>
                          {c.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tier / upgrade CTA for Explorer */}
              {canonicalTier === TIER_KEYS_CANONICAL.EXPLORER && messageCount > 2 && (
                <div style={{
                  padding: 14,
                  border: `1px solid ${V.ocean100}`,
                  background: V.ocean50,
                }}>
                  <div style={{
                    fontFamily: V.displayFont, fontSize: '0.9rem',
                    fontWeight: 500, color: V.ocean800,
                    marginBottom: 4,
                  }}>
                    Upgrade to Pro
                  </div>
                  <div style={{
                    fontSize: '0.72rem', color: V.ocean600,
                    lineHeight: 1.5, marginBottom: 10,
                  }}>
                    Unlock all 6 leadership assessments and deeper analysis.
                  </div>
                  <a
                    href="/pricing"
                    style={{
                      fontSize: '0.7rem', color: V.ocean700,
                      fontWeight: 500, textDecoration: 'none',
                      fontFamily: V.monoFont, letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    View plans →
                  </a>
                </div>
              )}
            </aside>
          )}
        </div>

        {/* ── Composer ── */}
        <div id="nexus-composer-wrap" style={{
          position: 'fixed',
          bottom: 0,
          left: '260px',,
          right: 0, // mobile: left: 0 (overridden by #nexus-composer-v35 media query)
          padding: '20px 48px 32px',
          background: `linear-gradient(to top, ${V.cream} 65%, rgba(250,250,250,0))`,
          zIndex: 30,
          pointerEvents: 'none',
        }}>
          <div id="nexus-composer-inner" style={{
            maxWidth: 640,
            marginLeft: 42,
            pointerEvents: 'auto',
            background: V.white,
            border: `1px solid ${V.ink200}`,
            transition: 'border-color 200ms ease, box-shadow 200ms ease',
          }}
          onFocusIn={(e) => {
            e.currentTarget.style.borderColor = V.ocean500;
            e.currentTarget.style.boxShadow = '0 2px 20px rgba(15, 44, 74, 0.08)';
          }}
          onFocusOut={(e) => {
            e.currentTarget.style.borderColor = V.ink200;
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask NEXUS anything — strategy, research, diagnostics..."
              rows={2}
              style={{
                width: '100%',
                padding: '16px 18px 12px',
                border: 'none', outline: 'none', resize: 'none',
                fontFamily: 'inherit',
                fontSize: '0.9rem', lineHeight: 1.6,
                color: V.ink900, background: 'transparent',
                minHeight: 46, maxHeight: 180,
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px 10px',
              borderTop: `1px solid ${V.ink100}`,
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={handleDocumentUpload}
                  disabled={loading}
                  style={{
                    width: 30, height: 30,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: V.ink400, cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'none', border: 'none',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.color = V.ink700;
                      e.currentTarget.style.background = V.ink50;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = V.ink400;
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Attach document"
                >
                  <Paperclip style={{ width: 15, height: 15 }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {user?.id && (
                  <span style={{
                    fontFamily: V.monoFont, fontSize: 9.5,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: V.teal600, fontWeight: 500,
                  }}>
                    ~0.5 mi
                  </span>
                )}
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '8px 20px',
                    background: V.ocean700,
                    color: V.cream,
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: '0.8rem', fontWeight: 500,
                    cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !input.trim()) ? 0.5 : 1,
                    transition: 'background 200ms ease',
                    letterSpacing: '0.01em',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && input.trim()) {
                      e.currentTarget.style.background = V.ocean600;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = V.ocean700;
                  }}
                >
                  {loading ? (
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  )}
                  Send
                </button>
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            marginTop: 12,
            pointerEvents: 'auto',
          }}>
            <Shield style={{ width: 12, height: 12, color: V.ink400 }} />
            <span style={{
              fontFamily: V.monoFont, fontSize: 9.5,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: V.ink400,
            }}>
              Executive intelligence. Always on.
            </span>
          </div>
        </div>
      </div>

      {/* ── Modals (keep existing) ── */}
      {pendingApproval && (
        <CreditGate
          messageCount={messageCount + 1}
          onApproved={handleCreditApproval}
          onUpgrade={() => setShowUpgradeModal(true)}
          onCancel={() => setPendingApproval(false)}
        />
      )}

      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${V.fuchsia600} 0%, #8B067B 100%)` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: V.displayFont }}>Starter &amp; Pro — add miles to your plan</h3>
                  <p className="text-white/80 text-sm">Move past Executive Introduction. Open all 6 leadership assessments with miles.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" style={{ color: V.fuchsia600 }} />
                  <div>
                    <p className="font-semibold text-text-primary">Earn + spend miles</p>
                    <p className="text-sm text-text-muted">Deep dives earn +5 mi. Reflections +3 mi. Assessments refund +10 mi.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" style={{ color: V.fuchsia600 }} />
                  <div>
                    <p className="font-semibold text-text-primary">All 6 leadership assessments</p>
                    <p className="text-sm text-text-muted">Standard and Premium tiers, covering transition, execution, AI readiness, cross-border, and global navigation.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: V.fuchsia600 }} />
                  <div>
                    <p className="font-semibold text-text-primary">Personalised reports</p>
                    <p className="text-sm text-text-muted">Per-dimension bands, blind-spot mapping, C-suite benchmarked.</p>
                  </div>
                </div>
              </div>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold" style={{ color: V.fuchsia600, fontFamily: V.displayFont }}>from $29</p>
                <p className="text-text-muted text-sm">per month · Starter tier</p>
              </div>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.open('/pricing', '_blank');
                }}
                className="w-full py-3 px-4 text-white font-medium flex items-center justify-center gap-2"
                style={{ background: V.fuchsia600 }}
              >
                Add miles to plan
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full mt-3 py-3 px-4 bg-bg-tertiary text-text-primary font-medium"
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
