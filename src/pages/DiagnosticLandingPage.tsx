/**
 * DiagnosticLandingPage.tsx — Landing page for a diagnostic.
 *
 * Route: /diagnostics/:slug
 *
 * Uses the existing shared AssessmentLanding component system (#1276)
 * with config generated from the diagnostic JSON definition (#1342).
 * Wrapped in TierGate for tier-based access control (#1340/#1280).
 */

import { useParams } from 'react-router-dom';
import { AssessmentLanding } from '@/components/assessment/landing';
import { buildLandingConfig } from '@/services/diagnosticLandingConfig';
import { getDiagnostic } from '@/data/diagnostics';
import { TierGate } from '@/components/assessment/TierGate';
import { useAuthStore } from '@/stores/authStore';

export default function DiagnosticLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const profile = useAuthStore((s) => s.profile);
  const userTier = profile?.tier ?? null;

  if (!slug) return null;

  const def = getDiagnostic(slug);
  if (!def) {
    return (
      <div style={{ padding: '120px 32px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Crimson Pro', serif", fontSize: 32 }}>
          Diagnostic not found
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#6b7280', marginTop: 12 }}>
          The diagnostic "{slug}" does not exist. <a href="/assessment" style={{ color: '#C108AB' }}>Browse all diagnostics</a>
        </p>
      </div>
    );
  }

  const config = buildLandingConfig(def, userTier);

  return (
    <TierGate slug={slug} userTier={userTier}>
      <AssessmentLanding config={config} />
    </TierGate>
  );
}
