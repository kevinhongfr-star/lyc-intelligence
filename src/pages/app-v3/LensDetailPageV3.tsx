/**
 * V-App 3/7 — Lens Detail page.
 *
 * Per-lens page reached at /app/v3/lenses/:code. Shows:
 *   PageHeader (kicker = pillar group (SHIFT / ADVISORY) · title = lens display name · tagline desc
 *   Right: 2 secondary CTAs (Take lens · Download PDF)
 *   Hero score card: score big (18px MonoLabel SCORE, 52px Crimson 600) · level · completed date
 *   OR empty "not taken" state with primary CTA Take lens + upgrade path if locked
 *   Section "What this lens measures" · 2-col list dimensions
 *   Section "Previous readouts" · ListRow items for each past result
 *   (locked) upgrade banner with tier badge + CTA → /membership
 *
 * Uses real Supabase results via fetchUserLensResults + individual dimension
 * scores + result ID via diagnosticApi.getResult for any result row found.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier, tierDisplayName } from '@/config/tierConfig';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { V3 } from '@/styles/v3-tokens';
import {
  Badge,
  Button,
  ListRow,
  MonoLabel,
  PageHeader,
  ScoreBar,
  Skeleton,
  scoreColor,
} from '@/components/app-v3/ui';
import {
  fetchUserLensResults,
  canAccessLens,
  unlockTierFor,
  lensDisplayName,
  lensTagline,
  lensPillarGroup,
  lensPriceMiles,
  lensDuration,
  type PillarGroup,
  type UserLensResultMap,
} from '@/services/lensLibraryService';
import { getResult, type ScoringResult } from '@/services/diagnosticApi';

/* ── Helpers ────────────────────────────────────────────────────────── */

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ── Page ───────────────────────────────────────────────────────────── */

