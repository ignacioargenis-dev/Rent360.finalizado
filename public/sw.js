// Service Worker - Auto-desinstalación y limpieza de cache
// Este SW se desinstala automáticamente y limpia todas las caches

console.log('[SW] 🔥 EMERGENCY CLEANUP: Auto-unregistering and clearing all caches');

// En instalación: no cachear nada y auto-activarse
self.addEventListener('install', event => {
  console.log('[SW] 🚨 Installing CLEANUP service worker - NO CACHING');
  self.skipWaiting(); // Activar inmediatamente
});

// En activación: borrar TODAS las caches y tomar control
self.addEventListener('activate', event => {
  console.log('[SW] 🧹 Activating CLEANUP mode - Deleting ALL caches');

  event.waitUntil(
    Promise.all([
      // Borrar TODAS las caches existentes
      caches.keys().then(cacheNames => {
        console.log('[SW] 🗑️ Found caches:', cacheNames);
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW] 🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Tomar control de todos los clientes
      self.clients.claim(),
    ]).then(() => {
      console.log('[SW] ✅ All caches deleted, clients claimed');

      // Desregistrar este Service Worker después de limpiar
      self.registration.unregister().then(() => {
        console.log('[SW] ✅ Service Worker unregistered successfully');
      });
    })
  );
});

// En fetch: NO cachear nada, pasar todas las requests directamente a la red
self.addEventListener('fetch', event => {
  // NO interceptar nada, dejar que vaya directamente a la red
  console.log('[SW] 🌐 Bypassing cache for:', event.request.url);
  return;
});

// Manejar mensajes
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] ⏭️ SKIP_WAITING received');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'UNREGISTER') {
    console.log('[SW] 🔴 UNREGISTER received');
    self.registration.unregister();
  }
});

console.log('[SW] 🚀 CLEANUP Service Worker script loaded');
