/**
 * DexAssessPage — Complimentary leadership assessment (S2-T04)
 *
 * 10-question self-assessment across 5 leadership dimensions. Computes a
 * composite score and archetype, then persists results via saveAssessment().
 * Brand rule: NEVER "free assessment" — always "Complimentary assessment".
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { Button, Card, CardContent, Progress } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { saveAssessment } from '@/services/supabaseApi';

type Dimension = 'vision' | 'execution' | 'influence' | 'adaptability' | 'judgment';

interface Question {
  id: string;
  dimension: Dimension;
  text: string;
}

const DIMENSION_LABELS: Record<Dimension, string> = {
  vision: 'Strategic Vision',
  execution: 'Execution Discipline',
  influence: 'Executive Influence',
  adaptability: 'Adaptability',
  judgment: 'Judgment & Decisiveness',
};

const QUESTIONS: Question[] = [
  { id: 'q1', dimension: 'vision', text: 'I can clearly articulate where my organization should be in 3-5 years.' },
  { id: 'q2', dimension: 'vision', text: 'I regularly scan market signals to anticipate industry shifts before they happen.' },
  { id: 'q3', dimension: 'execution', text: 'I translate strategy into concrete, measurable plans that my team delivers on.' },
  { id: 'q4', dimension: 'execution', text: 'I hold myself and others accountable to commitments without exception.' },
  { id: 'q5', dimension: 'influence', text: 'I can persuade senior stakeholders even when I lack formal authority.' },
  { id: 'q6', dimension: 'influence', text: 'I am sought out as a mentor by leaders across my organization.' },
  { id: 'q7', dimension: 'adaptability', text: 'I adjust my approach quickly when circumstances change unexpectedly.' },
  { id: 'q8', dimension: 'adaptability', text: 'I am comfortable operating across cultures, geographies, and functions.' },
  { id: 'q9', dimension: 'judgment', text: 'I make timely decisions even with incomplete information.' },
  { id: 'q10', dimension: 'judgment', text: 'My past strategic calls have generally proven correct in hindsight.' },
];

const SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

interface Archetype {
  name: string;
  blurb: string;
}

function archetypeFor(composite: number): Archetype {
  if (composite >= 4.2) return { name: 'Visionary Architect', blurb: 'You combine bold vision with the discipline to execute. Boards and founders seek you out to build the future.' };
  if (composite >= 3.6) return { name: 'Strategic Operator', blurb: 'You turn strategy into results. You are the leader who makes the plan real and ships.' };
  if (composite >= 3.0) return { name: 'Influential Connector', blurb: 'You lead through people and persuasion. You build coalitions and rally teams around a cause.' };
  if (composite >= 2.4) return { name: 'Emerging Leader', blurb: 'You have strong foundations and clear growth areas. Targeted development will accelerate your trajectory.' };
  return { name: 'Builder in Progress', blurb: 'You are early in your leadership journey. Focus on building self-awareness and one dimension at a time.' };
}

interface AssessmentResult {
  composite: number;
  scores: Record<Dimension, number>;
  archetype: Archetype;
}

export function DexAssessPage() {
  const user = useAuthStore(s => s.user);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === QUESTIONS.length;
  const progress = (answeredCount / QUESTIONS.length) * 100;

  const email = user?.email ?? null;

  const computeResults = useMemo(() => {
    const scores: Record<Dimension, number> = {
      vision: 0, execution: 0, influence: 0, adaptability: 0, judgment: 0,
    };
    const counts: Record<Dimension, number> = {
      vision: 0, execution: 0, influence: 0, adaptability: 0, judgment: 0,
    };
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (a != null) {
        scores[q.dimension] += a;
        counts[q.dimension] += 1;
      }
    }
    (Object.keys(scores) as Dimension[]).forEach(d => {
      scores[d] = counts[d] > 0 ? scores[d] / counts[d] : 0;
    });
    const composite =
      (scores.vision + scores.execution + scores.influence + scores.adaptability + scores.judgment) / 5;
    return { scores, composite };
  }, [answers]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!email) {
      setError('Please sign in to save your assessment.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { scores, composite } = computeResults;
    const archetype = archetypeFor(composite);
    const ok = await saveAssessment({
      email,
      assessmentType: 'dex_leadership_self',
      answers,
      scores,
      archetype: archetype.name,
      compositeScore: composite,
    });
    setSubmitting(false);
    if (!ok) {
      setError('Could not save your assessment. Please try again.');
      return;
    }
    setResult({ composite, scores, archetype });
  };

  // ── Results view ──
  if (result) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
          <a href="/dex" className="flex items-center gap-1 text-sm text-gray-500 hover:text-fuchsia mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to DEX
          </a>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-fuchsia/10 text-fuchsia flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1
              className="text-3xl font-bold text-[#1A1A2E] mb-2"
              style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
            >
              Your Leadership Archetype
            </h1>
            <div className="text-fuchsia font-semibold text-xl">{result.archetype.name}</div>
          </div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-sm text-gray-700 leading-relaxed mb-6">{result.archetype.blurb}</p>
              <div className="space-y-4">
                {(Object.keys(result.scores) as Dimension[]).map(d => (
                  <div key={d}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{DIMENSION_LABELS[d]}</span>
                      <span className="font-semibold text-[#1A1A2E]">{result.scores[d].toFixed(1)} / 5</span>
                    </div>
                    <Progress value={(result.scores[d] / 5) * 100} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Composite Score</div>
                <div className="text-3xl font-bold text-fuchsia">{result.composite.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/dex/plan"><Button>View Your Development Plan <ArrowRight className="w-4 h-4" /></Button></a>
            <a href="/dex/chat"><Button variant="outline">Discuss with DEX AI</Button></a>
          </div>
        </div>
      </div>
    );
  }

  // ── Questionnaire view ──
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <a href="/dex" className="flex items-center gap-1 text-sm text-gray-500 hover:text-fuchsia mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to DEX
        </a>
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia/10 text-fuchsia text-xs font-semibold uppercase tracking-wide mb-3">
            <Sparkles className="w-3 h-3" /> Complimentary Assessment
          </div>
          <h1
            className="text-3xl font-bold text-[#1A1A2E] mb-2"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Executive Leadership Self-Assessment
          </h1>
          <p className="text-sm text-gray-600">
            Ten questions across five leadership dimensions. Your results shape a personalized development plan.
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{answeredCount} of {QUESTIONS.length} answered</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          {QUESTIONS.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-xs font-semibold text-gray-400 mt-0.5">{idx + 1}</span>
                  <p className="text-sm text-gray-800 flex-1">{q.text}</p>
                  {answers[q.id] != null && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {SCALE.map(opt => {
                    const active = answers[q.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          active
                            ? 'bg-fuchsia text-white border-fuchsia'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-fuchsia/40'
                        }`}
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting} size="lg">
            {submitting ? 'Saving…' : 'Submit & See Results'} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DexAssessPage;
