import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Activity,
} from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Button,
  Flex,
  Grid,
} from '@/components/design-system';

type SLAStatus = 'on_track' | 'at_risk' | 'breached';

interface MandateSLA {
  id: string;
  name: string;
  client: string;
  leadConsultant: string;
  status: SLAStatus;
  daysRemaining: number;
  stageSla: {
    sourcing: number;
    screening: number;
    shortlist: number;
    interview: number;
    offer: number;
    placement: number;
  };
  currentStage: keyof MandateSLA['stageSla'];
}

const STAGE_LABEL: Record<keyof MandateSLA['stageSla'], string> = {
  sourcing: 'Sourcing',
  screening: 'Screening',
  shortlist: 'Shortlist',
  interview: 'Interview',
  offer: 'Offer',
  placement: 'Placement',
};

const SLA_META: Record<SLAStatus, { variant: 'success' | 'warning' | 'error'; label: string; color: string; bg: string }> = {
  on_track: { variant: 'success', label: 'On track', color: COLORS.success, bg: COLORS.successLight },
  at_risk: { variant: 'warning', label: 'At risk', color: COLORS.warning, bg: COLORS.warningLight },
  breached: { variant: 'error', label: 'Breached', color: COLORS.error, bg: COLORS.errorLight },
};

// 5 on_track, 3 at_risk, 2 breached
const SEED_MANDATES: MandateSLA[] = [
  {
    id: 'M-101',
    name: 'CFO Search',
    client: 'Northwind Capital',
    leadConsultant: 'Marie Lavoie',
    status: 'on_track',
    daysRemaining: 42,
    currentStage: 'sourcing',
    stageSla: { sourcing: 95, screening: 88, shortlist: 0, interview: 0, offer: 0, placement: 0 },
  },
  {
    id: 'M-201',
    name: 'VP Operations',
    client: 'Helix Manufacturing',
    leadConsultant: 'Daniel Otieno',
    status: 'on_track',
    daysRemaining: 3,
    currentStage: 'offer',
    stageSla: { sourcing: 100, screening: 92, shortlist: 88, interview: 90, offer: 96, placement: 0 },
  },
  {
    id: 'M-301',
    name: 'CPO Search',
    client: 'Brightwave Logistics',
    leadConsultant: 'Priya Nair',
    status: 'on_track',
    daysRemaining: 28,
    currentStage: 'screening',
    stageSla: { sourcing: 98, screening: 94, shortlist: 0, interview: 0, offer: 0, placement: 0 },
  },
  {
    id: 'M-401',
    name: 'Maintenance Lead',
    client: 'Helix Manufacturing',
    leadConsultant: 'Samuel Greene',
    status: 'on_track',
    daysRemaining: 35,
    currentStage: 'sourcing',
    stageSla: { sourcing: 90, screening: 0, shortlist: 0, interview: 0, offer: 0, placement: 0 },
  },
  {
    id: 'M-501',
    name: 'Chief Digital Officer',
    client: 'Cedar Health Group',
    leadConsultant: 'Aïcha Benali',
    status: 'on_track',
    daysRemaining: 2,
    currentStage: 'offer',
    stageSla: { sourcing: 100, screening: 96, shortlist: 92, interview: 88, offer: 94, placement: 0 },
  },
  {
    id: 'M-102',
    name: 'Board refresh',
    client: 'Cedar Health Group',
    leadConsultant: 'Marie Lavoie',
    status: 'at_risk',
    daysRemaining: 6,
    currentStage: 'shortlist',
    stageSla: { sourcing: 88, screening: 80, shortlist: 72, interview: 0, offer: 0, placement: 0 },
  },
  {
    id: 'M-302',
    name: 'CIO Search',
    client: 'Cedar Health Group',
    leadConsultant: 'Priya Nair',
    status: 'at_risk',
    daysRemaining: 8,
    currentStage: 'interview',
    stageSla: { sourcing: 92, screening: 86, shortlist: 78, interview: 70, offer: 0, placement: 0 },
  },
  {
    id: 'M-103',
    name: 'FP&A Director',
    client: 'Aethel Partners',
    leadConsultant: 'Marie Lavoie',
    status: 'at_risk',
    daysRemaining: 5,
    currentStage: 'screening',
    stageSla: { sourcing: 85, screening: 68, shortlist: 0, interview: 0, offer: 0, placement: 0 },
  },
  {
    id: 'M-202',
    name: 'COO Search',
    client: 'Aethel Partners',
    leadConsultant: 'Daniel Otieno',
    status: 'breached',
    daysRemaining: -4,
    currentStage: 'interview',
    stageSla: { sourcing: 80, screening: 72, shortlist: 60, interview: 42, offer: 0, placement: 0 },
  },
  {
    id: 'M-502',
    name: 'CTO Search',
    client: 'Northwind Capital',
    leadConsultant: 'Aïcha Benali',
    status: 'breached',
    daysRemaining: -9,
    currentStage: 'shortlist',
    stageSla: { sourcing: 76, screening: 64, shortlist: 38, interview: 0, offer: 0, placement: 0 },
  },
];

