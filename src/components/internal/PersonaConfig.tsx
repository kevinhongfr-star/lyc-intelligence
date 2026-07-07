import { useState } from 'react';
import { Bot, RefreshCw } from 'lucide-react';

const DEFAULT_PERSONA = 'Executive Coach + Analytical';
const DEFAULT_TONE = 'Professional, direct, data-driven';

const TONE_OPTIONS = [
  'Professional, direct, data-driven',
  'Warm, conversational, empathetic',
  'Concise, executive, advisory',
  'Coaching, reflective, probing',
];

export function PersonaConfig() {
  const [editing, setEditing] = useState(false);
  const [persona, setPersona] = useState(DEFAULT_PERSONA);
  const [tone, setTone] = useState(DEFAULT_TONE);
  const [draftPersona, setDraftPersona] = useState(DEFAULT_PERSONA);
  const [draftTone, setDraftTone] = useState(DEFAULT_TONE);

  const handleEdit = () => {
    setDraftPersona(persona);
    setDraftTone(tone);
    setEditing(true);
  };

  const handleSave = () => {
    setPersona(draftPersona.trim() || DEFAULT_PERSONA);
    setTone(draftTone);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleReset = () => {
    setPersona(DEFAULT_PERSONA);
    setTone(DEFAULT_TONE);
    setDraftPersona(DEFAULT_PERSONA);
    setDraftTone(DEFAULT_TONE);
    setEditing(false);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">PERSONA CONFIGURATION</h3>
      </div>

      {!editing ? (
        <div className="space-y-4">
          <div className="border border-bg-tertiary p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Current Persona
              </p>
              <p className="text-text-primary font-medium">{persona}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Tone
              </p>
              <p className="text-text-secondary">{tone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEdit}
              className="border border-accent text-accent px-4 py-2 text-sm font-medium hover:bg-accent-10"
            >
              Edit Persona
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-text-muted text-sm hover:text-text-secondary flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Default
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border border-bg-tertiary p-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
              Persona Description
            </label>
            <textarea
              value={draftPersona}
              onChange={(e) => setDraftPersona(e.target.value)}
              rows={3}
              className="w-full bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 block">
              Tone
            </label>
            <select
              value={draftTone}
              onChange={(e) => setDraftTone(e.target.value)}
              className="w-full bg-bg-secondary border border-bg-tertiary px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
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
}
