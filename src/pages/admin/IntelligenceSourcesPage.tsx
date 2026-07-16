/**
 * IntelligenceSourcesPage — Admin CRUD for intelligence ingestion sources.
 * Manage web scrape, API feed, RSS and social sources with schedule (cron)
 * and JSON config. Wired to /api/intelligence/sources.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Code,
  Rss,
  Share2,
  Play,
  Pause,
  RefreshCw,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SourceType = 'web_scrape' | 'api_feed' | 'rss' | 'social';
type SourceStatus = 'active' | 'paused' | 'error';

interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  status: SourceStatus;
  schedule: string; // cron
  config: string; // JSON string
  lastRun: string | null;
}

interface SourceForm {
  name: string;
  type: SourceType;
  url: string;
  schedule: string;
  config: string;
}

/* ------------------------------------------------------------------ */
/* Label / icon maps                                                   */
/* ------------------------------------------------------------------ */

const TYPE_META: Record<
  SourceType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  web_scrape: { label: 'Web Scrape', icon: Globe },
  api_feed: { label: 'API Feed', icon: Code },
  rss: { label: 'RSS', icon: Rss },
  social: { label: 'Social', icon: Share2 },
};

const STATUS_META: Record<
  SourceStatus,
  { label: string; variant: 'success' | 'default' | 'danger' }
> = {
  active: { label: 'Active', variant: 'success' },
  paused: { label: 'Paused', variant: 'default' },
  error: { label: 'Error', variant: 'danger' },
};

const EMPTY_FORM: SourceForm = {
  name: '',
  type: 'rss',
  url: '',
  schedule: '0 */6 * * *',
  config: '{\n  "enabled": true\n}',
};

/* ------------------------------------------------------------------ */
/* API helper                                                          */
/* ------------------------------------------------------------------ */

