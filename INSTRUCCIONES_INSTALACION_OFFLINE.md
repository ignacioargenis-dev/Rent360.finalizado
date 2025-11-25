# 🚀 INSTRUCCIONES DE INSTALACIÓN - MODO OFFLINE V2.0

## ✅ Archivos ya Creados

Los siguientes archivos YA están creados y listos:

```
✅ src/lib/offline/indexeddb-service.ts
✅ src/lib/offline/offline-queue-service.ts
✅ src/lib/offline/README_OFFLINE.md
✅ src/hooks/useOfflineV2.ts
✅ src/hooks/useOfflineByRole.ts
✅ src/components/offline/OfflineIndicator.tsx
✅ public/sw.js (actualizado a V2.0)
✅ ANALISIS_MODO_OFFLINE_RENT360.md (actualizado)
✅ RESUMEN_MEJORAS_OFFLINE_IMPLEMENTADAS.md
✅ Este archivo
```

## 📦 Dependencia Instalada

```bash
✅ npm install idb
# Ya ejecutado, no necesitas volver a instalar
```

## 🔧 Pasos para Activar el Modo Offline V2.0

### Paso 1: Agregar el Indicador Offline al Layout Principal

**Archivo:** `src/app/layout.tsx` o tu layout principal

```typescript
import OfflineIndicator from '@/components/offline/OfflineIndicator';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <OfflineIndicator /> {/* 👈 Agregar esta línea */}
        {children}
      </body>
    </html>
  );
}
```

### Paso 2: Asegurar que el Service Worker se Registra

El service worker debería registrarse automáticamente a través de `src/lib/pwa.tsx` que ya está configurado.

**Verificar que esté importado en tu app:**

```typescript
// En algún lugar de tu aplicación (ej: layout.tsx o _app.tsx)
import { pwaService } from '@/lib/pwa';

// O usa el hook
import { usePWA } from '@/lib/pwa';
```

### Paso 3: Usar los Hooks en tus Componentes

**Ejemplo para Runner:**

```typescript
// src/app/runner/deliveries/page.tsx
import { useRunnerOffline } from '@/hooks/useOfflineByRole';

export default function RunnerDeliveriesPage() {
  const offline = useRunnerOffline();

  const handleCompleteDelivery = async (id: string) => {
    const signature = await captureSignature();
    await offline.completeDelivery(id, signature);
  };

  return (
    <div>
      <h1>Entregas</h1>
      {offline.isOnline ? '🟢 Online' : '🔴 Offline'}
      {offline.queueSize > 0 && (
        <p>Acciones pendientes: {offline.queueSize}</p>
      )}
      {/* Tu UI aquí */}
    </div>
  );
}
```

**Ejemplo para Support:**

```typescript
// src/app/support/tickets/page.tsx
import { useSupportOffline } from '@/hooks/useOfflineByRole';

export default function SupportTicketsPage() {
  const offline = useSupportOffline();

  const handleCreateTicket = async () => {
    await offline.createTicket({
      userId: 'user-123',
      userName: 'Juan Pérez',
      userEmail: 'juan@email.com',
      userRole: 'TENANT',
      type: 'TECHNICAL',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'Problema técnico',
      description: 'Descripción del problema',
    });
  };

  return (
    <div>
      <h1>Tickets de Soporte</h1>
      <button onClick={handleCreateTicket}>Crear Ticket Offline</button>
      {/* Tu UI aquí */}
    </div>
  );
}
```

**Ejemplo para Maintenance Provider:**

```typescript
// src/app/maintenance-provider/services/page.tsx
import { useMaintenanceProviderOffline } from '@/hooks/useOfflineByRole';

export default function MaintenanceServicesPage() {
  const offline = useMaintenanceProviderOffline();

  const handleCompleteService = async (serviceId: string) => {
    await offline.completeService(serviceId, {
      actualCost: 55000,
      actualDuration: 3.5,
      photos: ['photo1.jpg', 'photo2.jpg'],
      customerSignature: 'signature_base64',
      notes: 'Trabajo completado',
      materials: [
        { name: 'Tubería PVC', quantity: 2, cost: 5000 }
      ],
    });
  };

  return (
    <div>
      <h1>Servicios de Mantenimiento</h1>
      <button onClick={() => handleCompleteService('serv-123')}>
        Completar Servicio Offline
      </button>
      {/* Tu UI aquí */}
    </div>
  );
}
```

### Paso 4: Actualizar tu tsconfig.json (si es necesario)

