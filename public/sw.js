// Service Worker avanzado para Rent360 con cache dinámico y Background Sync
// Versión: 2.0.0

const CACHE_NAME = 'rent360-v2';
const API_CACHE_NAME = 'rent360-api-v2';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/offline',
];

// Recursos de API que se pueden cachear (solo GET)
const CACHEABLE_API_PATTERNS = [
  '/api/properties',
  '/api/contracts',
  '/api/payments',
  '/api/maintenance',
  '/api/notifications',
  '/api/owner/properties',
  '/api/owner/contracts',
  '/api/owner/payments',
  '/api/tenant/properties',
  '/api/tenant/contracts',
  '/api/broker/properties',
  '/api/runner/deliveries',
  '/api/support/tickets',
  '/api/maintenance-provider/services',
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v2.0.0...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated successfully');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

// Verificar si una URL de API es cacheable
function isApiCacheable(url) {
  return CACHEABLE_API_PATTERNS.some(pattern => url.includes(pattern));
}

// Estrategia Network-First con Cache Fallback para APIs
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Si la respuesta es exitosa, cachearla
    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Si falla la red, intentar obtener del cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning cached API response for:', request.url);
      return cachedResponse;
    }

    // Si no hay cache, devolver error
    throw error;
  }
}

// Estrategia Cache-First con Network Fallback para recursos estáticos
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Si todo falla, devolver página offline
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    throw error;
  }
}

// Interceptar requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen o cross-origin específicos
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('localhost')) {
    return;
  }

  // Solo interceptar requests GET
  if (request.method !== 'GET') {
    return;
  }

  // No interceptar requests a _next (Next.js chunks) - déjalos pasar normalmente
  if (url.pathname.includes('/_next/')) {
    return;
  }

  // Estrategia para APIs cacheables: Network-First
  if (url.pathname.includes('/api/') && isApiCacheable(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // APIs no cacheables: dejar pasar sin cache
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Recursos estáticos: Cache-First
  event.respondWith(cacheFirstStrategy(request));
});

// Background Sync para cola offline
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Sincronizar cola offline
async function syncOfflineQueue() {
  try {
    console.log('[SW] Syncing offline queue...');

    // Enviar mensaje a los clientes para que procesen la cola
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_OFFLINE_QUEUE',
        timestamp: Date.now(),
      });
    }

    console.log('[SW] Offline queue sync completed');
  } catch (error) {
    console.error('[SW] Offline queue sync failed:', error);
    throw error;
  }
}

// Periodic Background Sync (si está soportado)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'sync-data-periodic') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Rent360';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ version: '2.0.0' });
      }
      break;

    case 'CLEAR_API_CACHE':
      event.waitUntil(
        caches.delete(API_CACHE_NAME).then(() => {
          console.log('[SW] API cache cleared');
        })
      );
      break;

    case 'CLEAR_ALL_CACHE':
      event.waitUntil(
        Promise.all([caches.delete(CACHE_NAME), caches.delete(API_CACHE_NAME)]).then(() => {
          console.log('[SW] All caches cleared');
        })
      );
      break;

    case 'SYNC_NOW':
      event.waitUntil(syncOfflineQueue());
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service Worker script loaded v2.0.0');
