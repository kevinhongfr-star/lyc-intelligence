import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier, tierDisplayName } from '@/config/tierConfig';
import { V3 } from '@/styles/v3-tokens';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  FormRow,
  Input,
  MonoLabel,
  PageHeader,
  Skeleton,
  Tabs,
} from '@/components/app-v3/ui';

const GOAL_FLAG_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 36V6" />
    <path d="M8 8l22-4v18L8 22" />
    <circle cx="22" cy="12" r="2" fill="currentColor" />
  </svg>
);

const DOC_STACK_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="10" width="24" height="22" />
    <path d="M10 10V6h20v4" />
    <path d="M12 18h12M12 24h12M12 30h8" />
  </svg>
);

function formatMemberSince(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function tierBadgeVariant(tier: string | null | undefined): any {
  const canonical = normalizeTier(tier) ?? tier;
  if (!canonical) return 'status-draft';
  const key = String(canonical).toLowerCase();
  if (key === 'council' || key === 'enterprise') return 'tier-council';
  if (key === 'executive') return 'tier-executive';
  if (key === 'professional' || key === 'pro' || key === 'starter') return 'tier-pro';
  return 'status-draft';
}

export function ProfilePageV3(): React.ReactElement {
  const { profile, updateProfile, isLoading } = useAuthStore();
  const [active, setActive] = useState('identity');

  const [name, setName] = useState('');
  const [icp, setIcp] = useState('');
  const [initialName, setInitialName] = useState('');
  const [initialIcp, setInitialIcp] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      const n = profile.name ?? '';
      const i = profile.icp ?? '';
      setName(n);
      setIcp(i);
      setInitialName(n);
      setInitialIcp(i);
    }
  }, [profile?.id, profile?.name, profile?.icp]);

  const dirty = name !== initialName || icp !== initialIcp;
  const loaded = !isLoading && profile != null;

  const tier = normalizeTier(profile?.tier) ?? profile?.tier ?? null;

  const handleReset = () => {
    setName(initialName);
    setIcp(initialIcp);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateProfile({ name, icp });
      if (result?.success) {
        setInitialName(name);
        setInitialIcp(icp);
        setShowSaved(true);
        window.setTimeout(() => setShowSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        kicker="PROFILE"
        title="Your identity in NEXUS."
        right={
          <Avatar size="lg" name={profile?.name} style={{ marginTop: 0 }} />
        }
      />

      <div
        style={{
          display: 'block',
          maxWidth: V3.appContentMax,
          margin: '0 auto',
          marginTop: 48,
          borderBottom: `1px solid ${V3.ink200}`,
        }}
      >
        <Tabs
          tabs={[
            { key: 'identity', label: 'Identity' },
            { key: 'goals', label: 'Goals' },
            { key: 'assessments', label: 'Assessments' },
          ]}
          active={active}
          onChange={(key) => setActive(key)}
        />
      </div>

      <div style={{ maxWidth: V3.appContentMax, margin: '0 auto', paddingBottom: dirty ? 100 : 64, position: 'relative' }}>
        {!loaded ? (
          <div aria-busy style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Skeleton width={180} height={14} />
            <Skeleton width="40%" height={10} style={{ marginTop: -8 }} />
            <div style={{ height: 36, borderTop: `1px solid ${V3.ink100}`, marginTop: 8 }} />
            <Skeleton width={180} height={14} />
            <Skeleton width="40%" height={10} style={{ marginTop: -8 }} />
            <div style={{ height: 36, borderTop: `1px solid ${V3.ink100}`, marginTop: 8 }} />
            <Skeleton width={180} height={14} />
            <Skeleton width="40%" height={10} style={{ marginTop: -8 }} />
          </div>
        ) : (
          <>
            {active === 'identity' && (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div
                  style={{
                    borderTop: `1px solid ${V3.ink100}`,
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="Display name" helper="Shown across NEXUS conversations and readouts.">
                    <div style={{ width: 320 }}>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="Email" helper="Sign-in email. Contact support to change.">
                    <div style={{ width: 320 }}>
                      <Input
                        disabled
                        defaultValue={profile?.email ?? ''}
                      />
                    </div>
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="ICP / Entry path" helper="Industry / career entry archetype. Helps NEXUS calibrate context.">
                    <div style={{ width: 320 }}>
                      <Input
                        value={icp}
                        onChange={(e) => setIcp(e.target.value)}
                      />
                    </div>
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="Role" helper="Assigned role within NEXUS.">
                    <div style={{ width: 320 }}>
                      <Input
                        disabled
                        defaultValue={profile?.role ?? ''}
                      />
                    </div>
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="Subscription tier" helper="Your current plan tier.">
                    <Badge variant={tierBadgeVariant(tier)}>{tierDisplayName(tier)}</Badge>
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow label="Member since" helper="Date your account was created.">
                    <span
                      style={{
                        fontFamily: V3.displayFont,
                        fontSize: '15px',
                        fontWeight: V3.fwRegular,
                        color: V3.ink800,
                        lineHeight: 1,
                        display: 'inline-block',
                        paddingTop: 8,
                      }}
                    >
                      {formatMemberSince(profile?.created_at)}
                    </span>
                  </FormRow>
                </div>
              </div>
            )}

            {active === 'goals' && (
              <EmptyState
                iconSvg={GOAL_FLAG_SVG}
                title="Goals coming soon."
                description="Short-form goal capture — tied to milestones, surfaced to NEXUS in context."
              />
            )}

            {active === 'assessments' && (
              <EmptyState
                iconSvg={DOC_STACK_SVG}
                title="Assessment identity."
                description="Cross-batch consistency and lens archetype identity coming here."
              />
            )}
          </>
        )}
      </div>

      {dirty && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 2,
            width: '100%',
            background: V3.cream,
            borderTop: `1px solid ${V3.ink200}`,
            paddingTop: 16,
            paddingBottom: 16,
            paddingLeft: 24,
            paddingRight: 24,
          }}
        >
          <div
            style={{
              maxWidth: V3.appContentMax,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              left: 0,
              right: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: V3.bodyFont,
                  fontSize: '14px',
                  color: V3.ink400,
                  lineHeight: 1,
                }}
              >
                Unsaved changes
              </span>
              {showSaved && (
                <MonoLabel size="sm" color={V3.teal600}>SAVED.</MonoLabel>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="ghost" onClick={handleReset} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfilePageV3;
