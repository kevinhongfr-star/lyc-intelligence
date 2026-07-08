import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, FileText, ClipboardList, Eye, MessageSquare, FileDown, BarChart3, CheckCircle, PauseCircle, XCircle, AlertTriangle, ListChecks, Users } from 'lucide-react';
import { useMandateDetail } from '@/hooks/useSupabaseData';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';
import { STAGE_ORDER, STAGE_CONFIG } from '@/types/mandate';
import { executeAIAction, type AIAction } from '@/services/aiQuickActions';
import { updateMandateStatus, updatePipelineStage, updatePipelineVerdict } from '@/services/supabaseApi';
import { MandateTeam } from '@/components/mandate/MandateTeam';
import { MandateIntakeForm } from '@/components/mandate/MandateIntakeForm';
import { SuccessProfileForm } from '@/components/mandate/SuccessProfileForm';
import { SuccessProfileApproval } from '@/components/mandate/SuccessProfileApproval';
import { OutreachTimeline } from '@/components/outreach/OutreachTimeline';
import { OutreachDashboard } from '@/components/outreach/OutreachDashboard';
import { NextActionReminders } from '@/components/outreach/NextActionReminders';
import { CompanyOverviewGenerator } from '@/components/market/CompanyOverviewGenerator';
import { CompanyRanking } from '@/components/market/CompanyRanking';
import { MarketMapVisualization } from '@/components/market/MarketMapVisualization';
import { useAuthStore } from '@/stores/authStore';
import { getTargetCompanies, calculateFitScores, addTargetCompany } from '@/services/supabaseApi';
import { getSuccessProfiles } from '@/services/supabaseApi';
import type { SuccessProfile } from '@/types';
import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

// ─── Add Company Form Component ───────────────────────────────────────────

