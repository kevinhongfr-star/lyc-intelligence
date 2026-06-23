// Phase 6.3: Push Notification Service
// Mobile PWA - Push notifications handling

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  state: NotificationPermission;
  canRequest: boolean;
}

type NotificationPermission = 'granted' | 'denied' | 'default' | 'prompt';

class PushNotificationService {
  private vapidPublicKey: string;
  private subscription: PushSubscription | null = null;

  constructor() {
    // In production, this would come from environment variables
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  /**
   * Check current notification permission status
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (!('Notification' in window)) {
      return { granted: false, state: 'denied', canRequest: false };
    }

    const state = Notification.permission;
    return {
      granted: state === 'granted',
      state,
      canRequest: state === 'default',
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if service worker is available
   */
  async isServiceWorkerAvailable(): Promise<boolean> {
    return 'serviceWorker' in navigator && navigator.serviceWorker.ready !== undefined;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      console.log('[Push] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[Push] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.vapidPublicKey) {
      console.warn('[Push] VAPID public key not configured');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[Push] Using existing subscription');
        this.subscription = existingSubscription;
        return existingSubscription;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      this.subscription = subscription;
      console.log('[Push] New subscription created');

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.subscription = await registration.pushManager.getSubscription();
      } catch {
        return true;
      }
    }

    if (!this.subscription) {
      return true;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscriptionFromBackend();
      this.subscription = null;
      console.log('[Push] Unsubscribed successfully');
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe failed:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[Push] Get subscription failed:', error);
      return null;
    }
  }

  /**
   * Check if push is supported and configured
   */
  async isPushSupported(): Promise<boolean> {
    if (!('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushManager = registration.pushManager;
      return pushManager.supportedContentEncodings?.includes('aes128gcm') ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Send push subscription to backend for storage
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    const subscriptionData = this.subscriptionToData(subscription);

    try {
      const response = await fetch('/api/data/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionData,
          user_id: this.getCurrentUserId(),
        }),
      });

      if (!response.ok) {
        console.warn('[Push] Failed to send subscription to backend');
      }
    } catch (error) {
      console.error('[Push] Error sending subscription:', error);
    }
  }

  /**
   * Remove push subscription from backend
   */
  private async removeSubscriptionFromBackend(): Promise<void> {
    try {
      await fetch('/api/data/push-subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.getCurrentUserId(),
        }),
      });
    } catch (error) {
      console.error('[Push] Error removing subscription:', error);
    }
  }

  /**
   * Show a local notification (for testing)
   */
  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    const permissionStatus = this.getPermissionStatus();

    if (!permissionStatus.granted) {
      console.warn('[Push] Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        tag: payload.tag || 'default',
        data: payload.data,
        vibrate: [100, 50, 100],
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      });
    } catch (error) {
      console.error('[Push] Show notification failed:', error);
    }
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert subscription to plain object
   */
  private subscriptionToData(subscription: PushSubscription): PushSubscriptionData {
    const json = subscription.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!['p256dh'],
        auth: json.keys!['auth'],
      },
    };
  }

  /**
   * Get current user ID (would use auth context in real app)
   */
  private getCurrentUserId(): string {
    // This would come from auth context in a real implementation
    return localStorage.getItem('user_id') || '';
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };
