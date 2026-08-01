import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Briefcase,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

type MandateType = 'executive_search' | 'advisory' | 'workshop';

interface MonthlyRevenue {
  month: string;
  collected: number;
  forecast: number;
}

interface RevenueByType {
  type: MandateType;
  label: string;
  amount: number;
  count: number;
}

interface TopMandate {
  id: string;
  name: string;
  client: string;
  type: MandateType;
  collected: number;
}

interface OutstandingInvoice {
  id: string;
  client: string;
  mandate: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
}

const TYPE_LABEL: Record<MandateType, string> = {
  executive_search: 'Executive Search',
  advisory: 'Advisory',
  workshop: 'Workshop',
};

const TYPE_COLOR: Record<MandateType, string> = {
  executive_search: COLORS.primary,
  advisory: COLORS.info,
  workshop: COLORS.warning,
};

const MONTHLY: MonthlyRevenue[] = [
  { month: 'Mar', collected: 285000, forecast: 320000 },
  { month: 'Apr', collected: 342000, forecast: 360000 },
  { month: 'May', collected: 298000, forecast: 310000 },
  { month: 'Jun', collected: 410000, forecast: 400000 },
  { month: 'Jul', collected: 468000, forecast: 440000 },
  { month: 'Aug', collected: 0, forecast: 495000 },
];

const REVENUE_BY_TYPE: RevenueByType[] = [
  { type: 'executive_search', label: 'Executive Search', amount: 1280000, count: 14 },
  { type: 'advisory', label: 'Advisory', amount: 520000, count: 6 },
  { type: 'workshop', label: 'Workshop', amount: 185000, count: 9 },
];

const TOP_MANDATES: TopMandate[] = [
  { id: 'M-501', name: 'Chief Digital Officer', client: 'Cedar Health Group', type: 'executive_search', collected: 195000 },
  { id: 'M-502', name: 'CTO Search', client: 'Northwind Capital', type: 'executive_search', collected: 210000 },
  { id: 'M-101', name: 'CFO Search', client: 'Northwind Capital', type: 'executive_search', collected: 180000 },
  { id: 'M-302', name: 'CIO Search', client: 'Cedar Health Group', type: 'executive_search', collected: 150000 },
  { id: 'M-201', name: 'VP Operations', client: 'Helix Manufacturing', type: 'executive_search', collected: 145000 },
];

const OUTSTANDING: OutstandingInvoice[] = [
  { id: 'INV-2026-014', client: 'Aethel Partners', mandate: 'COO Search', amount: 55000, dueDate: '2026-07-15', daysOverdue: 17 },
  { id: 'INV-2026-018', client: 'Brightwave Logistics', mandate: 'CPO Search', amount: 45000, dueDate: '2026-07-22', daysOverdue: 10 },
  { id: 'INV-2026-021', client: 'Cedar Health Group', mandate: 'Board refresh', amount: 40000, dueDate: '2026-08-01', daysOverdue: 0 },
  { id: 'INV-2026-023', client: 'Helix Manufacturing', mandate: 'VP Operations', amount: 48333, dueDate: '2026-08-05', daysOverdue: 0 },
];

const PIPELINE_TOTAL = 2485000;
const WEIGHTED_FORECAST = 1786000;
const QUARTER_COLLECTED = MONTHLY.slice(0, 5).reduce((s, m) => s + m.collected, 0) + 312000;
const OUTSTANDING_TOTAL = OUTSTANDING.reduce((s, i) => s + i.amount, 0);

