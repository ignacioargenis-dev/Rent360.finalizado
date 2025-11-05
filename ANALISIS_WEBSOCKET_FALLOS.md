# 🔍 ANÁLISIS DE FALLOS EN SISTEMA WEBSOCKET

**Fecha:** 5 de noviembre de 2025
**Estado:** CRÍTICO - WebSocket no funciona correctamente

---

## 🚨 **PROBLEMAS CRÍTICOS IDENTIFICADOS**

Después de analizar el código WebSocket, he identificado **múltiples conflictos y fallos** que explican por qué el sistema no funciona:

### **1. ❌ CONFLICTO DE IMPLEMENTACIONES MÚLTIPLES**

**Archivos WebSocket encontrados:**

- `src/lib/websocket/socket-server.ts` - Servidor Socket.IO
- `src/lib/websocket/socket-client.ts` - Cliente Socket.IO
- `src/hooks/useSocket.ts` - Hook React con Socket.IO
- `src/components/providers/WebSocketProvider.tsx` - Provider React

**Problema:** 4 implementaciones diferentes intentando manejar la misma funcionalidad.

---

### **2. ❌ EVENTOS NO SINCRONIZADOS**

#### **Servidor envía:**

```typescript
// socket-server.ts líneas 210-215
sendToUser(toUserId, 'new-message', {
  fromUserId: socket.userId,
  message,
  conversationId,
  timestamp: new Date(),
});
```

#### **Cliente espera:**

```typescript
// useSocket.ts líneas 111-113
socket.on('dm:received', data => {
  // ...
});
```

**Problema:** Servidor envía `'new-message'`, cliente espera `'dm:received'`.

---

### **3. ❌ CONFIGURACIÓN DE URL INCONSISTENTE**

#### **Admin configura:**

```typescript
// admin settings línea 427
'socket-io': {
  NEXT_PUBLIC_WS_URL: config.serverUrl,
},
```

#### **Cliente usa:**

```typescript
// socket-client.ts línea 30-32
const serverUrl =
  process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
```

#### **Hook alternativo usa:**

```typescript
// useSocket.ts línea 57-58
const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
```

**Problema:** Variables diferentes (`NEXT_PUBLIC_WS_URL` vs `NEXT_PUBLIC_SOCKET_URL`).

---

### **4. ❌ AUTENTICACIÓN INCONSISTENTE**

#### **Servidor espera:**

```typescript
// socket-server.ts línea 65
const token = socket.handshake.auth.token || socket.handshake.query.token;
```

#### **Cliente envía:**

```typescript
// socket-client.ts líneas 35-48
const getTokenFromCookies = (): string | null => {
  // Busca 'auth-token' o 'next-auth.session-token'
};
```

#### **Hook alternativo usa:**

```typescript
// useSocket.ts líneas 38-47
const getToken = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    return user.token; // Propiedad 'token' no existe
  }
};
```

**Problema:** Métodos diferentes de obtener tokens, algunos buscan propiedades inexistentes.

---

### **5. ❌ VARIABLES DE ENTORNO NO CONFIGURADAS**

**Variables requeridas pero no configuradas:**

- `JWT_SECRET` - Para validación de tokens WebSocket
- `NEXT_PUBLIC_WS_URL` - Para conexión del cliente
- `ALLOWED_ORIGINS` - Para CORS del servidor WebSocket

---

## 📊 **MATRIZ DE CONFLICTOS**

| Componente       | Archivo                 | Método           | Estado                       |
| ---------------- | ----------------------- | ---------------- | ---------------------------- |
| **Servidor**     | `socket-server.ts`      | Socket.IO Server | ✅ Funcional                 |
| **Cliente**      | `socket-client.ts`      | Socket.IO Client | ⚠️ Conflicto de eventos      |
| **Hook**         | `useSocket.ts`          | Socket.IO Client | ❌ Autenticación rota        |
| **Provider**     | `WebSocketProvider.tsx` | Wrapper Client   | ⚠️ No usado consistentemente |
| **Admin Config** | `enhanced/page.tsx`     | Variables env    | ❌ Variables incorrectas     |

---

## 🔧 **SOLUCIONES PRIORITARIAS**

### **1. ✅ ELIMINAR IMPLEMENTACIONES DUPLICADAS**

**Mantener solo:**

- `src/lib/websocket/socket-server.ts` (servidor)
- `src/lib/websocket/socket-client.ts` (cliente)

**Eliminar:**

- `src/hooks/useSocket.ts` (duplicado)
- `src/components/providers/WebSocketProvider.tsx` (innecesario)

### **2. ✅ SINCRONIZAR EVENTOS**

**Servidor debe enviar:**

```typescript
socket.emit('new-message', data); // En lugar de sendToUser
```

**Cliente debe escuchar:**

```typescript
socket.on('new-message', data => {
  // Manejar mensaje nuevo
});
```

### **3. ✅ UNIFICAR AUTENTICACIÓN**

**Cliente debe buscar token de:**

```typescript
// Buscar en cookies: 'auth-token', 'next-auth.session-token', 'token'
const token = getTokenFromCookie();
```

**Servidor valida:**

```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### **4. ✅ CORREGIR VARIABLES DE ENTORNO**

**En configuración admin:**

```typescript
'socket-io': {
  NEXT_PUBLIC_WS_URL: config.serverUrl,
  ALLOWED_ORIGINS: config.allowedOrigins || 'https://rent360management-2yxgz.ondigitalocean.app',
},
```

### **5. ✅ ACTUALIZAR LAYOUT**

**Reemplazar WebSocketProvider por implementación directa:**

```typescript
// En layout.tsx
import { websocketClient } from '@/lib/websocket/socket-client';

// Inicializar en useEffect del AuthProvider
```

---

## 🚀 **PLAN DE IMPLEMENTACIÓN**

### **Fase 1: Limpieza (5 min)**

```bash
# Eliminar archivos duplicados
rm src/hooks/useSocket.ts
rm src/components/providers/WebSocketProvider.tsx
```

### **Fase 2: Corregir Eventos (10 min)**

- Sincronizar nombres de eventos entre servidor y cliente
- Unificar formato de datos enviados

### **Fase 3: Autenticación (10 min)**

- Unificar método de obtención de tokens
- Asegurar compatibilidad con sistema de auth actual

### **Fase 4: Variables (5 min)**

- Corregir configuración en admin
- Establecer valores por defecto apropiados

### **Fase 5: Integración (10 min)**

- Actualizar layout.tsx para usar WebSocket correctamente
- Probar conexión completa

---

## 🧪 **VERIFICACIÓN**

Después de implementar:

1. **Verificar conexión:**

   ```bash
   # En navegador console
   websocketClient.isConnected  // Debe ser true
   ```

2. **Verificar eventos:**

   ```bash
   # Enviar mensaje y verificar recepción
   websocketClient.sendMessage(userId, 'test', 'conv1')
   ```

3. **Verificar configuración admin:**
   ```bash
   # Configurar socket-io en admin y verificar variables
   ```

---

## 📞 **RESULTADO ESPERADO**

Después de la corrección:

- ✅ WebSocket se conecta correctamente
- ✅ Mensajes se envían y reciben en tiempo real
- ✅ Notificaciones aparecen instantáneamente
- ✅ Sin conflictos entre implementaciones
- ✅ Configuración admin funciona correctamente

**¿Procedemos con la implementación de estas correcciones?**
