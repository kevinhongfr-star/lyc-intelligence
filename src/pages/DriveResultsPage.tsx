import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { ResultsPanel } from '@/components/assessment/ResultsPanel';
import { scoreAssessment } from '@/services/assessmentEngine';
import { ARCHETYPES as DRIVE_ARCHETYPES, MOTIVATION_TYPE_RULES } from '@/services/scoring/drive';
import type { ScoreResult, MatchedArchetype } from '@/lib/akira/engine';
import { DS, GRAY_600, GRAY_300, INK } from '@/tokens';

const TIGER = '#EA580C';
const SESSION_KEY = 'assessment_answers_DRIVE_latest';

const toMatched = (a: (typeof DRIVE_ARCHETYPES)[number], score: number): MatchedArchetype => ({
  name: a.name,
  description: a.pattern || '',
  weakest_dimension: a.risk || '',
  motivation_type: a.motivation_type || '',
  failure_pattern: a.profile || '',
  match_score: score,
});

type DrivePcts = {
  D1: number; // Intrinsic
  D2: number; // Extrinsic
  D3: number; // Values
  D4: number; // Confidence
  D5: number; // Growth
};

function toDrivePcts(pcts: Record<string, number>): DrivePcts {
  return {
    D1: pcts['D1'] ?? 50,
    D2: pcts['D2'] ?? 50,
    D3: pcts['D3'] ?? 50,
    D4: pcts['D4'] ?? 50,
    D5: pcts['D5'] ?? 50,
  };
}

function determineMotivationType(p: DrivePcts): {
  label: string;
  dominantDim: 'intrinsic' | 'extrinsic' | 'dual' | 'purpose' | 'growth' | 'drifter';
  average: number;
} {
  const avg = (p.D1 + p.D2 + p.D3 + p.D4 + p.D5) / 5;
  const threshold = MOTIVATION_TYPE_RULES.threshold;
  const ieGap = Math.abs(p.D1 - p.D2);

  // Purpose-driven: D3 > both D1 and D2
  if (p.D3 > p.D1 && p.D3 > p.D2) {
    return { label: 'Purpose-driven', dominantDim: 'purpose', average: avg };
  }
  // Growth-driven: D5 > both D1 and D2
  if (p.D5 > p.D1 && p.D5 > p.D2) {
    return { label: 'Growth-driven', dominantDim: 'growth', average: avg };
  }
  // Intrinsic dominant
  if (ieGap >= threshold && p.D1 > p.D2) {
    return { label: 'Intrinsic-dominant', dominantDim: 'intrinsic', average: avg };
  }
  // Extrinsic dominant
  if (ieGap >= threshold && p.D2 > p.D1) {
    return { label: 'Extrinsic-dominant', dominantDim: 'extrinsic', average: avg };
  }
  // Drifter: all low (avg <40)
  if (avg < 40) {
    return { label: 'No clear dominant', dominantDim: 'drifter', average: avg };
  }
  // Default: Dual-drive (balanced intrinsic + extrinsic)
  return { label: 'Dual-drive', dominantDim: 'dual', average: avg };
}

