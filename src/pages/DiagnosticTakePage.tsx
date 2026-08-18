/**
 * DiagnosticTakePage.tsx — Assessment flow page.
 *
 * Route: /diagnostics/:slug/take
 *
 * Renders the canonical DiagnosticEngine component (#1277) which handles
 * branching-native question flow, progress tracking, persistence, and
 * scoring.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { DiagnosticEngine } from '@/components/assessment/engine';
import { useAuthStore } from '@/stores/authStore';
import { getDiagnostic } from '@/data/diagnostics';
import { TierGate } from '@/components/assessment/TierGate';
import { DS } from '@/tokens';

export default function DiagnosticTakePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const userTier = profile?.tier ?? null;

  if (!slug) return null;

  const def = getDiagnostic(slug);
  if (!def) {
    return (
      <div style={{ padding: '120px 32px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: DS.headingFont, fontSize: 32 }}>
          Diagnostic not found
        </h1>
        <p style={{ fontFamily: DS.bodyFont, color: DS.muted, marginTop: 12 }}>
          The diagnostic "{slug}" does not exist. <a href="/assessment" style={{ color: DS.accent }}>Browse all diagnostics</a>
        </p>
      </div>
    );
  }

  return (
    <TierGate slug={slug} userTier={userTier}>
      <DiagnosticEngine
        slug={slug}
        userId={user?.id ?? null}
        accent={def.meta.accent_color}
        onComplete={(resultId) => {
          navigate(`/diagnostics/${slug}/results/${resultId}`);
        }}
      />
    </TierGate>
  );
}
