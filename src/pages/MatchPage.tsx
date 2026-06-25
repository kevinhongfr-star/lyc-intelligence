import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/authFetch';
import { toast } from '@/stores/toastStore';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Shield, Loader2, Upload, Database, FileText, Plus } from 'lucide-react';
import { JDInput } from '../components/match/JDInput';
import { CandidateList } from '../components/match/CandidateList';
import { ResultsTable } from '../components/match/ResultsTable';
import { runMatchScoring, CandidateInput, MatchResult, getCreditCost } from '../services/scoringClient';
import { useAuthStore } from '../stores/authStore';
import { ContactSelector } from '../components/match/ContactSelector';
import { MandateSelector } from '../components/match/MandateSelector';
import { PipelineSaveModal } from '../components/match/PipelineSaveModal';

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
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
};

interface LeadData { name: string; email: string; company: string; title: string; }

/** Track which candidates came from DB (have contact_id) vs manual entry */
interface EnrichedCandidate extends CandidateInput {
  contact_id?: string;
}

export function MatchPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [step, setStep] = useState<'gate' | 'engine' | 'results'>('gate');
  const [lead, setLead] = useState<LeadData>({ name: '', email: '', company: '', title: '' });
  const [jd, setJd] = useState('');
  const [candidates, setCandidates] = useState<EnrichedCandidate[]>([{ name: '', cv: '' }]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [scoring, setScoring] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isFirstBatch, setIsFirstBatch] = useState(true);
  const [userCredits, setUserCredits] = useState(0);

  // DB selection mode toggles
  const [jdFromDb, setJdFromDb] = useState(false);
  const [candidatesFromDb, setCandidatesFromDb] = useState(false);
  const [selectedMandateId, setSelectedMandateId] = useState<string | null>(null);

  // Selector modals
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [showMandateSelector, setShowMandateSelector] = useState(false);

  // Pipeline save modal
  const [showPipelineModal, setShowPipelineModal] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<MatchResult | null>(null);
  const [pipelineContactId, setPipelineContactId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.credits?.balance !== undefined) {
      setUserCredits(profile.credits.balance);
    }
  }, [profile]);

  const handleGate = async () => {
    if (!lead.name || !lead.email) return;
    try {
      await authFetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lead.name, email: lead.email, company: lead.company, title: lead.title, source: 'score-match' })
      });
    } catch (e) { console.warn('Failed to save lead:', e); }
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
      if (file.size > 10 * 1024 * 1024) { toast.warning('File size exceeds 10MB limit'); return; }
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        const response = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.text) {
          if (type === 'jd') setJd(data.text);
          else if (index !== undefined) updateCandidate(index, 'cv', data.text);
        }
      } catch (err) {
        console.error('File upload error:', err);
        toast.error('Failed to process file. Please try again.');
      }
    };
    input.click();
  }, [updateCandidate]);

  // ── DB Selection Handlers ──
  const handleMandateSelect = (mandate: { mandate_id: string; title: string; jd: string }) => {
    setJd(mandate.jd);
    setSelectedMandateId(mandate.mandate_id);
  };

  const handleContactsSelect = (contacts: Array<{ contact_id: string; name: string; cv: string }>) => {
    // Replace current candidates with selected DB contacts
    const enriched: EnrichedCandidate[] = contacts.map(c => ({
      name: c.name,
      cv: c.cv,
      contact_id: c.contact_id,
    }));
    // If there are existing manual candidates, merge them
    const manualOnes = candidates.filter(c => !c.contact_id && (c.name || c.cv));
    setCandidates([...manualOnes, ...enriched]);
  };

  const validCandidates = candidates.filter(c => c.name && c.cv);
  const creditCost = getCreditCost(validCandidates.length, isFirstBatch);

  const handleRunScoring = async () => {
    if (validCandidates.length === 0 || !jd) return;
    if (!isFirstBatch && creditCost.credits > userCredits) { setShowCreditModal(true); return; }

    setScoring(true);
    setProgress(0);
    const startTime = Date.now();

    try {
      const response = await runMatchScoring(jd, validCandidates, user?.id);
      setResults(response.results);
      setStep('results');
      setIsFirstBatch(false);

      // Persist scoring run
      try {
        await authFetch('/api/data/scoring-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mandate_id: selectedMandateId || null,
            run_type: 'trident',
            input_params: { jd_length: jd.length, candidate_count: validCandidates.length },
            output_scores: response.results.map(r => ({
              name: r.candidate_name,
              composite: r.composite_score,
              dimensions: r.dimension_scores,
            })),
            composite_score: response.results.reduce((sum, r) => sum + r.composite_score, 0) / response.results.length,
            model: response.model || 'deepseek-chat',
            tokens_used: response.total_tokens || null,
            duration_ms: Date.now() - startTime,
            user_id: user?.id || null,
          }),
        });
      } catch (e) { console.warn('[MatchPage] scoring persist failed:', e); }

      if (creditCost.credits > 0 && user) {
        await authFetch('/api/credits/spend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, amount: creditCost.credits, action: 'score_match' }),
        });
      }
    } catch (e) {
      console.error('[MatchPage] Scoring error:', e);
    } finally {
      setScoring(false);
      setProgress(100);
    }
  };

  // ── Real Action Handlers (replacing alert stubs) ──
  const handleDownloadPDF = (result: MatchResult) => {
    // Generate a printable HTML page and trigger print
    const printWindow = window.open('', '_blank');
    if (!printWindow) { toast.warning('Please allow popups to download PDF'); return; }
    
    const html = `<!DOCTYPE html><html><head><title>${result.candidate_name} — Match Report</title>
    <style>
      body { font-family: 'DM Sans', system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #000; }
      h1 { font-family: 'Libre Baskerville', serif; font-size: 24px; border-bottom: 2px solid #C108AB; padding-bottom: 8px; }
      .score { font-size: 48px; font-weight: 800; color: ${result.composite_score >= 75 ? '#22C55E' : result.composite_score >= 50 ? '#EAB308' : '#EF4444'}; }
      .section { margin: 20px 0; }
      .section h3 { color: #C108AB; margin-bottom: 8px; }
      .dims { display: flex; gap: 20px; margin: 16px 0; }
      .dim { flex: 1; text-align: center; padding: 12px; background: #F5F5F5; border-radius: 8px; }
      .dim-val { font-size: 24px; font-weight: 700; }
      ul { padding-left: 20px; }
      li { margin: 4px 0; }
      .footer { margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
    </style></head><body>
    <h1>${result.candidate_name}</h1>
    <div style="text-align:center; margin: 20px 0;">
      <div class="score">${result.composite_score}</div>
      <div style="font-size:14px; color:#666;">Composite Score</div>
    </div>
    <div class="dims">
      <div class="dim"><div class="dim-val">${Math.round(result.dimension_scores.experience * 100)}</div><div>Experience</div></div>
      <div class="dim"><div class="dim-val">${Math.round(result.dimension_scores.skills * 100)}</div><div>Skills</div></div>
      <div class="dim"><div class="dim-val">${Math.round(result.dimension_scores.fit * 100)}</div><div>Fit</div></div>
    </div>
    <div class="section"><h3>Match Reasons</h3><ul>${(result.match_reasons || []).map(r => `<li>${r}</li>`).join('')}</ul></div>
    ${result.risk_factors?.length ? `<div class="section"><h3>Risk Factors</h3><ul>${result.risk_factors.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
    ${result.approach_strategy ? `<div class="section"><h3>Approach Strategy</h3><p>${result.approach_strategy}</p></div>` : ''}
    <div class="footer">Generated by LYC Intelligence — ${new Date().toLocaleDateString()} — Confidential</div>
    </body></html>`;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleShareCard = async (result: MatchResult) => {
    try {
      const res = await authFetch('/api/data/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: [result],
          jd_summary: jd.slice(0, 200),
          created_by: user?.id || null,
        }),
      });
      const data = await res.json();
      const shareUrl = `${window.location.origin}/share/${data.data?.id || ''}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (e) {
      console.error('[MatchPage] share error:', e);
      // Fallback: generate a local share URL
      const shareId = Math.random().toString(36).substring(7);
      const shareUrl = `${window.location.origin}/score-card/${shareId}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Shareable link copied to clipboard!');
    }
  };

  const handleSaveCandidate = (result: MatchResult) => {
    // Find if this candidate has a contact_id from DB selection
    const idx = results.indexOf(result);
    const candidate = candidates[idx];
    const contactId = candidate?.contact_id || null;
    
    setPipelineResult(result);
    setPipelineContactId(contactId);
    setShowPipelineModal(true);
  };

  // ── Input mode toggle button ──
  const ModeToggle = ({ fromDb, onToggle, label }: { fromDb: boolean; onToggle: () => void; label: string }) => (
    <button
      onClick={onToggle}
      style={{
        padding: '8px 14px',
        background: fromDb ? `${DS.accent}10` : DS.card,
        border: `1px solid ${fromDb ? DS.accent : DS.cardBorder}`,
        borderRadius: '8px',
        color: fromDb ? DS.accent : DS.textSecondary,
        fontSize: '12px',
        fontWeight: fromDb ? 600 : 400,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        minHeight: '36px'
      }}
    >
      {fromDb ? <Database style={{ width: 14, height: 14 }} /> : <FileText style={{ width: 14, height: 14 }} />}
      {fromDb ? `From DB` : label}
    </button>
  );

  // ─── GATE STEP ───
  if (step === 'gate') {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
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
              <input placeholder="Full name" value={lead.name} onChange={e => setLead({ ...lead, name: e.target.value })}
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
              <input placeholder="Work email" type="email" value={lead.email} onChange={e => setLead({ ...lead, email: e.target.value })}
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
              <input placeholder="Company" value={lead.company} onChange={e => setLead({ ...lead, company: e.target.value })}
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
              <input placeholder="Job title" value={lead.title} onChange={e => setLead({ ...lead, title: e.target.value })}
                style={{ padding: '12px 16px', background: DS.bg, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.text, fontSize: '14px', outline: 'none' }} />
              <button onClick={handleGate} disabled={!lead.name || !lead.email}
                style={{ padding: '14px', background: DS.accent, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: (lead.name && lead.email) ? 'pointer' : 'not-allowed', opacity: (lead.name && lead.email) ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '44px' }}>
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

  // ─── ENGINE STEP ───
  if (step === 'engine') {
    return (
      <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 style={{ color: DS.accent, width: 28, height: 28 }} />
              <div>
                <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>Score Match Engine</span>
                <p style={{ fontSize: '12px', color: DS.muted, margin: '4px 0 0' }}>Welcome, {lead.name}</p>
              </div>
            </div>
            {isFirstBatch && (
              <div style={{ padding: '8px 16px', background: `${DS.success}15`, border: `1px solid ${DS.success}30`, borderRadius: '20px', fontSize: '13px', color: DS.success, fontWeight: 600 }}>
                First 3 matches free!
              </div>
            )}
          </div>

          {/* JD Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: DS.text }}>Job Description</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ModeToggle
                  fromDb={jdFromDb}
                  onToggle={() => { setJdFromDb(!jdFromDb); if (!jdFromDb) setShowMandateSelector(true); }}
                  label="Paste / Upload"
                />
                {!jdFromDb && (
                  <button onClick={() => handleFileUpload('jd')}
                    style={{ padding: '8px 14px', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '36px' }}>
                    <Upload style={{ width: 14, height: 14 }} /> Upload
                  </button>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <JDInput value={jd} onChange={setJd} />
            </div>
            {selectedMandateId && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: DS.accent, fontWeight: 500 }}>
                ✓ Using JD from selected mandate
              </div>
            )}
          </div>

          {/* Candidates Section */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: DS.text }}>Candidates</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ModeToggle
                  fromDb={candidatesFromDb}
                  onToggle={() => {
                    setCandidatesFromDb(!candidatesFromDb);
                    if (!candidatesFromDb) setShowContactSelector(true);
                  }}
                  label="Manual Entry"
                />
                {!candidatesFromDb && (
                  <button onClick={addCandidate}
                    style={{ padding: '8px 14px', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', minHeight: '36px' }}>
                    <Plus style={{ width: 14, height: 14 }} /> Add
                  </button>
                )}
              </div>
            </div>
            
            {candidatesFromDb ? (
              <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '20px' }}>
                <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '12px' }}>
                  {candidates.filter(c => c.contact_id).length} candidates selected from database
                </p>
                <button onClick={() => setShowContactSelector(true)}
                  style={{ padding: '10px 20px', background: `${DS.accent}10`, border: `1px solid ${DS.accent}`, borderRadius: '8px', color: DS.accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database style={{ width: 16, height: 16 }} />
                  Select from Database
                </button>
                {candidates.filter(c => c.contact_id).length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {candidates.filter(c => c.contact_id).map((c, i) => (
                      <span key={i} style={{ padding: '4px 10px', background: `${DS.accent}10`, borderRadius: '6px', fontSize: '12px', color: DS.accent }}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CandidateList
                candidates={candidates}
                onAdd={addCandidate}
                onRemove={removeCandidate}
                onUpdate={updateCandidate}
                onUploadCV={handleFileUpload}
              />
            )}
          </div>

          {/* Run scoring bar */}
          <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: DS.radius, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '14px', color: DS.text, margin: '0 0 4px' }}>
                  {validCandidates.length > 0 ? (
                    <>Ready to score <strong>{validCandidates.length}</strong> candidate{validCandidates.length !== 1 ? 's' : ''}</>
                  ) : 'Add candidates to start scoring'}
                </p>
                {validCandidates.length > 0 && (
                  <p style={{ fontSize: '12px', color: DS.muted, margin: 0 }}>
                    {isFirstBatch ? (
                      <span style={{ color: DS.success }}>Free (first 3 matches)</span>
                    ) : (
                      <>Cost: <strong>{creditCost.credits} credits</strong>
                        {userCredits < creditCost.credits && <span style={{ color: DS.warning, marginLeft: '8px' }}>(You have {userCredits})</span>}
                      </>
                    )}
                  </p>
                )}
              </div>
              <button onClick={handleRunScoring} disabled={scoring || validCandidates.length === 0 || !jd}
                style={{ padding: '12px 24px', background: DS.accent, color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: (scoring || validCandidates.length === 0 || !jd) ? 'not-allowed' : 'pointer', opacity: (scoring || validCandidates.length === 0 || !jd) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px' }}>
                {scoring ? (<><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Scoring... {progress}%</>) : 'Run Match'}
              </button>
            </div>
            {scoring && (
              <div style={{ height: '6px', background: DS.bg, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: DS.accent, borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Credit modal */}
        {showCreditModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000 }}>
            <div style={{ background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '16px', padding: '32px', maxWidth: '400px', textAlign: 'center' }}>
              <h3 style={{ fontFamily: DS.headingFont, fontSize: '20px', color: DS.text, marginBottom: '12px' }}>Insufficient Credits</h3>
              <p style={{ fontSize: '14px', color: DS.muted, marginBottom: '20px' }}>You need {creditCost.credits} credits but only have {userCredits}.</p>
              <button onClick={() => setShowCreditModal(false)} style={{ padding: '10px 20px', background: DS.accent, border: 'none', borderRadius: '8px', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, minHeight: '44px' }}>
                Understood
              </button>
            </div>
          </div>
        )}

        {/* Selectors */}
        <ContactSelector open={showContactSelector} onClose={() => setShowContactSelector(false)} onSelect={handleContactsSelect} userId={profile?.id} />
        <MandateSelector open={showMandateSelector} onClose={() => setShowMandateSelector(false)} onSelect={handleMandateSelect} />

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── RESULTS STEP ───
  return (
    <div style={{ minHeight: '100vh', background: DS.bg, padding: '24px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <BarChart3 style={{ color: DS.accent, width: 24, height: 24 }} />
              <span style={{ fontFamily: DS.headingFont, fontSize: '20px', fontWeight: 700, color: DS.text }}>Match Results</span>
            </div>
            <p style={{ fontSize: '13px', color: DS.muted, margin: 0 }}>{results.length} candidate{results.length !== 1 ? 's' : ''} scored</p>
          </div>
          <button onClick={() => { setStep('engine'); setResults([]); }}
            style={{ padding: '10px 20px', background: DS.card, border: `1px solid ${DS.cardBorder}`, borderRadius: '8px', color: DS.textSecondary, fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}>
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

      {/* Pipeline Save Modal */}
      <PipelineSaveModal
        open={showPipelineModal}
        onClose={() => { setShowPipelineModal(false); setPipelineResult(null); setPipelineContactId(null); }}
        result={pipelineResult}
        contactId={pipelineContactId}
        candidateName={pipelineResult?.candidate_name}
        onSuccess={() => { /* Could refresh state here */ }}
      />
    </div>
  );
}
