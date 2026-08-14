// ═══════════════════════════════════════════════════════════
// IMPACT Results Page — board-effectiveness archetype matching.
// X2-4: Reads answers from sessionStorage, scores via the Akira engine,
// then determines Impact Orientation (Axis 1) and Mandate Strength Band
// (Axis 2) to match one of 8 board archetypes. APAC Mandate Credibility
// (D5) is carried as an APAC modifier on the matched archetype.
// Brand: FOREST_GREEN accent, system serif headings, zero border radius.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as IMPACT_ARCHETYPES } from '@/services/scoring/impact';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { FOREST_GREEN, DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const SESSION_KEY = 'assessment_answers_IMPACT_latest';

// ── Filter the 8 real archetypes (exclude Axis 1 / Axis 2 framework entries) ──
// akira_source lists 10 entries in archetypes: 8 archetypes + 2 framework axes.
// The 2 axes ("Axis 1", "Axis 2") are modulators, not archetypes — exclude.
const REAL_ARCHETYPES = IMPACT_ARCHETYPES.filter(
  (a) => !String(a.name).startsWith('Axis'),
);

// ── Mandate Strength Band (Axis 2): composite → band ──
function compositeToMandateBand(composite: number): 'High' | 'Building' | 'Fragile' {
  if (composite >= 70) return 'High';
  if (composite >= 40) return 'Building';
  return 'Fragile';
}

// ── Impact Orientation (Axis 1): dimension percentages → orientation ──
// D1=Strategy, D2=Governance, D3=Relationship, D4=Legacy, D5=APAC (modifier only).
// Returns top dimension + second dimension (for "Governance + Strategy dominant" etc.)
function determineImpactOrientation(pcts: Record<string, number>): {
  top: string;
  second: string;
  topPct: number;
  secondPct: number;
  spread: number;
} {
  // Exclude D5 from orientation — it's a credibility modifier, not an orientation axis.
  const orientationDims = ['D1', 'D2', 'D3', 'D4'];
  const sorted = orientationDims
    .map((id) => ({ id, pct: pcts[id] ?? 0 }))
    .sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const second = sorted[1];
  const spread = top.pct - second.pct;
  return {
    top: top.id,
    second: second.id,
    topPct: top.pct,
    secondPct: second.pct,
    spread,
  };
}

