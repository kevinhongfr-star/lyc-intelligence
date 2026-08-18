/**
 * hooks/useAssessmentAccess.ts — #94/#1344 B2C Tier-Based Access Control
 *
 * Returns a deterministic access verdict for the current viewer relative to
 * a specific assessment result or definition. All booleans derive from a
 * single input (viewerTier + requiredTierFromContext) so the verdict is
 * stable in tests and the pipeline (no hidden Supabase reads here).
 *
 * Returned fields (per spec):
 *   canViewFullReport: boolean
 *   maxDimensions: number
 *   canExportPdf: boolean
 *   canAccessNexus: boolean
 *   upgradeTier: TierKey | null        -- null if already meets required
 *   ctaVariant: string                 -- used by #62/#1343 report templates
 *
 * The consumer is responsible for sourcing viewerTier (typically from the
 * profiles table → tier_key, normalized via normalizeTier() from tierConfig).
 * We intentionally don't load tier from Supabase inside this hook because
 * callers usually need the profile for other reasons anyway — and not doing
 * a hidden supabase read makes the hook SSR-safe for rendering (#62/#1343).
 */

import { useMemo } from 'react';
import type { DiagnosticSlug } from '@/types/assessment';
import {
  TIER_KEYS,
  TIER_META,
  type TierKey,
  tierMeets,
  normalizeTier,
  DIAGNOSTIC_TIER_REQUIREMENT,
} from '@/config/tierConfig';
import { canTakeAssessment, COMPLIMENTARY_ASSESSMENT_CODE } from '@/lib/assessmentAccessEnforcement';

export interface UseAssessmentAccessOptions {
  /** Viewer's tier (from profiles.tier_key after normalizeTier). */
  viewerTierRaw?: TierKey | string | null | undefined;
  /** Viewer role via JWT claim: anonymous | user | admin. */
  viewerRole?: 'anonymous' | 'user' | 'admin';
  /** Diagnostic being accessed — determines minimum tier. */
  diagnosticSlug?: DiagnosticSlug;
  /**
   * Override minimum required tier for this specific check.
   * Defaults to DIAGNOSTIC_TIER_REQUIREMENT[diagnosticSlug] || executive_introduction.
   */
  requiredTierOverride?: TierKey;
  /** Share token read-access: if true, treat as share-viewer (limited). */
  viaShareToken?: boolean;
  /** Feature flag overrides (for gradual rollouts, per #1344). */
  featureFlags?: Partial<FeatureFlagState>;
}

