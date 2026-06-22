import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Map as MapIcon,
  ArrowRight,
  ArrowLeft,
  X,
  Link as LinkIcon,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  autoMapColumns,
  parseCsv,
  applyMapping,
  splitFullName,
  type DbColumn,
  ALL_DB_COLUMNS,
  DB_COLUMN_LABELS,
} from './LinkedInFieldMapping.js';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: (summary: {
    imported: number;
    duplicates: number;
    errors: number;
    pipeline_created?: number;
    mandate_id?: string | null;
  }) => void;
  defaultMandateId?: string | null;
  availableMandates?: { id: string; title: string }[];
}

type Step = 1 | 2 | 3 | 4;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function LinkedInImportModal({
  open,
  onClose,
  onImported,
  defaultMandateId = null,
  availableMandates = [],
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, DbColumn>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dedupMode, setDedupMode] = useState<'skip' | 'update'>('skip');
  const [dedupResult, setDedupResult] = useState<{
    byEmail: number;
    byLinkedin: number;
    totalDuplicates: number;
    duplicates: { email?: string; linkedin_url?: string; first_name?: string; last_name?: string }[];
    totalRecords: number;
  } | null>(null);
  const [selectedMandateId, setSelectedMandateId] = useState<string | null>(defaultMandateId);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
    pipeline_created: number;
    errorList: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const reset = useCallback(() => {
    setStep(1);
    setFileName(null);
    setFileSize(0);
    setCsvText(null);
    setHeaders([]);
    setDataRows([]);
    setColumnMap({});
    setUploadError(null);
    setDedupMode('skip');
    setDedupResult(null);
    setSelectedMandateId(defaultMandateId);
    setImporting(false);
    setImportProgress(null);
    setImportResult(null);
  }, [defaultMandateId]);

  const handleClose = () => {
    reset();
    onClose();
  };

  // ─── Step 1: File upload ──────────────────────────────────────────────

  const handleFileSelected = useCallback((file: File) => {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError(`File must be .csv (got "${file.name}")`);
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File size exceeds 10MB limit (got ${formatBytes(file.size)})`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : '';
        const rows = parseCsv(text);

        if (rows.length < 2) {
          setUploadError('CSV must have a header row + at least 1 data row');
          return;
        }

        const hdrs = rows[0].map((h) => h.trim());
        const raw = rows.slice(1);

        setCsvText(text);
        setHeaders(hdrs);
        setDataRows(raw);
        setFileName(file.name);
        setFileSize(file.size);
        setColumnMap(autoMapColumns(hdrs));
      } catch (err: any) {
        setUploadError(err?.message || 'Failed to parse CSV file');
      }
    };
    reader.onerror = () => setUploadError('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFileSelected(file);
    },
    [handleFileSelected],
  );

  // ─── Step 2: Mapping preview ──────────────────────────────────────────

  const previewRecords = useMemo(() => {
    if (headers.length === 0 || dataRows.length === 0) return [];
    const preview = dataRows.slice(0, 5);
    return preview.map((row) => {
      const mapped: Partial<Record<DbColumn, string>> = {};
      headers.forEach((header, idx) => {
        const target = columnMap[header];
        if (!target || target === 'skip') return;
        const val = (row[idx] || '').trim();
        if (!val) return;
        mapped[target] = mapped[target] ? `${mapped[target]} ${val}`.trim() : val;
      });
      // Fallback: split full_name into first/last if available
      if (!mapped.first_name && headers.includes('Full Name')) {
        const idx = headers.indexOf('Full Name');
        const full = (row[idx] || '').trim();
        if (full) {
          const split = splitFullName(full);
          mapped.first_name = split.first_name;
          mapped.last_name = split.last_name;
        }
      }
      return mapped;
    });
  }, [headers, dataRows, columnMap]);

  const unmappedCount = useMemo(
    () =>
      headers.filter(
        (h) =>
          !columnMap[h] ||
          columnMap[h] === 'skip',
      ).length,
    [headers, columnMap],
  );

  // ─── Step 3: Deduplication check ──────────────────────────────────────

  const performDeduplication = useCallback(async () => {
    const { records } = applyMapping(headers, dataRows, columnMap);

    try {
      const response = await fetch('/api/data/linkedin-import-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: records.map((r) => ({
            first_name: r.first_name,
            last_name: r.last_name,
            email: r.email,
            phone: r.phone,
            company: r.company,
            title: r.title,
            linkedin_url: r.linkedin_url,
            location: r.location,
            notes: r.notes,
          })),
        }),
      });

      const json = await response.json();
      if (json.success) {
        setDedupResult(json);
        return true;
      } else {
        setUploadError(json.error || 'Failed to check for duplicates');
        return false;
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to check for duplicates');
      return false;
    }
  }, [headers, dataRows, columnMap]);

  // ─── Step 4: Import ───────────────────────────────────────────────────

  const doImport = useCallback(async () => {
    const { records } = applyMapping(headers, dataRows, columnMap);

    setImporting(true);
    setImportProgress(`Importing ${records.length} records...`);

    try {
      const response = await fetch('/api/data/linkedin-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: records.map((r) => ({
            first_name: r.first_name,
            last_name: r.last_name,
            email: r.email,
            phone: r.phone,
            company: r.company,
            title: r.title,
            linkedin_url: r.linkedin_url,
            location: r.location,
            notes: r.notes,
          })),
          dedup_mode: dedupMode,
          mandate_id: selectedMandateId,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setImportResult(json);
        setImporting(false);
        onImported?.(json);
      } else {
        setImporting(false);
        setUploadError(json.error || 'Import failed');
      }
    } catch (err: any) {
      setImporting(false);
      setUploadError(err?.message || 'Import failed');
    }
  }, [headers, dataRows, columnMap, dedupMode, selectedMandateId, onImported]);

  // ─── Render ───────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-bg-primary rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-text-primary">
                Import LinkedIn Contacts
              </h2>
              <p className="text-sm text-text-muted">
                Step {step} of 4 —{' '}
                {step === 1 && 'Upload CSV file'}
                {step === 2 && 'Map CSV columns'}
                {step === 3 && 'Review duplicates'}
                {step === 4 && 'Import and review'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-text-muted hover:bg-slate-100 hover:text-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => {
                    if (s <= step) setStep(s as Step);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    s === step
                      ? 'bg-accent text-white'
                      : s < step
                        ? 'bg-accent/10 text-accent hover:bg-accent/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={s > step}
                >
                  {s < step ? <Check className="w-4 h-4" /> : (
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {s}
                    </span>
                  )}
                  {s === 1 && 'Upload'}
                  {s === 2 && 'Map'}
                  {s === 3 && 'Deduplicate'}
                  {s === 4 && 'Import'}
                </button>
                {s < 4 && <ArrowRight className={`w-4 h-4 ${s < step ? 'text-accent' : 'text-slate-300'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── Step 1: Upload ────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm text-text-muted">
                Export a CSV from LinkedIn Sales Navigator (File → Export to CSV). Drag and drop
                the file below, or click to select.
              </div>

              <div
                ref={dropRef}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/40 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                />

                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <p className="font-medium text-text-primary">{fileName}</p>
                    <p className="text-xs text-text-muted">
                      {formatBytes(fileSize)} — {dataRows.length} rows detected
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName(null);
                        setFileSize(0);
                        setCsvText(null);
                        setHeaders([]);
                        setDataRows([]);
                        setColumnMap({});
                      }}
                      className="mt-2 text-xs text-accent hover:underline"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="font-medium text-text-primary">Drag CSV file here</p>
                    <p className="text-sm text-text-muted">or click to browse</p>
                    <p className="text-xs text-text-muted mt-2">Max 10MB</p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="text-xs text-text-muted bg-slate-50 rounded-lg p-3 border border-border/50">
                <div className="font-semibold mb-1 text-text-primary">Expected CSV columns:</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'First Name',
                    'Last Name',
                    'Email Address',
                    'Phone Number',
                    'Company Name',
                    'Title',
                    'LinkedIn URL',
                    'Location',
                  ].map((col) => (
                    <span key={col} className="px-2 py-1 bg-white rounded-md border border-border/60">
                      {col}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-text-muted">
                  Other columns are supported — you can map them manually in the next step.
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Map columns ────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm text-text-muted">
                We auto-mapped columns based on the LinkedIn CSV format. Review and adjust the
                mapping below — especially for any columns marked in amber (auto-skip).
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center bg-bg-secondary rounded-lg px-4 py-3 text-xs font-semibold text-text-primary border border-border">
                <div>CSV Column</div>
                <div className="text-text-muted font-normal text-center">→ maps to →</div>
                <div>Database Field</div>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {headers.map((header, idx) => {
                  const mapped = columnMap[header];
                  const firstFewValues = dataRows.slice(0, 3).map((row) => row[idx] || '').filter(Boolean);
                  const isUnmapped = !mapped || mapped === 'skip';

                  return (
                    <div
                      key={header}
                      className={`grid grid-cols-[1fr_auto_1fr] gap-3 items-center rounded-lg px-4 py-3 border transition-colors ${
                        isUnmapped
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-bg-secondary border-border hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">{header}</div>
                          {firstFewValues.length > 0 && (
                            <div className="text-xs text-text-muted truncate">
                              e.g., {firstFewValues.map((v) => `"${v.slice(0, 40)}"`).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowRight className={`w-4 h-4 ${isUnmapped ? 'text-amber-500' : 'text-text-muted'}`} />
                      </div>

                      <div>
                        <select
                          value={mapped || 'skip'}
                          onChange={(e) => {
                            setColumnMap((prev) => ({
                              ...prev,
                              [header]: e.target.value as DbColumn,
                            }));
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent"
                        >
                          {ALL_DB_COLUMNS.map((col) => (
                            <option key={col} value={col}>
                              {DB_COLUMN_LABELS[col]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-accent" /> Preview of first 5 rows after mapping
                </h4>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {ALL_DB_COLUMNS.filter((c) => c !== 'skip').map((c) => (
                          <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-text-primary whitespace-nowrap">
                            {DB_COLUMN_LABELS[c]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRecords.map((record, idx) => (
                        <tr key={idx} className="border-t border-border">
                          {ALL_DB_COLUMNS.filter((c) => c !== 'skip').map((c) => (
                            <td
                              key={c}
                              className="px-3 py-2 text-sm text-text-primary align-top"
                            >
                              {record[c] || <span className="text-slate-300">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {unmappedCount > 0 && unmappedCount < headers.length && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{unmappedCount} column(s) are set to skip</span>.
                    This is expected for columns like "Full Name" (which we split automatically) or
                    "Connected On". Change the mapping if you want to import them.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 3: Deduplication ─────────────────────── */}
          {step === 3 && dedupResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-secondary border border-border rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-text-primary">{dedupResult.totalRecords}</div>
                  <div className="text-xs text-text-muted mt-1">Total records in CSV</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700">{dedupResult.totalDuplicates}</div>
                  <div className="text-xs text-amber-800 mt-1">Duplicates detected</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-700">
                    {Math.max(0, dedupResult.totalRecords - dedupResult.totalDuplicates)}
                  </div>
                  <div className="text-xs text-emerald-800 mt-1">New records to import</div>
                </div>
              </div>

              {/* Dedup mode selector */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary">Duplicate handling</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDedupMode('skip')}
                    className={`flex items-start gap-3 p-3 text-left rounded-lg border transition-colors ${
                      dedupMode === 'skip'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-bg-secondary hover:border-accent/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      dedupMode === 'skip' ? 'border-accent bg-accent' : 'border-slate-300'
                    }`}>
                      {dedupMode === 'skip' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-text-primary">Skip duplicates</div>
                      <div className="text-xs text-text-muted">Do not update existing contacts</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setDedupMode('update')}
                    className={`flex items-start gap-3 p-3 text-left rounded-lg border transition-colors ${
                      dedupMode === 'update'
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-bg-secondary hover:border-accent/40'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      dedupMode === 'update' ? 'border-accent bg-accent' : 'border-slate-300'
                    }`}>
                      {dedupMode === 'update' && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-text-primary">Update existing contacts</div>
                      <div className="text-xs text-text-muted">Fill in missing fields from CSV</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Duplicate list */}
              {dedupResult.duplicates.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">
                    Duplicates found ({dedupResult.duplicates.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary">Email</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-text-primary">LinkedIn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dedupResult.duplicates.slice(0, 100).map((dup, idx) => (
                          <tr key={idx} className="border-t border-border">
                            <td className="px-3 py-2 text-sm text-text-primary">
                              {[dup.first_name, dup.last_name].filter(Boolean).join(' ') || '—'}
                            </td>
                            <td className="px-3 py-2 text-sm text-text-primary">{dup.email || '—'}</td>
                            <td className="px-3 py-2 text-sm text-accent">
                              {dup.linkedin_url ? (
                                <a href={dup.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3" /> linkedin
                                </a>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mandate attachment */}
              {availableMandates.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">
                    Add to pipeline (optional)
                  </h4>
                  <p className="text-xs text-text-muted mb-2">
                    Attach imported contacts to a mandate pipeline automatically.
                  </p>
                  <select
                    value={selectedMandateId || ''}
                    onChange={(e) => setSelectedMandateId(e.target.value || null)}
                    className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  >
                    <option value="">— Do not add to any mandate —</option>
                    {availableMandates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Import result ────────────────────── */}
          {step === 4 && importResult && !importing && (
            <div className="space-y-6">
              {/* Result summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-700">{importResult.imported}</div>
                  <div className="text-xs text-emerald-800 mt-1">New contacts imported</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-700">{importResult.duplicates}</div>
                  <div className="text-xs text-amber-800 mt-1">Duplicates skipped/updated</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-700">{importResult.errors}</div>
                  <div className="text-xs text-red-800 mt-1">Failed to import</div>
                </div>
              </div>

              {importResult.pipeline_created > 0 && (
                <div className="p-4 bg-accent/5 border border-accent/30 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">Pipeline updated</div>
                    <div className="text-sm text-text-muted">
                      {importResult.pipeline_created} candidate{importResult.pipeline_created === 1 ? '' : 's'} added to mandate pipeline
                    </div>
                  </div>
                </div>
              )}

              {importResult.errorList.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" /> Errors ({importResult.errorList.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto bg-red-50 border border-red-200 rounded-lg divide-y divide-red-100">
                    {importResult.errorList.slice(0, 20).map((msg, idx) => (
                      <div key={idx} className="px-3 py-2 text-sm text-red-700">{msg}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover font-medium text-sm min-h-[44px]"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 4 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <button
              onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as Step)}
              className="px-4 py-2 text-sm text-text-primary border border-border rounded-lg hover:bg-slate-50 min-h-[44px]"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            <div className="flex items-center gap-2">
              {importing && (
                <span className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
                  {importProgress}
                </span>
              )}

              {step === 1 && (
                <button
                  disabled={!fileName || !!importing}
                  onClick={() => setStep(2)}
                  className="px-5 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-hover disabled:bg-slate-300 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next: Map columns
                </button>
              )}

              {step === 2 && (
                <button
                  disabled={!!importing || headers.length === 0}
                  onClick={() => setStep(3)}
                  className="px-5 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-hover disabled:bg-slate-300 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next: Check for duplicates
                </button>
              )}

              {step === 3 && !importing && (
                <button
                  onClick={async () => {
                    if (!dedupResult) {
                      const ok = await performDeduplication();
                      if (!ok) return;
                    }
                    setStep(4);
                    await doImport();
                  }}
                  className="px-5 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-hover disabled:bg-slate-300 disabled:cursor-not-allowed min-h-[44px] font-medium"
                >
                  {dedupResult ? `Import ${dedupResult.totalRecords} contacts` : 'Check & import'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
