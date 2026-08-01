import React, { useMemo, useState } from 'react';
import { Users, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type TeamId = 'T1' | 'T2' | 'T3';

interface MandateRef {
  id: string;
  name: string;
  client: string;
}

interface Consultant {
  id: string;
  name: string;
  role: string;
  team: TeamId;
  activeMandates: number;
  utilization: number;
  capacity: number; // max mandates comfortable
  mandates: MandateRef[];
  upcomingPto?: { from: string; to: string; label: string };
}

const TEAM_LABEL: Record<TeamId, string> = {
  T1: 'T1 — Financial Services',
  T2: 'T2 — Industrial & Operations',
  T3: 'T3 — Technology & Product',
};

const SEED_CONSULTANTS: Consultant[] = [
  {
    id: 'C-001',
    name: 'Marie Lavoie',
    role: 'Senior Consultant',
    team: 'T1',
    activeMandates: 5,
    utilization: 92,
    capacity: 5,
    mandates: [
      { id: 'M-101', name: 'Northwind Capital — CFO', client: 'Northwind Capital' },
      { id: 'M-102', name: 'Cedar Health — Board refresh', client: 'Cedar Health Group' },
      { id: 'M-103', name: 'Aethel — FP&A Director', client: 'Aethel Partners' },
      { id: 'M-104', name: 'Brightwave — Controller', client: 'Brightwave Logistics' },
      { id: 'M-105', name: 'Helix — Treasurer', client: 'Helix Manufacturing' },
    ],
    upcomingPto: { from: '2026-08-12', to: '2026-08-19', label: 'Summer break' },
  },
  {
    id: 'C-002',
    name: 'Daniel Otieno',
    role: 'Consultant',
    team: 'T2',
    activeMandates: 6,
    utilization: 108,
    capacity: 5,
    mandates: [
      { id: 'M-201', name: 'Helix — VP Operations', client: 'Helix Manufacturing' },
      { id: 'M-202', name: 'Aethel — COO Search', client: 'Aethel Partners' },
      { id: 'M-203', name: 'Brightwave — Plant Manager', client: 'Brightwave Logistics' },
      { id: 'M-204', name: 'Cedar Health — COO', client: 'Cedar Health Group' },
      { id: 'M-205', name: 'Northwind — Risk Lead', client: 'Northwind Capital' },
      { id: 'M-206', name: 'Helix — Supply Chain Dir', client: 'Helix Manufacturing' },
    ],
  },
  {
    id: 'C-003',
    name: 'Priya Nair',
    role: 'Consultant',
    team: 'T3',
    activeMandates: 4,
    utilization: 78,
    capacity: 5,
    mandates: [
      { id: 'M-301', name: 'Brightwave — CPO', client: 'Brightwave Logistics' },
      { id: 'M-302', name: 'Cedar Health — CIO', client: 'Cedar Health Group' },
      { id: 'M-303', name: 'Aethel — Head of Data', client: 'Aethel Partners' },
      { id: 'M-304', name: 'Northwind — VP Product', client: 'Northwind Capital' },
    ],
    upcomingPto: { from: '2026-09-02', to: '2026-09-06', label: 'Conference travel' },
  },
  {
    id: 'C-004',
    name: 'Samuel Greene',
    role: 'Consultant',
    team: 'T2',
    activeMandates: 3,
    utilization: 64,
    capacity: 5,
    mandates: [
      { id: 'M-401', name: 'Helix — Maintenance Lead', client: 'Helix Manufacturing' },
      { id: 'M-402', name: 'Aethel — COO Search', client: 'Aethel Partners' },
      { id: 'M-403', name: 'Brightwave — Warehouse Mgr', client: 'Brightwave Logistics' },
    ],
  },
  {
    id: 'C-005',
    name: 'Aïcha Benali',
    role: 'Senior Consultant',
    team: 'T3',
    activeMandates: 5,
    utilization: 96,
    capacity: 5,
    mandates: [
      { id: 'M-501', name: 'Cedar Health — Chief Digital', client: 'Cedar Health Group' },
      { id: 'M-502', name: 'Brightwave — CPO', client: 'Brightwave Logistics' },
      { id: 'M-503', name: 'Northwind — CTO', client: 'Northwind Capital' },
      { id: 'M-504', name: 'Aethel — Head of Data', client: 'Aethel Partners' },
      { id: 'M-505', name: 'Helix — IT Director', client: 'Helix Manufacturing' },
    ],
  },
  {
    id: 'C-006',
    name: 'Jordan Pike',
    role: 'Associate',
    team: 'T1',
    activeMandates: 2,
    utilization: 60,
    capacity: 4,
    mandates: [
      { id: 'M-601', name: 'Northwind Capital — CFO', client: 'Northwind Capital' },
      { id: 'M-602', name: 'Cedar Health — Board refresh', client: 'Cedar Health Group' },
    ],
  },
];

type SortKey = 'utilization_desc' | 'utilization_asc' | 'mandates_desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'utilization_desc', label: 'Utilization (high → low)' },
  { value: 'utilization_asc', label: 'Utilization (low → high)' },
  { value: 'mandates_desc', label: 'Active mandates (high → low)' },
];

const utilizationColor = (pct: number) => {
  if (pct >= 100) return COLORS.error;
  if (pct >= 90) return COLORS.warning;
  if (pct < 70) return COLORS.info;
  return COLORS.success;
};

