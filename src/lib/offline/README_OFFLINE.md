# 📴 Modo Offline V2.0 - Guía de Uso

## 🎯 Resumen

El sistema Rent360 incluye un **modo offline completo** que permite trabajar sin conexión a internet. Todos los cambios se guardan localmente y se sincronizan automáticamente cuando recuperas la conexión.

## 🚀 Características Principales

### ✅ Almacenamiento IndexedDB

- Almacenamiento ilimitado (vs 5-10MB de localStorage)
- Base de datos estructurada con índices
- Consultas rápidas y eficientes

### ✅ Cola de Acciones Offline

- Crear, editar y eliminar datos sin conexión
- Sincronización automática con reintentos
- Manejo de errores robusto

### ✅ Background Sync API

- Sincronización en segundo plano
- Sincronización periódica automática
- Sincronización al recuperar conexión

### ✅ Cache Dinámico

- APIs cacheadas con estrategia Network-First
- Fallback a cache cuando no hay conexión
- Actualización automática del cache

### ✅ Indicador Visual

- Barra superior con estado de conexión
- Contador de acciones pendientes
- Botón de sincronización manual

---

## 📖 Guía de Uso por Rol

### 👨‍💼 Propietarios (Owner)

```typescript
import { useOwnerOffline } from '@/hooks/useOfflineByRole';

function OwnerComponent() {
  const offline = useOwnerOffline();

  // Crear propiedad offline
  const handleCreateProperty = async () => {
    const queueId = await offline.createProperty({
      title: 'Nueva Propiedad',
      address: 'Av. Providencia 123',
      city: 'Santiago',
      price: 450000,
      // ... más datos
    });

    console.log('Propiedad agregada a la cola:', queueId);
    // Se sincronizará automáticamente cuando haya conexión
  };

  // Actualizar propiedad offline
  const handleUpdateProperty = async (propertyId: string) => {
    await offline.updateProperty(propertyId, {
      price: 500000,
      status: 'available',
    });
  };

  // Solicitar mantenimiento offline
  const handleRequestMaintenance = async () => {
    await offline.requestMaintenance({
      propertyId: 'prop-123',
      type: 'PLUMBING',
      description: 'Fuga en baño principal',
      priority: 'HIGH',
    });
  };

  return (
    <div>
      <button onClick={handleCreateProperty}>Crear Propiedad</button>
      <button onClick={() => handleUpdateProperty('prop-123')}>
        Actualizar Propiedad
      </button>
      <button onClick={handleRequestMaintenance}>Solicitar Mantenimiento</button>

      {/* Estado offline */}
      <p>Estado: {offline.isOnline ? 'Online' : 'Offline'}</p>
      <p>Acciones pendientes: {offline.queueSize}</p>

      {/* Sincronizar manualmente */}
      {offline.isOnline && offline.queueSize > 0 && (
        <button onClick={() => offline.syncNow()}>
          Sincronizar Ahora
        </button>
      )}
    </div>
  );
}
```

---

### 👨‍🦰 Inquilinos (Tenant)

```typescript
import { useTenantOffline } from '@/hooks/useOfflineByRole';

function TenantComponent() {
  const offline = useTenantOffline();

  // Reportar problema offline
  const handleReportIssue = async () => {
    await offline.reportIssue({
      propertyId: 'prop-123',
      type: 'MAINTENANCE',
      category: 'PLUMBING',
      description: 'El lavabo pierde agua',
      priority: 'MEDIUM',
    });

    alert('Problema reportado. Se sincronizará cuando haya conexión.');
  };

  // Guardar búsqueda offline
  const handleSaveSearch = async () => {
    await offline.saveSearch({
      city: 'Santiago',
      minPrice: 300000,
      maxPrice: 600000,
      bedrooms: 2,
    });
  };

  return (
    <div>
      <button onClick={handleReportIssue}>Reportar Problema</button>
      <button onClick={handleSaveSearch}>Guardar Búsqueda</button>
    </div>
  );
}
```

---

### 🏃 Runner360

