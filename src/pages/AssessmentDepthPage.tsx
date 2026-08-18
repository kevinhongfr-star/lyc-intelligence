import React, { useMemo } from 'react';
import { SEO } from '@/components/seo/SEO';
import { AssessmentDepthPage as AssessmentDepthContent } from '@/components/assessment/AssessmentDepthPage';

export interface AssessmentDepthPageProps {
  instrumentCode?: string;
}

function readCodeFromRouter(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const last = segments[segments.length - 1];
    const fromUrl = last && last.length > 0 ? last.toUpperCase() : null;

    const params = new URLSearchParams(window.location.search);
    const fromQ = params.get('code') || params.get('instrument');
    return (fromQ && fromQ.toUpperCase()) || fromUrl;
  } catch {
    return null;
  }
}

const CANONICAL_INSTRUMENTS = new Set([
  'CPI', 'LEAP', 'PRISM', 'IMPACT', 'COACH', 'DRIVE',
  'QUEST', 'BRIDGE', 'MOSAIC', 'SPARK', 'FORGE',
]);

export function AssessmentDepthPage({ instrumentCode }: AssessmentDepthPageProps) {
  const resolvedCode = useMemo(() => {
    const raw = instrumentCode ?? readCodeFromRouter() ?? 'LEAP';
    return CANONICAL_INSTRUMENTS.has(raw) ? raw : 'LEAP';
  }, [instrumentCode]);

  return (
    <>
      <SEO
        title={`${resolvedCode} — Diagnostic Depth | LYC Intelligence`}
        description={`${resolvedCode} executive diagnostic — detailed depth page covering dimensions, archetypes, score bands, and recommended debrief tier. Executive Intelligence by LYC.`}
        path={`/diagnostics/${resolvedCode.toLowerCase()}`}
        type="product"
      />
      <AssessmentDepthContent instrumentCode={resolvedCode} />
    </>
  );
}

export default AssessmentDepthPage;
