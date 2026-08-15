// ═══════════════════════════════════════════════════════════
// FORGE Results Page — 2×2 strengths-matrix archetype matching.
// X2-4: Reads answers from sessionStorage, scores via the Akira engine,
// then groups the 4 FORGE dimensions into 2 axes (Selling Acumen =
// D1 ALO + D2 TFA; System Leadership = D3 DA + D4 BCN), determines
// High/Low per axis (≥50 threshold), and matches 1 of 4 quadrant
// archetypes, overriding the engine archetype.
// Brand: TEAL #0D9488 accent, system serif headings, zero border radius.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as FORGE_ARCHETYPES } from '@/services/scoring/forge';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const SESSION_KEY = 'assessment_answers_FORGE_latest';
const TEAL = '#0D9488';

const REAL_ARCHETYPES = FORGE_ARCHETYPES;

// ── Axis thresholds (0–100 percent → High / Low) ──
// The midpoint between 0 and 100 is the quadrant boundary.
const AXIS_HIGH_THRESHOLD = 50;

// ── Build axis scores from 4 FORGE dimension percentages ──
// Selling Acumen axis  = mean(D1 ALO + D2 TFA)   → market-facing commercial intelligence
// System Leadership axis = mean(D3 DA + D4 BCN)  → scalability-oriented system building
function computeAxisScores(pcts: Record<string, number>): {
  sellingAcumen: number;
  systemLeadership: number;
  sellingHigh: boolean;
  systemHigh: boolean;
} {
  const d1 = pcts['D1'] ?? 0;
  const d2 = pcts['D2'] ?? 0;
  const d3 = pcts['D3'] ?? 0;
  const d4 = pcts['D4'] ?? 0;
  const sellingAcumen = (d1 + d2) / 2;
  const systemLeadership = (d3 + d4) / 2;
  return {
    sellingAcumen,
    systemLeadership,
    sellingHigh: sellingAcumen >= AXIS_HIGH_THRESHOLD,
    systemHigh: systemLeadership >= AXIS_HIGH_THRESHOLD,
  };
}

// ── Match FORGE archetype via 2×2 quadrant ──
function matchForgeArchetype(
  pcts: Record<string, number>,
  composite: number,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  const { sellingAcumen, systemLeadership, sellingHigh, systemHigh } =
    computeAxisScores(pcts);

  const toMatched = (a: (typeof REAL_ARCHETYPES)[number], score: number): MatchedArchetype => ({
    name: a.name,
    description: a.description || a.core_pattern || '',
    strengths: a.strengths,
    blind_spots: a.blind_spots,
    selling_acumen: a.selling_acumen,
    system_leadership: a.system_leadership,
    core_pattern: a.core_pattern,
    revenue_risk: a.revenue_risk,
    orientation: a.orientation,
    quadrant: a.quadrant,
    match_score: score,
  });

  const findByName = (name: string) =>
    REAL_ARCHETYPES.find((a) => a.name === name);

  let matched: MatchedArchetype | null = null;

  // Quadrant 1: High Selling Acumen AND High System Leadership → Strategic Seller
  if (sellingHigh && systemHigh) {
    const cfg = findByName('Strategic Seller');
    matched = toMatched(cfg || REAL_ARCHETYPES[2], 95);
  }
  // Quadrant 2: High Selling Acumen AND Low System Leadership
  // Disambiguate between Rainmaker (pure IC seller) and Promoted Seller (promoted leader struggling)
  // Heuristic: if System Leadership is very low (<35) AND composite overall is still decent (≥40)
  // → Rainmaker (natural seller, not trying to lead). Otherwise → Promoted Seller.
  else if (sellingHigh && !systemHigh) {
    if (systemLeadership < 35 && composite >= 40) {
      const cfg = findByName('Rainmaker');
      matched = toMatched(cfg || REAL_ARCHETYPES[0], 90);
    } else {
      const cfg = findByName('Promoted Seller');
      matched = toMatched(cfg || REAL_ARCHETYPES[3], 88);
    }
  }
  // Quadrant 3: Low Selling Acumen AND High System Leadership → System Builder
  else if (!sellingHigh && systemHigh) {
    const cfg = findByName('System Builder');
    matched = toMatched(cfg || REAL_ARCHETYPES[1], 90);
  }
  // Quadrant 4: Low Selling Acumen AND Low System Leadership → Promoted Seller
  // (default catch-all: leader who needs to build both dimensions)
  else {
    const cfg = findByName('Promoted Seller');
    matched = toMatched(cfg || REAL_ARCHETYPES[3], 80);
  }

  // Rank all 4 archetypes by fit. Matched gets highest score; others get
  // descending scores based on axis overlap with the user's quadrant.
  const ranked: MatchedArchetype[] = REAL_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.name === matched!.name) {
      score = matched!.match_score;
    } else {
      // Selling axis alignment bonus
      const aSelling = String(a.selling_acumen || '').toLowerCase();
      if (sellingHigh && aSelling.startsWith('high')) score += 25;
      if (!sellingHigh && aSelling.startsWith('low')) score += 25;
      // System axis alignment bonus
      const aSystem = String(a.system_leadership || '').toLowerCase();
      if (systemHigh && aSystem.startsWith('high')) score += 25;
      if (!systemHigh && aSystem.startsWith('low')) score += 25;
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
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your FORGE results…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Empty state — no answers found ──
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
          FORGE · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your FORGE results will appear here once you complete the complimentary assessment. It takes about twelve minutes.
        </p>
        <Link
          to="/assessment/forge/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: TEAL, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin FORGE assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function ForgeResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_FORGE_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;

        const out = await scoreAssessment('FORGE', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        const { archetype, ranked } = matchForgeArchetype(
          pcts,
          out.result.composite?.score ?? 0,
        );

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
          assessmentCode="FORGE"
          scoreResult={state.result}
          accentColor={TEAL}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/forge/take"
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
            to="/assessment/forge"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to FORGE overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgeResultsPage;
