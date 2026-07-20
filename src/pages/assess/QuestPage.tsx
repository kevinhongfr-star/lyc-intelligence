import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const QuestPage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="quest"
    title="QUEST Executive Capability Diagnostic"
    tagline="Discover your leadership archetype across 10 dimensions of executive capability"
    description="QUEST measures your executive capability across cognitive complexity, adaptive leadership, stakeholder intelligence, mission alignment, and AI readiness."
    aboutContent={
      <>
        <p>QUEST is our flagship leadership capability diagnostic. It maps your leadership pattern across five core dimensions that define executive effectiveness in complex organizations.</p>
        <p>Unlike generic personality tests, QUEST is calibrated specifically for senior leaders operating in APAC's unique business context — where cross-cultural navigation, rapid market shifts, and stakeholder complexity define success.</p>
        <h4>The 5 Dimensions</h4>
        <ul>
          <li><strong>Strategic Vision</strong> — Setting direction and anticipating market shifts</li>
          <li><strong>People Development</strong> — Building and growing high-performing teams</li>
          <li><strong>Execution Discipline</strong> — Delivering results consistently against plan</li>
          <li><strong>Stakeholder Influence</strong> — Navigating and influencing key stakeholders</li>
          <li><strong>Adaptive Agility</strong> — Speed and effectiveness of pivoting when conditions change</li>
        </ul>
        <p>Based on your dimension scores, QUEST classifies you into one of <strong>10 leadership archetypes</strong> — from Architect to Entrepreneur, Navigator to Engine.</p>
      </>
    }
    relatedProducts={{
      webinars: [{ label: 'Executive Presence in AI Age', href: '/webinars/exec-presence-ai-age-feb-2027' }],
      programmes: [{ label: 'Nexus Advisory Programme', href: '/programmes/advisory' }],
    }}
  />
);

export default QuestPage;