const fmtCurrency = (v: number) => `$${v.toLocaleString('en-CA')}`;
const fmtCompact = (v: number) => {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}K`;
  return `$${v}`;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

export const TL_RevenueDashboard: React.FC = () => {
  const maxMonthly = Math.max(...MONTHLY.map((m) => Math.max(m.collected, m.forecast)));
  const totalByType = REVENUE_BY_TYPE.reduce((s, t) => s + t.amount, 0);
  const overdueCount = OUTSTANDING.filter((i) => i.daysOverdue > 0).length;

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Revenue Dashboard</Heading>
          <Paragraph color="textMuted">
            Pipeline, forecast, collections and outstanding invoices across the team.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="success">
            <Flex align="center" gap="1">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% QoQ
            </Flex>
          </Badge>
          {overdueCount > 0 ? (
            <Badge variant="error">{overdueCount} overdue</Badge>
          ) : null}
        </Flex>
      </Flex>

      {/* Section 1: Revenue summary cards */}
      <Grid columns={4} gap="4">
        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total pipeline
              </span>
              <span style={{ fontSize: SPACING[8], fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>
                {fmtCompact(PIPELINE_TOTAL)}
              </span>
              <Flex align="center" gap="1">
                <TrendingUp className="w-3 h-3" style={{ color: COLORS.success }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.success }}>+$285K vs last mo</span>
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
              <DollarSign className="w-5 h-5" style={{ color: COLORS.primary }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weighted forecast
              </span>
              <span style={{ fontSize: SPACING[8], fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>
                {fmtCompact(WEIGHTED_FORECAST)}
              </span>
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                72% of pipeline
              </span>
            </Grid>
            <div
              style={{
                width: SPACING[10],
                height: SPACING[10],
                borderRadius: 12,
                backgroundColor: COLORS.infoLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.info }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Collected this quarter
              </span>
              <span style={{ fontSize: SPACING[8], fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>
                {fmtCompact(QUARTER_COLLECTED)}
              </span>
              <Flex align="center" gap="1">
                <TrendingUp className="w-3 h-3" style={{ color: COLORS.success }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.success }}>+18% vs prev Q</span>
              </Flex>
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
              <DollarSign className="w-5 h-5" style={{ color: COLORS.success }} />
            </div>
          </Flex>
        </Card>

        <Card padding="5">
          <Flex justify="between" align="start" gap="2">
            <Grid columns={1} gap="1">
              <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Outstanding invoices
              </span>
              <span style={{ fontSize: SPACING[8], fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>
                {fmtCompact(OUTSTANDING_TOTAL)}
              </span>
              <Flex align="center" gap="1">
                {overdueCount > 0 ? (
                  <>
                    <TrendingDown className="w-3 h-3" style={{ color: COLORS.error }} />
                    <span style={{ fontSize: SPACING[2], color: COLORS.error }}>{overdueCount} overdue</span>
                  </>
                ) : (
                  <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>All on schedule</span>
                )}
              </Flex>
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
              <AlertTriangle className="w-5 h-5" style={{ color: COLORS.error }} />
            </div>
          </Flex>
        </Card>
      </Grid>

      {/* Section 2: Monthly revenue trend (bar chart) */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex justify="between" align="center">
            <Grid columns={1} gap="0">
              <Heading level={5}>Monthly revenue trend</Heading>
              <Paragraph color="textMuted">Collected vs forecast, last 6 months.</Paragraph>
            </Grid>
            <Flex align="center" gap="3">
              <Flex align="center" gap="1">
                <span style={{ width: SPACING[3], height: SPACING[2], backgroundColor: COLORS.primary, display: 'inline-block', borderRadius: 2 }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>Collected</span>
              </Flex>
              <Flex align="center" gap="1">
                <span style={{ width: SPACING[3], height: SPACING[2], backgroundColor: COLORS.borderLight, display: 'inline-block', borderRadius: 2 }} />
                <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>Forecast</span>
              </Flex>
            </Flex>
          </Flex>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: SPACING[4],
              height: 220,
              padding: `${SPACING[4]}px 0`,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {MONTHLY.map((m) => {
              const collectedH = Math.round((m.collected / maxMonthly) * 180);
              const forecastH = Math.round((m.forecast / maxMonthly) * 180);
              return (
                <div
                  key={m.month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: SPACING[2],
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: SPACING[1],
                      height: 180,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: Math.max(collectedH, 2),
                        backgroundColor: COLORS.primary,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 200ms ease-out',
                      }}
                      title={`Collected ${fmtCurrency(m.collected)}`}
                    />
                    <div
                      style={{
                        width: 18,
                        height: Math.max(forecastH, 2),
                        backgroundColor: COLORS.borderLight,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 200ms ease-out',
                      }}
                      title={`Forecast ${fmtCurrency(m.forecast)}`}
                    />
                  </div>
                  <span style={{ fontSize: SPACING[2], color: COLORS.textSecondary }}>{m.month}</span>
                  <span style={{ fontSize: SPACING[2], color: COLORS.textMuted, fontWeight: 600 }}>
                    {m.collected > 0 ? fmtCompact(m.collected) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </Grid>
      </Card>

      {/* Section 3: Revenue by mandate type + Top mandates */}
      <Grid columns={2} gap="6">
        {/* Revenue by type */}
        <Card padding="6">
          <Grid columns={1} gap="4">
            <Heading level={5}>Revenue by mandate type</Heading>
            {REVENUE_BY_TYPE.map((t) => {
              const pct = totalByType ? Math.round((t.amount / totalByType) * 100) : 0;
              return (
                <Grid columns={1} gap="1" key={t.type}>
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="2">
                      <span
                        style={{
                          width: SPACING[3],
                          height: SPACING[3],
                          borderRadius: 4,
                          backgroundColor: TYPE_COLOR[t.type],
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        · {t.count} mandates
                      </span>
                    </Flex>
                    <Flex align="center" gap="2">
                      <span style={{ fontSize: SPACING[3], fontWeight: 700, color: COLORS.text }}>
                        {fmtCurrency(t.amount)}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>{pct}%</span>
                    </Flex>
                  </Flex>
                  <div
                    style={{
                      height: SPACING[2],
                      backgroundColor: COLORS.borderLight,
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: TYPE_COLOR[t.type],
                      }}
                    />
                  </div>
                </Grid>
              );
            })}
          </Grid>
        </Card>

        {/* Top 5 mandates */}
        <Card padding="6">
          <Grid columns={1} gap="4">
            <Flex justify="between" align="center">
              <Heading level={5}>Top 5 revenue mandates</Heading>
              <Briefcase className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            </Flex>
            <Grid columns={1} gap="2">
              {TOP_MANDATES.map((m, idx) => (
                <Flex
                  key={m.id}
                  justify="between"
                  align="center"
                  gap="3"
                  style={{
                    padding: `${SPACING[2]}px 0`,
                    borderBottom: `1px solid ${COLORS.borderLight}`,
                  }}
                >
                  <Flex align="center" gap="3">
                    <span
                      style={{
                        width: SPACING[6],
                        height: SPACING[6],
                        borderRadius: '50%',
                        backgroundColor: COLORS.primaryLight,
                        color: COLORS.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: SPACING[3],
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <Grid columns={1} gap="0">
                      <span style={{ fontSize: SPACING[3], fontWeight: 600, color: COLORS.text }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                        {m.client} · {TYPE_LABEL[m.type]}
                      </span>
                    </Grid>
                  </Flex>
                  <span style={{ fontSize: SPACING[3], fontWeight: 700, color: COLORS.primary }}>
                    {fmtCurrency(m.collected)}
                  </span>
                </Flex>
              ))}
            </Grid>
          </Grid>
        </Card>
      </Grid>

      {/* Section 4: Outstanding invoices */}
      <Card padding="0">
        <div style={{ padding: `${SPACING[5]}px ${SPACING[6]}px 0` }}>
          <Flex justify="between" align="center">
            <Grid columns={1} gap="0">
              <Heading level={5}>Outstanding invoices</Heading>
              <Paragraph color="textMuted">
                Total outstanding {fmtCurrency(OUTSTANDING_TOTAL)} · {overdueCount} overdue.
              </Paragraph>
            </Grid>
          </Flex>
        </div>
        <div style={{ overflowX: 'auto', marginTop: SPACING[4] }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Invoice</th>
                <th style={headerCellStyle}>Client</th>
                <th style={headerCellStyle}>Mandate</th>
                <th style={{ ...headerCellStyle, textAlign: 'right' }}>Amount</th>
                <th style={headerCellStyle}>Due</th>
                <th style={headerCellStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {OUTSTANDING.map((inv) => {
                const overdue = inv.daysOverdue > 0;
                return (
                  <tr key={inv.id}>
                    <td style={cellStyle}>
                      <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>{inv.id}</span>
                    </td>
                    <td style={cellStyle}>{inv.client}</td>
                    <td style={cellStyle}>{inv.mandate}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                      {fmtCurrency(inv.amount)}
                    </td>
                    <td style={cellStyle}>
                      <Flex align="center" gap="1">
                        <Clock className="w-3.5 h-3.5" style={{ color: COLORS.textMuted }} />
                        {fmtDate(inv.dueDate)}
                      </Flex>
                    </td>
                    <td style={cellStyle}>
                      {overdue ? (
                        <Badge variant="error">{inv.daysOverdue}d overdue</Badge>
                      ) : (
                        <Badge variant="success">On schedule</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Grid>
  );
};

const headerCellStyle: React.CSSProperties = {
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
