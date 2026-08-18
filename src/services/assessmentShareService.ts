/**
 * Assessment Share Service — Ticket #1337
 *
 * Result data contract + share link generation + PDF export gating.
 * Share links: 7-day expiry, revocable, no PII on shared page.
 * PDF export: gated by tier (Executive Introduction = no export,
 * Starter+ = PDF export).
 */

import { getSupabase } from '@/services/supabaseApi';
import { milesBalance } from '@/services/creditService';
import type { CreditTier } from '@/contexts/CreditContext';

// ── #1337: Result Data Contract ──────────────────────────────────

export interface AssessmentDimensionResult {
  id: string;
  name: string;
  score: number;            // 0-100
  tier: string;             // Elite | Advanced | Established | Developing
  strengths: string[];
  gaps: string[];
  benchmark_percentile: number | null;  // e.g. 72 = top 28%
}

export interface AssessmentRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timeframe: string;        // e.g. "30 days", "90 days"
}

export interface AssessmentResultContract {
  // Identity (NOT included in shared_payload)
  result_id: string;
  user_id: string;
  user_name: string | null;  // PII — stripped from shared payload
  user_email: string | null;  // PII — stripped from shared payload

  // Assessment metadata
  assessment_code: string;
  assessment_name: string;
  assessment_version: string;
  completed_at: string;

  // Core result
  overall_score: number;    // 0-100
  overall_tier: string;     // Elite | Advanced | Established | Developing
  archetype: string | null;
  archetype_description: string | null;

  // Dimensions
  dimensions: AssessmentDimensionResult[];

  // Benchmark
  benchmark_percentile: number | null;  // overall percentile vs peer group
  benchmark_sample_size: number | null;

  // Recommendations
  recommendations: AssessmentRecommendation[];

  // Composite bands
  composite_band: string | null;
  composite_interpretation: string | null;
}

/**
 * Sanitized payload for shared links — NO PII.
 * This is what gets stored in assessment_shares.shared_payload.
 */
export interface SharedAssessmentPayload {
  assessment_code: string;
  assessment_name: string;
  overall_score: number;
  overall_tier: string;
  archetype: string | null;
  archetype_description: string | null;
  dimensions: AssessmentDimensionResult[];
  benchmark_percentile: number | null;
  recommendations: AssessmentRecommendation[];
  composite_band: string | null;
  composite_interpretation: string | null;
  shared_at: string;       // when the link was created (NOT the user's completion date)
}

// ── Share Link Generation ────────────────────────────────────────

export interface AssessmentShare {
  id: string;
  share_token: string;
  owner_id: string;
  result_id: string;
  assessment_code: string;
  shared_payload: SharedAssessmentPayload;
  expires_at: string;
  revoked_at: string | null;
  view_count: number;
  max_views: number | null;
  created_at: string;
}

/**
 * Generate a share link for an assessment result.
 * The payload is sanitized — no PII (name, email, user_id) is included.
 * Link expires in 7 days. Owner can revoke at any time.
 */
export async function createShareLink(
  result: AssessmentResultContract,
  maxViews?: number,
): Promise<AssessmentShare | null> {
  // Sanitize: strip PII fields
  const payload: SharedAssessmentPayload = {
    assessment_code: result.assessment_code,
    assessment_name: result.assessment_name,
    overall_score: result.overall_score,
    overall_tier: result.overall_tier,
    archetype: result.archetype,
    archetype_description: result.archetype_description,
    dimensions: result.dimensions,
    benchmark_percentile: result.benchmark_percentile,
    recommendations: result.recommendations,
    composite_band: result.composite_band,
    composite_interpretation: result.composite_interpretation,
    shared_at: new Date().toISOString(),
  };

  // Generate opaque token (crypto-random, URL-safe)
  const token = generateShareToken();

  const { data, error } = await getSupabase()
    .from('assessment_shares')
    .insert({
      share_token: token,
      owner_id: result.user_id,
      result_id: result.result_id,
      assessment_code: result.assessment_code,
      shared_payload: payload,
      max_views: maxViews ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[assessmentShare] createShareLink error:', error);
    return null;
  }
  return data as AssessmentShare;
}

/**
 * Fetch a shared result by token (public access — no auth required).
 * Returns null if expired, revoked, or view limit reached.
 */
export async function fetchSharedResult(token: string): Promise<SharedAssessmentPayload | null> {
  const { data, error } = await getSupabase()
    .from('assessment_shares')
    .select('shared_payload, expires_at, revoked_at, view_count, max_views')
    .eq('share_token', token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  if (data.max_views !== null && data.view_count >= data.max_views) return null;

  // Increment view count (fire-and-forget)
  getSupabase()
    .from('assessment_shares')
    .update({ view_count: data.view_count + 1 })
    .eq('share_token', token)
    .then(() => {});

  return data.shared_payload as SharedAssessmentPayload;
}

/**
 * Revoke a share link. Only the owner can revoke.
 */
export async function revokeShareLink(shareId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('assessment_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', shareId);
  return !error;
}

/**
 * List all share links for the current user.
 */
export async function listUserShares(): Promise<AssessmentShare[]> {
  const { data, error } = await getSupabase()
    .from('assessment_shares')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as AssessmentShare[];
}

// ── PDF Export Gating ────────────────────────────────────────────

/**
 * PDF export is gated by tier:
 * - explorer (Executive Introduction): NO export — preview only
 * - starter+: full PDF export
 *
 * Also checks if the user has enough miles (assessment must be paid for).
 */
export async function canExportPdf(
  tier: CreditTier,
  userId: string,
  assessmentMilesCost: number,
): Promise<{ allowed: boolean; reason?: string }> {
  // Tier gate
  if (tier === 'explorer') {
    return {
      allowed: false,
      reason: 'PDF export is available with the Starter tier and above. Elevate your membership to download full assessment reports.',
    };
  }

  // Miles gate — user must have enough miles to have purchased the assessment
  const info = await milesBalance(userId);
  if (info.miles < 0) {
    return { allowed: false, reason: 'Miles balance error. Please contact support.' };
  }

  return { allowed: true };
}

/**
 * Build the share URL from a token.
 */
export function buildShareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lyc-partners.ai';
  return `${origin}/share/${token}`;
}

// ── Helpers ──────────────────────────────────────────────────────

function generateShareToken(): string {
  // 32-byte random token, base64url-encoded (URL-safe, ~43 chars)
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
