/**
 * database.ts — #98 Canonical Supabase Database Types (B2C)
 *
 * Auto-generated-style types for all 8 assessment domain tables, plus
 * types for all NEXUS Phase 8 tables. Used by `getSupabase()` and the
 * consolidated API routes to enforce type-safe access across B2C app.
 *
 * This mirrors the migration files:
 *   - 20260812_assessment_domain_tables.sql
 *   - 20260812_nexus_conversations.sql
 *   - 20260812_nexus_memory.sql
 *   - 20260812_nexus_rag.sql
 *   - 20260812_nexus_recommendations.sql
 *
 * Regenerate with `supabase gen types typescript` once prod is wired.
 * For now we keep a hand-maintained copy that matches the migrations 1:1.
 */

import type { TierKey } from '@/config/tierConfig';

// ── ENUM mirrors from Postgres (kept as TS unions) ────────────────

export type NexusMemoryType =
  | 'decision'
  | 'action_item'
  | 'emotion'
  | 'fact'
  | 'preference'
  | 'summary';

export type NexusMessageRole = 'user' | 'assistant' | 'system';

export type NexusAuditChangeType = 'created' | 'updated' | 'deleted';
export type NexusAuditSource = 'auto_extraction' | 'user_edit' | 'system_maintenance';

export type NexusContentSourceType =
  | 'article'
  | 'guide'
  | 'whitepaper'
  | 'playbook'
  | 'template'
  | 'faq'
  | 'case_study'
  | 'curated';

export type NexusRecommendationTrigger =
  | 'post_assessment'
  | 'inactivity_streak'
  | 'new_content_available'
  | 'new_capability'
  | 'goal_progress_milestone'
  | 'miles_low'
  | 'repeat_question';

export type NexusRecommendationStatus =
  | 'pending'
  | 'delivered'
  | 'dismissed'
  | 'actioned';

// ── 8 Assessment Domain Tables (#98) ──────────────────────────────

export interface AssessmentDefinitionRow {
  assessment_id: string;       // PK VARCHAR(50) — canonical slug
  title: string;
  subtitle: string | null;
  accent_color: string | null;
  tier_key: TierKey;           // FK → tiers.tier_key
  total_questions: number;
  total_dimensions: number;
  status: 'placeholder' | 'active';
  is_active: boolean;
  created_at: string;          // timestamptz
  updated_at: string;
}

