// Phase 6.3: PWA Install Prompt Component
// Mobile PWA - Add to Home Screen installation

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

declare global {
  interface Window {
    BeforeInstallPromptEvent: typeof BeforeInstallPromptEvent;
  }
}

interface InstallPromptProps {
  /**
   * Delay before showing the prompt (in milliseconds)
   */
  delay?: number;
  /**
   * How many days before showing again after dismissal
   */
  snoozeDays?: number;
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
  /**
   * Custom title text
   */
  title?: string;
  /**
   * Custom description text
   */
  description?: string;
  /**
   * Callback when app is installed
   */
  onInstall?: () => void;
  /**
   * Callback when prompt is dismissed
   */
  onDismiss?: () => void;
}

export function InstallPrompt({
  delay = 3000,
  snoozeDays = 7,
  icon = <Smartphone className="w-12 h-12 text-primary" />,
  title = 'Install DEX AI App',
  description = 'Add to your home screen for a faster, app-like experience.',
  onInstall,
  onDismiss,
}: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if already installed or prompt was snoozed
  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check localStorage for snooze
    const snoozedUntil = localStorage.getItem('pwa-install-snoozed');
    if (snoozedUntil) {
      const snoozeDate = new Date(snoozedUntil);
      if (snoozeDate > new Date()) {
        setIsDismissed(true);
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Delay before showing the prompt
      setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if app was just installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      onInstall?.();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [delay, onInstall]);

  // Handle install button click
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setIsVisible(false);
        onInstall?.();
      } else {
        console.log('[PWA] User dismissed install');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA] Install failed:', error);
    }
  }, [deferredPrompt, onInstall]);

  // Handle dismiss
  const handleDismiss = useCallback((snooze: boolean = false) => {
    setIsVisible(false);
    setIsDismissed(true);

    if (snooze) {
      // Set snooze for specified days
      const snoozeDate = new Date();
      snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);
      localStorage.setItem('pwa-install-snoozed', snoozeDate.toISOString());
    }

    onDismiss?.();
  }, [snoozeDays, onDismiss]);

  // Don't render if installed, dismissed, or no prompt available
  if (isInstalled || isDismissed || !deferredPrompt || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => handleDismiss(true)} />

      {/* Card */}
      <div className="relative bg-card rounded-t-2xl shadow-2xl w-full max-w-md mx-4 mb-4 pointer-events-auto animate-slide-up">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              <p className="text-sm text-text-muted mt-1">{description}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => handleDismiss(true)}
              className="flex-shrink-0 p-1 -mr-2 -mt-2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleDismiss(true)}
              className="flex-1 px-4 py-3 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-5 h-5" />
              Install
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing PWA install state
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger install prompt
  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setCanInstall(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Install failed:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    canInstall,
    isInstalled,
    install,
  };
}

// Small banner version for top of page
export function InstallBanner() {
  const { canInstall, isInstalled, install } = usePWAInstall();

  if (!canInstall || isInstalled) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="text-text-primary">
            Install DEX AI for faster access
          </span>
        </div>
        <button
          onClick={install}
          className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
