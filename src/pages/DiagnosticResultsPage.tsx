/**
 * DiagnosticResultsPage.tsx — Results page for a diagnostic.
 *
 * Route: /diagnostics/:slug/results/:resultId
 *
 * Renders the DiagnosticResults component (#1278) which loads scored
 * results from the API/localStorage and displays them with score
 * visualization, archetype, insights, and NEXUS integration.
 */

import { useParams } from 'react-router-dom';
import { DiagnosticResults } from '@/components/assessment/results/DiagnosticResults';
import { useAuthStore } from '@/stores/authStore';

export default function DiagnosticResultsPage() {
  const { slug, resultId } = useParams<{ slug: string; resultId: string }>();
  const user = useAuthStore((s) => s.user);

  if (!slug || !resultId) return null;

  return (
    <DiagnosticResults
      slug={slug}
      resultId={resultId}
      userId={user?.id ?? null}
    />
  );
}
