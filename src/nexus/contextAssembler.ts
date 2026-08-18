/**
 * contextAssembler.ts — NEXUS 8-layer User Context Assembly Pipeline (#41 spec)
 *
 * Composes user context from 8 independent layers into a single UserContextAssembled
 * object. Each layer can be composed individually for testing or partial hydration.
 *
 * Layers:
 *   1. profile        — raw user identity + career metadata
 *   2. conversation_state — recent conversation activity
 *   3. goals          — active/completed/abandoned goals from semantic memory
 *   4. diagnostics    — assessment history categorized by tier access
 *   5. coaching_state — coaching sessions + active program
 *   6. miles_balance  — miles economy state
 *   7. tier           — tier metadata + capabilities matrix
 *   8. safety_flags   — admin / verification / PII flags
 */

import {
  TierKey,
  tierDisplayName,
  tierMeets,
  canAccessDiagnostic,
  DIAGNOSTIC_SLUGS,
  DiagnosticSlug,
  TIER_META,
} from '@/config/tierConfig';
import type {
  SemanticMemoryRecord,
  Goal,
  UserModel,
} from '@/nexus/memory/semanticMemory';

// ─────────────────────────────────────────────────────────────────────────────
// TIER CAPABILITY MATRIX CANONICAL (#41 spec)
// ─────────────────────────────────────────────────────────────────────────────

export type NexCapability =
  | 'nexus_flash_chat'
  | 'prism_access'
  | 'spark_access'
  | 'complimentary_assessment'
  | '10_miles_monthly'
  | 'basic_memory'
  | 'forge_access'
  | 'bridge_access'
  | 'mosaic_access'
  | '50_miles_monthly'
  | 'pro_upgrades_available'
  | 'working_memory_30d'
  | '3_recommendations_daily'
  | 'drive_access'
  | 'nexus_pro_included'
  | 'unlimited_flash'
  | '200_miles_monthly'
  | 'full_semantic_memory'
  | '7_recommendations_daily'
  | 'journey_dashboard'
  | '400_miles_monthly'
  | 'priority_support'
  | 'dedicated_program'
  | 'unlimited_pro_increment'
  | 'quarterly_review_access'
  | '15_recommendations_daily'
  | 'unlimited_miles'
  | 'admin_dashboard'
  | 'api_access'
  | 'audit_logs_90d'
  | 'sso_available'
  | 'team_members_50'
  | 'custom_content_library';

const _BASELINE_CAPABILITIES: NexCapability[] = [
  'nexus_flash_chat',
  'prism_access',
  'spark_access',
  'complimentary_assessment',
  '10_miles_monthly',
  'basic_memory',
];

const _PROFESSIONAL_CAPABILITIES: NexCapability[] = [
  ..._BASELINE_CAPABILITIES,
  'forge_access',
  'bridge_access',
  'mosaic_access',
  '50_miles_monthly',
  'pro_upgrades_available',
  'working_memory_30d',
  '3_recommendations_daily',
];

const _EXECUTIVE_CAPABILITIES: NexCapability[] = [
  ..._PROFESSIONAL_CAPABILITIES,
  'drive_access',
  'nexus_pro_included',
  'unlimited_flash',
  '200_miles_monthly',
  'full_semantic_memory',
  '7_recommendations_daily',
  'journey_dashboard',
];

const _COUNCIL_CAPABILITIES: NexCapability[] = [
  ..._EXECUTIVE_CAPABILITIES,
  '400_miles_monthly',
  'priority_support',
  'dedicated_program',
  'unlimited_pro_increment',
  'quarterly_review_access',
  '15_recommendations_daily',
];

const _ENTERPRISE_CAPABILITIES: NexCapability[] = [
  ..._COUNCIL_CAPABILITIES,
  'unlimited_miles',
  'admin_dashboard',
  'api_access',
  'audit_logs_90d',
  'sso_available',
  'team_members_50',
  'custom_content_library',
];

export const TIER_CAPABILITIES: Record<TierKey, NexCapability[]> = {
  executive_introduction: _BASELINE_CAPABILITIES,
  professional: _PROFESSIONAL_CAPABILITIES,
  executive: _EXECUTIVE_CAPABILITIES,
  council: _COUNCIL_CAPABILITIES,
  enterprise: _ENTERPRISE_CAPABILITIES,
};

