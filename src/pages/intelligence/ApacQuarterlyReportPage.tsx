import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const reports = [
  { id: 'QR001', quarter: 'Q4 2023', title: 'APAC Executive Intelligence Report', status: 'published', date: '2024-01-05', countries: ['Singapore', 'Hong Kong', 'China', 'Japan', 'Australia'] },
  { id: 'QR002', quarter: 'Q3 2023', title: 'APAC Executive Intelligence Report', status: 'published', date: '2023-10-05', countries: ['Singapore', 'Hong Kong', 'China', 'Japan', 'Australia'] },
  { id: 'QR003', quarter: 'Q2 2023', title: 'APAC Executive Intelligence Report', status: 'published', date: '2023-07-05', countries: ['Singapore', 'Hong Kong', 'China', 'Japan', 'Australia'] },
];

const reportData = {
  regional: {
    title: 'Regional Highlights',
    regions: [
      { name: 'Singapore', trend: 'up', change: '+12%', description: 'Strong demand for tech executives' },
      { name: 'Hong Kong', trend: 'stable', change: '+3%', description: 'Financial services leading' },
      { name: 'China', trend: 'up', change: '+8%', description: 'Recovery in consumer sector' },
      { name: 'Japan', trend: 'stable', change: '+2%', description: 'Steady executive movement' },
      { name: 'Australia', trend: 'up', change: '+15%', description: 'Mining and resources boom' },
    ],
  },
  industry: {
    title: 'Industry Trends',
    industries: [
      { name: 'Technology', growth: 25, hotRoles: ['CTO', 'VP Engineering', 'Head of AI'] },
      { name: 'Finance', growth: 12, hotRoles: ['CFO', 'Risk Director', 'Compliance Head'] },
      { name: 'Healthcare', growth: 18, hotRoles: ['CEO', 'CMO', 'Digital Health Lead'] },
      { name: 'Consumer', growth: 8, hotRoles: ['CCO', 'E-commerce Director'] },
      { name: 'Energy', growth: 35, hotRoles: ['Renewable Energy Head', 'ESG Director'] },
    ],
  },
  compensation: {
    title: 'Compensation Trends',
    data: [
      { level: 'C-Suite', baseSalary: '$300k - $500k', bonus: '50-100%', equity: '1-5%' },
      { level: 'VP Level', baseSalary: '$200k - $300k', bonus: '30-60%', equity: '0.5-2%' },
      { level: 'Director Level', baseSalary: '$120k - $200k', bonus: '20-40%', equity: '0.2-1%' },
    ],
  },
};

export const ApacQuarterlyReportPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('regional');

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.shift} 0%, ${COLORS.trident} 100%)`,
          padding: `${SPACING[20]}px 0`,
          color: COLORS.white,
        }}
      >
        <Container>
          <Badge style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: COLORS.white }}>
            Quarterly Publication
          </Badge>
          <Heading level={1} style={{ marginTop: `${SPACING[4]}px`, marginBottom: `${SPACING[4]}px` }}>
            APAC Quarterly Intelligence Report
          </Heading>
          <Paragraph style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)', maxWidth: '600px' }}>
            Comprehensive analysis of executive talent trends, compensation data, and market intelligence across Asia Pacific.
          </Paragraph>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
            {reports.map((report) => (
              <Card key={report.id} padding="6" variant="outline" onClick={() => setSelectedReport(report.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: `${SPACING[3]}px`, alignItems: 'center', marginBottom: `${SPACING[2]}px` }}>
                      <Badge variant="success">{report.status}</Badge>
                      <span style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                        {report.date}
                      </span>
                    </div>
                    <Heading level={3}>{report.title}</Heading>
                    <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                      Coverage: {report.countries.join(', ')}
                    </div>
                  </div>
                  <Button>View Report</Button>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {selectedReport && (
        <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
          <Container>
            <Card padding="8">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
                <div>
                  <Heading level={2}>
                    {reports.find(r => r.id === selectedReport)?.title}
                  </Heading>
                  <Badge style={{ marginTop: `${SPACING[3]}px` }}>
                    {reports.find(r => r.id === selectedReport)?.quarter}
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                  <Button>Download Full Report</Button>
                  <Button variant="ghost" onClick={() => setSelectedReport(null)}>Close</Button>
                </div>
              </div>

              <Tabs>
                <Tab active={activeSection === 'regional'} onClick={() => setActiveSection('regional')}>
                  Regional Highlights
                </Tab>
                <Tab active={activeSection === 'industry'} onClick={() => setActiveSection('industry')}>
                  Industry Trends
                </Tab>
                <Tab active={activeSection === 'compensation'} onClick={() => setActiveSection('compensation')}>
                  Compensation Data
                </Tab>
              </Tabs>

              <div style={{ marginTop: `${SPACING[8]}px` }}>
                {activeSection === 'regional' && (
                  <div>
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>
                      {reportData.regional.title}
                    </Heading>
                    <Grid columns={5} gap="4">
                      {reportData.regional.regions.map((region) => (
                        <Card key={region.name} padding="6">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[3]}px` }}>
                            <Heading level={4}>{region.name}</Heading>
                            <Badge variant={region.trend === 'up' ? 'success' : 'info'}>
                              {region.change}
                            </Badge>
                          </div>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textSecondary }}>
                            {region.description}
                          </div>
                        </Card>
                      ))}
                    </Grid>
                  </div>
                )}

                {activeSection === 'industry' && (
                  <div>
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>
                      {reportData.industry.title}
                    </Heading>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                      {reportData.industry.industries.map((industry) => (
                        <Card key={industry.name} padding="6" variant="outline">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Heading level={4}>{industry.name}</Heading>
                              <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                                Hot Roles: {industry.hotRoles.join(', ')}
                              </div>
                            </div>
                            <Badge variant="success">
                              +{industry.growth}%
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'compensation' && (
                  <div>
                    <Heading level={3} style={{ marginBottom: `${SPACING[6]}px` }}>
                      {reportData.compensation.title}
                    </Heading>
                    <Card padding="6">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                            <th style={{ textAlign: 'left', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Level</th>
                            <th style={{ textAlign: 'left', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Base Salary</th>
                            <th style={{ textAlign: 'left', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Bonus</th>
                            <th style={{ textAlign: 'left', padding: `${SPACING[4]}px`, fontWeight: 600 }}>Equity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.compensation.data.map((row) => (
                            <tr key={row.level} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                              <td style={{ padding: `${SPACING[4]}px`, fontWeight: 600 }}>{row.level}</td>
                              <td style={{ padding: `${SPACING[4]}px`, color: COLORS.textSecondary }}>{row.baseSalary}</td>
                              <td style={{ padding: `${SPACING[4]}px`, color: COLORS.textSecondary }}>{row.bonus}</td>
                              <td style={{ padding: `${SPACING[4]}px`, color: COLORS.textSecondary }}>{row.equity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
};