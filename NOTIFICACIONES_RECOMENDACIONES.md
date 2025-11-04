# Recomendaciones para Activar el Sistema de Notificaciones

## Análisis del Sistema Actual

El sistema de notificaciones está **parcialmente implementado** pero necesita configuración para funcionar correctamente en producción.

### Componentes Existentes

1. **Backend (`NotificationService`)**: ✅ Funcional
   - Crea notificaciones en la base de datos
   - Está en `src/lib/notification-service.ts`
   - Método: `NotificationService.create(params)`

2. **Servidor WebSocket (`socket-server.ts`)**: ✅ Funcional
   - Maneja conexiones WebSocket
   - Está en `src/lib/websocket/socket-server.ts`
   - Se inicializa en `server.ts`

3. **Cliente WebSocket (`socket-client.ts`)**: ✅ Funcional
   - Cliente para conectar desde el frontend
   - Está en `src/lib/websocket/socket-client.ts`
   - Hook: `useWebSocket()`

### Problemas Identificados

1. **DigitalOcean no usa `server.ts`**:
   - DigitalOcean App Platform probablemente ejecuta `next start` directamente
   - `server.ts` con WebSocket no se está ejecutando
   - **Solución**: Configurar DigitalOcean para usar `server.ts` o crear un servidor Next.js API route para WebSocket

2. **Cliente WebSocket no se conecta automáticamente**:
   - El hook `useWebSocket()` existe pero no se está usando en las páginas
   - No hay componente global que inicialice la conexión
   - **Solución**: Agregar inicialización automática en el layout principal

3. **Variables de entorno faltantes**:
   - `NEXT_PUBLIC_WS_URL` podría no estar configurada
   - **Solución**: Configurar en DigitalOcean

---

## Soluciones Recomendadas

### Opción 1: Usar `server.ts` en DigitalOcean (Recomendada)

**Pasos:**

1. **Configurar DigitalOcean App Platform**:
   - En la configuración del App, cambiar el comando de inicio de:
     ```
     npm start
     ```
     a:
     ```
     npm run start
     ```
   - O verificar que `package.json` tiene `"start": "NODE_ENV=production tsx server.ts"`

2. **Verificar que `tsx` está instalado**:

   ```bash
   npm install tsx --save
   ```

3. **Agregar variable de entorno en DigitalOcean**:
   - `NEXT_PUBLIC_WS_URL`: `https://rent360management-2yxgz.ondigitalocean.app`
   - O dejar que use automáticamente `window.location.origin`

4. **Verificar que el puerto es correcto**:
   - DigitalOcean asigna el puerto automáticamente via `process.env.PORT`
   - El código ya lo maneja correctamente

### Opción 2: Usar API Routes de Next.js para WebSocket (Alternativa)

Si DigitalOcean no permite usar `server.ts`, crear un API route para WebSocket:

1. **Crear `/app/api/socket/route.ts`** que inicialice el servidor WebSocket
2. **Modificar el cliente** para conectarse a `/api/socket`

**Nota**: Esta opción es más compleja y requiere configuración adicional.

---

## Implementación del Cliente WebSocket en el Frontend

### Paso 1: Crear un Provider Global de WebSocket

Crear `src/components/providers/WebSocketProvider.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { websocketClient } from '@/lib/websocket/socket-client';
import { logger } from '@/lib/logger-minimal';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      logger.info('Inicializando WebSocket client', { userId: user.id });
      websocketClient.connect();

      // Escuchar notificaciones
      websocketClient.on('notification', (data) => {
        logger.info('Notificación recibida', { data });
        // Aquí puedes mostrar un toast o actualizar el contador de notificaciones
      });

      return () => {
        websocketClient.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
```

### Paso 2: Agregar el Provider al Layout Principal

En `src/app/layout.tsx` o donde esté el layout principal:

