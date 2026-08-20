import React from 'react';
import { CheckCircle2, Circle, Target } from 'lucide-react';
import { cn } from '../../lib/utils';

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
  success: '#00897B',
  radius: '0px',
};

export type MilestonePhase =
  | 'goal_defined'
  | 'diagnostic_started'
  | 'diagnostic_complete'
  | 'solution_path'
  | 'next_steps';

export interface MilestoneProgressItem {
  id: MilestonePhase;
  label: string;
  completed: boolean;
}

export interface MilestoneProgressProps {
  milestones: MilestoneProgressItem[];
  currentPhase: MilestonePhase;
  className?: string;
}

const PHASE_LABELS: Record<MilestonePhase, string> = {
  goal_defined: 'Goal Defined',
  diagnostic_started: 'Discovery Started',
  diagnostic_complete: 'Discovery Complete',
  solution_path: 'Solution Path',
  next_steps: 'Next Steps',
};

function getPhaseIndex(phase: MilestonePhase): number {
  const order: MilestonePhase[] = [
    'goal_defined',
    'diagnostic_started',
    'diagnostic_complete',
    'solution_path',
    'next_steps',
  ];
  return order.indexOf(phase);
}

export function MilestoneProgress({
  milestones,
  currentPhase,
  className,
}: MilestoneProgressProps) {
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <div
      className={className}
      style={{
        background: DS.bg,
        border: `1px solid ${DS.border}`,
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <Target size={16} style={{ color: DS.accent }} />
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
          Progress Path
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '0',
            bottom: '0',
            width: '2px',
            background: DS.border,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {milestones.map((milestone, index) => {
            const isCompleted = milestone.completed;
            const isCurrent = milestone.id === currentPhase && !isCompleted;
            const isFuture = !isCompleted && !isCurrent;

            return (
              <div
                key={milestone.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '10px 0',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted
                      ? DS.success
                      : isCurrent
                        ? DS.accent
                        : DS.bgAlt,
                    color: isCompleted || isCurrent ? '#fff' : DS.muted,
                    transition: 'background 0.3s ease, color 0.3s ease',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : isCurrent ? (
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        background: '#fff',
                        animation: 'pulse-ring 1.5s ease-in-out infinite',
                      }}
                    />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>

                <div style={{ flex: 1, paddingTop: '4px' }}>
                  <div
                    style={{
                      fontFamily: DS.bodyFont,
                      fontSize: '14px',
                      fontWeight: isCompleted ? 500 : isCurrent ? 600 : 400,
                      color: isCompleted
                        ? DS.text
                        : isCurrent
                          ? DS.accent
                          : DS.muted,
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {PHASE_LABELS[milestone.id] || milestone.label}
                  </div>
                  {isCurrent && (
                    <div
                      style={{
                        fontFamily: DS.bodyFont,
                        fontSize: '12px',
                        color: DS.accent,
                        marginTop: '2px',
                      }}
                    >
                      In progress...
                    </div>
                  )}
                </div>

                {index < milestones.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '36px',
                      width: '2px',
                      height: '14px',
                      background: isCompleted ? DS.success : DS.border,
                      transition: 'background 0.3s ease',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes pulse-ring { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}