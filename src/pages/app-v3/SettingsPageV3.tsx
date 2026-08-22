import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { normalizeTier, tierDisplayName } from '@/config/tierConfig';
import { V3 } from '@/styles/v3-tokens';
import {
  Badge,
  Button,
  EmptyState,
  FormRow,
  Input,
  MonoLabel,
  PageHeader,
  Skeleton,
  Tabs,
  Toggle,
} from '@/components/app-v3/ui';

const USER_MASK_SVG = (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="20" cy="14" r="6" />
    <path d="M6 34c0-7.732 6.268-14 14-14s14 6.268 14 14" />
    <path d="M14 18c-2-1-3-3-3-6" />
    <path d="M26 18c2-1 3-3 3-6" />
    <path d="M10 26c2-1.5 5-2.5 10-2.5s8 1 10 2.5" />
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

const TAB_KEYS = ['profile', 'privacy', 'plan', 'notifications', 'personas'] as const;
type TabKey = typeof TAB_KEYS[number];

function isValidTabKey(k: string | null): k is TabKey {
  return k != null && (TAB_KEYS as readonly string[]).includes(k);
}

export function SettingsPageV3(): React.ReactElement {
  const { profile, updateProfile, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');
  const initialTab: TabKey = isValidTabKey(sectionParam) ? sectionParam : 'profile';
  const [active, setActive] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (isValidTabKey(sectionParam)) {
      setActive(sectionParam);
    }
  }, [sectionParam]);

  const [name, setName] = useState('');
  const [icp, setIcp] = useState('');
  const [initialName, setInitialName] = useState('');
  const [initialIcp, setInitialIcp] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const [hideFromConsultants, setHideFromConsultants] = useState(false);
  const [allowAnonymousBenchmarks, setAllowAnonymousBenchmarks] = useState(true);
  const [notifProduct, setNotifProduct] = useState(true);
  const [notifMilestone, setNotifMilestone] = useState(true);
  const [notifCoaching, setNotifCoaching] = useState(true);
  const [notifNudge, setNotifNudge] = useState(false);
  const [savedSetting, setSavedSetting] = useState(false);

  useEffect(() => {
    if (profile) {
      const n = profile.name ?? '';
      const i = profile.icp ?? '';
      setName(n);
      setIcp(i);
      setInitialName(n);
      setInitialIcp(i);
      const profAny = profile as any;
      if (typeof profAny.hide_profile_from_consultants === 'boolean') {
        setHideFromConsultants(profAny.hide_profile_from_consultants);
      }
      if (typeof profAny.allow_anonymous_benchmarks === 'boolean') {
        setAllowAnonymousBenchmarks(profAny.allow_anonymous_benchmarks);
      }
      if (typeof profAny.notif_product_updates === 'boolean') {
        setNotifProduct(profAny.notif_product_updates);
      }
      if (typeof profAny.notif_milestone_reminders === 'boolean') {
        setNotifMilestone(profAny.notif_milestone_reminders);
      }
      if (typeof profAny.notif_coaching_followups === 'boolean') {
        setNotifCoaching(profAny.notif_coaching_followups);
      }
      if (typeof profAny.notif_nudges === 'boolean') {
        setNotifNudge(profAny.notif_nudges);
      }
    }
  }, [profile?.id]);

  const dirty = name !== initialName || icp !== initialIcp;
  const loaded = !isLoading && profile != null;

  const tier = normalizeTier(profile?.tier) ?? profile?.tier ?? null;
  const milesBalance = (profile as any)?.miles_balance as number | undefined ?? 0;
  const tierLabel = tierDisplayName(tier);

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

  // Corrective batch v2.4 #1393: instant save handler for ALL settings toggles.
  // Columns match 20260821_profile_settings migration. All 6 toggles (privacy +
  // notifications) persist to profiles immediately.
  const handleToggleSetting = async (
    column: string,
    setter: (v: boolean) => void,
    next: boolean,
  ) => {
    setter(next);
    try {
      const r = await updateProfile({ [column]: next } as any);
      if (r?.success) {
        setSavedSetting(true);
        window.setTimeout(() => setSavedSetting(false), 1600);
      }
    } catch (_e) {
      // Optimistic — UI state already updated.
    }
  };

  return (
    <>
      <PageHeader
        kicker="SETTINGS"
        title="Your workspace."
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge variant={tierBadgeVariant(tier)}>{tierLabel}</Badge>
            <Badge variant="count-active">{milesBalance.toLocaleString()} miles</Badge>
          </div>
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
            { key: 'profile', label: 'Profile' },
            { key: 'privacy', label: 'Privacy' },
            { key: 'plan', label: 'Plan' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'personas', label: 'Personas' },
          ]}
          active={active}
          onChange={(key) => setActive(key as TabKey)}
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
          </div>
        ) : (
          <>
            {active === 'profile' && (
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
                  <FormRow label="ICP / Entry path" helper="Industry / career entry archetype.">
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
              </div>
            )}

            {active === 'privacy' && (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div
                  style={{
                    borderTop: `1px solid ${V3.ink100}`,
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Hide my profile from LYC consultants"
                    helper="Prevents your profile from appearing in consultant-side search results while you're exploring."
                  >
                    <Toggle
                      checked={hideFromConsultants}
                      onChange={(next) =>
                        handleToggleSetting(
                          'hide_profile_from_consultants',
                          setHideFromConsultants,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Allow anonymous benchmarks"
                    helper="Your results contribute to cohort-level percentiles, never tied to your name."
                  >
                    <Toggle
                      checked={allowAnonymousBenchmarks}
                      onChange={(next) =>
                        handleToggleSetting(
                          'allow_anonymous_benchmarks',
                          setAllowAnonymousBenchmarks,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
              </div>
            )}

            {active === 'plan' && (
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    border: `1px solid ${V3.ink200}`,
                    padding: 32,
                    background: V3.white,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge variant={tierBadgeVariant(tier)}>{tierLabel}</Badge>
                        <span
                          style={{
                            fontFamily: V3.displayFont,
                            fontSize: '18px',
                            fontWeight: V3.fwMedium,
                            color: V3.ink800,
                            lineHeight: 1,
                          }}
                        >
                          {tierLabel} tier
                        </span>
                      </div>
                      <p
                        style={{
                          marginTop: 16,
                          fontFamily: V3.bodyFont,
                          fontSize: '14px',
                          color: V3.ink500,
                          lineHeight: 1.6,
                          maxWidth: 440,
                          marginBottom: 0,
                        }}
                      >
                        Your current subscription tier. Upgrade to unlock deeper assessments, priority NEXUS responses, and premium advisory access.
                      </p>
                      <div style={{ marginTop: 16 }}>
                        <MonoLabel size="sm" color={V3.ink400}>
                          MEMBER SINCE · {formatMemberSince(profile?.created_at)}
                        </MonoLabel>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <Button variant="secondary" to="/membership">Manage billing</Button>
                        <Button variant="ghost" to="/app/v3/settings?section=billing">See billing history</Button>
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 8,
                        }}
                      >
                        <MonoLabel size="sm" color={V3.ink400}>MILES</MonoLabel>
                        <span
                          style={{
                            fontFamily: V3.displayFont,
                            fontSize: '20px',
                            fontWeight: V3.fwSemibold,
                            color: V3.ocean600,
                            lineHeight: 1,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {milesBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === 'notifications' && (
              <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div
                  style={{
                    borderTop: `1px solid ${V3.ink100}`,
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Product updates"
                    helper="Monthly, tied to new lenses, features, and tier changes."
                  >
                    <Toggle
                      checked={notifProduct}
                      onChange={(next) =>
                        handleToggleSetting(
                          'notif_product_updates',
                          setNotifProduct,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Milestone reminders"
                    helper="Weekly cadence for active milestone check-ins."
                  >
                    <Toggle
                      checked={notifMilestone}
                      onChange={(next) =>
                        handleToggleSetting(
                          'notif_milestone_reminders',
                          setNotifMilestone,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Coaching follow-ups"
                    helper="Post-debrief reflections from your LYC consultant."
                  >
                    <Toggle
                      checked={notifCoaching}
                      onChange={(next) =>
                        handleToggleSetting(
                          'notif_coaching_followups',
                          setNotifCoaching,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
                <div
                  style={{
                    borderBottom: `1px solid ${V3.ink100}`,
                    padding: '20px 0',
                  }}
                >
                  <FormRow
                    label="Nudge notifications"
                    helper="Short, spaced prompts tied to your latest lens score."
                  >
                    <Toggle
                      checked={notifNudge}
                      onChange={(next) =>
                        handleToggleSetting(
                          'notif_nudges',
                          setNotifNudge,
                          next,
                        )
                      }
                    />
                  </FormRow>
                </div>
              </div>
            )}

            {active === 'personas' && (
              <EmptyState
                iconSvg={USER_MASK_SVG}
                title="Personas coming soon."
                description="Custom NEXUS personas — Career, Negotiations, Board, Relationships."
              />
            )}
          </>
        )}
      </div>

      {dirty && active === 'profile' && (
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
      {savedSetting && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            background: V3.ink900,
            color: V3.cream,
            padding: '8px 14px',
            fontFamily: V3.monoFont,
            fontSize: '0.68rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Saved
        </div>
      )}
    </>
  );
}

export default SettingsPageV3;
