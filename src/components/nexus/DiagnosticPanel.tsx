import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  HelpCircle,
  MessageCircle,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DS = {
  headingFont: "'Crimson Pro', Georgia, serif",
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
  warning: '#B45309',
  radius: '0px',
};

export type DiagnosticDimensionId =
  | 'role'
  | 'situation'
  | 'constraint'
  | 'emotion'
  | 'success';

export type DiagnosticStatus = 'collected' | 'missing' | 'active';

export interface DiagnosticDimension {
  id: DiagnosticDimensionId;
  label: string;
  status: DiagnosticStatus;
}

export interface DiagnosticPanelProps {
  /** The 5 diagnostic dimensions with their status */
  dimensions: DiagnosticDimension[];
  /** The currently suggested question for the next missing dimension */
  activeSuggestion?: string;
  /** Callback when user clicks "Mark as complete" for a dimension */
  onMarkComplete: (dimensionId: DiagnosticDimensionId) => void;
  /** Callback when user asks the suggested question */
  onAskQuestion: () => void;
  /** Additional className for styling */
  className?: string;
}

const DIMENSION_META: Record<
  DiagnosticDimensionId,
  { label: string; icon: string }
> = {
  role: { label: 'Role', icon: '👤' },
  situation: { label: 'Situation', icon: '🌍' },
  constraint: { label: 'Constraint', icon: '⛓️' },
  emotion: { label: 'Emotion', icon: '💭' },
  success: { label: 'Success', icon: '🎯' },
};

export function DiagnosticPanel({
  dimensions,
  activeSuggestion,
  onMarkComplete,
  onAskQuestion,
  className,
}: DiagnosticPanelProps) {
  const [confirmingId, setConfirmingId] = useState<DiagnosticDimensionId | null>(null);

  const collectedCount = dimensions.filter((d) => d.status === 'collected').length;
  const coveragePercent = Math.round((collectedCount / 5) * 100);

  const handleMarkComplete = (dim: DiagnosticDimension) => {
    if (dim.status !== 'missing') return;
    if (confirmingId === dim.id) {
      onMarkComplete(dim.id);
      setConfirmingId(null);
    } else {
      setConfirmingId(dim.id);
      setTimeout(() => {
        setConfirmingId((current) => (current === dim.id ? null : current));
      }, 3000);
    }
  };

  return (
    <div
      className={cn('border border-[#E5E5E5] bg-white', className)}
      style={{ }}
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
          <Target style={{ width: 15, height: 15, color: DS.accent }} />
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
            Diagnostic Coverage
          </span>
        </div>
        <span
          style={{
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 600,
            color: coveragePercent === 100 ? DS.accent : DS.muted,
          }}
        >
          {collectedCount}/5 ({coveragePercent}%)
        </span>
      </div>

      <div
        style={{
          position: 'relative',
          height: '4px',
          background: DS.border,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${coveragePercent}%`,
            background:
              coveragePercent === 100
                ? DS.accent
                : `linear-gradient(90deg, ${DS.accent} 0%, ${DS.accentHover} 100%)`,
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {dimensions.map((dim) => {
            const meta = DIMENSION_META[dim.id];
            const isCollected = dim.status === 'collected';
            const isMissing = dim.status === 'missing';
            const isActive = dim.status === 'active';

            return (
              <div
                key={dim.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: isCollected
                    ? `${DS.success}08`
                    : isActive
                    ? `${DS.accent}08`
                    : 'transparent',
                  transition: 'background 0.2s ease',
                  animation: isActive ? 'pulse 2s infinite' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isCollected ? (
                    <CheckCircle2
                      style={{ width: 16, height: 16, color: DS.success }}
                    />
                  ) : isActive ? (
                    <HelpCircle
                      style={{
                        width: 16,
                        height: 16,
                        color: DS.accent,
                      }}
                    />
                  ) : (
                    <Circle
                      style={{
                        width: 16,
                        height: 16,
                        color: DS.muted,
                        opacity: 0.4,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: '13px',
                      color: isCollected
                        ? DS.text
                        : isActive
                        ? DS.accent
                        : DS.muted,
                      fontWeight: isCollected
                        ? 500
                        : isActive
                        ? 600
                        : 400,
                    }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </div>

                {isMissing && (
                  <button
                    onClick={() => handleMarkComplete(dim)}
                    style={{
                      padding: '3px 8px',
                      background:
                        confirmingId === dim.id ? DS.accent : 'transparent',
                      color:
                        confirmingId === dim.id ? '#FFFFFF' : DS.muted,
                      border: `1px solid ${
                        confirmingId === dim.id ? DS.accent : DS.border
                      }`,
                      fontSize: '10px',
                      fontWeight: 600,
                      fontFamily: DS.bodyFont,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {confirmingId === dim.id ? 'Confirm' : 'Mark Complete'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {activeSuggestion && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 12px',
              background: DS.bgAlt,
              border: `1px solid ${DS.border}`,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: DS.accent,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '6px',
                fontFamily: DS.bodyFont,
              }}
            >
              Suggested Question
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: DS.text,
                lineHeight: 1.5,
                fontFamily: DS.bodyFont,
                marginBottom: '8px',
              }}
            >
              {activeSuggestion}
            </p>
            <button
              onClick={onAskQuestion}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: DS.accent,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: DS.bodyFont,
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DS.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = DS.accent;
              }}
            >
              <MessageCircle style={{ width: 13, height: 13 }} />
              Ask this question
            </button>
          </div>
        )}

        {coveragePercent === 100 && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 12px',
              background: `${DS.accent}08`,
              borderLeft: `3px solid ${DS.accent}`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: DS.text,
                fontFamily: DS.bodyFont,
                fontWeight: 500,
              }}
            >
              ✅ Diagnostic complete. I now have a clear picture of your situation.
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
    </div>
  );
}