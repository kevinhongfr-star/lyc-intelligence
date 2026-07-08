'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Link as LinkIcon,
  Upload,
  FileText,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Search,
  Clock,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface ImportRecord {
  id: string;
  import_type: string;
  status: string;
  total_input: number;
  created_count: number;
  updated_count: number;
  skipped_duplicate_count: number;
  skipped_error_count: number;
  created_at: string;
  completed_at?: string;
}

interface ImportItem {
  id: string;
  source_url?: string;
  source_index: number;
  action_taken?: string;
  deepseek_error?: string;
  parsed_data?: any;
  matched_contact_id?: string;
  created_contact_id?: string;
  match_type?: string;
  match_confidence?: number;
}

type TabType = 'url' | 'csv' | 'paste' | 'history';

export function LinkedInImportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [isLoadingImports, setIsLoadingImports] = useState(false);
  const [selectedImport, setSelectedImport] = useState<string | null>(null);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const loadImports = useCallback(async () => {
    setIsLoadingImports(true);
    try {
      const res = await fetch('/api/linkedin/imports');
      const data = await res.json();
      if (data.success) {
        setImports(data.imports || []);
      }
    } catch (e) {
      console.error('Failed to load imports:', e);
    } finally {
      setIsLoadingImports(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadImports();
    }
  }, [activeTab, loadImports]);

  const loadImportDetails = async (importId: string) => {
    if (selectedImport === importId) {
      setSelectedImport(null);
      return;
    }
    setSelectedImport(importId);
    setIsLoadingItems(true);
    try {
      const res = await fetch(`/api/linkedin/imports/${importId}`);
      const data = await res.json();
      if (data.success) {
        setImportItems(data.items || []);
      }
    } catch (e) {
      console.error('Failed to load import details:', e);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleRetry = async (importId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/linkedin/imports/${importId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadImports();
        if (selectedImport === importId) {
          loadImportDetails(importId);
        }
      }
    } catch (e) {
      console.error('Retry failed:', e);
    }
  };

  const toggleItem = (itemId: string) => {
    const next = new Set(expandedItems);
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    setExpandedItems(next);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: any }> = {
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
      partial: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertCircle },
      failed: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
      pending: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock },
      parsing: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Loader2 },
      importing: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Loader2 },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className={`w-3 h-3 ${status === 'parsing' || status === 'importing' ? 'animate-spin' : ''}`} />
        {status}
      </span>
    );
  };

  const getActionBadge = (action?: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      created: { bg: 'bg-emerald-50 text-emerald-700', text: 'Created', label: 'Created' },
      updated: { bg: 'bg-blue-50 text-blue-700', text: 'Updated', label: 'Updated' },
      skipped_duplicate: { bg: 'bg-gray-50 text-gray-600', text: 'Duplicate', label: 'Duplicate' },
      skipped_error: { bg: 'bg-red-50 text-red-700', text: 'Error', label: 'Error' },
      pending_review: { bg: 'bg-amber-50 text-amber-700', text: 'Review', label: 'Pending Review' },
    };
    const config = configs[action || ''] || configs.skipped_error;
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'url', label: 'URL Import', icon: LinkIcon },
    { id: 'csv', label: 'CSV Upload', icon: Upload },
    { id: 'paste', label: 'Paste Text', icon: FileText },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">LinkedIn Import</h1>
        <p className="text-text-muted mt-1">
          Import candidates from LinkedIn URLs, CSV exports, or pasted profile text
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-bg-alt p-1 rounded-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-none text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'url' && <URLImportTab onSuccess={() => { loadImports(); setActiveTab('history'); }} />}
      {activeTab === 'csv' && <CSVImportTab onSuccess={() => { loadImports(); setActiveTab('history'); }} />}
      {activeTab === 'paste' && <PasteImportTab onSuccess={() => { loadImports(); setActiveTab('history'); }} />}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {isLoadingImports ? (
            <div className="bg-card border border-border rounded-none p-8 text-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
              <p className="text-text-muted mt-2">Loading import history...</p>
            </div>
          ) : imports.length === 0 ? (
            <div className="bg-card border border-border rounded-none p-8 text-center">
              <History className="w-12 h-12 text-text-muted mx-auto" />
              <h3 className="font-medium text-text-primary mt-4">No imports yet</h3>
              <p className="text-sm text-text-muted mt-1">
                Start by importing candidates from URLs, CSV, or paste
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {imports.map(imp => (
                <div
                  key={imp.id}
                  className="bg-card border border-border rounded-none overflow-hidden"
                >
                  <button
                    onClick={() => loadImportDetails(imp.id)}
                    className="w-full px-6 py-4 text-left hover:bg-bg-alt/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(imp.status)}
                        <span className="font-medium text-text-primary">
                          {imp.import_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {selectedImport === imp.id ? (
                        <ChevronUp className="w-5 h-5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                      <span>{imp.total_input} profiles</span>
                      <span className="text-emerald-600">{imp.created_count} created</span>
                      <span className="text-blue-600">{imp.updated_count} updated</span>
                      <span className="text-gray-500">{imp.skipped_duplicate_count} duplicates</span>
                      {imp.skipped_error_count > 0 && (
                        <span className="text-red-600">{imp.skipped_error_count} errors</span>
                      )}
                      <span className="ml-auto">
                        {new Date(imp.created_at).toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {selectedImport === imp.id && (
                    <div className="border-t border-border px-6 py-4 bg-bg-base/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-text-primary">Import Items</h4>
                        {imp.skipped_error_count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleRetry(imp.id, e)}
                            className="gap-2"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry Failed
                          </Button>
                        )}
                      </div>
                      {isLoadingItems ? (
                        <div className="text-center py-4">
                          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-96 overflow-y-auto">
                          {importItems.map(item => (
                            <div
                              key={item.id}
                              className="bg-card border border-border rounded-none overflow-hidden"
                            >
                              <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-bg-alt/30"
                              >
                                <div className="flex items-center gap-3">
                                  {getActionBadge(item.action_taken)}
                                  <span className="text-sm text-text-primary">
                                    {item.parsed_data?.full_name ||
                                     item.source_url ||
                                     `Profile ${item.source_index + 1}`}
                                  </span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${
                                  expandedItems.has(item.id) ? 'rotate-180' : ''
                                }`} />
                              </button>
                              {expandedItems.has(item.id) && (
                                <div className="px-4 pb-3 border-t border-border bg-bg-base/50">
                                  <div className="pt-3 space-y-2 text-xs">
                                    {item.source_url && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted">URL:</span>
                                        <a
                                          href={item.source_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary truncate hover:underline"
                                        >
                                          {item.source_url}
                                        </a>
                                      </div>
                                    )}
                                    {item.deepseek_error && (
                                      <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                                        Error: {item.deepseek_error}
                                      </div>
                                    )}
                                    {item.match_type && item.match_type !== 'no_match' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted">Match:</span>
                                        <span className="text-text-secondary">
                                          {item.match_type.replace(/_/g, ' ')}
                                          {item.match_confidence !== undefined &&
                                            ` (${item.match_confidence}%)`}
                                        </span>
                                      </div>
                                    )}
                                    {item.parsed_data?.current_title && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted">Title:</span>
                                        <span className="text-text-secondary">
                                          {item.parsed_data.current_title}
                                        </span>
                                      </div>
                                    )}
                                    {item.parsed_data?.current_company && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-text-muted">Company:</span>
                                        <span className="text-text-secondary">
                                          {item.parsed_data.current_company}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── URL Import Tab ────────────────────────────────────────────────────
function URLImportTab({ onSuccess }: { onSuccess: () => void }) {
  const [urls, setUrls] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const urlList = urls.split('\n').filter(u => u.trim()).length;
  const isBatch = urlList > 1;

  const handleImport = async () => {
    const urlArray = urls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urlArray.length === 0) {
      setError('Please enter at least one LinkedIn URL');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const endpoint = isBatch ? '/api/linkedin/import-batch' : '/api/linkedin/import-url';
      const body = isBatch
        ? JSON.stringify({ urls: urlArray })
        : JSON.stringify({ url: urlArray[0] });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        onSuccess();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-none p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-none bg-blue-50 flex items-center justify-center flex-shrink-0">
          <LinkIcon className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Import from LinkedIn URLs</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Paste one or more LinkedIn profile URLs. Each profile will be fetched, parsed, and imported.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-none text-sm mb-4">
          <div className="font-medium">{result.message}</div>
          <div className="text-xs mt-1 opacity-80">
            Import ID: {result.import_id}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            LinkedIn URLs <span className="text-text-muted font-normal">(one per line, max 50)</span>
          </label>
          <textarea
            value={urls}
            onChange={e => setUrls(e.target.value)}
            className="w-full h-40 px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="https://www.linkedin.com/in/john-doe-123456&#10;https://www.linkedin.com/in/jane-smith-789012&#10;..."
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-text-muted">
              {urlList} URL{urlList !== 1 ? 's' : ''} entered
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Zap className="w-3 h-3" />
              ~{isBatch ? urlList * 0.001 : 0.001} estimated cost
            </span>
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={isImporting || urlList === 0}
          className="w-full gap-2"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isImporting
            ? 'Starting Import...'
            : isBatch
              ? `Import ${urlList} Profiles`
              : 'Import Profile'}
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-text-secondary mb-2">Tips</h4>
        <ul className="text-xs text-text-muted space-y-1">
          <li>• Profiles must be publicly visible (no login required)</li>
          <li>• LinkedIn may block automated fetches — use Paste mode if URLs fail</li>
          <li>• Duplicate detection checks LinkedIn URL, email, phone, and name+company</li>
        </ul>
      </div>
    </div>
  );
}

// ── CSV Import Tab ────────────────────────────────────────────────────
function CSVImportTab({ onSuccess }: { onSuccess: () => void }) {
  const [csvText, setCsvText] = useState('');
  const [format, setFormat] = useState('auto');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      // Auto-detect format
      const lines = text.split('\n');
      if (lines.length > 0) {
        const headers = lines[0].toLowerCase();
        if (headers.includes('first name') && headers.includes('linkedin url')) {
          setDetectedFormat('linkedin_recruiter');
        } else if (headers.includes('profile url')) {
          setDetectedFormat('sales_navigator');
        } else {
          setDetectedFormat('generic');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please upload or paste a CSV file');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/linkedin/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: csvText, format }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        onSuccess();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const rowCount = csvText.trim() ? csvText.trim().split('\n').length - 1 : 0;

  return (
    <div className="bg-card border border-border rounded-none p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-none bg-purple-50 flex items-center justify-center flex-shrink-0">
          <Upload className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Import from CSV</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Upload CSV exports from LinkedIn Recruiter, Sales Navigator, or custom CSV files.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-none text-sm mb-4">
          <div className="font-medium">Import started!</div>
          <div className="text-xs mt-1 opacity-80">
            {result.total_rows} rows detected — format: {result.detected_format}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-none p-8 text-center hover:border-primary/50 transition-colors">
          <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-1">Drag & drop CSV file here</p>
          <p className="text-xs text-text-muted mb-3">or</p>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-bg-alt hover:bg-bg-base rounded-none cursor-pointer text-sm font-medium text-text-primary border border-border">
            <FileText className="w-4 h-4" />
            Choose File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Or paste CSV content
          </label>
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            className="w-full h-40 px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
            placeholder="First Name,Last Name,LinkedIn URL,Email,Company,Title..."
          />
          {csvText && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-text-muted">
                {rowCount} rows detected
                {detectedFormat && ` • format: ${detectedFormat.replace(/_/g, ' ')}`}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Format
          </label>
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="auto">Auto-detect</option>
            <option value="linkedin_recruiter">LinkedIn Recruiter Export</option>
            <option value="sales_navigator">Sales Navigator Export</option>
            <option value="generic">Generic CSV</option>
          </select>
        </div>

        <Button
          onClick={handleImport}
          disabled={isImporting || rowCount === 0}
          className="w-full gap-2"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isImporting ? 'Starting Import...' : `Import ${rowCount} Rows`}
        </Button>
      </div>
    </div>
  );
}

// ── Paste Import Tab ──────────────────────────────────────────────────
function PasteImportTab({ onSuccess }: { onSuccess: () => void }) {
  const [profileText, setProfileText] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    if (profileText.trim().length < 50) {
      setError('Please paste at least 50 characters of profile text');
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/linkedin/import-paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: profileText, linkedin_url: linkedinUrl || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        onSuccess();
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-none p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-none bg-green-50 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">Paste Profile Text</h3>
          <p className="text-sm text-text-muted mt-0.5">
            Copy text from a LinkedIn profile page and paste it here. DeepSeek will parse it into structured data.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-none text-sm mb-4">
          <div className="font-medium">{result.message}</div>
          <div className="text-xs mt-1 opacity-80">
            Import ID: {result.import_id}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            LinkedIn URL <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={e => setLinkedinUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://www.linkedin.com/in/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Profile Text <span className="text-text-muted font-normal">(copy from LinkedIn)</span>
          </label>
          <textarea
            value={profileText}
            onChange={e => setProfileText(e.target.value)}
            className="w-full h-64 px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
            placeholder="Copy the About section, Experience, Education, Skills from a LinkedIn profile and paste here..."
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-text-muted">
              {profileText.length} characters
            </span>
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Zap className="w-3 h-3" />
              ~$0.001 estimated cost
            </span>
          </div>
        </div>

        <Button
          onClick={handleImport}
          disabled={isImporting || profileText.trim().length < 50}
          className="w-full gap-2"
        >
          {isImporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {isImporting ? 'Parsing & Importing...' : 'Parse & Import'}
        </Button>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-text-secondary mb-2">How to use</h4>
        <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
          <li>Go to the LinkedIn profile page in your browser</li>
          <li>Select and copy (Ctrl+C) all text from the page</li>
          <li>Paste (Ctrl+V) it into the text area above</li>
          <li>Click "Parse &amp; Import" — DeepSeek extracts structured data</li>
        </ol>
      </div>
    </div>
  );
}

export default LinkedInImportPage;
