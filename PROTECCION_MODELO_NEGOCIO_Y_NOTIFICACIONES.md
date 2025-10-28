# 🔒 Protección del Modelo de Negocio + 🔔 Notificaciones en Tiempo Real

## Resumen Ejecutivo

Se han implementado dos sistemas críticos para la plataforma:

1. **🔒 Validación de Comisiones**: Protege el modelo de negocio asegurando que los corredores no puedan proponer comisiones superiores al máximo configurado por el administrador.

2. **🔔 Notificaciones en Tiempo Real**: Sistema completo de notificaciones que mantiene informados a usuarios y corredores de todas las interacciones importantes.

---

## 🔒 PARTE 1: Protección del Modelo de Negocio

### Problema Identificado

Los corredores podían proponer comisiones sin restricciones en:

- Invitaciones a usuarios
- Respuestas del marketplace
- Gestión de propiedades de clientes

Esto ponía en riesgo el modelo de negocio, ya que podrían proponer tasas superiores a las permitidas por el sistema.

### Solución Implementada

#### **CommissionValidator**

Nuevo servicio en `src/lib/commission-validator.ts`:

```typescript
export class CommissionValidator {
  /**
   * Valida que una comisión propuesta no exceda el máximo del sistema
   */
  static async validateProposedCommission(proposedRate: number | null | undefined): Promise<{
    valid: boolean;
    maxRate?: number;
    error?: string;
  }>;

  /**
   * Obtiene la comisión máxima permitida del sistema
   */
  static async getMaxCommissionRate(): Promise<number>;
}
```

#### **Flujo de Validación**

```
1. Corredor propone comisión (ej: 6%)
                │
                ▼
2. CommissionValidator.validateProposedCommission(6)
                │
                ▼
3. Obtiene max del sistema desde CommissionService (ej: 5%)
                │
                ▼
4. Compara: 6% > 5% ❌
                │
                ▼
5. Retorna: { valid: false, error: "Excede máximo", maxRate: 5 }
                │
                ▼
6. API responde 400 con error detallado
                │
                ▼
7. UI muestra: "La comisión propuesta (6%) excede el máximo permitido (5%)"
```

### Endpoints Protegidos

| Endpoint                                              | Validación                      | Momento       |
| ----------------------------------------------------- | ------------------------------- | ------------- |
| `POST /api/broker/discover/invitations`               | ✅ Antes de crear invitación    | Línea 147-159 |
| `POST /api/broker/discover/marketplace/[id]/respond`  | ✅ Antes de crear respuesta     | Línea 48-60   |
| `POST /api/broker/clients-new/[id]/manage-properties` | ✅ Antes de asignar propiedades | Línea 50-63   |

### Configuración del Admin

La comisión máxima se configura en:

```
/admin/settings/enhanced
→ Sección "Configuración de Comisiones"
→ Campo "Tasa de Comisión Predeterminada (%)"
```

Por defecto: **5.0%**

Se almacena en `SystemSetting` con key `defaultCommissionRate`.

### Respuestas de Error

Cuando se excede el máximo:

```json
{
  "success": false,
  "error": "La comisión propuesta (6%) excede el máximo permitido (5%)",
  "maxCommissionRate": 5.0
}
```

Status HTTP: **400 Bad Request**

### Beneficios

✅ **Protege el modelo de negocio** - No se pueden proponer comisiones descontroladas  
✅ **Transparente** - El corredor sabe exactamente cuál es el máximo permitido  
✅ **Configurable** - El admin puede ajustar el porcentaje según necesidad  
✅ **No bloqueante** - Si falla la validación, el sistema usa el default (5%)  
✅ **Auditable** - Todos los intentos se loggean para análisis

---

## 🔔 PARTE 2: Sistema de Notificaciones en Tiempo Real

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    NotificationService                   │
│  (Servicio centralizado de creación de notificaciones)  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Notification Model (DB)                  │
│    • userId, type, title, message, link, metadata       │
│    • isRead, readAt, priority, createdAt                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  API de Notificaciones                   │
│  GET /api/notifications        - Listar no leídas       │
│  POST /api/notifications       - Marcar todas leídas    │
│  PATCH /api/notifications/[id] - Marcar una leída       │
│  DELETE /api/notifications/[id] - Eliminar              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NotificationBell Component                  │
│  • Polling cada 30 segundos                             │
│  • Badge con contador de no leídas                      │
│  • Popover con lista de notificaciones                  │
│  • Click → marca como leída + redirige                  │
└─────────────────────────────────────────────────────────┘
```

### NotificationService

#### **Métodos Principales**

```typescript
class NotificationService {
  // Crear notificación genérica
  static async create(params: CreateNotificationParams): Promise<any>;

