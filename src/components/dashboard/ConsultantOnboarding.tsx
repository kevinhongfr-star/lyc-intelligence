import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Briefcase, Compass, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type StepId = 'profile' | 'mandate' | 'tour';

interface StepDef {
  id: StepId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    id: 'profile',
    label: 'Profile Setup',
    description: 'Tell us a bit about yourself so we can personalize your workspace.',
    icon: <UserCheck className="w-4 h-4" />,
  },
  {
    id: 'mandate',
    label: 'Mandate Assignment',
    description: 'Pick the mandate you will be working on to get started.',
    icon: <Briefcase className="w-4 h-4" />,
  },
  {
    id: 'tour',
    label: 'Tool Tour',
    description: 'A quick orientation to the tools you will use day to day.',
    icon: <Compass className="w-4 h-4" />,
  },
];

const SAMPLE_MANDATES = [
  { id: 'm-001', title: 'Senior Backend Engineer — FinTech', client: 'Northwind Capital' },
  { id: 'm-002', title: 'Head of Product — SaaS', client: 'Lumen Labs' },
  { id: 'm-003', title: 'VP Sales — APAC Expansion', client: 'Orbital Group' },
];

const TOUR_HIGHLIGHTS = [
  { title: 'Pipeline', description: 'Track candidates across every stage of the search.' },
  { title: 'Mandates', description: 'Manage deliverables, milestones and client context.' },
  { title: 'Intelligence', description: 'Surface signals and benchmarks to act faster.' },
];

export const ConsultantOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuthStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Profile step
  const [fullName, setFullName] = useState(profile?.name ?? '');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');

  // Mandate step
  const [selectedMandate, setSelectedMandate] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const progressPct = ((stepIndex + 1) / STEPS.length) * 100;

  const complete = async () => {
    // Mark onboarding as complete so the dashboard renders instead of this flow.
    await updateProfile({ onboarding_completed: true });
    navigate('/app/dashboard');
  };

  const handleNext = async () => {
    if (currentStep.id === 'profile' && fullName) {
      setSaving(true);
      await updateProfile({ name: fullName });
      setSaving(false);
    }

    if (!isLastStep) {
      setStepIndex((i) => i + 1);
    } else {
      complete();
    }
  };

  const handleSkip = () => {
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
    } else {
      complete();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: COLORS.bg,
        padding: `${SPACING[10]}px ${SPACING[4]}px`,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: SPACING[8] }}>
          <Heading level={2}>
            Welcome{profile?.name ? `, ${profile.name}` : ''} 👋
          </Heading>
          <Paragraph color="textSecondary">
            Let's get your consultant workspace ready in a few quick steps.
          </Paragraph>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: SPACING[8] }}>
          <Flex justify="between" align="center" gap="2">
            {STEPS.map((s, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <Flex key={s.id} align="center" gap="2">
                  <div
                    style={{
                      width: SPACING[8],
                      height: SPACING[8],
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDone
                        ? COLORS.success
                        : isActive
                        ? COLORS.primary
                        : COLORS.bgAlt,
                      color: isDone || isActive ? COLORS.white : COLORS.textMuted,
                      border: `1px solid ${
                        isDone || isActive ? 'transparent' : COLORS.border
                      }`,
                    }}
                  >
                    {isDone ? <Check className="w-4 h-4" /> : s.icon}
                  </div>
                  <span
                    style={{
                      fontSize: SPACING[3],
                      fontWeight: 600,
                      color: isActive ? COLORS.text : COLORS.textMuted,
                    }}
                  >
                    {s.label}
                  </span>
                </Flex>
              );
            })}
          </Flex>
          <div
            style={{
              marginTop: SPACING[4],
              height: SPACING[1],
              backgroundColor: COLORS.borderLight,
              borderRadius: 9999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                backgroundColor: COLORS.primary,
                transition: 'width 300ms ease-out',
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <Card padding="8">
          <Grid columns={1} gap="4">
            <Flex justify="between" align="center">
              <Heading level={4}>{currentStep.label}</Heading>
              <Badge variant="info">
                Step {stepIndex + 1} of {STEPS.length}
              </Badge>
            </Flex>
            <Paragraph color="textSecondary">{currentStep.description}</Paragraph>

            {currentStep.id === 'profile' && (
              <Grid columns={1} gap="4">
                <label style={labelStyle}>
                  Full name
                  <input
                    style={inputStyle}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </label>
                <label style={labelStyle}>
                  Title / role
                  <input
                    style={inputStyle}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Recruiter"
                  />
                </label>
                <label style={labelStyle}>
                  Short bio
                  <textarea
                    style={{ ...inputStyle, minHeight: 80 }}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A line or two about your focus"
                  />
                </label>
              </Grid>
            )}

            {currentStep.id === 'mandate' && (
              <Grid columns={1} gap="3">
                {SAMPLE_MANDATES.map((m) => {
                  const selected = selectedMandate === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMandate(m.id)}
                      style={{
                        textAlign: 'left',
                        padding: SPACING[4],
                        borderRadius: 8,
                        border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                        backgroundColor: selected ? COLORS.primaryLight : COLORS.bgAlt,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: COLORS.text }}>{m.title}</div>
                      <div style={{ fontSize: SPACING[3], color: COLORS.textSecondary }}>
                        {m.client}
                      </div>
                    </button>
                  );
                })}
              </Grid>
            )}

            {currentStep.id === 'tour' && (
              <Grid columns={1} gap="3">
                {TOUR_HIGHLIGHTS.map((item) => (
                  <Flex key={item.title} align="start" gap="3">
                    <div style={dotStyle}>
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: COLORS.text }}>{item.title}</div>
                      <div style={{ fontSize: SPACING[3], color: COLORS.textSecondary }}>
                        {item.description}
                      </div>
                    </div>
                  </Flex>
                ))}
              </Grid>
            )}

            {/* Actions */}
            <Flex justify="between" align="center" gap="4">
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext} disabled={saving}>
                {saving ? 'Saving…' : isLastStep ? 'Finish' : 'Next'}
              </Button>
            </Flex>
          </Grid>
        </Card>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: SPACING[1],
  fontSize: SPACING[3],
  fontWeight: 600,
  color: COLORS.textSecondary,
};

const inputStyle: React.CSSProperties = {
  padding: `${SPACING[3]}px ${SPACING[4]}px`,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  fontSize: SPACING[4],
  color: COLORS.text,
  backgroundColor: COLORS.white,
  width: '100%',
  fontFamily: 'inherit',
};

const dotStyle: React.CSSProperties = {
  width: SPACING[8],
  height: SPACING[8],
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.primaryLight,
  color: COLORS.primary,
  flexShrink: 0,
};
