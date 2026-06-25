/**
 * OnePagerTab — per-company org summary + GRID PDF generator.
 *
 * Features:
 *   - Company selector
 *   - Company overview card: name, sector, country, headcount, status
 *   - Talent pool stats: total individuals, leadership count, BU distribution
 *   - Evaluation summary: total, average composite, tier distribution
 *   - "Generate GRID PDF" button calls T6 endpoint → downloads PDF
 *   - Past reports list: from `grid_reports` table
 *
 * Phase 1: 5-slide GRID PDF (Overview, Org structure, Talent pool,
 *          Evaluation outcomes, Source quality).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/utils/authFetch';
import {
  FileText, Loader2, AlertTriangle, Download, Building2, Users, BarChart3, Clock,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { CompanySelect } from './CompanySelect';

interface Company {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  hq_city: string | null;
  status: string | null;
  is_comparator: boolean | null;
  website: string | null;
  brief_description: string | null;
  metadata: any;
  created_at: string;
}

interface Snapshot {
  id: string;
  target_company_id: string;
  snapshot_date: string;
  headcount_total: number | null;
  structure_json: any;
}

interface GridReport {
  id: string;
  target_company_id: string;
  title: string;
  pdf_path: string | null;
  slide_count: number | null;
  status: string;
  generated_at: string;
  completed_at: string | null;
}

export function OnePagerTab() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [talentCount, setTalentCount] = useState(0);
  const [leadershipCount, setLeadershipCount] = useState(0);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [avgComposite, setAvgComposite] = useState<number | null>(null);
  const [reports, setReports] = useState<GridReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genMsg, setGenMsg] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!companyId) {
      setCompany(null); setSnapshot(null); setTalentCount(0);
      setLeadershipCount(0); setEvaluationCount(0); setAvgComposite(null);
      setReports([]);
      return;
    }
    const sb = useAuthStore.getState().supabase;
    if (!sb) return;
    setLoading(true);
    setError(null);
    try {
      const [{ data: c }, { data: s }, { count: tc }, { count: lc }, { data: evs }, { data: rps }] = await Promise.all([
        sb.from('target_companies').select('*').eq('id', companyId).single(),
        sb.from('org_snapshots').select('*').eq('target_company_id', companyId).order('snapshot_date', { ascending: false }).limit(1).maybeSingle(),
        sb.from('org_talent_pools').select('id', { count: 'exact', head: true }).eq('target_company_id', companyId),
        sb.from('org_talent_pools').select('id', { count: 'exact', head: true }).eq('target_company_id', companyId).eq('is_leadership', true),
        sb.from('org_evaluations').select('overall_score, org_talent_pools!inner(target_company_id)').eq('org_talent_pools.target_company_id', companyId),
        sb.from('grid_reports').select('*').eq('target_company_id', companyId).order('generated_at', { ascending: false }).limit(20),
      ]);
      setCompany(c as Company);
      setSnapshot(s as Snapshot);
      setTalentCount(tc ?? 0);
      setLeadershipCount(lc ?? 0);
      setEvaluationCount((evs ?? []).length);
      const scores = (evs ?? []).map((e: any) => Number(e.overall_score)).filter((n: number) => Number.isFinite(n));
      setAvgComposite(scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : null);
      setReports((rps ?? []) as GridReport[]);
    } catch (caughtErr) {
      setError((caughtErr as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [companyId]);

  const generatePdf = async () => {
    if (!companyId) return;
    setGenerating(true);
    setError(null);
    setGenMsg(null);
    const sb = useAuthStore.getState().supabase;
    if (!sb) { setGenerating(false); return; }
    try {
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      const res = await authFetch('/api/admin/org-intelligence/grid-reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ target_company_id: companyId }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`PDF generation failed (${res.status}): ${text.slice(0, 300)}`);
        return;
      }
      // Get the report id from the response header
      const reportId = res.headers.get('X-Grid-Report-Id') ?? '';
      const slideCount = res.headers.get('X-Slide-Count') ?? '';
      const filename = `${(company?.name ?? 'company').replace(/[^a-z0-9-]+/gi, '_')}_grid_${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setGenMsg(`GRID PDF generated (${slideCount} slides) — report ${reportId.slice(0, 8)}`);
      await fetchAll();
    } catch (caughtErr) {
      setError((caughtErr as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <CompanySelect value={companyId} onChange={setCompanyId} />

      {!companyId ? (
        <EmptyHint title="Select a company to view its one-pager" />
      ) : loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading company data…
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-4 border border-red-200 bg-red-50 rounded-md p-3">
          <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        </div>
      ) : !company ? (
        <EmptyHint title="Company not found" />
      ) : (
        <>
          {/* Company overview */}
          <div className="border border-bg-hover rounded-md p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Building2 className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-medium text-text-primary">{company.name}</h2>
                  {company.is_comparator && (
                    <span className="text-xs bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5">
                      COMPARATOR
                    </span>
                  )}
                  {company.status && (
                    <span className="text-xs text-text-muted">· {company.status}</span>
                  )}
                </div>
                <div className="text-sm text-text-muted mt-1">
                  {[company.sector, company.hq_city, company.country].filter(Boolean).join(' · ')}
                </div>
                {company.brief_description && (
                  <p className="text-sm text-text-secondary mt-2">{company.brief_description}</p>
                )}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline mt-1 inline-block">
                    {company.website}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Talent pool" value={talentCount} icon={<Users className="w-4 h-4" />} sub={`${leadershipCount} leadership`} />
            <StatCard
              label="Headcount (snapshot)"
              value={snapshot?.headcount_total ?? '—'}
              icon={<BarChart3 className="w-4 h-4" />}
              sub={snapshot?.snapshot_date ?? 'no snapshot'}
            />
            <StatCard
              label="Evaluations"
              value={evaluationCount}
              icon={<BarChart3 className="w-4 h-4" />}
              sub={avgComposite != null ? `avg ${avgComposite}/100` : 'no data'}
            />
            <StatCard
              label="Last GRID PDF"
              value={reports[0] ? new Date(reports[0].generated_at).toLocaleDateString() : '—'}
              icon={<Clock className="w-4 h-4" />}
              sub={reports[0]?.slide_count ? `${reports[0].slide_count} slides` : 'none yet'}
            />
          </div>

          {/* Generate button */}
          <div className="border border-bg-hover rounded-md p-4 bg-bg-secondary/30">
            <h3 className="text-sm font-medium text-text-primary mb-2">Generate GRID PDF</h3>
            <p className="text-sm text-text-muted mb-3">
              Produces a 5-slide deck: company overview, org structure, talent pool stats,
              evaluation outcomes, source quality.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={generatePdf}
                disabled={generating}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-light disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {generating ? 'Generating…' : 'Generate GRID PDF'}
              </button>
              {genMsg && (
                <div className="text-sm text-green-700">{genMsg}</div>
              )}
            </div>
          </div>

          {/* Past reports */}
          {reports.length > 0 && (
            <div className="border border-bg-hover rounded-md p-4">
              <h3 className="text-sm font-medium text-text-primary mb-3">Past reports ({reports.length})</h3>
              <div className="space-y-1">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-bg-hover last:border-b-0">
                    <FileText className="w-4 h-4 text-text-muted" />
                    <span className="flex-1 truncate text-text-primary">{r.title}</span>
                    <span className="text-xs text-text-muted">{r.slide_count ?? '—'} slides</span>
                    <span className="text-xs text-text-muted">{new Date(r.generated_at).toLocaleDateString()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : r.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-bg-secondary text-text-muted'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: number | string; icon?: React.ReactNode; sub?: string }) {
  return (
    <div className="border border-bg-hover rounded-md p-3">
      <div className="flex items-center gap-1 text-xs text-text-muted">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1 text-text-primary">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function EmptyHint({ title }: { title: string }) {
  return (
    <div className="border-2 border-dashed border-bg-hover rounded-lg p-8 text-center">
      <FileText className="w-6 h-6 text-text-muted mx-auto mb-2" />
      <p className="text-text-primary font-medium">{title}</p>
    </div>
  );
}