```typescript
import { useRunnerOffline } from '@/hooks/useOfflineByRole';

function RunnerComponent() {
  const offline = useRunnerOffline();

  // Actualizar estado de entrega
  const handleUpdateDelivery = async (deliveryId: string) => {
    await offline.updateDeliveryStatus(deliveryId, 'IN_TRANSIT', {
      gpsLocation: {
        lat: -33.4489,
        lng: -70.6693,
        timestamp: new Date(),
      },
    });
  };

  // Completar entrega con firma y foto
  const handleCompleteDelivery = async (deliveryId: string) => {
    const signature = await captureSignature(); // Tu lógica de firma
    const photo = await takePhoto(); // Tu lógica de foto

    await offline.completeDelivery(
      deliveryId,
      signature,
      photo,
      {
        lat: -33.4489,
        lng: -70.6693,
        timestamp: new Date(),
      }
    );

    alert('Entrega completada! Se sincronizará automáticamente.');
  };

  // Obtener entregas pendientes (del cache)
  const loadPendingDeliveries = async () => {
    const deliveries = await offline.getPendingDeliveries();
    console.log('Entregas pendientes:', deliveries);
  };

  return (
    <div>
      <button onClick={() => handleUpdateDelivery('del-123')}>
        En Camino
      </button>
      <button onClick={() => handleCompleteDelivery('del-123')}>
        Completar Entrega
      </button>
      <button onClick={loadPendingDeliveries}>
        Ver Entregas Pendientes
      </button>

      {/* Indicador de sincronización */}
      {offline.isSyncing && <p>Sincronizando...</p>}
    </div>
  );
}
```

---

### 🆘 Soporte (Support)

```typescript
import { useSupportOffline } from '@/hooks/useOfflineByRole';

function SupportComponent() {
  const offline = useSupportOffline();

  // Crear ticket offline
  const handleCreateTicket = async () => {
    await offline.createTicket({
      userId: 'user-123',
      userName: 'Juan Pérez',
      userEmail: 'juan@email.com',
      userRole: 'TENANT',
      type: 'TECHNICAL',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'No puedo iniciar sesión',
      description: 'Al intentar iniciar sesión, aparece error 500',
    });

    alert('Ticket creado offline. Se sincronizará automáticamente.');
  };

  // Actualizar ticket offline
  const handleUpdateTicket = async (ticketId: string) => {
    await offline.updateTicket(ticketId, {
      status: 'IN_PROGRESS',
      assignedTo: 'support-agent-1',
    });
  };

  // Resolver ticket offline
  const handleResolveTicket = async (ticketId: string) => {
    await offline.resolveTicket(
      ticketId,
      'Se reseteo la contraseña. Usuario puede acceder ahora.'
    );
  };

  // Obtener tickets urgentes (del cache)
  const loadUrgentTickets = async () => {
    const tickets = await offline.getTicketsByPriority('URGENT');
    console.log('Tickets urgentes:', tickets);
  };

  return (
    <div>
      <button onClick={handleCreateTicket}>Crear Ticket</button>
      <button onClick={() => handleUpdateTicket('tick-123')}>
        Asignar Ticket
      </button>
      <button onClick={() => handleResolveTicket('tick-123')}>
        Resolver Ticket
      </button>
      <button onClick={loadUrgentTickets}>Ver Tickets Urgentes</button>
    </div>
  );
}
```

---

### 🔧 Proveedores de Mantenimiento

```typescript
import { useMaintenanceProviderOffline } from '@/hooks/useOfflineByRole';

function MaintenanceProviderComponent() {
  const offline = useMaintenanceProviderOffline();

  // Aceptar servicio offline
  const handleAcceptService = async (serviceId: string) => {
    await offline.acceptService(
      serviceId,
      50000, // Costo estimado
      3, // Horas estimadas
      new Date('2025-11-26T10:00:00')
    );

    alert('Servicio aceptado offline. Se sincronizará automáticamente.');
  };

  // Iniciar servicio offline
  const handleStartService = async (serviceId: string) => {
    await offline.startService(serviceId);
  };

  // Agregar foto offline
  const handleAddPhoto = async (serviceId: string) => {
    const photo = await takePhoto(); // Tu lógica de foto
    await offline.addServicePhoto(serviceId, photo);
  };

  // Completar servicio offline
  const handleCompleteService = async (serviceId: string) => {
    const signature = await captureSignature();
    const photos = await capturePhotos();

    await offline.completeService(serviceId, {
      actualCost: 55000,
      actualDuration: 3.5,
      photos: photos,
      customerSignature: signature,
      notes: 'Trabajo completado satisfactoriamente',
      materials: [
        { name: 'Tubería PVC 1/2"', quantity: 2, cost: 5000 },
        { name: 'Pegamento PVC', quantity: 1, cost: 3000 },
      ],
    });

    alert('Servicio completado! Se sincronizará automáticamente.');
  };

  // Obtener servicios pendientes (del cache)
  const loadPendingServices = async () => {
    const services = await offline.getPendingServices();
    console.log('Servicios pendientes:', services);
  };

  return (
    <div>
      <button onClick={() => handleAcceptService('serv-123')}>
        Aceptar Servicio
      </button>
      <button onClick={() => handleStartService('serv-123')}>
        Iniciar Servicio
      </button>
      <button onClick={() => handleAddPhoto('serv-123')}>
        Agregar Foto
      </button>
      <button onClick={() => handleCompleteService('serv-123')}>
        Completar Servicio
      </button>
      <button onClick={loadPendingServices}>
        Ver Servicios Pendientes
      </button>
    </div>
  );
}
```

