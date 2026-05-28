import React from 'react';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  accent: '#C108AB',
  accentHover: '#A00790',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  border: '#E5E5E5',
  radius: '12px',
  radiusSm: '8px',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowHover: '0 4px 12px rgba(0,0,0,0.1)',
};

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
