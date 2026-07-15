/**
 * Page Component
 * 
 * Wrapper that handles SEO, page tracking, and layout consistency.
 * Use for all portal pages.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SEO, SEO_PRESETS } from '@/components/seo/SEO';
import { trackPageView } from '@/lib/analytics';

interface PageProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  seoPreset?: keyof typeof SEO_PRESETS;
  noindex?: boolean;
  className?: string;
  loading?: boolean;
  loadingSkeleton?: React.ReactNode;
}

export function Page({
  children,
  title,
  description,
  seoPreset,
  noindex,
  className = '',
  loading,
  loadingSkeleton,
}: PageProps) {
  const location = useLocation();

  // Get SEO from preset or use custom values
  const seoProps = seoPreset ? SEO_PRESETS[seoPreset] : {};
  const finalTitle = title || seoProps.title;
  const finalDescription = description || seoProps.description;

  // Track page view on mount and route change
  useEffect(() => {
    trackPageView(location.pathname, finalTitle);
  }, [location.pathname, finalTitle]);

  // Show loading state
  if (loading) {
    return (
      <>
        <SEO title={finalTitle} description={finalDescription} noindex={noindex} />
        {loadingSkeleton || <DefaultLoadingSkeleton />}
      </>
    );
  }

  return (
    <>
      <SEO title={finalTitle} description={finalDescription} noindex={noindex} />
      <div className={className}>
        {children}
      </div>
    </>
  );
}

function DefaultLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="h-8 bg-[#E5E5E5] w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#E5E5E5] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook to get page tracking functions
export { useAnalytics } from '@/lib/analytics';