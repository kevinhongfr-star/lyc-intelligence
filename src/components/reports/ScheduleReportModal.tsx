import React, { useState } from 'react';
import { X, Calendar, Clock, FileText, Mail, Share2, Loader2, Check } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import type { ReportTemplateInfo, ReportFormat, ScheduleFrequency, ExportOptions } from '@/services/reportService';

interface ScheduleReportModalProps {
  templates: ReportTemplateInfo[];
  onClose: () => void;
  onSchedule: (options: {
    templateId: string;
    format: ReportFormat;
    frequency: ScheduleFrequency;
    context: Record<string, unknown>;
    exportOptions?: ExportOptions;
  }) => Promise<void>;
}

export function ScheduleReportModal({ templates, onClose, onSchedule }: ScheduleReportModalProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('weekly');
  const [contextJson, setContextJson] = useState('{}');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const frequencyOptions: { value: ScheduleFrequency; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Generate once every day' },
    { value: 'weekly', label: 'Weekly', desc: 'Generate once a week' },
    { value: 'monthly', label: 'Monthly', desc: 'Generate once a month' },
  ];

  const handleSubmit = async () => {
    if (!templateId) {
      setError('Please select a template');
      return;
    }

    let context: Record<string, unknown> = {};
    try {
      context = JSON.parse(contextJson || '{}');
    } catch {
      setError('Context must be valid JSON');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exportOptions: ExportOptions = {};
      if (emailEnabled && emailRecipients.trim()) {
        exportOptions.toEmail = emailRecipients.split(',').map((e) => e.trim()).filter(Boolean);
        if (emailSubject) exportOptions.emailSubject = emailSubject;
      }

      await onSchedule({
        templateId,
        format,
        frequency,
        context,
        exportOptions: Object.keys(exportOptions).length > 0 ? exportOptions : undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg border border-border w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C108AB]" />
            <h2 className="text-lg font-semibold text-text-primary">Schedule Report</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Report Template</label>
            <select
              className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Output Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PDF', 'DOCX', 'PNG'] as ReportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`p-2 text-sm border transition-colors ${
                    format === fmt
                      ? 'border-[#C108AB] bg-[#C108AB]/10 text-[#C108AB]'
                      : 'border-border hover:border-[#C108AB]/50 text-text-muted'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Frequency</label>
            <div className="space-y-2">
              {frequencyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 text-left border transition-colors ${
                    frequency === opt.value
                      ? 'border-[#C108AB] bg-[#C108AB]/5'
                      : 'border-border hover:border-[#C108AB]/50'
                  }`}
                >
                  <Clock className={`w-5 h-5 ${frequency === opt.value ? 'text-[#C108AB]' : 'text-text-muted'}`} />
                  <div>
                    <div className="font-medium text-text-primary">{opt.label}</div>
                    <div className="text-xs text-text-muted">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Context (JSON)</label>
            <textarea
              className="w-full bg-bg-alt border border-border p-3 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-[#C108AB] min-h-[80px]"
              value={contextJson}
              onChange={(e) => setContextJson(e.target.value)}
              placeholder='{"mandateId": "xxx", "data": {...}}'
            />
          </div>

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 border-border"
              />
              <Mail className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-primary">Email on Generation</span>
            </label>

            {emailEnabled && (
              <div className="mt-3 space-y-3 ml-6">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Recipients (comma separated)</label>
                  <Input
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Subject (optional)</label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Weekly Report"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 flex items-center gap-2">
              <span className="text-sm text-red-500">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Schedule created successfully!</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || success}>
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Calendar className="w-4 h-4 mr-1" />}
            {success ? 'Scheduled!' : 'Schedule Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}
