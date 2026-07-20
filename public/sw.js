/**
 * PWA Service Worker — Issue #24: Mobile App Companion
 * Issue #25: Offline Mode for Field Work
 *
 * Handles:
 * - App shell caching
 * - API response caching with sync
 * - Offline fallback pages
 * - Push notifications
 */

/// <reference lib="webworker" />

const CACHE_NAME = 'lyc-v1';
const STATIC_CACHE = 'lyc-static-v1';
const API_CACHE = 'lyc-api-v1';
const SYNC_QUEUE = 'lyc-sync-queue';

// Resources to cache immediately on install
const APP_SHELL = [
  '/',
  '/app',
  '/app/dashboard',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// Install event — cache app shell
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  // Activate immediately
  (self as any).skipWaiting();
});

// Activate event — clean old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => !key.includes('v1')).map((key) => caches.delete(key))
      )
    )
  );
  // Take control immediately
  (self as any).clients.claim();
});

// Fetch event — network-first for API, cache-first for static
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests — network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets — cache-first
  if (request.method === 'GET') {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// Network-first strategy (for API calls)
async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    // Only cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Network failed — try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // For mutations, queue for sync
    if (request.method !== 'GET') {
      await queueForSync(request);
      return new Response(JSON.stringify({ queued: true, offline: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return offline fallback
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline') as Promise<Response>;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Queue mutations for background sync
async function queueForSync(request: Request): Promise<void> {
  const body = await request.clone().text();
  const queueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    timestamp: Date.now(),
  };

  // Store in IndexedDB
  const db = await openSyncDB();
  await db.put('syncQueue', queueItem);
}

// Open IndexedDB for sync queue
function openSyncDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lyc-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  });
}

// Background sync event — replay queued mutations
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(replaySyncQueue());
  }
});

async function replaySyncQueue(): Promise<void> {
  const db = await openSyncDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const items = await store.getAll();

  for (const item of items) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });
      // Success — remove from queue
      store.delete(item.id);
    } catch {
      // Still offline — keep in queue
      console.log('Sync retry failed for', item.id);
    }
  }
}

// Push notification event
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() || {};
  const title = data.title || 'LYC Intelligence';
  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    badge: '/badge.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(
    (self as any).registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app';
  event.waitUntil((self as any).clients.openWindow(url));
});

// Export types for TypeScript
declare const self: ServiceWorkerGlobalScope;
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}
interface PushEvent extends Event {
  data: { json: () => any } | null;
}
interface NotificationEvent extends Event {
  notification: Notification & { data?: { url?: string } };
  waitUntil(promise: Promise<any>): void;
}