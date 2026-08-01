import React, { useMemo, useState } from 'react';
import { Briefcase, Filter } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type SLAStatus = 'on_track' | 'at_risk' | 'breached';
type TeamId = 'T1' | 'T2' | 'T3';

interface Mandate {
  id: string;
  name: string;
  client: string;
  leadConsultant: string;
  team: TeamId;
  stage: string;
  slaStatus: SLAStatus;
  daysRemaining: number;
  value: number;
}

const TEAM_LABEL: Record<TeamId, string> = {
  T1: 'T1 — Financial Services',
  T2: 'T2 — Industrial & Operations',
  T3: 'T3 — Technology & Product',
};

const SLA_BADGE: Record<SLAStatus, { variant: 'success' | 'warning' | 'error'; label: string; color: string }> = {
  on_track: { variant: 'success', label: 'On track', color: COLORS.success },
  at_risk: { variant: 'warning', label: 'At risk', color: COLORS.warning },
  breached: { variant: 'error', label: 'Breached', color: COLORS.error },
};

const SEED_MANDATES: Mandate[] = [
  {
    id: 'M-101',
    name: 'CFO Search',
    client: 'Northwind Capital',
    leadConsultant: 'Marie Lavoie',
    team: 'T1',
    stage: 'Sourcing',
    slaStatus: 'on_track',
    daysRemaining: 42,
    value: 180000,
  },
  {
    id: 'M-102',
    name: 'Board refresh',
    client: 'Cedar Health Group',
    leadConsultant: 'Marie Lavoie',
    team: 'T1',
    stage: 'Shortlist',
    slaStatus: 'at_risk',
    daysRemaining: 6,
    value: 120000,
  },
  {
    id: 'M-201',
    name: 'VP Operations',
    client: 'Helix Manufacturing',
    leadConsultant: 'Daniel Otieno',
    team: 'T2',
    stage: 'Offer',
    slaStatus: 'on_track',
    daysRemaining: 3,
    value: 145000,
  },
  {
    id: 'M-202',
    name: 'COO Search',
    client: 'Aethel Partners',
    leadConsultant: 'Daniel Otieno',
    team: 'T2',
    stage: 'Final interviews',
    slaStatus: 'breached',
    daysRemaining: -4,
    value: 165000,
  },
  {
    id: 'M-301',
    name: 'CPO Search',
    client: 'Brightwave Logistics',
    leadConsultant: 'Priya Nair',
    team: 'T3',
    stage: 'Screening',
    slaStatus: 'on_track',
    daysRemaining: 28,
    value: 135000,
  },
  {
    id: 'M-302',
    name: 'CIO Search',
    client: 'Cedar Health Group',
    leadConsultant: 'Priya Nair',
    team: 'T3',
    stage: 'Interview',
    slaStatus: 'at_risk',
    daysRemaining: 8,
    value: 150000,
  },
  {
    id: 'M-401',
    name: 'Maintenance Lead',
    client: 'Helix Manufacturing',
    leadConsultant: 'Samuel Greene',
    team: 'T2',
    stage: 'Sourcing',
    slaStatus: 'on_track',
    daysRemaining: 35,
    value: 75000,
  },
  {
    id: 'M-501',
    name: 'Chief Digital Officer',
    client: 'Cedar Health Group',
    leadConsultant: 'Aïcha Benali',
    team: 'T3',
    stage: 'Offer',
    slaStatus: 'on_track',
    daysRemaining: 2,
    value: 195000,
  },
  {
    id: 'M-502',
    name: 'CTO Search',
    client: 'Northwind Capital',
    leadConsultant: 'Aïcha Benali',
    team: 'T3',
    stage: 'Shortlist',
    slaStatus: 'breached',
    daysRemaining: -9,
    value: 210000,
  },
  {
    id: 'M-601',
    name: 'Treasurer',
    client: 'Northwind Capital',
    leadConsultant: 'Marie Lavoie',
    team: 'T1',
    stage: 'Screening',
    slaStatus: 'on_track',
    daysRemaining: 22,
    value: 110000,
  },
];

const SLA_FILTERS: { value: SLAStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All SLA' },
  { value: 'on_track', label: 'On track' },
  { value: 'at_risk', label: 'At risk' },
  { value: 'breached', label: 'Breached' },
];

const fmtCurrency = (v: number) => `$${v.toLocaleString('en-CA')}`;

