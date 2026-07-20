import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const ForgePage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="forge"
    title="FORGE Revenue Leadership Diagnostic"
    tagline="Are you building a revenue machine — or just chasing deals?"
    description="FORGE measures your revenue leadership across strategy, sales leadership, market positioning, and pipeline mastery."
    aboutContent={
      <>
        <p>FORGE is built for revenue leaders — CROs, VP Sales, Founders scaling go-to-market. It distinguishes between those who close deals and those who build predictable, scalable revenue engines.</p>
        <h4>Key Dimensions</h4>
        <p>Revenue Strategy | Sales Leadership | Market Positioning | Pipeline Mastery</p>
        <h4>Your Possible Archetypes</h4>
        <p>Rainmaker, System Builder, Revenue Architect, Promoted Seller</p>
      </>
    }
  />
);

export default ForgePage;
