import React, { useState } from 'react';
import { Edit2, Eye, Variable, Copy, Check, Play, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface TemplateVariable {
  key: string;
  label: string;
  sample: string;
}

interface Template {
  id: string;
  name: string;
  channel: 'email' | 'sms' | 'linkedin';
  subject: string;
  body: string;
  version: number;
  variables: string[];
}

const VARIABLE_LIBRARY: TemplateVariable[] = [
  { key: 'first_name', label: 'First Name', sample: 'John' },
  { key: 'last_name', label: 'Last Name', sample: 'Doe' },
  { key: 'company', label: 'Company', sample: 'Acme Inc' },
  { key: 'role', label: 'Role', sample: 'Senior Engineer' },
  { key: 'industry', label: 'Industry', sample: 'Technology' },
  { key: 'location', label: 'Location', sample: 'San Francisco, CA' },
  { key: 'match_score', label: 'Match Score', sample: '92%' },
  { key: 'mandate_title', label: 'Mandate Title', sample: 'VP of Engineering' },
];

const MOCK_TEMPLATES: Template[] = [
  { id: 't1', name: 'Initial Contact - Tech', channel: 'email', subject: 'Exciting opportunity at {company}', body: 'Hi {first_name},\n\nI came across your profile and was impressed by your work at {company}. We have an exciting opportunity for a {role} in the {industry} space.\n\nWould you be open to a conversation?\n\nBest regards,\nRecruitment Team', version: 3, variables: ['first_name', 'company', 'role', 'industry'] },
  { id: 't2', name: 'LinkedIn Connection', channel: 'linkedin', subject: '', body: 'Hi {first_name}, I specialize in {industry} talent and noticed your impressive background at {company}. Would love to connect.', version: 2, variables: ['first_name', 'industry', 'company'] },
  { id: 't3', name: 'SMS Follow-up', channel: 'sms', subject: '', body: 'Hi {first_name}, following up on my email re: {role} opportunity at {company}. Let me know if interested!', version: 1, variables: ['first_name', 'role', 'company'] },
];

export function TemplateEditor() {
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ templateId: string; body: string; subject: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const editing = templates.find(t => t.id === editingId);

  const updateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(t => {
      if (t.id !== id) return t;
      const merged = { ...t, ...updates };
      const allText = (merged.subject || '') + ' ' + (merged.body || '');
      const varMatches = allText.match(/\{(\w+)\}/g);
      merged.variables = varMatches ? [...new Set(varMatches.map(v => v.slice(1, -1)))] : [];
      return merged;
    }));
  };

  const insertVariable = (variable: string) => {
    if (!editing) return;
    const body = editing.body + ` {${variable}}`;
    updateTemplate(editing.id, { body });
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 1000);
  };

  const runPreview = (template: Template) => {
    const sampleVars: Record<string, string> = {};
    for (const v of template.variables) {
      const lib = VARIABLE_LIBRARY.find(l => l.key === v);
      sampleVars[v] = lib?.sample || `[${v}]`;
    }
    let body = template.body;
    let subject = template.subject;
    for (const [key, val] of Object.entries(sampleVars)) {
      body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
      subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }
    setPreview({ templateId: template.id, body, subject });
  };

  const saveVersion = () => {
    if (!editing) return;
    setTemplates(prev => prev.map(t => t.id === editing.id ? { ...t, version: t.version + 1 } : t));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-accent" />
          Template Library
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 space-y-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => setEditingId(t.id)}
                className={`w-full text-left p-2 border transition-colors ${
                  editingId === t.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="text-sm font-medium text-text-primary">{t.name}</div>
                <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                  <span className="uppercase">{t.channel}</span>
                  <span>· v{t.version}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="md:col-span-2">
            {editing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={editing.name}
                    onChange={e => updateTemplate(editing.id, { name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-border bg-bg text-sm font-medium focus:outline-none focus:border-accent rounded-none"
                  />
                  <span className="text-xs text-text-muted ml-2">v{editing.version}</span>
                </div>
                <select
                  value={editing.channel}
                  onChange={e => updateTemplate(editing.id, { channel: e.target.value as Template['channel'] })}
                  className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                {editing.channel === 'email' && (
                  <input
                    type="text"
                    value={editing.subject}
                    onChange={e => updateTemplate(editing.id, { subject: e.target.value })}
                    placeholder="Subject line..."
                    className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent rounded-none"
                  />
                )}
                <textarea
                  value={editing.body}
                  onChange={e => updateTemplate(editing.id, { body: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-border bg-bg text-sm font-mono focus:outline-none focus:border-accent rounded-none"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-text-muted">Detected variables:</span>
                  {editing.variables.map(v => (
                    <span key={v} className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-1.5 py-0.5">
                      <Variable className="w-3 h-3" />{'{v}'}
                    </span>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => runPreview(editing)}>
                    <Eye className="w-4 h-4" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveVersion}>
                    <Save className="w-4 h-4" /> Save Version
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted text-sm">
                <Edit2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Select a template to edit
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <p className="text-xs text-text-muted mb-2 font-medium">Variable Library</p>
            <div className="space-y-1 max-h-96 overflow-auto">
              {VARIABLE_LIBRARY.map(v => (
                <button
                  key={v.key}
                  onClick={() => insertVariable(v.key)}
                  disabled={!editing}
                  className="w-full text-left p-2 border border-border hover:border-accent/50 text-xs transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-text-primary flex items-center gap-1">
                    {v.label}
                    {copiedVar === v.key && <Check className="w-3 h-3 text-green-600" />}
                  </div>
                  <div className="text-text-muted flex items-center gap-1">
                    <Variable className="w-3 h-3" /> {'{'}{v.key}{'}'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {preview && (
          <div className="mt-4 border border-accent/30 p-4 bg-accent/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" /> Personalized Preview
              </span>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            {preview.subject && (
              <p className="text-sm font-medium text-text-primary mb-2">Subject: {preview.subject}</p>
            )}
            <pre className="text-sm text-text-secondary whitespace-pre-wrap">{preview.body}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}