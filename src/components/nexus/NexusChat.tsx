import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { toast } from '@/stores/toastStore';
import {
  ArrowRight, Shield, Loader2, RefreshCw, Paperclip,
  Crown, MessageSquare, Plus, CreditCard, Menu, X, Sparkles, Zap, Award
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getCreditBalance, checkAndGrantDailyCredits } from '@/services/creditService';
import { supabase } from '@/lib/supabase';
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
import { AssessmentResultInsightCard } from './AssessmentResultInsightCard';
import {
  fetchUserAssessmentSummaries,
  pickPrimaryResult,
  buildNexusResultContext,
  isResultQuery,
  synthesize90DayPlan,
  type UserAssessmentSummary,
} from '@/services/assessmentResultService';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
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
    type?: 'recommendation' | 'earning' | 'reflection_prompt' | 'result_explanation';
    instrumentCode?: string;
    recommendation?: AssessmentRecommendationResult;
    earningAction?: string;
    earningAmount?: number;
    earningMessage?: string;
    /** result_explanation mode — which instrument result summary to render */
    resultSummary?: UserAssessmentSummary;
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface NexusChatProps {
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

export function NexusChat({ showHeader = true, initialPrompts, onMessageSent }: NexusChatProps) {
  const { user, profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: buildNexusSystemPrompt().openingGreeting,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'thinking' | 'error'>('idle');
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>(
    initialPrompts || NEXUS_INTRO_QUESTIONS,
  );
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditTier, setCreditTier] = useState('free');
  /** Canonical tier key used by miles economy & tier gating */
  const canonicalTier = useMemo<TIER_KEYS_CANONICAL>(
    () => mapToCanonicalTier(creditTier),
    [creditTier],
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

  // #1324: Completed assessment summaries for the current user.
  // Fetched on auth mount so NEXUS can explain results, synthesize plans,
  // and inject the context into every AI-call system prompt.
  const [userAssessmentSummaries, setUserAssessmentSummaries] = useState<UserAssessmentSummary[]>([]);
  
  // Diagnostic tracking state
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const [diagnosticDimensions, setDiagnosticDimensions] = useState(DEFAULT_DIAGNOSTIC_DIMENSIONS);
  
  // Milestone tracking state
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [currentGoal, setCurrentGoal] = useState<string | undefined>(undefined);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const FREE_TRIAL_LIMIT = 5;

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

        // Fetch miles balance + assessment summaries in parallel
        try {
          const [mb, summaries] = await Promise.all([
            fetchMilesBalance(),
            fetchUserAssessmentSummaries(user.id),
          ]);
          setMilesBalance(mb.balance);
          setUserAssessmentSummaries(summaries);
        } catch (e) {
          console.warn('[NexusChat] miles/summaries fetch failed:', e);
        }
        
        const savedSession = localStorage.getItem(`nexus_chat_${user.id}`);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            setMessages(parsed.messages || messages);
            setSessionId(parsed.sessionId);
            setMessageCount(parsed.messageCount || 0);
          } catch (e) {
            console.error('[NexusChat] Failed to load saved session:', e);
          }
        } else {
          const newId = `session_${Date.now()}`;
          setSessionId(newId);
        }
      }
    };
    loadSession();
  }, [user?.id]);

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

    // #1324: Inject result context into every request so the server-side prompt
    // can reference real user data when answering "explain my results" questions.
    const resultContext = buildNexusResultContext(userAssessmentSummaries);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // #1324: Heuristic result-query intent detection → BEFORE the AI call,
    // append a result card as an assistant meta-message so the user sees their
    // real data even if the API is slow or unavailable.
    let appendedResultCard: { type: 'result_explanation'; resultSummary: UserAssessmentSummary } | null = null;
    if (isResultQuery(userMsg) && userAssessmentSummaries.length > 0) {
      const primary = pickPrimaryResult(userAssessmentSummaries);
      if (primary) {
        appendedResultCard = {
          type: 'result_explanation',
          resultSummary: primary,
        };
      }
    }

    try {
      const res = await fetch('/api/nexus/chat', {
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
          result_context: resultContext,
          stream: false, // Use non-streaming for reliable tag parsing
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
      handleResponse(data, userMsg, appendedResultCard);
    } catch (e: any) {
      clearTimeout(timeout);
      console.error('Chat failed:', e);
      const isAbort = e?.name === 'AbortError';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isAbort
          ? 'The request took too long. Please try a shorter question or try again.'
          : `Sorry, something went wrong: ${e?.message || 'Unknown error'}`
      }]);
      setAiState('idle');
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
    /** #1324: Optional pre-AI result-explanation card to append (intent-detected) */
    preCard?: { type: 'result_explanation'; resultSummary: UserAssessmentSummary } | null,
  ) => {
    // Strip diagnostic/milestone tags for display
    const displayContent = stripTagsForDisplay(data.response);

    const newMessages: Message[] = [];

    // ── #1324: Pre-card (result explanation) comes FIRST so the AI reply can
    // reference it naturally. If it's a plan-oriented query, open in plan mode.
    if (preCard) {
      const mode: 'summary' | 'plan' =
        triggeringUserMsg && /plan|90[\s-]*day|develop|focus|invest|next.*step/i.test(triggeringUserMsg)
          ? 'plan'
          : 'summary';
      newMessages.push({
        role: 'assistant',
        content: '',
        metadata: {
          type: 'result_explanation',
          resultSummary: preCard.resultSummary,
        },
      });
      // Attach precomputed plan to summary for downstream renderer
      (newMessages[newMessages.length - 1].metadata as any)._plan = synthesize90DayPlan(preCard.resultSummary);
      (newMessages[newMessages.length - 1].metadata as any)._mode = mode;
    }

    // Append assistant message
    const assistantMsg: Message = { role: 'assistant', content: displayContent };

    // Mark reflection prompt flag so NEXT user reply counts toward reflection earning
    if (isReflectionPrompt(displayContent)) {
      assistantMsg.metadata = { ...(assistantMsg.metadata || {}), type: 'reflection_prompt' };
    }

    newMessages.push(assistantMsg);

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

  const handleCreditApproval = (reason: 'free_trial' | 'credit_deducted') => {
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
    
    if (newMessageCount > FREE_TRIAL_LIMIT && canonicalTier === TIER_KEYS_CANONICAL.EXPLORER && creditBalance < 1) {
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
        console.warn('[NexusChat] earning award failed (non-fatal):', e),
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

      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.text) {
          setMessages(prev => [...prev, {
            role: 'user',
            content: `I've uploaded a document: ${file.name}. Please analyze it and help me understand its content.`
          }]);
          setMessageCount(prev => prev + 1);
          await sendMessage(`Please analyze this document: ${file.name}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload document');
      } finally {
        setLoading(false);
      }
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
      content: buildNexusSystemPrompt().openingGreeting,
    }]);
    setMessageCount(0);
    setShowSidebar(false);
    setAwaitingReflectionReply(false);
  };

  const shouldShowUpsell = () => {
    // "free" tier internally maps to Explorer (Executive Introduction); keep the
    // existing gating but use "Executive Introduction" copy in UI.
    if (canonicalTier !== TIER_KEYS_CANONICAL.EXPLORER) return null;
    if (messageCount === FREE_TRIAL_LIMIT) return 'trial' as const;
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

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex' }}>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" style={{ display: showSidebar ? 'block' : 'none' }} 
        onClick={() => setShowSidebar(false)} />

      <aside
        className={showSidebar ? 'nexus-sidebar-open' : 'nexus-sidebar-closed'}
        style={{
          width: '280px',
          background: DS.bgAlt,
          borderRight: `1px solid ${DS.border}`,
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          overflowY: 'auto',
        }}
      >
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-2 mb-2 text-text-muted hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Nexus</h3>
              <p className="text-xs text-text-muted">{sessions.length} conversations</p>
            </div>
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="w-full m-4 px-4 py-3 bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        <div className="px-2 space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              className={`w-full text-left px-3 py-3 hover:bg-bg-tertiary transition-colors ${
                session.id === sessionId ? 'bg-accent/10' : ''
              }`}
            >
              <p className="text-sm font-medium text-text-primary truncate">{session.title}</p>
              <p className="text-xs text-text-muted truncate">
                {session.messages.length} messages
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showHeader && (
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 text-text-muted hover:text-text-primary"
              >
                <Menu className="w-5 h-5" />
              </button>
              <a href="/" style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 700, color: DS.text, textDecoration: 'none' }}>LYC Intelligence</a>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/*
                Brand rule: 5 tiers = Explorer / Starter / Pro / Executive / Council.
                Currency = miles (mi suffix). The entry tier is "Executive Introduction"
                — never use the word "free" in the UI.
              */}
              {user && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5"
                  style={{
                    background:
                      canonicalTier === TIER_KEYS_CANONICAL.EXPLORER ? `${DS.accent}14` : '#FFF7ED',
                    border: `1px solid ${
                      canonicalTier === TIER_KEYS_CANONICAL.EXPLORER ? `${DS.accent}40` : '#FED7AA'
                    }`,
                    borderRadius: DS.radius,
                  }}
                >
                  <Crown
                    className="w-4 h-4"
                    style={{
                      color:
                        canonicalTier === TIER_KEYS_CANONICAL.EXPLORER ? DS.accent : '#C2410C',
                    }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        canonicalTier === TIER_KEYS_CANONICAL.EXPLORER ? DS.accent : '#9A3412',
                    }}
                  >
                    {canonicalTierLabel(canonicalTier)}
                  </span>
                </div>
              )}

              {/* Miles balance badge (always for signed-in users) */}
              {user?.id && (
                <MilesBadge balance={milesBalance ?? 0} size="sm" />
              )}

              {/* S7-T01: intent badge + budget usage */}
              {lastIntentLabel && (
                <div
                  title={`Intent: ${lastIntentLabel} (${lastIntent})`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F3F0FF]"
                  style={{ border: '1px solid #EDE9FE', borderRadius: DS.radius }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span className="text-xs font-medium text-[#6D28D9]">{lastIntentLabel}</span>
                </div>
              )}
              {budgetStatus && (
                <div
                  title={`Daily Nexus budget: ¥${budgetStatus.spent_cny.toFixed(2)} / ¥${budgetStatus.budget_cny.toFixed(2)} (${budgetStatus.utilization_pct.toFixed(0)}%)`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100"
                  style={{ border: '1px solid #E5E7EB', borderRadius: DS.radius }}
                >
                  <Zap className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">
                    ¥{budgetStatus.spent_cny.toFixed(1)}/{budgetStatus.budget_cny.toFixed(0)}
                    {lastUsageTokens !== null && ` · ${lastUsageTokens}t`}
                  </span>
                </div>
              )}
              {/* S7-T03: tier badge + miles balance + active mandates — rename credits → miles */}
              {userContextMeta && (
                <div
                  title={`Tier: ${userContextMeta.tier} | Seniority: ${userContextMeta.seniority}${
                    userContextMeta.credit_balance !== null
                      ? ` | Miles: ${userContextMeta.credit_balance}`
                      : ''
                  }${userContextMeta.active_mandates > 0 ? ` | Active mandates: ${userContextMeta.active_mandates}` : ''} | Conversations: ${userContextMeta.conversation_count}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFF7ED]"
                  style={{ border: '1px solid #FED7AA', borderRadius: DS.radius }}
                >
                  <Crown className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span className="text-xs font-medium text-[#9A3412] capitalize">
                    {mapToCanonicalTier(userContextMeta.tier) === TIER_KEYS_CANONICAL.EXPLORER
                      ? 'Executive Introduction'
                      : userContextMeta.tier}
                  </span>
                  {userContextMeta.credit_balance !== null && (
                    <span className="text-xs text-[#9A3412]">
                      {' '}· {userContextMeta.credit_balance} mi
                    </span>
                  )}
                  {userContextMeta.active_mandates > 0 && (
                    <span className="text-xs text-[#9A3412]">
                      {' '}· {userContextMeta.active_mandates} mandate
                      {userContextMeta.active_mandates === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              )}
              {retrievedMemories !== null && retrievedMemories > 0 && (
                <div
                  title={`Nexus retrieved ${retrievedMemories} relevant memor${retrievedMemories === 1 ? 'y' : 'ies'} from past conversations`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ECFDF5]"
                  style={{ border: '1px solid #A7F3D0', borderRadius: DS.radius }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  <span className="text-xs font-medium text-[#047857]">
                    {retrievedMemories} memor{retrievedMemories === 1 ? 'y' : 'ies'}
                  </span>
                </div>
              )}
              {citations && citations.length > 0 && (
                <div
                  title={`Grounded on ${citations.length} source${citations.length === 1 ? '' : 's'} from the LYC content library:\n${citations.map((c, i) =>`[${i + 1}] ${c.title}${c.source ? ` — ${c.source}` : ''} (${(c.score * 100).toFixed(0)}%)`).join('\n')}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#EFF6FF]"
                  style={{ border: '1px solid #BFDBFE', borderRadius: DS.radius }}
                >
                  <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-xs font-medium text-[#1D4ED8]">
                    {citations.length} source{citations.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
              <a href="/b2b" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Firms</a>
              <a href="/b2c" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>For Leaders</a>
              <a href="/match" style={{ fontSize: '13px', color: DS.muted, textDecoration: 'none' }}>Score Match</a>
            </div>
          </nav>
        )}

        <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
          {showHeader && (
            <div style={{ textAlign: 'center', padding: '32px 0 20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: `${DS.accent}15`,  marginBottom: '12px' }}>
                <span className="nexus-pulse-dot" />
                <span style={{ fontSize: '12px', color: DS.accent, fontWeight: 600 }}>Nexus</span>
              </div>
              <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 4px' }}>Nexus</h1>
              <p style={{ fontSize: '14px', color: DS.muted }}>Know where you stand. Know where to go.</p>
            </div>
          )}

          {/* Proactive Suggestions Panel — S7-T05 (only when authenticated) */}
          {user?.id && (
            <ProactiveSuggestionsPanel />
          )}

          {/* Diagnostic Progress Bar — shows when diagnostic started */}
          {diagnosticProgress > 0 && (
            <DiagnosticProgressBar
              dimensions={diagnosticDimensions}
              progress={diagnosticProgress}
            />
          )}

          {/* Milestone Banner — shows session goal progress */}
          {(milestones.some(m => m.complete) || currentGoal) && (
            <MilestoneBanner
              milestones={milestones}
              currentGoal={currentGoal}
            />
          )}

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 280px)' }}>
            {messages.map((m, i) => {
              // ── Branch by metadata type for a product-aware stream renderer ──
              const type = m.metadata?.type;

              // (a) Recommendation meta-message → render the product CTA card
              //     (visually distinct, not a chat bubble — per spec)
              if (type === 'recommendation' && m.metadata?.instrumentCode) {
                const code = m.metadata.instrumentCode;
                const kb = NEXUS_ASSESSMENT_KB[code];
                if (!kb) return null;
                const rec = m.metadata.recommendation;
                return (
                  <div
                    key={`rec-${i}`}
                    style={{ alignSelf: 'stretch', width: '100%' }}
                  >
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

              // (b) Earning meta-message → subtle inline chip, not a full bubble
              if (type === 'earning') {
                const amt = m.metadata?.earningAmount || 0;
                const desc = m.metadata?.earningMessage || 'Miles earned';
                return (
                  <div
                    key={`earn-${i}`}
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: `${DS.accent}12`,
                      border: `1px solid ${DS.accent}40`,
                      borderRadius: DS.radius,
                      fontFamily: DS.monoFont,
                      fontSize: '11px',
                      letterSpacing: '0.06em',
                      color: DS.accent,
                      maxWidth: '80%',
                    }}
                  >
                    <Sparkles style={{ width: 11, height: 11 }} />
                    +{amt} mi · {desc}
                  </div>
                );
              }

              // (c-prime) #1324: Result explanation card (scores + plan)
              if (type === 'result_explanation' && m.metadata?.resultSummary) {
                const summary = m.metadata.resultSummary;
                const md = m.metadata as any;
                return (
                  <div
                    key={`res-${i}`}
                    style={{ alignSelf: 'stretch', width: '100%' }}
                  >
                    <AssessmentResultInsightCard
                      summary={summary}
                      mode={md._mode || 'summary'}
                      plan={md._plan}
                    />
                  </div>
                );
              }

              // (c) Default: user/assistant chat bubble
              const isUser = m.role === 'user';
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '70%' : '80%',
                  }}
                >
                  <div
                    style={{
                      padding: '14px 18px',
                      background: isUser ? DS.accent : DS.card,
                      border: isUser ? 'none' : `1px solid ${DS.cardBorder}`,
                      color: isUser ? '#FFFFFF' : DS.text,
                      fontSize: '14px',
                      lineHeight: '1.6',
                      wordBreak: 'break-word',
                      borderRadius: DS.radius,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {streamingContent && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '80%',
                  padding: '14px 18px',
                  background: DS.card,
                  border: `1px solid ${DS.cardBorder}`,
                  color: DS.text,
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}
              >
                {streamingContent}
                <span className="animate-pulse">|</span>
              </div>
            )}

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

            {aiState === 'thinking' && !streamingContent && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', background: DS.card, border: `1px solid ${DS.cardBorder}`,  color: DS.muted, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Thinking...
              </div>
            )}

            {aiState === 'error' && (
              <div style={{ alignSelf: 'flex-start', width: '100%', maxWidth: '400px', background: 'rgba(193, 8, 171, 0.1)', border: '1px solid rgba(193, 8, 171, 0.3)',  padding: '16px' }}>
                <p style={{ fontSize: '13px', color: DS.textSecondary, marginBottom: '12px' }}>
                  Oops, something went wrong. Want to try again?
                </p>
                <button
                  onClick={retry}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: DS.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '36px'
                  }}
                >
                  <RefreshCw style={{ width: 14, height: 14 }} />
                  Retry
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="space-y-3 mb-4">
            <p className="text-xs text-text-muted text-center">Suggested questions:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptSelect(prompt)}
                  className="px-3 py-1.5 bg-bg-tertiary hover:bg-bg-secondary text-text-muted hover:text-text-primary text-xs transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about LYC Partners, executive search, career strategy..."
              style={{
                flex: 1,
                padding: '14px 16px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                color: DS.text,
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                minHeight: '44px',
                maxHeight: '200px',
              }}
              rows={1}
            />
            <button
              onClick={handleDocumentUpload}
              disabled={loading}
              style={{
                padding: '14px',
                background: DS.card,
                border: `1px solid ${DS.cardBorder}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <Loader2 style={{ width: 18, height: 18, color: DS.accent, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Paperclip style={{ width: 18, height: 18, color: DS.textSecondary }} />
              )}
            </button>
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                padding: '14px 20px',
                background: DS.accent,
                color: '#FFFFFF',
                border: 'none',
                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1,
                minHeight: '44px',
              }}
            >
              <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
            <Shield style={{ width: 12, height: 12, color: DS.muted }} />
            <span style={{ fontSize: '11px', color: DS.muted }}>Leadership isn't a title — it's a trajectory. Powered by LYC Intelligence.</span>
          </div>
        </div>
      </div>

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
          <div className="bg-white max-w-lg w-full overflow-hidden shadow-2xl" style={{ borderRadius: DS.radius }}>
            <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${DS.accent} 0%, #8B067B 100%)` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: DS.headingFont }}>Starter & Pro — add miles to your plan</h3>
                  <p className="text-white/80 text-sm">Move past Executive Introduction. Open the 11 instruments with miles.</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" style={{ color: DS.accent }} />
                  <div>
                    <p className="font-semibold text-text-primary">Earn + spend miles</p>
                    <p className="text-sm text-text-muted">Deep dives earn +5 mi. Reflections +3 mi. Assessments refund +10 mi.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5" style={{ color: DS.accent }} />
                  <div>
                    <p className="font-semibold text-text-primary">All 11 instruments</p>
                    <p className="text-sm text-text-muted">CPI Flagship, the full SHIFT Suite, and Advisory products.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" style={{ color: DS.accent }} />
                  <div>
                    <p className="font-semibold text-text-primary">Personalised reports</p>
                    <p className="text-sm text-text-muted">Per-dimension bands, blind-spot mapping, C-suite calibrated.</p>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-3xl font-bold" style={{ color: DS.accent, fontFamily: DS.headingFont }}>from $29</p>
                <p className="text-text-muted text-sm">per month · Starter tier</p>
              </div>

              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  window.open('/pricing', '_blank');
                }}
                className="w-full py-3 px-4 bg-accent text-white font-medium hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                style={{ borderRadius: DS.radius }}
              >
                Add miles to plan
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full mt-3 py-3 px-4 bg-bg-tertiary text-text-primary font-medium hover:bg-bg-secondary transition-colors"
                style={{ borderRadius: DS.radius }}
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