const utilizationBadge = (pct: number): { variant: 'success' | 'warning' | 'error' | 'info'; label: string } => {
  if (pct >= 100) return { variant: 'error', label: 'Over capacity' };
  if (pct >= 90) return { variant: 'warning', label: 'Near capacity' };
  if (pct < 70) return { variant: 'info', label: 'Available' };
  return { variant: 'success', label: 'Healthy' };
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

export const TL_TeamOverview: React.FC = () => {
  const [teamFilter, setTeamFilter] = useState<TeamId | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('utilization_desc');

  const consultants = useMemo(() => {
    let list = teamFilter === 'all' ? SEED_CONSULTANTS : SEED_CONSULTANTS.filter((c) => c.team === teamFilter);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'utilization_asc':
          return a.utilization - b.utilization;
        case 'mandates_desc':
          return b.activeMandates - a.activeMandates;
        case 'utilization_desc':
        default:
          return b.utilization - a.utilization;
      }
    });
    return list;
  }, [teamFilter, sort]);

  const avgUtilization = consultants.length
    ? Math.round(consultants.reduce((s, c) => s + c.utilization, 0) / consultants.length)
    : 0;
  const overCapacity = consultants.filter((c) => c.utilization >= 100).length;
  const onPtoSoon = consultants.filter((c) => c.upcomingPto).length;

  const selectStyle: React.CSSProperties = {
    padding: `${SPACING[2]}px ${SPACING[3]}px`,
    fontSize: SPACING[3],
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    outline: 'none',
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Team Overview</Heading>
          <Paragraph color="textMuted">
            Consultant load, capacity and upcoming time off across the team.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="info">Avg utilization {avgUtilization}%</Badge>
          {overCapacity > 0 ? (
            <Badge variant="error">{overCapacity} over capacity</Badge>
          ) : null}
          {onPtoSoon > 0 ? (
            <Badge variant="warning">{onPtoSoon} on PTO soon</Badge>
          ) : null}
        </Flex>
      </Flex>

      {/* Filters */}
      <Card padding="4">
        <Flex justify="between" align="center" gap="4">
          <Flex align="center" gap="3">
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
          <Flex align="center" gap="3">
            <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.textSecondary }}>
              SORT BY
            </span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={selectStyle}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Flex>
        </Flex>
      </Card>

      {/* Consultant grid */}
      <Grid columns={3} gap="4">
        {consultants.map((c) => {
          const badge = utilizationBadge(c.utilization);
          const utilColor = utilizationColor(c.utilization);
          const overCapacity = c.utilization > 100;
          const available = c.utilization < 70;
          return (
            <Card key={c.id} padding="5">
              <Grid columns={1} gap="4">
                <Flex justify="between" align="start" gap="2">
                  <Flex align="center" gap="3">
                    <div
                      style={{
                        width: SPACING[10],
                        height: SPACING[10],
                        borderRadius: '50%',
                        backgroundColor: COLORS.primaryLight,
                        color: COLORS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: SPACING[4],
                        flexShrink: 0,
                      }}
                    >
                      {c.name.slice(0, 1)}
                    </div>
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 700, color: COLORS.text }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                        {c.role}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {TEAM_LABEL[c.team]}
                      </span>
                    </Grid>
                  </Flex>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </Flex>

                {/* Capacity bar */}
                <Grid columns={1} gap="1">
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="1">
                      {overCapacity ? (
                        <ArrowUp className="w-3.5 h-3.5" style={{ color: utilColor }} />
                      ) : available ? (
                        <ArrowDown className="w-3.5 h-3.5" style={{ color: utilColor }} />
                      ) : null}
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        Utilization
                      </span>
                    </Flex>
                    <span style={{ fontSize: SPACING[3], fontWeight: 700, color: utilColor }}>
                      {c.utilization}%
                    </span>
                  </Flex>
                  <div
                    style={{
                      height: SPACING[1.5],
                      backgroundColor: COLORS.borderLight,
                      borderRadius: 9999,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(c.utilization, 100)}%`,
                        height: '100%',
                        backgroundColor: utilColor,
                      }}
                    />
                  </div>
                  <Flex justify="between" align="center">
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                      {c.activeMandates} / {c.capacity} mandates
                    </span>
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                      Capacity {c.capacity}
                    </span>
                  </Flex>
                </Grid>

                {/* Active mandates */}
                <Grid columns={1} gap="1">
                  <Flex align="center" gap="1">
                    <Users className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                    <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                      CURRENT MANDATES
                    </span>
                  </Flex>
                  {c.mandates.length === 0 ? (
                    <Paragraph color="textMuted">No active mandates.</Paragraph>
                  ) : (
                    <Grid columns={1} gap="1">
                      {c.mandates.slice(0, 4).map((m) => (
                        <Flex key={m.id} justify="between" align="center" gap="2">
                          <span style={{ fontSize: SPACING[2], color: COLORS.text }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                            {m.client}
                          </span>
                        </Flex>
                      ))}
                      {c.mandates.length > 4 ? (
                        <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                          +{c.mandates.length - 4} more
                        </span>
                      ) : null}
                    </Grid>
                  )}
                </Grid>

                {/* PTO */}
                {c.upcomingPto ? (
                  <div
                    style={{
                      padding: SPACING[2],
                      borderRadius: 8,
                      backgroundColor: COLORS.warningLight,
                    }}
                  >
                    <Flex align="center" gap="2">
                      <Calendar className="w-3.5 h-3.5" style={{ color: COLORS.warningDark }} />
                      <Grid columns={1} gap="0">
                        <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.warningDark }}>
                          PTO · {c.upcomingPto.label}
                        </span>
                        <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>
                          {fmtDate(c.upcomingPto.from)} → {fmtDate(c.upcomingPto.to)}
                        </span>
                      </Grid>
                    </Flex>
                  </div>
                ) : null}
              </Grid>
            </Card>
          );
        })}
      </Grid>
    </Grid>
  );
};
