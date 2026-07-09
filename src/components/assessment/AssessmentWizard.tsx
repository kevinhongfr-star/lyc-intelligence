import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  CPD_SCENARIOS,
  CROSS_BORDER_QUESTIONS,
  AssessmentState,
  WritingStyle,
  ASSESSMENT_ENGINE,
} from '../../services/assessmentEngine';
import { ScenarioQuestion } from './ScenarioQuestion';
import { StyleSelector } from './StyleSelector';
import { ResultsPanel } from './ResultsPanel';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '0px',
  radiusSm: '0px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

type Step = 'gate' | 'context' | 'dimensions' | 'cross_border' | 'style' | 'goals' | 'results';

const TOTAL_DIMENSION_QUESTIONS = CPD_SCENARIOS.length;

export interface AssessmentWizardProps {
  prefillEmail?: string;
  prefillName?: string;
  onComplete?: (data: any) => void;
}

export function AssessmentWizard({ prefillEmail, prefillName, onComplete }: AssessmentWizardProps) {
  const [step, setStep] = useState<Step>('gate');
  const [state, setState] = useState<AssessmentState>({
    gate: { name: prefillName || '', email: prefillEmail || '' },
    professionalContext: { situation: 'senior_leader' as const, geography: 'single_market' as const, function: 'Other' as const },
    dimensions: {},
    crossBorderQuestions: {},
    writingStyle: 'pragmatic',
    careerGoals: [],
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentCrossBorderIndex, setCurrentCrossBorderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [dimensionScores, setDimensionScores] = useState<any>(null);
  const [compositeScore, setCompositeScore] = useState<number>(0);
  const [archetype, setArchetype] = useState<any>('Precision Operator');
  const [crossBorderScore, setCrossBorderScore] = useState<number>(0);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('assessmentState', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [state]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assessmentState');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load from localStorage', e);
    }
  }, []);

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.gate.email || !state.gate.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.gate.email)) {
      setError('Please enter a valid email and name');
      return;
    }
    setError(null);
    setStep('context');
  };

  const answerDimensionQuestion = (score: number) => {
    const questionId = CPD_SCENARIOS[currentQuestionIndex].id;
    setState(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [questionId]: score }
    }));
    if (currentQuestionIndex < TOTAL_DIMENSION_QUESTIONS - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('cross_border');
    }
  };

  const answerCrossBorderQuestion = (score: number) => {
    const questionId = CROSS_BORDER_QUESTIONS[currentCrossBorderIndex].id;
    setState(prev => ({
      ...prev,
      crossBorderQuestions: { ...prev.crossBorderQuestions, [questionId]: score }
    }));
    if (currentCrossBorderIndex < CROSS_BORDER_QUESTIONS.length - 1) {
      setCurrentCrossBorderIndex(prev => prev + 1);
    } else {
      setStep('style');
    }
  };

  const goNext = (nextStep: Step) => {
    setStep(nextStep);
  };

  const calculateAndShowResults = () => {
    const dimScores = ASSESSMENT_ENGINE.getDimensionScores(state.dimensions);
    const cbScore = ASSESSMENT_ENGINE.calculateCrossBorderScore(state.crossBorderQuestions);
    const compScore = ASSESSMENT_ENGINE.getCompositeScore(dimScores, cbScore);
    const arch = ASSESSMENT_ENGINE.getArchetype(dimScores, cbScore);

    setDimensionScores(dimScores);
    setCrossBorderScore(cbScore);
    setCompositeScore(compScore);
    setArchetype(arch);
    setStep('results');
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('PDF downloaded! (demo version)');
    } catch (e) {
      console.error('PDF error', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: DS.bg }}>
      {error && (
        <div style={{
          maxWidth: '600px',
          margin: '24px auto',
          background: `${DS.error}20`,
          border: `1px solid ${DS.error}40`,
          borderRadius: DS.radius,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle style={{ width: 20, height: 20, color: DS.error }} />
          <span style={{ color: DS.text }}>{error}</span>
        </div>
      )}
      {/* Step: {step} */}
      {/* Render Step */}
      {step === 'gate' && (
        <GateStep state={state} setState={setState} onSubmit={handleGateSubmit} error={error} />
      )}
      {step === 'context' && (
        <ContextStep state={state} setState={setState} onNext={() => setStep('dimensions')} />
      )}
      {step === 'dimensions' && (
        <div style={{ padding: '24px' }}>
          <ScenarioQuestion
            question={CPD_SCENARIOS[currentQuestionIndex]}
            currentAnswer={state.dimensions[CPD_SCENARIOS[currentQuestionIndex].id]}
            onAnswer={answerDimensionQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={TOTAL_DIMENSION_QUESTIONS}
          />
        </div>
      )}
      {step === 'cross_border' && (
        <CrossBorderStep
          state={state}
          setState={setState}
          index={currentCrossBorderIndex}
          onAnswer={answerCrossBorderQuestion}
        />
      )}
      {step === 'style' && (
        <div style={{ padding: '24px' }}>
          <StyleSelector
            selectedStyle={state.writingStyle}
            onSelect={(style) => {
              setState(prev => ({ ...prev, writingStyle: style }));
              goNext('goals');
            }}
          />
          <button
            onClick={() => goNext('goals')}
            style={{
              marginTop: '24px',
              width: '100%',
              background: DS.accent,
              color: '#FFFFFF',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '0px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            Continue <ArrowRight />
          </button>
        </div>
      )}
      {step === 'goals' && (
        <CareerGoalsStep
          state={state}
          setState={setState}
          onComplete={() => {
            calculateAndShowResults();
            if (onComplete) onComplete(state);
          }}
        />
      )}
      {step === 'results' && dimensionScores && (
        <div style={{ padding: '24px' }}>
          <ResultsPanel
            compositeScore={compositeScore}
            dimensionScores={dimensionScores}
            crossBorderScore={crossBorderScore}
            archetype={archetype}
            onDownloadPDF={handleDownloadPDF}
            isGeneratingPDF={isGeneratingPDF}
          />
        </div>
      )}
    </div>
  );
}

function GateStep({ state, setState, onSubmit, error }: any) {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '28px', marginBottom: '12px' }}>
        Let's get started
      </h1>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Enter your details to start your assessment.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary }}>
          Name
          </label>
          <input
            type="text"
            value={state.gate.name}
            onChange={(e) => setState(prev => ({ ...prev, gate: { ...prev.gate, name: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '0px', fontSize: '15px'
            }}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary }}>
          Email
          </label>
          <input
            type="email"
            value={state.gate.email}
            onChange={(e) => setState(prev => ({ ...prev, gate: { ...prev.gate, email: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '0px', fontSize: '15px'
            }}
            placeholder="you@company.com"
          />
        </div>
        {error && <p style={{ color: DS.error, fontSize: '14px' }}>{error}</p>}
        <button
          type="submit"
          style={{
            width: '100%',
            background: DS.accent,
            color: '#FFFFFF',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: '0px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          Start Assessment <ArrowRight />
        </button>
      </form>
    </div>
  );
}

function ContextStep({ state, setState, onNext }: any) {
  const careerSituations = [
    { id: 'senior_leader', label: 'Senior leader not actively looking' },
    { id: 'actively_seeking', label: 'Actively seeking new opportunities' },
    { id: 'recently_transitioned', label: 'Recently transitioned' },
    { id: 'building_board', label: 'Building towards board roles' },
  ];
  const careerGeographies = [
    { id: 'europe_to_apac', label: 'Europe → APAC' },
    { id: 'apac_to_europe', label: 'APAC → Europe' },
    { id: 'already_cross_border', label: 'Already cross-border' },
    { id: 'single_market', label: 'Single market focus' },
  ];
  const functions = ['CEO', 'CFO', 'CTO', 'CHRO', 'CMO', 'COO', 'General Counsel', 'Board', 'Other'];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Your Professional Context
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Help us personalize your experience.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h3 style={{ color: DS.text, fontSize: '16px', marginBottom: '12px' }}>
            Current situation
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {careerSituations.map((s) => (
              <button
                key={s.id}
                onClick={() => setState(prev => ({ ...prev, professionalContext: { ...prev.professionalContext, situation: s.id } }))}
                style={{
                  padding: '12px',
                  background: state.professionalContext.situation === s.id ? `${DS.accent}20` : DS.card,
                  border: `1px solid ${state.professionalContext.situation === s.id ? DS.accent : DS.border}`,
                  borderRadius: DS.radius,
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ color: DS.text, fontSize: '16px', marginBottom: '12px' }}>
            Career geography
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {careerGeographies.map((g) => (
              <button
                key={g.id}
                onClick={() => setState(prev => ({ ...prev, professionalContext: { ...prev.professionalContext, geography: g.id } }))}
                style={{
                  padding: '12px',
                  background: state.professionalContext.geography === g.id ? `${DS.accent}20` : DS.card,
                  border: `1px solid ${state.professionalContext.geography === g.id ? DS.accent : DS.border}`,
                  borderRadius: DS.radius,
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ color: DS.text, fontSize: '16px', marginBottom: '12px' }}>
            Primary function
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {functions.map((f) => (
              <button
                key={f}
                onClick={() => setState(prev => ({ ...prev, professionalContext: { ...prev.professionalContext, function: f } }))}
                style={{
                  padding: '10px 14px',
                  background: state.professionalContext.function === f ? `${DS.accent}20` : DS.card,
                  border: `1px solid ${state.professionalContext.function === f ? DS.accent : DS.border}`,
                  borderRadius: '20px',
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onNext}
          style={{
            width: '100%',
            background: DS.accent,
            color: '#FFFFFF',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            borderRadius: DS.radius,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px'
          }}
        >
          Continue <ArrowRight />
        </button>
      </div>
    </div>
  );
}

function CrossBorderStep({ state, setState, index, onAnswer }: any) {
  const question = CROSS_BORDER_QUESTIONS[index];
  const currentScore = state.crossBorderQuestions[question.id];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <p style={{ color: DS.muted, marginBottom: '8px' }}>
        Cross-Border Readiness: {index + 1}/{CROSS_BORDER_QUESTIONS.length}
      </p>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '20px', marginBottom: '24px' }}>
        {question.question}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.options.map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => onAnswer(opt.score)}
            style={{
              width: '100%',
              padding: '16px',
              background: currentScore === opt.score ? `${DS.accent}20` : DS.card,
              border: `1px solid ${currentScore === opt.score ? DS.accent : DS.border}`,
              borderRadius: DS.radius,
              color: DS.textSecondary,
              textAlign: 'left',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CareerGoalsStep({ state, setState, onComplete }: any) {
  const allGoals = [
    'Land target role', 'Build thought leadership', 'Board presence',
    'Cross-border credentials', 'Negotiate offer', 'Internal transition',
    'Geography move', 'Build team capability'
  ];
  const [selected, setSelected] = useState<string[]>(state.careerGoals || []);

  const toggleGoal = (g: string) => {
    if (selected.includes(g)) {
      setSelected(selected.filter(gg => gg !== g));
    } else {
      setSelected([...selected, g]);
    }
  };

  const handleContinue = () => {
    setState(prev => ({ ...prev, careerGoals: selected }));
    onComplete();
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Career Goals
      </h2>
      <p style={{ color: DS.muted, marginBottom: '24px' }}>
        Select up to two goals most relevant to you.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        {allGoals.map((g) => (
          <button
            key={g}
            onClick={() => toggleGoal(g)}
            style={{
              padding: '14px 16px',
              background: selected.includes(g) ? `${DS.accent}20` : DS.card,
              border: `1px solid ${selected.includes(g) ? DS.accent : DS.border}`,
              borderRadius: DS.radius,
              color: DS.textSecondary,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {g}
          </button>
        ))}
      </div>
      <button
        onClick={handleContinue}
        style={{
          width: '100%',
          marginTop: '24px',
          background: DS.accent,
          color: '#FFFFFF',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: DS.radius,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        Complete Assessment <CheckCircle2 />
      </button>
    </div>
  );
}
