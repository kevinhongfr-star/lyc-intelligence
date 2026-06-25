import React, { useState, useEffect } from 'react';
import { authFetch } from '@/utils/authFetch';
import { ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Download, CreditCard, Crown } from 'lucide-react';
import {
  SHIFTAssessmentType,
  SHIFTIntake,
  SHIFTAnalysisResult,
  SHIFT_CONFIGS,
  SHIFTDimension,
} from '../../services/shiftAssessmentTypes';
import { submitSHIFTAssessment } from '../../services/shiftAnalysis';
import { useAuthStore } from '../../stores/authStore';
import { getCreditBalance, spendCredits } from '../../services/creditService';

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
  error: '#DC2626',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

type Step = 'gate' | 'context' | 'dimensions' | 'cross_border' | 'style' | 'goals' | 'results';

export interface SHIFTAssessmentWizardProps {
  assessmentType: SHIFTAssessmentType;
  prefillEmail?: string;
  prefillName?: string;
  onComplete?: (data: SHIFTAnalysisResult) => void;
}

export function SHIFTAssessmentWizard({
  assessmentType,
  prefillEmail,
  prefillName,
  onComplete,
}: SHIFTAssessmentWizardProps) {
  const { user, profile } = useAuthStore();
  const config = SHIFT_CONFIGS[assessmentType];
  
  const [step, setStep] = useState<Step>('gate');
  const [state, setState] = useState<SHIFTIntake>({
    gate: { name: prefillName || '', email: prefillEmail || '' },
    context: { role: '', industry: '', years_experience: 10, challenges: '', improvement_goals: '' },
    dimensions: {},
    evidence: {},
    crossBorder: { cultural_experience: false, international_teams: 0, global_projects: '' },
    style: { disc_profile: null, work_style: '' },
    goals: { short_term: '', long_term: '', success_definition: '' },
  });
  
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SHIFTAnalysisResult | null>(null);
  const [scoringRunId, setScoringRunId] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load credit balance
  useEffect(() => {
    if (user?.id) {
      getCreditBalance(user.id).then(info => {
        if (info) setCreditBalance(info.balance);
      });
    }
  }, [user?.id]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`shift_assessment_${assessmentType}`, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }, [state, assessmentType]);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`shift_assessment_${assessmentType}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Failed to load from localStorage', e);
    }
  }, [assessmentType]);

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.gate.email || !state.gate.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.gate.email)) {
      setError('Please enter a valid email and name');
      return;
    }
    
    // Check credits
    if (user?.id && creditBalance < config.credits) {
      setShowUpgradeModal(true);
      return;
    }
    
    setError(null);
    setStep('context');
  };

  const handleDimensionAnswer = (score: number, evidence: string) => {
    const dim = config.dimensions[currentDimensionIndex];
    setState(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dim.id]: score },
      evidence: { ...prev.evidence, [dim.id]: evidence },
    }));
    
    if (currentDimensionIndex < config.dimensions.length - 1) {
      setCurrentDimensionIndex(prev => prev + 1);
    } else {
      setStep('cross_border');
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Deduct credits first
      if (user?.id) {
        const spendResult = await spendCredits(user.id, config.credits, `shift_assessment_${assessmentType}`);
        if (!spendResult.success) {
          setShowUpgradeModal(true);
          setIsSubmitting(false);
          return;
        }
        setCreditBalance(spendResult.newBalance);
      }
      
      // Submit assessment
      const { result, scoringRunId } = await submitSHIFTAssessment(state, assessmentType, user?.id);
      setAnalysisResult(result);
      setScoringRunId(scoringRunId);
      setStep('results');
      
      if (onComplete) onComplete(result);
    } catch (e: any) {
      console.error('Assessment submission failed:', e);
      setError(e.message || 'Assessment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Generate and download PDF
      const response = await authFetch('/api/scoring/shift/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_type: assessmentType,
          intake: state,
          analysis: analysisResult,
          scoring_run_id: scoringRunId,
        }),
      });
      
      if (!response.ok) throw new Error('PDF generation failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SHIFT_${assessmentType}_Report.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF error', e);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: DS.bg }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '700px', 
        margin: '0 auto', 
        padding: '24px 24px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '4px' }}>
            {config.name}
          </h1>
          <p style={{ color: DS.muted, fontSize: '14px' }}>{config.purpose} · {config.credits} credits</p>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard style={{ width: 16, height: 16, color: DS.accent }} />
            <span style={{ fontSize: '14px', color: DS.textSecondary }}>{creditBalance} credits</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {(['gate', 'context', 'dimensions', 'cross_border', 'style', 'goals', 'results'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step === s || (['gate', 'context', 'dimensions', 'cross_border', 'style', 'goals'].indexOf(step) > i)
                  ? DS.accent
                  : DS.border,
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: '12px', color: DS.muted, textAlign: 'center' }}>
          Step {(['gate', 'context', 'dimensions', 'cross_border', 'style', 'goals', 'results'].indexOf(step) + 1)} of 7
        </p>
      </div>

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

      {/* Step: Gate */}
      {step === 'gate' && (
        <GateStep
          state={state}
          setState={setState}
          onSubmit={handleGateSubmit}
          error={error}
          creditsRequired={config.credits}
          creditBalance={creditBalance}
        />
      )}

      {/* Step: Context */}
      {step === 'context' && (
        <ContextStep
          state={state}
          setState={setState}
          onNext={() => setStep('dimensions')}
          onBack={() => setStep('gate')}
        />
      )}

      {/* Step: Dimensions */}
      {step === 'dimensions' && (
        <DimensionStep
          dimension={config.dimensions[currentDimensionIndex]}
          currentScore={state.dimensions[config.dimensions[currentDimensionIndex].id]}
          currentEvidence={state.evidence[config.dimensions[currentDimensionIndex].id]}
          onAnswer={handleDimensionAnswer}
          onBack={() => {
            if (currentDimensionIndex > 0) {
              setCurrentDimensionIndex(prev => prev - 1);
            } else {
              setStep('context');
            }
          }}
          index={currentDimensionIndex}
          total={config.dimensions.length}
        />
      )}

      {/* Step: Cross-Border */}
      {step === 'cross_border' && (
        <CrossBorderStep
          state={state}
          setState={setState}
          onNext={() => setStep('style')}
          onBack={() => {
            setCurrentDimensionIndex(config.dimensions.length - 1);
            setStep('dimensions');
          }}
        />
      )}

      {/* Step: Style */}
      {step === 'style' && (
        <StyleStep
          state={state}
          setState={setState}
          onNext={() => setStep('goals')}
          onBack={() => setStep('cross_border')}
        />
      )}

      {/* Step: Goals */}
      {step === 'goals' && (
        <GoalsStep
          state={state}
          setState={setState}
          onComplete={handleComplete}
          onBack={() => setStep('style')}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Step: Results */}
      {step === 'results' && analysisResult && (
        <ResultsStep
          assessmentType={assessmentType}
          result={analysisResult}
          intake={state}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={isGeneratingPDF}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          creditsRequired={config.credits}
          currentBalance={creditBalance}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}

// Gate Step Component
function GateStep({ state, setState, onSubmit, error, creditsRequired, creditBalance }: any) {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '28px', marginBottom: '12px' }}>
        Start Your Assessment
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Enter your details to begin. This assessment requires {creditsRequired} credits.
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
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
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
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
            }}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary }}>
            Current Title (optional)
          </label>
          <input
            type="text"
            value={state.gate.title || ''}
            onChange={(e) => setState(prev => ({ ...prev, gate: { ...prev.gate, title: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
            }}
            placeholder="e.g., VP of Engineering"
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
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {creditBalance >= creditsRequired ? (
            <>Start Assessment ({creditsRequired} credits) <ArrowRight /></>
          ) : (
            <>Insufficient Credits - Upgrade Required</>
          )}
        </button>
      </form>
    </div>
  );
}

// Context Step Component
function ContextStep({ state, setState, onNext, onBack }: any) {
  const industries = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Energy', 'Consulting', 'Other'];
  
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Your Professional Context
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Help us personalize your assessment.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary, fontWeight: 500 }}>
            Current Role
          </label>
          <input
            type="text"
            value={state.context.role}
            onChange={(e) => setState(prev => ({ ...prev, context: { ...prev.context, role: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
            }}
            placeholder="e.g., Senior Director, Product Management"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary, fontWeight: 500 }}>
            Industry
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {industries.map((ind) => (
              <button
                key={ind}
                onClick={() => setState(prev => ({ ...prev, context: { ...prev.context, industry: ind } }))}
                style={{
                  padding: '10px 14px',
                  background: state.context.industry === ind ? `${DS.accent}20` : DS.card,
                  border: `1px solid ${state.context.industry === ind ? DS.accent : DS.border}`,
                  borderRadius: '20px',
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary, fontWeight: 500 }}>
            Years of Leadership Experience
          </label>
          <input
            type="number"
            value={state.context.years_experience}
            onChange={(e) => setState(prev => ({ ...prev, context: { ...prev.context, years_experience: parseInt(e.target.value) || 0 } }))}
            style={{
              width: '100px', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
            }}
            min={0}
            max={40}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary, fontWeight: 500 }}>
            What challenges are you currently facing?
          </label>
          <textarea
            value={state.context.challenges}
            onChange={(e) => setState(prev => ({ ...prev, context: { ...prev.context, challenges: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '100px', resize: 'vertical'
            }}
            placeholder="e.g., Leading a team through organizational change, scaling operations..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: DS.textSecondary, fontWeight: 500 }}>
            What do you want to improve through this assessment?
          </label>
          <textarea
            value={state.context.improvement_goals}
            onChange={(e) => setState(prev => ({ ...prev, context: { ...prev.context, improvement_goals: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '100px', resize: 'vertical'
            }}
            placeholder="e.g., Better strategic decision-making, more effective team coaching..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              background: DS.bgAlt,
              color: DS.textSecondary,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${DS.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft /> Back
          </button>
          <button
            onClick={onNext}
            style={{
              flex: 2,
              background: DS.accent,
              color: '#FFFFFF',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Continue <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

// Dimension Step Component
function DimensionStep({ dimension, currentScore, currentEvidence, onAnswer, onBack, index, total }: any) {
  const [score, setScore] = useState(currentScore || 5);
  const [evidence, setEvidence] = useState(currentEvidence || '');

  const handleNext = () => {
    onAnswer(score, evidence);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <p style={{ color: DS.muted, marginBottom: '8px' }}>
        Dimension {index + 1} of {total}: {dimension.name}
      </p>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '20px', marginBottom: '8px' }}>
        {dimension.question}
      </h2>
      <p style={{ color: DS.textSecondary, fontSize: '14px', marginBottom: '24px' }}>
        {dimension.description}
      </p>

      {/* Score Slider */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          {dimension.scaleLabels.map((label: string, i: number) => (
            <span key={i} style={{ fontSize: '12px', color: DS.muted }}>{label}</span>
          ))}
        </div>
        <input
          type="range"
          min={dimension.scaleMin}
          max={dimension.scaleMax}
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value))}
          style={{
            width: '100%',
            accentColor: DS.accent,
          }}
        />
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: DS.accent }}>{score}</span>
          <span style={{ fontSize: '14px', color: DS.muted }}> / 10</span>
        </div>
      </div>

      {/* Evidence Textarea */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
          {dimension.evidencePrompt}
        </label>
        <textarea
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          style={{
            width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '120px', resize: 'vertical'
          }}
          placeholder="Provide a specific example from your experience..."
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            background: DS.bgAlt,
            color: DS.textSecondary,
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '8px',
            border: `1px solid ${DS.border}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft /> Back
        </button>
        <button
          onClick={handleNext}
          style={{
            flex: 2,
            background: DS.accent,
            color: '#FFFFFF',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {index < total - 1 ? 'Next Dimension' : 'Continue'} <ArrowRight />
        </button>
      </div>
    </div>
  );
}

// Cross-Border Step Component
function CrossBorderStep({ state, setState, onNext, onBack }: any) {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Cross-Border Experience
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Understanding your international experience helps contextualize your assessment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Have you worked in cross-cultural environments?
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setState(prev => ({ ...prev, crossBorder: { ...prev.crossBorder, cultural_experience: true } }))}
              style={{
                flex: 1,
                padding: '14px',
                background: state.crossBorder.cultural_experience ? `${DS.accent}20` : DS.card,
                border: `1px solid ${state.crossBorder.cultural_experience ? DS.accent : DS.border}`,
                borderRadius: '8px',
                color: DS.textSecondary,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, crossBorder: { ...prev.crossBorder, cultural_experience: false } }))}
              style={{
                flex: 1,
                padding: '14px',
                background: !state.crossBorder.cultural_experience ? `${DS.accent}20` : DS.card,
                border: `1px solid ${!state.crossBorder.cultural_experience ? DS.accent : DS.border}`,
                borderRadius: '8px',
                color: DS.textSecondary,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              No
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Number of international teams managed
          </label>
          <input
            type="number"
            value={state.crossBorder.international_teams}
            onChange={(e) => setState(prev => ({ ...prev, crossBorder: { ...prev.crossBorder, international_teams: parseInt(e.target.value) || 0 } }))}
            style={{
              width: '100px', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px'
            }}
            min={0}
            max={50}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Describe your global project experience
          </label>
          <textarea
            value={state.crossBorder.global_projects}
            onChange={(e) => setState(prev => ({ ...prev, crossBorder: { ...prev.crossBorder, global_projects: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '100px', resize: 'vertical'
            }}
            placeholder="e.g., Led expansion into APAC market, managed team across 3 time zones..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              background: DS.bgAlt,
              color: DS.textSecondary,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${DS.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft /> Back
          </button>
          <button
            onClick={onNext}
            style={{
              flex: 2,
              background: DS.accent,
              color: '#FFFFFF',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Continue <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

// Style Step Component
function StyleStep({ state, setState, onNext, onBack }: any) {
  const discProfiles = [
    { id: 'D', name: 'Dominance', description: 'Direct, results-focused, decisive' },
    { id: 'I', name: 'Influence', description: 'Enthusiastic, collaborative, optimistic' },
    { id: 'S', name: 'Steadiness', description: 'Patient, reliable, team-oriented' },
    { id: 'C', name: 'Conscientiousness', description: 'Analytical, systematic, quality-focused' },
  ];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Work Style Preferences
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Understanding your work style helps contextualize recommendations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '12px', color: DS.textSecondary, fontWeight: 500 }}>
            Which DISC profile best describes you?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {discProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setState(prev => ({ ...prev, style: { ...prev.style, disc_profile: profile.id as any } }))}
                style={{
                  padding: '16px',
                  background: state.style.disc_profile === profile.id ? `${DS.accent}20` : DS.card,
                  border: `1px solid ${state.style.disc_profile === profile.id ? DS.accent : DS.border}`,
                  borderRadius: '8px',
                  color: DS.textSecondary,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{profile.name} ({profile.id})</div>
                <div style={{ fontSize: '13px', color: DS.muted }}>{profile.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Describe your preferred work style
          </label>
          <textarea
            value={state.style.work_style}
            onChange={(e) => setState(prev => ({ ...prev, style: { ...prev.style, work_style: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '80px', resize: 'vertical'
            }}
            placeholder="e.g., I prefer structured planning with clear milestones..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              background: DS.bgAlt,
              color: DS.textSecondary,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${DS.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft /> Back
          </button>
          <button
            onClick={onNext}
            style={{
              flex: 2,
              background: DS.accent,
              color: '#FFFFFF',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            Continue <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

// Goals Step Component
function GoalsStep({ state, setState, onComplete, onBack, isSubmitting }: any) {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '24px' }}>
      <h2 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '24px', marginBottom: '8px' }}>
        Your Development Goals
      </h2>
      <p style={{ color: DS.muted, marginBottom: '32px' }}>
        Define your goals to personalize recommendations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Short-term goals (6 months)
          </label>
          <textarea
            value={state.goals.short_term}
            onChange={(e) => setState(prev => ({ ...prev, goals: { ...prev.goals, short_term: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '80px', resize: 'vertical'
            }}
            placeholder="e.g., Improve team feedback quality, complete leadership training..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            Long-term goals (2 years)
          </label>
          <textarea
            value={state.goals.long_term}
            onChange={(e) => setState(prev => ({ ...prev, goals: { ...prev.goals, long_term: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '80px', resize: 'vertical'
            }}
            placeholder="e.g., Transition to C-suite role, build board-ready profile..."
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: DS.textSecondary, fontWeight: 500 }}>
            What does success look like for you?
          </label>
          <textarea
            value={state.goals.success_definition}
            onChange={(e) => setState(prev => ({ ...prev, goals: { ...prev.goals, success_definition: e.target.value } }))}
            style={{
              width: '100%', padding: '14px', border: `1px solid ${DS.cardBorder}`, background: DS.card, color: DS.text, borderRadius: '8px', fontSize: '15px', minHeight: '80px', resize: 'vertical'
            }}
            placeholder="e.g., Leading a high-performing team, recognized as industry expert..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: DS.bgAlt,
              color: DS.textSecondary,
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: `1px solid ${DS.border}`,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <ArrowLeft /> Back
          </button>
          <button
            onClick={onComplete}
            disabled={isSubmitting}
            style={{
              flex: 2,
              background: DS.accent,
              color: '#FFFFFF',
              padding: '16px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing...
              </>
            ) : (
              <>
                Complete Assessment <CheckCircle2 />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Results Step Component
function ResultsStep({ assessmentType, result, intake, onDownloadPDF, isGeneratingPDF }: any) {
  const config = SHIFT_CONFIGS[assessmentType];
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `${DS.accent}15`,
          borderRadius: '20px',
          marginBottom: '12px'
        }}>
          <CheckCircle2 style={{ width: 20, height: 20, color: DS.accent }} />
          <span style={{ fontSize: '14px', color: DS.accent, fontWeight: 600 }}>Assessment Complete</span>
        </div>
        <h1 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '32px', marginBottom: '8px' }}>
          {config.name} Results
        </h1>
        <p style={{ color: DS.muted }}>{intake.gate.name} · {intake.context.role}</p>
      </div>

      {/* Composite Score */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: DS.accent, marginBottom: '8px' }}>
          {result.composite_score}
        </div>
        <div style={{ fontSize: '14px', color: DS.muted }}>Composite Score (0-100)</div>
        <div style={{
          marginTop: '16px',
          padding: '12px 24px',
          background: `${DS.accent}10`,
          borderRadius: '20px',
          display: 'inline-block'
        }}>
          <span style={{ fontWeight: 600, color: DS.text }}>{result.archetype}</span>
        </div>
      </div>

      {/* Dimension Scores */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: DS.text, fontSize: '18px', marginBottom: '16px' }}>Dimension Scores</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {config.dimensions.map((dim: SHIFTDimension) => {
            const score = result.dimension_scores[dim.id] || 0;
            const percentage = score;
            
            return (
              <div key={dim.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: DS.textSecondary }}>{dim.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: DS.text }}>{score}</span>
                </div>
                <div style={{
                  height: '8px',
                  background: DS.bgAlt,
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: DS.accent,
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths */}
      <div style={{
        background: '#22C55E10',
        border: '1px solid #22C55E30',
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#22C55E', fontSize: '18px', marginBottom: '16px' }}>Top Strengths</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.strengths.map((s: any, i: number) => (
            <div key={i}>
              <div style={{ fontWeight: 600, color: DS.text, marginBottom: '4px' }}>{s.strength}</div>
              <div style={{ fontSize: '14px', color: DS.textSecondary }}>{s.evidence}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Development Areas */}
      <div style={{
        background: '#EAB30810',
        border: '1px solid #EAB30830',
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: '#EAB308', fontSize: '18px', marginBottom: '16px' }}>Development Areas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.development_areas.map((d: any, i: number) => (
            <div key={i}>
              <div style={{ fontWeight: 600, color: DS.text, marginBottom: '4px' }}>{d.area}</div>
              <div style={{ fontSize: '14px', color: DS.textSecondary }}>{d.example}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: DS.radius,
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h3 style={{ color: DS.text, fontSize: '18px', marginBottom: '16px' }}>Recommendations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {result.recommendations.map((r: string, i: number) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: `${DS.accent}20`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: DS.accent,
                fontWeight: 600,
                fontSize: '12px'
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: '14px', color: DS.textSecondary }}>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={onDownloadPDF}
        disabled={isGeneratingPDF}
        style={{
          width: '100%',
          background: DS.accent,
          color: '#FFFFFF',
          padding: '16px',
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: '8px',
          border: 'none',
          cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
          opacity: isGeneratingPDF ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        {isGeneratingPDF ? (
          <>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
            Generating PDF...
          </>
        ) : (
          <>
            <Download />
            Download Full Report (PDF)
          </>
        )}
      </button>
    </div>
  );
}

// Upgrade Modal Component
function UpgradeModal({ creditsRequired, currentBalance, onClose }: any) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '24px'
    }}>
      <div style={{
        background: DS.card,
        borderRadius: DS.radius,
        maxWidth: '400px',
        width: '100%',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: `${DS.accent}15`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Crown style={{ width: 24, height: 24, color: DS.accent }} />
        </div>
        
        <h3 style={{ fontFamily: DS.headingFont, color: DS.text, fontSize: '20px', marginBottom: '8px' }}>
          Insufficient Credits
        </h3>
        
        <p style={{ color: DS.muted, marginBottom: '16px' }}>
          This assessment requires {creditsRequired} credits. You have {currentBalance} credits.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href="/pricing"
            style={{
              display: 'block',
              background: DS.accent,
              color: '#FFFFFF',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Upgrade to Council
          </a>
          <button
            onClick={onClose}
            style={{
              background: DS.bgAlt,
              color: DS.textSecondary,
              padding: '14px',
              borderRadius: '8px',
              border: `1px solid ${DS.border}`,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}