import React from 'react';
import {
  canAccessDiagnostic,
  isAnonymousAllowed,
  tierDisplayName,
  DIAGNOSTIC_TIER_REQUIREMENT,
  type DiagnosticSlug,
} from '@/config/tierConfig';
import { getDiagnostic } from '@/data/diagnostics';
import { canTakeAssessment } from '@/lib/assessmentAccessEnforcement';
import { useAuthStore } from '@/stores/authStore';
// W3.1 Fix 3: share the canonical system serif stack — NO Crimson Pro, no custom font loading.
import { DS as GLOBAL_DS, ACCENT } from '@/tokens';

const DS = {
  headingFont: GLOBAL_DS.headingFont,
  bodyFont: GLOBAL_DS.bodyFont,
  monoFont: GLOBAL_DS.monoFont,
  accent: ACCENT,
  accentSoft: `${ACCENT}20`,
  accentBorder: `${ACCENT}40`,
  bg: '#FAFAF8',
  card: '#FFFFFF',
  muted: '#8A8A8A',
  text: '#0A0A0A',
  textSecondary: '#555555',
  border: '#E8E8E5',
};

export interface TierGateProps {
  slug: string;
  userTier?: string | null | undefined;
  children: React.ReactNode;
}

export function TierGate({ slug, userTier: userTierProp, children }: TierGateProps) {
  const { profile } = useAuthStore();
  const userTier = userTierProp ?? profile?.tier ?? null;
  const def = getDiagnostic(slug);

  if (!def) {
    return (
      <div style={{ background: DS.bg, padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: DS.headingFont, fontSize: 28, color: DS.text }}>
          Diagnostic not found
        </h2>
        <p style={{ fontFamily: DS.bodyFont, color: DS.textSecondary, marginTop: 12 }}>
          The diagnostic &quot;{slug}&quot; does not exist in the catalog.
        </p>
      </div>
    );
  }

  const assessmentCode = (slug || '').toUpperCase();
  const tierVerdict = canTakeAssessment(userTier, assessmentCode);
  const anonymousAllowed = isAnonymousAllowed(slug);
  const legacyAccess = canAccessDiagnostic(userTier, slug);
  const hasAccess = tierVerdict.allowed || legacyAccess || anonymousAllowed;

  if (hasAccess) {
    return <>{children}</>;
  }

  const accent = DS.accent;
  const requiredTier = DIAGNOSTIC_TIER_REQUIREMENT[slug as DiagnosticSlug];

  return (
    <div style={{ background: DS.bg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: 1.5,
            color: accent,
            background: DS.accentSoft,
            border: `1px solid ${DS.accentBorder}`,
            padding: '6px 14px',
            borderRadius: 0,
            marginBottom: 24,
          }}>
            {def.meta.title.toUpperCase()} — LOCKED
          </div>

          <h1 style={{
            fontFamily: DS.headingFont,
            fontSize: 40,
            lineHeight: 1.15,
            color: DS.text,
            marginBottom: 16,
            fontWeight: 500,
          }}>
            This assessment is part of the paid suite
          </h1>

          <p style={{
            fontFamily: DS.bodyFont,
            fontSize: 17,
            color: DS.textSecondary,
            lineHeight: 1.65,
            marginBottom: 36,
          }}>
            Executive Introduction covers one complimentary leadership assessment (CPI).
            Upgrade to Executive or Professional Deep-Dive for SPARK, LEAP, IMPACT,
            and the full framework catalog.
          </p>

          <div style={{
            background: DS.card,
            border: `1px solid ${DS.border}`,
            borderRadius: 0,
            padding: 28,
            marginBottom: 36,
            textAlign: 'left',
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: 1.5,
              color: DS.muted,
              marginBottom: 16,
            }}>
              WHAT YOU&apos;LL MEASURE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
              {def.dimensions.map((dim) => (
                <div key={dim.key}>
                  <div style={{
                    fontFamily: DS.bodyFont,
                    fontWeight: 600,
                    fontSize: 14,
                    color: DS.text,
                  }}>
                    {dim.name}
                  </div>
                  <div style={{
                    fontFamily: DS.bodyFont,
                    fontSize: 12,
                    color: DS.textSecondary,
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}>
                    {dim.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <a
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 28px',
                fontFamily: DS.bodyFont,
                fontSize: 15,
                fontWeight: 600,
                color: accent,
                background: 'transparent',
                border: `1.5px solid ${accent}`,
                borderRadius: 0,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DS.accentSoft;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Get Executive Introduction
            </a>

            <a
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px 28px',
                fontFamily: DS.bodyFont,
                fontSize: 15,
                fontWeight: 600,
                color: '#FFFFFF',
                background: accent,
                border: `1.5px solid ${accent}`,
                borderRadius: 0,
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Upgrade
            </a>
          </div>

          <div style={{
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: 1.5,
            color: DS.muted,
            marginTop: 28,
          }}>
            REQUIRES {tierDisplayName(requiredTier).toUpperCase()} TIER OR ABOVE
          </div>
        </div>
      </div>
    </div>
  );
}
