import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Building2, Users } from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Flex,
  Grid,
  Select,
  Badge,
} from '@/components/design-system';

interface IndustryTrend {
  industry: string;
  sector: string;
  trend_pct: number; // positive = growth
  summary: string;
}

interface CompanyRanking {
  id: string;
  name: string;
  sector: string;
  rank: number;
  employees: string;
  growth: number;
}

interface TalentCategory {
  role: string;
  sector: string;
  supply: 'Low' | 'Medium' | 'High';
  demand: 'Low' | 'Medium' | 'High';
  notes: string;
}

const SECTORS = [
  'All',
  'Technology',
  'Financial Services',
  'Consumer/Retail',
  'Healthcare',
  'Industrial',
];

const SEED_TRENDS: IndustryTrend[] = [
  { industry: 'Enterprise SaaS', sector: 'Technology', trend_pct: 12, summary: 'APAC SaaS hiring up as digital transformation accelerates.' },
  { industry: 'Asset Management', sector: 'Financial Services', trend_pct: 5, summary: 'Steady demand for portfolio and risk leaders.' },
  { industry: 'D2C Retail', sector: 'Consumer/Retail', trend_pct: -3, summary: 'Softening consumer spend slows expansion hiring.' },
  { industry: 'Biotech', sector: 'Healthcare', trend_pct: 8, summary: 'Funding rounds drive demand for R&D and commercial heads.' },
  { industry: 'Advanced Manufacturing', sector: 'Industrial', trend_pct: 4, summary: 'Automation and supply chain roles on the rise.' },
];

const SEED_COMPANIES: CompanyRanking[] = [
  { id: 'co1', name: 'Aurora Tech', sector: 'Technology', rank: 1, employees: '500-1000', growth: 18 },
  { id: 'co2', name: 'Harbor Software', sector: 'Technology', rank: 2, employees: '200-500', growth: 14 },
  { id: 'co3', name: 'Vista Fintech', sector: 'Financial Services', rank: 1, employees: '200-500', growth: 11 },
  { id: 'co4', name: 'Meridian Capital', sector: 'Financial Services', rank: 2, employees: '1000-5000', growth: 6 },
  { id: 'co5', name: 'Lumen Retail Group', sector: 'Consumer/Retail', rank: 1, employees: '1000-5000', growth: -2 },
  { id: 'co6', name: 'Summit Consumer Brands', sector: 'Consumer/Retail', rank: 2, employees: '5000+', growth: 3 },
  { id: 'co7', name: 'Northwind Health', sector: 'Healthcare', rank: 1, employees: '200-500', growth: 9 },
  { id: 'co8', name: 'Pinnacle Industrial', sector: 'Industrial', rank: 1, employees: '1000-5000', growth: 5 },
  { id: 'co9', name: 'Apex Robotics', sector: 'Industrial', rank: 2, employees: '500-1000', growth: 7 },
];

const SEED_TALENT: TalentCategory[] = [
  { role: 'VP Sales, APAC', sector: 'Technology', supply: 'Low', demand: 'High', notes: 'Bilingual leaders scarce; 3:1 demand ratio.' },
  { role: 'CFO', sector: 'Financial Services', supply: 'Medium', demand: 'High', notes: 'IPO-ready CFOs in short supply.' },
  { role: 'Head of Product', sector: 'Technology', supply: 'Medium', demand: 'High', notes: 'Strong demand for 0-to-1 builders.' },
  { role: 'Head of D2C', sector: 'Consumer/Retail', supply: 'High', demand: 'Medium', notes: 'Pool growing but quality mixed.' },
  { role: 'VP R&D', sector: 'Healthcare', supply: 'Low', demand: 'High', notes: 'PhD + commercial experience is a rare combo.' },
  { role: 'Supply Chain Director', sector: 'Industrial', supply: 'Medium', demand: 'Medium', notes: 'Balanced market; automation skills valued.' },
];

const supplyDemandVariant = (level: 'Low' | 'Medium' | 'High') =>
  level === 'High' ? 'success' : level === 'Medium' ? 'warning' : 'error';

