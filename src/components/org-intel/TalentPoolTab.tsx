/**
 * TalentPoolTab — list of individuals in `org_talent_pools` for a selected company.
 *
 * Features:
 *   - Company selector (shared CompanySelect)
 *   - Filters: BU, level, is_leadership
 *   - Table view: name, title, BU, level, location, tenure, leadership flag
 *   - Manual entry form: add a single individual inline
 *   - Empty state: company not selected / no individuals
 *
 * Phase 1: read-only view + manual entry. Bulk CSV import is a Phase 2 add.
 * When T1 SQL is not run, all queries 404 and the empty state shows.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Loader2, Plus, X, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, UserPlus,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { CompanySelect, type Company } from './CompanySelect';

interface Talent {
  id: string;
  target_company_id: string;
  name: string;
  title: string | null;
  bu: string | null;
  level: number | null;
  manager_id: string | null;
  location: string | null;
  linkedin_url: string | null;
  email: string | null;
  tenure_years: number | null;
  is_leadership: boolean | null;
  status: string | null;
  created_at: string;
}

export function TalentPoolTab() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [talent, setTalent] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buFilter, setBuFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [leadershipOnly, setLeadershipOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setTalent([]);
      return;
    }
    const sb = useAuthStore.getState().supabase;
    if (!sb) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error: e } = await sb
          .from('org_talent_pools')
          .select('*')
          .eq('target_company_id', companyId)
          .order('is_leadership', { ascending: false })
          .order('level', { ascending: false })
          .order('name', { ascending: true })
          .limit(500);
        if (e) {
          setError(e.message);
          setTalent([]);
        } else {
          setTalent((data ?? []) as Talent[]);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  // Filtered view
  const filtered = useMemo(() => {
    return talent.filter((t) => {
      if (buFilter && t.bu !== buFilter) return false;
      if (levelFilter && String(t.level ?? '') !== levelFilter) return false;
      if (leadershipOnly && !t.is_leadership) return false;
      return true;
    });
  }, [talent, buFilter, levelFilter, leadershipOnly]);

  // Distinct BUs for filter dropdown
  const bus = useMemo(() => {
    return Array.from(new Set(talent.map((t) => t.bu).filter(Boolean))).sort() as string[];
  }, [talent]);
  const levels = useMemo(() => {
    return Array.from(new Set(talent.map((t) => t.level).filter((l) => l != null))).sort((a, b) => (b ?? 0) - (a ?? 0)) as number[];
  }, [talent]);

  return (
    <div className="space-y-4">
      <CompanySelect value={companyId} onChange={setCompanyId} />

      {!companyId ? (
        <EmptyHint icon={<Users className="w-6 h-6" />} title="Select a company to view its talent pool" />
      ) : loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading talent pool…
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-4 border border-red-200 bg-red-50 rounded-md p-3">
          <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        </div>
      ) : (
        <>
          {/* Filters + add button */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-text-muted mb-1">Business Unit</label>
              <select
                value={buFilter}
                onChange={(e) => setBuFilter(e.target.value)}
                className="border border-bg-hover rounded-md px-2 py-1 text-sm bg-white"
              >
                <option value="">All BUs</option>
                {bus.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Level</label>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="border border-bg-hover rounded-md px-2 py-1 text-sm bg-white"
              >
                <option value="">All levels</option>
                {levels.map((l) => <option key={l} value={String(l)}>L{l}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={leadershipOnly}
                onChange={(e) => setLeadershipOnly(e.target.checked)}
              />
              Leadership only
            </label>
            <div className="ml-auto">
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-light flex items-center gap-1"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {showAddForm ? 'Cancel' : 'Add individual'}
              </button>
            </div>
          </div>

          {showAddForm && companyId && (
            <AddIndividualForm
              companyId={companyId}
              onAdded={() => {
                setShowAddForm(false);
                // refresh
                setCompanyId((c) => {
                  const v = c;
                  setTimeout(() => setCompanyId(v), 0);
                  return c;
                });
              }}
            />
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <EmptyHint
              icon={<Users className="w-6 h-6" />}
              title={talent.length === 0 ? 'No individuals in this company yet' : 'No individuals match the current filters'}
              note={talent.length === 0 ? 'Use the form above to add the first individual, or import a CSV (Phase 2).' : undefined}
            />
          ) : (
            <div className="border border-bg-hover rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Name</th>
                    <th className="text-left px-3 py-2 font-medium">Title</th>
                    <th className="text-left px-3 py-2 font-medium">BU</th>
                    <th className="text-left px-3 py-2 font-medium">Level</th>
                    <th className="text-left px-3 py-2 font-medium">Location</th>
                    <th className="text-left px-3 py-2 font-medium">Tenure (yrs)</th>
                    <th className="text-left px-3 py-2 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-t border-bg-hover hover:bg-bg-secondary/40">
                      <td className="px-3 py-2 font-medium text-text-primary">
                        {t.name}
                        {t.is_leadership && <span className="ml-2 text-xs text-accent font-semibold">LEAD</span>}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">{t.title ?? '—'}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.bu ?? '—'}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.level != null ? `L${t.level}` : '—'}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.location ?? '—'}</td>
                      <td className="px-3 py-2 text-text-secondary">{t.tenure_years ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">
                        {t.linkedin_url && <a href={t.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-accent underline mr-2">LinkedIn</a>}
                        {t.email && <a href={`mailto:${t.email}`} className="text-accent underline">Email</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 text-xs text-text-muted border-t border-bg-hover bg-bg-secondary/40">
                Showing {filtered.length} of {talent.length} individuals
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AddIndividualForm({ companyId, onAdded }: { companyId: string; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bu, setBu] = useState('');
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [email, setEmail] = useState('');
  const [tenureYears, setTenureYears] = useState('');
  const [isLeadership, setIsLeadership] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setResult({ ok: false, msg: 'Name is required' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const sb = useAuthStore.getState().supabase;
    if (!sb) {
      setResult({ ok: false, msg: 'Supabase not available' });
      setSubmitting(false);
      return;
    }
    const row: Record<string, any> = {
      target_company_id: companyId,
      name: name.trim(),
      status: 'active',
    };
    if (title.trim()) row.title = title.trim();
    if (bu.trim()) row.bu = bu.trim();
    if (level) row.level = parseInt(level, 10);
    if (location.trim()) row.location = location.trim();
    if (linkedinUrl.trim()) row.linkedin_url = linkedinUrl.trim();
    if (email.trim()) row.email = email.trim();
    if (tenureYears) row.tenure_years = parseFloat(tenureYears);
    row.is_leadership = isLeadership;

    const { error: e } = await sb.from('org_talent_pools').insert(row);
    if (e) {
      setResult({ ok: false, msg: e.message });
    } else {
      setResult({ ok: true, msg: 'Individual added' });
      // reset
      setName(''); setTitle(''); setBu(''); setLevel(''); setLocation('');
      setLinkedinUrl(''); setEmail(''); setTenureYears(''); setIsLeadership(false);
      onAdded();
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="border border-bg-hover rounded-md p-4 bg-bg-secondary/30 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Name *" value={name} onChange={setName} required />
        <Field label="Title" value={title} onChange={setTitle} />
        <Field label="Business Unit" value={bu} onChange={setBu} />
        <Field label="Level (number)" value={level} onChange={setLevel} type="number" />
        <Field label="Location" value={location} onChange={setLocation} />
        <Field label="Tenure (years)" value={tenureYears} onChange={setTenureYears} type="number" />
        <Field label="LinkedIn URL" value={linkedinUrl} onChange={setLinkedinUrl} />
        <Field label="Email" value={email} onChange={setEmail} type="email" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isLeadership} onChange={(e) => setIsLeadership(e.target.checked)} />
        Leadership role
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-light disabled:opacity-50 flex items-center gap-1"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
        {result && (
          <div className={`text-sm flex items-center gap-1 ${result.ok ? 'text-green-700' : 'text-red-600'}`}>
            {result.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {result.msg}
          </div>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      <input
        type={type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-bg-hover rounded-md px-2 py-1.5 text-sm bg-white"
      />
    </div>
  );
}

function EmptyHint({ icon, title, note }: { icon: React.ReactNode; title: string; note?: string }) {
  return (
    <div className="border-2 border-dashed border-bg-hover rounded-lg p-8 text-center">
      <div className="flex justify-center mb-2 text-text-muted">{icon}</div>
      <p className="text-text-primary font-medium">{title}</p>
      {note && <p className="text-text-muted text-sm mt-1">{note}</p>}
    </div>
  );
}
