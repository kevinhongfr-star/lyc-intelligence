import React from 'react';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Flex,
  Grid,
  Badge,
  StatCard,
} from '@/components/design-system';

interface MonthForecast {
  month: string;
  weighted: number;
}

interface ForecastOpportunity {
  id: string;
  title: string;
  client: string;
  stage: string;
  fee_usd: number;
  probability: number;
  expected_close: string;
}

interface StageDistribution {
  stage: string;
  count: number;
  value: number;
}

const SEED_MONTHS: MonthForecast[] = [
  { month: 'Aug 2026', weighted: 145000 },
  { month: 'Sep 2026', weighted: 210000 },
  { month: 'Oct 2026', weighted: 178000 },
  { month: 'Nov 2026', weighted: 265000 },
  { month: 'Dec 2026', weighted: 192000 },
  { month: 'Jan 2027', weighted: 158000 },
];

const SEED_TOP_OPPORTUNITIES: ForecastOpportunity[] = [
  { id: 'o1', title: 'VP Sales, APAC', client: 'Aurora Tech', stage: 'Proposal Sent', fee_usd: 110000, probability: 60, expected_close: 'Sep 2026' },
  { id: 'o2', title: 'CFO', client: 'Meridian Capital', stage: 'Negotiation', fee_usd: 140000, probability: 75, expected_close: 'Aug 2026' },
  { id: 'o3', title: 'Head of Product', client: 'Lumen Retail', stage: 'Meeting Done', fee_usd: 95000, probability: 45, expected_close: 'Oct 2026' },
  { id: 'o4', title: 'CTO', client: 'Vista Fintech', stage: 'Proposal Sent', fee_usd: 160000, probability: 50, expected_close: 'Nov 2026' },
  { id: 'o5', title: 'GM, China', client: 'Northwind Health', stage: 'Prospect', fee_usd: 150000, probability: 25, expected_close: 'Dec 2026' },
];

const SEED_STAGE_DISTRIBUTION: StageDistribution[] = [
  { stage: 'Prospect', count: 8, value: 920000 },
  { stage: 'Meeting Booked', count: 5, value: 540000 },
  { stage: 'Meeting Done', count: 4, value: 410000 },
  { stage: 'Proposal Sent', count: 3, value: 365000 },
  { stage: 'Negotiation', count: 2, value: 280000 },
  { stage: 'Won', count: 1, value: 120000 },
];

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const BDForecast: React.FC = () => {
  const totalWeighted = SEED_MONTHS.reduce((sum, m) => sum + m.weighted, 0);
  const maxMonth = Math.max(...SEED_MONTHS.map((m) => m.weighted), 1);
  const totalPipeline = SEED_STAGE_DISTRIBUTION.reduce((sum, s) => sum + s.value, 0);
  const maxStage = Math.max(...SEED_STAGE_DISTRIBUTION.map((s) => s.value), 1);
  const totalDeals = SEED_STAGE_DISTRIBUTION.reduce((sum, s) => sum + s.count, 0);

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Grid columns={1} gap="0">
        <Heading level={3}>Revenue Forecast</Heading>
        <Paragraph color="textMuted">
          Weighted pipeline projection for the next 6 months
        </Paragraph>
      </Grid>

      {/* Top stats */}
      <Grid columns={3} gap="4">
        <StatCard
          title="Total Weighted Pipeline"
          value={currency(totalWeighted)}
          icon={<DollarSign className="w-5 h-5" style={{ color: COLORS.primary }} />}
        />
        <StatCard
          title="Total Pipeline Value"
          value={currency(totalPipeline)}
          icon={<TrendingUp className="w-5 h-5" style={{ color: COLORS.info }} />}
        />
        <StatCard
          title="Active Opportunities"
          value={totalDeals}
          icon={<Target className="w-5 h-5" style={{ color: COLORS.success }} />}
        />
      </Grid>

      {/* By month bar chart */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex align="center" gap="2">
            <BarChart3 className="w-5 h-5" style={{ color: COLORS.primary }} />
            <Heading level={5}>Weighted Pipeline by Month</Heading>
          </Flex>
          <Grid columns={1} gap="3">
            {SEED_MONTHS.map((m) => {
              const pct = Math.round((m.weighted / maxMonth) * 100);
              return (
                <div key={m.month}>
                  <Flex justify="between" align="center">
                    <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                      {m.month}
                    </span>
                    <span style={{ fontSize: `${SPACING[3]}px`, fontWeight: 600, color: COLORS.text }}>
                      {currency(m.weighted)}
                    </span>
                  </Flex>
                  <div
                    style={{
                      marginTop: SPACING[1],
                      height: SPACING[2],
                      backgroundColor: COLORS.borderLight,
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: COLORS.primary }} />
                  </div>
                </div>
              );
            })}
          </Grid>
        </Grid>
      </Card>

      {/* By stage distribution */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>By Stage Distribution</Heading>
          <Grid columns={1} gap="3">
            {SEED_STAGE_DISTRIBUTION.map((s) => {
              const pct = Math.round((s.value / maxStage) * 100);
              return (
                <div key={s.stage}>
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="2">
                      <Badge variant="default">{s.stage}</Badge>
                      <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                        {s.count} deals
                      </span>
                    </Flex>
                    <span style={{ fontSize: `${SPACING[3]}px`, fontWeight: 600, color: COLORS.text }}>
                      {currency(s.value)}
                    </span>
                  </Flex>
                  <div
                    style={{
                      marginTop: SPACING[1],
                      height: SPACING[2],
                      backgroundColor: COLORS.borderLight,
                      borderRadius: 9999,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: COLORS.info }} />
                  </div>
                </div>
              );
            })}
          </Grid>
        </Grid>
      </Card>

      {/* Top 5 opportunities */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Top 5 Opportunities</Heading>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Opportunity', 'Client', 'Stage', 'Fee', 'Prob.', 'Expected Close'].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEED_TOP_OPPORTUNITIES.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={tdStyle}>{o.title}</td>
                  <td style={tdStyle}>{o.client}</td>
                  <td style={tdStyle}>
                    <Badge variant="default">{o.stage}</Badge>
                  </td>
                  <td style={tdStyle}>{currency(o.fee_usd)}</td>
                  <td style={tdStyle}>{o.probability}%</td>
                  <td style={tdStyle}>{o.expected_close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Grid>
      </Card>
    </Grid>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: `${SPACING[3]}px ${SPACING[4]}px`,
  fontSize: `${SPACING[3]}px`,
  fontWeight: 600,
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.bg,
};

const tdStyle: React.CSSProperties = {
  padding: `${SPACING[4]}px`,
  fontSize: `${SPACING[3]}px`,
  color: COLORS.text,
};

export default BDForecast;