async function apiCall(path: string, method: string = 'GET', body?: any) {
  const res = await fetch(`/api/intelligence${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

/** Map API source row to UI Source */
function mapApiSource(row: any): Source {
  const isActive = row.is_active === true;
  const hasError = row.last_error || (row.reliability_score !== null && row.reliability_score < 0.2);
  return {
    id: row.id,
    name: row.name || 'Untitled',
    type: (row.source_type as SourceType) || 'rss',
    url: row.url || row.api_endpoint || '',
    status: hasError ? 'error' : isActive ? 'active' : 'paused',
    schedule: `*/${row.refresh_interval_minutes || 60} * * * *`,
    config: row.metadata ? JSON.stringify(row.metadata, null, 2) : '{}',
    lastRun: row.last_fetched_at || null,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatLastRun(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

function SourceModal({
  isOpen,
  isEdit,
  form,
  onClose,
  onChange,
  onSubmit,
  submitting,
}: {
  isOpen: boolean;
  isEdit: boolean;
  form: SourceForm;
  onClose: () => void;
  onChange: (patch: Partial<SourceForm>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateAndSubmit = () => {
    try {
      JSON.parse(form.config);
      setJsonError(null);
      onSubmit();
    } catch {
      setJsonError('Config must be valid JSON.');
    }
  };

  const fieldLabel = 'block text-sm font-medium text-[#1C1C1C] mb-1.5';
  const fieldHint = 'mt-1 text-xs text-[#A3A3A3]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-modal-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <h3 id="source-modal-title" className="text-base font-semibold text-[#1C1C1C]">
            {isEdit ? 'Edit Source' : 'Add Source'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#1C1C1C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Name */}
          <div>
            <label className={fieldLabel} htmlFor="src-name">
              Name <span className="text-[#C108AB]">*</span>
            </label>
            <Input
              id="src-name"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. TechCrunch RSS"
            />
          </div>

          {/* Type */}
          <div>
            <label className={fieldLabel} htmlFor="src-type">
              Type <span className="text-[#C108AB]">*</span>
            </label>
            <div className="relative">
              <select
                id="src-type"
                value={form.type}
                onChange={(e) => onChange({ type: e.target.value as SourceType })}
                className="w-full appearance-none border border-[#E5E5E5] bg-white px-4 py-2.5 text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
              >
                {(Object.keys(TYPE_META) as SourceType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={fieldLabel} htmlFor="src-url">
              URL <span className="text-[#C108AB]">*</span>
            </label>
            <Input
              id="src-url"
              value={form.url}
              onChange={(e) => onChange({ url: e.target.value })}
              placeholder="https://…"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className={fieldLabel} htmlFor="src-schedule">
              Schedule (cron)
            </label>
            <Input
              id="src-schedule"
              value={form.schedule}
              onChange={(e) => onChange({ schedule: e.target.value })}
              placeholder="0 */6 * * *"
              className="font-mono"
            />
            <p className={fieldHint}>Standard 5-field unix cron expression.</p>
          </div>

          {/* Config */}
          <div>
            <label className={fieldLabel} htmlFor="src-config">
              Config (JSON)
            </label>
            <textarea
              id="src-config"
              value={form.config}
              onChange={(e) => {
                onChange({ config: e.target.value });
                setJsonError(null);
              }}
              rows={5}
              spellCheck={false}
              className="w-full resize-y border border-[#E5E5E5] bg-white px-4 py-2.5 font-mono text-sm text-[#1C1C1C] focus:border-[#C108AB]/40 focus:outline-none"
            />
            {jsonError ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-[#DC2626]">
                <AlertTriangle className="h-3 w-3" />
                {jsonError}
              </p>
            ) : (
              <p className={fieldHint}>Source-specific options as a JSON object.</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={validateAndSubmit} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Add Source'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Delete confirmation                                                 */
/* ------------------------------------------------------------------ */

function DeleteConfirm({
  isOpen,
  sourceName,
  onCancel,
  onConfirm,
  submitting,
}: {
  isOpen: boolean;
  sourceName: string;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden />
      <div
        className="relative z-10 mx-4 w-full max-w-md bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3 px-6 py-5">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center bg-[rgba(220,38,38,0.08)] text-[#DC2626]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1C1C1C]">Delete source?</h3>
            <p className="mt-1 text-sm text-[#525252]">
              You are about to permanently delete{' '}
              <span className="font-medium text-[#1C1C1C]">{sourceName}</span>. This will stop all
              scheduled ingestion for this source and cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E5E5] px-6 py-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} aria-busy={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function IntelligenceSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SourceForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Source | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load sources from API ──
  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('/sources');
      setSources((data.sources || []).map(mapApiSource));
    } catch (e) {
      console.error('Failed to load sources:', e);
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (src: Source) => {
    setEditId(src.id);
    setForm({
      name: src.name,
      type: src.type,
      url: src.url,
      schedule: src.schedule,
      config: src.config,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let metadata = {};
      try {
        metadata = JSON.parse(form.config);
      } catch {
        // keep empty if invalid
      }
      const intervalMatch = form.schedule.match(/\*\/(\d+)/);
      const interval = intervalMatch ? parseInt(intervalMatch[1]) : 60;

      if (editId) {
        await apiCall(`/sources/${editId}`, 'PUT', {
          name: form.name,
          source_type: form.type,
          url: form.url,
          refresh_interval_minutes: interval,
          metadata,
        });
      } else {
        await apiCall('/sources', 'POST', {
          name: form.name,
          source_type: form.type,
          url: form.url,
          refresh_interval_minutes: interval,
          metadata,
        });
      }
      await loadSources();
      setModalOpen(false);
    } catch (e) {
      console.error('Failed to save source:', e);
      alert('Failed to save source. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiCall(`/sources/${deleteTarget.id}`, 'DELETE');
      setSources((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error('Failed to delete source:', e);
      alert('Failed to delete source.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (src: Source) => {
    const newActive = src.status !== 'active';
    // Optimistic update
    setSources((prev) =>
      prev.map((s) =>
        s.id === src.id
          ? { ...s, status: newActive ? 'active' : 'paused' }
          : s,
      ),
    );
    try {
      await apiCall(`/sources/${src.id}`, 'PUT', { is_active: newActive });
    } catch (e) {
      console.error('Failed to toggle source:', e);
      // Revert on failure
      setSources((prev) =>
        prev.map((s) =>
          s.id === src.id
            ? { ...s, status: src.status }
            : s,
        ),
      );
    }
  };

  const runNow = async (src: Source) => {
    try {
      await apiCall(`/sources/${src.id}/refresh`, 'POST');
      // Refresh list after a short delay
      setTimeout(() => loadSources(), 2000);
    } catch (e) {
      console.error('Failed to trigger refresh:', e);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q)
      );
    });
  }, [sources, query, typeFilter]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C]">Intelligence Sources</h1>
            <p className="mt-1 text-sm text-[#737373]">
              Manage ingestion sources — web scrapes, API feeds, RSS and social — that feed the
              intelligence layer.
            </p>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Source
          </Button>
        </div>

        {/* ---------- Filters ---------- */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`border px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'border-[#C108AB] bg-[#C108AB] text-white'
                  : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
              }`}
            >
              All Types
            </button>
            {(Object.keys(TYPE_META) as SourceType[]).map((t) => {
              const Icon = TYPE_META[t].icon;
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-[#C108AB] bg-[#C108AB] text-white'
                      : 'border-[#E5E5E5] bg-white text-[#525252] hover:border-[#C108AB]/30 hover:text-[#1C1C1C]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {TYPE_META[t].label}
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-72">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or URL…"
              aria-label="Search sources"
            />
          </div>
        </div>

        {/* ---------- Table ---------- */}
        <div className="mt-4">
          <Card className="overflow-hidden">
            {loading ? (
              <div className="space-y-3 p-6">
                <div className="h-10 w-full animate-pulse bg-[#F7F7F7]" />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 w-full animate-pulse bg-[#F7F7F7]" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Globe className="h-8 w-8 text-[#A3A3A3]" />
                <p className="mt-3 text-sm font-medium text-[#1C1C1C]">No sources found</p>
                <p className="mt-1 text-xs text-[#737373]">
                  Add a source to start ingesting intelligence signals.
                </p>
                <Button size="sm" className="mt-4" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add Source
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#F7F7F7] text-[11px] uppercase tracking-wide text-[#737373]">
                      <th className="px-6 py-3 font-semibold">Name</th>
                      <th className="px-6 py-3 font-semibold">Type</th>
                      <th className="px-6 py-3 font-semibold">URL</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Last Run</th>
                      <th className="px-6 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const TypeIcon = TYPE_META[s.type as SourceType].icon;
                      const status = STATUS_META[s.status as SourceStatus];
                      const isActive = s.status === 'active';
                      return (
                        <tr
                          key={s.id}
                          className="border-t border-[#E5E5E5] transition-colors hover:bg-[#FAFAFA]"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-[#1C1C1C]">{s.name}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-[#A3A3A3]">
                              {s.schedule}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 text-sm text-[#525252]">
                              <TypeIcon className="h-4 w-4 text-[#737373]" />
                              {TYPE_META[s.type as SourceType].label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="block max-w-xs truncate text-sm text-[#525252]" title={s.url}>
                              {s.url}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#525252]">
                            {formatLastRun(s.lastRun)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => runNow(s)}
                                title="Run now"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`Run ${s.name} now`}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus(s)}
                                title={isActive ? 'Pause' : 'Activate'}
                                className={`p-1.5 transition-colors hover:bg-[#F7F7F7] ${
                                  isActive ? 'text-[#737373] hover:text-[#CA8A04]' : 'text-[#737373] hover:text-[#16A34A]'
                                }`}
                                aria-label={isActive ? `Pause ${s.name}` : `Activate ${s.name}`}
                              >
                                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => openEdit(s)}
                                title="Edit"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#C108AB]"
                                aria-label={`Edit ${s.name}`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(s)}
                                title="Delete"
                                className="p-1.5 text-[#737373] transition-colors hover:bg-[#F7F7F7] hover:text-[#DC2626]"
                                aria-label={`Delete ${s.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ---------- Add / Edit modal ---------- */}
      <SourceModal
        isOpen={modalOpen}
        isEdit={editId !== null}
        form={form}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* ---------- Delete confirmation ---------- */}
      <DeleteConfirm
        isOpen={deleteTarget !== null}
        sourceName={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        submitting={deleting}
      />
    </div>
  );
}

export default IntelligenceSourcesPage;
