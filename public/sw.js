// Service Worker simplificado para Rent360
// Versión: 1.0.0

const CACHE_NAME = 'rent360-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_CACHE_URLS);
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
            if (cacheName !== CACHE_NAME) {
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

// Interceptar requests
self.addEventListener('fetch', event => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // No interceptar requests a APIs
  if (event.request.url.includes('/api/')) {
    return;
  }

  // No interceptar requests a _next (Next.js chunks)
  if (event.request.url.includes('/_next/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en cache, devolverlo
      if (response) {
        return response;
      }

      // Si no está en cache, hacer fetch y cachear
      return fetch(event.request)
        .then(response => {
          // Solo cachear respuestas exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta para cachearla
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(error => {
          console.warn('[SW] Fetch failed:', error);
          // Devolver página offline si está disponible
          return caches.match('/offline');
        });
    })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' });
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

console.log('[SW] Service Worker script loaded');
