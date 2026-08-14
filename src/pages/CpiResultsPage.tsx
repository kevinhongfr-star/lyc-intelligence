// ═══════════════════════════════════════════════════════════
// CPI Results Page — Career Positioning Index (flagship).
// X2-1: Reads answers from sessionStorage, scores via the Akira engine,
// then matches one of 6 archetypes based on the dominant dimension.
// 'Balanced Collaborative' is matched when no single dimension
// dominates (top spread below threshold). Self-Awareness Quotient
// (D6) is a meta-dimension that modulates interpretation but does
// not drive archetype matching.
// Brand: TEAL accent, system serif headings, zero border radius.
// Multi-rater / teams version is noted as a separate B2B offering.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as CPI_ARCHETYPES } from '@/services/scoring/cpi';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { TEAL, DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const SESSION_KEY = 'assessment_answers_CPI_latest';

// Threshold for "no single dimension dominates" → Balanced Collaborative.
// If the spread between the top dimension and the second is below this,
// the user is matched to the Balanced Collaborative archetype.
const BALANCED_SPREAD_THRESHOLD = 8;

// ── Match archetype: top-scoring operational dimension → archetype ──
// D6 (Self-Awareness Quotient) is excluded from archetype matching —
// it's a meta-dimension that modulates interpretation, not positioning.
function matchCpiArchetype(
  pcts: Record<string, number>,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  // Operational dimensions eligible for archetype matching (exclude D6 meta).
  const operationalDims = ['D1', 'D2', 'D3', 'D4', 'D5'];
  const sorted = operationalDims
    .map((id) => ({ id, pct: pcts[id] ?? 0 }))
    .sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const second = sorted[1];
  const spread = top.pct - second.pct;

  // Helper: build a MatchedArchetype from a config archetype entry.
  const toMatched = (
    a: (typeof CPI_ARCHETYPES)[number],
    score: number,
  ): MatchedArchetype => ({
    id: a.id,
    name: a.name,
    description: a.description || '',
    tagline: a.tagline,
    strengths: a.strengths,
    growth_areas: a.growth_areas,
    primary_dim: a.primary_dim,
    match_score: score,
  });

  let matched: MatchedArchetype;

  // Balanced Collaborative: no single operational dimension dominates.
  if (spread < BALANCED_SPREAD_THRESHOLD) {
    const balanced = CPI_ARCHETYPES.find((a) => a.name === 'Balanced Collaborative');
    matched = toMatched(balanced || CPI_ARCHETYPES[5], 88);
  } else {
    // Match by top dimension's primary_dim field.
    const byPrimary = CPI_ARCHETYPES.find((a) => a.primary_dim === top.id);
    matched = toMatched(byPrimary || CPI_ARCHETYPES[0], 92);
  }

  // Rank all 6 archetypes by fit.
  const ranked: MatchedArchetype[] = CPI_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.name === matched.name) {
      score = matched.match_score;
    } else if (a.primary_dim === top.id) {
      score = 70;
    } else if (a.primary_dim === second.id) {
      score = 55;
    } else if (a.primary_dim === null && spread < BALANCED_SPREAD_THRESHOLD + 6) {
      // Balanced Collaborative is a near-match if the profile is reasonably flat.
      score = 60;
    } else {
      // Distance from the user's top dimension's score for this archetype's primary.
      const archPct = a.primary_dim ? (pcts[a.primary_dim] ?? 0) : 50;
      score = 30 + Math.round(Math.max(0, archPct - 30) * 0.3);
    }
    return toMatched(a, score);
  }).sort((a, b) => b.match_score - a.match_score);

  return { archetype: matched, ranked };
}

// ── Loading state ──────────────────────────────────────────────────
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
          borderTopColor: TEAL,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your CPI results…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Empty state — no answers found (direct visit / cleared storage) ──
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
          letterSpacing: '0.08em', color: TEAL, fontSize: 10, marginBottom: 16,
        }}>
          CPI · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your CPI results will appear here once you complete the assessment. The Executive Introduction tier includes one complimentary CPI baseline — about fifteen minutes.
        </p>
        <Link
          to="/assessment/cpi/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: TEAL, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin CPI assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function CpiResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_CPI_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;

        // Score all 30 Likert questions via the Akira engine.
        const out = await scoreAssessment('CPI', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        // Build a percentage map { D1: pct, D2: pct, ... } for archetype logic.
        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        // Match archetype via CPI's top-dimension logic.
        const { archetype, ranked } = matchCpiArchetype(pcts);

        // Override the engine's archetype with the CPI-aware match.
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
    // PDF export is X2-5 / Y1 territory. No-op stub keeps ResultsPanel contract.
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
          assessmentCode="CPI"
          scoreResult={state.result}
          accentColor={TEAL}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        {/* B2B upsell note — multi-rater / teams is a separate offering. */}
        <div style={{
          marginTop: 32, padding: '20px 24px',
          background: 'rgba(0, 137, 123, 0.06)',
          borderLeft: `3px solid ${TEAL}`,
        }}>
          <div style={{
            fontFamily: DS.monoFont, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: TEAL, fontSize: 10, marginBottom: 8,
          }}>
            Also available — CPI for Teams
          </div>
          <p style={{
            fontSize: 14, color: GRAY_600, lineHeight: 1.6, marginBottom: 12,
          }}>
            This is the single-rater self-assessment layer of CPI. The full multi-rater 360° version — with peer, manager, and direct-report feedback layers, plus consultant debrief — is available as a separate B2B offering for teams and organisations.
          </p>
          <Link
            to="/assessment/cpi"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: TEAL, textDecoration: 'none',
              fontWeight: 600, fontSize: 13,
            }}
          >
            Learn about CPI for Teams <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
        {/* Retake + landing links */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/cpi/take"
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
            to="/assessment/cpi"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to CPI overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CpiResultsPage;
