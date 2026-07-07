import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export interface InterviewFeedbackProps {
  defaultWell?: string;
  defaultImprove?: string;
  defaultConfidence?: 'Low' | 'Medium' | 'High';
}

export function InterviewFeedback({
  defaultWell = '',
  defaultImprove = '',
  defaultConfidence = 'Medium',
}: InterviewFeedbackProps) {
  const [wentWell, setWentWell] = useState(defaultWell);
  const [improve, setImprove] = useState(defaultImprove);
  const [confidence, setConfidence] = useState<'Low' | 'Medium' | 'High'>(defaultConfidence);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
  };

  const inputClass =
    'w-full bg-bg-primary border border-bg-tertiary p-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none';

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">POST-INTERVIEW REFLECTION</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
            What went well?
          </label>
          <textarea
            value={wentWell}
            onChange={(e) => {
              setWentWell(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="Capture the moments that landed strongest..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
            What would you improve?
          </label>
          <textarea
            value={improve}
            onChange={(e) => {
              setImprove(e.target.value);
              setSaved(false);
            }}
            rows={3}
            placeholder="Note where you'd sharpen the answer next time..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
            Confidence level
          </label>
          <select
            value={confidence}
            onChange={(e) => {
              setConfidence(e.target.value as 'Low' | 'Medium' | 'High');
              setSaved(false);
            }}
            className={inputClass}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Save Reflection
          </button>
          {saved && <span className="text-xs text-text-muted">Saved</span>}
        </div>
      </div>
    </div>
  );
}