export interface FeatureFlagState {
  billing_enabled: boolean;        // #45 Stripe hidden behind flag (default false)
  pdf_export_enabled: boolean;     // Executive+ always on; EI can be trialed
  nexus_enabled: boolean;          // Executive+ always on
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagState = {
  billing_enabled: false,          // hide billing UI (#45 keys not available)
  pdf_export_enabled: true,
  nexus_enabled: true,
};

export interface AssessmentAccessVerdict {
  viewerTier: TierKey;
  viewerRole: 'anonymous' | 'user' | 'admin';
  requiredTier: TierKey;
  /** True if user meets the required tier. share_token viewers are never full. */
  canViewFullReport: boolean;
  /** 3 for EI, 6 for Professional+, 0 for anonymous */
  maxDimensions: number;
  canExportPdf: boolean;
  canAccessNexus: boolean;
  canStartAssessment: boolean;
  canShareResult: boolean;
  /** Next tier the user should upgrade to for this diagnostic, or null. */
  upgradeTier: TierKey | null;
  upgradeDisplayTier: string | null;
  /** Used by #62/#1343 templates. "executive_introduction_upgrade" | "pro_upgrade" | null. */
  ctaVariant: string | null;
  /** Is admin? Admin bypasses feature gating for visibility. */
  isAdmin: boolean;
}

/** Non-hook pure helper — same signature; callable from pages / routes. */
export function computeAssessmentAccess(
  opts: UseAssessmentAccessOptions = {},
): AssessmentAccessVerdict {
  const viewerRole: AssessmentAccessVerdict['viewerRole'] =
    opts.viewerRole && ['anonymous', 'user', 'admin'].includes(opts.viewerRole)
      ? (opts.viewerRole as AssessmentAccessVerdict['viewerRole'])
      : opts.viewerTierRaw
        ? 'user'
        : 'anonymous';

  const flags: FeatureFlagState = { ...DEFAULT_FEATURE_FLAGS, ...(opts.featureFlags ?? {}) };
  const viewerTier = normalizeTier(opts.viewerTierRaw) ?? (viewerRole === 'anonymous' ? 'executive_introduction' : 'executive_introduction');

  const requiredTier: TierKey =
    opts.requiredTierOverride ??
    (opts.diagnosticSlug ? DIAGNOSTIC_TIER_REQUIREMENT[opts.diagnosticSlug] : 'executive_introduction');

  const isAdmin = viewerRole === 'admin';
  const meetsRequired = isAdmin || tierMeets(viewerTier, requiredTier);

  // maxDimensions: 3 for Executive Introduction (complimentary), 6 for Professional+, 0 for anonymous share-viewer
  const maxDimensions = (() => {
    if (opts.viaShareToken) {
      // Share links always show what was saved in the result at time of sharing.
      return 6;
    }
    if (tierMeets(viewerTier, 'professional')) return 6;
    if (viewerTier === 'executive_introduction') return 3;
    return 3;
  })();

  const canExportPdf =
    !opts.viaShareToken && (isAdmin || (tierMeets(viewerTier, 'professional') && flags.pdf_export_enabled));

  const canAccessNexus =
    !opts.viaShareToken && (isAdmin || (tierMeets(viewerTier, 'professional') && flags.nexus_enabled));

  const canStartAssessment = (() => {
    if (opts.viaShareToken) return false;
    const codeFromSlug = opts.diagnosticSlug
      ? (opts.diagnosticSlug as string).toUpperCase()
      : COMPLIMENTARY_ASSESSMENT_CODE;
    const tierCheck = canTakeAssessment(
      viewerRole === 'anonymous' ? null : viewerTier,
      codeFromSlug,
    );
    if (tierCheck.allowed) return true;
    if (viewerRole === 'anonymous') {
      return codeFromSlug === COMPLIMENTARY_ASSESSMENT_CODE;
    }
    return tierMeets(viewerTier, 'professional');
  })();

  const canShareResult = viewerRole === 'user' || isAdmin;

  // Upgrade tier: lowest tier strictly greater than viewer that meets required.
  const upgradeTier: TierKey | null = (() => {
    if (isAdmin || meetsRequired || opts.viaShareToken) return null;
    for (const key of TIER_KEYS) {
      if (TIER_META[key].order > TIER_META[viewerTier].order && tierMeets(key, requiredTier)) {
        return key;
      }
    }
    return null;
  })();

  const ctaVariant: string | null = (() => {
    if (upgradeTier === null) return null;
    if (viewerTier === 'executive_introduction') return 'executive_introduction_upgrade';
    return `${viewerTier}_upgrade`;
  })();

  return {
    viewerTier,
    viewerRole,
    requiredTier,
    canViewFullReport: meetsRequired,
    maxDimensions,
    canExportPdf,
    canAccessNexus,
    canStartAssessment,
    canShareResult,
    upgradeTier,
    upgradeDisplayTier: upgradeTier ? TIER_META[upgradeTier].displayName : null,
    ctaVariant,
    isAdmin,
  };
}

/**
 * React hook version of computeAssessmentAccess(). Accepts the same options.
 *
 * If your auth layer returns a profile row, use like:
 *   const access = useAssessmentAccess({
 *     viewerTierRaw: profile.tier_key,
 *     viewerRole: isAdmin ? 'admin' : profile ? 'user' : 'anonymous',
 *     diagnosticSlug: params.slug,
 *   });
 */
export function useAssessmentAccess(opts: UseAssessmentAccessOptions = {}): AssessmentAccessVerdict {
  return useMemo(() => computeAssessmentAccess(opts), [
    opts.viewerTierRaw,
    opts.viewerRole,
    opts.diagnosticSlug,
    opts.requiredTierOverride,
    opts.viaShareToken,
    // Stable-stringify flags to keep useMemo reference-equality OK if caller passes fresh object.
    JSON.stringify(opts.featureFlags ?? {}),
  ]);
}

export default useAssessmentAccess;
