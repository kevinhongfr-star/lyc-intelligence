import { useState, useEffect, useCallback } from 'react';
import { Brain, Target, Zap, Users, TrendingUp, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { SHIFTAssessmentWizard } from '@/components/assessment/SHIFTAssessmentWizard';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import type { SHIFTAssessmentType } from '@/services/shiftAssessmentTypes';

interface DiagnosticCard {
  type: SHIFTAssessmentType;
  name: string;
  purpose: string;
  miles: number;
  icon: typeof Brain;
  color: string;
}

const DIAGNOSTICS: DiagnosticCard[] = [
  { type: 'LEAP', name: 'Learning & Execution Potential', purpose: 'Strategic clarity', miles: 3, icon: Brain, color: 'bg-indigo-500' },
  { type: 'QUEST', name: 'Questioning & Inquiry Skills', purpose: 'Inquiry capability', miles: 3, icon: Target, color: 'bg-blue-500' },
  { type: 'DRIVE', name: 'Execution & Delivery Capability', purpose: 'Change management', miles: 3, icon: Zap, color: 'bg-amber-500' },
  { type: 'COACH', name: 'Coaching & Leadership Development', purpose: 'Team development', miles: 3, icon: Users, color: 'bg-emerald-500' },
  { type: 'IMPACT', name: 'Influence & Executive Presence', purpose: 'Composite across all SHIFT', miles: 5, icon: TrendingUp, color: 'bg-rose-500' },
];

interface PastResult {
  id: string;
  assessment_type: string;
  assessment_name: string;
  composite_score: number;
  tier_label: string;
  created_at: string;
  metadata?: { archetype?: string };
}

export default function ShiftPage() {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<SHIFTAssessmentType | null>(null);
  const [history, setHistory] = useState<PastResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/x/shift/results', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setHistory(data.results || []);
      }
    } catch {
      // silent fail — history is non-critical
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          ← Back to SHIFT Suite
        </button>
        <SHIFTAssessmentWizard
          assessmentType={selected}
          prefillEmail={user?.email}
          prefillName={user?.name || user?.email}
          onComplete={() => {
            loadHistory();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO title="SHIFT Suite — 5 Leadership Assessments | LYC Intelligence" description="Five-instrument suite measuring learning, execution, inquiry, coaching, and impact. Each diagnostic takes 10 minutes. 99-149 miles per assessment. Part of the LYC Intelligence platform." path="/assessment/shift" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">SHIFT Suite</h1>
        <p className="text-sm text-slate-500 mt-1">
          Five leadership diagnostics to assess and develop executive capability.
        </p>
      </div>

      {/* Diagnostic cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIAGNOSTICS.map((d) => {
          const Icon = d.icon;
          return (
            <div
              key={d.type}
              className="bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelected(d.type)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${d.color} w-10 h-10 flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-400">{d.miles} mi</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{d.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{d.purpose}</p>
              <div className="mt-4 flex items-center text-xs text-indigo-600 font-medium">
                Take Assessment <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          );
        })}
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
            No assessments yet. Take your first SHIFT diagnostic above.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 divide-y divide-slate-100">
            {history.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-600">
                      {r.composite_score}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.assessment_name}</p>
                    <p className="text-xs text-slate-400">
                      {r.assessment_type} · {r.tier_label}
                      {r.metadata?.archetype ? `· ${r.metadata.archetype}` : ''}
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
