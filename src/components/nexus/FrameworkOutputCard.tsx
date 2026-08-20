import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DS = {
  headingFont: "'DejaVu Serif', 'Georgia', 'Times New Roman', Times, serif",
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
  radius: '0px',
};

export type FrameworkType = 'TRIDENT' | 'SHIFT' | 'CANVAS' | 'GRADE' | 'CUSTOM';

export interface FrameworkOutputSection {
  title: string;
  content: string;
}

export interface FrameworkOutput {
  framework: FrameworkType;
  keyInsight: string;
  sections: FrameworkOutputSection[];
}

export interface FrameworkOutputCardProps {
  /** The framework type that produced this output */
  frameworkType: FrameworkType;
  /** Structured output data with sections and key insight */
  output: FrameworkOutput;
  /** Callback for export/download action */
  onExport?: () => void;
  /** Callback for "use this framework again" action */
  onReuse?: () => void;
  /** Additional className for styling */
  className?: string;
}

const FRAMEWORK_META: Record<
  FrameworkType,
  { label: string; badgeColor: string; badgeBg: string }
> = {
  TRIDENT: { label: 'TRIDENT', badgeColor: '#1D4ED8', badgeBg: '#EFF6FF' },
  SHIFT: { label: 'SHIFT', badgeColor: '#B45309', badgeBg: '#FFFBEB' },
  CANVAS: { label: 'CANVAS', badgeColor: '#6D28D9', badgeBg: '#F5F3FF' },
  GRADE: { label: 'GRADE', badgeColor: '#047857', badgeBg: '#ECFDF5' },
  CUSTOM: { label: 'CUSTOM', badgeColor: DS.accent, badgeBg: `${DS.accent}15` },
};

export function FrameworkOutputCard({
  frameworkType,
  output,
  onExport,
  onReuse,
  className,
}: FrameworkOutputCardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const meta = FRAMEWORK_META[frameworkType] || FRAMEWORK_META.CUSTOM;

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
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
          padding: '14px 16px',
          borderBottom: `1px solid ${DS.border}`,
          background: DS.bgAlt,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              background: meta.badgeBg,
              color: meta.badgeColor,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: DS.bodyFont,
            }}
          >
            <Sparkles style={{ width: 12, height: 12, marginRight: 4 }} />
            {meta.label}
          </span>
          <span
            style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: DS.muted,
              fontWeight: 500,
            }}
          >
            Model Output
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onExport && (
            <button
              onClick={onExport}
              aria-label="Export model output"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                border: `1px solid ${DS.border}`,
                background: DS.bg,
                color: DS.textSecondary,
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: DS.bodyFont,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = DS.accent;
                e.currentTarget.style.color = DS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = DS.border;
                e.currentTarget.style.color = DS.textSecondary;
              }}
            >
              <Download style={{ width: 13, height: 13 }} />
              Export
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div
          style={{
            padding: '12px 16px',
            background: `${DS.accent}08`,
            borderLeft: `3px solid ${DS.accent}`,
            marginBottom: '16px',
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
            Key Insight
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: DS.text,
              lineHeight: 1.6,
            }}
          >
            {output.keyInsight}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {output.sections.map((section, index) => {
            const isExpanded = expandedSections.has(index);
            return (
              <div
                key={index}
                style={{
                  borderBottom:
                    index < output.sections.length - 1
                      ? `1px solid ${DS.border}`
                      : 'none',
                }}
              >
                <button
                  onClick={() => toggleSection(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: DS.bodyFont,
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: DS.text,
                    }}
                  >
                    {section.title}
                  </span>
                  {isExpanded ? (
                    <ChevronUp style={{ width: 16, height: 16, color: DS.muted }} />
                  ) : (
                    <ChevronDown style={{ width: 16, height: 16, color: DS.muted }} />
                  )}
                </button>
                {isExpanded && (
                  <div
                    style={{
                      paddingBottom: '12px',
                      fontSize: '13px',
                      color: DS.textSecondary,
                      lineHeight: 1.7,
                      fontFamily: DS.bodyFont,
                    }}
                  >
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {onReuse && (
          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            <button
              onClick={onReuse}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: DS.accent,
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
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
              <RotateCcw style={{ width: 14, height: 14 }} />
              Use this model again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}