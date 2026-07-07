import React from 'react';
import { Target, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

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

export interface Milestone {
  id: string;
  label: string;
  complete: boolean;
  description?: string;
}

interface MilestoneBannerProps {
  milestones: Milestone[];
  currentGoal?: string;
  className?: string;
}

export function MilestoneBanner({ milestones, currentGoal, className }: MilestoneBannerProps) {
  const completedCount = milestones.filter(m => m.complete).length;
  const totalCount = milestones.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={className} style={{
      background: DS.bgAlt,
      border: `1px solid ${DS.border}`,
      padding: '16px 20px',
      marginBottom: '12px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target style={{ width: 16, height: 16, color: DS.accent }} />
          <span style={{
            fontFamily: DS.bodyFont,
            fontSize: '12px',
            fontWeight: 600,
            color: DS.accent,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Session Goal
          </span>
        </div>
        <span style={{
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          color: completedCount === totalCount ? DS.success : DS.muted,
          fontWeight: completedCount === totalCount ? 600 : 400,
        }}>
          {completedCount}/{totalCount} milestones
        </span>
      </div>

      {/* Current Goal */}
      {currentGoal && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 14px',
          background: `${DS.accent}08`,
          borderLeft: `3px solid ${DS.accent}`,
        }}>
          <p style={{
            fontFamily: DS.bodyFont,
            fontSize: '14px',
            color: DS.text,
            margin: 0,
            fontWeight: 500,
          }}>
            {currentGoal}
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div style={{
        position: 'relative',
        height: '4px',
        background: DS.border,
        marginBottom: '12px',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${progress}%`,
          background: completedCount === totalCount ? DS.success : DS.accent,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>

      {/* Milestone checklist */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {milestones.map((milestone, index) => (
          <div key={milestone.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 10px',
            opacity: milestone.complete ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
          }}>
            {milestone.complete ? (
              <CheckCircle2 style={{ width: 16, height: 16, color: DS.success, flexShrink: 0 }} />
            ) : (
              <Circle style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
            )}
            <span style={{
              fontFamily: DS.bodyFont,
              fontSize: '13px',
              color: milestone.complete ? DS.textSecondary : DS.muted,
              textDecoration: milestone.complete ? 'line-through' : 'none',
            }}>
              {milestone.label}
            </span>
            {index < milestones.length - 1 && !milestone.complete && (
              <ArrowRight style={{ width: 12, height: 12, color: DS.muted, marginLeft: 'auto', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Completion message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: `${DS.success}10`,
          borderLeft: `3px solid ${DS.success}`,
        }}>
          <p style={{
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            color: DS.text,
            margin: 0,
          }}>
            Session goal achieved. You now have a clear path forward.
          </p>
        </div>
      )}
    </div>
  );
}

// Default milestones for a coaching session
export const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'goal_defined', label: 'Goal defined', complete: false, description: 'User articulates their objective' },
  { id: 'diagnostic_started', label: 'Diagnostic started', complete: false, description: 'Begin 5-dimension assessment' },
  { id: 'diagnostic_complete', label: 'Diagnostic complete', complete: false, description: 'All 5 dimensions understood' },
  { id: 'solution_path', label: 'Solution path mapped', complete: false, description: 'Actionable path proposed' },
  { id: 'next_steps', label: 'Next steps defined', complete: false, description: 'Concrete actions identified' },
];

// Parse milestones from AI response
export function parseMilestones(response: string): Milestone[] {
  const milestones = DEFAULT_MILESTONES.map(m => ({ ...m }));

  if (response.includes('[MILESTONE:GOAL_DEFINED]')) {
    milestones.find(m => m.id === 'goal_defined')!.complete = true;
  }
  if (response.includes('[MILESTONE:DIAGNOSTIC_STARTED]')) {
    milestones.find(m => m.id === 'diagnostic_started')!.complete = true;
  }
  if (response.includes('[MILESTONE:DIAGNOSTIC_COMPLETE]')) {
    milestones.find(m => m.id === 'diagnostic_complete')!.complete = true;
  }
  if (response.includes('[MILESTONE:SOLUTION_PATH]')) {
    milestones.find(m => m.id === 'solution_path')!.complete = true;
  }
  if (response.includes('[MILESTONE:NEXT_STEPS]')) {
    milestones.find(m => m.id === 'next_steps')!.complete = true;
  }

  return milestones;
}