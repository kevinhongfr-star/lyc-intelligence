/**
 * api/_lib/nexusJourneyHandler.ts — S7-T06 (N6)
 *
 * Journey Dashboard: assembles a unified timeline of the user's Nexus journey
 * from multiple sources — conversations, memories, pipeline milestones, and
 * proactive suggestions.
 *
 * Spec (TRAEE_NEXT_SPRINTS.md — S7-T06):
 *   - Visual timeline of user's journey with Nexus
 *   - Conversation history, key insights extracted
 *   - Assessment results + development plan progress
 *   - Milestone tracking (applications, interviews, offers)
 *   - Acceptance: User can view their complete journey timeline
 *
 * Routes (via nexusHandler → /api/nexus/journey):
 *   GET /api/nexus/journey          → full timeline (conversations + memories +
 *                                     pipeline + suggestions, sorted by date)
 *   GET /api/nexus/journey/summary  → high-level stats (counts, date ranges)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { selectMany, isSupabaseConfigured } from './supabaseRest.js';

// ── Types ──

export type JourneyEntryType =
  | 'conversation'
  | 'insight'
  | 'milestone'
  | 'application'
  | 'stage_change'
  | 'suggestion'
  | 'assessment';

export interface JourneyEntry {
  id: string;
  type: JourneyEntryType;
  timestamp: string;       // ISO 8601
  title: string;
  description?: string;
  // Optional context-specific metadata for the frontend to render rich cards.
  metadata?: Record<string, any>;
  // Optional link to navigate to the related resource.
  link?: string;
}

export interface JourneySummary {
  first_interaction_at: string | null;
  last_interaction_at: string | null;
  total_conversations: number;
  total_messages: number;
  total_insights: number;
  total_applications: number;
  active_applications: number;
  total_suggestions: number;
  pending_suggestions: number;
  milestones_reached: number;
  diagnostic_progress_avg: number;
}

// ── Source fetchers (all non-blocking) ──

async function fetchConversationEntries(userId: string): Promise<JourneyEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const rows = await selectMany(
      'nexus_conversations',
      {
        select: 'id,title,messages,diagnostic_progress,milestone_status,total_tokens,created_at,updated_at',
        where: [{ column: 'user_id', value: userId, op: 'eq' }],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 50,
      },
      8000,
    );
    if (!rows || rows.length === 0) return [];

    return rows.map((conv: any) => {
      const messageCount = Array.isArray(conv.messages) ? conv.messages.length : 0;
      const milestones = conv.milestone_status || {};
      const milestoneCount = Object.values(milestones).filter(Boolean).length;
      return {
        id: conv.id,
        type: 'conversation' as JourneyEntryType,
        timestamp: conv.updated_at || conv.created_at,
        title: conv.title || `Conversation (${messageCount} messages)`,
        description: `${messageCount} messages exchanged${milestoneCount > 0 ? ` · ${milestoneCount} milestones reached` : ''}${conv.diagnostic_progress > 0 ? ` · diagnostic ${conv.diagnostic_progress}%` : ''}`,
        metadata: {
          message_count: messageCount,
          diagnostic_progress: conv.diagnostic_progress,
          milestone_status: milestones,
          total_tokens: conv.total_tokens,
        },
        link: '/dex/chat',
      };
    });
  } catch (e) {
    console.warn('[nexusJourneyHandler] conversations fetch failed:', e);
    return [];
  }
}

async function fetchInsightEntries(userId: string): Promise<JourneyEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const rows = await selectMany(
      'nexus_memory',
      {
        select: 'id,memory_type,content,importance,confidence,created_at,last_accessed_at',
        where: [
          { column: 'user_id', value: userId, op: 'eq' },
          { column: 'is_active', value: true, op: 'eq' },
        ],
        orderBy: { column: 'created_at', ascending: false },
        limit: 50,
      },
      8000,
    );
    if (!rows || rows.length === 0) return [];

    return rows.map((mem: any) => ({
      id: mem.id,
      type: 'insight' as JourneyEntryType,
      timestamp: mem.created_at,
      title: labelMemoryType(mem.memory_type),
      description: String(mem.content || '').slice(0, 280),
      metadata: {
        memory_type: mem.memory_type,
        importance: mem.importance,
        confidence: mem.confidence,
      },
    }));
  } catch (e) {
    console.warn('[nexusJourneyHandler] insights fetch failed:', e);
    return [];
  }
}

function labelMemoryType(type: string): string {
  const labels: Record<string, string> = {
    goal: 'Goal articulated',
    pain_point: 'Pain point surfaced',
    strength: 'Strength identified',
    experience: 'Experience noted',
    preference: 'Preference recorded',
    insight: 'Insight extracted',
    episodic_summary: 'Conversation summarized',
    semantic_profile: 'Profile updated',
    milestone: 'Milestone reached',
  };
  return labels[type] || 'Memory recorded';
}

async function fetchPipelineEntries(userId: string): Promise<JourneyEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    // Resolve the contact_id for this user (candidates_pipeline links via contact_id).
    const contact = await selectMany(
      'contacts',
      {
        select: 'id,full_name',
        where: [{ column: 'user_id', value: userId, op: 'eq' }],
        limit: 1,
      },
      5000,
    ).catch(() => []);
    if (!contact || contact.length === 0) return [];
    const contactId = contact[0].id;

    const rows = await selectMany(
      'candidates_pipeline',
      {
        select: 'id,mandate_id,stage,match_score,created_at,updated_at',
        where: [{ column: 'contact_id', value: contactId, op: 'eq' }],
        orderBy: { column: 'updated_at', ascending: false },
        limit: 30,
      },
      8000,
    );
    if (!rows || rows.length === 0) return [];

    return rows.map((row: any) => {
      const stage = String(row.stage || 'SWEEP').toUpperCase();
      const isMilestone = ['INTERVIEW', 'OFFER', 'HIRED'].includes(stage);
      return {
        id: row.id,
        type: isMilestone ? ('milestone' as JourneyEntryType) : ('application' as JourneyEntryType),
        timestamp: row.updated_at || row.created_at,
        title: isMilestone ? titleForStage(stage) : 'Application active',
        description: `Stage: ${stage}${row.match_score ? ` · match score ${(row.match_score || 0).toFixed(0)}%` : ''}`,
        metadata: {
          mandate_id: row.mandate_id,
          stage,
          match_score: row.match_score,
        },
        link: '/candidates/applications',
      };
    });
  } catch (e) {
    console.warn('[nexusJourneyHandler] pipeline fetch failed:', e);
    return [];
  }
}

function titleForStage(stage: string): string {
  switch (stage) {
    case 'INTERVIEW': return 'Interview stage reached';
    case 'OFFER': return 'Offer extended';
    case 'HIRED': return 'Placement confirmed';
    default: return `Advanced to ${stage.toLowerCase()}`;
  }
}

async function fetchSuggestionEntries(userId: string): Promise<JourneyEntry[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const rows = await selectMany(
      'nexus_proactive_suggestions',
      {
        select: 'id,trigger_type,title,body,status,created_at,acted_on_at,dismissed_at',
        where: [{ column: 'user_id', value: userId, op: 'eq' }],
        orderBy: { column: 'created_at', ascending: false },
        limit: 30,
      },
      8000,
    );
    if (!rows || rows.length === 0) return [];

    return rows.map((s: any) => ({
      id: s.id,
      type: 'suggestion' as JourneyEntryType,
      timestamp: s.acted_on_at || s.dismissed_at || s.created_at,
      title: s.title,
      description: String(s.body || '').slice(0, 280),
      metadata: {
        trigger_type: s.trigger_type,
        status: s.status,
      },
    }));
  } catch (e) {
    console.warn('[nexusJourneyHandler] suggestions fetch failed:', e);
    return [];
  }
}

// ── Summary computation ──

async function computeSummary(
  userId: string,
  entries: JourneyEntry[],
): Promise<JourneySummary> {
  const timestamps = entries.map((e) => e.timestamp).filter(Boolean).sort();
  const conversations = entries.filter((e) => e.type === 'conversation');
  const insights = entries.filter((e) => e.type === 'insight');
  const applications = entries.filter((e) => e.type === 'application' || e.type === 'milestone');
  const suggestions = entries.filter((e) => e.type === 'suggestion');
  const milestones = entries.filter((e) => e.type === 'milestone');

  const totalMessages = conversations.reduce(
    (sum, c) => sum + (c.metadata?.message_count || 0),
    0,
  );
  const diagnosticProgressAvg = conversations.length > 0
    ? Math.round(
        conversations.reduce((s, c) => s + (c.metadata?.diagnostic_progress || 0), 0) /
          conversations.length,
      )
    : 0;

  // Active applications = pipeline rows that aren't in a terminal stage.
  const activeApplications = applications.filter((a) => {
    const stage = String(a.metadata?.stage || '').toUpperCase();
    return !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(stage);
  }).length;

  const pendingSuggestions = suggestions.filter(
    (s) => s.metadata?.status === 'pending',
  ).length;

  return {
    first_interaction_at: timestamps[0] || null,
    last_interaction_at: timestamps[timestamps.length - 1] || null,
    total_conversations: conversations.length,
    total_messages: totalMessages,
    total_insights: insights.length,
    total_applications: applications.length,
    active_applications: activeApplications,
    total_suggestions: suggestions.length,
    pending_suggestions: pendingSuggestions,
    milestones_reached: milestones.length,
    diagnostic_progress_avg: diagnosticProgressAvg,
  };
}

// ── HTTP handler: /api/nexus/journey ──

export async function handleNexusJourney(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  // pathArr[0] === 'journey'
  const action = pathArr[1] || '';
  const method = req.method || 'GET';

  const authUser = (req as any).__authenticatedUser as { id: string; email: string; role: string } | undefined;
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized', success: false });
  }

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', success: false });
  }

  try {
    // Parallel fetch from all sources.
    const [conversations, insights, pipeline, suggestions] = await Promise.all([
      fetchConversationEntries(authUser.id),
      fetchInsightEntries(authUser.id),
      fetchPipelineEntries(authUser.id),
      fetchSuggestionEntries(authUser.id),
    ]);

    // Merge + sort descending by timestamp.
    const allEntries: JourneyEntry[] = [
      ...conversations,
      ...insights,
      ...pipeline,
      ...suggestions,
    ]
      .filter((e) => e.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // GET /api/nexus/journey/summary — high-level stats only.
    if (action === 'summary') {
      const summary = await computeSummary(authUser.id, allEntries);
      return res.status(200).json({ success: true, summary });
    }

    // GET /api/nexus/journey — full timeline.
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const summary = await computeSummary(authUser.id, allEntries);
    return res.status(200).json({
      success: true,
      entries: allEntries.slice(0, limit),
      summary,
      count: allEntries.length,
    });
  } catch (err: any) {
    console.error('[nexusJourneyHandler] error:', err);
    return res.status(500).json({
      error: 'Journey assembly failed',
      details: err?.message,
      success: false,
    });
  }
}
