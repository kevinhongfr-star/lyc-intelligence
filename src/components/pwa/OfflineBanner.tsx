// Phase 6.3: Offline Banner Component
// Mobile PWA - Offline status indicator

'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

interface OfflineBannerProps {
  /**
   * Callback when retry is clicked
   */
  onRetry?: () => void;
  /**
   * Whether to show manual retry button
   */
  showRetry?: boolean;
  /**
   * Custom message to display
   */
  message?: string;
}

export function OfflineBanner({
  onRetry,
  showRetry = true,
  message = "You're offline. Some features may be limited.",
}: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Initialize with current status
    setIsOffline(!navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
      setIsRetrying(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);

    try {
      // Try to fetch a small resource to check connectivity
      await fetch('/api/data/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      setIsOffline(false);
      setDismissed(true);
      onRetry?.();
    } catch {
      // Still offline
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show if online or dismissed
  if (!isOffline || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] animate-slide-down">
      <div className="bg-amber-500 text-amber-900 px-4 py-2">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate">{message}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-full text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-amber-600/30 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing offline state in components
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [offlineData, setOfflineData] = useState<Record<string, any>>({});

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Store data for when we come back online
  const storeOfflineAction = (key: string, data: any) => {
    setOfflineData((prev) => ({ ...prev, [key]: data }));
  };

  // Get stored offline action
  const getOfflineAction = (key: string) => offlineData[key];

  // Clear offline action
  const clearOfflineAction = (key: string) => {
    setOfflineData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    isOffline,
    storeOfflineAction,
    getOfflineAction,
    clearOfflineAction,
  };
}

// Queue for offline actions
export class OfflineActionQueue {
  private dbName = 'dex-offline';
  private storeName = 'pendingActions';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async add(action: {
    url: string;
    method: string;
    body: Record<string, any>;
    timestamp?: number;
  }): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.add({
        ...action,
        timestamp: action.timestamp || Date.now(),
      });

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async processQueue(): Promise<{ success: number; failed: number }> {
    const actions = await this.getAll();
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.body),
        });

        if (response.ok) {
          await this.delete(action.id);
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}

// Export singleton
export const offlineActionQueue = new OfflineActionQueue();

export default OfflineBanner;
