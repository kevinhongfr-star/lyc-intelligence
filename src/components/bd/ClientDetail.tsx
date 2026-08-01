import React from 'react';
import {
  Building2,
  Star,
  DollarSign,
  Calendar,
  Clock,
  Mail,
  Phone,
  Briefcase,
  Users,
  MapPin,
  Globe,
} from 'lucide-react';
import { COLORS, SPACING } from '@/styles/tokens';
import {
  Card,
  Heading,
  Paragraph,
  Flex,
  Grid,
  Badge,
} from '@/components/design-system';

interface Mandate {
  id: string;
  title: string;
  status: string;
  fee_usd: number;
  closed_at: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string;
  outcome: string;
}

interface Opportunity {
  id: string;
  title: string;
  stage: string;
  fee_usd: number;
  probability: number;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}

const CLIENT_OVERVIEW = {
  name: 'Aurora Tech',
  industry: 'Technology',
  hq: 'Shanghai, China',
  website: 'auroratech.com',
  employees: '500-1000',
  nps: 9,
  total_revenue_usd: 480000,
  total_mandates: 4,
};

const SEED_MANDATES: Mandate[] = [
  { id: 'm1', title: 'VP Engineering', status: 'Placed', fee_usd: 120000, closed_at: '2026-05-12' },
  { id: 'm2', title: 'Head of Product', status: 'Placed', fee_usd: 95000, closed_at: '2025-11-03' },
  { id: 'm3', title: 'CFO', status: 'Placed', fee_usd: 140000, closed_at: '2025-07-21' },
  { id: 'm4', title: 'Director of Sales, APAC', status: 'Placed', fee_usd: 85000, closed_at: '2025-02-14' },
  { id: 'm5', title: 'VP Marketing', status: 'Lost', fee_usd: 0, closed_at: '2024-12-08' },
  { id: 'm6', title: 'CTO', status: 'Placed', fee_usd: 160000, closed_at: '2024-08-30' },
];

const SEED_MEETINGS: Meeting[] = [
  { id: 'mt1', title: 'Quarterly business review', date: '2026-07-22', attendees: 'Wei Zhang, Lisa Chen', outcome: 'Aligned on 2 upcoming searches' },
  { id: 'mt2', title: 'VP Sales intake kickoff', date: '2026-07-10', attendees: 'Wei Zhang, Mark Liu', outcome: 'Mandate scoped, fee 25%' },
  { id: 'mt3', title: 'Proposal presentation', date: '2026-06-28', attendees: 'Lisa Chen, Tom Wang', outcome: 'Proposal accepted' },
  { id: 'mt4', title: 'Discovery call', date: '2026-06-15', attendees: 'Wei Zhang', outcome: 'Pain points documented' },
  { id: 'mt5', title: 'Candidate shortlist review', date: '2026-05-30', attendees: 'Lisa Chen, Mark Liu', outcome: '3 candidates advanced' },
  { id: 'mt6', title: 'Final interview prep', date: '2026-05-18', attendees: 'Wei Zhang, Tom Wang', outcome: 'Prep complete' },
  { id: 'mt7', title: 'Offer negotiation', date: '2026-05-05', attendees: 'Wei Zhang', outcome: 'Offer accepted' },
  { id: 'mt8', title: 'Onboarding check-in', date: '2026-04-20', attendees: 'Lisa Chen', outcome: 'Candidate thriving at 90 days' },
];

const SEED_OPPORTUNITIES: Opportunity[] = [
  { id: 'o1', title: 'VP Sales, APAC', stage: 'Proposal Sent', fee_usd: 110000, probability: 60 },
  { id: 'o2', title: 'Head of People', stage: 'Meeting Done', fee_usd: 75000, probability: 40 },
  { id: 'o3', title: 'GM, China', stage: 'Prospect', fee_usd: 150000, probability: 20 },
];

const SEED_CONTACTS: Contact[] = [
  { id: 'ct1', name: 'Wei Zhang', title: 'CEO', email: 'wei@auroratech.com', phone: '+86 138 0000 0001' },
  { id: 'ct2', name: 'Lisa Chen', title: 'VP People', email: 'lisa@auroratech.com', phone: '+86 138 0000 0002' },
  { id: 'ct3', name: 'Mark Liu', title: 'COO', email: 'mark@auroratech.com', phone: '+86 138 0000 0003' },
  { id: 'ct4', name: 'Tom Wang', title: 'Head of Talent', email: 'tom@auroratech.com', phone: '+86 138 0000 0004' },
];

const currency = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n || 0);