export const TL_MandatePortfolio: React.FC<{ onSelectMandate?: (id: string) => void }> = ({
  onSelectMandate,
}) => {
  const [slaFilter, setSlaFilter] = useState<SLAStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all');

  const filtered = useMemo(
    () =>
      SEED_MANDATES.filter((m) => {
        if (slaFilter !== 'all' && m.slaStatus !== slaFilter) return false;
        if (teamFilter !== 'all' && m.team !== teamFilter) return false;
        return true;
      }),
    [slaFilter, teamFilter],
  );

  const totalValue = filtered.reduce((s, m) => s + m.value, 0);
  const counts: Record<SLAStatus, number> = {
    on_track: filtered.filter((m) => m.slaStatus === 'on_track').length,
    at_risk: filtered.filter((m) => m.slaStatus === 'at_risk').length,
    breached: filtered.filter((m) => m.slaStatus === 'breached').length,
  };

  const selectStyle: React.CSSProperties = {
    padding: `${SPACING[2]}px ${SPACING[3]}px`,
    fontSize: SPACING[3],
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    outline: 'none',
  };

  const cellStyle: React.CSSProperties = {
    padding: `${SPACING[3]}px ${SPACING[4]}px`,
    fontSize: SPACING[3],
    color: COLORS.text,
    borderBottom: `1px solid ${COLORS.borderLight}`,
  };

  const headerCell: React.CSSProperties = {
    ...cellStyle,
    fontSize: SPACING[2],
    fontWeight: 700,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    textAlign: 'left',
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Mandate Portfolio</Heading>
          <Paragraph color="textMuted">
            All active mandates across the team, with SLA status and days remaining.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="info">{filtered.length} mandates</Badge>
          <Badge variant="success">{counts.on_track} on track</Badge>
          {counts.at_risk > 0 ? <Badge variant="warning">{counts.at_risk} at risk</Badge> : null}
          {counts.breached > 0 ? <Badge variant="error">{counts.breached} breached</Badge> : null}
        </Flex>
      </Flex>

      {/* Filters */}
      <Card padding="4">
        <Flex justify="between" align="center" gap="4">
          <Flex align="center" gap="3">
            <Filter className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            <Flex align="center" gap="2">
              <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.textSecondary }}>
                SLA
              </span>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value as SLAStatus | 'all')}
                style={selectStyle}
              >
                {SLA_FILTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Flex>
            <Flex align="center" gap="2">
              <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.textSecondary }}>
                TEAM
              </span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value as TeamId | 'all')}
                style={selectStyle}
              >
                <option value="all">All teams</option>
                {(Object.keys(TEAM_LABEL) as TeamId[]).map((t) => (
                  <option key={t} value={t}>
                    {TEAM_LABEL[t]}
                  </option>
                ))}
              </select>
            </Flex>
          </Flex>
          <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
            Portfolio value {fmtCurrency(totalValue)}
          </span>
        </Flex>
      </Card>

      {/* Table */}
      <Card padding="0">
        {filtered.length === 0 ? (
          <div style={{ padding: SPACING[8], textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <Briefcase className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <Paragraph color="textMuted">No mandates match these filters.</Paragraph>
            </Flex>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerCell}>Mandate</th>
                  <th style={headerCell}>Client</th>
                  <th style={headerCell}>Lead Consultant</th>
                  <th style={headerCell}>Stage</th>
                  <th style={headerCell}>SLA Status</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>Days left</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const sla = SLA_BADGE[m.slaStatus];
                  return (
                    <tr
                      key={m.id}
                      onClick={() => onSelectMandate?.(m.id)}
                      style={{
                        cursor: onSelectMandate ? 'pointer' : 'default',
                        transition: 'background-color 150ms ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.primaryLight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={cellStyle}>
                        <Grid columns={1} gap="0">
                          <span style={{ fontWeight: 600, color: COLORS.text }}>{m.name}</span>
                          <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                            {m.id}
                          </span>
                        </Grid>
                      </td>
                      <td style={cellStyle}>{m.client}</td>
                      <td style={cellStyle}>{m.leadConsultant}</td>
                      <td style={cellStyle}>{m.stage}</td>
                      <td style={cellStyle}>
                        <Flex align="center" gap="2">
                          <span
                            style={{
                              width: SPACING[2],
                              height: SPACING[2],
                              borderRadius: '50%',
                              backgroundColor: sla.color,
                              display: 'inline-block',
                            }}
                          />
                          <Badge variant={sla.variant}>{sla.label}</Badge>
                        </Flex>
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', color: sla.color, fontWeight: 600 }}>
                        {m.daysRemaining >= 0 ? `${m.daysRemaining}d` : `${Math.abs(m.daysRemaining)}d over`}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                        {fmtCurrency(m.value)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {onSelectMandate ? (
        <Paragraph color="textMuted">Click a row to open mandate details.</Paragraph>
      ) : null}
    </Grid>
  );
};
