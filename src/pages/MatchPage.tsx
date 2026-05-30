import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Loader2, Upload } from 'lucide-react';
import { JDInput } from '../components/match/JDInput';
import { CandidateList } from '../components/match/CandidateList';
import { ResultsTable } from '../components/match/ResultsTable';
import { runTRIDENTScoring, CandidateInput, TRIDENTResult, getCreditCost } from '../services/tridentScoring';
import { useAuthStore } from '../stores/authStore';

import { DS } from '@/lib/designSystem';

interface LeadData {
  name: string;
  email: string;
  company: string;
  title: string;
}

export function MatchPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [step, setStep] = useState<'gate' | 'engine' | 'results'>('gate');
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', company: '', title: '' });
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState<CandidateInput[]>([{ name: '', cv: '' }]);
  const [results, setResults] = useState<TRIDENTResult[]>([]);
  const [scoring, setScoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isFirstBatch, setIsFirstBatch] = useState(true);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    if (profile?.credits?.balance !== undefined) {
      setUserCredits(profile.credits.balance);
    }
  }, [profile]);

  const handleGate = async () => {
    if (!lead.name || !lead.email) return;

    try {
      await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          title: lead.title,
          type: 'b2b',
          source: 'score-match'
        })
      });
    } catch (e) {
      console.warn('Failed to save lead:', e);
    }

    setStep('engine');
  };

  const addCandidate = () => setCandidates([...candidates, { name: '', cv: '' }]);
  
  const removeCandidate = (i: number) => setCandidates(candidates.filter((_, idx) => idx !== i));
  
  const updateCandidate = (i: number, field: keyof CandidateInput, val: string) => {
    const updated = [...candidates];
    updated[i] = { ...updated[i], [field]: val };
    setCandidates(updated);
  };

  const handleFileUpload = useCallback(async (type: 'jd' | 'cv', index?: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
      console.warn('[Match] File size exceeds 10MB limit');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.text) {
          if (type === 'jd') {
            setJd(data.text);
          } else if (index !== undefined) {
            updateCandidate(index, 'cv', data.text);
          }
        }
      } catch (err) {
        console.error('File upload error:', err);
        console.error('[Match] Failed to process file');
      }
    };
    input.click();
  }, [updateCandidate]);

  const validCandidates = candidates.filter(c => c.name && c.cv);
  const creditCost = getCreditCost(validCandidates.length, isFirstBatch);

  const handleRunScoring = async () => {
    if (validCandidates.length === 0 || !jd) return;

    if (!isFirstBatch && creditCost.credits > userCredits) {
      setShowCreditModal(true);
      return;
    }

    setScoring(true);
    setProgress(0);

    try {
      const response = await runTRIDENTScoring(
        jd,
        validCandidates,
        user?.id
      );

      setResults(response.results);
      setStep('results');
      setIsFirstBatch(false);

      if (creditCost.credits > 0 && user) {
        await fetch('/api/credits/spend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            amount: creditCost.credits,
            action: 'score_match'
          })
        });
      }
    } catch (e) {
      console.error('[MatchPage] Scoring error:', e);
    } finally {
      setScoring(false);
      setProgress(100);
    }
  };

  const handleDownloadPDF = (result: TRIDENTResult) => {
    const lines: string[] = [
      '═══════════════════════════════════════════',
      '  TRIDENT MATCH ANALYSIS REPORT',
      '  LYC Intelligence — Powered by LYC Partners',
      '═══════════════════════════════════════════',
      '',
      `Candidate: ${result.candidate_name}`,
      `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      '',
      '── MATCH SCORE ───────────────────────────',
      `Overall: ${result.composite_score}%`,
      '',
      '── DIMENSION SCORES ──────────────────────',
      `  Experience & Achievements: ${result.dimension_scores?.experience}%`,
      `  Skills & Expertise: ${result.dimension_scores?.skills}%`,
      `  Organizational Fit: ${result.dimension_scores?.fit}%`,
      '',
      '── VERDICT ───────────────────────────────',
      `${result.approach_strategy}`,
      '',
      result.match_reasons ? '── MATCH REASONS ─────────────────────────\n' + result.match_reasons.map((r: string) => `  • ${r}`).join('\n') : '',
      result.risk_factors ? '── RISK FACTORS ──────────────────────────\n' + result.risk_factors.map((r: string) => `  • ${r}`).join('\n') : '',
      '',
      '═══════════════════════════════════════════',
      '  Know where you stand. Know where to go.',
      '  lyc-intelligence.app',
      '═══════════════════════════════════════════',
    ].filter(Boolean);
    const reportText = lines.join('\n');
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LYC-TRIDENT-${result.candidate_name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareCard = async (result: TRIDENTResult) => {
    try {
      const shareId = Math.random().toString(36).substring(7);
      const shareUrl = `${window.location.origin}/score-card/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  const handleSaveCandidate = (result: TRIDENTResult) => {
    // TODO: Implement save to Supabase when API auth is in place
    // TODO: #110 — console.log('[Match] Save candidate:', result.candidate_name);
  };

  if (step === 'gate') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: DS.bg, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '24px' 
      }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BarChart3 style={{ color: DS.accent, width: 32, height: 32 }} />
              <span style={{ fontFamily: DS.headingFont, fontSize: '22px', fontWeight: 700, color: DS.text }}>Score Match</span>
            </div>
            <h1 style={{ fontFamily: DS.headingFont, fontSize: '36px', fontWeight: 700, color: DS.text, margin: '0 0 12px' }}>
              AI-Powered Executive Matching
            </h1>
            <p style={{ fontSize: '16px', color: DS.muted, lineHeight: 1.6 }}>
              Score candidates against job descriptions across 3 dimensions. 
              Get instant insights on experience, skills, and organizational fit.
            </p>
          </div>

          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '32px' }}>
            <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '20px', textAlign: 'center' }}>
              Enter your details to access the Match Engine
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="Full name" 
                value={lead.name} 
                onChange={e => setLead({ ...lead, name: e.target.value })} 
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} 
              />
              <input 
                placeholder="Work email" 
                type="email" 
                value={lead.email} 
                onChange={e => setLead({ ...lead, email: e.target.value })} 
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} 
              />
              <input 
                placeholder="Company" 
                value={lead.company} 
                onChange={e => setLead({ ...lead, company: e.target.value })} 
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} 
              />
              <input 
                placeholder="Job title" 
                value={lead.title} 
                onChange={e => setLead({ ...lead, title: e.target.value })} 
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} 
              />
              <button 
                onClick={handleGate} 
                disabled={!lead.name || !lead.email} 
                style={{ 
                  padding: '14px', 
                  background: DS.accent, 
                  color: '#FFFFFF', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '15px', 
                  fontWeight: 600, 
                  cursor: (lead.name && lead.email) ? 'pointer' : 'not-allowed',
                  opacity: (lead.name && lead.email) ? 1 : 0.5, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  minHeight: '44px'
                }}
              >
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
  }

  if (step === 'engine') {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 style={{ color: DS.accent, width: 28, height: 28 }} />
              <div>
                <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>Score Match Engine</span>
                <p style={{ fontSize: '12px', color: DS.muted, margin: '4px 0 0' }}>Welcome, {lead.name}</p>
              </div>
            </div>
            
            {isFirstBatch && (
              <div style={{
                padding: '8px 16px',
                background: `${DS.success}15`,
                border: `1px solid ${DS.success}30`,
                borderRadius: '20px',
                fontSize: '13px',
                color: DS.success,
                fontWeight: 600
              }}>
                First 3 matches free!
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <JDInput value={jd} onChange={setJd} />
              <button
                onClick={() => handleFileUpload('jd')}
                style={{
                  padding: '10px 16px',
                  background: DS.card,
                  border: `1px solid ${DS.cardBorder}`,
                  borderRadius: '8px',
                  color: DS.textSecondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '44px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Upload style={{ width: 14, height: 14 }} />
                Upload JD
              </button>
            </div>
            <p style={{ fontSize: '12px', color: DS.muted }}>
              Supports PDF, DOCX, TXT (max 10MB)
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <CandidateList
              candidates={candidates}
              onAdd={addCandidate}
              onRemove={removeCandidate}
              onUpdate={updateCandidate}
              onUploadCV={handleFileUpload}
            />
          </div>

          <div style={{ 
            background: DS.card, 
            border: `1px solid ${DS.cardBorder}`, 
            borderRadius: DS.radius, 
            padding: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '14px', color: DS.text, margin: '0 0 4px' }}>
                  {validCandidates.length > 0 ? (
                    <>
                      Ready to score <strong>{validCandidates.length}</strong> candidate{validCandidates.length !== 1 ? 's' : ''}
                    </>
                  ) : (
                    'Add candidates to start scoring'
                  )}
                </p>
                {validCandidates.length > 0 && (
                  <p style={{ fontSize: '12px', color: DS.muted, margin: 0 }}>
                    {isFirstBatch ? (
                      <span style={{ color: DS.success }}>Free (first 3 matches)</span>
                    ) : (
                      <>
                        Cost: <strong>{creditCost.credits} credits</strong>
                        {userCredits < creditCost.credits && (
                          <span style={{ color: DS.warning, marginLeft: '8px' }}>
                            (You have {userCredits})
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>
              
              <button 
                onClick={handleRunScoring} 
                disabled={scoring || validCandidates.length === 0 || !jd}
                style={{ 
                  padding: '12px 24px', 
                  background: DS.accent, 
                  color: '#FFFFFF', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  cursor: (scoring || validCandidates.length === 0 || !jd) ? 'not-allowed' : 'pointer',
                  opacity: (scoring || validCandidates.length === 0 || !jd) ? 0.5 : 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  minHeight: '44px'
                }}
              >
                {scoring ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    Scoring... {progress}%
                  </>
                ) : (
                  'Run Match'
                )}
              </button>
            </div>
            
            {scoring && (
              <div style={{ height: '6px', background: DS.bg, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: DS.accent, 
                  borderRadius: '3px', 
                  transition: 'width 0.3s' 
                }} />
              </div>
            )}
          </div>
        </div>

        {showCreditModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 1000
          }}>
            <div style={{
              background: DS.card,
              border: `1px solid ${DS.cardBorder}`,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', color: DS.text, marginBottom: '12px' }}>
                Insufficient Credits
              </h3>
              <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '20px' }}>
                You need {creditCost.credits} credits but only have {userCredits}. Contact support for assistance.
              </p>
              <button
                onClick={() => setShowCreditModal(false)}
                style={{
                  padding: '10px 20px',
                  background: DS.accent,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 600,
                  minHeight: '44px'
                }}
              >
                Understood
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BarChart3 style={{ color: DS.accent, width: 24, height: 24 }} />
              <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>Match Results</span>
            </div>
            <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>
              {results.length} candidate{results.length !== 1 ? 's' : ''} scored
            </p>
          </div>
          <button 
            onClick={() => { setStep('engine'); setResults([]); }} 
            style={{ 
              padding: '10px 20px', 
              background: DS.card, 
              border: `1px solid ${DS.cardBorder}`, 
              borderRadius: '8px', 
              color: DS.textSecondary, 
              fontSize: '13px', 
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            Score More
          </button>
        </div>

        <ResultsTable
          results={results}
          onDownloadPDF={handleDownloadPDF}
          onShareCard={handleShareCard}
          onSaveCandidate={handleSaveCandidate}
        />
      </div>
    </div>
  );
}