export const BDMarketIntel: React.FC = () => {
  const [sector, setSector] = useState('All');

  const trends = useMemo(
    () => SEED_TRENDS.filter((t) => sector === 'All' || t.sector === sector),
    [sector]
  );
  const companies = useMemo(
    () => SEED_COMPANIES.filter((c) => sector === 'All' || c.sector === sector),
    [sector]
  );
  const talent = useMemo(
    () => SEED_TALENT.filter((t) => sector === 'All' || t.sector === sector),
    [sector]
  );

  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Grid columns={1} gap="0">
        <Heading level={3}>Market Intelligence</Heading>
        <Paragraph color="textMuted">
          Industry trends, company rankings and talent landscape for pitch prep
        </Paragraph>
      </Grid>

      {/* Filter */}
      <Card padding="4">
        <Select label="Sector" value={sector} onChange={(e) => setSector(e.target.value)}>
          {SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Card>

      {/* Industry Trends */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex align="center" gap="2">
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
            <Heading level={5}>Industry Trends</Heading>
          </Flex>
          {trends.length === 0 ? (
            <Paragraph color="textMuted">No trends for this sector.</Paragraph>
          ) : (
            <Grid columns={3} gap="4">
              {trends.map((t) => {
                const positive = t.trend_pct >= 0;
                return (
                  <Card key={t.industry} variant="outline" padding="4">
                    <Grid columns={1} gap="2">
                      <Flex justify="between" align="center">
                        <span style={{ fontWeight: 600, color: COLORS.text }}>{t.industry}</span>
                        <Flex align="center" gap="1">
                          {positive ? (
                            <ArrowUp className="w-3 h-3" style={{ color: COLORS.success }} />
                          ) : (
                            <ArrowDown className="w-3 h-3" style={{ color: COLORS.error }} />
                          )}
                          <span
                            style={{
                              fontSize: `${SPACING[3]}px`,
                              fontWeight: 600,
                              color: positive ? COLORS.success : COLORS.error,
                            }}
                          >
                            {positive ? '+' : ''}
                            {t.trend_pct}%
                          </span>
                        </Flex>
                      </Flex>
                      <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                        {t.summary}
                      </span>
                      <Badge variant="default">{t.sector}</Badge>
                    </Grid>
                  </Card>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Company Rankings */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex align="center" gap="2">
            <Building2 className="w-5 h-5" style={{ color: COLORS.primary }} />
            <Heading level={5}>Company Rankings</Heading>
          </Flex>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Rank', 'Company', 'Sector', 'Employees', 'Growth'].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => {
                const positive = c.growth >= 0;
                return (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <td style={tdStyle}>{c.rank}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                    </td>
                    <td style={tdStyle}>{c.sector}</td>
                    <td style={tdStyle}>{c.employees}</td>
                    <td style={tdStyle}>
                      <Flex align="center" gap="1">
                        {positive ? (
                          <ArrowUp className="w-3 h-3" style={{ color: COLORS.success }} />
                        ) : (
                          <ArrowDown className="w-3 h-3" style={{ color: COLORS.error }} />
                        )}
                        <span style={{ color: positive ? COLORS.success : COLORS.error }}>
                          {positive ? '+' : ''}
                          {c.growth}%
                        </span>
                      </Flex>
                    </td>
                  </tr>
                );
              })}
              {companies.length === 0 && (
                <tr>
                  <td style={tdStyle} colSpan={5}>
                    <Paragraph color="textMuted">No companies for this sector.</Paragraph>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Grid>
      </Card>

      {/* Talent Landscape */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Flex align="center" gap="2">
            <Users className="w-5 h-5" style={{ color: COLORS.primary }} />
            <Heading level={5}>Talent Landscape</Heading>
          </Flex>
          {talent.length === 0 ? (
            <Paragraph color="textMuted">No talent data for this sector.</Paragraph>
          ) : (
            <Grid columns={3} gap="4">
              {talent.map((t) => (
                <Card key={t.role} variant="outline" padding="4">
                  <Grid columns={1} gap="2">
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{t.role}</span>
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="1">
                        <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>Supply</span>
                        <Badge variant={supplyDemandVariant(t.supply)}>{t.supply}</Badge>
                      </Flex>
                      <Flex align="center" gap="1">
                        <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>Demand</span>
                        <Badge variant={supplyDemandVariant(t.demand)}>{t.demand}</Badge>
                      </Flex>
                    </Flex>
                    <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                      {t.notes}
                    </span>
                  </Grid>
                </Card>
              ))}
            </Grid>
          )}
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

export default BDMarketIntel;