// ── Match archetype: orientation × mandate band, with Passenger / Nominee overrides ──
function matchImpactArchetype(
  pcts: Record<string, number>,
  composite: number,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  const band = compositeToMandateBand(composite);
  const { top, second, spread } = determineImpactOrientation(pcts);

  // Passenger override: ALL dims < 40 (Fragile + all low).
  const allDimsLow = Object.values(pcts).every((p) => p < 40);
  // Nominee override: Fragile band + at least one dim ≥ 50.
  const anyDimStrong = Object.values(pcts).some((p) => p >= 50);

  // Helper: build a MatchedArchetype from a config archetype entry.
  const toMatched = (a: (typeof REAL_ARCHETYPES)[number], score: number): MatchedArchetype => ({
    name: a.name,
    description: a.core_dynamic || a.description || '',
    orientation: a.orientation,
    mandate_band: a.mandate_band,
    risk_if_unaddressed: a.risk_if_unaddressed,
    development_priority: a.development_priority,
    apac_modifier_note: a.apac_modifier_note,
    match_score: score,
  });

  // Find a config archetype by name (handles both "name" and "#" lookups).
  const findByName = (name: string) =>
    REAL_ARCHETYPES.find((a) => a.name === name);

  let matched: MatchedArchetype | null = null;

  // 1. Passenger: all dimensions low.
  if (allDimsLow) {
    const cfg = findByName('The Passenger');
    matched = toMatched(cfg || REAL_ARCHETYPES[7], 95);
  }
  // 2. Nominee: Fragile band, any dim ≥ 50.
  else if (band === 'Fragile' && anyDimStrong) {
    const cfg = findByName('The Nominee');
    matched = toMatched(cfg || REAL_ARCHETYPES[6], 90);
  }
  // 3. High band archetypes (Architect, Steward, Networker).
  else if (band === 'High') {
    // Architect: Governance + Strategy dominant (D2 & D1 both top, small spread).
    if ((top === 'D2' && second === 'D1') || (top === 'D1' && second === 'D2')) {
      if (spread <= 12) {
        const cfg = findByName('The Architect');
        matched = toMatched(cfg || REAL_ARCHETYPES[0], 92);
      }
    }
    // Steward: Governance + Legacy dominant (D2 & D4 both top).
    if (!matched && ((top === 'D2' && second === 'D4') || (top === 'D4' && second === 'D2'))) {
      if (spread <= 12) {
        const cfg = findByName('The Steward');
        matched = toMatched(cfg || REAL_ARCHETYPES[1], 90);
      }
    }
    // Networker: Relationship-dominant (D3 clearly top).
    if (!matched && top === 'D3') {
      const cfg = findByName('The Networker');
      matched = toMatched(cfg || REAL_ARCHETYPES[2], 88);
    }
  }
  // 4. Building band archetypes (Guardian, Visionary, Bridge-Builder).
  else if (band === 'Building') {
    // Guardian: Governance-dominant (D2 top).
    if (top === 'D2') {
      const cfg = findByName('The Guardian');
      matched = toMatched(cfg || REAL_ARCHETYPES[3], 88);
    }
    // Visionary: Strategy-dominant (D1 top).
    else if (top === 'D1') {
      const cfg = findByName('The Visionary');
      matched = toMatched(cfg || REAL_ARCHETYPES[4], 86);
    }
    // Bridge-Builder: Relationship + Legacy dominant (D3 & D4 both top).
    else if ((top === 'D3' && second === 'D4') || (top === 'D4' && second === 'D3')) {
      const cfg = findByName('The Bridge-Builder');
      matched = toMatched(cfg || REAL_ARCHETYPES[5], 86);
    }
  }

  // Fallback: if no precise match, pick the closest archetype by band.
  if (!matched) {
    // Default by band: High→Architect, Building→Guardian, Fragile→Nominee.
    const fallbackName =
      band === 'High' ? 'The Architect' : band === 'Building' ? 'The Guardian' : 'The Nominee';
    const cfg = findByName(fallbackName) || REAL_ARCHETYPES[0];
    matched = toMatched(cfg, 70);
  }

  // Rank all 8 archetypes by fit. Matched gets the highest score; others
  // get descending scores based on band match + orientation overlap.
  const ranked: MatchedArchetype[] = REAL_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.name === matched!.name) {
      score = matched!.match_score;
    } else {
      // Band match bonus.
      const aBand = String(a.mandate_band || '').toLowerCase();
      if (aBand.startsWith(band.toLowerCase())) score += 25;
      // Orientation overlap bonus.
      const aOrient = String(a.orientation || '').toLowerCase();
      const orientationMap: Record<string, string> = {
        D1: 'strategy',
        D2: 'governance',
        D3: 'relationship',
        D4: 'legacy',
      };
      const topKey = orientationMap[top] || '';
      const secondKey = orientationMap[second] || '';
      if (topKey && aOrient.includes(topKey)) score += 15;
      if (secondKey && aOrient.includes(secondKey)) score += 10;
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
          borderTopColor: FOREST_GREEN,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your IMPACT results…</p>
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
          letterSpacing: '0.08em', color: FOREST_GREEN, fontSize: 10, marginBottom: 16,
        }}>
          IMPACT · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your IMPACT results will appear here once you complete the assessment. It takes about fifteen minutes.
        </p>
        <Link
          to="/assessment/impact/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: FOREST_GREEN, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin IMPACT assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function ImpactResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_IMPACT_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;

        // Score all 30 Likert questions via the Akira engine.
        const out = await scoreAssessment('IMPACT', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        // Build a percentage map { D1: pct, D2: pct, ... } for orientation logic.
        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        // Match archetype via IMPACT's orientation × band logic.
        const { archetype, ranked } = matchImpactArchetype(
          pcts,
          out.result.composite?.score ?? 0,
        );

        // Override the engine's archetype with the IMPACT-aware match.
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
          assessmentCode="IMPACT"
          scoreResult={state.result}
          accentColor={FOREST_GREEN}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        {/* Retake + landing links */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/impact/take"
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
            to="/assessment/impact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to IMPACT overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ImpactResultsPage;