export function getCapabilitiesForTier(tierKey: TierKey | string): NexCapability[] {
  const canonical = TIER_META[tierKey as TierKey] ? (tierKey as TierKey) : 'executive_introduction';
  return TIER_CAPABILITIES[canonical];
}

export function userHasCapability(
  tierKey: TierKey | string | null | undefined,
  capability: NexCapability
): boolean {
  if (!tierKey) return false;
  const canonical = TIER_META[tierKey as TierKey] ? (tierKey as TierKey) : null;
  if (!canonical) return false;
  return TIER_CAPABILITIES[canonical].includes(capability);
}

// ─────────────────────────────────────────────────────────────────────────────
// INDIVIDUAL LAYER TYPES (#41 spec)
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfileLayer {
  user_id: string;
  display_name: string;
  preferred_name?: string;
  job_title?: string;
  company?: string;
  industry?: string;
  tenure_days?: number;
  join_date?: string;
  communication_style?: string;
  tone_preference?: string;
}

export interface ConversationStateLayer {
  messages_count_7d: number;
  avg_message_length: number;
  last_turn_at: string | null;
  active_topics: string[];
}

export interface GoalsLayer {
  active: Array<{
    id: string;
    text: string;
    progress: number;
    created_at: string;
    due?: string;
  }>;
  completed_90d: number;
  abandoned_90d: number;
}

export interface DiagnosticsLayer {
  completed: Array<{
    slug: string;
    title: string;
    last_score: number | null;
    last_result_id: string | null;
    last_dimensions?: Record<string, number>;
    completed_at: string;
  }>;
  in_progress: Array<{
    slug: string;
    title: string;
    percent_complete: number;
    started_at: string;
  }>;
  available: TierKey[];
  locked: Array<{
    slug: string;
    title: string;
    requires_tier: TierKey;
  }>;
}

export interface CoachingLayer {
  last_session_at?: string;
  active_program?: string;
  sessions_count_90d: number;
  focus_areas: string[];
}

export interface MilesLayer {
  balance: number;
  lifetime_spent: number;
  last_recharge_at?: string;
  recharge_date?: string;
  next_recharge_amount?: number;
}

export interface TierLayer {
  key: TierKey;
  display_name: string;
  order: number;
  capabilities: NexCapability[];
}

export interface SafetyFlagsLayer {
  is_admin: boolean;
  verified_email: boolean;
  pii_cleared: boolean;
}

