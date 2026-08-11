/**
 * #1325: TeamInvitesPage.tsx — /portal/team
 *
 * Team & Invites surface for LYC consultants:
 *   - Tier card (Starter/Pro/Executive/Council) + seat/invite quotas
 *   - Stats row: issued this month / remaining / claimed / total
 *   - "New invite" CTA → opens the InviteClientModal
 *   - Sent invites table: role, email, org, status, expires, action (copy link)
 *   - Premium banner comparison (upgrade prompts)
 *
 * Brand rules: zero radius, accent #C108AB, font trio, "Starter Seat" entry label
 * (never "free").
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus, Copy, Check, Mail, Building2, Shield, Clock,
  Users, Crown, ChevronRight, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';
import {
  listSentInvites,
  getInviteStats,
  buildInviteLink,
  CONSULTANT_TIER_META,
  CONSULTANT_TIER_ORDER,
  type InviteRecord,
  type InviteStats,
  type ConsultantTierKey,
} from '@/services/consultantInviteService';
import {
  InviteClientModal,
  ConsultantPremiumBanner,
} from '@/components/portals/InviteClientModal';

const DS = {
  headingFont: "'Libre Baskerville', Georgia, serif",
  bodyFont: "'DM Sans', system-ui, sans-serif",
  monoFont: "'IBM Plex Mono', ui-monospace, monospace",
  accent: '#C108AB',
  border: '#E5E5E5',
  ink: '#0A0A12',
  muted: '#616170',
  off: '#FAFAF8',
  radius: '0px',
};

const ROLE_LABEL: Record<string, { label: string; color: string }> = {
  client_viewer: { label: 'Client Viewer', color: '#0369A1' },
  client_admin: { label: 'Client Admin', color: '#7C3AED' },
  lyc_consultant: { label: 'Peer Consultant', color: '#C2410C' },
};

function normalizeTier(t: string | null | undefined): ConsultantTierKey {
  if (!t) return 'starter_seat';
  const x = String(t).toLowerCase();
  if (x.includes('council')) return 'council_seat';
  if (x.includes('executive')) return 'executive_seat';
  if (x.includes('pro')) return 'pro_seat';
  return 'starter_seat';
}

export function TeamInvitesPage(): React.ReactElement {
  const { user, profile } = useAuthStore();
  const tier = normalizeTier((profile as any)?.consultant_tier || (profile as any)?.tier);
  const tierMeta = CONSULTANT_TIER_META[tier];

  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeTier, setUpgradeTier] = useState<ConsultantTierKey>('pro_seat');

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      listSentInvites(user.id),
      getInviteStats(user.id, tier),
    ]).then(([list, s]) => {
      setInvites(list);
      setStats(s);
      setLoading(false);
    });
  }, [user?.id, tier]);

  const refresh = async () => {
    if (!user?.id) return;
    const [list, s] = await Promise.all([
      listSentInvites(user.id),
      getInviteStats(user.id, tier),
    ]);
    setInvites(list);
    setStats(s);
  };

  const nextTier = useMemo<ConsultantTierKey>(() => {
    const idx = CONSULTANT_TIER_ORDER.indexOf(tier);
    return CONSULTANT_TIER_ORDER[Math.min(idx + 1, CONSULTANT_TIER_ORDER.length - 1)];
  }, [tier]);
  const isTop = nextTier === tier;

  const copyLink = async (code: string) => {
    const link = buildInviteLink(code);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
    toast({
      title: 'Invite link copied',
      description: 'Ready to paste into an email or Slack.',
      tone: 'success',
    } as any);
  };

  return (
    <div style={{ fontFamily: DS.bodyFont, color: DS.ink, paddingBottom: 32 }}>
      {/* Hero banner — premium promo */}
      <ConsultantPremiumBanner
        currentTier={tier}
        variant="hero"
        onUpgrade={(t) => { setUpgradeTier(t); window.location.assign('/pricing'); }}
      />

      {/* Header + CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: DS.monoFont, fontSize: 10.5,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: DS.accent, fontWeight: 600, marginBottom: 6,
            }}
          >
            Account · Team & Invites
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: DS.headingFont,
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.15,
              color: DS.ink,
            }}
          >
            Clients, collaborators, and invite capacity.
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: DS.muted, maxWidth: 560, lineHeight: 1.55 }}>
            Invite client stakeholders to shared mandate views, or add peer consultants
            to your practice workspace. Invites expire after 30 days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px',
            background: DS.accent, color: '#FFF', border: 'none', cursor: 'pointer',
            fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            borderRadius: DS.radius,
          }}
        >
          <UserPlus style={{ width: 14, height: 14 }} /> New Invite
        </button>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
        className="grid-cols-2 md:grid-cols-4"
      >
        <StatCard
          icon={Users}
          label={`${tierMeta.label} invites · this month`}
          value={stats ? `${stats.thisMonth} / ${tierMeta.inviteQuota}` : '—'}
          accent={tierMeta.accent}
          hint={stats ? `${stats.remainingQuota} remaining` : undefined}
        />
        <StatCard
          icon={Mail}
          label="Total issued"
          value={stats?.totalIssued ?? '—'}
          accent="#0369A1"
        />
        <StatCard
          icon={Check}
          label="Claimed & active"
          value={stats?.claimed ?? '—'}
          accent="#047857"
          hint={stats && stats.totalIssued
            ? `${Math.round((stats.claimed / Math.max(1, stats.totalIssued)) * 100)}% uptake`
            : undefined}
        />
        <StatCard
          icon={Shield}
          label="Client seat usage"
          value={stats ? `${Math.min(tierMeta.clientSeatLimit, stats.claimed)} / ${tierMeta.clientSeatLimit < 999 ? tierMeta.clientSeatLimit : '∞'}` : '—'}
          accent="#7C3AED"
        />
      </div>

      {/* Invites table */}
      <div
        style={{
          background: '#FFF',
          border: `1px solid ${DS.border}`,
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${DS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: DS.headingFont, fontSize: 15, fontWeight: 700,
                color: DS.ink,
              }}
            >
              Sent invites
            </div>
            <div style={{ fontSize: 12, color: DS.muted, marginTop: 2 }}>
              {invites.length === 0 ? 'No invites yet — send your first above.' : `${invites.length} invite${invites.length === 1 ? '' : 's'} issued.`}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: DS.off }}>
                {['Recipient', 'Role', 'Organization', 'Status', 'Expires', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 18px',
                      fontFamily: DS.monoFont,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: DS.muted,
                      fontWeight: 600,
                      borderBottom: `1px solid ${DS.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 18px',
                      textAlign: 'center',
                      color: DS.muted,
                      fontSize: 13,
                    }}
                  >
                    {loading ? 'Loading…' : 'Send your first invite to add a client or peer to the workspace.'}
                  </td>
                </tr>
              )}
              {invites.map((inv) => {
                const rl = ROLE_LABEL[inv.target_role] || { label: inv.target_role, color: DS.muted };
                const isClaimed = !!inv.claimed_by;
                const isExpired = inv.expires_at ? new Date(inv.expires_at) < new Date() : false;
                const statusColor = isClaimed
                  ? '#047857'
                  : isExpired
                    ? '#B91C1C'
                    : '#B45309';
                const statusLabel = isClaimed
                  ? 'Claimed'
                  : isExpired
                    ? 'Expired'
                    : 'Pending';
                return (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <td style={{ padding: '12px 18px', fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: DS.ink }}>
                        {inv.name || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: DS.muted, fontFamily: DS.monoFont }}>
                        {inv.email}
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          background: `${rl.color}12`,
                          color: rl.color,
                          fontFamily: DS.monoFont,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {rl.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: DS.ink }}>
                      {inv.target_organization ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Building2 style={{ width: 13, height: 13, color: DS.muted }} />
                          {inv.target_organization}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: statusColor,
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 7, height: 7,
                            borderRadius: '50%',
                            background: statusColor,
                            display: 'inline-block',
                          }}
                        />
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: DS.muted }}>
                      {inv.expires_at
                        ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Clock style={{ width: 12, height: 12 }} />
                            {new Date(inv.expires_at).toLocaleDateString('en-SG', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        )
                        : '—'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {!isClaimed && (
                        <button
                          type="button"
                          onClick={() => copyLink(inv.code)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '6px 10px',
                            background: copied === inv.code ? '#047857' : 'transparent',
                            color: copied === inv.code ? '#FFF' : DS.ink,
                            border: `1px solid ${DS.border}`,
                            cursor: 'pointer',
                            fontFamily: DS.monoFont,
                            fontSize: 10.5,
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            borderRadius: DS.radius,
                          }}
                        >
                          {copied === inv.code
                            ? <><Check style={{ width: 11, height: 11 }} /> Copied</>
                            : <><Copy style={{ width: 11, height: 11 }} /> Link</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tier comparison (for upgrade) */}
      {!isTop && (
        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 20,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: DS.monoFont, fontSize: 10.5,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: CONSULTANT_TIER_META[nextTier].accent, fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Next tier
              </div>
              <h2
                style={{
                  margin: 0, fontFamily: DS.headingFont,
                  fontSize: 20, fontWeight: 700, color: DS.ink,
                }}
              >
                From {tierMeta.label} → {CONSULTANT_TIER_META[nextTier].label}
              </h2>
            </div>
            <a
              href="/pricing"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 16px',
                background: CONSULTANT_TIER_META[nextTier].accent, color: '#FFF',
                textDecoration: 'none',
                fontFamily: DS.bodyFont, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                borderRadius: DS.radius,
              }}
            >
              Compare all tiers <ChevronRight style={{ width: 13, height: 13 }} />
            </a>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {([tier, nextTier, 'council_seat'] as ConsultantTierKey[])
              .filter((v, i, a) => a.indexOf(v) === i)
              .slice(0, 3)
              .map((t) => {
                const m = CONSULTANT_TIER_META[t];
                return (
                  <div
                    key={t}
                    style={{
                      padding: 16,
                      background: '#FFF',
                      border: `1px solid ${t === nextTier ? m.accent : DS.border}`,
                      borderTop: `4px solid ${m.accent}`,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: DS.monoFont,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: m.accent,
                        }}
                      >
                        <Crown style={{ width: 11, height: 11 }} />
                        {m.label}
                      </div>
                      {t === tier && (
                        <span
                          style={{
                            fontFamily: DS.monoFont,
                            fontSize: 9.5,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: DS.muted,
                            padding: '2px 7px',
                            border: `1px solid ${DS.border}`,
                          }}
                        >
                          Current
                        </span>
                      )}
                      {t === nextTier && (
                        <span
                          style={{
                            fontFamily: DS.monoFont,
                            fontSize: 9.5,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: m.accent,
                            padding: '2px 7px',
                            background: `${m.accent}14`,
                            border: `1px solid ${m.accent}40`,
                          }}
                        >
                          Recommended
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 12.5,
                        color: DS.muted,
                        lineHeight: 1.5,
                        minHeight: 40,
                      }}
                    >
                      {m.tagline}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 5,
                        marginBottom: 12,
                      }}
                    >
                      {m.features.slice(0, 4).map((f) => (
                        <div
                          key={f}
                          style={{
                            display: 'flex', gap: 6, fontSize: 12,
                            color: DS.ink, lineHeight: 1.45,
                          }}
                        >
                          <Check style={{ width: 13, height: 13, color: m.accent, flexShrink: 0, marginTop: 2 }} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    {t !== tier && (
                      <a
                        href="/pricing"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11.5, fontWeight: 700,
                          color: m.accent, textDecoration: 'none',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}
                      >
                        Upgrade <ArrowRight style={{ width: 11, height: 11 }} />
                      </a>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal */}
      <InviteClientModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        issuedBy={user?.id || ''}
        issuerTier={tier}
        onInviteCreated={refresh}
      />
    </div>
  );
}

// ── StatCard helper ───────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, accent, hint,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  accent: string;
  hint?: string;
}) {
  return (
    <div
      style={{
        padding: 16,
        background: '#FFF',
        border: `1px solid ${DS.border}`,
        borderTop: `3px solid ${accent}`,
        minHeight: 92,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 10,
        }}
      >
        <Icon style={{ width: 13, height: 13, color: accent }} />
        <span
          style={{
            fontFamily: DS.monoFont,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: DS.muted,
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontFamily: DS.headingFont,
          fontSize: 24,
          fontWeight: 700,
          color: DS.ink,
          lineHeight: 1,
          marginBottom: hint ? 4 : 0,
        }}
      >
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11.5, color: DS.muted }}>{hint}</div>
      )}
    </div>
  );
}

export default TeamInvitesPage;
