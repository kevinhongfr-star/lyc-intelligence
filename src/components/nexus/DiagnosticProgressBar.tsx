import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

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
  // LYC Brand: Zero border-radius
  radius: '0px',
};

export interface DiagnosticDimension {
  id: string;
  label: string;
  complete: boolean;
}

interface DiagnosticProgressBarProps {
  dimensions: DiagnosticDimension[];
  progress: number; // 0-5
  className?: string;
}

export function DiagnosticProgressBar({ dimensions, progress, className }: DiagnosticProgressBarProps) {
  const percentage = (progress / 5) * 100;
  
  return (
    <div className={className} style={{
      background: DS.bgAlt,
      border: `1px solid ${DS.border}`,
      padding: '16px 20px',
      marginBottom: '12px',
    }}>
      {/* Progress header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <span style={{
          fontFamily: DS.bodyFont,
          fontSize: '12px',
          fontWeight: 600,
          color: DS.accent,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          Diagnostic Progress
        </span>
        <span style={{
          fontFamily: DS.bodyFont,
          fontSize: '13px',
          color: progress === 5 ? DS.accent : DS.muted,
          fontWeight: progress === 5 ? 600 : 400,
        }}>
          {progress}/5 dimensions
        </span>
      </div>
      
      {/* Progress bar */}
      <div style={{
        position: 'relative',
        height: '6px',
        background: DS.border,
        marginBottom: '16px',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${percentage}%`,
          background: progress === 5 ? DS.accent : `linear-gradient(90deg, ${DS.accent} 0%, ${DS.accentHover} 100%)`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      
      {/* Dimension checklist */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {dimensions.map(dim => (
          <div key={dim.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: dim.complete ? `${DS.accent}08` : 'transparent',
            transition: 'background 0.2s ease',
          }}>
            {dim.complete ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: DS.accent }} />
            ) : (
              <Circle style={{ width: 18, height: 18, color: DS.muted, opacity: 0.4 }} />
            )}
            <span style={{
              fontFamily: DS.bodyFont,
              fontSize: '14px',
              color: dim.complete ? DS.text : DS.muted,
              fontWeight: dim.complete ? 500 : 400,
            }}>
              {dim.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Completion message */}
      {progress === 5 && (
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: `${DS.accent}15`,
          borderLeft: `3px solid ${DS.accent}`,
        }}>
          <p style={{
            fontFamily: DS.bodyFont,
            fontSize: '13px',
            color: DS.text,
            margin: 0,
          }}>
            Diagnostic complete. I now have a clear picture of your situation.
          </p>
        </div>
      )}
    </div>
  );
}

// Default dimensions for Nexus diagnostic
export const DEFAULT_DIAGNOSTIC_DIMENSIONS: DiagnosticDimension[] = [
  { id: 'role', label: 'Role — Mandate, scope, authority', complete: false },
  { id: 'situation', label: 'Situation — Context, market position', complete: false },
  { id: 'constraint', label: 'Constraint — Budget, timeline, politics', complete: false },
  { id: 'emotion', label: 'Emotion — Motivation, risk tolerance', complete: false },
  { id: 'success', label: 'Success — KPIs, outcomes definition', complete: false },
];

// Parse diagnostic status from AI response
export function parseDiagnosticProgress(response: string): {
  progress: number;
  dimensions: DiagnosticDimension[];
} {
  const dimensions = DEFAULT_DIAGNOSTIC_DIMENSIONS.map(d => ({ ...d, complete: false }));
  let progress = 0;
  
  // Check for complete diagnostic
  if (response.includes('[DIAGNOSTIC:COMPLETE]')) {
    dimensions.forEach(d => d.complete = true);
    progress = 5;
    return { progress, dimensions };
  }
  
  // Check for partial diagnostic
  const partialMatch = response.match(/\[DIAGNOSTIC:PARTIAL:(\d)\/5\]/);
  if (partialMatch) {
    progress = parseInt(partialMatch[1]);
    // Mark dimensions as complete based on order (simplified)
    for (let i = 0; i < progress; i++) {
      dimensions[i].complete = true;
    }
    return { progress, dimensions };
  }
  
  // Check for specific dimension needed
  const neededMatch = response.match(/\[DIAGNOSTIC:NEEDED:([a-z_]+)\]/);
  if (neededMatch) {
    const neededId = neededMatch[1];
    // Mark previous dimensions as complete
    const neededIndex = dimensions.findIndex(d => d.id === neededId);
    if (neededIndex > 0) {
      for (let i = 0; i < neededIndex; i++) {
        dimensions[i].complete = true;
        progress++;
      }
    }
    return { progress, dimensions };
  }
  
  // Check for milestone diagnostic started
  if (response.includes('[MILESTONE:DIAGNOSTIC_STARTED]')) {
    // Diagnostic started but no specific progress yet
    return { progress: 0, dimensions };
  }
  
  return { progress: 0, dimensions };
}