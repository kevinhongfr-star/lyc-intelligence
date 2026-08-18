// ═══════════════════════════════════════════════════════════
// MOSAIC Results Page — score-only, no archetype.
// ARCHETYPES = [] so engine returns archetype undefined.
// ResultsPanel checks hasArchetypes (archetypeCount && matchedArchetype)
// and conditionally skips the archetype sections.
// Brand: violet accent "#7C3AED", zero border radius.
// ═══════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import type { ScoreResult } from '@/lib/akira/engine';
import { DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const ACCENT = '#7C3AED';
const SESSION_KEY = 'assessment_answers_MOSAIC_latest';

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
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your MOSAIC results…</p>
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
          MOSAIC · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the complimentary assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your MOSAIC results will appear here once you complete the assessment. It takes about eight minutes.
        </p>
        <Link
          to="/assessment/mosaic/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: ACCENT, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin MOSAIC assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function MosaicResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_MOSAIC_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;
        const out = await scoreAssessment('MOSAIC', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        const result: ScoreResult = {
          ...out.result,
          archetype: undefined,
          archetypes_ranked: [],
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
          assessmentCode="MOSAIC"
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
            to="/assessment/mosaic/take"
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
            to="/assessment/mosaic"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to MOSAIC overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MosaicResultsPage;
