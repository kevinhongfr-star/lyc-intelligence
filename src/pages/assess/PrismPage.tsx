import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const PrismPage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="prism"
    title="PRISM Executive Brand Identity"
    tagline="How the market sees you — and whether it matches who you really are"
    description="PRISM measures your executive brand across brand clarity, narrative power, visibility strategy, authenticity, and market resonance."
    aboutContent={
      <>
        <p>PRISM reveals the gap between how you intend to be perceived and how you actually show up in the market. Your brand is either an asset or a liability — PRISM tells you which.</p>
        <h4>Key Dimensions</h4>
        <p>Brand Clarity | Narrative Power | Visibility Strategy | Authenticity Index | Market Resonance</p>
        <h4>Your Possible Archetypes</h4>
        <p>Authority, Signal, Monument, Chameleon, Amplifier, Operator, Ghost, Mask, Static, Blank Page</p>
      </>
    }
  />
);

export default PrismPage;
