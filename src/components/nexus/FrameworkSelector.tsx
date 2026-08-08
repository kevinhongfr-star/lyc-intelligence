import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  ArrowRight,
  BarChart3,
  GitBranch,
  Layout,
  Target,
  Compass,
  Layers,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  success: '#00897B',
  radius: '0px',
};

export type FrameworkId =
  | 'trident'
  | 'shift'
  | 'canvas'
  | 'grade'
  | 'situational'
  | 'stakeholder'
  | 'custom';

export interface Framework {
  id: FrameworkId;
  name: string;
  description: string;
  useCases: string[];
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  recommended?: boolean;
}

export interface FrameworkSelectorProps {
  /** Current user intent or context description */
  intent: string;
  /** List of available frameworks to display */
  availableFrameworks: Framework[];
  /** Callback when a framework is selected/activated */
  onSelect: (frameworkId: FrameworkId) => void;
  /** Additional className for styling */
  className?: string;
}

const DEFAULT_FRAMEWORKS: Framework[] = [
  {
    id: 'trident',
    name: 'Match Analysis',
    description:
      'Structured assessment across 3 dimensions: diagnosis, gap analysis, and action planning.',
    useCases: ['Career transitions', 'Performance reviews', 'Development planning'],
    icon: Target,
    accentColor: '#1D4ED8',
  },
  {
    id: 'shift',
    name: 'SHIFT',
    description:
      'Situational leadership framework for analyzing context and recommending optimal leadership style.',
    useCases: ['Team leadership', 'Change management', 'Coaching scenarios'],
    icon: GitBranch,
    accentColor: '#B45309',
  },
  {
    id: 'canvas',
    name: 'Scorecard Builder',
    description:
      'Visual thinking framework for mapping out a complete situation across multiple dimensions.',
    useCases: ['Strategic planning', 'Problem solving', 'Team alignment'],
    icon: Layout,
    accentColor: '#6D28D9',
  },
  {
    id: 'grade',
    name: 'GRADE',
    description:
      'Goal-oriented reflective framework for structured thinking and decision quality assessment.',
    useCases: ['Decision making', 'Goal setting', 'Performance assessment'],
    icon: BarChart3,
    accentColor: '#047857',
  },
  {
    id: 'situational',
    name: 'Situational',
    description:
      'Context-aware framework that adapts questions and analysis based on your specific situation.',
    useCases: ['Role-specific advice', 'Industry guidance', 'Contextual coaching'],
    icon: Compass,
    accentColor: '#0E7490',
  },
  {
    id: 'stakeholder',
    name: 'Stakeholder Map',
    description:
      'Framework for mapping and analyzing stakeholder relationships and influence dynamics.',
    useCases: ['Stakeholder management', 'Organizational navigation', 'Influence mapping'],
    icon: Layers,
    accentColor: '#7C3AED',
  },
];

export function FrameworkSelector({
  intent,
  availableFrameworks,
  onSelect,
  className,
}: FrameworkSelectorProps) {
  const [selectedId, setSelectedId] = useState<FrameworkId | null>(null);
  const [hoveredId, setHoveredId] = useState<FrameworkId | null>(null);

  const frameworks =
    availableFrameworks.length > 0 ? availableFrameworks : DEFAULT_FRAMEWORKS;

  const handleActivate = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
  };

  const activeFramework = frameworks.find((f) => f.id === selectedId);
  const recommendedCount = frameworks.filter((f) => f.recommended).length;

  return (
    <div
      className={cn('border border-[#E5E5E5] bg-white', className)}
      style={{ borderRadius: 0 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: `1px solid ${DS.border}`,
          background: DS.bgAlt,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: 15, height: 15, color: DS.accent }} />
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 700,
              color: DS.text,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Recommended Frameworks
          </span>
        </div>
        {recommendedCount > 0 && (
          <span
            style={{
              fontSize: '11px',
              color: DS.accent,
              fontWeight: 600,
              fontFamily: DS.bodyFont,
            }}
          >
            {recommendedCount} match{recommendedCount > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {intent && (
        <div
          style={{
            padding: '10px 14px',
            background: `${DS.accent}08`,
            borderBottom: `1px solid ${DS.border}`,
            fontSize: '12px',
            color: DS.textSecondary,
            fontFamily: DS.bodyFont,
          }}
        >
          <span style={{ color: DS.muted, fontWeight: 600 }}>Intent: </span>
          {intent}
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '10px',
          }}
        >
          {frameworks.map((fw) => {
            const Icon = fw.icon;
            const isSelected = selectedId === fw.id;
            const isHovered = hoveredId === fw.id;

            return (
              <div
                key={fw.id}
                onClick={() => setSelectedId(fw.id)}
                onMouseEnter={() => setHoveredId(fw.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  background: isSelected
                    ? `${DS.accent}08`
                    : isHovered
                    ? DS.bgAlt
                    : DS.bg,
                  border: `1px solid ${
                    isSelected ? DS.accent : DS.border
                  }`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: `${fw.accentColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: 16, height: 16, color: fw.accentColor }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: DS.text,
                        fontFamily: DS.bodyFont,
                      }}
                    >
                      {fw.name}
                    </span>
                    {fw.recommended && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          background: `${DS.accent}15`,
                          color: DS.accent,
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <Zap style={{ width: 10, height: 10 }} />
                        Recommended
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: DS.textSecondary,
                      lineHeight: 1.5,
                      fontFamily: DS.bodyFont,
                      marginBottom: '6px',
                    }}
                  >
                    {fw.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {fw.useCases.slice(0, 3).map((uc, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '2px 8px',
                          background: DS.bgAlt,
                          color: DS.muted,
                          fontSize: '10px',
                          fontWeight: 500,
                          fontFamily: DS.bodyFont,
                        }}
                      >
                        {uc}
                      </span>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <Check
                    style={{
                      width: 18,
                      height: 18,
                      color: DS.accent,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            background: DS.bgAlt,
            border: `1px solid ${DS.border}`,
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: DS.muted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
              fontFamily: DS.bodyFont,
            }}
          >
            Visual Comparison
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(frameworks.length, 6)}, 1fr)`,
              gap: '6px',
            }}
          >
            {frameworks.map((fw) => (
              <div
                key={fw.id}
                onClick={() => setSelectedId(fw.id)}
                style={{
                  padding: '8px 4px',
                  background:
                    selectedId === fw.id ? `${fw.accentColor}15` : DS.bg,
                  border: `1px solid ${
                    selectedId === fw.id ? fw.accentColor : DS.border
                  }`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: DS.text,
                    fontFamily: DS.bodyFont,
                  }}
                >
                  {fw.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: DS.muted,
              fontFamily: DS.bodyFont,
            }}
          >
            {activeFramework
              ? `Selected: ${activeFramework.name}`
              : 'Select a framework to activate'}
          </span>
          <button
            onClick={handleActivate}
            disabled={!selectedId}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: selectedId ? DS.accent : DS.border,
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: DS.bodyFont,
              cursor: selectedId ? 'pointer' : 'not-allowed',
              borderRadius: 0,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (selectedId) e.currentTarget.style.background = DS.accentHover;
            }}
            onMouseLeave={(e) => {
              if (selectedId) e.currentTarget.style.background = DS.accent;
            }}
          >
            Activate
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </div>
  );
}