function AddCompanyForm({ mandateId, onCompanyAdded }: { mandateId: string; onCompanyAdded: () => void }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addTargetCompany({ name: name.trim(), industry: industry.trim() || undefined, location: location.trim() || undefined, size: size.trim() || undefined, domain: domain.trim() || undefined, mandate_id: mandateId });
    setSaving(false);
    setName('');
    setIndustry('');
    setLocation('');
    setSize('');
    setDomain('');
    setShow(false);
    onCompanyAdded();
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-none p-4">
      {!show ? (
        <button onClick={() => setShow(true)} className="w-full py-3 border-2 border-dashed border-border rounded-none text-text-muted hover:text-accent hover:border-accent transition-colors text-sm font-medium">
          + Add Target Company
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name *" required className="bg-bg-primary border border-border rounded-none px-3 py-2 text-sm min-h-[44px]" />
            <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Industry" className="bg-bg-primary border border-border rounded-none px-3 py-2 text-sm min-h-[44px]" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g., Shanghai)" className="bg-bg-primary border border-border rounded-none px-3 py-2 text-sm min-h-[44px]" />
            <input value={size} onChange={e => setSize(e.target.value)} placeholder="Size (e.g., 5000)" className="bg-bg-primary border border-border rounded-none px-3 py-2 text-sm min-h-[44px]" />
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Domain (e.g., example.com)" className="bg-bg-primary border border-border rounded-none px-3 py-2 text-sm min-h-[44px]" colSpan={2} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary min-h-[44px]">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 bg-accent text-white rounded-none text-sm font-medium hover:bg-accent-hover disabled:opacity-50 min-h-[44px]">
              {saving ? 'Adding...' : 'Add Company'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: '1_search', label: 'SWEEP', color: '#00897B' },
  { value: '2_call', label: 'CANVA', color: '#F59E0B' },
  { value: '3_deliver', label: 'GRID/LENS', color: '#10B981' },
  { value: 'won', label: 'Won', color: '#10B981' },
  { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
  { value: 'lost', label: 'Lost', color: '#EF4444' },
  { value: 'completed', label: 'Completed', color: '#333333' },
];

const NEXT_STAGE: Record<string, string> = { SWEEP: 'CANVA', CANVA: 'GRID', GRID: 'LENS', LENS: 'PLACED' };
const VERDICT_OPTIONS = ['Strong Fit', 'Conditional Fit', 'Weak Fit', 'Hold', 'Reject'];

const AI_ACTIONS: { key: AIAction; icon: any; label: string }[] = [
  { key: 'email', icon: Mail, label: 'Email' }, { key: 'cv', icon: FileText, label: 'CV' },
  { key: 'shortlist', icon: ClipboardList, label: 'Shortlist' }, { key: 'overview', icon: Eye, label: 'Overview' },
  { key: 'feedback', icon: MessageSquare, label: 'Feedback' },
];

type TabKey = 'overview' | 'intake' | 'success-profile' | 'market' | 'outreach' | 'pipeline';

export function MandateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { mandate, pipeline, loading, refresh } = useMandateDetail(id || '');
  const [tab, setTab] = useState<TabKey>('overview');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [successProfiles, setSuccessProfiles] = useState<SuccessProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [targetCompanies, setTargetCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!mandate?.id) return;
    setLoadingProfiles(true);
    const profiles = await getSuccessProfiles(mandate.id);
    setSuccessProfiles(profiles.map(p => normalizeProfile(p)));
    setLoadingProfiles(false);
  }, [mandate?.id]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const loadCompanies = useCallback(async () => {
    if (!mandate?.id) return;
    setLoadingCompanies(true);
    const companies = await getTargetCompanies(mandate.id);
    setTargetCompanies(companies);
    setLoadingCompanies(false);
  }, [mandate?.id]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const hasApprovedProfile = successProfiles.some(p => p.status === 'approved');
  const hasPendingProfile = successProfiles.some(p => p.status === 'pending_approval');
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'lyc_admin';

  function normalizeProfile(raw: any): SuccessProfile {
    return {
      id: raw.id || '',
      mandate_id: raw.mandate_id || '',
      required_experience_years: raw.required_experience_years ?? null,
      required_industries: Array.isArray(raw.required_industries) ? raw.required_industries : [],
      required_geographies: Array.isArray(raw.required_geographies) ? raw.required_geographies : [],
      required_companies: Array.isArray(raw.required_companies) ? raw.required_companies : [],
      deal_size_range: raw.deal_size_range || null,
      team_size_managed: raw.team_size_managed ?? null,
      target_disc_profile: (raw.target_disc_profile as any) || 'mixed',
      personality_indicators: Array.isArray(raw.personality_indicators) ? raw.personality_indicators : [],
      character_requirements: Array.isArray(raw.character_requirements) ? raw.character_requirements : [],
      education_requirements: Array.isArray(raw.education_requirements) ? raw.education_requirements : [],
      certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
      language_requirements: Array.isArray(raw.language_requirements) ? raw.language_requirements : [],
      status: (raw.status as any) || 'draft',
      defined_by: raw.defined_by || null,
      approved_by: raw.approved_by || null,
      approval_notes: raw.approval_notes || null,
      rejection_reason: raw.rejection_reason || null,
      created_at: raw.created_at || new Date().toISOString(),
      updated_at: raw.updated_at || new Date().toISOString(),
    };
  }
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    await updateMandateStatus(id!, newStatus);
    await refresh();
    setStatusUpdating(false);
  };

  const handleStageChange = async (pipelineId: string, newStage: string) => {
    await updatePipelineStage(pipelineId, newStage);
    await refresh();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!mandate) return <div className="text-text-muted text-center py-20">Mandate not found</div>;

  // ── Intake gate evaluation ──
  const intakeData = (mandate.intake_data as any) || null;
  const intakeComplete = intakeData && intakeData.intake_complete === true;
  const intakeBlockMessage =
    'Complete the mandate intake (Business Pain Points + Leadership Needs) before adding candidates or running sourcing sweeps.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/platform/mandates" className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm">
          <ArrowLeft className="w-4 h-4" />Back to Mandates
        </Link>
        <div className="flex gap-2">
          <Link to={`/platform/mandates/${id}/lens`}>
            <Button variant="outline" size="sm"><FileDown className="w-4 h-4" />Candidate Report</Button>
          </Link>
          <Link to="/platform/batch-scoring">
            <Button variant="outline" size="sm" disabled={!intakeComplete} title={intakeComplete ? undefined : intakeBlockMessage}>
              <BarChart3 className="w-4 h-4" />Match Score
            </Button>
          </Link>
          <Link to="/platform/pipeline">
            <Button variant="outline" size="sm"><Eye className="w-4 h-4" />GRID View</Button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-serif font-bold text-text-primary">{mandate.title}</h1>
        <p className="text-text-muted">{mandate.company?.name ?? 'No client'}</p>
      </div>

      {/* Intake warning banner */}
      {!intakeComplete && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-amber-900 text-sm">Intake not complete</div>
                <div className="text-amber-800 text-sm mt-0.5">{intakeBlockMessage}</div>
                <button
                  onClick={() => setTab('intake')}
                  className="text-xs mt-2 text-amber-900 underline hover:text-amber-950"
                >
                  → Go to Intake tab
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status bar with action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-text-muted">Status:</span>
        <select
          value={mandate.status}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="text-sm bg-bg-tertiary text-text-primary rounded-none px-3 py-2 border-0 min-h-[44px]"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => handleStatusChange('won')} className="flex items-center gap-1 px-3 py-2 bg-tier-1/20 text-tier-1 rounded-none text-sm hover:bg-tier-1/30 min-h-[44px]">
          <CheckCircle className="w-3.5 h-3.5" />Won
        </button>
        <button onClick={() => handleStatusChange('on_hold')} className="flex items-center gap-1 px-3 py-2 bg-tier-2/20 text-tier-2 rounded-none text-sm hover:bg-tier-2/30 min-h-[44px]">
          <PauseCircle className="w-3.5 h-3.5" />Hold
        </button>
        <button onClick={() => handleStatusChange('lost')} className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-none text-sm hover:bg-red-500/30 min-h-[44px]">
          <XCircle className="w-3.5 h-3.5" />Lost
        </button>
        {intakeComplete ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
            <ListChecks className="w-3.5 h-3.5" /> Intake complete
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Intake required
          </span>
        )}
      </div>

      {/* Stage pipeline bar */}
      <div className="flex gap-1">
        {STAGE_ORDER.map(s => {
          const c = s === 'SWEEP' ? mandate.tier1_count : s === 'CANVA' ? mandate.tier2_count : s === 'GRID' ? mandate.shortlisted_count : s === 'LENS' ? mandate.interview_count : mandate.placed_count;
          return <div key={s} className="flex-1 h-10 rounded flex items-center justify-center text-sm font-medium" style={{ backgroundColor: `${STAGE_CONFIG[s].color}20`, color: STAGE_CONFIG[s].color }}>{s}: {c}</div>;
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-4">
        {([
          { key: 'overview', label: 'Overview', icon: Eye },
          { key: 'intake', label: 'Intake', icon: ListChecks, warn: !intakeComplete },
          { key: 'success-profile', label: 'Success Profile', icon: CheckCircle, warn: !hasApprovedProfile },
          { key: 'market', label: 'Market', icon: MapPin },
          { key: 'outreach', label: 'Outreach', icon: MessageSquare },
          { key: 'pipeline', label: `Pipeline (${pipeline.length})`, icon: Users },
        ] as { key: TabKey; label: string; icon: any; warn?: boolean }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 text-sm pb-3 border-b-2 -mb-px ${
              tab === t.key
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.warn && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-label="action needed" />}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* PHI info if available */}
          {mandate.phi_composite != null && (
            <Card>
              <CardHeader className="py-2"><CardTitle className="text-sm">PHI Health</CardTitle></CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: 'Urgency', val: mandate.phi_urgency },
                    { label: 'Strategic', val: mandate.phi_strategic },
                    { label: 'Value', val: mandate.phi_value },
                    { label: 'Retainer', val: mandate.phi_retainer },
                    { label: 'Decision', val: mandate.phi_decision },
                  ].map(m => (
                    <div key={m.label}>
                      <p className="text-xs text-text-muted">{m.label}</p>
                      <p className={`text-lg font-bold ${m.val != null ? (m.val >= 7 ? 'text-red-400' : m.val >= 4 ? 'text-tier-2' : 'text-tier-1') : 'text-text-muted'}`}>{m.val ?? '—'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mandate Team */}
          <Card>
            <CardHeader className="py-2"><CardTitle className="text-sm">Team</CardTitle></CardHeader>
            <CardContent className="py-0">
              <MandateTeam mandateId={mandate.id} isAdmin={profile?.role === 'admin'} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="font-serif text-lg font-semibold text-text-primary">
                Pipeline ({pipeline.length} candidates)
              </h2>
              {!intakeComplete && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Pipeline additions are locked until intake is complete. Complete the Intake tab first.
                </p>
              )}
              {pipeline.map(p => (
                <div key={p.id} onClick={() => setSelectedCandidate(p.contact_id)} className={`bg-bg-secondary border rounded-none p-4 cursor-pointer transition-colors ${selectedCandidate === p.contact_id ? 'border-accent' : 'border-bg-tertiary hover:border-accent/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{p.contact?.name?.[0] ?? '?'}</div>
                      <div>
                        <h3 className="font-medium text-text-primary">{p.contact?.name ?? 'Unknown'}</h3>
                        <p className="text-xs text-text-muted">{p.contact?.current_title ?? ''} · {p.contact?.company?.name ?? ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.trident_composite != null && <Badge variant={p.trident_composite >= 75 ? 'success' : p.trident_composite >= 50 ? 'warning' : 'default'}>{p.trident_composite}</Badge>}
                      <Badge>{p.stage}</Badge>
                    </div>
                  </div>
                  {p.verdict && <p className="text-xs text-text-muted mt-1">Verdict: {p.verdict}</p>}
                  <div className="flex gap-2 mt-2">
                    {NEXT_STAGE[p.stage] && (
                      <button onClick={e => { e.stopPropagation(); handleStageChange(p.id, NEXT_STAGE[p.stage]); }}
                        className="text-xs px-2 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors">
                        → {STAGE_CONFIG[NEXT_STAGE[p.stage] as keyof typeof STAGE_CONFIG]?.label}
                      </button>
                    )}
                    <select
                      value={p.verdict || ''}
                      onClick={e => e.stopPropagation()}
                      onChange={async e => { await updatePipelineVerdict(p.id, e.target.value); await refresh(); }}
                      className="text-xs bg-bg-tertiary text-text-muted rounded px-1 py-0.5 border-0"
                    >
                      <option value="">Verdict</option>
                      {VERDICT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {selectedCandidate && (
                <Card>
                  <CardHeader><CardTitle>AI Quick Actions</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {AI_ACTIONS.map(a => (
                        <Button key={a.key} variant="outline" size="sm" onClick={() => {
                          const candidate = pipeline.find(p => p.contact_id === selectedCandidate)?.contact;
                          if (!candidate) return;
                          setAiLoading(a.key);
                          executeAIAction(a.key, { name: candidate.name, title: candidate.current_title || undefined, company: candidate.company?.name || undefined, mandate: mandate.title, viewMode: 'internal' }).then(out => { setAiOutput(out); setAiLoading(null); });
                        }} disabled={aiLoading !== null}>
                          {aiLoading === a.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <a.icon className="w-3 h-3" />}{a.label}
                        </Button>
                      ))}
                    </div>
                    {aiOutput && <div className="bg-bg-tertiary rounded-none p-3 text-sm text-text-secondary whitespace-pre-wrap max-h-64 overflow-auto">{aiOutput}</div>}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'intake' && (
        <MandateIntakeForm mandate={mandate} onSaved={() => refresh()} />
      )}

      {tab === 'success-profile' && (
        <div className="space-y-4">
          {loadingProfiles ? (
            <div className="py-10 text-center">Loading profiles...</div>
          ) : (
            <>
              {/* Admin approval panel */}
              {isAdmin && hasPendingProfile && (
                <SuccessProfileApproval
                  profile={successProfiles.find(p => p.status === 'pending_approval')!}
                  mandateTitle={mandate.title}
                  onApproved={() => loadProfiles()}
                />
              )}

              {/* Success profile form */}
              <SuccessProfileForm mandate={mandate} onSaved={() => loadProfiles()} />

              {/* Profile history */}
              {successProfiles.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Previous Profiles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {successProfiles.slice(1).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs mr-2 ${
                              p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {p.status.replace('_', ' ')}
                            </span>
                            Created {new Date(p.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'market' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl text-text-primary">Market Definition</h2>
            <p className="text-sm text-text-muted mt-1">
              Define your target market with company rankings, AI-generated overviews, and market map visualization.
            </p>
          </div>

          {/* Add company form */}
          <AddCompanyForm mandateId={mandate.id} onCompanyAdded={loadCompanies} />

          {/* Market map and rankings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Rankings panel */}
            <div>
              <h3 className="font-serif text-lg text-text-primary mb-3">Company Rankings</h3>
              <CompanyRanking
                companies={targetCompanies}
                successProfile={successProfiles.find(p => p.status === 'approved')}
                mandateId={mandate.id}
                onRanksChanged={setTargetCompanies}
              />
            </div>

            {/* Market map */}
            <div>
              <h3 className="font-serif text-lg text-text-primary mb-3">Market Map</h3>
              <MarketMapVisualization
                companies={targetCompanies}
                mandateId={mandate.id}
                onCompanyClick={(company) => setSelectedCompany(company)}
              />
            </div>
          </div>

          {/* Selected company detail */}
          {selectedCompany && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCompany(null)}>
              <div className="bg-bg-primary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-serif text-xl text-text-primary">{selectedCompany.name}</h2>
                      <p className="text-sm text-text-muted">
                        {selectedCompany.industry} • {selectedCompany.location}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="p-2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <CompanyOverviewGenerator
                    company={selectedCompany}
                    onOverviewGenerated={(overview) => {
                      setTargetCompanies(prev =>
                        prev.map(c => c.id === selectedCompany.id ? { ...c, company_overview: overview, overview_status: 'completed' } : c)
                      );
                      setSelectedCompany(prev => prev ? { ...prev, company_overview: overview, overview_status: 'completed' } : null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'outreach' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-xl text-text-primary">Outreach Tracking</h2>
            <p className="text-sm text-text-muted mt-1">Log and track every outreach attempt for each candidate in this mandate.</p>
          </div>

          {/* Outreach Dashboard: Response metrics */}
          <div>
            <h3 className="font-serif text-lg text-text-primary mb-3">Response Performance</h3>
            <OutreachDashboard mandateId={mandate.id} mandateTitle={mandate.title} compact={true} />
          </div>

          {/* Next Action Reminders */}
          <div>
            <h3 className="font-serif text-lg text-text-primary mb-3">Upcoming Follow-ups</h3>
            <NextActionReminders daysAhead={14} maxItems={15} />
          </div>

          {/* Per-candidate outreach panels */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-text-primary">Per-Candidate Outreach</h3>
            {pipeline.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-text-muted text-sm">
                  No candidates in this pipeline yet. Add candidates to start tracking outreach.
                </CardContent>
              </Card>
            ) : (
              pipeline.map((p: any) => {
                const contact = p.contact || {};
                const contactName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Candidate';
                return (
                  <div key={p.id} className="bg-bg-secondary border border-border rounded-none p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-medium">
                          {contactName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{contactName}</p>
                          <p className="text-xs text-text-muted">
                            {[contact.title, contact.company?.name].filter(Boolean).join(' • ') || 'Candidate'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                        {p.stage || 'New'}
                      </span>
                    </div>
                    <OutreachTimeline
                      candidateId={contact.id || p.contact_id}
                      mandateId={mandate.id}
                      candidateName={contactName}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-text-primary">Full pipeline view</h2>
          {!intakeComplete && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="py-3 text-sm text-amber-900">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{intakeBlockMessage}</div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 space-y-3">
              {pipeline.map(p => (
                <div key={p.id} onClick={() => setSelectedCandidate(p.contact_id)} className={`bg-bg-secondary border rounded-none p-4 cursor-pointer transition-colors ${selectedCandidate === p.contact_id ? 'border-accent' : 'border-bg-tertiary hover:border-accent/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{p.contact?.name?.[0] ?? '?'}</div>
                      <div>
                        <h3 className="font-medium text-text-primary">{p.contact?.name ?? 'Unknown'}</h3>
                        <p className="text-xs text-text-muted">{p.contact?.current_title ?? ''} · {p.contact?.company?.name ?? ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.trident_composite != null && <Badge variant={p.trident_composite >= 75 ? 'success' : p.trident_composite >= 50 ? 'warning' : 'default'}>{p.trident_composite}</Badge>}
                      <Badge>{p.stage}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {pipeline.length === 0 && <p className="text-text-muted text-sm">No candidates yet. Add candidates to this mandate from Contacts or Match Score.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