  // Notificaciones específicas de invitaciones
  static async notifyInvitationReceived(...);
  static async notifyInvitationAccepted(...);
  static async notifyInvitationRejected(...);

  // Notificaciones de solicitudes de servicio
  static async notifyServiceRequestResponse(...);
  static async notifyResponseAccepted(...);
  static async notifyResponseRejected(...);

  // Notificaciones de recomendaciones
  static async notifyNewRecommendations(...);

  // Gestión
  static async getUnread(userId: string);
  static async markAsRead(notificationId: string, userId: string);
  static async markAllAsRead(userId: string);
  static async delete(notificationId: string, userId: string);
}
```

### Tipos de Notificaciones

| Tipo                       | Trigger                        | Destinatario | Prioridad | Link                     |
| -------------------------- | ------------------------------ | ------------ | --------- | ------------------------ |
| `INVITATION_RECEIVED`      | Corredor envía invitación      | Usuario      | HIGH      | `/owner/broker-services` |
| `INVITATION_ACCEPTED`      | Usuario acepta invitación      | Corredor     | HIGH      | `/broker/prospects`      |
| `INVITATION_REJECTED`      | Usuario rechaza invitación     | Corredor     | MEDIUM    | `/broker/discover`       |
| `SERVICE_REQUEST_RESPONSE` | Corredor responde solicitud    | Usuario      | HIGH      | `/owner/broker-services` |
| `SERVICE_REQUEST_ACCEPTED` | Usuario acepta propuesta       | Corredor     | HIGH      | `/broker/discover`       |
| `SERVICE_REQUEST_REJECTED` | Usuario rechaza propuesta      | Corredor     | LOW       | `/broker/discover`       |
| `NEW_RECOMMENDATIONS`      | Sistema genera recomendaciones | Corredor     | MEDIUM    | `/broker/discover`       |

### Flujo Completo de Notificación

#### **Ejemplo: Corredor envía invitación**

```typescript
// En /api/broker/discover/invitations (POST)

// 1. Crear invitación
const invitation = await db.brokerInvitation.create({ ... });

// 2. Enviar notificación (no bloqueante)
await NotificationService.notifyInvitationReceived({
  userId: data.userId,
  brokerName: session.user.name,
  brokerId,
  invitationType: data.invitationType,
  invitationId: invitation.id,
}).catch(err => {
  logger.error('Error sending notification', { error: err });
  // No fallar la creación si falla la notificación
});

// 3. Notificación creada en DB
{
  userId: "user_id",
  type: "INVITATION_RECEIVED",
  title: "📨 Nueva Invitación de Corredor",
  message: "Juan Pérez te ha enviado una oferta de servicios",
  link: "/owner/broker-services",
  priority: "high",
  isRead: false,
  createdAt: "2024-10-28T..."
}

// 4. Usuario ve notificación en UI
// - Badge en campana muestra "1"
// - Popover lista la notificación
// - Click: marca como leída + redirige al link
```

### NotificationBell Component

#### **Ubicación**

```typescript
// En el navbar/header de la app
import { NotificationBell } from '@/components/notifications/NotificationBell';

<NotificationBell />
```

#### **Características**

✅ **Polling cada 30 segundos** - Actualización automática sin recargar  
✅ **Badge con contador** - Muestra cantidad de no leídas (máx "9+")  
✅ **Popover interactivo** - Lista completa con scroll  
✅ **Marca como leída al click** - Y redirige al link correspondiente  
✅ **Eliminar individual** - Botón "×" en cada notificación  
✅ **Marcar todas como leídas** - Botón en el header del popover  
✅ **Formato de fecha relativo** - "hace 5 minutos" en español  
✅ **Estado vacío** - Icono y mensaje cuando no hay notificaciones

### APIs de Notificaciones

#### **GET /api/notifications**

Obtiene notificaciones no leídas del usuario actual.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "INVITATION_RECEIVED",
      "title": "📨 Nueva Invitación de Corredor",
      "message": "Juan Pérez te ha enviado una oferta de servicios",
      "link": "/owner/broker-services",
      "isRead": false,
      "priority": "high",
      "createdAt": "2024-10-28T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### **POST /api/notifications**

Marcar todas como leídas.

**Request:**

```json
{
  "action": "markAllRead"
}
```

**Response:**

```json
{
  "success": true,
  "message": "5 notificaciones marcadas como leídas"
}
```

#### **PATCH /api/notifications/[id]**

Marca una notificación específica como leída.

**Response:**

```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

#### **DELETE /api/notifications/[id]**

Elimina una notificación.

**Response:**

```json
{
  "success": true,
  "message": "Notificación eliminada"
}
```

### Integración en Endpoints Existentes

Todos los endpoints relevantes ahora envían notificaciones:

