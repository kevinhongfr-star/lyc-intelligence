import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SEO } from '@/components/seo/SEO';

export function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
      <SEO 
        title="Page Not Found" 
        description="The page you're looking for doesn't exist."
        noindex
      />
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-[#C108AB] mb-4" style={{ fontFamily: '"Libre Baskerville", serif' }}>
          404
        </div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-2" style={{ fontFamily: '"Libre Baskerville", serif' }}>
          Page Not Found
        </h1>
        <p className="text-[#666] mb-8">
          The page at <code className="text-[#C108AB] bg-[#C108AB]/10 px-2 py-0.5">{location.pathname}</code> doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorPage({ 
  message = 'Something went wrong',
  error,
  onRetry,
}: { 
  message?: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
      <SEO 
        title="Error" 
        description="An error occurred while loading this page."
        noindex
      />
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-4" style={{ borderRadius: 0 }}>
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-2" style={{ fontFamily: '"Libre Baskerville", serif' }}>
          Error
        </h1>
        <p className="text-[#666] mb-4">{message}</p>
        {error && import.meta.env.DEV && (
          <div className="bg-red-50 border border-red-200 p-4 mb-4 text-left text-xs text-red-800 overflow-auto max-h-32">
            <code>{error.message}</code>
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Offline page for PWA
export function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-6">
      <SEO title="Offline" description="You're currently offline." noindex />
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[#F7F7F7] border-2 border-[#E5E5E5] flex items-center justify-center mx-auto mb-4" style={{ borderRadius: 0 }}>
          <svg className="w-8 h-8 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072M15.536 8.464a5 5 0 010 7.072" />
            <path strokeLinecap="square" strokeWidth={2} d="M3 3l18 18" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[#1C1C1C] mb-2" style={{ fontFamily: '"Libre Baskerville", serif' }}>
          You're Offline
        </h1>
        <p className="text-[#666] mb-8">
          Check your internet connection and try again.
        </p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}