export interface AssessmentDimensionRow {
  dimension_id: number;        // PK SERIAL
  assessment_id: string;       // FK → assessment_definitions ON DELETE CASCADE
  dimension_key: string;       // canonical dim key, unique per assessment
  name: string;
  description: string | null;
  low_label: string | null;
  high_label: string | null;
  weight: number;              // NUMERIC(3,2)
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentQuestionOption {
  value: string;
  label: string;
  score?: number;
}

export interface AssessmentQuestionRow {
  question_id: number;         // PK SERIAL
  assessment_id: string;       // FK → assessment_definitions CASCADE
  question_key: string;        // canonical key, unique per assessment
  question_type: 'single_select' | 'multi_select' | 'scale' | 'text' | 'scenario';
  prompt: string;
  options: AssessmentQuestionOption[] | null;  // JSONB
  scale_min: number | null;
  scale_max: number | null;
  scale_labels: Record<string, string> | null; // JSONB
  max_selections: number | null;
  scenario: string | null;
  required: boolean;
  dimension_key: string;
  weight: number;              // NUMERIC(3,2)
  sort_order: number;
  skip_logic: import('./assessment').SkipRule[] | null;   // JSONB
  dependency: import('./assessment').QuestionDependency | null; // JSONB
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttemptRow {
  attempt_id: string;          // UUID PK
  user_id: string | null;      // FK → auth.users, null=anonymous
  assessment_id: string;       // FK → assessment_definitions
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
  current_question_key: string | null;
  is_anonymous: boolean;
  expires_at: string | null;   // anonymous 7-day expiry
  created_at: string;
  updated_at: string;
}

export interface AssessmentResponseRow {
  response_id: string;         // UUID PK
  attempt_id: string;          // FK → assessment_attempts CASCADE
  question_key: string;
  answer: unknown;             // JSONB structured answer
  answered_at: string;
  updated_at: string;
}

export interface AssessmentResultRow {
  result_id: string;           // UUID PK
  attempt_id: string;          // FK → assessment_attempts CASCADE
  assessment_id: string;       // FK → assessment_definitions
  user_id: string | null;      // denormalized for RLS
  overall_score: number | null;      // 0-100
  overall_level: string | null;      // Developing / Proficient / Advanced / Mastery
  style_key: string | null;
  archetype_key: string | null;
  insights: string[] | null;          // JSONB string[]
  raw_data: unknown | null;           // JSONB full scoring state
  completed_at: string;
  created_at: string;
}

export interface AssessmentResultDimensionRow {
  result_dimension_id: string; // UUID PK
  result_id: string;           // FK → assessment_results CASCADE
  dimension_key: string;
  score: number;               // 0-100
  level: string | null;
  dimension_name: string | null;      // denormalized display label
  description: string | null;          // per-dimension insight
  created_at: string;
}

export interface AssessmentArchetypeRow {
  archetype_id: number;        // PK SERIAL
  assessment_id: string;       // FK → assessment_definitions CASCADE
  archetype_key: string;       // unique per assessment
  name: string;
  description: string | null;
  key_traits: string[] | null; // JSONB string[]
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── NEXUS Phase 8 Tables (#39 / #40 / #42 / #43) ─────────────────

export interface NexusConversationRow {
  id: string;                  // UUID PK
  user_id: string | null;      // FK → auth.users
  title: string | null;
  deleted_at: string | null;   // soft-delete
  created_at: string;
  updated_at: string;
}

export interface NexusMessageRow {
  id: string;                  // UUID PK
  conversation_id: string;     // FK CASCADE
  role: NexusMessageRole;
  content: string;
  tokens_used: number;
  model_used: string | null;   // 'deepseek-flash' | 'deepseek-pro'
  user_id: string | null;      // denormalized for RLS
  created_at: string;
}

export interface NexusEpisodicMemoryRow {
  id: string;                       // UUID PK
  user_id: string;                  // FK → profiles
  content: string;
  embedding: unknown | null;        // vector(1536)
  memory_type: NexusMemoryType;
  source_conversation_id: string | null; // FK → nexus_conversations
  importance_score: number;         // NUMERIC(3,2) 0.0-1.0
  created_at: string;
  updated_at: string;
}

export interface NexusSemanticMemoryRow {
  id: string;                       // UUID PK
  user_id: string;                  // UUID UNIQUE FK → profiles
  user_model: {
    goals?: Array<{ id: string; text: string; status: 'active' | 'completed' | 'on_hold' | 'abandoned'; created_at: string }>;
    preferences?: {
      communication_style?: 'concise' | 'detailed' | 'balanced';
      focus_areas?: string[];
      tone_preference?: 'executive' | 'conversational' | 'mentoring';
    };
    patterns?: {
      typical_topics?: string[];
      engagement_patterns?: string;
      common_questions?: string[];
    };
    career_context?: {
      role?: string;
      industry?: string;
      level?: string;
      company_size?: string;
    };
  };
  last_updated: string;
  update_count: number;             // int DEFAULT 0
}

export interface NexusMemoryAuditRow {
  id: string;                       // UUID PK
  user_id: string;                  // FK → profiles
  memory_id: string | null;
  change_type: NexusAuditChangeType;
  old_value: string | null;
  new_value: string | null;
  source: NexusAuditSource;
  created_at: string;
}

export interface NexusContentLibraryRow {
  id: string;                       // UUID PK
  source_title: string;
  source_url: string | null;
  source_type: NexusContentSourceType;
  publish_date: string | null;
  audience_tier: TierKey;
  summary: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NexusContentChunkRow {
  id: string;                       // UUID PK
  content_id: string;               // FK → nexus_content_library CASCADE
  chunk_index: number;
  content: string;
  embedding: unknown | null;        // vector(1536)
  chunk_token_count: number;
  created_at: string;
}

export interface NexusContentAccessLogRow {
  id: string;                       // UUID PK
  user_id: string | null;           // FK → profiles
  content_id: string | null;        // FK
  chunk_id: string | null;          // FK
  accessed_via: 'nexus_search' | 'manual_link' | 'recommendation';
  search_query: string | null;
  created_at: string;
}

export interface NexusRecommendationRow {
  id: string;                       // UUID PK
  user_id: string;                  // FK → profiles
  trigger_type: NexusRecommendationTrigger;
  headline: string;
  recommendation: string;
  context_payload: unknown | null;  // JSONB
  related_content_id: string | null; // FK
  related_diagnostic_slug: string | null;
  status: NexusRecommendationStatus;
  delivered_at: string | null;
  created_at: string;
}

export interface NexusRecommendationCooldownRow {
  user_id: string;                  // PK component
  trigger_type: string;             // PK component (VARCHAR 50)
  last_fired_at: string;
  cooldown_hours: number;           // DEFAULT 24
  next_allowed_at: string;
}

// ── Public Database type (simulates supabase-cli output) ──────────

export interface Database {
  public: {
    Tables: {
      assessment_definitions: { Row: AssessmentDefinitionRow; Insert: Omit<AssessmentDefinitionRow, 'created_at' | 'updated_at'>; Update: Partial<AssessmentDefinitionRow> };
      assessment_dimensions: { Row: AssessmentDimensionRow; Insert: Omit<AssessmentDimensionRow, 'dimension_id' | 'created_at' | 'updated_at'>; Update: Partial<AssessmentDimensionRow> };
      assessment_questions: { Row: AssessmentQuestionRow; Insert: Omit<AssessmentQuestionRow, 'question_id' | 'created_at' | 'updated_at'>; Update: Partial<AssessmentQuestionRow> };
      assessment_attempts: { Row: AssessmentAttemptRow; Insert: Omit<AssessmentAttemptRow, 'attempt_id' | 'created_at' | 'updated_at'>; Update: Partial<AssessmentAttemptRow> };
      assessment_responses: { Row: AssessmentResponseRow; Insert: Omit<AssessmentResponseRow, 'response_id' | 'updated_at' | 'answered_at'>; Update: Partial<AssessmentResponseRow> };
      assessment_results: { Row: AssessmentResultRow; Insert: Omit<AssessmentResultRow, 'result_id' | 'created_at'>; Update: Partial<AssessmentResultRow> };
      assessment_result_dimensions: { Row: AssessmentResultDimensionRow; Insert: Omit<AssessmentResultDimensionRow, 'result_dimension_id' | 'created_at'>; Update: Partial<AssessmentResultDimensionRow> };
      assessment_archetypes: { Row: AssessmentArchetypeRow; Insert: Omit<AssessmentArchetypeRow, 'archetype_id' | 'created_at' | 'updated_at'>; Update: Partial<AssessmentArchetypeRow> };
      nexus_conversations: { Row: NexusConversationRow; Insert: Omit<NexusConversationRow, 'id' | 'created_at' | 'updated_at'>; Update: Partial<NexusConversationRow> };
      nexus_messages: { Row: NexusMessageRow; Insert: Omit<NexusMessageRow, 'id' | 'created_at'>; Update: Partial<NexusMessageRow> };
      nexus_episodic_memory: { Row: NexusEpisodicMemoryRow; Insert: Omit<NexusEpisodicMemoryRow, 'id' | 'created_at' | 'updated_at'>; Update: Partial<NexusEpisodicMemoryRow> };
      nexus_semantic_memory: { Row: NexusSemanticMemoryRow; Insert: Omit<NexusSemanticMemoryRow, 'id'>; Update: Partial<NexusSemanticMemoryRow> };
      nexus_memory_audit: { Row: NexusMemoryAuditRow; Insert: Omit<NexusMemoryAuditRow, 'id' | 'created_at'> };
      nexus_content_library: { Row: NexusContentLibraryRow; Insert: Omit<NexusContentLibraryRow, 'id' | 'created_at' | 'updated_at'>; Update: Partial<NexusContentLibraryRow> };
      nexus_content_chunks: { Row: NexusContentChunkRow; Insert: Omit<NexusContentChunkRow, 'id' | 'created_at'> };
      nexus_content_access_log: { Row: NexusContentAccessLogRow; Insert: Omit<NexusContentAccessLogRow, 'id' | 'created_at'> };
      nexus_recommendations: { Row: NexusRecommendationRow; Insert: Omit<NexusRecommendationRow, 'id' | 'created_at'>; Update: Partial<NexusRecommendationRow> };
      nexus_recommendation_cooldowns: { Row: NexusRecommendationCooldownRow; Insert: NexusRecommendationCooldownRow; Update: Partial<NexusRecommendationCooldownRow> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      memory_type: NexusMemoryType;
      message_role: NexusMessageRole;
      audit_change_type: NexusAuditChangeType;
      audit_source: NexusAuditSource;
      content_source_type: NexusContentSourceType;
      rec_trigger: NexusRecommendationTrigger;
      rec_status: NexusRecommendationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
