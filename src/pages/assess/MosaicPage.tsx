import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const MosaicPage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="mosaic"
    title="MOSAIC Cross-Border Team Dynamics"
    tagline="How culturally intelligent is your organization?"
    description="MOSAIC measures cross-border team dynamics across institutional trust, relationship velocity, normative flexibility, and conflict resolution."
    aboutContent={
      <>
        <p>MOSAIC is the organizational counterpart to BRIDGE. While BRIDGE measures individual cultural intelligence, MOSAIC assesses how well the organization itself operates across cultures.</p>
        <h4>Key Dimensions</h4>
        <p>Organizational Openness | Integration Maturity | Inclusive Leadership | Cultural Infrastructure</p>
        <h4>Your Possible Archetypes</h4>
        <p>Cultural Catalyst, Cultural Expert, Cultural Leader, Cultural Tourist</p>
      </>
    }
  />
);

export default MosaicPage;
