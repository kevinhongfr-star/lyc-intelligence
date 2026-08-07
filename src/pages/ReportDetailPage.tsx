import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Edit3, Eye, Download,
  Highlighter, MessageSquare, Pencil, Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ReportViewer } from '@/components/reports/ReportViewer';
import { ReportEditor } from '@/components/reports/ReportEditor';
import { ExportPanel } from '@/components/reports/ExportPanel';
import { ReportAnnotations, type Annotation } from '@/components/reports/ReportAnnotations';
import { getReport, updateReport, exportReport } from '@/services/reportService';
import type { ReportData, ExportOptions } from '@/services/reportService';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'viewer' | 'editor'>(mode === 'edit' ? 'editor' : 'viewer');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadReport();
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await getReport(id!);
      if (data) {
        setReport(data);
        if (data.metadata && Array.isArray((data.metadata as any).annotations)) {
          setAnnotations((data.metadata as any).annotations);
        }
      } else {
        setError('Report not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = useCallback(async (updates: Partial<ReportData>) => {
    if (!id) return;
    try {
      const updated = await updateReport(id, updates);
      if (updated) {
        setReport(updated);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    }
  }, [id]);

  const handleExport = useCallback(async (format: 'PDF' | 'DOCX' | 'PNG', options?: ExportOptions) => {
    if (!id) return;
    try {
      await exportReport(id, format, options);
    } catch (err: any) {
      setError(err?.message || 'Export failed');
    }
  }, [id]);

  const handleAddAnnotation = useCallback((a: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newA: Annotation = {
      ...a,
      id: Math.random().toString(36).slice(2, 10),
      createdAt: new Date().toISOString(),
    };
    setAnnotations((prev) => [...prev, newA]);
  }, []);

  const handleUpdateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const handleDeleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C108AB]" />
        <span className="ml-3 text-text-muted">Loading report...</span>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 bg-red-500/10 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-medium text-red-500">{error}</p>
            <p className="text-sm text-text-muted mt-1">The report may have been deleted or is not available.</p>
          </div>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => window.location.href = '/reports'}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="h-screen flex flex-col bg-bg">
      <div className="flex items-center justify-between p-4 border-b border-border bg-bg-alt">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/reports'}
            className="p-2 hover:bg-bg rounded-none"
          >
            <ArrowLeft className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{report.title}</h1>
            <p className="text-sm text-text-muted">
              {report.templateName} • {report.format} • {report.status}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-bg p-1 border border-border">
            <button
              onClick={() => setViewMode('viewer')}
              className={`px-3 py-1 text-sm font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'viewer' ? 'bg-[#C108AB] text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1 text-sm font-medium flex items-center gap-1 transition-colors ${
                viewMode === 'editor' ? 'bg-[#C108AB] text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>

          <Button variant="outline" onClick={() => setShowExport(!showExport)}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-500">{error}</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {viewMode === 'viewer' ? (
            <ReportViewer
              report={report}
              onClose={() => window.location.href = '/reports'}
              onExport={(format) => handleExport(format)}
              onEdit={() => setViewMode('editor')}
            />
          ) : (
            <ReportEditor
              report={report}
              onSave={handleSave}
              onClose={() => setViewMode('viewer')}
            />
          )}
        </div>

        <div className="w-80 border-l border-border bg-bg flex flex-col">
          {showExport && (
            <div className="border-b border-border">
              <ExportPanel
                reportId={report.id}
                onExport={(format, options) => handleExport(format, options)}
              />
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <ReportAnnotations
              annotations={annotations}
              onAdd={handleAddAnnotation}
              onUpdate={handleUpdateAnnotation}
              onDelete={handleDeleteAnnotation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
