import React from 'react';
import { Link } from 'react-router-dom';
import { V1 } from '@/styles/v1-tokens';

interface PersonaToneProfile {
  warmth: number;
  challenge: number;
  structure: number;
  strategicDepth: number;
  pace: number;
}

interface Persona {
  key: string;
  displayName: string;
  descriptor: string;
  useCase?: string;
  tone?: PersonaToneProfile;
  questioningStyle?: string;
  openingPattern?: string;
  transitionPattern?: string;
  promptModifier?: string;
  minTier?: string;
  isCustom?: boolean;
}

interface Lens {
  code: string;
  descriptor?: string;
  name?: string;
  progress?: number;
}

interface Milestone {
  id?: string | number;
  title: string;
  status?: 'on_track' | 'at_risk' | 'pending' | 'completed' | string;
}

export interface ChatRightRailProps {
  mode?: 'onboarding' | 'regular';
  persona?: Persona;
  activeLens?: Lens;
  recentMilestones?: Milestone[];
  onPersonaChange?: () => void;
}

function MonoEyebrow({ label }: { label: string }) {
  return (
    <div style={{
      fontFamily: V1.monoFont,
      fontSize: V1.textCaption,
      letterSpacing: V1.trackingMono,
      textTransform: 'uppercase',
      color: V1.ink400,
      marginBottom: 12,
      lineHeight: V1.leadingLabel,
      fontWeight: V1.fwMedium,
    }}>
      {label}
    </div>
  );
}

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 28, ...style }}>
      {children}
    </div>
  );
}