---

## 🛠️ Hook Genérico useOfflineV2

Para funcionalidades personalizadas, puedes usar el hook genérico:

```typescript
import { useOfflineV2 } from '@/hooks/useOfflineV2';

function CustomComponent() {
  const offline = useOfflineV2();

  // Crear cualquier recurso offline
  const handleCreate = async () => {
    const queueId = await offline.createOffline(
      'custom-resource', // Nombre del recurso
      '/api/custom/endpoint', // Endpoint de API
      { name: 'Test', value: 123 } // Datos
    );
  };

  // Actualizar cualquier recurso offline
  const handleUpdate = async () => {
    await offline.updateOffline(
      'custom-resource',
      '/api/custom/endpoint/123',
      { id: '123', name: 'Updated', value: 456 }
    );
  };

  // Eliminar cualquier recurso offline
  const handleDelete = async () => {
    await offline.deleteOffline(
      'custom-resource',
      '/api/custom/endpoint/123',
      '123'
    );
  };

  // Obtener datos cacheados
  const loadCachedData = async () => {
    const data = await offline.getCachedData('custom-resource');
    console.log('Datos en cache:', data);
  };

  // Sincronizar manualmente
  const handleSync = async () => {
    const result = await offline.syncNow();
    console.log(`Sincronizados: ${result.success}, Fallidos: ${result.failed}`);
  };

  // Obtener estadísticas
  const loadStats = async () => {
    const stats = await offline.getCacheStats();
    console.log('Estadísticas:', stats);

    const queueStats = await offline.getQueueStats();
    console.log('Cola:', queueStats);
  };

  // Limpiar cache
  const handleClearCache = async () => {
    await offline.clearCache();
    alert('Cache limpiado');
  };

  return (
    <div>
      {/* Estado */}
      <p>Online: {offline.isOnline ? 'Sí' : 'No'}</p>
      <p>Cola: {offline.queueSize} acciones</p>
      <p>Sincronizando: {offline.isSyncing ? 'Sí' : 'No'}</p>
      <p>Última sync: {offline.lastSyncTime?.toLocaleString()}</p>

      {/* Cache stats */}
      <pre>{JSON.stringify(offline.cachedData, null, 2)}</pre>

      {/* Acciones */}
      <button onClick={handleCreate}>Crear</button>
      <button onClick={handleUpdate}>Actualizar</button>
      <button onClick={handleDelete}>Eliminar</button>
      <button onClick={loadCachedData}>Ver Cache</button>
      <button onClick={handleSync}>Sincronizar</button>
      <button onClick={loadStats}>Ver Stats</button>
      <button onClick={handleClearCache}>Limpiar Cache</button>
    </div>
  );
}
```

---

## 🎨 Componente OfflineIndicator

Agregar el indicador de estado offline en tu layout:

```typescript
// app/layout.tsx o en tu layout principal
import OfflineIndicator from '@/components/offline/OfflineIndicator';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <OfflineIndicator /> {/* Barra superior con estado */}
        {children}
      </body>
    </html>
  );
}
```

El indicador muestra automáticamente:

- 🟢 Estado de conexión (Online/Offline)
- 📊 Número de acciones pendientes
- 🔄 Estado de sincronización
- ⏰ Última sincronización
- 🔘 Botón para sincronizar manualmente
- 📈 Panel expandible con detalles

---

## 🔧 Funciones Globales de Debug

Desde la consola del navegador:

```javascript
// Resetear PWA completamente (cache + service worker)
window.resetPWA();

// Limpiar solo el cache
window.clearAppCache();

// Verificar estadísticas de IndexedDB
const stats = await indexedDBService.getStats();
console.log(stats);

// Ver cola de acciones
const queue = await offlineQueueService.getQueue();
console.log(queue);

// Forzar sincronización
await offlineQueueService.processQueue();
```

---

## 📊 Eventos Personalizados

Escucha eventos de la cola offline:

```typescript
// Acción agregada a la cola
window.addEventListener('offline-queue-action-enqueued', event => {
  console.log('Acción agregada:', event.detail);
});

// Acción sincronizada exitosamente
window.addEventListener('offline-queue-action-synced', event => {
  console.log('Acción sincronizada:', event.detail);
});

// Acción falló
window.addEventListener('offline-queue-action-failed', event => {
  console.log('Acción falló:', event.detail);
});

// Sincronización iniciada
window.addEventListener('offline-queue-sync-started', () => {
  console.log('Sincronización iniciada');
});

// Sincronización completada
window.addEventListener('offline-queue-sync-completed', event => {
  console.log('Sincronización completada:', event.detail);
});
```

---

## ⚙️ Configuración

### Configurar Reintentos

```typescript
import { offlineQueueService } from '@/lib/offline/offline-queue-service';

// Cambiar número máximo de reintentos (default: 3)
offlineQueueService.setMaxRetries(5);

// Cambiar delay entre reintentos (default: 1000ms)
offlineQueueService.setRetryDelay(2000);
```

### Limpiar Acciones Fallidas

```typescript
// Eliminar acciones que excedieron max retries
const removed = await offlineQueueService.clearFailedActions();
console.log(`Eliminadas ${removed} acciones fallidas`);
```

---

## 🚀 Mejores Prácticas

### 1. Feedback al Usuario

```typescript
const handleAction = async () => {
  const queueId = await offline.createOffline(...);

  if (!navigator.onLine) {
    toast.info('Acción guardada. Se sincronizará cuando haya conexión.');
  } else {
    toast.success('Acción guardada y sincronizada.');
  }
};
```

### 2. Indicador de Datos Offline

```typescript
function PropertyCard({ property }) {
  const isOffline = property._isOffline;

  return (
    <div>
      {property.title}
      {isOffline && (
        <Badge variant="warning">Pendiente de sincronización</Badge>
      )}
    </div>
  );
}
```

### 3. Manejo de Conflictos

```typescript
// El servidor debe manejar conflictos con timestamps
{
  updatedAt: new Date().toISOString(),
  _offlineTimestamp: Date.now()
}
```

### 4. Optimistic UI Updates

```typescript
const handleUpdate = async (id: string, updates: any) => {
  // Actualizar UI inmediatamente
  setData(prev =>
    prev.map(item => (item.id === id ? { ...item, ...updates, _isOffline: true } : item))
  );

  // Agregar a cola offline
  await offline.updateOffline('resource', `/api/resource/${id}`, {
    id,
    ...updates,
  });
};
```

---

## ❓ Preguntas Frecuentes

### ¿Cuánto almacenamiento tengo disponible?

IndexedDB no tiene un límite fijo, pero generalmente es al menos 50MB y puede crecer hasta varios GB dependiendo del navegador y espacio disponible.

### ¿Qué pasa si tengo muchas acciones pendientes?

El sistema sincroniza automáticamente con delays entre acciones para no sobrecargar el servidor. Puedes ajustar el delay con `setRetryDelay()`.

### ¿Puedo eliminar acciones de la cola manualmente?

Sí: `await offline.removeFromQueue(queueId)`

### ¿Cómo sé si una acción falló después de todos los reintentos?

Escucha el evento `offline-queue-action-failed` o consulta las estadísticas: `await offline.getQueueStats()`

### ¿El modo offline funciona en todos los navegadores?

Sí, en todos los navegadores modernos. IndexedDB está soportado desde:

- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge (todas las versiones)

---

## 📞 Soporte

Si encuentras problemas con el modo offline:

1. Verifica la consola del navegador para errores
2. Ejecuta `window.resetPWA()` para limpiar cache
3. Revisa las estadísticas con `await indexedDBService.getStats()`
4. Contacta al equipo de desarrollo con logs y detalles del error

---

**✨ ¡Disfruta trabajando sin conexión en TODO Chile! 🇨🇱**
