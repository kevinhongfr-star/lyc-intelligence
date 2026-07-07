import React, { useState } from 'react';
import { Users, Send, CheckCircle2 } from 'lucide-react';

type Consensus = 'Strong' | 'Mixed' | 'Weak';

interface Debrief {
  id: string;
  candidate: string;
  date: string;
  note: string;
}

const RECENT_DEBRIEFS: Debrief[] = [
  { id: 'd-1', candidate: 'David Tan', date: 'Jul 5', note: 'Panel consensus: Strong' },
  { id: 'd-2', candidate: 'Rachel Lee', date: 'Jul 3', note: 'Mixed feedback, 2nd round' },
];

export function DebriefCapture() {
  const [candidate, setCandidate] = useState('');
  const [consensus, setConsensus] = useState<Consensus>('Strong');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">POST-INTERVIEW DEBRIEF</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm text-text-muted mb-1">Candidate name</label>
          <input
            type="text"
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="Candidate name"
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          />
        </div>
        <div>
          <label className="block text-sm text-text-muted mb-1">Panel consensus</label>
          <select
            value={consensus}
            onChange={(e) => setConsensus(e.target.value as Consensus)}
            className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
          >
            <option value="Strong">Strong</option>
            <option value="Mixed">Mixed</option>
            <option value="Weak">Weak</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-text-muted mb-1">Debrief notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Debrief notes"
          rows={4}
          className="w-full border border-bg-tertiary bg-bg-primary px-3 py-2 text-sm text-text-primary"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleSave}
          className="bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-hover flex items-center gap-1"
        >
          <Send className="w-3.5 h-3.5" />
          Save Debrief
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-teal">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
          Last debriefs
        </p>
        <div className="border border-bg-tertiary">
          {RECENT_DEBRIEFS.map((d, i) => (
            <div
              key={d.id}
              className={`px-4 py-3 ${
                i < RECENT_DEBRIEFS.length - 1 ? 'border-b border-bg-tertiary' : ''
              }`}
            >
              <p className="text-sm text-text-primary font-medium">
                {d.candidate}
                <span className="text-text-muted font-normal"> — {d.date}</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">{d.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
