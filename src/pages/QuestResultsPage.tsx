// ═══════════════════════════════════════════════════════════
// QUEST Results Page — executive performance archetype matching.
// Reads answers from sessionStorage, scores via the Akira engine,
// then determines band (Advanced / Developing / Emerging) and
// top-dimension pairs to match one of 10 executive archetypes.
// Brand: pink-rose accent "#BE185D", zero border radius.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as QUEST_ARCHETYPES } from '@/services/scoring/quest';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const ACCENT = '#BE185D';
const SESSION_KEY = 'assessment_answers_QUEST_latest';

const REAL_ARCHETYPES = QUEST_ARCHETYPES.filter(
  (a) => !String(a.name).startsWith('Axis'),
);

function compositeToQuestBand(composite: number): 'Advanced' | 'Developing' | 'Emerging' {
  if (composite >= 70) return 'Advanced';
  if (composite >= 40) return 'Developing';
  return 'Emerging';
}

function topDims(pcts: Record<string, number>, count: number): Array<{ id: string; pct: number }> {
  return Object.entries(pcts)
    .map(([id, pct]) => ({ id, pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, count);
}

function matchQuestArchetype(
  pcts: Record<string, number>,
  composite: number,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  const band = compositeToQuestBand(composite);
  const top2 = topDims(pcts, 2);
  const all = topDims(pcts, 6);
  const avgPct = all.reduce((s, d) => s + d.pct, 0) / Math.max(1, all.length);

  const maxPct = all[0]?.pct ?? 0;
  const secondPct = all[1]?.pct ?? 0;
  const specialistGap = maxPct - secondPct;

  const toMatched = (a: (typeof REAL_ARCHETYPES)[number], score: number): MatchedArchetype => {
    const rec = a as Record<string, unknown>;
    return {
      name: String(rec.name ?? ''),
      description: String(rec.core_strength ?? rec.description ?? ''),
      orientation: rec.profile as string | undefined,
      mandate_band: band,
      risk_if_unaddressed: String(rec.key_risk ?? ''),
      development_priority: rec.development_priority as string | undefined,
      match_score: score,
    };
  };

  const findByName = (name: string) =>
    REAL_ARCHETYPES.find((a) => a.name === name);

  let matched: MatchedArchetype | null = null;

  const isHigh = (id: string, threshold = 70) => (pcts[id] ?? 0) >= threshold;
  const isTop = (id: string) => top2.some((d) => d.id === id);

  // 1. Specialist override: single dominant dimension (>15 pts above next)
  if (specialistGap > 15) {
    const cfg = findByName('The Specialist');
    matched = toMatched(cfg || REAL_ARCHETYPES[8], 92);
  }
  // 2. Seedling override: avg < 50
  else if (avgPct < 50) {
    const cfg = findByName('The Seedling');
    matched = toMatched(cfg || REAL_ARCHETYPES[9], 90);
  }
  // 3. Advanced band archetypes (Strategist, Catalyst, Diplomat, Commander)
  else if (band === 'Advanced') {
    // Strategist: D1 Strategic Thinking + D5 Adaptive Capacity
    if (isTop('D1') && isTop('D5')) {
      const cfg = findByName('The Strategist');
      matched = toMatched(cfg || REAL_ARCHETYPES[0], 92);
    }
    // Catalyst: D3 Commercial Acumen + D5 Adaptive Capacity
    if (!matched && isTop('D3') && isTop('D5')) {
      const cfg = findByName('The Catalyst');
      matched = toMatched(cfg || REAL_ARCHETYPES[1], 90);
    }
    // Diplomat: D4 People Leadership + D1 Strategic Thinking
    if (!matched && isTop('D4') && isTop('D1')) {
      const cfg = findByName('The Diplomat');
      matched = toMatched(cfg || REAL_ARCHETYPES[2], 88);
    }
    // Commander: D2 Execution Excellence + D3 Commercial Acumen
    if (!matched && isTop('D2') && isTop('D3')) {
      const cfg = findByName('The Commander');
      matched = toMatched(cfg || REAL_ARCHETYPES[3], 88);
    }
  }
  // 4. Developing band archetypes (Navigator, Visionary, Engine, Entrepreneur)
  if (!matched && band === 'Developing') {
    // Navigator: D5 Adaptive Capacity + D4 People Leadership
    if (isTop('D5') && isTop('D4')) {
      const cfg = findByName('The Navigator');
      matched = toMatched(cfg || REAL_ARCHETYPES[4], 88);
    }
    // Entrepreneur: D3 Commercial Acumen + D5 Adaptive Capacity (Developing)
    if (!matched && isTop('D3') && isTop('D5')) {
      const cfg = findByName('The Entrepreneur');
      matched = toMatched(cfg || REAL_ARCHETYPES[7], 86);
    }
    // Visionary: D1 Strategic Thinking top
    if (!matched && top2[0]?.id === 'D1') {
      const cfg = findByName('The Visionary');
      matched = toMatched(cfg || REAL_ARCHETYPES[5], 88);
    }
    // Engine: D2 Execution Excellence top
    if (!matched && top2[0]?.id === 'D2') {
      const cfg = findByName('The Engine');
      matched = toMatched(cfg || REAL_ARCHETYPES[6], 88);
    }
  }

  // 5. Cross-band fallbacks based on top dimension
  if (!matched) {
    const topId = top2[0]?.id;
    let fallbackName = 'The Visionary';
    if (topId === 'D1') fallbackName = band === 'Advanced' ? 'The Strategist' : 'The Visionary';
    else if (topId === 'D2') fallbackName = band === 'Advanced' ? 'The Commander' : 'The Engine';
    else if (topId === 'D3') fallbackName = band === 'Advanced' ? 'The Catalyst' : 'The Entrepreneur';
    else if (topId === 'D4') fallbackName = band === 'Advanced' ? 'The Diplomat' : 'The Navigator';
    else if (topId === 'D5') fallbackName = band === 'Advanced' ? 'The Catalyst' : 'The Navigator';
    else if (topId === 'D6') fallbackName = 'The Specialist';
    if (band === 'Emerging') fallbackName = 'The Seedling';
    const cfg = findByName(fallbackName) || REAL_ARCHETYPES[0];
    matched = toMatched(cfg, 70);
  }

  const ranked: MatchedArchetype[] = REAL_ARCHETYPES.map((a) => {
    let score = 30;
    if (a.name === matched!.name) {
      score = matched!.match_score;
    } else {
      const aProfile = String((a as Record<string, unknown>).profile || '').toLowerCase();
      if (aProfile.includes(band.toLowerCase())) score += 25;
      const dimMap: Record<string, string> = {
        D1: 'strategic',
        D2: 'execution',
        D3: 'commercial',
        D4: 'people',
        D5: 'adaptive',
        D6: 'ai readiness',
      };
      for (const d of top2) {
        const key = dimMap[d.id] || '';
        if (key && aProfile.includes(key)) score += 15;
      }
      if (aProfile.includes('dominant') && specialistGap > 10) score += 10;
      if (aProfile.includes('multiple low') && avgPct < 55) score += 10;
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
          borderTopColor: ACCENT,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your QUEST results…</p>
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
          letterSpacing: '0.08em', color: ACCENT, fontSize: 10, marginBottom: 16,
        }}>
          QUEST · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the complimentary assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your QUEST results will appear here once you complete the assessment. It takes about twelve minutes.
        </p>
        <Link
          to="/assessment/quest/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: ACCENT, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin QUEST assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function QuestResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_QUEST_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;

        const out = await scoreAssessment('QUEST', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        const { archetype, ranked } = matchQuestArchetype(
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
          assessmentCode="QUEST"
          scoreResult={state.result}
          accentColor={ACCENT}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/quest/take"
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
            to="/assessment/quest"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to QUEST overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default QuestResultsPage;
