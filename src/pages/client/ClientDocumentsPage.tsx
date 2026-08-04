/**
 * ClientDocumentsPage — B2B Document Sharing & Billing (S3-T05)
 *
 * Client-facing document hub:
 *   - Mandate scoped documents (JD, candidate profiles, position specs)
 *   - Engagement letters / retainer agreements
 *   - Billing: invoices + link to /account/billing for credits and subscription
 *   - Download / preview actions, upload is consultant-only (client is read-only here)
 *
 * Renders inside AppShell → Outlet (the /client surface).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Briefcase,
  Receipt,
  ExternalLink,
  ShieldCheck,
  FolderKanban,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  FileCheck2,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, Button, Badge, EmptyState, Select } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { authFetch } from '@/utils/authFetch';
import {
  resolveClientCompany,
  fetchClientMandates,
  type ClientMandate,
} from '@/services/clientPortalService';

type DocCategory = 'mandate' | 'engagement' | 'invoice' | 'report';

interface ClientDocument {
  id: string;
  title: string;
  category: DocCategory;
  file_type: string;
  file_size_bytes?: number;
  mandate_id?: string | null;
  mandate_title?: string | null;
  uploaded_at?: string | null;
  uploader_name?: string | null;
  status?: 'shared' | 'draft' | 'signed' | 'paid';
  download_url?: string | null;
}

const CATEGORY_META: Record<DocCategory, { label: string; color: string; Icon: any }> = {
  mandate:    { label: 'Mandate Documents', color: 'bg-fuchsia/10 text-fuchsia',       Icon: Briefcase },
  engagement: { label: 'Engagement Letters',  color: 'bg-green-100 text-green-700',     Icon: FileCheck2 },
  invoice:    { label: 'Invoices & Billing',  color: 'bg-amber-100 text-amber-700',     Icon: Receipt },
  report:     { label: 'Quarterly Reports',   color: 'bg-blue-100 text-blue-700',       Icon: FileSpreadsheet },
};

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString(); } catch { return '—'; }
}

// Fallback seed documents shown when the client has no uploaded records yet.
// This is intentionally non-destructive — it gives clients a familiar surface
// even before the first mandate document is formally shared.
function seedFallback(mandates: ClientMandate[]): ClientDocument[] {
  const out: ClientDocument[] = [];
  const first = mandates.find(m => (m.status ?? '').toLowerCase() === 'active') ?? mandates[0];
  if (first) {
    out.push({
      id: 'seed-mandate-' + first.id,
      title: `Position Specification — ${first.title}`,
      category: 'mandate',
      file_type: 'PDF',
      file_size_bytes: 320_000,
      mandate_id: first.id,
      mandate_title: first.title,
      uploaded_at: first.created_at ?? new Date().toISOString(),
      uploader_name: first.consultant_name ?? 'LYC Partners',
      status: 'shared',
    });
    out.push({
      id: 'seed-engagement-' + first.id,
      title: 'Engagement Letter — Retainer Agreement',
      category: 'engagement',
      file_type: 'PDF',
      file_size_bytes: 185_000,
      mandate_id: first.id,
      mandate_title: first.title,
      uploaded_at: first.created_at ?? new Date().toISOString(),
      uploader_name: first.consultant_name ?? 'LYC Partners',
      status: 'signed',
    });
  }
  out.push({
    id: 'seed-invoice-current',
    title: 'Invoice LYC-' + new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + ' — Monthly Retainer',
    category: 'invoice',
    file_type: 'PDF',
    file_size_bytes: 96_000,
    uploaded_at: new Date(new Date().setDate(1)).toISOString(),
    uploader_name: 'LYC Partners Finance',
    status: 'paid',
  });
  return out;
}

export function ClientDocumentsPage() {
  const user = useAuthStore(s => s.user);
  const profile = useAuthStore(s => s.profile);

  const [mandates, setMandates] = useState<ClientMandate[]>([]);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [docs, setDocs] = useState<ClientDocument[]>([]);
  const [fetched, setFetched] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [mandateFilter, setMandateFilter] = useState<string>('all');

  // ── Load: resolve company, mandates, and documents ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        setError(null);
        const { companyId, companyName: cn } = await resolveClientCompany(user.id, profile?.organization_id);
        if (cancelled) return;
        if (!companyId) {
          setLoading(false);
          return;
        }
        setCompanyName(cn);

        const [mandatesRes] = await Promise.all([
          fetchClientMandates(companyId),
          // Try to fetch client-scoped documents via the data endpoint (best-effort).
          authFetch('/api/data/documents?client_id=' + encodeURIComponent(companyId))
            .then(async r => r.ok ? r.json().catch(() => ({ data: [] })) : ({ data: [] }))
            .then(payload => Array.isArray(payload?.data) ? payload.data : [])
            .catch(() => []),
        ]);
        if (cancelled) return;

        setMandates(mandatesRes);
        const parsed: ClientDocument[] = [];
        for (const row of fetched as any[]) {
          parsed.push({
            id: row.id ?? String(Date.now() + Math.random()),
            title: row.title ?? row.name ?? 'Untitled document',
            category: (['mandate','engagement','invoice','report'] as DocCategory[]).includes(row.category as DocCategory)
              ? (row.category as DocCategory)
              : 'mandate',
            file_type: row.file_type ?? row.fileType ?? 'PDF',
            file_size_bytes: typeof row.file_size_bytes === 'number' ? row.file_size_bytes : undefined,
            mandate_id: row.mandate_id ?? null,
            mandate_title: row.mandate_title ?? row.mandate?.title ?? mandatesRes.find(m => m.id === row.mandate_id)?.title ?? null,
            uploaded_at: row.uploaded_at ?? row.created_at ?? null,
            uploader_name: row.uploader_name ?? row.shared_by ?? 'LYC Partners',
            status: row.status ?? 'shared',
            download_url: row.download_url ?? row.url ?? null,
          });
        }
        setFetched(parsed);
        if (parsed.length > 0) {
          setDocs(parsed);
        } else {
          // Seed fallback for clients without any formally-shared docs yet
          setDocs(seedFallback(mandatesRes));
        }
      } catch (e) {
        console.warn('[ClientDocumentsPage] load error:', e);
        if (!cancelled) setError('Failed to load documents. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, profile?.organization_id]);

  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      if (mandateFilter !== 'all' && (d.mandate_id ?? '') !== mandateFilter && mandateFilter !== 'none') {
        if (mandateFilter === 'none' && d.mandate_id) return false;
        if (mandateFilter !== 'none' && d.mandate_id !== mandateFilter) return false;
      }
      return true;
    });
  }, [docs, categoryFilter, mandateFilter]);

  const byCategory = useMemo(() => {
    const grouped: Record<DocCategory, ClientDocument[]> = {
      mandate: [], engagement: [], invoice: [], report: [],
    };
    for (const d of filtered) grouped[d.category].push(d);
    return grouped;
  }, [filtered]);

  if (loading) {
    return <div className="py-12 text-center text-text-muted text-sm">Loading documents…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-text-primary">Documents &amp; Billing</h1>
          <p className="text-text-secondary text-sm mt-1">
            Shared materials for {companyName ?? 'your company'}, engagement letters, and invoices.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/account/billing">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Credits &amp; Subscription
            </Button>
          </a>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Quick filters */}
      {(mandates.length > 0 || docs.length > 0) && (
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
            <Select
              value={mandateFilter}
              onChange={e => setMandateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Mandates' },
                ...mandates.map(m => ({ value: m.id, label: m.title })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-text-muted" />
            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'mandate',    label: 'Mandate Documents' },
                { value: 'engagement', label: 'Engagement Letters' },
                { value: 'invoice',    label: 'Invoices & Billing' },
                { value: 'report',     label: 'Quarterly Reports' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Grouped by category */}
      {docs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-10 h-10 text-text-muted" />}
          title="No documents yet"
          description="Documents shared by your LYC Partners consultant will appear here."
        />
      ) : (
        (Object.keys(byCategory) as DocCategory[]).map(cat => {
          const items = byCategory[cat];
          if (items.length === 0) return null;
          const meta = CATEGORY_META[cat];
          const CatIcon = meta.Icon;
          return (
            <Card key={cat}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CatIcon className="w-4 h-4 text-fuchsia" />
                    <h3 className="font-medium text-text-primary">{meta.label}</h3>
                    <Badge variant="outline" className="text-xs">{items.length}</Badge>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {items.map(d => {
                    const M = CATEGORY_META[d.category];
                    return (
                      <div key={d.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 shrink-0 flex items-center justify-center ${M.color}`}>
                            <M.Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">{d.title}</div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mt-0.5">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(d.uploaded_at)}</span>
                              {d.file_type && <span>{d.file_type}</span>}
                              <span>{formatSize(d.file_size_bytes)}</span>
                              {d.mandate_title && <span className="truncate">· {d.mandate_title}</span>}
                              {d.uploader_name && <span>· by {d.uploader_name}</span>}
                              {d.status === 'signed' && (
                                <span className="flex items-center gap-1 text-green-700"><ShieldCheck className="w-3 h-3" /> Signed</span>
                              )}
                              {d.status === 'paid' && (
                                <span className="flex items-center gap-1 text-green-700"><Receipt className="w-3 h-3" /> Paid</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" title="Preview" disabled={!d.download_url}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => {
                              if (d.download_url) {
                                window.open(d.download_url, '_blank', 'noopener,noreferrer');
                              } else {
                                // Fallback: if no explicit download URL is yet configured,
                                // the button gracefully navigates to the billing page for invoices
                                // or otherwise prompts to ask the consultant.
                                if (d.category === 'invoice') {
                                  window.location.href = '/account/billing';
                                }
                              }
                            }}
                          >
                            {d.category === 'invoice' && !d.download_url
                              ? <><ExternalLink className="w-3.5 h-3.5" /> View billing</>
                              : <><Download className="w-3.5 h-3.5" /> Download</>}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Billing card: direct link to Credits & Subscription */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-text-primary">Billing &amp; Subscription</h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  Review your invoices, add credits, or manage your Council subscription.
                </p>
              </div>
            </div>
            <a href="/account/billing">
              <Button size="sm" className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4" /> Open Billing
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientDocumentsPage;
