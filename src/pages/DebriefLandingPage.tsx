import React from 'react';
import { SEO } from '@/components/seo/SEO';
import { DebriefLandingPage as DebriefLandingContent } from '@/components/debrief/DebriefLandingPage';

export interface DebriefLandingPageProps {
  onNavigate?: (path: string) => void;
}

export function DebriefLandingPage({ onNavigate }: DebriefLandingPageProps) {
  const handleBrowse = () => {
    if (onNavigate) {
      onNavigate('/debrief/book');
    } else {
      window.location.href = '/debrief/book';
    }
  };

  const handleBook = (instrumentCode?: string) => {
    const qs = instrumentCode ? `?instrument=${encodeURIComponent(instrumentCode)}` : '';
    const target = `/debrief/book${qs}`;
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
    }
  };

  return (
    <>
      <SEO
        title="Diagnostic Debriefs | LYC Intelligence"
        description="Book live 1:1 executive diagnostic debriefs. 30/45/60/90 minute sessions with certified specialists. From Light diagnostics to Flagship China Leadership Pipeline Index debriefs."
        path="/debrief"
        type="website"
      />
      <DebriefLandingContent
        onBrowseSessions={handleBrowse}
        onBookNow={handleBook}
      />
    </>
  );
}

export default DebriefLandingPage;
