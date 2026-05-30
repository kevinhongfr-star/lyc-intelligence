import React from 'react';

import { DS } from '@/lib/designSystem';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptSelect: (prompt: string) => void;
}

export function SuggestedPrompts({ prompts, onPromptSelect }: SuggestedPromptsProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onPromptSelect(prompt)}
          style={{
            padding: '6px 12px',
            background: DS.card,
            border: `1px solid ${DS.cardBorder}`,
            borderRadius: '14px',
            color: DS.textSecondary,
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = DS.accent;
            e.currentTarget.style.background = `${DS.accent}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = DS.border;
            e.currentTarget.style.background = DS.card;
          }}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
