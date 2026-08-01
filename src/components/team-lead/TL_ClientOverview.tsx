import React, { useMemo, useState } from 'react';
import { Building2, Filter, Star, Phone, MapPin, ArrowUp, ArrowDown } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Badge,
  Flex,
  Grid,
} from '@/components/design-system';

interface ClientRow {
  id: string;
  name: string;
  industry: string;
  accountManager: string;
  activeMandates: number;
  totalRevenueYtd: number;
  nps: number;
  lastTouch: string;
  hqCity?: string;
  phone?: string;
}

const INDUSTRIES = [
  'Financial Services',
  'Industrial & Operations',
  'Technology & Product',
  'Healthcare',
  'Logistics',
];

const NPS_BANDS: { value: 'all' | 'promoter' | 'passive' | 'detractor'; label: string }[] = [
  { value: 'all', label: 'All NPS' },
  { value: 'promoter', label: 'Promoters (9–10)' },
  { value: 'passive', label: 'Passive (7–8)' },
  { value: 'detractor', label: 'Detractors (0–6)' },
];

const SEED_CLIENTS: ClientRow[] = [
  {
    id: 'CL-001',
    name: 'Northwind Capital',
    industry: 'Financial Services',
    accountManager: 'Marie Lavoie',
    activeMandates: 3,
    totalRevenueYtd: 485000,
    nps: 10,
    lastTouch: '2026-07-30',
    hqCity: 'Toronto, ON',
    phone: '+1 (416) 555-0142',
  },
  {
    id: 'CL-002',
    name: 'Cedar Health Group',
    industry: 'Healthcare',
    accountManager: 'Priya Nair',
    activeMandates: 4,
    totalRevenueYtd: 612000,
    nps: 9,
    lastTouch: '2026-07-29',
    hqCity: 'Montréal, QC',
    phone: '+1 (514) 555-0188',
  },
  {
    id: 'CL-003',
    name: 'Helix Manufacturing',
    industry: 'Industrial & Operations',
    accountManager: 'Daniel Otieno',
    activeMandates: 3,
    totalRevenueYtd: 338000,
    nps: 8,
    lastTouch: '2026-07-28',
    hqCity: 'Hamilton, ON',
    phone: '+1 (905) 555-0173',
  },
  {
    id: 'CL-004',
    name: 'Aethel Partners',
    industry: 'Financial Services',
    accountManager: 'Marie Lavoie',
    activeMandates: 2,
    totalRevenueYtd: 245000,
    nps: 6,
    lastTouch: '2026-07-15',
    hqCity: 'Calgary, AB',
    phone: '+1 (403) 555-0119',
  },
  {
    id: 'CL-005',
    name: 'Brightwave Logistics',
    industry: 'Logistics',
    accountManager: 'Priya Nair',
    activeMandates: 3,
    totalRevenueYtd: 290000,
    nps: 7,
    lastTouch: '2026-07-26',
    hqCity: 'Vancouver, BC',
    phone: '+1 (604) 555-0156',
  },
  {
    id: 'CL-006',
    name: 'Quill & Vale Studio',
    industry: 'Technology & Product',
    accountManager: 'Aïcha Benali',
    activeMandates: 1,
    totalRevenueYtd: 95000,
    nps: 9,
    lastTouch: '2026-07-22',
    hqCity: 'Ottawa, ON',
    phone: '+1 (613) 555-0134',
  },
  {
    id: 'CL-007',
    name: 'Maritime Federal Credit Union',
    industry: 'Financial Services',
    accountManager: 'Marie Lavoie',
    activeMandates: 2,
    totalRevenueYtd: 168000,
    nps: 5,
    lastTouch: '2026-06-30',
    hqCity: 'Halifax, NS',
    phone: '+1 (902) 555-0177',
  },
  {
    id: 'CL-008',
    name: 'Greenfield BioSciences',
    industry: 'Healthcare',
    accountManager: 'Aïcha Benali',
    activeMandates: 2,
    totalRevenueYtd: 215000,
    nps: 10,
    lastTouch: '2026-07-31',
    hqCity: 'Toronto, ON',
    phone: '+1 (416) 555-0201',
  },
];

const npsBand = (nps: number): 'promoter' | 'passive' | 'detractor' => {
  if (nps >= 9) return 'promoter';
  if (nps >= 7) return 'passive';
  return 'detractor';
};

const npsBadgeVariant = (nps: number): 'success' | 'warning' | 'error' => {
  const band = npsBand(nps);
  if (band === 'promoter') return 'success';
  if (band === 'passive') return 'warning';
  return 'error';
};

const fmtCurrency = (v: number) => `$${v.toLocaleString('en-CA')}`;

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysSince = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  const today = new Date('2026-08-01');
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
};