export interface UserContextAssembled {
  profile: UserProfileLayer;
  conversation_state: ConversationStateLayer;
  goals: GoalsLayer;
  diagnostics: DiagnosticsLayer;
  coaching_state: CoachingLayer;
  miles_balance: MilesLayer;
  tier: TierLayer;
  safety_flags: SafetyFlagsLayer;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileInput {
  user_id: string;
  display_name: string;
  preferred_name?: string;
  job_title?: string;
  company?: string;
  industry?: string;
  tenure_days?: number;
  join_date?: string;
  communication_style?: string;
  tone_preference?: string;
  is_admin?: boolean;
  verified_email?: boolean;
  pii_cleared?: boolean;
}

export interface ConversationStateInput {
  messages_7d?: Array<{
    id: string;
    text: string;
    created_at: string;
    topics?: string[];
  }>;
}

export interface AssessmentHistoryEntry {
  slug: string;
  title: string;
  last_score?: number | null;
  last_result_id?: string | null;
  last_dimensions?: Record<string, number>;
  completed_at?: string;
  in_progress?: boolean;
  percent_complete?: number;
  started_at?: string;
}

export interface CoachingHistoryEntry {
  id: string;
  session_at: string;
  program?: string;
  focus_area?: string;
}

export interface MilesDataInput {
  balance: number;
  lifetime_spent?: number;
  last_recharge_at?: string;
  recharge_date?: string;
  next_recharge_amount?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. buildProfileLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildProfileLayer(
  input: ProfileInput,
  semantic?: Partial<SemanticMemoryRecord> | null
): UserProfileLayer {
  const userModel: Partial<UserModel> = semantic?.user_model ?? {};
  const prefs: Partial<UserModel['preferences']> = userModel.preferences ?? {};
  const career: Partial<UserModel['career_context']> = userModel.career_context ?? {};

  return {
    user_id: input.user_id,
    display_name: input.display_name,
    preferred_name: input.preferred_name,
    job_title: input.job_title ?? career.role,
    company: input.company,
    industry: input.industry ?? career.industry,
    tenure_days: input.tenure_days,
    join_date: input.join_date,
    communication_style: input.communication_style ?? prefs.communication_style,
    tone_preference: input.tone_preference ?? prefs.tone_preference,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. buildConversationLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildConversationLayer(
  conversationState: ConversationStateInput
): ConversationStateLayer {
  const msgs = conversationState.messages_7d ?? [];
  const messages_count_7d = msgs.length;

  const now = Date.now();
  const cutoff7d = now - 7 * 24 * 60 * 60 * 1000;
  const recentMsgs = msgs.filter(m => {
    const ts = new Date(m.created_at).getTime();
    return ts >= cutoff7d && ts <= now;
  });

  const avg_message_length = recentMsgs.length > 0
    ? Math.round(
        recentMsgs.reduce((sum, m) => sum + (m.text?.length ?? 0), 0) / recentMsgs.length
      )
    : 0;

  const last_turn_at = msgs.length > 0
    ? msgs
        .map(m => new Date(m.created_at).getTime())
        .sort((a, b) => b - a)[0]
        .toString()
    : null;

  const topicsSet = new Set<string>();
  for (const m of recentMsgs) {
    if (m.topics) {
      for (const t of m.topics) {
        if (t && t.trim()) topicsSet.add(t.trim());
      }
    }
  }

  return {
    messages_count_7d: recentMsgs.length,
    avg_message_length,
    last_turn_at: last_turn_at ? new Date(Number(last_turn_at)).toISOString() : null,
    active_topics: Array.from(topicsSet).slice(0, 10),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. buildGoalsLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildGoalsLayer(
  semantic: Partial<SemanticMemoryRecord> | null | undefined
): GoalsLayer {
  const goals: Goal[] = semantic?.user_model?.goals ?? [];
  const now = Date.now();
  const cutoff90d = now - 90 * 24 * 60 * 60 * 1000;

  const active: GoalsLayer['active'] = goals
    .filter(g => g.status === 'active')
    .map(g => ({
      id: g.id,
      text: g.text,
      progress: 0,
      created_at: g.created_at,
    }));

  let completed_90d = 0;
  let abandoned_90d = 0;

  for (const g of goals) {
    const created = new Date(g.created_at).getTime();
    if (created < cutoff90d) continue;
    if (g.status === 'completed') completed_90d++;
    if (g.status === 'abandoned') abandoned_90d++;
  }

  return {
    active,
    completed_90d,
    abandoned_90d,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. buildDiagnosticsLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildDiagnosticsLayer(
  history: AssessmentHistoryEntry[],
  tierKey: TierKey | string,
  allDiagnosticSlugs: readonly DiagnosticSlug[] = DIAGNOSTIC_SLUGS
): DiagnosticsLayer {
  const completed: DiagnosticsLayer['completed'] = [];
  const in_progress: DiagnosticsLayer['in_progress'] = [];

  const seenSlugs = new Set<string>();

  for (const h of history) {
    if (!h.slug) continue;
    seenSlugs.add(h.slug.toLowerCase());

    if (h.in_progress) {
      in_progress.push({
        slug: h.slug.toLowerCase(),
        title: h.title,
        percent_complete: h.percent_complete ?? 0,
        started_at: h.started_at ?? new Date().toISOString(),
      });
    } else if (h.completed_at) {
      completed.push({
        slug: h.slug.toLowerCase(),
        title: h.title,
        last_score: h.last_score ?? null,
        last_result_id: h.last_result_id ?? null,
        last_dimensions: h.last_dimensions,
        completed_at: h.completed_at,
      });
    }
  }

  const available: TierKey[] = [];
  const locked: DiagnosticsLayer['locked'] = [];

  for (const slug of allDiagnosticSlugs) {
    const slugLower = slug.toLowerCase();
    if (canAccessDiagnostic(tierKey, slugLower)) {
      if (!seenSlugs.has(slugLower)) {
        available.push(slug as unknown as TierKey);
      }
    } else {
      const DIAGNOSTIC_TIER_REQUIREMENT: Record<string, TierKey> = {
        prism: 'executive_introduction',
        spark: 'executive_introduction',
        forge: 'professional',
        bridge: 'professional',
        mosaic: 'professional',
        drive: 'executive',
      };
      const requiresTier = DIAGNOSTIC_TIER_REQUIREMENT[slugLower] ?? 'professional';
      locked.push({
        slug: slugLower,
        title: slug.toUpperCase(),
        requires_tier: requiresTier,
      });
    }
  }

  return {
    completed,
    in_progress,
    available,
    locked,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. buildCoachingLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildCoachingLayer(
  coachingHistory: CoachingHistoryEntry[],
  semantic: Partial<SemanticMemoryRecord> | null | undefined
): CoachingLayer {
  const now = Date.now();
  const cutoff90d = now - 90 * 24 * 60 * 60 * 1000;

  const recentSessions = coachingHistory.filter(c => {
    const ts = new Date(c.session_at).getTime();
    return ts >= cutoff90d && ts <= now;
  });

  const sessions_count_90d = recentSessions.length;

  const sorted = [...coachingHistory].sort((a, b) =>
    new Date(b.session_at).getTime() - new Date(a.session_at).getTime()
  );

  const last_session_at = sorted.length > 0 ? sorted[0].session_at : undefined;
  const active_program = sorted.length > 0 ? sorted[0].program : undefined;

  const focusSet = new Set<string>();
  for (const c of recentSessions) {
    if (c.focus_area?.trim()) focusSet.add(c.focus_area.trim());
  }

  const semanticFocus = semantic?.user_model?.preferences?.focus_areas ?? [];
  for (const f of semanticFocus) {
    if (f?.trim()) focusSet.add(f.trim());
  }

  return {
    last_session_at,
    active_program,
    sessions_count_90d,
    focus_areas: Array.from(focusSet).slice(0, 20),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. buildMilesLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildMilesLayer(milesData: MilesDataInput): MilesLayer {
  return {
    balance: milesData.balance,
    lifetime_spent: milesData.lifetime_spent ?? 0,
    last_recharge_at: milesData.last_recharge_at,
    recharge_date: milesData.recharge_date,
    next_recharge_amount: milesData.next_recharge_amount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. buildTierLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildTierLayer(tierKey: TierKey | string): TierLayer {
  const canonical = TIER_META[tierKey as TierKey] ? (tierKey as TierKey) : 'executive_introduction';
  const meta = TIER_META[canonical];

  return {
    key: canonical,
    display_name: tierDisplayName(tierKey),
    order: meta.order,
    capabilities: getCapabilitiesForTier(canonical),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. buildSafetyFlagsLayer
// ─────────────────────────────────────────────────────────────────────────────

export function buildSafetyFlagsLayer(profile: ProfileInput): SafetyFlagsLayer {
  return {
    is_admin: Boolean(profile.is_admin),
    verified_email: Boolean(profile.verified_email),
    pii_cleared: Boolean(profile.pii_cleared),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP-LEVEL ASSEMBLY PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

export async function assembleUserContext(
  profile: ProfileInput,
  existingSemanticMemory: Partial<SemanticMemoryRecord> | null | undefined,
  assessmentHistory: AssessmentHistoryEntry[],
  conversationState: ConversationStateInput,
  coachingHistory: CoachingHistoryEntry[],
  milesData: MilesDataInput,
  tierKey: TierKey | string
): Promise<UserContextAssembled> {
  return {
    profile: buildProfileLayer(profile, existingSemanticMemory),
    conversation_state: buildConversationLayer(conversationState),
    goals: buildGoalsLayer(existingSemanticMemory),
    diagnostics: buildDiagnosticsLayer(assessmentHistory, tierKey),
    coaching_state: buildCoachingLayer(coachingHistory, existingSemanticMemory),
    miles_balance: buildMilesLayer(milesData),
    tier: buildTierLayer(tierKey),
    safety_flags: buildSafetyFlagsLayer(profile),
  };
}
