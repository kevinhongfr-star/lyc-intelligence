/**
 * BulkOperationsPage.tsx — Issue #44
 * Batch data import/export operations
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Database,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

interface BulkJob {
  id: string;
  type: 'import' | 'export';
  entityType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

const statusColors: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const entityTypes = ['candidates', 'mandates', 'contacts', 'companies'];

export function BulkOperationsPage() {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedEntity, setSelectedEntity] = useState('candidates');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch('/api/bulk-operations/jobs').then(r => r.json()),
        fetch('/api/bulk-operations/stats').then(r => r.json()),
      ]);
      setJobs(jobsRes.jobs || []);
      setStats(statsRes.stats || null);
    } catch (e) {
      console.error('Failed to load bulk operations data', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!uploadFile) return;
    setIsSubmitting(true);
    const res = await fetch('/api/bulk-operations/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: selectedEntity, fileName: uploadFile.name }),
    });
    if (res.ok) {
      setUploadFile(null);
      fetchData();
    }
    setIsSubmitting(false);
  }

  async function handleExport() {
    setIsSubmitting(true);
    const res = await fetch('/api/bulk-operations/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: selectedEntity }),
    });
    if (res.ok) fetchData();
    setIsSubmitting(false);
  }

  function downloadTemplate(entity: string) {
    window.open(`/api/bulk-operations/template/${entity}`, '_blank');
  }

  const progress = (job: BulkJob) =>
    job.totalRecords > 0 ? Math.round((job.processedRecords / job.totalRecords) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Import / Export</h1>
        <p className="text-sm text-gray-500 mt-1">Batch data operations for large datasets</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Upload className="w-5 h-5 text-blue-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalImports}</div>
              <div className="text-xs text-gray-500">Total Imports</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg"><Download className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalExports}</div>
              <div className="text-xs text-gray-500">Total Exports</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Database className="w-5 h-5 text-purple-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.totalRecordsProcessed.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Records Processed</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
            <div>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <div className="text-xs text-gray-500">Success Rate</div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <div className="flex gap-4 border-b mb-4">
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Import
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'export' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}
          >
            Export
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Entity Type</label>
            <select
              value={selectedEntity}
              onChange={e => setSelectedEntity(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-full md:w-64"
            >
              {entityTypes.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {activeTab === 'import' && (
            <>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById('bulk-upload')?.click()}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uploadFile ? uploadFile.name : 'Click to upload CSV or Excel file'}
                </p>
                <input
                  id="bulk-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => downloadTemplate(selectedEntity)} className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Download Template
                </Button>
                <Button onClick={handleImport} disabled={!uploadFile || isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Start Import
                </Button>
              </div>
            </>
          )}

          {activeTab === 'export' && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <FileCheck className="w-5 h-5 inline mr-2 text-gray-400" />
                Export all {selectedEntity} to CSV format with current filters applied.
              </div>
              <Button onClick={handleExport} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Start Export
              </Button>
            </>
          )}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-medium mb-3">Recent Jobs</h2>
        <div className="space-y-2">
          {jobs.map(job => (
            <Card key={job.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {job.type === 'import' ? (
                    <Upload className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Download className="w-5 h-5 text-emerald-600" />
                  )}
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {job.type} {job.entityType}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleString()}
                      {job.completedAt && ` · Completed ${new Date(job.completedAt).toLocaleString()}`}
                    </div>
                  </div>
                </div>
                <Badge className={statusColors[job.status]}>{job.status}</Badge>
              </div>

              {job.status === 'processing' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{job.processedRecords} / {job.totalRecords}</span>
                    <span>{progress(job)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progress(job)}%` }}
                    />
                  </div>
                </div>
              )}

              {job.status === 'completed' && (
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {job.processedRecords} processed
                  </span>
                  {job.failedRecords > 0 && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      {job.failedRecords} failed
                    </span>
                  )}
                </div>
              )}

              {job.errors && job.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded p-2">
                  {job.errors.map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
