import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Share2, Eye, Edit3, Maximize2, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { ReportData } from '@/services/reportService';

interface ReportViewerProps {
  report: ReportData;
  onClose?: () => void;
  onExport?: (format: 'PDF' | 'DOCX' | 'PNG') => void;
  onEdit?: () => void;
}

const TEMPLATE_COLORS: Record<string, string> = {
  'Assessment Report': '#C108AB',
  'Coaching Report': '#9A0688',
  'Session Summary': '#740566',
  'Progress Report': '#C108AB',
  'Insight Report': '#C108AB',
  'Career Plan Report': '#9A0688',
  'Executive Summary': '#C108AB',
  'TRIDENT Report': '#C108AB',
};

export function ReportViewer({ report, onClose, onExport, onEdit }: ReportViewerProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentSection(0);
    setZoom(1);
  }, [report.id]);

  const totalSections = report.sections.length + report.tables.length + report.charts.length;

  const handleExport = useCallback((format: 'PDF' | 'DOCX' | 'PNG') => {
    setLoading(true);
    try {
      onExport?.(format);
    } finally {
      setLoading(false);
    }
  }, [onExport]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const renderPage = () => {
    const sections = [];
    for (const s of report.sections) {
      sections.push(
        <div key={s.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#C108AB' }}>
            {s.title}
          </h2>
          <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{s.content}</p>
        </div>
      );
    }
    for (const t of report.tables) {
      sections.push(
        <div key={t.id} className="mb-8">
          <h3 className="text-lg font-medium mb-3" style={{ color: '#C108AB' }}>
            {t.title}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {t.headers.map((h, i) => (
                    <th key={i} className="bg-[#1E1E1E] text-[#C108AB] text-left px-4 py-2 text-sm font-semibold border border-[#C108AB]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-[#141414]' : 'bg-[#191919]'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="text-text-primary px-4 py-2 text-sm border border-[#333]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    for (const c of report.charts) {
      sections.push(
        <div key={c.id} className="mb-8">
          <h3 className="text-lg font-medium mb-3" style={{ color: '#C108AB' }}>
            {c.title}
          </h3>
          <div className="bg-[#141414] p-4 text-center text-text-muted text-sm">
            [{c.type.toUpperCase()} Chart Placeholder — {c.title}]
          </div>
        </div>
      );
    }
    return sections;
  };

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex items-center justify-between p-4 border-b border-border bg-bg-alt">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-bg rounded-none">
              <ChevronLeft className="w-5 h-5 text-text-muted" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-text-primary">{report.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default">{report.templateName}</Badge>
              <span className="text-xs text-text-muted">{report.format} • {report.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button onClick={handleZoomOut} className="p-2 hover:bg-bg rounded-none" aria-label="Zoom out">
              <ZoomOut className="w-4 h-4 text-text-muted" />
            </button>
            <span className="text-sm text-text-muted w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-bg rounded-none" aria-label="Zoom in">
              <ZoomIn className="w-4 h-4 text-text-muted" />
            </button>
            <button onClick={handleResetZoom} className="p-2 hover:bg-bg rounded-none" aria-label="Reset zoom">
              <RotateCw className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('DOCX')} disabled={loading}>
            DOCX
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-bg-alt">
        <div
          className="mx-auto max-w-[800px] bg-[#0A0A0A] border border-border p-12"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <div className="mb-8 pb-6 border-b border-[#C108AB]">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#C108AB' }}>
              {report.header?.title || report.title}
            </h1>
            {report.header?.subtitle && (
              <p className="text-text-muted text-lg">{report.header.subtitle}</p>
            )}
            <div className="flex items-center gap-3 mt-4 text-sm text-text-muted">
              {report.header?.reportDate && <span>{report.header.reportDate}</span>}
              {report.header?.classification && (
                <Badge variant="default" size="sm">{report.header.classification.toUpperCase()}</Badge>
              )}
            </div>
          </div>

          {renderPage()}

          {report.footer?.text && (
            <div className="mt-12 pt-6 border-t border-border text-center text-sm text-text-muted">
              {report.footer.text}
              {report.footer.companyName && (
                <div className="text-xs mt-1">© {new Date().getFullYear()} {report.footer.companyName}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border bg-bg-alt flex items-center justify-between">
        <span className="text-sm text-text-muted">
          {report.sections.length + report.tables.length + report.charts.length} sections
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentSection(Math.max(0, currentSection - 1))} disabled={currentSection === 0}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-text-muted">{currentSection + 1} / {totalSections || 1}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentSection(Math.min(totalSections, currentSection + 1))} disabled={currentSection >= totalSections}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
