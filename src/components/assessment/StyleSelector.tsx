import React from 'react';
import { WritingStyle } from '../../services/assessmentEngine';

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

interface StyleOption {
  id: WritingStyle;
  name: string;
  description: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'analytical', name: 'Analytical', description: 'Logical, data-driven, and precise' },
  { id: 'visionary', name: 'Visionary', description: 'Big-picture, inspiring, and future-focused' },
  { id: 'pragmatic', name: 'Pragmatic', description: 'Practical, hands-on, and results-oriented' },
  { id: 'empathetic', name: 'Empathetic', description: 'Emotional, relatable, and people-focused' },
];

interface StyleSelectorProps {
  selectedStyle?: WritingStyle;
  onSelect: (style: WritingStyle) => void;
}

export function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{
        fontFamily: DS.headingFont,
        fontSize: '24px',
        color: DS.text,
        marginBottom: '12px'
      }}>
        Choose your writing style
      </h2>
      <p style={{ color: DS.muted, marginBottom: '24px' }}>
        How would you like your personalized report to be written?
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px'
      }}>
        {STYLE_OPTIONS.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            style={{
              width: '100%',
              padding: '20px',
              background: selectedStyle === style.id ? `${DS.accent}20` : DS.card,
              border: `1px solid ${selectedStyle === style.id ? DS.accent : DS.border}`,
              borderRadius: DS.radius,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              minHeight: '72px'
            }}
          >
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: DS.text,
              margin: '0 0 4px 0'
            }}>
              {style.name}
            </h4>
            <p style={{
              fontSize: '14px',
              color: DS.muted,
              margin: 0,
              lineHeight: 1.4
            }}>
              {style.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
