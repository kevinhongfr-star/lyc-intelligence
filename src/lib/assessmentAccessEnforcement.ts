/**
 * lib/assessmentAccessEnforcement.ts — #94/#1344 server-side middleware.
 *
 * Use from any API route (or server-side component) to enforce the same
 * feature matrix that useAssessmentAccess() exposes on the client. This
 * MUST be called server-side for every mutating action (start, share,
 * export, nexus_discuss) because client-side checks can be disabled by
 * crafty users.
 *
 * Pattern (Vercel-style serverless route handler):
 *
 *   import { requireTieredAction } from '@/lib/assessmentAccessEnforcement';
 *   export default async function handler(req, res) {
 *     const verdict = await requireTieredAction(req, {
 *       action: 'assessment/export-pdf',
 *       diagnosticSlug: 'prism',
 *     });
 *     if (!verdict.allowed) return res.status(verdict.httpStatus).json(verdict);
 *     // … proceed with export
 *   }
 *
 * For "consolidated routes" (per #87 assessment API, per Vercel Hobby 12 fn
 * cap), pass the `action` param from route [action].ts to decide which
 * gate to run.
 */

import { normalizeTier, tierMeets, type TierKey, DIAGNOSTIC_TIER_REQUIREMENT } from '@/config/tierConfig';
import { computeAssessmentAccess, DEFAULT_FEATURE_FLAGS, type FeatureFlagState } from '@/hooks/useAssessmentAccess';
import type { DiagnosticSlug } from '@/types/assessment';

export type GuardedAction =
  | 'assessment/run'
  | 'assessment/share'
  | 'assessment/export-pdf'
  | 'assessment/view-full'
  | 'nexus/discuss-assessment'
  | 'ai/generate-insight';

export interface EnforcementOptions {
  /** Incoming request — used to extract bearer → Supabase user → profile tier. */
  req?: { headers?: Record<string, string | string[] | undefined>; cookies?: any };
  /** For unit tests or routes that already resolved the viewer. */
  viewer?: {
    user_id?: string | null;
    role?: 'anonymous' | 'user' | 'admin';
    tier_key?: TierKey | string | null;
  };
  action: GuardedAction;
  diagnosticSlug?: DiagnosticSlug;
  /** Minimum tier for this specific call (overrides the diagnostic default). */
  requiredTierOverride?: TierKey;
  /** True if the call came in via a share link (limits to read-only). */
  viaShareToken?: boolean;
  featureFlags?: Partial<FeatureFlagState>;
}

export interface EnforcementResultAllowed {
  allowed: true;
  viewerTier: TierKey;
  viewerRole: 'anonymous' | 'user' | 'admin';
  requiredTier: TierKey;
  /** True if share-viewer (always limited) */
  viaShareToken: boolean;
  /** Permitted sub-capabilities for downstream logic. */
  capabilities: {
    canExportPdf: boolean;
    canAccessNexus: boolean;
    maxDimensions: number;
  };
}

export interface EnforcementResultDenied {
  allowed: false;
  httpStatus: 401 | 403;
  code:
    | 'AUTH_REQUIRED'
    | 'TIER_INSUFFICIENT'
    | 'ADMIN_REQUIRED'
    | 'SHARE_VIEWER_ONLY'
    | 'FEATURE_DISABLED';
  message: string;
  viewerTier?: TierKey;
  requiredTier?: TierKey;
  upgradeTier?: TierKey | null;
}

export type EnforcementResult = EnforcementResultAllowed | EnforcementResultDenied;

/**
 * Per-action minimum tier. "billing_enabled=false" still allows these gates
 * to compute; they just control whether the client surfaces billing UI.
 */
const ACTION_REQUIRED_TIER: Partial<Record<GuardedAction, TierKey>> = {
  'assessment/export-pdf':         'professional',
  'nexus/discuss-assessment':     'professional',
  'ai/generate-insight':          'professional',
};

/** Which actions require authentication (non-anonymous)? */
const ACTION_REQUIRES_AUTH: Record<GuardedAction, boolean> = {
  'assessment/run':                true,
  'assessment/share':              true,
  'assessment/export-pdf':         true,
  'assessment/view-full':          false,
  'nexus/discuss-assessment':      true,
  'ai/generate-insight':           true,
};

/** Share-link viewers can only do read-level actions. */
const SHARE_TOKEN_BLOCKED_ACTIONS: GuardedAction[] = [
  'assessment/share',
  'assessment/export-pdf',
  'assessment/run',
  'ai/generate-insight',
  'nexus/discuss-assessment',
];

/**
 * Enforce an assessment-gated action on the server.
 *
 * NOTE: This file deliberately avoids importing Supabase directly so the
 * same predicate works on both Vercel routes and consolidated edge
 * functions. Callers pass a pre-resolved `viewer` object (preferred) OR a
 * request with cookies from which we could eventually resolve a viewer.
 */
