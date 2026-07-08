'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Paperclip,
  Template,
  Eye,
  Loader2,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  defaultSubject?: string;
  onSent?: (threadId: string) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  category: string;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  contactId,
  contactName = '',
  contactEmail = '',
  defaultSubject = '',
  onSent,
}: EmailComposerModalProps) {
  const [to, setTo] = useState(contactEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo(contactEmail);
      setSubject(defaultSubject);
      setBody('');
      setError(null);
      loadTemplates();
    }
  }, [isOpen, contactEmail, defaultSubject]);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/email/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  };

  const applyTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const variables: Record<string, string> = {
      candidate_name: contactName || '{{candidate_name}}',
      role_title: '{{role_title}}',
      client_company: '{{client_company}}',
      company_name: contactName ? contactName.split(' ').pop() || '{{company_name}}' : '{{company_name}}',
      sender_name: '{{sender_name}}',
    };

    try {
      const res = await fetch(`/api/email/templates/${templateId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      });
      const data = await res.json();
      if (data.success) {
        setSubject(data.rendered.subject);
        setBody(data.rendered.body);
      }
    } catch (e) {
      // Fallback: simple client-side render
      let renderedSubject = template.subject_template;
      let renderedBody = template.body_template;
      for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        renderedSubject = renderedSubject.replace(pattern, value);
        renderedBody = renderedBody.replace(pattern, value);
      }
      setSubject(renderedSubject);
      setBody(renderedBody);
    }

    setSelectedTemplate(templateId);
    setShowTemplatePicker(false);
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          to,
          subject,
          body_html: body,
          cc: cc ? cc.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSent?.(data.thread_id);
        onClose();
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-none w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">New Email</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-none">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm">
              {error}
            </div>
          )}

          {/* Template picker */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <Template className="w-4 h-4" />
                {selectedTemplate
                  ? templates.find(t => t.id === selectedTemplate)?.name || 'Use Template'
                  : 'Use Template'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>

            {showTemplatePicker && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-none shadow-xl max-h-64 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-sm">
                    No templates available
                  </div>
                ) : (
                  templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => applyTemplate(template.id)}
                      className="w-full px-4 py-3 text-left hover:bg-bg-alt transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-text-primary">{template.name}</div>
                      <div className="text-xs text-text-muted mt-0.5 truncate">
                        {template.subject_template}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">To</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="recipient@example.com"
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              CC <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={cc}
              onChange={e => setCc(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="cc@example.com, cc2@example.com"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Email subject"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-text-secondary">Body</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {showPreview ? (
              <div
                className="w-full min-h-[200px] p-4 rounded-none bg-bg-base border border-border prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            ) : (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full h-64 px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                placeholder="Write your email here... (HTML supported)"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <button
            type="button"
            className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1"
          >
            <Paperclip className="w-4 h-4" />
            Attachments
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={isSending} className="gap-2">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailComposerModal;
