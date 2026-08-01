import React, { useState, useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Flex,
  Grid,
  Input,
  Select,
  Badge,
} from '@/components/design-system';

interface Client {
  id: string;
  name: string;
  industry: string;
  total_mandates: number;
  total_revenue_usd: number;
  last_activity: string;
  nps: number;
  open_opportunities: number;
}

const SEED_CLIENTS: Client[] = [
  { id: 'c1', name: 'Aurora Tech', industry: 'Technology', total_mandates: 4, total_revenue_usd: 480000, last_activity: '2026-07-22', nps: 9, open_opportunities: 2 },
  { id: 'c2', name: 'Meridian Capital', industry: 'Financial Services', total_mandates: 6, total_revenue_usd: 720000, last_activity: '2026-07-18', nps: 8, open_opportunities: 1 },
  { id: 'c3', name: 'Lumen Retail Group', industry: 'Consumer/Retail', total_mandates: 3, total_revenue_usd: 310000, last_activity: '2026-07-10', nps: 7, open_opportunities: 3 },
  { id: 'c4', name: 'Northwind Health', industry: 'Healthcare', total_mandates: 2, total_revenue_usd: 240000, last_activity: '2026-06-30', nps: 10, open_opportunities: 1 },
  { id: 'c5', name: 'Pinnacle Industrial', industry: 'Industrial', total_mandates: 5, total_revenue_usd: 560000, last_activity: '2026-07-25', nps: 6, open_opportunities: 2 },
  { id: 'c6', name: 'Vista Fintech', industry: 'Financial Services', total_mandates: 3, total_revenue_usd: 390000, last_activity: '2026-07-15', nps: 9, open_opportunities: 2 },
  { id: 'c7', name: 'Harbor Software', industry: 'Technology', total_mandates: 2, total_revenue_usd: 220000, last_activity: '2026-07-05', nps: 8, open_opportunities: 1 },
  { id: 'c8', name: 'Summit Consumer Brands', industry: 'Consumer/Retail', total_mandates: 4, total_revenue_usd: 440000, last_activity: '2026-07-20', nps: 7, open_opportunities: 0 },
];

const INDUSTRIES = [
  'All',
  'Technology',
  'Financial Services',
  'Consumer/Retail',
  'Healthcare',
  'Industrial',
];

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const ClientRelationships: React.FC<{
  onSelectClient?: (clientId: string) => void;
}> = ({ onSelectClient }) => {
  const [clients] = useState<Client[]>(SEED_CLIENTS);
  const [industry, setIndustry] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesIndustry = industry === 'All' || c.industry === industry;
      const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase());
      return matchesIndustry && matchesQuery;
    });
  }, [clients, industry, query]);

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Grid columns={1} gap="0">
        <Heading level={3}>Client Relationships</Heading>
        <Paragraph color="textMuted">
          Directory of active and past clients across APAC
        </Paragraph>
      </Grid>

      {/* Filters */}
      <Card padding="4">
        <Grid columns={3} gap="4">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client name"
          />
          <Select
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
          <Flex align="end" gap="2">
            <Badge variant="info">{filtered.length} clients</Badge>
          </Flex>
        </Grid>
      </Card>

      {/* Table */}
      <Card padding="0">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Client', 'Industry', 'Total Mandates', 'Total Revenue', 'Last Activity', 'NPS', 'Open Opps'].map(
                (h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectClient?.(c.id)}
                style={{
                  cursor: 'pointer',
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={tdStyle}>
                  <Flex align="center" gap="2">
                    <Building2 className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                  </Flex>
                </td>
                <td style={tdStyle}>{c.industry}</td>
                <td style={tdStyle}>{c.total_mandates}</td>
                <td style={tdStyle}>{currency(c.total_revenue_usd)}</td>
                <td style={tdStyle}>{c.last_activity}</td>
                <td style={tdStyle}>
                  <Badge variant={c.nps >= 9 ? 'success' : c.nps >= 7 ? 'info' : 'warning'}>
                    {c.nps}
                  </Badge>
                </td>
                <td style={tdStyle}>{c.open_opportunities}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={7}>
                  <Paragraph color="textMuted">No clients match your filters.</Paragraph>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

export default ClientRelationships;