export const ClientDetail: React.FC<{ clientId: string }> = ({ clientId }) => {
  return (
    <Grid columns={1} gap="6">
      {/* Header */}
      <Grid columns={1} gap="0">
        <Flex align="center" gap="3">
          <Building2 className="w-6 h-6" style={{ color: COLORS.primary }} />
          <Heading level={3}>{CLIENT_OVERVIEW.name}</Heading>
          <Badge variant="info">{CLIENT_OVERVIEW.industry}</Badge>
        </Flex>
        <Paragraph color="textMuted">
          Client reference: {clientId} · {CLIENT_OVERVIEW.hq}
        </Paragraph>
      </Grid>

      {/* Overview */}
      <Grid columns={3} gap="4">
        <Card padding="5">
          <Grid columns={1} gap="2">
            <Flex align="center" gap="2">
              <DollarSign className="w-4 h-4" style={{ color: COLORS.success }} />
              <span style={labelStyle}>Total Revenue</span>
            </Flex>
            <span style={valueStyle}>{currency(CLIENT_OVERVIEW.total_revenue_usd)}</span>
          </Grid>
        </Card>
        <Card padding="5">
          <Grid columns={1} gap="2">
            <Flex align="center" gap="2">
              <Star className="w-4 h-4" style={{ color: COLORS.warning }} />
              <span style={labelStyle}>NPS</span>
            </Flex>
            <span style={valueStyle}>{CLIENT_OVERVIEW.nps} / 10</span>
          </Grid>
        </Card>
        <Card padding="5">
          <Grid columns={1} gap="2">
            <Flex align="center" gap="2">
              <Briefcase className="w-4 h-4" style={{ color: COLORS.primary }} />
              <span style={labelStyle}>Total Mandates</span>
            </Flex>
            <span style={valueStyle}>{CLIENT_OVERVIEW.total_mandates}</span>
          </Grid>
        </Card>
      </Grid>

      {/* Company info */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Overview</Heading>
          <Grid columns={2} gap="4">
            <Flex align="center" gap="2">
              <MapPin className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span style={labelStyle}>HQ:</span>
              <span style={textStyle}>{CLIENT_OVERVIEW.hq}</span>
            </Flex>
            <Flex align="center" gap="2">
              <Building2 className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span style={labelStyle}>Industry:</span>
              <span style={textStyle}>{CLIENT_OVERVIEW.industry}</span>
            </Flex>
            <Flex align="center" gap="2">
              <Users className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span style={labelStyle}>Employees:</span>
              <span style={textStyle}>{CLIENT_OVERVIEW.employees}</span>
            </Flex>
            <Flex align="center" gap="2">
              <Globe className="w-4 h-4" style={{ color: COLORS.textMuted }} />
              <span style={labelStyle}>Website:</span>
              <span style={textStyle}>{CLIENT_OVERVIEW.website}</span>
            </Flex>
          </Grid>
        </Grid>
      </Card>

      {/* Past Mandates */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Past Mandates</Heading>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Status', 'Fee', 'Closed'].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEED_MANDATES.map((m) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={tdStyle}>{m.title}</td>
                  <td style={tdStyle}>
                    <Badge variant={m.status === 'Placed' ? 'success' : 'error'}>{m.status}</Badge>
                  </td>
                  <td style={tdStyle}>{currency(m.fee_usd)}</td>
                  <td style={tdStyle}>{m.closed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Grid>
      </Card>

      {/* Meetings timeline */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Meetings</Heading>
          <Grid columns={1} gap="3">
            {SEED_MEETINGS.map((mt) => (
              <Flex key={mt.id} gap="3" align="start">
                <div style={timelineDotStyle}>
                  <Clock className="w-3 h-3" style={{ color: COLORS.white }} />
                </div>
                <Grid columns={1} gap="0" style={{ flex: 1 }}>
                  <Flex justify="between" align="center">
                    <span style={{ fontWeight: 600, color: COLORS.text }}>{mt.title}</span>
                    <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                      {mt.date}
                    </span>
                  </Flex>
                  <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                    <Calendar className="w-3 h-3" style={{ display: 'inline', marginRight: SPACING[1] }} />
                    {mt.attendees}
                  </span>
                  <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                    {mt.outcome}
                  </span>
                </Grid>
              </Flex>
            ))}
          </Grid>
        </Grid>
      </Card>

      {/* Opportunities */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Opportunities</Heading>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Stage', 'Fee', 'Probability'].map((h) => (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEED_OPPORTUNITIES.map((o) => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <td style={tdStyle}>{o.title}</td>
                  <td style={tdStyle}>
                    <Badge variant="default">{o.stage}</Badge>
                  </td>
                  <td style={tdStyle}>{currency(o.fee_usd)}</td>
                  <td style={tdStyle}>{o.probability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Grid>
      </Card>

      {/* Contacts */}
      <Card padding="6">
        <Grid columns={1} gap="4">
          <Heading level={5}>Contacts</Heading>
          <Grid columns={2} gap="4">
            {SEED_CONTACTS.map((c) => (
              <Card key={c.id} variant="outline" padding="4">
                <Grid columns={1} gap="2">
                  <Flex align="center" gap="2">
                    <div style={avatarStyle}>{c.name.slice(0, 1)}</div>
                    <Grid columns={1} gap="0">
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{c.name}</span>
                      <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                        {c.title}
                      </span>
                    </Grid>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Mail className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                    <span style={textStyle}>{c.email}</span>
                  </Flex>
                  <Flex align="center" gap="2">
                    <Phone className="w-3 h-3" style={{ color: COLORS.textMuted }} />
                    <span style={textStyle}>{c.phone}</span>
                  </Flex>
                </Grid>
              </Card>
            ))}
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: `${SPACING[3]}px`,
  fontWeight: 500,
  color: COLORS.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  fontSize: `${SPACING[6]}px`,
  fontWeight: 700,
  color: COLORS.text,
};

const textStyle: React.CSSProperties = {
  fontSize: `${SPACING[3]}px`,
  color: COLORS.text,
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

const timelineDotStyle: React.CSSProperties = {
  width: SPACING[6],
  height: SPACING[6],
  borderRadius: '50%',
  backgroundColor: COLORS.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const avatarStyle: React.CSSProperties = {
  width: SPACING[6],
  height: SPACING[6],
  borderRadius: '50%',
  backgroundColor: COLORS.primaryLight,
  color: COLORS.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: `${SPACING[3]}px`,
  flexShrink: 0,
};

export default ClientDetail;
