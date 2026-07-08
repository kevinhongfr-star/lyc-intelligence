// Phase 6.3: Responsive Layout Component
// Mobile PWA - Responsive shell with offline support

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNavigation } from './BottomNavigation';
import { OfflineBanner } from './OfflineBanner';
import { InstallPrompt } from './InstallPrompt';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  userRole?: 'candidate' | 'consultant' | 'client' | 'admin';
  userName?: string;
  notificationCount?: number;
}

export function ResponsiveLayout({
  children,
  userRole = 'consultant',
  userName,
  notificationCount = 0,
}: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Online/offline status
  useEffect(() => {
    if (!isHydrated) return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isHydrated]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && isHydrated) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, [isHydrated]);

  // Don't render until hydrated (prevents SSR mismatch)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Main Content */}
      <main
        className="pb-20 lg:pb-0 lg:ml-64 min-h-screen"
        style={{
          // Add safe area padding for notched devices
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)',
        }}
      >
        <div className={isOnline ? '' : 'opacity-75'}>{children}</div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        userRole={userRole}
        notificationCount={notificationCount}
      />

      {/* PWA Update Toast */}
      <PWAUpdateToast />
    </div>
  );
}

// Component to handle PWA updates
function PWAUpdateToast() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setUpdateAvailable(true);
        }

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96">
      <div className="bg-card border border-card-border rounded-none shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold">!</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-text-primary">Update Available</h4>
            <p className="text-sm text-text-muted mt-1">
              A new version of DEX AI is available.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary text-white rounded-none text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page wrapper with responsive padding
export function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`container mx-auto px-4 py-6 ${className}`}>
      {children}
    </div>
  );
}

// Card component for mobile-first design
export function Card({
  children,
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`bg-card border border-card-border rounded-none p-4 ${
        onClick ? 'hover:bg-bg-alt active:scale-[0.98] transition-all w-full text-left' : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}

// Responsive grid
export function ResponsiveGrid({
  children,
  cols = 'auto',
  className = '',
}: {
  children: React.ReactNode;
  cols?: '1' | '2' | '3' | '4' | 'auto';
  className?: string;
}) {
  const gridCols = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
    'auto': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return <div className={`grid ${gridCols[cols]} gap-4 ${className}`}>{children}</div>;
}

// Stats card for dashboard
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  className = '',
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {trend && trendValue && (
            <p
              className={`text-sm mt-1 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                  ? 'text-red-600'
                  : 'text-text-muted'
              }`}
            >
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
              {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// List item for mobile
export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightContent,
  onClick,
  className = '',
}: {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 bg-card border border-card-border rounded-none hover:bg-bg-alt active:scale-[0.99] transition-all text-left ${className}`}
    >
      {leftIcon && (
        <div className="w-10 h-10 rounded-none bg-bg-alt flex items-center justify-center flex-shrink-0 text-text-muted">
          {leftIcon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-text-muted truncate">{subtitle}</p>
        )}
      </div>
      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </button>
  );
}

export default ResponsiveLayout;