function matchDriveArchetype(
  pcts: Record<string, number>,
): { archetype: MatchedArchetype; ranked: MatchedArchetype[] } {
  const p = toDrivePcts(pcts);
  const { dominantDim, average } = determineMotivationType(p);
  const threshold = 10;
  const HIGH = 60;
  const MODERATE = 40;

  let matchedName: string;

  // 1. Fading archetypes first
  if (average < threshold) {
    // Burned-Out: low intrinsic + low confidence + low growth
    if (p.D1 < MODERATE && p.D4 < MODERATE && p.D5 < MODERATE) {
      matchedName = 'Burned-Out';
    } else if (p.D3 >= HIGH && p.D5 < MODERATE && p.D4 < MODERATE) {
      matchedName = 'Frozen Asset';
    } else {
      matchedName = 'Burned-Out';
    }
  }
  // 2. Flickering archetypes
  else if (p.D1 < MODERATE && p.D3 < MODERATE && p.D5 < MODERATE) {
    matchedName = 'Drifter';
  } else if (p.D2 >= HIGH && p.D1 < MODERATE && p.D3 >= MODERATE) {
    matchedName = 'Golden Handcuffs';
  } else if (p.D2 >= HIGH && p.D3 < MODERATE && p.D5 >= HIGH) {
    matchedName = 'Restless';
  }
  // 3. Fueled archetypes
  else {
    switch (dominantDim) {
      case 'purpose':
        if (p.D3 >= HIGH && p.D1 >= MODERATE && p.D5 < HIGH) {
          matchedName = 'Stalwart';
        } else if (p.D2 >= HIGH && p.D4 >= HIGH && p.D5 >= HIGH) {
          matchedName = 'Champion';
        } else {
          matchedName = 'Stalwart';
        }
        break;
      case 'growth':
        if (p.D5 >= HIGH && p.D1 >= MODERATE) {
          matchedName = 'Explorer';
        } else if (p.D2 >= HIGH && p.D4 >= HIGH) {
          matchedName = 'Champion';
        } else {
          matchedName = 'Explorer';
        }
        break;
      case 'intrinsic':
        if (p.D1 >= HIGH && p.D3 >= HIGH) {
          matchedName = 'Craftsman';
        } else if (p.D5 >= HIGH) {
          matchedName = 'Explorer';
        } else {
          matchedName = 'Craftsman';
        }
        break;
      case 'extrinsic':
        if (p.D1 >= HIGH && p.D5 >= HIGH && p.D4 >= HIGH) {
          matchedName = 'Achiever';
        } else if (p.D4 >= HIGH && p.D5 >= HIGH) {
          matchedName = 'Champion';
        } else {
          matchedName = 'Achiever';
        }
        break;
      case 'dual':
        if (p.D1 >= HIGH && p.D5 >= HIGH && p.D4 >= HIGH) {
          matchedName = 'Achiever';
        } else if (p.D3 >= HIGH && p.D1 >= HIGH) {
          matchedName = 'Craftsman';
        } else if (p.D2 >= HIGH && p.D4 >= HIGH && p.D5 >= HIGH) {
          matchedName = 'Champion';
        } else if (p.D5 >= HIGH) {
          matchedName = 'Explorer';
        } else {
          matchedName = 'Craftsman';
        }
        break;
      case 'drifter':
        matchedName = 'Drifter';
        break;
      default:
        matchedName = 'Craftsman';
    }
  }

  const cfg = DRIVE_ARCHETYPES.find((a) => a.name === matchedName) || DRIVE_ARCHETYPES[1];
  const matched = toMatched(cfg, 92 - Math.max(0, 40 - average) * 1.5);

  // Ranked list
  const ranked: MatchedArchetype[] = DRIVE_ARCHETYPES.map((a) => {
    let score = 25;
    if (a.name === matchedName) {
      score = matched.match_score;
    } else {
      if (a.motivation_type && a.motivation_type.includes(dominantDim)) score += 20;
      if (a.state === 'Fueled' && average >= HIGH) score += 15;
      if (a.state === 'Flickering' && average >= MODERATE && average < HIGH) score += 15;
      if (a.state === 'Fading' && average < MODERATE) score += 15;
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
          borderTopColor: TIGER,
          animation: 'spin 350ms linear infinite',
          margin: '0 auto 24px',
        }} />
        <p style={{ color: GRAY_600, fontSize: 14 }}>Scoring your DRIVE results…</p>
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
          letterSpacing: '0.08em', color: TIGER, fontSize: 10, marginBottom: 16,
        }}>
          DRIVE · No results yet
        </div>
        <h1 style={{
          fontFamily: DS.headingFont, fontSize: 28, fontWeight: 700,
          color: INK, lineHeight: 1.25, marginBottom: 16,
        }}>
          Take the assessment to see your results
        </h1>
        <p style={{ fontSize: 15, color: GRAY_600, lineHeight: 1.6, marginBottom: 32 }}>
          Your DRIVE results will appear here once you complete the assessment. It takes about ten minutes.
        </p>
        <Link
          to="/assessment/drive/take"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', background: TIGER, color: '#FFFFFF',
            textDecoration: 'none', fontWeight: 600, fontSize: 15,
          }}
        >
          Begin DRIVE assessment <ArrowRight style={{ width: 18, height: 18 }} />
        </Link>
      </div>
    </div>
  );
}

export function DriveResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{
    loading: boolean;
    result: ScoreResult | null;
    hasAnswers: boolean;
  }>({ loading: true, result: null, hasAnswers: false });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const scopedKey = `assessment_answers_DRIVE_${id}`;
      const raw = sessionStorage.getItem(scopedKey) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
        return;
      }
      try {
        const answers = JSON.parse(raw) as Record<string, number>;
        const out = await scoreAssessment('DRIVE', answers, { persist: false });
        if (!out.ok || cancelled) {
          if (!cancelled) setState({ loading: false, result: null, hasAnswers: false });
          return;
        }

        const pcts: Record<string, number> = {};
        for (const dimId of Object.keys(out.result.dimension_scores)) {
          pcts[dimId] = out.result.dimension_scores[dimId].percentage;
        }

        const { archetype, ranked } = matchDriveArchetype(pcts);

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
          assessmentCode="DRIVE"
          scoreResult={state.result}
          accentColor={TIGER}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={false}
        />
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 24,
          marginTop: 32, flexWrap: 'wrap',
        }}>
          <Link
            to="/assessment/drive/take"
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
            to="/assessment/drive"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', color: GRAY_600,
              textDecoration: 'none', fontWeight: 500, fontSize: 14,
            }}
          >
            Back to DRIVE overview <ArrowRight style={{ width: 16, height: 16 }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DriveResultsPage;