export function LensDetailPageV3(): React.ReactElement {
  const { code = '' } = useParams<{ code: string }>();
  const upper = code.toUpperCase();
  const { user, profile } = useAuthStore();
  const tier = normalizeTier(profile?.tier) ?? profile?.tier ?? null;

  const canAccess = useMemo(() => canAccessLens(tier, upper), [tier, upper]);
  const info = (ASSESSMENT_CATALOG as any)[upper] || (ASSESSMENT_CATALOG as any)[code];

  const [loaded, setLoaded] = useState(false);
  const [resultMap, setResultMap] = useState<UserLensResultMap>({});
  const [detail, setDetail] = useState<{ result: ScoringResult; resultId: string } | null>(null);

  const pillar: PillarGroup = lensPillarGroup(upper);
  const name = lensDisplayName(upper) || upper;
  const tagline = lensTagline(upper);
  const miles = lensPriceMiles(upper);
  const duration = lensDuration(upper);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map = await fetchUserLensResults(user?.id ?? null);
      if (cancelled) return;
      setResultMap(map);
      const mine = map[upper];
      if (mine?.resultId && mine.resultId && user?.id) {
        const d = await getResult(mine.resultId, upper.toLowerCase(), user.id);
        if (!cancelled) setDetail(d);
      } else {
        setDetail(null);
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user?.id, upper]);

  const takeUrl = canAccess ? `/app/v3/lenses/${code}/take` : '/membership';

  const eyebrowColor = pillar === 'SHIFT' ? V3.teal600 : V3.ocean600;

  return (
    <>
      <PageHeader
        kicker={`${pillar === 'SHIFT' ? 'GROUP 01 · SHIFT' : 'GROUP 02 · ADVISORY'}`}
        title={name}
        description={
          tagline || info?.description || 'A diagnostic instrument in the LYC lens library.'
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {canAccess ? (
              <>
                <Button variant="primary" size="large" to={takeUrl}>Take lens</Button>
                {detail && (
                  <Button variant="secondary" size="large">Download PDF</Button>
                )}
              </>
            ) : (
              <Button variant="dark-cta" size="large" to="/membership">Upgrade to unlock</Button>
            )}
          </div>
        }
      />

      <div style={{ maxWidth: V3.appContentMax, margin: `${V3.appPageHeaderPad}px auto 0` }}>
        {!loaded ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <Skeleton width="100%" height={240} />
            <Skeleton width="100%" height={240} />
          </div>
        ) : (
          <>
            {/* ── Hero score card ───────────────────────────────────── */}
            <div
              style={{
                border: `1px solid ${V3.border}`,
                background: V3.white,
                padding: 32,
                marginBottom: 48,
              }}
            >
              {detail && canAccess ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                  <div>
                    <MonoLabel color={V3.ink400} style={{ display: 'block', marginBottom: 16 }}>
                      OVERALL SCORE
                    </MonoLabel>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <div
                        style={{
                          fontFamily: V3.displayFont,
                          fontSize: 52,
                          fontWeight: V3.fwSemibold,
                          color: scoreColor(detail.result.overall_score),
                          lineHeight: 1,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {detail.result.overall_score}
                      </div>
                      <span
                        style={{
                          fontFamily: V3.monoFont,
                          fontSize: V3.textAppMono,
                          fontWeight: V3.fwMedium,
                          letterSpacing: V3.trackingMono,
                          textTransform: 'uppercase',
                          color: V3.ink400,
                        }}
                      >
                        / 100
                      </span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <Badge variant="status-ready">{detail.result.overall_level || 'Completed'}</Badge>
                      <span style={{ fontFamily: V3.bodyFont, fontSize: '13px', color: V3.ink400 }}>
                        Completed {formatDate(resultMap[upper]?.completedAt)}
                      </span>
                    </div>
                    <div style={{ marginTop: 24 }}>
                      <ScoreBar score={detail.result.overall_score} />
                    </div>
                  </div>
                  <div>
                    <MonoLabel color={V3.ink400} style={{ display: 'block', marginBottom: 16 }}>
                      DIMENSIONS
                    </MonoLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {detail.result.dimension_scores.map((d) => (
                        <div key={d.dimension_key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontFamily: V3.bodyFont, fontSize: '13.5px', color: V3.ink700, lineHeight: 1.3 }}>
                              {d.dimension_name}
                            </span>
                            <span style={{ fontFamily: V3.displayFont, fontSize: '14px', fontWeight: V3.fwSemibold, color: scoreColor(d.score), lineHeight: 1 }}>
                              {d.score}
                            </span>
                          </div>
                          <ScoreBar score={d.score} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : canAccess ? (
                <div style={{ textAlign: 'left' }}>
                  <MonoLabel color={V3.ink400} style={{ display: 'block', marginBottom: 12 }}>
                    NOT TAKEN
                  </MonoLabel>
                  <div style={{
                    fontFamily: V3.displayFont,
                    fontSize: 26,
                    fontWeight: V3.fwRegular,
                    color: V3.ink900,
                    lineHeight: 1.2,
                    maxWidth: 520,
                  }}>
                    Launch the lens when you're ready.
                  </div>
                  <p style={{
                    marginTop: 8, maxWidth: 560,
                    fontFamily: V3.bodyFont, fontSize: '14px', lineHeight: 1.6, color: V3.ink500,
                  }}>
                    {duration} minutes · {miles} miles · NEXUS coaching is appended to every
                    completed lens for a conversation-based readout afterward.
                  </p>
                  <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                    <Button variant="primary" size="large" to={takeUrl}>Take lens</Button>
                    <Button variant="secondary" size="large">Preview questions</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Badge variant="status-draft">LOCKED · {unlockTierFor(upper)}</Badge>
                  <div style={{
                    marginTop: 16, fontFamily: V3.displayFont, fontSize: 26,
                    fontWeight: V3.fwRegular, color: V3.ink900, lineHeight: 1.2,
                  }}>
                    {name} is available on {unlockTierFor(upper)}.
                  </div>
                  <p style={{
                    marginTop: 8,
                    fontFamily: V3.bodyFont, fontSize: '14px', lineHeight: 1.6, color: V3.ink500,
                    maxWidth: 560,
                  }}>
                    Your current tier ({tierDisplayName(tier)}) does not include this lens.
                    Upgrade to unlock the full workbench.
                  </p>
                  <div style={{ marginTop: 20 }}>
                    <Button variant="dark-cta" size="large" to="/membership">Upgrade to {unlockTierFor(upper)}</Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── What this lens measures ───────────────────────────── */}
            {info?.dimensions?.length > 0 && (
              <section style={{ marginBottom: 48 }}>
                <MonoLabel color={V3.teal600} style={{ display: 'block', marginBottom: 12 }}>
                  WHAT THIS LENS MEASURES
                </MonoLabel>
                <div
                  style={{
                    fontFamily: V3.displayFont,
                    fontSize: '20px',
                    fontWeight: V3.fwRegular,
                    color: V3.ink900,
                    lineHeight: 1.25,
                    marginBottom: 8,
                  }}
                >
                  {info.dimensions.length} dimensions · {info.duration_minutes || '—'} minutes · {info.total_questions || '—'} questions
                </div>
                <p style={{ fontFamily: V3.bodyFont, fontSize: '14px', color: V3.ink500, lineHeight: 1.6, maxWidth: 520, marginBottom: 32, marginTop: 0 }}>
                  {tagline || info.tagline || ''}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                  {(info.dimensions as any[]).map((d) => (
                    <div key={d.id} style={{ paddingBottom: 16, borderBottom: `1px solid ${V3.dividerSurface}` }}>
                      <div style={{ fontFamily: V3.bodyFont, fontSize: '14px', fontWeight: V3.fwSemibold, color: V3.ink800, lineHeight: 1.3 }}>
                        {d.name}
                      </div>
                      <div style={{
                        marginTop: 4,
                        fontFamily: V3.bodyFont, fontSize: '13px', color: V3.ink500,
                        lineHeight: 1.5,
                      }}>
                        {d.description}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Previous readouts ─────────────────────────────────── */}
            <section style={{ marginBottom: 96 }}>
              <MonoLabel color={eyebrowColor} style={{ display: 'block', marginBottom: 12 }}>
                PREVIOUS READOUTS
              </MonoLabel>
              <div
                style={{
                  fontFamily: V3.displayFont,
                  fontSize: '20px',
                  fontWeight: V3.fwRegular,
                  color: V3.ink900,
                  lineHeight: 1.25,
                  marginBottom: 16,
                }}
              >
                Readout history.
              </div>
              {resultMap[upper] && detail ? (
                <div style={{ border: `1px solid ${V3.border}` }}>
                  <ListRow>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          fontFamily: V3.displayFont,
                          fontSize: 24, fontWeight: V3.fwSemibold,
                          color: scoreColor(resultMap[upper].score),
                          lineHeight: 1, width: 56, flexShrink: 0,
                        }}
                      >
                        {resultMap[upper].score}
                      </div>
                      <div>
                        <div style={{ fontFamily: V3.bodyFont, fontSize: '14px', fontWeight: V3.fwMedium, color: V3.ink800 }}>
                          {detail.result.overall_level || 'Readout'} — {formatDate(resultMap[upper].completedAt)}
                        </div>
                        <div style={{
                          fontFamily: V3.bodyFont, fontSize: '12.5px', color: V3.ink400,
                          marginTop: 2, lineHeight: 1.4,
                        }}>
                          {code.toUpperCase()} · {duration} min · {miles} miles
                        </div>
                      </div>
                    </div>
                    <Button variant="secondary" to={`/app/v3/lenses/${code}/readout/${resultMap[upper].resultId}`}>
                      Open readout →
                    </Button>
                  </ListRow>
                </div>
              ) : (
                <div style={{ border: `1px solid ${V3.border}`, padding: 24 }}>
                  <span style={{ fontFamily: V3.bodyFont, fontSize: '14px', color: V3.ink400 }}>
                    {canAccess ? 'No readouts yet. Take the lens to generate one.' : 'Upgrade to a tier that includes this lens to see readouts.'}
                  </span>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default LensDetailPageV3;
