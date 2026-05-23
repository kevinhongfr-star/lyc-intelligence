import React, { useState, useRef } from 'react';
import { ArrowRight, Plus, X, Play, Loader2, Download, Shield, BarChart3, ChevronDown, ChevronUp, Mail, Briefcase, Star } from 'lucide-react';
import { computeTRIDENT } from '@/services/tridentScoring';

const DS = { headingFont: 'Georgia, serif', bodyFont: 'Inter, sans-serif', accent: '#C108AB', accentLight: '#D92FC4', bg: '#0A0A0A', card: '#111111', cardHover: '#1A1A1A', muted: '#888888', text: '#FFFFFF', textSecondary: '#CCCCCC', border: '#222222', borderHover: '#333333', radius: '12px', green: '#22C55E', yellow: '#EAB308', red: '#EF4444' };

const DEEPSEEK_API_KEY = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) || '';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

interface CandidateInput { name: string; cv: string; }
interface ScoreResult { name: string; d1: number; d2: number; d3: number; composite: number; verdict: string; tier: string; clientVerdict: string; keyMatchReasons: string; riskFactors: string; approachStrategy: string; }
interface LeadData { name: string; email: string; company: string; title: string; }

async function saveLead(data: LeadData) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/b2b_leads`, {
      method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name: data.name, email: data.email, company: data.company, title: data.title, source: 'trident-match' })
    });
  } catch (e) { console.warn('Lead save failed:', e); }
}

async function scoreCandidate(jd: string, cv: string): Promise<{ d1: number; d2: number; d3: number; key_match_reasons: string; risk_factors: string; approach_strategy: string } | null> {
  if (!DEEPSEEK_API_KEY) return null;
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are an executive search analyst. Score this candidate against the JD using the TRIDENT 3D model. Score each dimension 0-100: D1=Experience & Achievements, D2=Skills/Functional Match, D3=Organizational Fit. Also provide key_match_reasons (2-3 sentences), risk_factors (1-2 sentences), approach_strategy (1-2 sentences). Return ONLY valid JSON: {"d1":number,"d2":number,"d3":number,"key_match_reasons":"string","risk_factors":"string","approach_strategy":"string"}' },
          { role: 'user', content: `JOB DESCRIPTION:\n${jd}\n\nCANDIDATE CV:\n${cv}` }
        ],
        max_tokens: 600, temperature: 0.3
      })
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
  } catch (e) { console.warn('Scoring failed:', e); }
  return null;
}

function verdictColor(v: string) { return v.includes('Strong') ? DS.green : v.includes('Conditional') ? DS.yellow : DS.red; }
function tierBg(t: string) { return t === 'T1' ? 'rgba(34,197,94,0.15)' : t === 'T2' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)'; }

export function MatchPage() {
  const [step, setStep] = useState<'gate' | 'engine' | 'results'>('gate');
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', company: '', title: '' });
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState<CandidateInput[]>([{ name: '', cv: '' }]);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [scoring, setScoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGate = async () => {
    await saveLead(lead);
    setStep('engine');
  };

  const addCandidate = () => setCandidates([...candidates, { name: '', cv: '' }]);
  const removeCandidate = (i: number) => setCandidates(candidates.filter((_, idx) => idx !== i));
  const updateCandidate = (i: number, field: keyof CandidateInput, val: string) => {
    const c = [...candidates]; c[i] = { ...c[i], [field]: val }; setCandidates(c);
  };

  const runScoring = async () => {
    setScoring(true); setProgress(0); setResults([]);
    const valid = candidates.filter(c => c.name && c.cv);
    for (let i = 0; i < valid.length; i++) {
      const score = await scoreCandidate(jd, valid[i].cv);
      if (score) {
        const result = computeTRIDENT({ d1: score.d1, d2: score.d2, d3: score.d3 });
        setResults(prev => [...prev, {
          name: valid[i].name, d1: score.d1, d2: score.d2, d3: score.d3,
          composite: result.composite, verdict: result.verdict, tier: result.tier, clientVerdict: result.clientVerdict,
          keyMatchReasons: score.key_match_reasons, riskFactors: score.risk_factors, approachStrategy: score.approach_strategy
        }]);
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }
    setScoring(false);
    setStep('results');
  };

  // ─── GATE ───
  if (step === 'gate') return (
    <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 style={{ color: DS.accent, width: 28, height: 28 }} />
            <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>TRIDENT Match</span>
          </div>
          <h1 style={{ fontFamily: DS.headingFont, fontSize: '32px', fontWeight: 700, color: DS.text, margin: '0 0 8px' }}>AI-Powered JD ↔ CV Matching</h1>
          <p style={{ fontSize: '15px', color: DS.muted, lineHeight: 1.5 }}>Paste a job description, add candidate profiles, and get instant TRIDENT 3D scores with verdicts and strategy.</p>
        </div>
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '32px' }}>
          <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '20px', textAlign: 'center' }}>Enter your details to access the Match Engine</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input placeholder="Full name" value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
            <input placeholder="Work email" type="email" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
            <input placeholder="Company" value={lead.company} onChange={e => setLead({ ...lead, company: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
            <input placeholder="Job title" value={lead.title} onChange={e => setLead({ ...lead, title: e.target.value })} style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
            <button onClick={handleGate} disabled={!lead.name || !lead.email} style={{ padding: '14px', background: DS.accent, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px', opacity: (!lead.name || !lead.email) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              Access Match Engine <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
            <Shield style={{ width: 12, height: 12, color: DS.muted }} />
            <span style={{ fontSize: '11px', color: DS.muted }}>Your data is confidential. We never share your JDs or candidate info.</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── ENGINE ───
  if (step === 'engine') return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 style={{ color: DS.accent, width: 24, height: 24 }} />
            <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>TRIDENT Match Engine</span>
          </div>
          <span style={{ fontSize: '12px', color: DS.muted }}>Welcome, {lead.name}</span>
        </div>

        {/* JD Section */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: '0 0 12px' }}>
            <Briefcase style={{ width: 16, height: 16, display: 'inline', marginRight: '6px', verticalAlign: -2 }} />
            Job Description
          </h3>
          <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job description here — role, requirements, qualifications, company context..." style={{ width: '100%', minHeight: '160px', background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', padding: '14px', color: DS.text, fontSize: '13px', lineHeight: 1.6, resize: 'vertical', outline: 'none', fontFamily: DS.bodyFont }} />
        </div>

        {/* Candidates Section */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: DS.headingFont, fontSize: '16px', fontWeight: 600, color: DS.text, margin: 0 }}>
              Candidates ({candidates.length})
            </h3>
            <button onClick={addCandidate} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Candidate
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {candidates.map((c, i) => (
              <div key={i} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input placeholder="Candidate name" value={c.name} onChange={e => updateCandidate(i, 'name', e.target.value)} style={{ flex: 1, padding: '10px 14px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '6px', color: DS.text, fontSize: '13px', outline: 'none' }} />
                  {candidates.length > 1 && (
                    <button onClick={() => removeCandidate(i)} style={{ background: 'none', border: 'none', color: DS.muted, cursor: 'pointer', padding: '4px' }}>
                      <X style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                </div>
                <textarea placeholder="Paste CV, LinkedIn profile, or resume text..." value={c.cv} onChange={e => updateCandidate(i, 'cv', e.target.value)} style={{ width: '100%', minHeight: '80px', background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '6px', padding: '10px', color: DS.text, fontSize: '12px', lineHeight: 1.5, resize: 'vertical', outline: 'none', fontFamily: DS.bodyFont }} />
              </div>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={runScoring} disabled={scoring || !jd || candidates.every(c => !c.name || !c.cv)} style={{ padding: '14px 32px', background: DS.accent, color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px', opacity: (scoring || !jd || candidates.every(c => !c.name || !c.cv)) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {scoring ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Scoring... {progress}%</> : <><Play style={{ width: 16, height: 16 }} /> Run TRIDENT Sweep</>}
          </button>
          {scoring && (
            <div style={{ flex: 1, height: '6px', background: DS.card, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: DS.accent, borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── RESULTS ───
  const sorted = [...results].sort((a, b) => b.composite - a.composite);
  return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }} ref={resultsRef}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BarChart3 style={{ color: DS.accent, width: 24, height: 24 }} />
              <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>TRIDENT Results</span>
            </div>
            <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>{results.length} candidate{results.length !== 1 ? 's' : ''} scored • D1 40% · D2 35% · D3 25%</p>
          </div>
          <button onClick={() => { setStep('engine'); setResults([]); }} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '13px', cursor: 'pointer' }}>
            Score More
          </button>
        </div>

        {/* Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Strong Fit', count: results.filter(r => r.composite >= 75).length, color: DS.green },
            { label: 'Conditional', count: results.filter(r => r.composite >= 50 && r.composite < 75).length, color: DS.yellow },
            { label: 'Weak Fit', count: results.filter(r => r.composite < 50).length, color: DS.red },
          ].map(s => (
            <div key={s.label} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '12px', color: DS.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sorted.map((r, i) => (
            <div key={i} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: DS.radius, overflow: 'hidden' }}>
              <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: tierBg(r.tier), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: verdictColor(r.verdict) }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: DS.text }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: DS.muted, marginTop: '2px' }}>{r.clientVerdict} · Tier {r.tier}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: verdictColor(r.verdict) }}>{r.composite}</div>
                  <div style={{ fontSize: '11px', color: DS.muted }}>composite</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
                  {[{ label: 'D1', val: r.d1 }, { label: 'D2', val: r.d2 }, { label: 'D3', val: r.d3 }].map(d => (
                    <div key={d.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: DS.textSecondary }}>{d.val}</div>
                      <div style={{ fontSize: '10px', color: DS.muted }}>{d.label}</div>
                    </div>
                  ))}
                </div>
                {expanded === i ? <ChevronUp style={{ width: 16, height: 16, color: DS.muted }} /> : <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />}
              </div>
              {expanded === i && (
                <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${DS.border}`, marginTop: 0 }}>
                  <div style={{ paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: DS.green, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Match Reasons</h4>
                      <p style={{ fontSize: '13px', color: DS.textSecondary, lineHeight: 1.5, margin: 0 }}>{r.keyMatchReasons}</p>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '12px', fontWeight: 600, color: DS.yellow, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Factors</h4>
                      <p style={{ fontSize: '13px', color: DS.textSecondary, lineHeight: 1.5, margin: 0 }}>{r.riskFactors}</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 600, color: DS.accent, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approach Strategy</h4>
                    <p style={{ fontSize: '13px', color: DS.textSecondary, lineHeight: 1.5, margin: 0 }}>{r.approachStrategy}</p>
                  </div>
                  {/* Score Bars */}
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    {[{ label: 'Experience & Achievements (D1)', val: r.d1 }, { label: 'Skills / Functional Match (D2)', val: r.d2 }, { label: 'Organizational Fit (D3)', val: r.d3 }].map(d => (
                      <div key={d.label} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: DS.muted }}>{d.label}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: DS.text }}>{d.val}</span>
                        </div>
                        <div style={{ height: '4px', background: DS.border, borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${d.val}%`, background: d.val >= 75 ? DS.green : d.val >= 50 ? DS.yellow : DS.red, borderRadius: '2px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '32px', background: DS.card, border: `1px solid ${DS.accent}33`, borderRadius: DS.radius, padding: '24px', textAlign: 'center' }}>
          <Star style={{ width: 20, height: 20, color: DS.accent, marginBottom: '8px' }} />
          <h3 style={{ fontFamily: DS.headingFont, fontSize: '18px', fontWeight: 600, color: DS.text, margin: '0 0 8px' }}>Want deeper analysis?</h3>
          <p style={{ fontSize: '14px', color: DS.muted, margin: '0 0 16px' }}>Get full LENS reports with client-ready shortlists, Proximity scoring, and pipeline management.</p>
          <a href="/b2b" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: DS.accent, color: '#FFF', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', minHeight: '44px' }}>
            <Mail style={{ width: 16, height: 16 }} /> Contact LYC Partners
          </a>
        </div>
      </div>
    </div>
  );
}
