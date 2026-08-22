/**
 * V-App 3/7 — Helper: fetch ALL user assessment results.
 *
 * The v3.5 Lenses library page (#1292 V-App spec) requires per-lens
 * score visibility and the tier-gated lock/unlock state. This helper
 * aggregates results from Supabase for an authenticated user into a
 * compact shape that the page needs.
 *
 * - assessment_results (one row per scored attempt)
 * - Returns per-slug latest overall_score (most recent by created_at desc)
 * - Returns per-slug last taken date
 * - Falls back to empty map for unauthenticated users
 */
import { supabase as sb, isSupabaseConfigured } from '@/lib/supabase/client';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

export interface UserLensResult {
  score: number;
  level: string | null;
  completedAt: string;
  resultId: string;
}

export type UserLensResultMap = Record<string, UserLensResult>; // key = upper code

export interface LensesFetchShape {
  results: UserLensResultMap;
  loaded: boolean;
}

/**
 * Get the latest completed result for every assessment code in the catalog
 * for the given user ID. If user not signed in or Supabase down, returns
 * empty map with loaded=true (caller treats as "no completed results").
 */
export async function fetchUserLensResults(userId: string | null): Promise<UserLensResultMap> {
  if (!userId || !isSupabaseConfigured || !sb) return {};

  try {
    const { data, error } = await sb
      .from('assessment_results')
      .select('result_id, assessment_id, overall_score, overall_level, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return {};

    const out: UserLensResultMap = {};
    for (const row of data) {
      const code = String(row.assessment_id || '').toUpperCase();
      if (!code) continue;
      if (out[code]) continue; // keep latest (first iteration = most recent)
      out[code] = {
        score: typeof row.overall_score === 'number' ? Math.max(0, Math.min(100, row.overall_score)) : 0,
        level: row.overall_level ?? null,
        completedAt: row.created_at ?? '',
        resultId: row.result_id ?? '',
      };
    }
    return out;
  } catch (e) {
    console.warn('[fetchUserLensResults] error:', e);
    return {};
  }
}

/**
 * Tier gating for the full 11-lens catalog — unified rule that matches
 * the spec § 4 SHIFT 5 + Advisory 6 membership table.
 *
 * Access rule per spec:
 *   Explorer  → PRISM, SPARK
 *   Starter   → LEAP, IMPACT
 *   Pro       → LEAP, IMPACT, QUEST, BRIDGE, MOSAIC
 *   Executive → All 11 lenses (SHIFT 5 + Advisory 6)
 *   Council   → All 11 lenses
 *
 * Returns true if user tier can access the lens.
 */
export function canAccessLens(userTier: string | null | undefined, lensCode: string): boolean {
  const code = lensCode.toUpperCase();
  switch (userTier) {
    case 'explorer':
    case 'executive_introduction':
      return ['PRISM', 'SPARK'].includes(code);
    case 'starter':
    case 'professional': {
      // Starter — matches table for SHIFT 5 (partial) entry members
      const starterAccess = new Set([
        'PRISM', 'SPARK',   // complimentary
        'LEAP', 'IMPACT',   // Starter first step
      ]);
      if (userTier === 'starter' || userTier === 'professional') {
        if (starterAccess.has(code)) return true;
      }
      if (userTier === 'professional') {
        // Pro gets the middle tier: +QUEST, BRIDGE, MOSAIC
        const proAdds = new Set(['QUEST', 'BRIDGE', 'MOSAIC']);
        if (proAdds.has(code)) return true;
      }
      return false;
    }
    case 'pro':
    case 'executive':
    case 'council':
    case 'enterprise':
      return true;
    default:
      return ['PRISM', 'SPARK'].includes(code); // public lenses always
  }
}

/**
 * Upgrade recommendation tier to unlock the given lens.
 */
export function unlockTierFor(lensCode: string): 'Starter' | 'Professional' | 'Executive' | null {
  const code = lensCode.toUpperCase();
  if (['PRISM', 'SPARK'].includes(code)) return null;
  if (['LEAP', 'IMPACT'].includes(code)) return 'Starter';
  if (['QUEST', 'BRIDGE', 'MOSAIC'].includes(code)) return 'Professional';
  return 'Executive';
}

/**
 * Returns Pillar group ID (SHIFT / Advisory) per the spec § 4.
 * SHIFT 5:  [LEAP, QUEST, IMPACT, DRIVE, COACH]
 * Advisory 6: [CPI, PRISM, SPARK, FORGE, BRIDGE, MOSAIC]
 */
export const SHIFT5_KEYS = ['LEAP', 'QUEST', 'IMPACT', 'DRIVE', 'COACH'];
export const ADVISORY6_KEYS = ['CPI', 'PRISM', 'SPARK', 'FORGE', 'BRIDGE', 'MOSAIC'];

export type PillarGroup = 'SHIFT' | 'Advisory';
export function lensPillarGroup(lensCode: string): PillarGroup {
  const up = lensCode.toUpperCase();
  if (SHIFT5_KEYS.includes(up)) return 'SHIFT';
  return 'Advisory';
}

export const PILLAR_GROUP_META: Record<PillarGroup, {
  eyebrow: string;
  eyebrowColor: string;
  title: string;
  description: string;
}> = {
  SHIFT: {
    eyebrow: 'GROUP 01 · SHIFT',
    eyebrowColor: 'teal',
    title: 'SHIFT — the five operating lenses.',
    description: 'The day-to-day. Five lenses that describe how you move, decide, and connect with people every week.',
  },
  Advisory: {
    eyebrow: 'GROUP 02 · ADVISORY',
    eyebrowColor: 'ocean',
    title: 'Advisory — the six depth lenses.',
    description: 'Six specialized instruments that form the advisory workbench — deeper context surfaces, longer time horizons, and 1:1 readouts.',
  },
};

/**
 * List of lens codes ordered by SHIFT 5 first, then Advisory 6
 * (with CPI as flagship first in its pillar group).
 */
export const ORDERED_LENS_CODES: string[] = [...SHIFT5_KEYS, ...ADVISORY6_KEYS];

/**
 * Get lens display name using ASSESSMENT_CATALOG.
 */
export function lensDisplayName(code: string): string {
  const upper = code.toUpperCase();
  const entry = (ASSESSMENT_CATALOG as any)[upper] || (ASSESSMENT_CATALOG as any)[code];
  if (!entry) return upper;
  return entry.b2cName || entry.name || upper;
}

/**
 * Get lens tagline using ASSESSMENT_CATALOG.
 */
export function lensTagline(code: string): string {
  const upper = code.toUpperCase();
  const entry = (ASSESSMENT_CATALOG as any)[upper] || (ASSESSMENT_CATALOG as any)[code];
  if (!entry) return '';
  return entry.tagline || '';
}

/**
 * Get priceMiles from catalog (as number of miles; 0 default).
 */
export function lensPriceMiles(code: string): number {
  const upper = code.toUpperCase();
  const entry = (ASSESSMENT_CATALOG as any)[upper] || (ASSESSMENT_CATALOG as any)[code];
  return entry?.priceMiles ?? 0;
}

/**
 * Duration from catalog (minutes).
 */
export function lensDuration(code: string): number {
  const upper = code.toUpperCase();
  const entry = (ASSESSMENT_CATALOG as any)[upper] || (ASSESSMENT_CATALOG as any)[code];
  return entry?.duration_minutes ?? 0;
}
