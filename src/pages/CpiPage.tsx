/**
 * CPI Portal Page — China Leadership Pipeline Diagnostic
 *
 * B2C Coaching surface entry point for the CPI assessment.
 * Structure follows ShiftPage.tsx: landing (cards + history) → assessment → results.
 *
 * Flow:
 *   1. Landing: header, dimension overview, archetype preview, start CTA, past results
 *   2. Assessment: renders AssessmentWizard (reused, collects full intake)
 *   3. On completion: persists intake to POST /api/x/cpi/analyze (scoring + LLM narrative + save)
 *   4. Download Report: generates printable HTML via cpiReportRenderer
 */
import { useState, useEffect, useCallback } from 'react';
import { Compass, Globe, Users, Target, Award, ChevronRight, Loader2, Download, Clock, ArrowLeft } from 'lucide-react';
import { AssessmentWizard } from '@/components/assessment/AssessmentWizard';
import { useAuthStore } from '@/stores/authStore';
import { generateCPIReportHTML, type CPIReportData } from '@/services/cpiReportRenderer';
import {
  DIMENSION_INFO,
  DIMENSION_WEIGHTS,
  ARCHETYPE_INFO,
  type DimensionId,
  type CPDArchetype,
  type AssessmentState,
} from '@/services/assessmentEngine';

interface PastResult {
  id: string;
  assessment_type: string;
  assessment_name: string;
  composite_score: number;
  tier_label: string;
  created_at: string;
  metadata?: { archetype?: string };
  dimensions?: Record<string, number>;
}

const DIMENSION_DISPLAY: Array<{ id: DimensionId; icon: typeof Compass; color: string }> = [
  { id: 'strategic_orientation', icon: Compass, color: 'bg-indigo-500' },
  { id: 'cross_border_adaptability', icon: Globe, color: 'bg-blue-500' },
  { id: 'stakeholder_influence', icon: Users, color: 'bg-emerald-500' },
  { id: 'execution_discipline', icon: Target, color: 'bg-amber-500' },
  { id: 'leadership_presence', icon: Award, color: 'bg-rose-500' },
];

const CPI_CREDITS = 5;

export default function CpiPage() {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<'landing' | 'assessment'>('landing');
  const [history, setHistory] = useState<PastResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/x/cpi/results', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setHistory(data.results || []);
      }
    } catch {
      // silent — history is non-critical
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Persist intake to backend on wizard completion
  const handleComplete = async (intake: AssessmentState) => {
    setPersisting(true);
    try {
      const res = await fetch('/api/x/cpi/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLastResult(data.result);
        }
      }
    } catch {
      // non-blocking — local results already shown by wizard
    } finally {
      setPersisting(false);
      loadHistory();
    }
  };

  const handleDownloadReport = () => {
    if (!lastResult) return;
    const dimNames: Record<string, string> = {};
    for (const d of DIMENSION_INFO) dimNames[d.id] = d.name;

    const reportData: CPIReportData = {
      name: user?.name || user?.email || 'Candidate',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      compositeScore: lastResult.composite_score,
      tierLabel: lastResult.tier_label,
      archetype: lastResult.archetype,
      archetypeTagline: ARCHETYPE_INFO[lastResult.archetype as CPDArchetype]?.tagline,
      archetypeDescription: ARCHETYPE_INFO[lastResult.archetype as CPDArchetype]?.description,
      archetypeStrengths: ARCHETYPE_INFO[lastResult.archetype as CPDArchetype]?.strengths,
      archetypeDevelopment: ARCHETYPE_INFO[lastResult.archetype as CPDArchetype]?.development,
      dimensionScores: lastResult.dimension_scores,
      dimensionNames: dimNames,
      crossBorderScore: lastResult.cross_border_score ?? lastResult.dimension_scores?.cross_border_score ?? 0,
      professionalContext: lastResult.professional_context,
      narrative: lastResult.narrative,
    };

    const html = generateCPIReportHTML(reportData);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback: download as .html file
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pipeline_Diagnostic_Report_${Date.now()}.html`;
      a.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // ── Assessment mode ──
  if (mode === 'assessment') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode('landing')}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline Diagnostic
        </button>
        <AssessmentWizard
          prefillEmail={user?.email}
          prefillName={user?.name || user?.email}
          onComplete={handleComplete}
        />
        {persisting && (
          <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 z-50">
            <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
            <span className="text-sm text-slate-600">Saving your results…</span>
          </div>
        )}
        {lastResult && !persisting && (
          <div className="fixed bottom-6 right-6 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-50">
            <span className="text-sm text-slate-600">Results saved</span>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Landing mode ──
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">China Leadership Pipeline Diagnostic</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          A comprehensive executive leadership assessment measuring five critical dimensions of leadership
          capability for cross-border and China-focused roles. Identify your leadership profile and receive
          a personalized development narrative.
        </p>
      </div>

      {/* Start CTA */}
      <div className="bg-gradient-to-r from-fuchsia-600 to-purple-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ready to assess your leadership pipeline readiness?</h2>
            <p className="text-sm text-fuchsia-100 mt-1">
              20 scenario questions + 5 cross-border readiness questions · {CPI_CREDITS} credits
            </p>
          </div>
          <button
            onClick={() => setMode('assessment')}
            className="bg-white text-fuchsia-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-fuchsia-50 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            Start Assessment <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dimension overview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">What the Diagnostic Measures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIMENSION_DISPLAY.map(({ id, icon: Icon, color }) => {
            const info = DIMENSION_INFO[id];
            return (
              <div key={id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className={`${color} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{info.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{info.description}</p>
                    <p className="text-xs text-slate-400 mt-2">Weight: {Math.round(DIMENSION_WEIGHTS[id] * 100)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype preview */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Your Leadership Profile</h2>
        <p className="text-sm text-slate-500 mb-4">
          Based on your dimension scores and cross-border readiness, the diagnostic identifies one of six leadership profiles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(ARCHETYPE_INFO).map((arch) => (
            <div key={arch.name} className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 text-sm">{arch.name}</h3>
              <p className="text-xs text-fuchsia-600 italic mt-1">{arch.tagline}</p>
              <p className="text-xs text-slate-500 mt-2">{arch.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Past results */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Assessment History</h2>
        {loadingHistory ? (
          <div className="flex items-center text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-400">
            No assessments yet. Start your first diagnostic above.
          </p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">{r.composite_score}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.assessment_name}</p>
                    <p className="text-xs text-slate-400">
                      {r.tier_label}
                      {r.metadata?.archetype ? ` · ${r.metadata.archetype}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
