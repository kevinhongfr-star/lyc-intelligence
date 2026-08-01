import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Briefcase, ClipboardCheck, Gauge, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { COLORS, SPACING } from '@/styles/tokens';
import { authFetch } from '@/utils/authFetch';
import {
  Card,
  Heading,
  Paragraph,
  Button,
  Badge,
  Flex,
  Grid,
  StatCard,
} from '@/components/design-system';

type SLAStatus = 'healthy' | 'at_risk' | 'breached';

interface TeamMember {
  id: string;
  name: string;
  utilization: number;
  mandates: number;
}

interface PendingApproval {
  id: string;
  title: string;
  requester: string;
  type: string;
}

interface SLAItem {
  mandate: string;
  status: SLAStatus;
  remaining_days: number;
}

interface TLDashboardData {
  active_mandates: number;
  pending_approvals: number;
  sla_compliance: number;
  team_utilization: number;
  team?: TeamMember[];
  pending?: PendingApproval[];
  sla?: SLAItem[];
}

const SLA_BADGE: Record<SLAStatus, { variant: 'success' | 'warning' | 'error'; label: string }> = {
  healthy: { variant: 'success', label: 'Healthy' },
  at_risk: { variant: 'warning', label: 'At Risk' },
  breached: { variant: 'error', label: 'Breached' },
};

export const TL_Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [data, setData] = useState<TLDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/team-lead/dashboard');
        const json = await res.json();
        if (!alive) return;
        if (json.success === false) {
          throw new Error(json.error || 'Failed to load dashboard');
        }
        setData((json.data ?? json) as TLDashboardData);
      } catch (e: any) {
        if (alive) setError(e.message || 'Failed to load dashboard');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING[20],
        }}
      >
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.primary }} />
        <span style={{ marginLeft: SPACING[3], color: COLORS.textSecondary }}>
          Loading team dashboard…
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card padding="8">
        <Grid columns={1} gap="3">
          <Heading level={4}>Couldn't load the dashboard</Heading>
          <Paragraph color="textSecondary">{error || 'No data available.'}</Paragraph>
          <Flex justify="start" gap="2">
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Flex>
        </Grid>
      </Card>
    );
  }

  const team = data.team ?? [];
  const pending = data.pending ?? [];
  const sla = data.sla ?? [];

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Team Lead Dashboard</Heading>
          <Paragraph color="textMuted">
            Team overview, pending approvals and SLA status
          </Paragraph>
        </Grid>
        <Badge variant="info">{profile?.organization_id ? 'Org view' : 'Team view'}</Badge>
      </Flex>

      {/* Stat cards */}
      <Grid columns={4} gap="4">
        <StatCard
          title="Active Mandates"
          value={data.active_mandates || 0}
          icon={<Briefcase className="w-5 h-5" style={{ color: COLORS.primary }} />}
        />
        <StatCard
          title="Pending Approvals"
          value={data.pending_approvals || 0}
          icon={<ClipboardCheck className="w-5 h-5" style={{ color: COLORS.warning }} />}
        />
        <StatCard
          title="SLA Compliance"
          value={`${Math.round(data.sla_compliance || 0)}%`}
          icon={<Gauge className="w-5 h-5" style={{ color: COLORS.success }} />}
        />
        <StatCard
          title="Team Utilization"
          value={`${Math.round(data.team_utilization || 0)}%`}
          icon={<Users className="w-5 h-5" style={{ color: COLORS.info }} />}
        />
      </Grid>

      {/* Team overview + pending approvals */}
      <Grid columns={2} gap="6">
        <Card padding="6">
          <Grid columns={1} gap="4">
            <Flex justify="between" align="center">
              <Heading level={5}>Team Overview</Heading>
              <Button variant="ghost" size="sm" onClick={() => navigate('/app/team-lead/team')}>
                View team
              </Button>
            </Flex>
            {team.length === 0 ? (
              <Paragraph color="textMuted">No team members yet.</Paragraph>
            ) : (
              <Grid columns={1} gap="2">
                {team.map((m) => {
                  const pct = Math.min(Math.round(m.utilization || 0), 100);
                  return (
                    <div key={m.id}>
                      <Flex justify="between" align="center">
                        <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                          {m.name}
                        </span>
                        <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                          {m.mandates} mandates · {pct}%
                        </span>
                      </Flex>
                      <div
                        style={{
                          marginTop: SPACING[1],
                          height: SPACING[1],
                          backgroundColor: COLORS.borderLight,
                          borderRadius: 9999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            backgroundColor:
                              pct > 90 ? COLORS.warning : COLORS.primary,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Grid>
            )}
          </Grid>
        </Card>

        <Card padding="6">
          <Grid columns={1} gap="4">
            <Flex justify="between" align="center">
              <Heading level={5}>Pending Approvals</Heading>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/team-lead/approvals')}
              >
                View all
              </Button>
            </Flex>
            {pending.length === 0 ? (
              <Paragraph color="textMuted">No approvals pending.</Paragraph>
            ) : (
              <Grid columns={1} gap="2">
                {pending.slice(0, 6).map((p) => (
                  <Flex key={p.id} justify="between" align="center" gap="2">
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {p.title}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {p.requester} · {p.type}
                      </span>
                    </Grid>
                    <Badge variant="warning">Pending</Badge>
                  </Flex>
                ))}
              </Grid>
            )}
          </Grid>
        </Card>
      </Grid>

      {/* SLA status */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex justify="between" align="center">
            <Heading level={5}>SLA Status</Heading>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/team-lead/sla')}>
              View all
            </Button>
          </Flex>
          {sla.length === 0 ? (
            <Paragraph color="textMuted">No SLA-tracked mandates.</Paragraph>
          ) : (
            <Grid columns={1} gap="2">
              {sla.slice(0, 6).map((s, idx) => {
                const badge = SLA_BADGE[s.status] ?? SLA_BADGE.healthy;
                return (
                  <Flex key={`${s.mandate}-${idx}`} justify="between" align="center" gap="2">
                    <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                      {s.mandate}
                    </span>
                    <Flex align="center" gap="2">
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {s.remaining_days}d left
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </Flex>
                  </Flex>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Card>
    </Grid>
  );
};
