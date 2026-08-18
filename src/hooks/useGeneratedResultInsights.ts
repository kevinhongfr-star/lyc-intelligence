/**
 * hooks/useGeneratedResultInsights.ts — #96/#1345 Batch 4: auto-generate
 * AI insights on result pages when the shared result data arrives empty.
 *
 * Caller (results UI) does:
 *   const { data: enriched, loading, error, regenerate } = useGeneratedResultInsights({
 *     data,                  // AssessmentResultData (possibly with aiInsights = null)
 *     viewer: { user_id, tier, email, name },
 *     preferTemplate: false, // pass true for offline preview
 *   });
 *
 * Returns a new data object reference with aiInsights filled when ready.
 * Component should render loading pill while loading=true and fallback to
 * data.aiInsights = undefined / level.description as placeholder default.
 *
 * Also exposes `regenerate` for the "Regenerate insights" manual button
 * on result pages (manual trigger kind=ai:generate_insight).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AssessmentResultData } from '@/types/reportTemplates';
import type { TierKey } from '@/config/tierConfig';
import { TIER_META } from '@/config/tierConfig';
import {
  runAssessmentInsightPipeline,
  type PipelineInput,
} from '@/services/aiContentEngine';
import type { InsightGenerationIntent } from '@/services/aiPromptLibrary';

export interface UseInsightsViewer {
  user_id: string | null;
  tier: TierKey | null;
  email?: string | null;
  name?: string | null;
}

export interface UseGeneratedResultInsightsOptions {
  data: AssessmentResultData | null;
  viewer: UseInsightsViewer;
  preferTemplate?: boolean;
  initialIntent?: InsightGenerationIntent;
}

export interface UseGeneratedResultInsightsResult {
  data: AssessmentResultData | null;
  loading: boolean;
  error: string | null;
  regenerate: (intentOverride?: Partial<InsightGenerationIntent>) => void;
  /** miles debited on last successful generation (for UI badges). */
  last_miles_debited: 0 | 1 | 3;
}

function hasNoInsights(d: AssessmentResultData | null): boolean {
  if (!d?.aiInsights) return true;
  const s = d.aiInsights.summary;
  // If the summary placeholder is literally the default level description,
  // we treat it as missing (the pipeline will regenerate proper AI-written one).
  if (!s || s.length < 40) return true;
  if (!d.aiInsights.strengths?.length) return true;
  return false;
}

function viewerAllowsGeneration(v: UseInsightsViewer): boolean {
  if (!v.user_id || !v.tier) return false;
  const meta = TIER_META[v.tier];
  return Boolean(meta?.privileges.aiInsights === 'full' || meta?.privileges.aiInsights === 'summary_only');
}

export function useGeneratedResultInsights(
  opts: UseGeneratedResultInsightsOptions,
): UseGeneratedResultInsightsResult {
  const { data, viewer, preferTemplate, initialIntent } = opts;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<AssessmentResultData | null>(null);
  const [lastMiles, setLastMiles] = useState<0 | 1 | 3>(0);
  const seqRef = useRef(0);

  const run = useCallback(
    async (intent?: Partial<InsightGenerationIntent>) => {
      if (!data || !viewerAllowsGeneration(viewer)) return;
      if (!viewer.user_id || !viewer.tier) return;

      const mySeq = ++seqRef.current;
      setLoading(true);
      setError(null);
      try {
        const baseIntent: InsightGenerationIntent = initialIntent ?? {
          highLevelIntent: 'Generate a complete assessment result insight package.',
          requestedSections: {
            summary: true,
            strengths: true,
            growthAreas: true,
            nextSteps: true,
            dimensionInsights: TIER_META[viewer.tier!]?.privileges.aiInsights === 'full',
            archetypeNarrative: TIER_META[viewer.tier!]?.privileges.aiInsights === 'full',
          },
          tone: 'executive_brief',
        };
        const merged: InsightGenerationIntent = { ...baseIntent, ...intent };
        const pipelineInput: PipelineInput = {
          user: {
            user_id: viewer.user_id,
            tier: viewer.tier,
            email: viewer.email ?? null,
            name: viewer.name ?? null,
          },
          data: {
            definition: data.definition,
            result: data.result,
            dimensions: data.dimensions,
            archetype: data.archetype,
          },
          intent: merged,
          preferTemplate,
        };
        const res = await runAssessmentInsightPipeline(pipelineInput);
        if (mySeq !== seqRef.current) return; // stale
        const aiInsights = {
          summary: res.bundle.summary.content,
          strengths: res.bundle.strengths.map((s) => s.content),
          growthAreas: res.bundle.growth_areas.map((g) => g.content),
          nextSteps: res.bundle.next_steps.map((n) => n.content),
          dimensionInsights: res.bundle.dimension_insights
            ? Object.fromEntries(Object.entries(res.bundle.dimension_insights).map(([k, v]) => [k, v.content]))
            : undefined,
          archetypeNarrative: res.bundle.archetype_narrative?.content,
          generated_at: res.bundle._meta.generated_at,
          brand_pass: res.bundle._meta.passes_brand_guard,
        };
        setEnriched({ ...data, aiInsights });
        setLastMiles(res.metrics.miles_debited);
      } catch (e: any) {
        if (mySeq !== seqRef.current) return;
        setError(e?.message ?? 'Insights generation failed.');
      } finally {
        if (mySeq === seqRef.current) setLoading(false);
      }
    },
    [data, viewer, preferTemplate, initialIntent],
  );

  useEffect(() => {
    setEnriched(null); // reset on data change
    if (!data) return;
    if (!hasNoInsights(data)) {
      setEnriched(data);
      return;
    }
    if (!viewerAllowsGeneration(viewer)) return;
    // Fire once.
    void run();
  }, [data, viewer.user_id, viewer.tier]);

  const regenerate = useCallback(
    (intentOverride?: Partial<InsightGenerationIntent>) => {
      void run(intentOverride);
    },
    [run],
  );

  const outData = useMemo<AssessmentResultData | null>(() => enriched ?? data, [enriched, data]);
  return {
    data: outData,
    loading,
    error,
    regenerate,
    last_miles_debited: lastMiles,
  };
}

export default useGeneratedResultInsights;
