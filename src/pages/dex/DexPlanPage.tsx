/**
 * DexPlanPage — Personalized development plan (S2-T05)
 *
 * Reads the user's most recent assessment via getAssessmentsByEmail(),
 * derives an archetype-based plan with milestones, and tracks progress
 * in localStorage.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Target, CheckCircle2, Circle, Sparkles, BookOpen } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getAssessmentsByEmail } from '@/services/supabaseApi';

type Dimension = 'vision' | 'execution' | 'influence' | 'adaptability' | 'judgment';

interface SavedAssessment {
  archetype?: string | null;
  composite_score?: number | null;
  scores?: string | Record<string, number> | null;
  created_at?: string | null;
}

interface DevPlan {
  summary: string;
  actions: string[];
}

interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

const DIMENSION_ACTIONS: Record<Dimension, string> = {
  vision: 'Publish one thought-leadership piece on your 3-5 year industry thesis.',
  execution: 'Lead one cross-functional initiative end-to-end this quarter.',
  influence: 'Mentor two emerging leaders and seek 360 feedback on your presence.',
  adaptability: 'Take on a stretch assignment outside your comfort zone or function.',
  judgment: 'Document and review your major decisions quarterly to sharpen pattern recognition.',
};

const ARCHETYPE_PLANS: Record<string, DevPlan> = {
  'Visionary Architect': {
    summary: 'You are a rare blend of vision and execution. Sharpen your ability to bring others along and operationalize at scale.',
    actions: [
      'Build a personal board of advisors to pressure-test your vision.',
      'Delegate execution depth to trusted operators so you can stay at the frontier.',
      'Codify your strategic framework into a repeatable playbook.',
    ],
  },
  'Strategic Operator': {
    summary: 'You deliver results. The next lever is elevating your strategic narrative and building influence at the board level.',
    actions: [
      'Develop and communicate a compelling 3-year strategic story.',
      'Invest in executive presence coaching for board and investor settings.',
      'Carve out deliberate thinking time to move from reactive to proactive strategy.',
    ],
  },
  'Influential Connector': {
    summary: 'You lead through people. Strengthen your execution systems to convert influence into measurable outcomes.',
    actions: [
      'Implement rigorous OKR or operating-rhythm frameworks in your team.',
      'Take ownership of a P&L or hard delivery target to build execution credibility.',
      'Deepen one technical domain to round out your generalist profile.',
    ],
  },
  'Emerging Leader': {
    summary: 'You have strong foundations. Focus on one high-impact dimension to accelerate your trajectory.',
    actions: [
      'Pick your weakest dimension and dedicate 90 days to deliberate practice.',
      'Seek a sponsor (not just a mentor) who will advocate for your next role.',
      'Lead a visible, stretch project to build your track record.',
    ],
  },
  'Builder in Progress': {
    summary: 'You are building the foundations of leadership. Start with self-awareness and one dimension at a time.',
    actions: [
      'Complete a 360 feedback review to establish your baseline.',
      'Focus on your strongest dimension first to build confidence and momentum.',
      'Find an accountability partner for weekly leadership reflections.',
    ],
  },
};

const DEFAULT_PLAN: DevPlan = {
  summary: 'Complete the complimentary assessment to unlock a personalized development plan.',
  actions: ['Take the Executive Leadership Self-Assessment.'],
};

function parseScores(raw: string | Record<string, number> | null | undefined): Record<Dimension, number> {
  const empty: Record<Dimension, number> = { vision: 0, execution: 0, influence: 0, adaptability: 0, judgment: 0 };
  if (!raw) return empty;
  if (typeof raw === 'string') {
    try { return { ...empty, ...(JSON.parse(raw) as Record<string, number>) }; } catch { return empty; }
  }
  return { ...empty, ...(raw as Record<string, number>) };
}

export function DexPlanPage() {
  const user = useAuthStore(s => s.user);
  const [assessment, setAssessment] = useState<SavedAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('dex_plan_milestones') || '{}'); } catch { return {}; }
  });

  const email = user?.email ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!email) { setLoading(false); return; }
      try {
        const rows = await getAssessmentsByEmail(email);
        if (cancelled) return;
        setAssessment((rows[0] as SavedAssessment) ?? null);
      } catch (e) {
        console.warn('[DexPlanPage] load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [email]);

  useEffect(() => {
    try { localStorage.setItem('dex_plan_milestones', JSON.stringify(milestones)); } catch { /* ignore */ }
  }, [milestones]);

  const plan: DevPlan = useMemo(() => {
    const archetype = assessment?.archetype;
    if (archetype && ARCHETYPE_PLANS[archetype]) return ARCHETYPE_PLANS[archetype];
    return DEFAULT_PLAN;
  }, [assessment]);

  const weakest: [Dimension, number] | null = useMemo(() => {
    const scores = parseScores(assessment?.scores);
    let weakestDim: Dimension = 'vision';
    let weakestVal = 6;
    (Object.keys(scores) as Dimension[]).forEach(d => {
      if (scores[d] > 0 && scores[d] < weakestVal) { weakestVal = scores[d]; weakestDim = d; }
    });
    return weakestVal < 6 ? [weakestDim, weakestVal] : null;
  }, [assessment]);

  const milestoneList: Milestone[] = useMemo(() => {
    const list: Milestone[] = plan.actions.map((a, i) => ({
      id: `act-${i}`,
      label: a,
      done: !!milestones[`act-${i}`],
    }));
    if (weakest) {
      list.push({
        id: 'weak-dim',
        label: `Focus area (${weakest[0]}): ${DIMENSION_ACTIONS[weakest[0]] ?? 'Strengthen this dimension with deliberate practice.'}`,
        done: !!milestones['weak-dim'],
      });
    }
    return list;
  }, [plan, weakest, milestones]);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = milestoneList.filter(m => m.done).length;

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Loading your plan…</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <a href="/dex-ai" className="flex items-center gap-1 text-sm text-gray-500 hover:text-fuchsia mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to DEX
        </a>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia/10 text-fuchsia text-xs font-semibold uppercase tracking-wide mb-3">
            <Target className="w-3 h-3" /> Development Plan
          </div>
          <h1
            className="text-3xl font-bold text-[#1A1A2E] mb-2"
            style={{ fontFamily: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif" }}
          >
            Your Personalized Growth Path
          </h1>
          {assessment?.archetype && (
            <Badge className="bg-fuchsia/10 text-fuchsia border-fuchsia/20">{assessment.archetype}</Badge>
          )}
        </div>

        {/* Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-fuchsia flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">{plan.summary}</p>
            </div>
            {assessment?.composite_score != null && (
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Composite</div>
                  <div className="text-2xl font-bold text-fuchsia">{assessment.composite_score.toFixed(2)}</div>
                </div>
                {weakest && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Focus Dimension</div>
                    <div className="text-sm font-semibold text-[#1A1A2E] capitalize">{weakest[0]}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-[#1A1A2E]">Action Milestones</h3>
              </div>
              <span className="text-xs text-gray-500">{completedCount} / {milestoneList.length} done</span>
            </div>
            <div className="space-y-2">
              {milestoneList.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMilestone(m.id)}
                  className="flex items-start gap-3 w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  {m.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${m.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {!assessment && (
          <div className="flex justify-center">
            <a href="/dex/assess"><Button>Take the Assessment <ArrowRight className="w-4 h-4" /></Button></a>
          </div>
        )}
        {assessment && (
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/dex/chat"><Button>Discuss with DEX AI <ArrowRight className="w-4 h-4" /></Button></a>
            <a href="/dex/book"><Button variant="outline">Book a Coaching Session</Button></a>
          </div>
        )}
      </div>
    </div>
  );
}

export default DexPlanPage;