Asegúrate de que tienes las opciones correctas para importar módulos:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true
    // ... otras opciones
  }
}
```

### Paso 5: Verificar Variables de Entorno

No se requieren nuevas variables de entorno para el modo offline V2.0, pero asegúrate de tener:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
# O tu URL de producción
```

### Paso 6: Probar el Modo Offline

1. **Iniciar el servidor:**

   ```bash
   npm run dev
   ```

2. **Abrir DevTools en Chrome:**
   - F12 > Application > Service Workers
   - Deberías ver "Service Worker v2.0.0" activo

3. **Probar offline:**
   - F12 > Network > Throttling > Offline
   - Intenta crear/editar/eliminar datos
   - Verás la barra superior indicando "Sin conexión"
   - Las acciones se agregan a la cola

4. **Restaurar conexión:**
   - F12 > Network > Throttling > Online
   - Observa cómo se sincroniza automáticamente
   - La barra superior muestra "Sincronizando..."

5. **Verificar IndexedDB:**
   - F12 > Application > IndexedDB > rent360-db
   - Deberías ver todas las stores creadas

6. **Verificar estadísticas en consola:**

   ```javascript
   // En la consola del navegador
   const stats = await indexedDBService.getStats();
   console.log(stats);

   const queue = await offlineQueueService.getQueue();
   console.log(queue);
   ```

---

## 🧪 Testing Recomendado

### Test 1: Crear Entrega Offline (Runner)

1. Desconectar internet
2. Ir a /runner/deliveries
3. Crear nueva entrega
4. Completar entrega con firma y foto
5. Reconectar internet
6. Verificar que se sincronizó en el servidor

### Test 2: Crear Ticket Offline (Support)

1. Desconectar internet
2. Ir a /support/tickets
3. Crear nuevo ticket
4. Actualizar prioridad
5. Resolver ticket
6. Reconectar internet
7. Verificar sincronización

### Test 3: Completar Servicio Offline (Maintenance Provider)

1. Desconectar internet
2. Ir a /maintenance-provider/services
3. Aceptar servicio
4. Iniciar servicio
5. Agregar fotos
6. Completar con firma
7. Reconectar internet
8. Verificar sincronización

### Test 4: Manejo de Errores

1. Desconectar internet
2. Crear múltiples acciones
3. Modificar código del servidor para que falle una acción
4. Reconectar internet
5. Verificar que reintenta automáticamente
6. Verificar estadísticas de acciones fallidas

---

## 🔍 Debugging

### Si el Service Worker no se registra:

1. **Verificar que está habilitado:**

   ```javascript
   if ('serviceWorker' in navigator) {
     console.log('Service Worker soportado');
   } else {
     console.log('Service Worker NO soportado');
   }
   ```

2. **Forzar actualización:**

   ```javascript
   window.resetPWA();
   ```

3. **Verificar errores en consola:**
   - F12 > Console
   - Buscar mensajes de "[SW]"

### Si IndexedDB no se inicializa:

1. **Verificar en consola:**

   ```javascript
   await indexedDBService.init();
   ```

2. **Ver detalles del error:**
   - F12 > Console
   - Buscar "IndexedDB"

### Si la cola no sincroniza:

1. **Verificar conexión:**

   ```javascript
   console.log(navigator.onLine);
   ```

2. **Forzar sincronización:**

   ```javascript
   await offlineQueueService.processQueue();
   ```

3. **Ver estadísticas:**
   ```javascript
   const stats = await offlineQueueService.getStats();
   console.log(stats);
   ```

---

## 📚 Documentación Completa

- **Guía de Uso:** `src/lib/offline/README_OFFLINE.md`
- **Análisis Completo:** `ANALISIS_MODO_OFFLINE_RENT360.md`
- **Resumen de Mejoras:** `RESUMEN_MEJORAS_OFFLINE_IMPLEMENTADAS.md`

---

## ✅ Checklist de Instalación

- [ ] Verificar que `idb` está instalado (ya debería estar)
- [ ] Agregar `<OfflineIndicator />` al layout principal
- [ ] Importar hooks en componentes según rol
- [ ] Probar modo offline en desarrollo
- [ ] Verificar Service Worker registrado
- [ ] Verificar IndexedDB creada
- [ ] Probar sincronización automática
- [ ] Probar sincronización manual
- [ ] Verificar estadísticas en consola
- [ ] Probar en diferentes navegadores
- [ ] Probar en dispositivos móviles

---

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación Rent360 tendrá **modo offline completo** funcionando para **TODOS los roles** en **TODO Chile**.

**¿Dudas?** Consulta la documentación completa en `src/lib/offline/README_OFFLINE.md`

---

**¡Disfruta del modo offline V2.0! 🚀🇨🇱**
