// ═══════════════════════════════════════════════════════════
// LEAP Results Page — DISC primary × CR band archetype matching.
// X2-2: Reads answers from sessionStorage, scores CR dimensions via
// the Akira engine, determines DISC primary from forced-choice answers,
// and matches the correct archetype (17 total: 16 DISC×band + 1 mixed).
// Brand: OCEAN accent, system serif headings, zero border radius.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as LEAP_ARCHETYPES } from '@/services/scoring/leap';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { OCEAN, DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const SESSION_KEY = 'assessment_answers_LEAP_latest';

// ── 17th archetype: mixed profile (no dominant DISC drive) ──
const SCATTERED_NAVIGATOR: MatchedArchetype = {
  name: 'The Scattered Navigator',
  description:
    'No single behavioural drive dominates your profile — you draw flexibly from all four styles. This adaptability is a strength, but without a dominant drive your career readiness may lack the focused edge that decision-makers look for. Channel your flexibility into a deliberate positioning strategy.',
  match_score: 70,
};

// ── CR band thresholds (composite score → band) ──
function compositeToCRBand(composite: number): string {
  if (composite >= 80) return 'B4';
  if (composite >= 60) return 'B3';
  if (composite >= 40) return 'B2';
  return 'B1';
}

// ── Determine DISC primary from forced-choice answers ──
function determineDiscPrimary(answers: Record<string, unknown>): {
  primary: string | null;
  counts: Record<string, number>;
  isMixed: boolean;
} {
  const counts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const [qid, val] of Object.entries(answers)) {
    if (!qid.startsWith('LEAP_DQ')) continue;
    const v = typeof val === 'string' ? val.toUpperCase() : '';
    if (v in counts) counts[v]++;
  }
  const total = counts.D + counts.I + counts.S + counts.C;
  if (total === 0) return { primary: null, counts, isMixed: false };

  const values = Object.values(counts);
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Mixed profile: spread < 15 percentage points across all 4 dimensions.
  const spreadPct = total > 0 ? ((max - min) / total) * 100 : 0;
  const isMixed = spreadPct < 15;

  const primary = isMixed
    ? null
    : (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null);

  return { primary, counts, isMixed };
}

// ── Match archetype: DISC primary × CR band, or Scattered Navigator ──
function matchLeapArchetype(
  discPrimary: string | null,
  crBand: string,
  isMixed: boolean,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  if (isMixed || !discPrimary) {
    // Mixed profile → The Scattered Navigator (regardless of CR band).
    const ranked: MatchedArchetype[] = LEAP_ARCHETYPES.map((a, i) => ({
      name: a.name,
      description: a.narrative || '',
      match_score: Math.max(10, 40 - i * 2),
    }));
    return { archetype: SCATTERED_NAVIGATOR, ranked: [SCATTERED_NAVIGATOR, ...ranked] };
  }

  // Find the exact match: disc_primary × cr_band.
  const matched = LEAP_ARCHETYPES.find(
    (a) => a.disc_primary === discPrimary && a.cr_band === crBand,
  );

  // Rank: matched first, then same DISC primary (different band), then rest.
  const ranked: MatchedArchetype[] = LEAP_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.disc_primary === discPrimary && a.cr_band === crBand) score = 95;
    else if (a.disc_primary === discPrimary) score = 60;
    else if (a.cr_band === crBand) score = 45;
    return {
      name: a.name,
      description: a.narrative || '',
      match_score: score,
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const archetype: MatchedArchetype = matched
    ? { name: matched.name, description: matched.narrative || '', match_score: 95 }
    : SCATTERED_NAVIGATOR;

  return { archetype, ranked };
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
          borderTopColor: OCEAN,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your LEAP results…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────
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
          letterSpacing: '0.08em', color: OCEAN, fontSize: 10, marginBottom: 16,
        }}>
          LEAP · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your LEAP results will appear here once you complete the assessment. It takes about twelve minutes.
        </p>
        <Link
          to="/assessment/leap/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: OCEAN, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin LEAP assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function LeapResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_LEAP_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const allAnswers = JSON.parse(raw) as Record<string, number | string | number[]>;

        // Separate CR numeric answers for the engine, keep DISC strings for primary.
        const crAnswers: Record<string, number> = {};
        for (const [qid, val] of Object.entries(allAnswers)) {
          if (qid.startsWith('LEAP_CR') && typeof val === 'number') {
            crAnswers[qid] = val;
          }
        }

        // Score CR dimensions via the Akira engine.
        const out = await scoreAssessment('LEAP', crAnswers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        // Determine DISC primary and match archetype.
        const { primary, isMixed } = determineDiscPrimary(allAnswers);
        const crBand = compositeToCRBand(out.result.composite?.score ?? 0);
        const { archetype, ranked } = matchLeapArchetype(primary, crBand, isMixed);

        // Override the engine's archetype with the DISC-aware match.
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
    // PDF export is X2-5 / Y1 territory.
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
          assessmentCode="LEAP"
          scoreResult={state.result}
          accentColor={OCEAN}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/leap/take"
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
            to="/assessment/leap"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to LEAP overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LeapResultsPage;
