import React from 'react';
import { DiagnosticPageLayout } from '@/components/diagnostic/DiagnosticPageLayout';

export const DrivePage: React.FC = () => (
  <DiagnosticPageLayout
    instrumentId="drive"
    title="DRIVE Motivational Profile"
    tagline="Understand what truly motivates you — and what's holding you back"
    description="DRIVE maps your motivational pattern across achievement orientation, autonomy need, recognition seeking, growth appetite, and stability preference."
    aboutContent={
      <>
        <p>DRIVE goes deeper than surface-level motivation. It reveals the underlying drivers that determine whether you'll thrive or merely survive in your current role.</p>
        <h4>Key Dimensions</h4>
        <p>Achievement Orientation | Autonomy Need | Recognition Seeking | Growth Appetite | Stability Preference</p>
        <h4>Your Possible Archetypes</h4>
        <p>Achiever, Craftsman, Champion, Explorer, Stalwart, Restless, Golden Handcuffs, Drifter, Burned-Out, Frozen Asset</p>
      </>
    }
  />
);

export default DrivePage;
