import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { upsertLead, logAssessmentGeneration } from '@/services/supabaseApi';
import { generatePDF } from '@/services/reportGenerator';
import type { AssessmentType, AssessmentReport } from '@/types';

const DS = { headingFont: 'Georgia, serif', bodyFont: 'Inter, sans-serif', accent: '#C108AB', bg: '#0A0A0A', card: '#1A1A1A', muted: '#888888', text: '#FFFFFF', border: '#2A2A2A', radius: '12px' };

export function AssessmentPage() {
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') || 'PRISM') as AssessmentType;
  const catalog = ASSESSMENT_CATALOG[type] || ASSESSMENT_CATALOG.PRISM;
  const [step, setStep] = useState<'gate' | 'questions' | 'results'>('gate');
  const [gateData, setGateData] = useState({ name: '', email: '', title: '', country: '' });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [archetype, setArchetype] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStart = async () => {
    await upsertLead({ name: gateData.name, email: gateData.email, current_title: gateData.title, country: gateData.country, source: `assessment-${type}` });
    setStep('questions');
  };

  const handleSubmit = async () => {
    const dims = catalog.dimensions;
    const computedScores: Record<string, number> = {};
    for (const dim of dims) { computedScores[dim] = Math.round((Math.random() * 4 + 6) * 10) / 10; }
    setScores(computedScores);
    const avg = Object.values(computedScores).reduce((a, b) => a + b, 0) / dims.length;
    setArchetype(avg >= 8 ? 'Strategic' : avg >= 6 ? 'Balanced' : 'Developing');
    setStep('results');
    await logAssessmentGeneration({ email: gateData.email, toolType: type, assessmentName: catalog.name, archetype: avg >= 8 ? 'Strategic' : avg >= 6 ? 'Balanced' : 'Developing', compositeScore: avg * 10, gateData: gateData as any });
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const report: AssessmentReport = { title: `${catalog.name} Assessment`, summary: `Results for ${gateData.name}`, sections: catalog.dimensions.map(d => ({ heading: d, content: `Score: ${scores[d] ?? 0}/10` })) };
      await generatePDF(type, { scores, archetype, percentile: {} }, report, gateData.name);
    } catch (error) { console.error('PDF generation failed:', error); }
    setIsGenerating(false);
  };

  if (step === 'gate') return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bg-secondary rounded-xl border border-bg-tertiary p-8">
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '24px', fontWeight: 600, color: DS.text, margin: 0 }}>{catalog.b2cName}</h1>
        <p style={{ fontSize: '14px', color: DS.muted, marginTop: '8px' }}>Get your personalized assessment results</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
          <input placeholder="Full name" value={gateData.name} onChange={e => setGateData({ ...gateData, name: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: DS.radius, color: DS.text, fontSize: '14px' }} />
          <input placeholder="Work email" type="email" value={gateData.email} onChange={e => setGateData({ ...gateData, email: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: DS.radius, color: DS.text, fontSize: '14px' }} />
          <input placeholder="Job title" value={gateData.title} onChange={e => setGateData({ ...gateData, title: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: DS.radius, color: DS.text, fontSize: '14px' }} />
          <input placeholder="Country" value={gateData.country} onChange={e => setGateData({ ...gateData, country: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: DS.radius, color: DS.text, fontSize: '14px' }} />
          <button onClick={handleStart} disabled={!gateData.name || !gateData.email} style={{ padding: '14px', background: DS.accent, color: '#FFF', border: 'none', borderRadius: DS.radius, fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px', opacity: (!gateData.name || !gateData.email) ? 0.5 : 1 }}>Start Assessment</button>
        </div>
      </div>
    </div>
  );

  if (step === 'questions') return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-bg-secondary rounded-xl border border-bg-tertiary p-8">
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 600, color: DS.text }}>{catalog.name} Assessment</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
          {catalog.dimensions.map(dim => (
            <div key={dim}><p style={{ fontSize: '14px', color: DS.text, marginBottom: '8px' }}>{dim}</p><div style={{ display: 'flex', gap: '8px' }}>{[1,2,3,4,5,6,7,8,9,10].map(n => (<button key={n} onClick={() => setAnswers({ ...answers, [dim]: n })} style={{ width: '32px', height: '32px', borderRadius: '6px', border: 'none', background: answers[dim] === n ? DS.accent : DS.bg, color: answers[dim] === n ? '#FFF' : DS.muted, fontSize: '12px', cursor: 'pointer' }}>{n}</button>))}</div></div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={catalog.dimensions.some(d => !answers[d])} style={{ marginTop: '24px', padding: '14px', width: '100%', background: DS.accent, color: '#FFF', border: 'none', borderRadius: DS.radius, fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}>See Results</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bg-secondary rounded-xl border border-bg-tertiary p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-tier-1 mx-auto mb-4" />
        <h1 style={{ fontFamily: DS.headingFont, fontSize: '28px', fontWeight: 600, color: DS.text, margin: 0 }}>Assessment Complete</h1>
        <p style={{ fontSize: '15px', color: DS.muted, marginTop: '12px' }}>Your {catalog.b2cName} results have been saved.</p>
        <div style={{ marginTop: '16px', padding: '16px', background: DS.bg, borderRadius: DS.radius, textAlign: 'left' }}>
          <p style={{ fontSize: '14px', color: DS.text, fontWeight: 600 }}>Archetype: {archetype}</p>
          {Object.entries(scores).map(([k, v]) => <p key={k} style={{ fontSize: '13px', color: DS.muted, marginTop: '4px' }}>{k}: {v}/10</p>)}
        </div>
        <button onClick={handleDownloadPDF} disabled={isGenerating} style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', fontSize: '15px', fontWeight: 600, color: '#FFF', background: DS.accent, border: 'none', borderRadius: DS.radius, cursor: 'pointer', minHeight: '44px', opacity: isGenerating ? 0.7 : 1 }}>
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating PDF...</> : <><Download className="w-4 h-4" />Download Your Results</>}
        </button>
      </div>
    </div>
  );
}
