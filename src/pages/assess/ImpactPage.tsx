import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const ImpactPage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="impact"
    title="IMPACT Board Effectiveness Diagnostic"
    tagline="How effectively do you contribute at the board level?"
    description="IMPACT measures your board effectiveness across governance effectiveness, independent judgment, board influence, strategic contribution, and mandate credibility."
    aboutContent={
      <>
        <p>IMPACT is designed for current and aspiring board members. It reveals whether you're operating as a strategic asset or merely fulfilling a governance requirement.</p>
        <h4>Key Dimensions</h4>
        <p>Governance Mastery | Board Dynamics | Strategic Contribution | Risk Oversight</p>
        <h4>Your Possible Archetypes</h4>
        <p>Architect, Steward, Networker, Guardian, Visionary, Bridge-Builder, Nominee, Passenger</p>
      </>
    }
  />
);

export default ImpactPage;
