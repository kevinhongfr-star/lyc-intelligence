import React, { useState } from 'react';
import { Heading, Paragraph, Container, Card, Badge, Button, Grid, Tabs, Tab, Progress } from '@/components/design-system';
import { COLORS, SPACING } from '@/styles/tokens';

const cohorts = [
  { id: 'COH001', name: 'Tech Leaders Q1 2024', description: 'C-suite executives in technology sector', size: 150, status: 'completed', generatedAt: '2024-01-20' },
  { id: 'COH002', name: 'Finance Executives APAC', description: 'Senior finance leaders across APAC markets', size: 89, status: 'generating', progress: 65 },
  { id: 'COH003', name: 'Healthcare Leadership', description: 'Healthcare industry executives', size: 120, status: 'pending', generatedAt: null },
  { id: 'COH004', name: 'Consumer Goods Directors', description: 'Consumer goods sector leaders', size: 95, status: 'completed', generatedAt: '2024-01-15' },
];

const reportSections = [
  { id: 'overview', title: 'Executive Summary', icon: '📊' },
  { id: 'demographics', title: 'Demographic Analysis', icon: '👥' },
  { id: 'skills', title: 'Skill Distribution', icon: '💡' },
  { id: 'trends', title: 'Market Trends', icon: '📈' },
  { id: 'recommendations', title: 'Recommendations', icon: '🎯' },
];

const generateReport = (cohortId: string) => {
  console.log('Generating report for cohort:', cohortId);
};

export const CohortReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cohorts');
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  return (
    <div style={{ backgroundColor: COLORS.bg, minHeight: '100vh' }}>
      <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: `${SPACING[4]}px` }}>
            <div>
              <Heading level={1}>Cohort Intelligence Reports</Heading>
              <Paragraph color="textSecondary">Automated reports on cohort performance and market intelligence.</Paragraph>
            </div>
            <Button>Create New Cohort</Button>
          </div>
        </Container>
      </section>

      <section style={{ padding: `${SPACING[10]}px 0` }}>
        <Container>
          <Tabs>
            <Tab active={activeTab === 'cohorts'} onClick={() => setActiveTab('cohorts')}>
              Cohorts ({cohorts.length})
            </Tab>
            <Tab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>
              Generated Reports
            </Tab>
            <Tab active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')}>
              Scheduled Reports
            </Tab>
          </Tabs>

          <div style={{ marginTop: `${SPACING[6]}px` }}>
            {activeTab === 'cohorts' && (
              <Grid columns={2} gap="6">
                {cohorts.map((cohort) => (
                  <Card key={cohort.id} padding="6" variant="outline">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: `${SPACING[4]}px` }}>
                      <div>
                        <Heading level={3}>{cohort.name}</Heading>
                        <Paragraph color="textSecondary" style={{ margin: 0 }}>{cohort.description}</Paragraph>
                        <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted, marginTop: `${SPACING[2]}px` }}>
                          {cohort.size} members
                        </div>
                      </div>
                      <Badge variant={
                        cohort.status === 'completed' ? 'success' :
                        cohort.status === 'generating' ? 'warning' : 'default'
                      }>
                        {cohort.status}
                      </Badge>
                    </div>

                    {cohort.status === 'generating' && (
                      <Progress value={cohort.progress} label="Generating Report" />
                    )}

                    {cohort.status === 'completed' && (
                      <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                        Generated: {cohort.generatedAt}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: `${SPACING[2]}px`, marginTop: `${SPACING[4]}px` }}>
                      {cohort.status === 'completed' && (
                        <>
                          <Button size="sm" onClick={() => setSelectedCohort(cohort.id)}>View Report</Button>
                          <Button size="sm" variant="ghost">Download PDF</Button>
                        </>
                      )}
                      {cohort.status === 'pending' && (
                        <Button size="sm" onClick={() => generateReport(cohort.id)}>Generate Report</Button>
                      )}
                    </div>
                  </Card>
                ))}
              </Grid>
            )}

            {activeTab === 'reports' && (
              <Card padding="6">
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {cohorts.filter(c => c.status === 'completed').map((cohort) => (
                    <Card key={cohort.id} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Heading level={4}>{cohort.name} Report</Heading>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            Generated: {cohort.generatedAt} | {cohort.size} members
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                          <Button size="sm">View</Button>
                          <Button size="sm" variant="ghost">Download</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'scheduled' && (
              <Card padding="6">
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING[4]}px` }}>
                  {[
                    { name: 'Monthly Cohort Report', schedule: 'Every 1st of month', nextRun: '2024-02-01' },
                    { name: 'Quarterly APAC Report', schedule: 'Every quarter', nextRun: '2024-04-01' },
                    { name: 'Weekly Digest', schedule: 'Every Monday', nextRun: '2024-01-22' },
                  ].map((schedule) => (
                    <Card key={schedule.name} padding="6" variant="outline">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Heading level={4}>{schedule.name}</Heading>
                          <div style={{ fontSize: `${SPACING[3]}px`, color: COLORS.textMuted }}>
                            {schedule.schedule} | Next run: {schedule.nextRun}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: `${SPACING[2]}px` }}>
                          <Button size="sm" variant="ghost">Edit</Button>
                          <Button size="sm" variant="danger">Disable</Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Container>
      </section>

      {selectedCohort && (
        <section style={{ padding: `${SPACING[10]}px 0`, backgroundColor: COLORS.bgAlt }}>
          <Container>
            <Card padding="6">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: `${SPACING[6]}px` }}>
                <Heading level={2}>Report Preview</Heading>
                <Button onClick={() => setSelectedCohort(null)}>Close</Button>
              </div>
              <Tabs>
                {reportSections.map((section) => (
                  <Tab key={section.id} active={activeTab === section.id} onClick={() => setActiveTab(section.id)}>
                    {section.icon} {section.title}
                  </Tab>
                ))}
              </Tabs>
              <div style={{ marginTop: `${SPACING[6]}px`, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted }}>
                Report content for {reportSections.find(s => s.id === activeTab)?.title}
              </div>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
};