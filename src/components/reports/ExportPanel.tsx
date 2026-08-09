import React, { useState } from 'react';
import { Download, Mail, Share2, FileText, Loader2, Check, Copy, Send, Clock } from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';
import type { ReportFormat, ExportOptions } from '@/services/reportService';

interface ExportPanelProps {
  reportId: string;
  onExport: (format: ReportFormat, options?: ExportOptions) => Promise<void>;
}

export function ExportPanel({ reportId, onExport }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('PDF');
  const [emailAddresses, setEmailAddresses] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [includeEmail, setIncludeEmail] = useState(false);
  const [includeShare, setIncludeShare] = useState(false);
  const [shareExpiry, setShareExpiry] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const options: ExportOptions = {};
      if (includeEmail && emailAddresses.trim()) {
        options.toEmail = emailAddresses.split(',').map((e) => e.trim()).filter(Boolean);
        if (emailSubject) options.emailSubject = emailSubject;
        if (emailBody) options.emailBody = emailBody;
      }
      if (includeShare) {
        options.shareLink = true;
        options.shareExpiryDays = parseInt(shareExpiry);
      }
      await onExport(selectedFormat, options);
      setSuccess(true);
      if (includeShare) {
        setShareUrl(`https://lyc-intelligence.app/reports/share/${Date.now()}?expires=${shareExpiry}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const formats: { value: ReportFormat; label: string; desc: string }[] = [
    { value: 'PDF', label: 'PDF', desc: 'Print-ready, shareable' },
    { value: 'DOCX', label: 'DOCX', desc: 'Editable document' },
    { value: 'PNG', label: 'PNG', desc: 'Image preview' },
  ];

  return (
    <div className="bg-bg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-[#C108AB]" />
          <h2 className="text-lg font-semibold text-text-primary">Export Report</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Format</label>
          <div className="grid grid-cols-3 gap-2">
            {formats.map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFormat(f.value)}
                className={`p-3 text-left border transition-colors ${
                  selectedFormat === f.value
                    ? 'border-[#C108AB] bg-[#C108AB]/5'
                    : 'border-border hover:border-[#C108AB]/50'
                }`}
              >
                <div className="font-medium text-text-primary">{f.label}</div>
                <div className="text-xs text-text-muted">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEmail}
              onChange={(e) => setIncludeEmail(e.target.checked)}
              className="w-4 h-4 border-border"
            />
            <Mail className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-primary">Send via Email</span>
          </label>

          {includeEmail && (
            <div className="mt-3 space-y-3 ml-6">
              <div>
                <label className="block text-xs text-text-muted mb-1">Recipients (comma separated)</label>
                <Input
                  value={emailAddresses}
                  onChange={(e) => setEmailAddresses(e.target.value)}
                  placeholder="user1@example.com, user2@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Subject (optional)</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="LYC Intelligence Report"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Message (optional)</label>
                <textarea
                  className="w-full bg-bg-alt border border-border p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] min-h-[60px]"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Optional message..."
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeShare}
              onChange={(e) => setIncludeShare(e.target.checked)}
              className="w-4 h-4 border-border"
            />
            <Share2 className="w-4 h-4 text-text-muted" />
            <span className="text-sm text-text-primary">Create Share Link</span>
          </label>

          {includeShare && (
            <div className="mt-3 ml-6">
              <label className="block text-xs text-text-muted mb-1">Expiry</label>
              <select
                className="w-full bg-bg-alt border border-border p-2 text-sm text-text-primary"
                value={shareExpiry}
                onChange={(e) => setShareExpiry(e.target.value)}
              >
                <option value="1d">1 day</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="90d">90 days</option>
              </select>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            Export {selectedFormat}
          </Button>
        </div>

        {success && (
          <div className="p-3 bg-green-500/10 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600">Export completed successfully</span>
          </div>
        )}

        {shareUrl && (
          <div className="border-t border-border pt-3">
            <label className="block text-xs text-text-muted mb-1">Share Link</label>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly />
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
