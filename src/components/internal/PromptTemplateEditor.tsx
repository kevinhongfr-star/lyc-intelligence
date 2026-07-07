import { useState } from 'react';
import { FileText } from 'lucide-react';

interface PromptTemplate {
  surface: string;
  prompt: string;
}

const TEMPLATES: PromptTemplate[] = [
  {
    surface: 'Internal Portal',
    prompt:
      'You are NEXUS, the internal consultant copilot. Surface relevant mandates, candidate signals, and SLA risks. Be concise and data-driven.',
  },
  {
    surface: 'B2B Client',
    prompt:
      'You are NEXUS for client stakeholders. Frame insights around mandate progress, market benchmarks, and talent landscape. Stay formal.',
  },
  {
    surface: 'B2C Leader',
    prompt:
      'You are NEXUS, an executive coach for senior leaders. Blend analytical insight with reflective coaching. Be direct and empowering.',
  },
  {
    surface: 'Candidate',
    prompt:
      'You are NEXUS guiding a candidate through their career journey. Be warm, clear, and actionable. Protect candidate agency.',
  },
];

export function PromptTemplateEditor() {
  const [viewingSurface, setViewingSurface] = useState<string | null>(null);
  const [editingSurface, setEditingSurface] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>(
    TEMPLATES.reduce((acc, t) => ({ ...acc, [t.surface]: t.prompt }), {})
  );

  const handleEdit = (surface: string) => {
    setDraft(savedPrompts[surface] ?? '');
    setViewingSurface(null);
    setEditingSurface(surface);
  };

  const handleSave = () => {
    if (editingSurface) {
      setSavedPrompts((prev) => ({ ...prev, [editingSurface]: draft }));
    }
    setEditingSurface(null);
  };

  const handleCancel = () => {
    setEditingSurface(null);
  };

  const handleView = (surface: string) => {
    setViewingSurface((prev) => (prev === surface ? null : surface));
    setEditingSurface(null);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PROMPT TEMPLATES</h3>
      </div>

      <div className="divide-y divide-bg-tertiary border-t border-b border-bg-tertiary">
        {TEMPLATES.map((t) => {
          const isEditing = editingSurface === t.surface;
          const isViewing = viewingSurface === t.surface;
          return (
            <div key={t.surface} className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-primary">{t.surface}</p>
                {!isEditing && (
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleView(t.surface)}
                      className="text-accent text-sm hover:underline"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(t.surface)}
                      className="text-accent text-sm hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {isViewing && !isEditing && (
                <div className="mt-3 bg-bg-secondary border border-bg-tertiary p-3">
                  <p className="text-xs text-text-secondary whitespace-pre-wrap">
                    {savedPrompts[t.surface]}
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="mt-3 space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={5}
                    className="w-full bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="border border-bg-tertiary text-text-secondary px-4 py-2 text-sm font-medium hover:bg-bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
