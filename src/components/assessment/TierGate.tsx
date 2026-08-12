/**
 * TierGate.tsx — Tier-based access control component for diagnostics.
 *
 * #1340: ALL tier gating logic uses tier_key (canonical ID), never display
 * names. This component checks whether a user can access a diagnostic and
 * either renders the children (accessible) or a locked state (inaccessible).
 *
 * Locked state shows:
 *   - Value preview of the diagnostic
 *   - Tier-appropriate upgrade CTA copy
 *   - "Unlock this assessment" headline
 *
 * Anonymous flow:
 *   - Executive Introduction tier diagnostics (PRISM + SPARK) can be taken
 *     without login. The gate renders children even for anonymous users.
 *   - Higher-tier diagnostics show locked state for anonymous users.
 */

import React from 'react';
import {
  canAccessDiagnostic,
  getLockedCTA,
  isAnonymousAllowed,
  tierDisplayName,
  DIAGNOSTIC_TIER_REQUIREMENT,
  type DiagnosticSlug,
} from '@/config/tierConfig';
import { getDiagnostic } from '@/data/diagnostics';
import { INK, OFF, G200, G300, G400, G600, WHITE, monoStyle, containerStyle, makeBtnPrimary, ctaCompressHandlers } from '@/components/assessment/landing/shared';

export interface TierGateProps {
  /** Diagnostic slug: 'prism', 'spark', 'forge', 'bridge', 'mosaic', 'drive' */
  slug: string;
  /** User's current tier key (canonical or legacy) */
  userTier: string | null | undefined;
  /** Content to render if access is granted */
  children: React.ReactNode;
}

export function TierGate({ slug, userTier, children }: TierGateProps) {
  const def = getDiagnostic(slug);
  if (!def) {
    return (
      <div style={{ ...containerStyle, padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 28, color: INK }}>
          Diagnostic not found
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: G600, marginTop: 12 }}>
          The diagnostic "{slug}" does not exist in the catalog.
        </p>
      </div>
    );
  }

  const anonymousAllowed = isAnonymousAllowed(slug);
  const hasAccess = canAccessDiagnostic(userTier, slug);

  // Access granted (or anonymous allowed)
  if (hasAccess || anonymousAllowed) {
    return <>{children}</>;
  }

  // Locked state
  const cta = getLockedCTA(slug, userTier);
  const accent = def.meta.accent_color;
  const requiredTier = DIAGNOSTIC_TIER_REQUIREMENT[slug as DiagnosticSlug];

  return (
    <div style={{ background: OFF }}>
      <div style={{ ...containerStyle, padding: '80px 32px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          {/* Diagnostic preview */}
          <div style={{ ...monoStyle, color: accent, marginBottom: 16 }}>
            {def.meta.title} — {def.meta.subtitle}
          </div>

          <h1 style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: 36,
            color: INK,
            marginBottom: 16,
          }}>
            {cta.headline}
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 16,
            color: G600,
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            {cta.body}
          </p>

          {/* Value preview — dimension list */}
          <div style={{
            background: WHITE,
            border: `1px solid ${G200}`,
            padding: 32,
            marginBottom: 32,
            textAlign: 'left',
          }}>
            <div style={{ ...monoStyle, color: G400, marginBottom: 16 }}>
              WHAT YOU'LL MEASURE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {def.dimensions.map((dim) => (
                <div key={dim.key}>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: INK,
                  }}>
                    {dim.name}
                  </div>
                  <div style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                    color: G600,
                    marginTop: 4,
                  }}>
                    {dim.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA button */}
          <a
            href="/pricing"
            style={makeBtnPrimary(accent)}
            {...ctaCompressHandlers}
          >
            {cta.button}
          </a>

          {/* Tier requirement note */}
          <div style={{
            ...monoStyle,
            color: G400,
            marginTop: 24,
          }}>
            REQUIRES {tierDisplayName(requiredTier).toUpperCase()} TIER OR ABOVE
          </div>
        </div>
      </div>
    </div>
  );
}
