import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Loader2, AlertTriangle } from 'lucide-react';
import {
  AssessmentResults,
  ResultsHero,
  DimensionScorecard,
  ArchetypeProfile,
  KeyInsights,
  DevelopmentPlan,
  ShareRetake,
  NEXUSCTA,
  type AssessmentResultsConfig,
} from './index';
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
  fontFamily: "'Crimson Pro', Georgia, serif",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

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
    const filename = `LYC_${instrumentKey}_Report_${resultId || new Date().toISOString().split('T')[0]}.html`;
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
        <div style={containerStyle}>
          <div style={{ paddingTop: 24 }}>
            <ResultsHero config={configForRender} />
          </div>
          <DimensionScorecard config={configForRender} />
          <ArchetypeProfile config={configForRender} />
          <KeyInsights config={configForRender} />
          <DevelopmentPlan config={configForRender} />
          <NEXUSCTA config={configForRender} />
          <ShareRetake config={configForRender} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: OFF, borderTop: `1px solid ${G200}`, padding: '64px 0 32px', marginTop: 64 }}>
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
            <div>
              <span style={{ ...headingStyle, fontSize: 18, fontWeight: 700, color: INK }}>
                {instrumentKey}
              </span>
              <p style={{ fontSize: 13, color: G600, marginTop: 12, lineHeight: 1.5, maxWidth: 300 }}>
                Part of the LYC Intelligence diagnostic suite. Know where you stand. Know where to go.
              </p>
            </div>
            <div>
              <div style={{ ...monoStyle, color: G400, marginBottom: 12 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/nexus" style={{ color: G600, textDecoration: 'none', fontSize: 13 }}>NEXUS</a>
                <a href="/pricing" style={{ color: G600, textDecoration: 'none', fontSize: 13 }}>Pricing</a>
              </div>
            </div>
          </div>
          <div style={{
            paddingTop: 32, borderTop: `1px solid ${G200}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 12, color: G400 }}>
              © 2026 LYC Intelligence by LYC Partners.
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
