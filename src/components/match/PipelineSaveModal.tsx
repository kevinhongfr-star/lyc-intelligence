/**
 * PipelineSaveModal — lets user pick a mandate and save a scored candidate to pipeline.
 * Used by MatchPage results "Save to Pipeline" action.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/stores/toastStore';
import { Search, X, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { MatchResult } from '../../services/scoringClient';

const DS = {
  accent: '#C108AB',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
};

interface Mandate {
  id: string;
  title: string;
  status: string;
  company?: { id: string; name: string } | null;
}

interface PipelineSaveModalProps {
  open: boolean;
  onClose: () => void;
  result: MatchResult | null;
  /** If the result came from a DB contact, we have the contact_id */
  contactId?: string | null;
  /** If no contact_id, we need to create a contact first */
  candidateName?: string;
  onSuccess: () => void;
}

export function PipelineSaveModal({ open, onClose, result, contactId, candidateName, onSuccess }: PipelineSaveModalProps) {
  const [search, setSearch] = useState('');
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState<Mandate | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchMandates = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (q) params.set('q', q);
      const res = await fetch(`/api/data/mandate?${params}`);
      const data = await res.json();
      setMandates(data.data || []);
    } catch (e) {
      console.error('[PipelineSaveModal] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMandates('');
      setSearch('');
      setSelectedMandate(null);
      setSuccess(false);
    }
  }, [open, fetchMandates]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMandates(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchMandates]);

  const handleSave = async () => {
    if (!result || !selectedMandate) return;
    setSaving(true);

    try {
      let finalContactId = contactId;

      // If no contact_id (manual entry candidate), create contact first
      if (!finalContactId && candidateName) {
        const createRes = await fetch('/api/data/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: candidateName,
            headline: result.match_reasons?.[0] || null,
            source: 'match_save',
          }),
        });
        const createData = await createRes.json();
        finalContactId = createData.data?.id;
        if (!finalContactId) throw new Error('Failed to create contact');
      }

      if (!finalContactId) throw new Error('No contact ID available');

      // Determine tier from score
      const tier = result.composite_score >= 75 ? 'T1' : result.composite_score >= 50 ? 'T2' : 'T3';
      const verdict = result.composite_score >= 75 ? 'Strong Primary' : result.composite_score >= 50 ? 'Strong Secondary' : 'Reserve';

      // Insert into pipeline
      const pipelineRes = await fetch('/api/data/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: finalContactId,
          mandate_id: selectedMandate.id,
          stage: 'SWEEP',
          sweep_tier: tier,
          match_score: result.composite_score,
          match_reasons: result.match_reasons,
          key_match_reasons: result.match_reasons?.join('; ') || null,
          trident_composite: result.composite_score,
          trident_d1: result.dimension_scores?.experience ? result.dimension_scores.experience * 100 : null,
          trident_d2: result.dimension_scores?.skills ? result.dimension_scores.skills * 100 : null,
          trident_d3: result.dimension_scores?.fit ? result.dimension_scores.fit * 100 : null,
          fit_analysis: result.match_reasons || null,
          risk_factors: result.risk_factors || null,
          approach_strategy: result.approach_strategy || null,
          verdict,
          notes: `Saved from Score Match — ${new Date().toISOString().split('T')[0]}`,
        }),
      });

      if (!pipelineRes.ok) throw new Error(`Pipeline insert failed: ${await pipelineRes.text()}`);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('[PipelineSaveModal] save error:', e);
      toast.error(`Failed to save to pipeline: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
    }}>
      <div style={{
        background: DS.card, border: `1px solid ${DS.cardBorder}`,
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '540px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: '#22C55E', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: DS.text, marginBottom: '8px' }}>
              Saved to Pipeline!
            </h3>
            <p style={{ fontSize: '14px', color: DS.muted }}>
              {result?.candidate_name} added to {selectedMandate?.title}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '18px', fontWeight: 700, margin: 0 }}>
                Save to Pipeline
              </h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X style={{ width: 20, height: 20, color: DS.muted }} />
              </button>
            </div>

            {/* Candidate summary */}
            {result && (
              <div style={{
                padding: '12px 16px', background: DS.bgAlt, borderRadius: '8px',
                marginBottom: '16px', fontSize: '13px'
              }}>
                <strong>{result.candidate_name}</strong> — Score: <strong>{result.composite_score}</strong>
                {result.verdict && <span style={{ color: DS.muted }}> ({result.verdict})</span>}
              </div>
            )}

            <p style={{ fontSize: '13px', color: DS.muted, marginBottom: '12px' }}>
              Select a mandate to add this candidate to:
            </p>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '12px', width: 16, height: 16, color: DS.muted }} />
              <input
                placeholder="Search mandates..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelectedMandate(null); }}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  background: DS.bgAlt, border: `1px solid ${DS.cardBorder}`,
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            {/* Mandate list */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '300px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <Loader2 style={{ width: 20, height: 20, color: DS.accent, animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {mandates.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMandate(m)}
                      style={{
                        padding: '10px 14px',
                        background: selectedMandate?.id === m.id ? `${DS.accent}08` : DS.bgAlt,
                        border: `1px solid ${selectedMandate?.id === m.id ? DS.accent : DS.cardBorder}`,
                        borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <Briefcase style={{ width: 14, height: 14, color: DS.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: 500, flex: 1 }}>{m.title}</span>
                      {m.company?.name && (
                        <span style={{ fontSize: '11px', color: DS.muted }}>{m.company.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!selectedMandate || saving}
              style={{
                padding: '12px 24px', background: DS.accent, border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: selectedMandate && !saving ? 'pointer' : 'not-allowed',
                opacity: selectedMandate && !saving ? 1 : 0.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {saving ? (
                <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Saving...</>
              ) : (
                'Save to Pipeline'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
