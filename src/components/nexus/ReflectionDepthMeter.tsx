import React from 'react';
import { TrendingUp, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

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

export type ReflectionDepth = 'surface' | 'specific' | 'reflective' | 'transformative';

export interface ReflectionDepthMeterProps {
  currentDepth: ReflectionDepth;
  maxDepth?: ReflectionDepth;
  className?: string;
}

const DEPTH_LEVELS: { level: ReflectionDepth; label: string; description: string }[] = [
  {
    level: 'surface',
    label: 'Surface',
    description: 'General statements, no specific examples. Broad and unfocused.',
  },
  {
    level: 'specific',
    label: 'Specific',
    description: 'Concrete situations and examples. Some personal context shared.',
  },
  {
    level: 'reflective',
    label: 'Reflective',
    description: 'Self-awareness of patterns, feelings, and root causes.',
  },
  {
    level: 'transformative',
    label: 'Transformative',
    description: 'Action-oriented with measurable outcomes and commitment to change.',
  },
];

const DEPTH_INDEX: Record<ReflectionDepth, number> = {
  surface: 0,
  specific: 1,
  reflective: 2,
  transformative: 3,
};

function getNextLevel(current: ReflectionDepth): ReflectionDepth | null {
  const idx = DEPTH_INDEX[current];
  return idx < DEPTH_LEVELS.length - 1 ? DEPTH_LEVELS[idx + 1].level : null;
}

export function ReflectionDepthMeter({
  currentDepth,
  maxDepth = 'transformative',
  className,
}: ReflectionDepthMeterProps) {
  const currentIdx = DEPTH_INDEX[currentDepth];
  const maxIdx = DEPTH_INDEX[maxDepth];
  const nextLevel = getNextLevel(currentDepth);
  const currentLevel = DEPTH_LEVELS[currentIdx];

  const fillPercent = ((currentIdx + 1) / (maxIdx + 1)) * 100;

  return (
    <div
      className={className}
      style={{
        background: DS.bg,
        border: `1px solid ${DS.border}`,
        padding: '20px 24px',
        display: 'flex',
        gap: '24px',
      }}
    >
      <div
        style={{
          width: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '180px',
            background: DS.bgAlt,
            position: 'relative',
            border: `1px solid ${DS.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillPercent}%`,
              background: `linear-gradient(180deg, ${DS.accent} 0%, ${DS.accentHover} 100%)`,
              transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          {DEPTH_LEVELS.map((_, i) => {
            const markerPos = ((i + 1) / DEPTH_LEVELS.length) * 100;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: `${markerPos}%`,
                  height: '1px',
                  background:
                    i <= currentIdx ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                  transition: 'background 0.3s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <TrendingUp size={14} style={{ color: DS.accent }} />
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '12px',
              fontWeight: 600,
              color: DS.accent,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Reflection Depth
          </span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontFamily: DS.headingFont,
              fontSize: '18px',
              fontWeight: 600,
              color: DS.text,
              marginBottom: '4px',
            }}
          >
            {currentLevel.label}
          </div>
          <p
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: DS.textSecondary,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {currentLevel.description}
          </p>
        </div>

        {nextLevel && (
          <div
            style={{
              marginTop: 'auto',
              padding: '10px 14px',
              background: `${DS.accent}08`,
              borderLeft: `3px solid ${DS.accent}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ChevronUp size={14} style={{ color: DS.accent, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: DS.bodyFont,
                fontSize: '12px',
                color: DS.textSecondary,
                lineHeight: 1.4,
              }}
            >
              <strong style={{ color: DS.accent }}>Next:</strong> Move toward{''}
              {DEPTH_LEVELS[DEPTH_INDEX[nextLevel]].label.toLowerCase()} responses for deeper insight.
            </span>
          </div>
        )}

        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            {DEPTH_LEVELS.map((lvl, i) => (
              <span
                key={lvl.level}
                style={{
                  fontFamily: DS.bodyFont,
                  fontSize: '10px',
                  fontWeight: i <= currentIdx ? 600 : 400,
                  color: i <= currentIdx ? DS.accent : DS.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  transition: 'color 0.3s ease',
                }}
              >
                {lvl.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}