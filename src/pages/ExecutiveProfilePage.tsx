import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Mail, Linkedin, Briefcase, GraduationCap,
  Award, Shield, Brain, Target, AlertTriangle, CheckCircle2, Zap,
  ExternalLink, Clock, Languages, Building2, FileDown,
  FileText, MessageSquare, Sparkles, Eye, Copy, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { useContact } from '@/hooks/useSupabaseData';
import type { Contact } from '@/services/supabaseApi';
import { executeAIAction, type AIAction } from '@/services/aiQuickActions';

// ─── Tier helpers ───
function getTier(score: number | null): { tier: string; color: string } {
  if (score == null) return { tier: '—', color: '#94A3B8' };
  if (score >= 80) return { tier: 'S', color: '#D4AF37' };
  if (score >= 65) return { tier: 'A', color: '#22C55E' };
  if (score >= 45) return { tier: 'B', color: '#3B82F6' };
  return { tier: 'C', color: '#94A3B8' };
}

const SENIORITY_LABELS: Record<string, string> = {
  c_suite: 'C-Suite', vp: 'VP', director: 'Director', leadership: 'Leadership',
  senior_manager: 'Sr. Manager', manager: 'Manager', partner: 'Partner',
};

const CRITERIA_META: Record<string, { label: string; color: string }> = {
  c1_industry_relevance: { label: 'Industry Relevance', color: '#D4AF37' },
  c2_functional_expertise: { label: 'Functional Expertise', color: '#22C55E' },
  c3_leadership_scale: { label: 'Leadership Scale', color: '#3B82F6' },
  c4_track_record: { label: 'Track Record', color: '#A855F7' },
  c5_strategic_fit: { label: 'Strategic & Cultural Fit', color: '#F97316' },
};

// ─── Scoring Panel (triggers DeepSeek 5-criteria) ───
function ScoringPanel({ contact }: { contact: Contact }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScore = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/scoring/5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: contact.id }),
      });
      if (!res.ok) throw new Error(`Score API error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // If we have a score result, show the breakdown
  if (result) {
    const composite = result.composite_score || 0;
    const { tier, color } = getTier(composite);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Score Results</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color }}>{composite}</span>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: color }}>Tier {tier}</span>
          </div>
        </div>
        {result.sub_scores && Object.entries(result.sub_scores).map(([key, val]: [string, any]) => {
          const meta = CRITERIA_META[key];
          if (!meta) return null;
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-primary">{meta.label}</span>
                <span className="text-xs font-bold font-mono" style={{ color: meta.color }}>{val.score}</span>
              </div>
              <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val.score}%`, backgroundColor: meta.color }} />
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed">{val.rationale}</p>
            </div>
          );
        })}
        {result.match_reasons?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border-subtle">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Match Reasons</span>
            {result.match_reasons.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 size={11} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-text-secondary">{r}</span>
              </div>
            ))}
          </div>
        )}
        {result.risk_factors?.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Risk Factors</span>
            {result.risk_factors.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle size={11} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-text-secondary">{r}</span>
              </div>
            ))}
          </div>
        )}
        {result.approach_strategy && (
          <div className="bg-accent/5 border border-accent/20 rounded-none p-3 space-y-1">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Approach Strategy</span>
            <p className="text-[11px] text-text-secondary leading-relaxed">{result.approach_strategy}</p>
          </div>
        )}
      </div>
    );
  }

  // No score yet — show trigger button
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-text-muted">
        <Target size={14} />
        <span className="text-xs font-bold uppercase tracking-wider">5-Criteria Assessment</span>
      </div>
      <p className="text-[11px] text-text-muted">Run AI-powered assessment across Industry, Functional, Leadership, Track Record, and Strategic Fit criteria.</p>
      <Button onClick={handleScore} disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-bold py-2.5 rounded-none transition-all">
        {loading ? (
          <span className="flex items-center gap-2"><Clock size={13} className="animate-spin" /> Assessing...</span>
        ) : (
          <span className="flex items-center gap-2"><Zap size={13} /> Trigger Assessment</span>
        )}
      </Button>
      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

// ─── AI Quick Actions Panel ───
const AI_ACTIONS_LIST: { key: AIAction; label: string; icon: any; color: string; desc: string }[] = [
  { key: 'email', label: 'Outreach Email', icon: Mail, color: '#3B82F6', desc: 'Professional outreach email' },
  { key: 'cv', label: 'CV Summary', icon: FileText, color: '#00C853', desc: '3-4 bullet point summary' },
  { key: 'shortlist', label: 'Shortlist Blurb', icon: Sparkles, color: '#C108AB', desc: 'Client-ready summary' },
  { key: 'overview', label: 'Internal Overview', icon: Eye, color: '#6366F1', desc: '5-criteria assessment notes' },
  { key: 'feedback', label: 'Interview Feedback', icon: MessageSquare, color: '#FFB300', desc: 'Post-interview feedback draft' },
];

function AIQuickActionsPanel({ contact }: { contact: Contact }) {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAction = async (action: AIAction) => {
    if (activeAction === action) { setActiveAction(null); setOutput(''); return; }
    setActiveAction(action);
    setOutput('');
    setError(null);
    setLoading(true);
    try {
      const result = await executeAIAction(action, {
        name: contact.name || 'Candidate',
        title: contact.current_title || undefined,
        company: (contact as any)?.company?.name || contact.company || undefined,
        mandate: 'LYC Partners search',
        viewMode: 'internal',
      });
      setOutput(result);
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs">
          <Sparkles size={14} className="text-accent" />
          AI Content Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {AI_ACTIONS_LIST.map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.key;
            return (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-none text-xs font-medium border transition-all min-h-[44px] ${
                  isActive
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-bg-tertiary bg-bg-primary text-text-secondary hover:border-accent/30 hover:bg-accent/5'
                }`}
              >
                <Icon size={13} style={{ color: isActive ? undefined : action.color }} />
                <div className="text-left min-w-0">
                  <div className="truncate">{action.label}</div>
                  <div className="text-[9px] text-text-muted font-normal truncate">{action.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Output area */}
        {activeAction && (
          <div className="border border-bg-tertiary rounded-none overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary/50 border-b border-bg-tertiary">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                {AI_ACTIONS_LIST.find(a => a.key === activeAction)?.label}
              </span>
              <div className="flex items-center gap-1">
                {output && (
                  <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
                    <Copy size={10} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
                <button onClick={() => { setActiveAction(null); setOutput(''); }} className="p-1 rounded hover:bg-bg-tertiary transition-colors">
                  <X size={12} className="text-text-muted" />
                </button>
              </div>
            </div>
            <div className="p-3 min-h-[80px] max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock size={12} className="animate-spin" />
                  <span className="text-xs">Generating...</span>
                </div>
              ) : error ? (
                <p className="text-xs text-red-400">{error}</p>
              ) : output ? (
                <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{output}</div>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Career Timeline ───
function CareerTimeline({ history }: { history: Array<{ company: string; role: string }> }) {
  if (!history || history.length === 0) {
    return <p className="text-xs text-text-muted italic">No career history available.</p>;
  }
  return (
    <div className="pl-4 border-l-2 border-border-subtle ml-2 space-y-5 relative">
      {history.map((item, idx) => (
        <div key={idx} className="relative space-y-1">
          <div className={`absolute -left-[22px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-bg-primary ${idx === 0 ? 'border-accent ring-4 ring-accent/10' : 'border-border-subtle'}`} />
          <div className="flex flex-wrap justify-between items-baseline">
            <span className="text-[10px] font-bold text-accent font-mono">#{history.length - idx}</span>
            <span className="text-[10px] text-text-muted font-semibold">{item.company}</span>
          </div>
          <h4 className="text-xs font-bold text-text-primary">{item.role}</h4>
          <p className="text-[11px] text-text-muted flex items-center gap-1">
            <Building2 size={10} /> {item.company}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───
export function ExecutiveProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: contact, loading, error } = useContact(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Clock size={24} className="animate-spin text-accent" />
          <span className="text-sm text-text-muted">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <AlertTriangle size={32} className="text-red-400 mx-auto" />
          <p className="text-sm text-text-muted">{error || 'Contact not found'}</p>
          <Link to="/platform/candidates" className="text-xs text-accent hover:underline">← Back to Talent Pool</Link>
        </div>
      </div>
    );
  }

  const tier = getTier(contact.match_score_best ?? contact.trident_composite);
  const seniorityLabel = contact.seniority ? (SENIORITY_LABELS[contact.seniority] || contact.seniority) : null;
  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link to="/platform/candidates" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors">
          <ArrowLeft size={13} /> Back to Talent Pool
        </Link>
        <Link to={`/platform/candidates/${id}/report`} target="_blank" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors bg-accent/10 px-3 py-1.5 rounded-none">
          <FileDown size={13} /> Generate Report
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: tier.color }} />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl text-white font-serif font-bold text-2xl flex items-center justify-center uppercase shadow-lg flex-shrink-0" style={{ backgroundColor: tier.color }}>
              {initials}
            </div>
            {/* Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-text-primary">{contact.name}</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                  Tier {tier.tier}
                </span>
                {seniorityLabel && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-[10px] text-text-secondary font-semibold text-text-muted">{seniorityLabel}</span>
                )}
                {contact.cxo_stamp && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/10 text-accent">CXO</span>
                )}
              </div>
              <p className="text-sm text-text-secondary font-medium">{contact.current_title || 'Title not available'}</p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                {contact.location && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {contact.location}</span>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-accent"><Mail size={11} /> {contact.email}</a>
                )}
                {contact.linkedin_url && (
                  <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent">
                    <Linkedin size={11} /> LinkedIn <ExternalLink size={9} />
                  </a>
                )}
                {contact.is_expat && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-text-secondary text-[9px]">Expat</span>}
              </div>
              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 pt-2">
                {contact.trident_composite != null && (
                  <div className="text-center">
                    <div className="text-lg font-bold font-mono text-text-primary">{contact.trident_composite}</div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">Trident</div>
                  </div>
                )}
                {contact.trident_d1 != null && (
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-text-secondary">{contact.trident_d1}</div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">D1 Caliber</div>
                  </div>
                )}
                {contact.trident_d2 != null && (
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-text-secondary">{contact.trident_d2}</div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">D2 Network</div>
                  </div>
                )}
                {contact.trident_d3 != null && (
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-text-secondary">{contact.trident_d3}</div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">D3 Access</div>
                  </div>
                )}
                {contact.engagement_score != null && (
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-text-secondary">{contact.engagement_score}</div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">Engagement</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Career + Education + Skills */}
        <div className="lg:col-span-7 space-y-6">
          {/* Career Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Briefcase size={14} className="text-accent" />
                Career Trajectory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CareerTimeline history={contact.career_history || []} />
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <GraduationCap size={14} className="text-accent" />
                Academic Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contact.education && contact.education.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {contact.education.map((edu, idx) => (
                    <div key={idx} className="bg-bg-tertiary/50 border border-border-subtle rounded-none p-3 space-y-0.5">
                      <h4 className="text-xs font-bold text-text-primary">{edu.degree}</h4>
                      <p className="text-[11px] text-text-muted">{edu.school}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No education records available.</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Zap size={14} className="text-accent" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {(contact.skills || []).map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border border-border-subtle text-text-secondary">{skill}</span>
                ))}
                {(!contact.skills || contact.skills.length === 0) && (
                  <p className="text-xs text-text-muted italic">No skills recorded.</p>
                )}
              </div>
              {/* Languages */}
              {contact.languages && contact.languages.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border-subtle">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Languages size={12} className="text-text-muted" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Languages</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.languages.map((lang, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary / Headline */}
          {(contact.headline || contact.summary) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Brain size={14} className="text-accent" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {contact.headline && <p className="text-xs font-semibold text-text-primary">{contact.headline}</p>}
                {contact.summary && <p className="text-[11px] text-text-secondary leading-relaxed">{contact.summary}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Scoring + Advisory + Approach */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5-Criteria Scoring */}
          <Card>
            <CardContent className="p-5">
              <ScoringPanel contact={contact} />
            </CardContent>
          </Card>

          {/* AI Quick Actions */}
          <AIQuickActionsPanel contact={contact} />

          {/* Advisory & Governance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs">
                <Shield size={14} className="text-accent" />
                Advisory & Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.advisory_lane && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Advisory Lane</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-[10px] text-text-secondary font-semibold">{contact.advisory_lane}</span>
                </div>
              )}
              {contact.advisory_tier && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Advisory Tier</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{contact.advisory_tier}</span>
                </div>
              )}
              {contact.council_tier && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Council Tier</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-accent/10 text-accent">{contact.council_tier}</span>
                </div>
              )}
              {contact.market_side && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Market Side</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-[10px] text-text-secondary">{contact.market_side}</span>
                </div>
              )}
              {contact.commercial_readiness && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Commercial Readiness</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border border-border-subtle ${contact.commercial_readiness === 'high' || contact.commercial_readiness === 'ready' ? 'text-green-500 border-green-500/30' : 'text-text-secondary'}`}>
                    {contact.commercial_readiness}
                  </span>
                </div>
              )}
              {contact.bd_priority && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">BD Priority</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-[10px] text-text-secondary">{contact.bd_priority}</span>
                </div>
              )}
              {contact.activity_status && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Activity Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-border-subtle text-[10px] text-text-secondary">{contact.activity_status}</span>
                </div>
              )}
              {!contact.advisory_lane && !contact.advisory_tier && !contact.council_tier && (
                <p className="text-xs text-text-muted italic">No advisory or governance records.</p>
              )}
            </CardContent>
          </Card>

          {/* ICP Profile */}
          {contact.icp_profile && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Award size={14} className="text-accent" />
                  ICP Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-text-secondary leading-relaxed">{contact.icp_profile}</p>
              </CardContent>
            </Card>
          )}

          {/* Company Association */}
          {(contact as any).company && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Building2 size={14} className="text-accent" />
                  Associated Company
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/platform/companies" className="text-sm font-bold text-accent hover:underline">
                  {(contact as any).company.name}
                </Link>
                {(contact as any).company.industry && (
                  <p className="text-[11px] text-text-muted">{(contact as any).company.industry}</p>
                )}
                {(contact as any).company.country && (
                  <p className="text-[11px] text-text-muted flex items-center gap-1">
                    <MapPin size={10} /> {(contact as any).company.country}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Source</span>
                <span className="text-text-secondary font-mono">{contact.source}</span>
              </div>
              {contact.notion_id && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-muted">Notion ID</span>
                  <span className="text-text-secondary font-mono text-[9px]">{contact.notion_id.slice(0, 8)}...</span>
                </div>
              )}
              <div className="flex justify-between text-[10px]">
                <span className="text-text-muted">Last Updated</span>
                <span className="text-text-secondary font-mono">{new Date(contact.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ExecutiveProfilePage;