```typescript
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Paso 3: Usar Notificaciones en Componentes

En cualquier componente donde necesites recibir notificaciones:

```typescript
import { useWebSocket } from '@/lib/websocket/socket-client';
import { useEffect } from 'react';

export function MyComponent() {
  const { isConnected, notifications } = useWebSocket();

  useEffect(() => {
    if (notifications.length > 0) {
      // Mostrar la última notificación
      const latest = notifications[0];
      // Mostrar toast o actualizar UI
    }
  }, [notifications]);

  return (
    <div>
      {isConnected ? 'Conectado' : 'Desconectado'}
      {/* Tu UI aquí */}
    </div>
  );
}
```

---

## Configuración de Variables de Entorno

### En DigitalOcean App Platform:

1. Ve a **Settings** → **App-Level Environment Variables**
2. Agrega:
   - `NEXT_PUBLIC_WS_URL`: `https://rent360management-2yxgz.ondigitalocean.app`
   - O déjalo vacío para usar automáticamente `window.location.origin`

---

## Verificación del Sistema

### 1. Verificar que el servidor WebSocket está corriendo:

En los logs de DigitalOcean, deberías ver:

```
> WebSocket server initialized
```

Si no aparece, el servidor no se está inicializando.

### 2. Verificar que el cliente se conecta:

En la consola del navegador (F12), deberías ver:

```
WebSocket connected
```

Si no aparece, el cliente no se está conectando.

### 3. Probar una notificación:

En una API route, puedes probar:

```typescript
import { NotificationService } from '@/lib/notification-service';

await NotificationService.create({
  userId: 'user-id',
  type: 'SYSTEM_ALERT',
  title: 'Prueba',
  message: 'Esta es una notificación de prueba',
});
```

Si funciona, deberías:

1. Ver la notificación en la base de datos (`Notification` table)
2. Recibirla en tiempo real si el WebSocket está conectado

---

## Solución Rápida (Temporal)

Si necesitas que las notificaciones funcionen **ahora mismo** sin WebSocket:

1. **Usar polling** (consulta periódica):
   - Crear un hook que consulte `/api/notifications` cada 30 segundos
   - Actualizar el contador de notificaciones

2. **Usar notificaciones del navegador**:
   - Usar la API `Notification` del navegador
   - Requiere permisos del usuario

---

## Prioridades de Implementación

1. **ALTA**: Configurar DigitalOcean para usar `server.ts` (Opción 1)
2. **ALTA**: Crear `WebSocketProvider` y agregarlo al layout
3. **MEDIA**: Agregar indicador visual de conexión WebSocket
4. **MEDIA**: Implementar sistema de toasts para notificaciones
5. **BAJA**: Agregar sonidos/alertas para notificaciones importantes

---

## Código de Ejemplo para Notificaciones de Pago

Una vez que el sistema esté funcionando, puedes descomentar en `owner-payment-service.ts`:

```typescript
import { NotificationService } from '@/lib/notification-service';

// En chargePayment, después de procesar el pago exitosamente:
await NotificationService.create({
  userId: ownerPayment.ownerId,
  type: 'PAYMENT_SUCCESS',
  title: 'Pago procesado exitosamente',
  message: `Se ha procesado el pago de $${ownerPayment.amount.toLocaleString()} CLP por el servicio de runner.`,
  link: `/owner/payments/${ownerPayment.visitId}`,
  priority: 'high',
});
```

---

## Checklist Final

- [ ] DigitalOcean configurado para usar `server.ts`
- [ ] Variable `NEXT_PUBLIC_WS_URL` configurada (o usando automático)
- [ ] `WebSocketProvider` creado y agregado al layout
- [ ] Logs de DigitalOcean muestran "WebSocket server initialized"
- [ ] Consola del navegador muestra "WebSocket connected"
- [ ] Notificación de prueba funciona
- [ ] Descomentar código de notificaciones en `owner-payment-service.ts`

---

¿Necesitas ayuda con algún paso específico?