export function requireTieredAction(opts: EnforcementOptions): EnforcementResult {
  const viewerRole: EnforcementResultAllowed['viewerRole'] =
    opts.viewer?.role ?? (opts.viewer?.user_id ? 'user' : 'anonymous');

  const rawTier = opts.viewer?.tier_key ?? 'executive_introduction';
  const viewerTier: TierKey = normalizeTier(rawTier) ?? 'executive_introduction';

  const requiredFromAction = ACTION_REQUIRED_TIER[opts.action];
  const requiredFromDiagnostic = opts.diagnosticSlug
    ? DIAGNOSTIC_TIER_REQUIREMENT[opts.diagnosticSlug]
    : 'executive_introduction';
  const requiredTier: TierKey = (() => {
    if (opts.requiredTierOverride) return opts.requiredTierOverride;
    if (requiredFromAction && tierMeets(requiredFromAction, requiredFromDiagnostic)) return requiredFromAction;
    return requiredFromDiagnostic;
  })();

  const verdict = computeAssessmentAccess({
    viewerTierRaw: viewerTier,
    viewerRole,
    diagnosticSlug: opts.diagnosticSlug,
    requiredTierOverride: requiredTier,
    viaShareToken: opts.viaShareToken,
    featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...(opts.featureFlags ?? {}) },
  });

  // 1. Share-viewer restriction (strictest check)
  if (opts.viaShareToken && SHARE_TOKEN_BLOCKED_ACTIONS.includes(opts.action)) {
    return {
      allowed: false,
      httpStatus: 403,
      code: 'SHARE_VIEWER_ONLY',
      message: 'Share links are view-only. Sign in to export, share, or discuss with NEXUS.',
      viewerTier,
      requiredTier,
    };
  }

  // 2. Authentication requirement (viewer must be logged in)
  if (ACTION_REQUIRES_AUTH[opts.action] && viewerRole === 'anonymous') {
    return {
      allowed: false,
      httpStatus: 401,
      code: 'AUTH_REQUIRED',
      message: 'Sign in to continue.',
      requiredTier,
    };
  }

  // 3. Admin bypass — admin always allowed
  if (verdict.isAdmin) {
    return {
      allowed: true,
      viewerTier,
      viewerRole: 'admin',
      requiredTier,
      viaShareToken: Boolean(opts.viaShareToken),
      capabilities: {
        canExportPdf: true,
        canAccessNexus: true,
        maxDimensions: 6,
      },
    };
  }

  // 4. Tier-meets check
  if (!verdict.canViewFullReport) {
    return {
      allowed: false,
      httpStatus: 403,
      code: 'TIER_INSUFFICIENT',
      message: `Upgrade to ${verdict.upgradeDisplayTier ?? 'Professional'} to access ${opts.action}.`,
      viewerTier,
      requiredTier,
      upgradeTier: verdict.upgradeTier,
    };
  }

  // 5. Action-level capability gating (e.g., EI user trying PDF despite matching requiredTier
  //    from diagnostic default — professional-level action still blocked)
  if (opts.action === 'assessment/export-pdf' && !verdict.canExportPdf) {
    return {
      allowed: false,
      httpStatus: 403,
      code: 'FEATURE_DISABLED',
      message: 'PDF export requires Professional tier or higher.',
      viewerTier,
      requiredTier,
      upgradeTier: verdict.upgradeTier,
    };
  }
  if ((opts.action === 'nexus/discuss-assessment' || opts.action === 'ai/generate-insight') &&
      !verdict.canAccessNexus) {
    return {
      allowed: false,
      httpStatus: 403,
      code: 'FEATURE_DISABLED',
      message: 'NEXUS integration requires Professional tier or higher.',
      viewerTier,
      requiredTier,
      upgradeTier: verdict.upgradeTier,
    };
  }

  // 6. All checks passed.
  return {
    allowed: true,
    viewerTier,
    viewerRole,
    requiredTier,
    viaShareToken: Boolean(opts.viaShareToken),
    capabilities: {
      canExportPdf: verdict.canExportPdf,
      canAccessNexus: verdict.canAccessNexus,
      maxDimensions: verdict.maxDimensions,
    },
  };
}

/**
 * For the consolidated route (api/assessments/[action].ts per Phase 9 Vercel
 * Hobby plan), map a URL action param → the GuardedAction enum. Unknown
 * params return null so the caller can 404.
 */
export function routeActionToGuardedAction(param: unknown): GuardedAction | null {
  switch (param) {
    case 'catalog': return 'assessment/view-full';
    case 'progress': return 'assessment/view-full';
    case 'run': return 'assessment/run';
    case 'share': return 'assessment/share';
    default: return null;
  }
}