| Endpoint                                                   | Notificación Enviada        |
| ---------------------------------------------------------- | --------------------------- |
| `POST /api/broker/discover/invitations`                    | ✅ INVITATION_RECEIVED      |
| `POST /api/broker/discover/marketplace/[id]/respond`       | ✅ SERVICE_REQUEST_RESPONSE |
| `PATCH /api/service-requests/[id]/responses/[id]` (accept) | ✅ SERVICE_REQUEST_ACCEPTED |
| `PATCH /api/service-requests/[id]/responses/[id]` (reject) | ✅ SERVICE_REQUEST_REJECTED |
| `POST /api/broker/discover/recommendations`                | ✅ NEW_RECOMMENDATIONS      |

### Seguridad

✅ **Autenticación requerida** - Todas las APIs requieren sesión activa  
✅ **Autorización por usuario** - Solo puedes ver/gestionar tus notificaciones  
✅ **Validación de propiedad** - `userId` verificado en todas las operaciones  
✅ **No bloqueante** - Si falla envío de notificación, no falla la operación principal  
✅ **Logging completo** - Todas las acciones se registran para auditoría

### Performance

✅ **Polling inteligente** - Solo carga no leídas (filtro en DB)  
✅ **Límite de 50** - No carga infinitas notificaciones  
✅ **Índices en DB** - `userId + isRead` para queries rápidas  
✅ **Cache-friendly** - Polling cada 30s (no sobrecarga el servidor)  
✅ **Operaciones async** - No bloquea el flujo principal

---

## 📊 Métricas y Monitoreo

### Comisiones

```sql
-- Comisiones propuestas vs máximo
SELECT
  COUNT(*) as total_propuestas,
  AVG(proposed_rate) as promedio_propuesto,
  MAX(proposed_rate) as max_propuesto,
  (SELECT defaultCommissionRate FROM system_settings WHERE key = 'defaultCommissionRate') as max_sistema
FROM (
  SELECT proposedRate as proposed_rate FROM broker_invitations WHERE proposedRate IS NOT NULL
  UNION ALL
  SELECT proposedRate FROM broker_request_responses WHERE proposedRate IS NOT NULL
  UNION ALL
  SELECT commissionRate FROM broker_property_managements WHERE commissionRate IS NOT NULL
) comisiones;
```

### Notificaciones

```sql
-- Tasa de lectura de notificaciones
SELECT
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN isRead THEN 1 END) as leidas,
  ROUND(COUNT(CASE WHEN isRead THEN 1 END)::numeric / COUNT(*) * 100, 2) as tasa_lectura
FROM notifications
WHERE createdAt > NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY total DESC;
```

---

## 🚀 Próximos Pasos (Opcional)

### Mejoras Futuras para Notificaciones

1. **WebSockets / Server-Sent Events**
   - Notificaciones en tiempo real sin polling
   - Menor latencia (instantáneo vs 30 segundos)

2. **Email Notifications**
   - Resumen diario de notificaciones no leídas
   - Alertas críticas por email

3. **Push Notifications**
   - Notificaciones móviles
   - Service Workers para web

4. **Personalización**
   - Usuario elige qué notificaciones recibir
   - Frecuencia de notificaciones

5. **Categorización**
   - Pestaña "Todas", "Invitaciones", "Solicitudes", etc.
   - Filtros por tipo y prioridad

---

## ✅ Checklist de Implementación

### Protección de Comisiones

- [x] CommissionValidator service creado
- [x] Validación en API de invitaciones
- [x] Validación en API de marketplace
- [x] Validación en API de gestión de propiedades
- [x] Respuestas de error descriptivas
- [x] Logging de intentos
- [x] Documentación completa

### Notificaciones

- [x] NotificationService creado
- [x] API GET /api/notifications
- [x] API POST /api/notifications (markAllRead)
- [x] API PATCH /api/notifications/[id]
- [x] API DELETE /api/notifications/[id]
- [x] NotificationBell component
- [x] Polling cada 30 segundos
- [x] Badge con contador
- [x] Integración en invitaciones
- [x] Integración en marketplace
- [x] Integración en recomendaciones
- [x] Formato de fechas en español
- [x] Seguridad y autorización
- [x] Documentación completa

---

## 🎯 Resumen

Con estas dos implementaciones:

1. **El modelo de negocio está protegido** ✅
   - Corredores no pueden proponer comisiones excesivas
   - Admin tiene control total de los porcentajes
   - Sistema transparente y auditable

2. **La comunicación es instantánea** ✅
   - Usuarios y corredores siempre informados
   - Ninguna interacción importante se pierde
   - Experiencia de usuario profesional y moderna

**Estado:** ✅ Producción  
**Fecha:** Octubre 2024  
**Versión:** 2.0.0