export const TL_ClientOverview: React.FC = () => {
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [npsFilter, setNpsFilter] = useState<'all' | 'promoter' | 'passive' | 'detractor'>('all');

  const filtered = useMemo(
    () =>
      SEED_CLIENTS.filter((c) => {
        if (industryFilter !== 'all' && c.industry !== industryFilter) return false;
        if (npsFilter !== 'all' && npsBand(c.nps) !== npsFilter) return false;
        return true;
      }),
    [industryFilter, npsFilter],
  );

  const totalRevenue = filtered.reduce((s, c) => s + c.totalRevenueYtd, 0);
  const avgNps = filtered.length
    ? (filtered.reduce((s, c) => s + c.nps, 0) / filtered.length).toFixed(1)
    : '—';
  const detractors = filtered.filter((c) => npsBand(c.nps) === 'detractor').length;
  const revenueDelta = totalRevenue > 400000 ? 'up' : totalRevenue > 250000 ? 'flat' : 'down';

  const selectStyle: React.CSSProperties = {
    padding: `${SPACING[2]}px ${SPACING[3]}px`,
    fontSize: SPACING[3],
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    outline: 'none',
  };

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
    verticalAlign: 'top',
  };

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Flex justify="between" align="center">
        <Grid columns={1} gap="0">
          <Heading level={3}>Client Overview</Heading>
          <Paragraph color="textMuted">
            Active client portfolio across industries, with NPS and last-touch recency.
          </Paragraph>
        </Grid>
        <Flex align="center" gap="3">
          <Badge variant="info">{filtered.length} clients</Badge>
          <Badge variant="success">Avg NPS {avgNps}</Badge>
          {detractors > 0 ? <Badge variant="error">{detractors} detractor{detractors > 1 ? 's' : ''}</Badge> : null}
        </Flex>
      </Flex>

      {/* Filters */}
      <Card padding="4">
        <Flex justify="between" align="center" gap="4">
          <Flex align="center" gap="3">
            <Filter className="w-4 h-4" style={{ color: COLORS.textMuted }} />
            <Flex align="center" gap="2">
              <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.textSecondary }}>
                INDUSTRY
              </span>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All industries</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Flex>
            <Flex align="center" gap="2">
              <span style={{ fontSize: SPACING[2], fontWeight: 600, color: COLORS.textSecondary }}>
                NPS
              </span>
              <select
                value={npsFilter}
                onChange={(e) => setNpsFilter(e.target.value as typeof npsFilter)}
                style={selectStyle}
              >
                {NPS_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Flex>
          </Flex>
          <Flex align="center" gap="2">
            {revenueDelta === 'up' ? (
              <ArrowUp className="w-3.5 h-3.5" style={{ color: COLORS.success }} />
            ) : revenueDelta === 'down' ? (
              <ArrowDown className="w-3.5 h-3.5" style={{ color: COLORS.error }} />
            ) : null}
            <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
              Revenue YTD {fmtCurrency(totalRevenue)}
            </span>
          </Flex>
        </Flex>
      </Card>

      {/* Table */}
      <Card padding="0">
        {filtered.length === 0 ? (
          <div style={{ padding: SPACING[8], textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2">
              <Building2 className="w-5 h-5" style={{ color: COLORS.textMuted }} />
              <Paragraph color="textMuted">No clients match these filters.</Paragraph>
            </Flex>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={headerCell}>Client</th>
                  <th style={headerCell}>Industry</th>
                  <th style={headerCell}>Account Manager</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>Active Mandates</th>
                  <th style={{ ...headerCell, textAlign: 'right' }}>Revenue (YTD)</th>
                  <th style={headerCell}>NPS</th>
                  <th style={headerCell}>Last Touch</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const since = daysSince(c.lastTouch);
                  const stale = since > 21;
                  return (
                    <tr key={c.id}>
                      <td style={cellStyle}>
                        <Flex align="center" gap="3">
                          <div
                            style={{
                              width: SPACING[8],
                              height: SPACING[8],
                              borderRadius: 8,
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
                            {c.name.slice(0, 1)}
                          </div>
                          <Grid columns={1} gap="0">
                            <span style={{ fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                            {c.hqCity ? (
                              <Flex align="center" gap="1">
                                <MapPin className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                                <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                                  {c.hqCity}
                                </span>
                              </Flex>
                            ) : null}
                            {c.phone ? (
                              <Flex align="center" gap="1">
                                <Phone className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                                <span style={{ fontSize: SPACING[2], color: COLORS.textMuted }}>
                                  {c.phone}
                                </span>
                              </Flex>
                            ) : null}
                          </Grid>
                        </Flex>
                      </td>
                      <td style={cellStyle}>{c.industry}</td>
                      <td style={cellStyle}>{c.accountManager}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                        {c.activeMandates}
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 600 }}>
                        {fmtCurrency(c.totalRevenueYtd)}
                      </td>
                      <td style={cellStyle}>
                        <Flex align="center" gap="2">
                          <Flex align="center" gap="1">
                            <Star
                              className="w-3.5 h-3.5"
                              style={{ color: npsBand(c.nps) === 'promoter' ? COLORS.warning : COLORS.textMuted }}
                              fill={npsBand(c.nps) === 'promoter' ? COLORS.warning : 'none'}
                            />
                            <span style={{ fontSize: SPACING[3], fontWeight: 700, color: COLORS.text }}>
                              {c.nps}
                            </span>
                          </Flex>
                          <Badge variant={npsBadgeVariant(c.nps)}>
                            {npsBand(c.nps)}
                          </Badge>
                        </Flex>
                      </td>
                      <td style={cellStyle}>
                        <Grid columns={1} gap="0">
                          <span style={{ fontSize: SPACING[3], color: COLORS.text }}>
                            {fmtDate(c.lastTouch)}
                          </span>
                          <span
                            style={{
                              fontSize: SPACING[2],
                              color: stale ? COLORS.error : COLORS.textMuted,
                              fontWeight: stale ? 600 : 400,
                            }}
                          >
                            {since}d ago{stale ? ' · stale' : ''}
                          </span>
                        </Grid>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Grid>
  );
};
