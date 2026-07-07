import React, { useState } from 'react';
import { ToggleRight, ToggleLeft } from 'lucide-react';

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
}

const INITIAL_FLAGS: FeatureFlag[] = [
  { name: 'Nexus AI Coach', description: 'AI-powered coaching chat', enabled: true },
  { name: 'Batch Scoring Engine', description: 'Parallel candidate scoring', enabled: true },
  { name: 'Advanced Reports', description: 'Competitive intel + org health reports', enabled: true },
  { name: 'Calendar Sync', description: 'Google/Outlook integration', enabled: false },
  { name: 'Video Introductions', description: 'Candidate video intro recording', enabled: true },
  { name: 'Market Maps Beta', description: 'Geographic talent density (beta)', enabled: false },
];

export function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);

  const toggle = (name: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.name === name ? { ...f, enabled: !f.enabled } : f)),
    );
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-5">
        <ToggleRight className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">FEATURE FLAGS</h3>
      </div>

      <div className="flex flex-col">
        {flags.map((flag) => (
          <div
            key={flag.name}
            className="flex items-center justify-between py-4 border-b border-bg-tertiary last:border-b-0"
          >
            <div>
              <p className="font-medium text-text-primary">{flag.name}</p>
              <p className="text-sm text-text-muted">{flag.description}</p>
            </div>
            <button
              onClick={() => toggle(flag.name)}
              className="cursor-pointer"
              aria-label={`Toggle ${flag.name}`}
              role="switch"
              aria-checked={flag.enabled}
            >
              {flag.enabled ? (
                <ToggleRight className="w-8 h-8 text-teal" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-text-muted" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
