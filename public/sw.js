// Service Worker para Rent360 PWA
const CACHE_NAME = 'rent360-v1.0.0';
const STATIC_CACHE_NAME = 'rent360-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'rent360-dynamic-v1.0.0';

// Recursos críticos que deben cachearse
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CSS y JS principales
  '/_next/static/css/',
  '/_next/static/',
  // Componentes UI críticos
  '/_next/static/chunks/',
];

// APIs que deben cachearse para funcionamiento offline
const API_CACHE_PATTERNS = [
  '/api/health',
  // Removidas APIs que requieren autenticación para evitar errores 401/500
  // '/api/auth/me',
  // '/api/properties',
  // '/api/user/profile',
];

// Recursos que no deben cachearse
const NO_CACHE_PATTERNS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/payments',
  '/api/admin',
];

// Configuración de cache
const CACHE_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
  maxEntries: 100,
  strategies: {
    networkFirst: ['/api/health'],
    // Removidas estrategias para APIs que requieren autenticación
    // networkFirst: ['/api/health', '/api/auth/me'],
    // cacheFirst: ['/api/properties', '/static/'],
    staleWhileRevalidate: ['/_next/static/'],
  },
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    Promise.all([
      // Cache recursos estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => !asset.includes('/_next/')));
      }),

      // Cache recursos dinámicos críticos
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching dynamic assets');
        return cache.addAll([
          '/offline',
          '/manifest.json',
        ]);
      }),

      // Forzar activación inmediata
      self.skipWaiting(),
    ])
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Tomar control inmediato
      self.clients.claim(),
    ])
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no GET
  if (request.method !== 'GET') return;

  // Ignorar requests que no deben cachearse
  if (NO_CACHE_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
    return;
  }

  // Estrategia de cache basada en el tipo de request
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/') || url.pathname.includes('.')) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Manejar requests de API
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  try {
    // Intentar network first para APIs
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cachear respuesta exitosa
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url);
  }

  // Fallback a cache
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Si no hay cache, devolver error offline
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Esta funcionalidad no está disponible sin conexión a internet',
      offline: true,
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Manejar requests estáticos
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);

  // Cache first para recursos estáticos
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static resource:', request.url);
  }

  return new Response('', { status: 404 });
}

// Manejar requests de páginas
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for page request:', request.url);
  }

  // Fallback a página offline
  const offlineResponse = await cache.match('/offline');
  if (offlineResponse) {
    return offlineResponse;
  }

  // Último fallback
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rent360 - Sin Conexión</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
        .offline { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="offline">
        <div class="icon">📱</div>
        <h1>Sin Conexión</h1>
        <p>Rent360 no está disponible en este momento. Verifica tu conexión a internet.</p>
        <button onclick="window.location.reload()">Reintentar</button>
      </div>
    </body>
    </html>
    `,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}

// Sincronización en background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_DATA':
      cacheData(data);
      break;

    case 'GET_CACHED_DATA':
      getCachedData(event);
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Función para sincronización en background
async function doBackgroundSync() {
  console.log('[SW] Performing background sync');

  try {
    // Sincronizar datos pendientes
    await syncPendingData();

    // Actualizar caches
    await updateCaches();

    // Notificar al cliente
    await notifyClients('SYNC_COMPLETED', { success: true });
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    await notifyClients('SYNC_FAILED', { error: error.message });
  }
}

// Sincronizar datos pendientes
async function syncPendingData() {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);

  // Obtener datos pendientes del cache
  const pendingRequests = await cache.matchAll(new Request('/pending-requests'));

  for (const request of pendingRequests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        // Remover de pendientes y cachear respuesta
        await cache.delete(request);
        await cache.put(request, response);
      }
    } catch (error) {
      console.log('[SW] Failed to sync pending request:', request.url);
    }
  }
}

// Actualizar caches
async function updateCaches() {
  const cache = await caches.open(STATIC_CACHE_NAME);

  // Actualizar recursos críticos
  const criticalResources = [
    '/manifest.json',
    '/favicon.ico',
  ];

  for (const resource of criticalResources) {
    try {
      const response = await fetch(resource);
      if (response.ok) {
        await cache.put(resource, response);
      }
    } catch (error) {
      console.log('[SW] Failed to update cache for:', resource);
    }
  }
}

// Cachear datos desde el cliente
async function cacheData(data) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const request = new Request(`/cached-data/${Date.now()}`);
  const response = new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });

  await cache.put(request, response);
}

// Obtener datos cacheados
async function getCachedData(event) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const keys = await cache.keys();

  const cachedData = [];
  for (const request of keys) {
    if (request.url.includes('/cached-data/')) {
      const response = await cache.match(request);
      if (response) {
        const data = await response.json();
        cachedData.push(data);
      }
    }
  }

  event.ports[0].postMessage({
    type: 'CACHED_DATA',
    data: cachedData,
  });
}

// Notificar a todos los clientes
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();

  clients.forEach(client => {
    client.postMessage({
      type,
      data,
      timestamp: Date.now(),
    });
  });
}

// Manejar errores no capturados
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

// Limpiar caches periódicamente
setInterval(async () => {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const keys = await cache.keys();

    // Remover entradas antiguas (más de 24 horas)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date && new Date(date).getTime() < cutoff) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.log('[SW] Cache cleanup error:', error);
  }
}, 60 * 60 * 1000); // Cada hora