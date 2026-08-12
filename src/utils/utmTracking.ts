/**
 * #1326 — UTM / source tracking.
 *
 * Captures UTM (and a few first-touch) parameters from the signup URL and
 * persists them onto the user's profile so downstream analytics/attribution
 * can answer "where did this member come from?".
 *
 * Flow:
 *   1. `captureUTMParams()`   — reads utm_* + referrer from the current URL,
 *                               stashes them in sessionStorage so they survive
 *                               the email-verification redirect round-trip.
 *   2. `getStoredUTMParams()` — reads them back (post-redirect, onboarding…).
 *   3. `storeUTMOnProfile(userId, utmParams)` — writes them to the profile row.
 *
 * Storage columns written: utm_source, utm_medium, utm_campaign, utm_content,
 * utm_term, referrer, landing_page. These are not in the authStore PRIVILEGED
 * set, so updateProfile()/direct updates are permitted (subject to RLS).
 */
import { supabase as canonicalSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /** Document referrer (first touch), if any. */
  referrer?: string;
  /** Landing page path the user first arrived on. */
  landing_page?: string;
}

const STORAGE_KEY = 'lyc.utm.first_touch';

const UTM_KEYS: (keyof UTMParams)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

/** Strip whitespace and guard against excessively long values. */
function sanitize(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  // Hard cap to keep storage tidy / avoid abuse.
  return v.length > 512 ? v.slice(0, 512) : v;
}

/**
 * Read UTM parameters from the current URL (`window.location.search`) plus the
 * document referrer. Returns an empty object if none are present. Also persists
 * the captured set to sessionStorage so it survives redirects (e.g. email
 * verification).
 */
export function captureUTMParams(): UTMParams {
  const params: UTMParams = {};

  if (typeof window === 'undefined') return params;

  try {
    const search = new URLSearchParams(window.location.search);
    for (const key of UTM_KEYS) {
      const v = sanitize(search.get(key));
      if (v) params[key] = v;
    }

    const ref = sanitize(window.document.referrer);
    if (ref) params.referrer = ref;

    const landing = sanitize(window.location.pathname + window.location.search);
    if (landing) params.landing_page = landing;
  } catch {
    /* ignore parse errors */
  }

  // Persist if we captured anything.
  if (Object.keys(params).length > 0) {
    persistUTMParams(params);
  }

  return params;
}

/** Persist UTM params to sessionStorage (merges with any prior first-touch). */
export function persistUTMParams(params: UTMParams): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredUTMParams();
    // First-touch wins: don't overwrite if already set.
    const merged: UTMParams = { ...params, ...existing };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

/**
 * Read previously-captured UTM params from sessionStorage. Returns an empty
 * object if none are stored. Use this after a redirect (e.g. post email
 * verification) to retrieve the first-touch attribution.
 */
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: UTMParams = {};
    for (const key of [...UTM_KEYS, 'referrer', 'landing_page'] as (keyof UTMParams)[]) {
      const v = sanitize((parsed as Record<string, unknown>)[key as string] as string);
      if (v) out[key] = v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Clear stored UTM params (e.g. after they've been persisted to the profile). */
export function clearStoredUTMParams(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Store captured UTM params on the user's profile row.
 *
 * @param userId  The auth user id (profiles.id).
 * @param utmParams  The params to store (from captureUTMParams / getStoredUTMParams).
 * @returns `{ success, error? }`
 */
export async function storeUTMOnProfile(
  userId: string,
  utmParams: UTMParams,
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'No user id provided' };
  if (!isSupabaseConfigured) {
    // No DB configured — nothing to store. Not an error in dev.
    return { success: true };
  }

  // Only write non-empty fields.
  const updates: Record<string, string> = {};
  for (const [k, v] of Object.entries(utmParams)) {
    if (v) updates[k] = v;
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  try {
    const { error } = await canonicalSupabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.warn('[utmTracking] storeUTMOnProfile error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.warn('[utmTracking] storeUTMOnProfile error:', e?.message);
    return { success: false, error: e?.message || 'Failed to store UTM params' };
  }
}

/**
 * Convenience: capture (if present in URL) + persist stored params onto the
 * given profile. Safe to call right after signup. Never throws.
 */
export async function captureAndStoreUTM(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const fromUrl = captureUTMParams();
  const stored = getStoredUTMParams();
  // URL params on this request take precedence for the write, but stored
  // first-touch fills any gaps.
  const merged: UTMParams = { ...stored, ...fromUrl };
  if (Object.keys(merged).length === 0) {
    return { success: true };
  }
  const res = await storeUTMOnProfile(userId, merged);
  if (res.success) {
    // Keep the storage so a later onboarding step can still read it if the
    // first write hit a race; clear is optional. We clear to avoid re-writes.
    clearStoredUTMParams();
  }
  return res;
}

export default {
  captureUTMParams,
  getStoredUTMParams,
  persistUTMParams,
  clearStoredUTMParams,
  storeUTMOnProfile,
  captureAndStoreUTM,
};