const stageColor = (pct: number) => {
  if (pct === 0) return COLORS.borderLight;
  if (pct >= 85) return COLORS.success;
  if (pct >= 70) return COLORS.warning;
  return COLORS.error;
};

export const TL_SLADashboard: React.FC = () => {
  const counts: Record<SLAStatus, number> = {
    on_track: SEED_MANDATES.filter((m) => m.status === 'on_track').length,
    at_risk: SEED_MANDATES.filter((m) => m.status === 'at_risk').length,
    breached: SEED_MANDATES.filter((m) => m.status === 'breached').length,
  };
  const total = SEED_MANDATES.length;
  const compliancePct = total ? Math.round((counts.on_track / total) * 100) : 0;

  const escalated = SEED_MANDATES.filter((m) => m.status === 'breached');

  const headerCell: React.CSSProperties = {
    padding: `${SPACING[3]}px ${SPACING[4]}px`,
    fontSize: SPACING[2],
    fontWeight: 700,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    textAlign: 'left',
  };

  const cellStyle: React.CSSProperties = {
    padding: `${SPACING[3]}px ${SPACING[4]}px`,
    fontSize: SPACING[3],
    color: COLORS.text,
    borderBottom: `1px solid ${COLORS.borderLight}`,
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>SLA Dashboard</Heading>
          <Paragraph color="textMuted">
            Monitor SLA health across mandates, drill into stage compliance and resolve breaches.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="info">{compliancePct}% compliance</Badge>
          <Badge variant="error">{counts.breached} breached</Badge>
        </Flex>
      </Flex>

      {/* Section 1: SLA Health overview */}
      <Grid columns={4} gap="4">
        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                On track
              </span>
              <span style={{ fontSize: SPACING[10], fontWeight: 700, color: COLORS.success, lineHeight: 1 }}>
                {counts.on_track}
              </span>
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                of {total} mandates
              </span>
            </Grid>
            <div
              style={{
                width: SPACING[10],
                height: SPACING[10],
                borderRadius: 12,
                backgroundColor: COLORS.successLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                At risk
              </span>
              <span style={{ fontSize: SPACING[10], fontWeight: 700, color: COLORS.warning, lineHeight: 1 }}>
                {counts.at_risk}
              </span>
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                needs attention
              </span>
            </Grid>
            <div
              style={{
                width: SPACING[10],
                height: SPACING[10],
                borderRadius: 12,
                backgroundColor: COLORS.warningLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.warning }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Breached
              </span>
              <span style={{ fontSize: SPACING[10], fontWeight: 700, color: COLORS.error, lineHeight: 1 }}>
                {counts.breached}
              </span>
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                escalate now
              </span>
            </Grid>
            <div
              style={{
                width: SPACING[10],
                height: SPACING[10],
                borderRadius: 12,
                backgroundColor: COLORS.errorLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle className="w-5 h-5" style={{ color: COLORS.error }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compliance
              </span>
              <span style={{ fontSize: SPACING[10], fontWeight: 700, color: COLORS.primary, lineHeight: 1 }}>
                {compliancePct}%
              </span>
              <Flex align="center" gap="1">
                <ArrowUp className="w-3 h-3" style={{ color: COLORS.success }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.success }}>+4% vs last week</span>
              </Flex>
            </Grid>
            <div
              style={{
                width: SPACING[10],
                height: SPACING[10],
                borderRadius: 12,
                backgroundColor: COLORS.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* Section 2: Mandate SLA breakdown */}
      <Card padding="0">
        <div style={{ padding: `${SPACING[5]}px ${SPACING[6]}px 0` }}>
          <Flex justify="between" align="center">
            <Grid columns={1} gap="0">
              <Heading level={5}>Mandate SLA breakdown</Heading>
              <Paragraph color="textMuted">Stage-by-stage SLA compliance % per mandate.</Paragraph>
            </Grid>
            <Flex align="center" gap="3">
              <Flex align="center" gap="1">
                <span style={{ width: SPACING[2], height: SPACING[2], borderRadius: '50%', backgroundColor: COLORS.success, display: 'inline-block' }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>≥85%</span>
              </Flex>
              <Flex align="center" gap="1">
                <span style={{ width: SPACING[2], height: SPACING[2], borderRadius: '50%', backgroundColor: COLORS.warning, display: 'inline-block' }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>70–84%</span>
              </Flex>
              <Flex align="center" gap="1">
                <span style={{ width: SPACING[2], height: SPACING[2], borderRadius: '50%', backgroundColor: COLORS.error, display: 'inline-block' }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>&lt;70%</span>
              </Flex>
            </Flex>
          </Flex>
        </div>
        <div style={{ overflowX: 'auto', marginTop: SPACING[4] }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCell}>Mandate</th>
                <th style={headerCell}>Status</th>
                {(Object.keys(STAGE_LABEL) as (keyof MandateSLA['stageSla'])[]).map((stage) => (
                  <th key={stage} style={{ ...headerCell, textAlign: 'center' }}>
                    {STAGE_LABEL[stage]}
                  </th>
                ))}
                <th style={{ ...headerCell, textAlign: 'right' }}>Days left</th>
              </tr>
            </thead>
            <tbody>
              {SEED_MANDATES.map((m) => {
                const meta = SLA_META[m.status];
                return (
                  <tr key={m.id}>
                    <td style={cellStyle}>
                      <Grid columns={1} gap="0">
                        <span style={{ fontWeight: 600, color: COLORS.text }}>{m.name}</span>
                        <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                          {m.client} · {m.leadConsultant}
                        </span>
                      </Grid>
                    </td>
                    <td style={cellStyle}>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    {(Object.keys(STAGE_LABEL) as (keyof MandateSLA['stageSla'])[]).map((stage) => {
                      const pct = m.stageSla[stage];
                      const isCurrent = m.currentStage === stage;
                      return (
                        <td
                          key={stage}
                          style={{
                            ...cellStyle,
                            textAlign: 'center',
                            backgroundColor: isCurrent ? COLORS.primaryLight : 'transparent',
                          }}
                        >
                          {pct === 0 ? (
                            <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>—</span>
                          ) : (
                            <span style={{ fontSize: SPACING[2], fontWeight: 600, color: stageColor(pct) }}>
                              {pct}%
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ ...cellStyle, textAlign: 'right', color: meta.color, fontWeight: 600 }}>
                      {m.daysRemaining >= 0 ? `${m.daysRemaining}d` : `${Math.abs(m.daysRemaining)}d over`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 3: Escalation queue */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex justify="between" align="center">
            <Flex align="center" gap="2">
              <Clock className="w-4 h-4" style={{ color: COLORS.error }} />
              <Heading level={5}>Escalation queue</Heading>
            </Flex>
            <Badge variant="error">{escalated.length} breached</Badge>
          </Flex>
          {escalated.length === 0 ? (
            <Paragraph color="textMuted">No breached mandates — everything is under control.</Paragraph>
          ) : (
            <Grid columns={1} gap="3">
              {escalated.map((m) => {
                const meta = SLA_META[m.status];
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: SPACING[4],
                      borderRadius: 12,
                      backgroundColor: meta.bg,
                      border: `1px solid ${meta.color}`,
                    }}
                  >
                    <Flex justify="between" align="start" gap="4">
                      <Grid columns={1} gap="1">
                        <Flex align="center" gap="2">
                          <AlertTriangle className="w-4 h-4" style={{ color: meta.color }} />
                          <span style={{ fontSize: SPACING[3], fontWeight: 700, color: COLORS.text }}>
                            {m.name}
                          </span>
                          <Badge variant="error">{Math.abs(m.daysRemaining)}d over SLA</Badge>
                        </Flex>
                        <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                          {m.client} · Lead: {m.leadConsultant} · Stuck at {STAGE_LABEL[m.currentStage]}
                        </span>
                      </Grid>
                      <Flex gap="2">
                        <Button size="sm" variant="ghost">
                          Reassign
                        </Button>
                        <Button size="sm" variant="danger">
                          Escalate
                        </Button>
                      </Flex>
                    </Flex>
                  </div>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Card>
    </Grid>
  );
};
