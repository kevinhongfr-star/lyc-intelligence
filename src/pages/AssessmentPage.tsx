import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Loader2, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, ArrowRight } from 'lucide-react';
import { ASSESSMENT_CATALOG, AssessmentInfo, AssessmentDimension, AssessmentStyle, AssessmentArchetype } from '@/assessments/catalog';
import { insertB2CLead, logAssessmentGeneration } from '@/services/supabaseApi';
import { generatePDF } from '@/services/reportGenerator';
import type { AssessmentType, AssessmentReport } from '@/types';

const DS = {
  headingFont: 'Georgia, serif',
  bodyFont: 'Inter, sans-serif',
  accent: '#C108AB',
  accentLight: '#E040C8',
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardHover: '#222222',
  muted: '#888888',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  border: '#333333',
  radius: '12px',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
};

type Step = 'type' | 'gate' | 'questions' | 'style' | 'results';

interface AssessmentState {
  type: AssessmentType;
  name: string;
  email: string;
  ratings: Record<string, number>;
  style: string;
  compositeScore: number;
  archetype: AssessmentArchetype;
  styleName: string;
}

const STEPS: Step[] = ['type', 'gate', 'questions', 'style', 'results'];

export function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [state, setState] = useState<AssessmentState>({
    type: (searchParams.get('type') as AssessmentType) || 'PRISM',
    name: '',
    email: '',
    ratings: {},
    style: '',
    compositeScore: 0,
    archetype: { name: '', description: '', traits: [] },
    styleName: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const catalog: AssessmentInfo = ASSESSMENT_CATALOG[state.type] || ASSESSMENT_CATALOG['PRISM'];
  const currentStepIndex = STEPS.indexOf(step);

  const handleSelectType = (type: AssessmentType) => {
    setState({ ...state, type, ratings: {}, style: '', compositeScore: 0, archetype: { name: '', description: '', traits: [] } });
    setStep('gate');
  };

  const handleGateSubmit = async () => {
    if (!state.name.trim() || !state.email.trim()) {
      setError('Please enter your name and email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    await insertB2CLead({ name: state.name, email: state.email, source: `assessment-${state.type}` });
    setStep('questions');
  };

  const handleRatingChange = (dimensionId: string, rating: number) => {
    setState({ ...state, ratings: { ...state.ratings, [dimensionId]: rating } });
  };

  const canProceedFromQuestions = () => {
    return catalog.dimensions.every(dim => state.ratings[dim.id] != null);
  };

  const handleQuestionsNext = () => {
    if (canProceedFromQuestions()) {
      setStep('style');
    }
  };

  const handleStyleSelect = (style: AssessmentStyle) => {
    setState({ ...state, style: style.id, styleName: style.name });
    calculateResults(style);
  };

  const calculateResults = async (style: AssessmentStyle) => {
    const scores = catalog.dimensions.map(dim => ({
      name: dim.name,
      score: (state.ratings[dim.id] || 3) * 20,
    }));
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    const compositeScore = Math.round(total / scores.length);
    const archetypeIndex = Math.min(
      Math.floor(compositeScore / 25),
      catalog.archetypes.length - 1
    );
    const archetype = catalog.archetypes[archetypeIndex];
    setState(prev => ({ ...prev, compositeScore, archetype, style: style.id, styleName: style.name }));
    setStep('results');
    await logAssessmentGeneration({
      email: state.email,
      toolType: state.type,
      assessmentName: catalog.name,
      archetype: archetype.name,
      compositeScore,
      gateData: { name: state.name, email: state.email, ratings: state.ratings, style: style.id },
    });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const scores: Record<string, number> = {};
      catalog.dimensions.forEach(dim => {
        scores[dim.name] = Math.round((state.ratings[dim.id] || 3) * 20);
      });
      const report: AssessmentReport = {
        title: `${catalog.name} Assessment`,
        summary: `Leadership profile for ${state.name}`,
        sections: catalog.dimensions.map(dim => ({
          heading: dim.name,
          content: `${dim.description} - Score: ${Math.round((state.ratings[dim.id] || 3) * 20)}/100`,
        })),
      };
      await generatePDF(state.type, { scores, archetype: state.archetype.name, percentile: {} }, report, state.name);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setIsGenerating(false);
  };

  const renderProgressBar = () => {
    if (step === 'type') return null;
    const progress = step === 'gate' ? 0.1 : step === 'questions' ? 0.35 : step === 'style' ? 0.6 : step === 'results' ? 1 : 0;
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: DS.muted }}>Step {currentStepIndex} of 4</span>
          <span style={{ fontSize: '12px', color: DS.muted }}>{Math.round(progress * 100)}% complete</span>
        </div>
        <div style={{ height: '4px', background: DS.border, borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: DS.accent, transition: 'width 0.3s' }} />
        </div>
      </div>
    );
  };

  const renderTypeSelection = () => (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '36px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>
            Choose Your Assessment
          </h1>
          <p style={{ fontSize: '16px', color: DS.muted, maxWidth: '500px', margin: '0 auto' }}>
            Select a leadership assessment below to discover your unique strengths and growth opportunities.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {Object.entries(ASSESSMENT_CATALOG).map(([key, info]) => (
            <button
              key={key}
              onClick={() => handleSelectType(key as AssessmentType)}
              style={{
                padding: '24px',
                background: DS.card,
                border: `1px solid ${state.type === key ? DS.accent : DS.border}`,
                borderRadius: DS.radius,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = DS.cardHover}
              onMouseLeave={(e) => e.currentTarget.style.background = DS.card}
            >
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: `${DS.accent}20`,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: DS.accent,
                marginBottom: '12px',
              }}>
                {info.name}
              </div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
                {info.b2cName}
              </h3>
              <p style={{ fontSize: '13px', color: DS.muted, margin: 0, lineHeight: 1.5 }}>
                {info.dimensions.length} key dimensions • {info.styles.length} communication styles
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGate = () => (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <button
          onClick={() => setStep('type')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: DS.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back to assessments
        </button>
        {renderProgressBar()}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px' }}>
          <div style={{ display: 'inline-block', padding: '4px 10px', background: `${DS.accent}20`, borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: DS.accent, marginBottom: '16px' }}>
            {catalog.name}
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
            {catalog.b2cName}
          </h1>
          <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '24px' }}>
            Enter your details to start your personalized assessment
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={state.name}
                onChange={(e) => setState({ ...state, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={state.email}
                onChange={(e) => setState({ ...state, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: DS.bg,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '8px',
                  color: DS.text,
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '44px',
                }}
              />
            </div>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: `${DS.error}15`, borderRadius: '8px', color: DS.error, fontSize: '13px' }}>
                <AlertCircle style={{ width: 16, height: 16 }} />
                {error}
              </div>
            )}
            <button
              onClick={handleGateSubmit}
              style={{
                width: '100%',
                padding: '14px',
                background: DS.accent,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Start Assessment
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuestions = () => (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          onClick={() => setStep('gate')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: DS.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        {renderProgressBar()}
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
          Rate Yourself
        </h1>
        <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '32px' }}>
          For each dimension, rate yourself from 1 (low) to 5 (high)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {catalog.dimensions.map((dim, index) => (
            <div key={dim.id} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: DS.accent, fontWeight: 600 }}>0{index + 1}</span>
                  <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: 0 }}>
                    {dim.name}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>{dim.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: DS.muted }}>{dim.lowLabel}</span>
                <span style={{ fontSize: '12px', color: DS.muted }}>{dim.highLabel}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(dim.id, rating)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: state.ratings[dim.id] === rating ? DS.accent : DS.bg,
                      border: `1px solid ${state.ratings[dim.id] === rating ? DS.accent : DS.border}`,
                      borderRadius: '8px',
                      color: state.ratings[dim.id] === rating ? '#FFFFFF' : DS.textSecondary,
                      fontSize: '16px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      minHeight: '44px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleQuestionsNext}
            disabled={!canProceedFromQuestions()}
            style={{
              padding: '14px 28px',
              background: canProceedFromQuestions() ? DS.accent : DS.muted,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: canProceedFromQuestions() ? 'pointer' : 'not-allowed',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Continue
            <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStyleSelection = () => (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button
          onClick={() => setStep('questions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: DS.muted,
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '24px',
          }}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back
        </button>
        {renderProgressBar()}
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
          Choose Your Communication Style
        </h1>
        <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '32px' }}>
          Select the style that best describes how you communicate and connect with others
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {catalog.styles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style)}
              style={{
                padding: '24px',
                background: DS.card,
                border: `1px solid ${DS.border}`,
                borderRadius: DS.radius,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DS.cardHover;
                e.currentTarget.style.borderColor = DS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = DS.card;
                e.currentTarget.style.borderColor = DS.border;
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>{style.icon}</div>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
                {style.name}
              </h3>
              <p style={{ fontSize: '13px', color: DS.muted, margin: 0, lineHeight: 1.5 }}>
                {style.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResults = () => {
    const selectedStyle = catalog.styles.find(s => s.id === state.style);
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {renderProgressBar()}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: DS.success, margin: '0 auto 16px' }} />
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              Assessment Complete
            </h1>
            <p style={{ fontSize: '14px', color: DS.muted }}>
              Your {catalog.b2cName} results are ready, {state.name}
            </p>
          </div>

          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: DS.muted, marginBottom: '8px' }}>YOUR COMPOSITE SCORE</div>
            <div style={{ fontSize: '72px', fontWeight: 700, color: state.compositeScore >= 70 ? DS.success : state.compositeScore >= 50 ? DS.warning : DS.error, marginBottom: '8px' }}>
              {state.compositeScore}
            </div>
            <div style={{ fontSize: '14px', color: DS.muted }}>out of 100</div>
          </div>

          <div style={{ background: DS.card, border: `1px solid ${DS.accent}40`, borderRadius: DS.radius, padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'inline-block', padding: '4px 10px', background: `${DS.accent}20`, borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: DS.accent, marginBottom: '12px' }}>
              {selectedStyle?.icon} {selectedStyle?.name}
            </div>
            <h2 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>
              {state.archetype.name}
            </h2>
            <p style={{ fontSize: '14px', color: DS.textSecondary, marginBottom: '16px' }}>
              {state.archetype.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {state.archetype.traits.map((trait) => (
                <span key={trait} style={{ padding: '6px 12px', background: DS.bg, borderRadius: '6px', fontSize: '12px', color: DS.textSecondary }}>
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 16px' }}>
              Dimension Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {catalog.dimensions.map((dim) => {
                const score = Math.round((state.ratings[dim.id] || 3) * 20);
                return (
                  <div key={dim.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: DS.text }}>{dim.name}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: score >= 70 ? DS.success : score >= 50 ? DS.warning : DS.error }}>
                        {score}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: DS.bg, borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${score}%`,
                          background: score >= 70 ? DS.success : score >= 50 ? DS.warning : DS.error,
                          borderRadius: '3px',
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '16px',
              background: DS.accent,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.7 : 1,
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
                Generating PDF...
              </>
            ) : (
              <>
                <Download style={{ width: 18, height: 18 }} />
                Download Your Report
              </>
            )}
          </button>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/b2c" style={{ fontSize: '13px', color: DS.accent, textDecoration: 'none' }}>
              Take another assessment
            </a>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  };

  if (step === 'type') return renderTypeSelection();
  if (step === 'gate') return renderGate();
  if (step === 'questions') return renderQuestions();
  if (step === 'style') return renderStyleSelection();
  return renderResults();
}
