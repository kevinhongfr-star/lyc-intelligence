import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const ShiftPage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="shift"
    title="SHIFT Bilateral Coaching Effectiveness"
    tagline="Your integrated leadership signature across all dimensions"
    description="SHIFT measures bilateral coaching effectiveness across cross-boundary developmental orientation, adaptive coaching style, relationship quality, and coaching under constraints."
    aboutContent={
      <>
        <p>SHIFT is not a standalone assessment. It synthesizes results from your completed diagnostics into a unified composite profile. Complete at least 2 individual diagnostics to generate your SHIFT profile.</p>
        <h4>Key Dimensions</h4>
        <p>Composite across all instruments</p>
        <h4>Your Possible Archetypes</h4>
        <p>Integrated Leader, Adaptive Specialist, Selective Engager, Development Focus</p>
      </>
    }
  />
);

export default ShiftPage;
