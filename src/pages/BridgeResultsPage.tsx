import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as BRIDGE_ARCHETYPES } from '@/services/scoring/bridge';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const INDIGO = '#1D4ED8';
const SESSION_KEY = 'assessment_answers_BRIDGE_latest';

const toMatched = (a: (typeof BRIDGE_ARCHETYPES)[number], score: number): MatchedArchetype => ({
  name: a.name,
  description: a.failure_pattern || '',
  weakest_dimension: a.weakest_dimension,
  three_fires_correlation: a.three_fires_correlation,
  failure_pattern: a.failure_pattern,
  match_score: score,
});

function findWeakestDimId(pcts: Record<string, number>): { id: string; pct: number } {
  const entries = Object.entries(pcts);
  let weakest = entries[0];
  for (const e of entries) {
    if (e[1] < weakest[1]) weakest = e;
  }
  return { id: weakest[0], pct: weakest[1] };
}

function matchBridgeArchetype(
  pcts: Record<string, number>,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  const weakest = findWeakestDimId(pcts);
  const allDimsAbove50 = Object.values(pcts).every((p) => p >= 50);
  const culturalFluencyPct = pcts['D6'] ?? 0;

  let matched: MatchedArchetype;

  // Cultural Operator: no dim <50 AND Cultural Fluency >70
  if (allDimsAbove50 && culturalFluencyPct > 70) {
    const cfg = BRIDGE_ARCHETYPES.find((a) => a.name === 'The Cultural Operator');
    matched = toMatched(cfg || BRIDGE_ARCHETYPES[5], 95);
  } else {
    // Otherwise match by weakest dimension
    const byWeakest: Record<string, string> = {
      D1: 'The Navigator',
      D2: 'The Envoy',
      D3: 'The Chameleon',
      D4: 'The Anchor',
      D5: 'The Sprinter',
      D6: 'The Cultural Operator',
    };
    const name = byWeakest[weakest.id] || 'The Anchor';
    const cfg = BRIDGE_ARCHETYPES.find((a) => a.name === name);
    const baseScore = 88 - Math.max(0, 50 - weakest.pct);
    matched = toMatched(cfg || BRIDGE_ARCHETYPES[3], baseScore);
  }

  // Ranked list
  const ranked: MatchedArchetype[] = BRIDGE_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.name === matched.name) {
      score = matched.match_score;
    } else {
      if (a.weakest_dim_id && weakest.id === a.weakest_dim_id) score += 25;
      if (allDimsAbove50 && a.name === 'The Cultural Operator') score += 20;
    }
    return toMatched(a, score);
  }).sort((a, b) => b.match_score - a.match_score);

  return { archetype: matched, ranked };
}

function LoadingScreen() {
  return (
    <div style={{
      background: DS.bgAlt, minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: DS.bodyFont,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, border: `2px solid ${GRAY_300}`,
          borderTopColor: INDIGO,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your BRIDGE results…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      background: DS.bgAlt, minHeight: '100vh', color: INK,
      fontFamily: DS.bodyFont, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '48px 32px',
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          fontFamily: DS.monoFont, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: INDIGO, fontSize: 10, marginBottom: 16,
        }}>
          BRIDGE · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your BRIDGE results will appear here once you complete the assessment. It takes about twelve minutes.
        </p>
        <Link
          to="/assessment/bridge/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: INDIGO, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin BRIDGE assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function BridgeResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_BRIDGE_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;
        const out = await scoreAssessment('BRIDGE', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        const { archetype, ranked } = matchBridgeArchetype(pcts);

        const result: ScoreResult = {
          ...out.result,
          archetype,
          archetypes_ranked: ranked,
        };

        if (!cancelled) setState({ loading: false, result, hasAnswers: true });
      } catch {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleDownloadPDF = () => {
  };

  if (state.loading) return <LoadingScreen />;
  if (!state.hasAnswers || !state.result) return <EmptyState />;

  return (
    <div style={{
      background: DS.bgAlt, minHeight: '100vh', color: INK,
      fontFamily: DS.bodyFont, padding: '48px 32px 80px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <ResultsPanel
          assessmentCode="BRIDGE"
          scoreResult={state.result}
          accentColor={INDIGO}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/bridge/take"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'transparent',
              border: `1px solid ${GRAY_300}`, color: INK,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            <RotateCcw style={{ width: 16, height: 16 }} /> Retake assessment
          </Link>
          <Link
            to="/assessment/bridge"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to BRIDGE overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BridgeResultsPage;