function StepCircle({ state }: { state: 'done' | 'current' | 'pending' }) {
  if (state === 'done') {
    return (
      <span style={{
        width: 18,
        height: 18,
        background: V1.teal600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: V1.white,
        fontFamily: V1.bodyFont,
        fontSize: 11,
        fontWeight: V1.fwBold,
        lineHeight: 1,
      }}>
        ✓
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span style={{
        width: 18,
        height: 18,
        border: `2px solid ${V1.teal600}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
      }} />
    );
  }
  return (
    <span style={{
      width: 18,
      height: 18,
      border: `1px solid ${V1.ink300}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxSizing: 'border-box',
    }} />
  );
}

function OnboardingProgress() {
  const steps: { label: string; state: 'done' | 'current' | 'pending' }[] = [
    { label: 'Welcome', state: 'done' },
    { label: 'Background', state: 'done' },
    { label: 'Working style', state: 'current' },
    { label: 'First goal', state: 'pending' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {steps.map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StepCircle state={s.state} />
          <span style={{
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: s.state === 'pending' ? V1.ink500 : V1.ink800,
            fontWeight: s.state === 'current' ? V1.fwMedium : V1.fwRegular,
            lineHeight: V1.leadingBody,
          }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PersonaCard({ persona, onPersonaChange }: { persona?: Persona; onPersonaChange?: () => void }) {
  const name = persona?.displayName || 'The Guide';
  const desc = persona?.descriptor || 'Warm, structured, and strategic — balances support with challenge.';

  return (
    <div style={{
      border: `1px solid ${V1.ink200}`,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: V1.displayFont,
            fontSize: 16,
            color: V1.ink800,
            fontWeight: V1.fwSemibold,
            lineHeight: V1.leadingHeading,
            marginBottom: 6,
          }}>
            {name}
          </div>
          <div style={{
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: V1.ink600,
            lineHeight: V1.leadingBody,
          }}>
            {desc}
          </div>
        </div>
      </div>
      {onPersonaChange && (
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button
            onClick={onPersonaChange}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: V1.bodyFont,
              fontSize: 13,
              color: V1.teal700,
              fontWeight: V1.fwMedium,
              textDecoration: 'none',
              lineHeight: V1.leadingBody,
            }}
          >
            Change →
          </button>
        </div>
      )}
    </div>
  );
}

function ActiveLensBlock({ activeLens }: { activeLens?: Lens }) {
  if (!activeLens) {
    return (
      <div>
        <div style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          color: V1.textDim,
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          lineHeight: V1.leadingLabel,
          marginBottom: 8,
        }}>
          No lens active
        </div>
        <Link
          to="/app/nexus/lenses"
          style={{
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: V1.teal700,
            textDecoration: 'none',
            fontWeight: V1.fwMedium,
            lineHeight: V1.leadingBody,
          }}
        >
          Browse lenses →
        </Link>
      </div>
    );
  }

  const progress = activeLens.progress ?? 45;

  return (
    <div>
      <div style={{
        fontFamily: V1.monoFont,
        fontSize: '0.7rem',
        color: V1.teal600,
        letterSpacing: V1.trackingMono,
        textTransform: 'uppercase',
        lineHeight: V1.leadingLabel,
        fontWeight: V1.fwSemibold,
        marginBottom: 6,
      }}>
        {activeLens.code.toUpperCase()}
      </div>
      <div style={{
        fontFamily: V1.displayFont,
        fontSize: 15,
        color: V1.ink800,
        fontWeight: V1.fwSemibold,
        lineHeight: V1.leadingHeading,
        marginBottom: 10,
      }}>
        {activeLens.name || activeLens.descriptor || activeLens.code}
      </div>
      <div style={{
        width: '100%',
        height: 2,
        background: V1.ink100,
        marginBottom: 10,
      }}>
        <div style={{
          width: `${progress}%`,
          height: 2,
          background: V1.teal600,
        }} />
      </div>
      <Link
        to="/app/nexus"
        style={{
          fontFamily: V1.bodyFont,
          fontSize: 13,
          color: V1.teal700,
          textDecoration: 'none',
          fontWeight: V1.fwMedium,
          lineHeight: V1.leadingBody,
        }}
      >
        Continue →
      </Link>
    </div>
  );
}

function MilestonesList({ milestones }: { milestones?: Milestone[] }) {
  const defaultList: Milestone[] = milestones && milestones.length > 0
    ? milestones
    : [
        { title: 'Q3 leadership transition', status: 'on_track' },
        { title: 'Board impact narrative', status: 'at_risk' },
      ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {defaultList.map((m, i) => {
        const isOnTrack = m.status === 'on_track' || m.status === 'completed';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${V1.ink100}`,
            }}
          >
            <div style={{
              fontFamily: V1.displayFont,
              fontSize: 14,
              color: V1.ink800,
              fontWeight: V1.fwMedium,
              lineHeight: V1.leadingHeading,
              minWidth: 0,
              flex: 1,
            }}>
              {m.title}
            </div>
            <div style={{
              fontFamily: V1.monoFont,
              fontSize: '0.65rem',
              letterSpacing: V1.trackingMono,
              textTransform: 'uppercase',
              color: isOnTrack ? V1.teal700 : V1.fuchsia600,
              fontWeight: V1.fwSemibold,
              lineHeight: V1.leadingLabel,
              flexShrink: 0,
            }}>
              {isOnTrack ? 'On track' : 'At risk'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LearnedFacts() {
  const facts = [
    'You prefer structured check-ins to open-ended discussion.',
    'Key context: APAC regional remit, reports to CFO.',
    'Working style: reflective writing before verbal decisions.',
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {facts.map((f, i) => (
        <div
          key={i}
          style={{
            padding: '10px 0',
            borderTop: i === 0 ? 'none' : `1px solid ${V1.ink100}`,
            fontFamily: V1.bodyFont,
            fontSize: 13,
            color: V1.ink600,
            lineHeight: V1.leadingBody,
          }}
        >
          {f}
        </div>
      ))}
    </div>
  );
}

function PromptBlock() {
  return (
    <div style={{
      border: `1px solid ${V1.teal200}`,
      background: V1.teal50,
      padding: 12,
    }}>
      <div style={{
        fontFamily: V1.monoFont,
        fontSize: '0.65rem',
        letterSpacing: V1.trackingMono,
        textTransform: 'uppercase',
        color: V1.teal700,
        lineHeight: V1.leadingLabel,
        fontWeight: V1.fwSemibold,
        marginBottom: 8,
      }}>
        Talk about this →
      </div>
      <div style={{
        fontFamily: V1.bodyFont,
        fontSize: 13,
        fontStyle: 'italic',
        color: V1.ink700,
        lineHeight: V1.leadingBody,
      }}>
        "I'm concerned about how my Q3 transition will land with the regional team — can we walk through the stakeholder map?"
      </div>
    </div>
  );
}

export function ChatRightRail({
  mode = 'regular',
  persona,
  activeLens,
  recentMilestones,
  onPersonaChange,
}: ChatRightRailProps): React.ReactElement {
  return (
    <aside
      style={{
        width: V1.shellRailW,
        minWidth: V1.shellRailW,
        position: 'sticky',
        top: 0,
        padding: 24,
        borderLeft: `1px solid ${V1.ink200}`,
        alignSelf: 'flex-start',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: V1.white,
      }}
    >
      {mode === 'onboarding' ? (
        <>
          <Section>
            <MonoEyebrow label="Session progress" />
            <OnboardingProgress />
          </Section>
          <Section>
            <MonoEyebrow label="Your thinking style" />
            <PersonaCard persona={persona} onPersonaChange={onPersonaChange} />
          </Section>
          <Section>
            <MonoEyebrow label="What we've learned" />
            <LearnedFacts />
          </Section>
          <Section>
            <MonoEyebrow label="Privacy" />
            <div style={{
              fontFamily: V1.monoFont,
              fontSize: '0.65rem',
              color: V1.ink500,
              lineHeight: V1.leadingLabel,
              letterSpacing: '0.02em',
            }}>
              This conversation is confidential. Summary emails go to you only.
            </div>
          </Section>
        </>
      ) : (
        <>
          <Section>
            <MonoEyebrow label="Your thinking style" />
            <PersonaCard persona={persona} onPersonaChange={onPersonaChange} />
          </Section>
          <Section>
            <MonoEyebrow label="Active lens" />
            <ActiveLensBlock activeLens={activeLens} />
          </Section>
          <Section>
            <MonoEyebrow label="Recent milestones" />
            <MilestonesList milestones={recentMilestones} />
          </Section>
          <Section>
            <PromptBlock />
          </Section>
        </>
      )}
    </aside>
  );
}

export default ChatRightRail;
