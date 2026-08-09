import React, { useState, useCallback } from 'react';
import { Edit2, Play, Plus, Trash2, Copy, Check, Variable, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CustomPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  version: number;
}

const CATEGORIES = ['general', 'recruitment', 'coaching', 'assessment', 'outreach'] as const;

const DEFAULT_PROMPTS: CustomPrompt[] = [
  { id: 'p1', name: 'JD Parser', description: 'Extract key requirements from a job description', category: 'recruitment', content: 'Parse the following job description and extract key requirements, skills needed, and responsibilities:\n\n{job_description}', variables: ['job_description'], version: 3 },
  { id: 'p2', name: 'Candidate Summary', description: 'Generate a professional summary for a candidate', category: 'general', content: 'Generate a concise professional summary for {candidate_name} based on:\n\n{experience}\n\nHighlight years of experience in {industry}.', variables: ['candidate_name', 'experience', 'industry'], version: 2 },
  { id: 'p3', name: 'Interview Prep', description: 'Generate personalized interview questions', category: 'assessment', content: 'Generate 5 behavioral interview questions for a {role} candidate with {years_experience} years experience, focusing on {competency}.', variables: ['role', 'years_experience', 'competency'], version: 1 },
];

export function CustomPromptEditor() {
  const [prompts, setPrompts] = useState<CustomPrompt[]>(DEFAULT_PROMPTS);
  const [editing, setEditing] = useState<CustomPrompt | null>(null);
  const [testing, setTesting] = useState(false);
  const [testOutput, setTestOutput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSave = useCallback((updated: CustomPrompt) => {
    setPrompts(prev => prev.map(p => p.id === updated.id ? { ...updated, version: updated.version + 1 } : p));
    setEditing(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleTest = useCallback(async (prompt: CustomPrompt) => {
    setTesting(true);
    setTestOutput('');
    await new Promise(resolve => setTimeout(resolve, 800));
    setTestOutput(
      `[Mock execution of "${prompt.name}" v${prompt.version}]\n\n` +
      prompt.content.replace(/\{(\w+)\}/g, (_, v) => `[${v}: demo_value]`)
    );
    setTesting(false);
  }, []);

  const handleDuplicate = useCallback((prompt: CustomPrompt) => {
    const copy: CustomPrompt = {
      ...prompt,
      id: `p_${Date.now()}`,
      name: `${prompt.name} (Copy)`,
      version: 1,
    };
    setPrompts(prev => [...prev, copy]);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-accent" />
          Custom Prompts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prompts.map(prompt => (
            <div key={prompt.id} className="border border-border p-4 hover:border-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-primary">{prompt.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-muted">v{prompt.version}</span>
                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent">{prompt.category}</span>
                  </div>
                  {prompt.description && (
                    <p className="text-xs text-text-secondary mb-2">{prompt.description}</p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    {prompt.variables.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 text-xs bg-bg-tertiary px-1.5 py-0.5">
                        <Variable className="w-3 h-3 text-accent" />
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleTest(prompt)} loading={testing}>
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(prompt)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(prompt)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(prompt.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <PromptEditorForm
            prompt={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}

        {testOutput && (
          <div className="mt-4 border border-accent/30 p-4 bg-accent/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-accent" /> Test Output
              </span>
              <Button variant="ghost" size="sm" onClick={() => setTestOutput('')}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">{testOutput}</pre>
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => setEditing({ id: `p_${Date.now()}`, name: 'New Prompt', description: '', category: 'general', content: '', variables: [], version: 1 })}
          >
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PromptEditorForm({
  prompt,
  onSave,
  onCancel,
}: {
  prompt: CustomPrompt;
  onSave: (p: CustomPrompt) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(prompt);

  const extractVars = (content: string): string[] => {
    const matches = content.match(/\{(\w+(?:\.\w+)*)\}/g);
    return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
  };

  const handleSaveClick = () => {
    const vars = extractVars(form.content);
    onSave({ ...form, variables: vars });
  };

  return (
    <div className="mt-4 border border-accent/50 p-4 bg-bg">
      <h4 className="font-medium text-sm text-text-primary mb-3">
        {prompt.id.startsWith('p_') ? 'New Prompt' : `Edit: ${prompt.name}`}
      </h4>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-muted mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-2 border border-border bg-bg text-sm focus:outline-none focus:border-accent"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">
            Content (use {'{variable}'} for placeholders)
          </label>
          <textarea
            value={form.content}
            onChange={e => {
              const content = e.target.value;
              setForm(f => ({ ...f, content, variables: extractVars(content) }));
            }}
            rows={6}
            className="w-full px-3 py-2 border border-border bg-bg text-sm font-mono focus:outline-none focus:border-accent"
          />
          {form.variables.length > 0 && (
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <span className="text-xs text-text-muted">Detected variables:</span>
              {form.variables.map(v => (
                <span key={v} className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-1.5 py-0.5">
                  <Variable className="w-3 h-3" />
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSaveClick}><Check className="w-4 h-4" /> Save</Button>
      </div>
    </div>
  );
}