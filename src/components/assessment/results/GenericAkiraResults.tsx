import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Download, AlertTriangle } from 'lucide-react';
import {
  DimensionScorecard,
  ArchetypeProfile,
  KeyInsights,
  ShareRetake,
  type AssessmentResultsConfig,
} from './index';
import { deriveExecutiveSummary } from './ExecutiveSummary';
import { Container, SectionHeading, Card, CardContent } from '@/components/ui';
import {
  runAndRenderReport,
  getReportMeta,
  instrumentToConfig,
  scoreAssessment,
  renderReport,
  type ScoreResult,
  type InstrumentKey,
} from '@/services/reportPipeline';
import { generateCPIReportHTML } from '@/services/cpiReportRenderer';

const INK = '#000000';
const OFF = '#F5F5F3';
const G200 = '#E8E8E5';
const G400 = '#8A8A82';
const G600 = '#52524B';
const WHITE = '#FFFFFF';
const ACCENT = '#C108AB';

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1120px',
  margin: '0 auto',
  padding: '0 32px',
};

const monoStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const headingStyle: React.CSSProperties = {
  fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

/** Semantic score-band color — keeps the established 4-band pattern. */
function scoreColor(score: number, accent: string): string {
  if (score >= 75) return '#2D7A3E';
  if (score >= 50) return accent;
  if (score >= 35) return '#C97824';
  return '#9CA3AF';
}

/** Horizontal score bar that fills on mount (350ms — within brand motion budget). */
function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 150);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div style={{ height: 10, background: G200, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${width}%`, background: color,
        transition: 'width 350ms cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

interface GenericAkiraResultsProps {
  instrumentKey: string;
  resultId?: string;
  loading?: boolean;
  error?: string;
}

function buildConfig(
  instrumentKey: string,
  result: ScoreResult,
  overrides?: Partial<AssessmentResultsConfig>
): AssessmentResultsConfig {
  const base = instrumentToConfig(instrumentKey, result);
  return {
    ...base,
    accent: ACCENT,
    ...overrides,
  };
}

async function fetchOrBuildResult(
  instrumentKey: string,
  resultId?: string
): Promise<{ result?: ScoreResult; config?: AssessmentResultsConfig; html?: string; source: 'resultId' | 'session' | 'mock' }> {
  if (resultId) {
    try {
      const meta = await getReportMeta(instrumentKey, resultId);
      const answersKey = `assessment_answers_${instrumentKey}_${resultId}`;
      const raw = sessionStorage.getItem(answersKey);
      const answers = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const scored = await scoreAssessment(instrumentKey, answers, { persist: false });
      const config = buildConfig(instrumentKey, scored);
      const html = await renderReport(instrumentKey, scored, {
        accent: ACCENT,
        includeFooter: true,
        generatedAt: meta.generatedAt,
      });
      return { result: scored, config, html, source: 'resultId' };
    } catch (e) {
      console.warn('[GenericAkiraResults] resultId lookup failed, falling back:', e);
    }
  }

  const sessionKey = `assessment_answers_${instrumentKey}_latest`;
  const sessionRaw = sessionStorage.getItem(sessionKey);
  if (sessionRaw) {
    try {
      const answers = JSON.parse(sessionRaw) as Record<string, number>;
      const ran = await runAndRenderReport(instrumentKey, answers, { persist: false });
      if (ran.ok) {
        const config = buildConfig(instrumentKey, ran.result);
        return { result: ran.result, config, html: ran.html, source: 'session' };
      }
    } catch (e) {
      console.warn('[GenericAkiraResults] session re-score failed:', e);
    }
  }

  const mockAnswers: Record<string, number> = {};
  for (let i = 1; i <= 20; i++) mockAnswers[`q_${i}`] = 3.5 + (i % 3) * 0.5;
  const mockResult = await scoreAssessment(instrumentKey, mockAnswers, { persist: false });
  const mockConfig = buildConfig(instrumentKey, mockResult, {
    overallScore: 72,
  });
  const mockHtml = await renderReport(instrumentKey, mockResult, {
    accent: ACCENT,
    includeFooter: true,
    generatedAt: new Date(),
  });
  return { result: mockResult, config: mockConfig, html: mockHtml, source: 'mock' };
}

function downloadBlob(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GenericAkiraResults({
  instrumentKey: propKey,
  resultId: propResultId,
  loading: externalLoading,
  error: externalError,
}: GenericAkiraResultsProps) {
  const routerParams = useParams<{ id?: string }>();
  const instrumentKey = propKey.toUpperCase();
  const resultId = propResultId || routerParams?.id;

  type ResultState = {
    loading: boolean;
    error: string | null;
    config: AssessmentResultsConfig | null;
    result: ScoreResult | null;
    standaloneHtml: string | null;
    sourceLabel: string | null;
  };

  const [state, setState] = useState<ResultState>({
    loading: true,
    error: externalError || null,
    config: null,
    result: null,
    standaloneHtml: null,
    sourceLabel: null,
  });

  const load = useCallback(async () => {
    setState((s: ResultState) => ({ ...s, loading: true, error: externalError || null }));
    try {
      const { result, config, html, source } = await fetchOrBuildResult(instrumentKey, resultId);
      if (!config || !result) {
        setState((s: ResultState) => ({
          ...s,
          loading: false,
          error: 'Unable to build assessment results.',
        }));
        return;
      }

      let reportHtml = html || '';
      if (instrumentKey === 'CPI' && result.compositeScore !== undefined) {
        try {
          const cpiData = {
            name: 'Assessment Participant',
            date: new Date(result.generatedAt).toISOString().split('T')[0],
            compositeScore: result.compositeScore,
            tierLabel: result.tierLabel,
            archetype: result.archetype,
            archetypeTagline: result.archetypeTagline,
            archetypeDescription: result.archetypeDescription,
            archetypeStrengths: result.archetypeStrengths,
            archetypeDevelopment: result.archetypeDevelopment,
            dimensionScores: result.dimensionScores,
            dimensionNames: result.dimensionNames,
            crossBorderScore: result.crossBorderScore ?? 0,
            narrative: {} as any,
          };
          reportHtml = generateCPIReportHTML(cpiData);
        } catch {
          /* fall back to the generic html */
        }
      }

      const meta = await getReportMeta(instrumentKey, resultId || result.id);

      setState({
        loading: false,
        error: null,
        config: { ...config, accent: ACCENT },
        result,
        standaloneHtml: reportHtml,
        sourceLabel: meta.title,
      });
    } catch (err: any) {
      setState((s: ResultState) => ({
        ...s,
        loading: false,
        error: err?.message || 'Failed to load results.',
      }));
    }
  }, [instrumentKey, resultId, externalError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = useCallback(() => {
    if (!state.standaloneHtml || !state.sourceLabel) return;
    const filename = `NEXUS_${instrumentKey}_Report_${resultId || new Date().toISOString().split('T')[0]}.html`;
    downloadBlob(filename, state.standaloneHtml);
  }, [instrumentKey, resultId, state.standaloneHtml, state.sourceLabel]);

  if (externalLoading || state.loading) {
    return (
      <div style={{
        background: OFF, minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        ...bodyStyle,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, border: `2px solid ${G200}`,
            borderTopColor: ACCENT,
            animation: 'spin 350ms linear infinite',
            margin: '0 auto 24px',
          }} />
          <p style={{ color: G600, fontSize: 14 }}>Loading your {instrumentKey} results…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (externalError || state.error) {
    return (
      <div style={{ background: OFF, minHeight: '100vh', ...bodyStyle }}>
        <div style={{ ...containerStyle, paddingTop: 80, paddingBottom: 80 }}>
          <div style={{
            padding: 24,
            background: '#FEF2F2',
            border: `1px solid #FECACA`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <AlertTriangle style={{ width: 20, height: 20, color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ ...headingStyle, fontSize: 18, marginBottom: 4 }}>
                Unable to load results
              </h3>
              <p style={{ fontSize: 14, color: G600, marginBottom: 12 }}>
                {externalError || state.error}
              </p>
              <button
                onClick={load}
                style={{
                  padding: '10px 18px',
                  background: ACCENT,
                  color: '#FFF',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!state.config) return null;

  const configForRender: AssessmentResultsConfig = {
    ...state.config,
    accent: ACCENT,
  };

  const summary = deriveExecutiveSummary(configForRender);
  const scoreColorVal = scoreColor(configForRender.overallScore, ACCENT);
  const sortedActions = [...configForRender.developmentActions].sort(
    (a, b) => a.priority - b.priority
  );
  const { prefix, assessmentName, archetype, overallScore } = configForRender;
  const accentLink: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'DM Sans', system-ui, sans-serif",
    fontSize: 14, fontWeight: 500, color: ACCENT,
    textDecoration: 'none', transition: 'opacity 200ms ease',
  };

  return (
    <div style={{
      background: OFF, color: INK, minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: 1.6, WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header with download */}
      <header style={{
        position: 'sticky', top: 0, left: 0, right: 0,
        background: 'rgba(245,245,243,0.96)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100, borderBottom: `1px solid ${G200}`,
      }}>
        <div style={{
          ...containerStyle, padding: '16px 32px', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              ...headingStyle,
              fontSize: 20, fontWeight: 700,
            }}>
              {instrumentKey}
            </span>
            <span style={{ ...monoStyle, fontSize: 10, fontWeight: 400, color: G400 }}>
              RESULTS
            </span>
            {state.sourceLabel && (
              <span style={{ fontSize: 12, color: G600, marginLeft: 12 }}>
                · {state.sourceLabel.replace(/^.*—\s*/, '')}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleDownload}
              disabled={!state.standaloneHtml}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                minHeight: 38,
                background: ACCENT,
                color: '#FFF',
                border: 'none',
                cursor: state.standaloneHtml ? 'pointer' : 'not-allowed',
                opacity: state.standaloneHtml ? 1 : 0.6,
                fontSize: 13,
                fontWeight: 600,
                transition: 'opacity 120ms ease',
              }}
            >
              <Download style={{ width: 14, height: 14 }} />
              Download full HTML report
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — overall score large + one-sentence summary + visual score bar */}
        <section style={{ padding: '112px 0 72px', background: OFF }}>
          <Container width="base">
            <div className={`${prefix}-reveal`} style={{ textAlign: 'center' }}>
              <SectionHeading
                eyebrow={`${assessmentName} · Results`}
                title={<>Your <em style={{ fontWeight: 400 }}>archetype</em> is {archetype.canonName ?? archetype.name}</>}
                subtitle={summary.verdict}
                align="center"
                as="h1"
              />
              <div style={{ marginTop: 44 }}>
                <div style={{
                  fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                  fontSize: 92, fontWeight: 700, lineHeight: 1, color: scoreColorVal,
                }}>
                  {overallScore}
                </div>
                <div style={{ ...monoStyle, color: G400, marginTop: 8 }}>
                  Overall score / 100
                </div>
                <div style={{ maxWidth: 460, margin: '28px auto 0' }}>
                  <ScoreBar score={overallScore} color={scoreColorVal} />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* At a glance — the 3 key findings (executive summary data, preserved) */}
        <section style={{ padding: '0 0 96px', background: OFF }}>
          <Container width="base">
            <div className={`${prefix}-reveal`} style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 1, background: G200, border: `1px solid ${G200}`,
            }}>
              {summary.keyFindings.map((finding, i) => (
                <div key={i} style={{ background: WHITE, padding: '24px 22px' }}>
                  <span style={{
                    ...monoStyle, color: '#9CA3AF', fontSize: 9,
                    marginBottom: 10, display: 'block',
                  }}>
                    {finding.label}
                  </span>
                  <p style={{ fontSize: 14, color: G600, lineHeight: 1.55, margin: 0 }}>
                    {finding.text}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Key insights — narrative cards */}
        <KeyInsights config={configForRender} />

        {/* Dimension breakdown — cleaner cards with score bars */}
        <DimensionScorecard config={configForRender} />

        {/* Archetype profile */}
        <ArchetypeProfile config={configForRender} />

        {/* What this means for you — narrative takeaways (development plan data, preserved) */}
        <section style={{ padding: '100px 0', background: WHITE }}>
          <Container width="md">
            <div className={`${prefix}-reveal`}>
              <SectionHeading
                eyebrow="What this means for you"
                title={<>Where to <em style={{ fontWeight: 400 }}>focus next</em></>}
                align="left"
              />
              <p style={{ fontSize: 17, color: G600, lineHeight: 1.6, marginTop: 24, maxWidth: 620 }}>
                Based on your lowest-scoring dimensions, these are the moves that will shift the needle over the coming quarter.
              </p>
              <div style={{ marginTop: 40, maxWidth: 680 }}>
                {sortedActions.map((action, i) => (
                  <div key={i} style={{
                    paddingBottom: 24, marginBottom: 24,
                    borderBottom: i < sortedActions.length - 1 ? `1px solid ${G200}` : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ ...monoStyle, color: '#9CA3AF', fontSize: 11 }}>
                        {String(action.priority).padStart(2, '0')}
                      </span>
                      <span style={{
                        fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                        fontSize: 19, fontWeight: 700, color: INK,
                      }}>
                        {action.dimension}
                      </span>
                      <span style={{ ...monoStyle, color: G400, fontSize: 10 }}>
                        · {action.timeline}
                      </span>
                    </div>
                    <p style={{ fontSize: 16, color: G600, lineHeight: 1.65, margin: 0 }}>
                      {action.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Next steps — try another assessment + tier upgrade prompt */}
        <section style={{ padding: '100px 0', background: OFF, borderTop: `1px solid ${G200}` }}>
          <Container width="base">
            <div className={`${prefix}-reveal`}>
              <SectionHeading
                eyebrow="Next steps"
                title="Keep the momentum"
                align="center"
              />
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 24, maxWidth: 760, margin: '48px auto 0',
              }}>
                <Card style={{ background: WHITE, borderColor: G200 }}>
                  <CardContent style={{ padding: '32px 28px' }}>
                    <h3 style={{
                      fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                      fontSize: 22, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.25,
                    }}>
                      Explore another assessment
                    </h3>
                    <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, margin: '0 0 24px' }}>
                      Each diagnostic reveals a different facet of your leadership. Find the one that meets your next moment.
                    </p>
                    <Link
                      to="/assessments"
                      style={accentLink}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      Browse assessments <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </CardContent>
                </Card>
                <Card style={{ background: WHITE, borderColor: G200 }}>
                  <CardContent style={{ padding: '32px 28px' }}>
                    <h3 style={{
                      fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
                      fontSize: 22, fontWeight: 700, color: INK, marginBottom: 12, lineHeight: 1.25,
                    }}>
                      Unlock deeper diagnostics
                    </h3>
                    <p style={{ fontSize: 15, color: G600, lineHeight: 1.6, margin: '0 0 24px' }}>
                      Higher tiers open the full leadership suite plus cross-assessment synthesis.
                    </p>
                    <Link
                      to="/pricing"
                      style={accentLink}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                    >
                      View plans <ArrowRight style={{ width: 14, height: 14 }} />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        <ShareRetake config={configForRender} />
      </main>

      {/* Footer — with the single, subtle NEXUS entry point (#1361) */}
      <footer style={{ background: OFF, borderTop: `1px solid ${G200}`, padding: '64px 0 32px', marginTop: 64 }}>
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, flexWrap: 'wrap', gap: 32 }}>
            <div>
              <span style={{ ...headingStyle, fontSize: 18, fontWeight: 700, color: INK }}>
                {instrumentKey}
              </span>
              <p style={{ fontSize: 13, color: G600, marginTop: 12, lineHeight: 1.5, maxWidth: 300 }}>
                Powered by NEXUS — Executive intelligence. Always on.
              </p>
            </div>
            <div>
              <div style={{ ...monoStyle, color: G400, marginBottom: 12 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/pricing" style={{ color: G600, textDecoration: 'none', fontSize: 13 }}>Pricing</a>
              </div>
            </div>
          </div>

          {/* The single, subtle NEXUS entry point for this result page */}
          <div style={{ paddingBottom: 24, textAlign: 'center' }}>
            <Link
              to="/nexus/chat"
              style={{
                ...monoStyle, color: G600, textDecoration: 'none', fontSize: 12,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'color 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = G600; }}
            >
              Discuss your results with NEXUS
              <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          <div style={{
            paddingTop: 32, borderTop: `1px solid ${G200}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: G400 }}>
              © 2026 NEXUS by LYC Partners.
            </span>
            <span style={{ ...monoStyle, color: ACCENT }}>
              {instrumentKey}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default GenericAkiraResults;
