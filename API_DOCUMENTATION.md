# 📚 Documentación Completa de APIs - Rent360

## 📋 Índice

- [Introducción](#introducción)
- [Autenticación](#autenticación)
- [Propiedades](#propiedades)
- [Contratos](#contratos)
- [Pagos](#pagos)
- [Usuarios](#usuarios)
- [Reembolsos](#reembolsos)
- [Causas Legales](#causas-legales)
- [Administración](#administración)
- [Monitoreo](#monitoreo)
- [Backups](#backups)
- [Notificaciones](#notificaciones)
- [Firmas Electrónicas](#firmas-electrónicas)

## 🎯 Introducción

Esta documentación cubre todas las APIs disponibles en el sistema Rent360. Todas las APIs siguen el patrón REST y utilizan JSON para requests y responses.

### 📋 Convenciones

- **Base URL**: `http://localhost:3000/api` (desarrollo) / `https://rent360.com/api` (producción)
- **Autenticación**: JWT Bearer Token (excepto endpoints de login/registro)
- **Content-Type**: `application/json`
- **Respuesta Estándar**:
  ```json
  {
    "success": boolean,
    "data": any,
    "message": string,
    "error": string
  }
  ```

### 🔐 Autenticación

Todos los endpoints requieren autenticación JWT excepto:
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/register-provider`

#### Headers Requeridos:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 🔑 Autenticación

### `POST /auth/login`
Iniciar sesión en el sistema.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "role": "TENANT"
    },
    "token": "jwt-token-aqui"
  }
}
```

### `POST /auth/register`
Registrar nuevo usuario.

**Request:**
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "password123",
  "name": "Nuevo Usuario",
  "role": "TENANT"
}
```

### `GET /auth/me`
Obtener información del usuario actual.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "role": "TENANT",
    "isActive": true
  }
}
```

---

## 🏠 Propiedades

### `GET /properties`
Obtener lista de propiedades con filtros.

**Query Parameters:**
- `search`: Búsqueda por dirección, ciudad, comuna
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo
- `minArea`: Área mínima (m²)
- `maxArea`: Área máxima (m²)
- `bedrooms`: Número de dormitorios
- `bathrooms`: Número de baños
- `type`: Tipo de propiedad (HOUSE, APARTMENT, etc.)
- `status`: Estado (AVAILABLE, RENTED)
- `page`: Página (default: 1)
- `limit`: Elementos por página (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prop-1",
      "title": "Casa en Santiago Centro",
      "address": "Av. Providencia 123",
      "city": "Santiago",
      "price": 500000,
      "deposit": 50000,
      "bedrooms": 3,
      "bathrooms": 2,
      "area": 120,
      "type": "HOUSE",
      "status": "AVAILABLE",
      "images": ["url1.jpg", "url2.jpg"],
      "owner": {
        "id": "owner-1",
        "name": "Carlos Rodríguez"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### `POST /properties`
Crear nueva propiedad (solo OWNER).

**Request:**
```json
{
  "title": "Nueva Propiedad",
  "description": "Hermosa casa...",
  "address": "Calle Ficticia 123",
  "city": "Santiago",
  "commune": "Providencia",
  "region": "Metropolitana",
  "price": 400000,
  "deposit": 40000,
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 100,
  "type": "HOUSE"
}
```

### `GET /properties/filters`
Obtener opciones de filtros disponibles.

**Response:**
```json
{
  "success": true,
  "data": {
    "cities": ["Santiago", "Viña del Mar", "Concepción"],
    "communes": ["Providencia", "Las Condes", "Ñuñoa"],
    "priceRange": {
      "min": 100000,
      "max": 2000000
    },
    "propertyTypes": ["HOUSE", "APARTMENT", "OFFICE"],
    "bedroomOptions": [1, 2, 3, 4],
    "bathroomOptions": [1, 2, 3]
  }
}
```

---

## 📄 Contratos

### `GET /contracts`
Obtener contratos con filtros.

**Query Parameters:**
- `status`: Estado del contrato
- `propertyId`: ID de propiedad
- `tenantId`: ID de inquilino
- `startDate`: Fecha inicio (YYYY-MM-DD)
- `endDate`: Fecha fin (YYYY-MM-DD)
- `page`: Página
- `limit`: Elementos por página

### `POST /contracts`
Crear nuevo contrato.

**Request:**
```json
{
  "propertyId": "prop-1",
  "tenantId": "tenant-1",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "rentAmount": 500000,
  "depositAmount": 50000
}
```

### `PUT /contracts/:id`
Actualizar contrato existente.

**Request:**
```json
{
  "status": "ACTIVE",
  "rentAmount": 550000
}
```

---

## 💰 Pagos

### `GET /payments`
Obtener pagos con filtros.

**Query Parameters:**
- `status`: Estado del pago
- `contractId`: ID de contrato
- `startDate`: Fecha inicio
- `endDate`: Fecha fin
- `overdue`: true/false (pagos vencidos)
- `upcoming`: true/false (pagos próximos)
- `page`: Página
- `limit`: Elementos por página

### `POST /payments`
Crear nuevo pago.

**Request:**
```json
{
  "contractId": "contract-1",
  "amount": 500000,
  "dueDate": "2024-02-01",
  "description": "Renta Febrero 2024"
}
```

### `GET /payments/upcoming`
Obtener pagos próximos (próximos 7 días).

---

## 👥 Usuarios

### `GET /users`
Obtener lista de usuarios (solo ADMIN).

**Query Parameters:**
- `role`: Filtrar por rol
- `search`: Búsqueda por nombre/email
- `isActive`: true/false
- `page`: Página
- `limit`: Elementos por página

### `GET /users/favorites`
Obtener propiedades favoritas del usuario actual.

### `POST /users/favorites`
Agregar propiedad a favoritos.

**Request:**
```json
{
  "propertyId": "prop-1"
}
```

### `DELETE /users/favorites`
Eliminar propiedad de favoritos.

**Query Parameters:**
- `propertyId`: ID de la propiedad

---

## 💸 Reembolsos

### `GET /refunds`
Obtener solicitudes de reembolso.

**Query Parameters:**
- `status`: Estado del reembolso
- `contractId`: ID de contrato
- `page`: Página
- `limit`: Elementos por página

### `POST /refunds`
Crear solicitud de reembolso (solo TENANT).

**Request:**
```json
{
  "contractId": "contract-1",
  "amount": 25000,
  "reason": "contract_completed",
  "description": "Contrato finalizado exitosamente",
  "bankAccount": {
    "accountNumber": "123456789",
    "accountType": "checking",
    "bankName": "Banco Estado",
    "rut": "12.345.678-9"
  }
}
```

### `PUT /refunds`
Actualizar estado del reembolso (solo ADMIN).

**Request:**
```json
{
  "refundId": "refund-1",
  "status": "approved",
  "adminNotes": "Reembolso aprobado"
}
```

---

## ⚖️ Causas Legales

### `GET /legal-cases`
Obtener causas legales.

**Query Parameters:**
- `status`: Estado de la causa
- `contractId`: ID de contrato
- `caseType`: Tipo de causa
- `priority`: Prioridad
- `page`: Página
- `limit`: Elementos por página

### `POST /legal-cases`
Crear nueva causa legal (OWNER/BROKER/ADMIN).

**Request:**
```json
{
  "contractId": "contract-1",
  "caseType": "rent_arrears",
  "description": "Inquilino debe 3 meses de renta",
  "amount": 1500000,
  "priority": "high",
  "estimatedDuration": 90,
  "legalBasis": "Artículo 1955 del Código Civil",
  "requestedActions": ["Demanda civil", "Embargo de bienes"],
  "documents": ["contrato.pdf", "recibos.pdf"]
}
```

### `PUT /legal-cases`
Actualizar estado de causa legal (solo ADMIN).

**Request:**
```json
{
  "legalCaseId": "case-1",
  "status": "approved",
  "adminNotes": "Causa aprobada para trámite legal",
  "assignedLawyer": "Abogado Juan Pérez"
}
```

---

## 👑 Administración

### `GET /admin/system-metrics`
Obtener métricas del sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "logging": { "total": 0, "info": 0, "warn": 0, "error": 0 },
    "rateLimiting": { "blockedRequests": 0, "activeKeys": 0 },
    "cache": { "hitRate": 85, "memoryUsage": 1024 },
    "database": {
      "counts": { "totalUsers": 150, "totalProperties": 75, "totalContracts": 45 },
      "active": { "activeUsers": 145, "availableProperties": 30 }
    },
    "system": {
      "platform": "linux",
      "nodeVersion": "v18.17.0",
      "uptime": 3600,
      "memory": { "total": 8192, "free": 2048, "used": 6144 }
    }
  }
}
```

### `GET /admin/performance`
Obtener métricas de performance detalladas.

**Query Parameters:**
- `detailed`: true/false para incluir historial

### `GET /admin/settings`
Obtener configuraciones del sistema.

**Query Parameters:**
- `category`: Filtrar por categoría
- `includeEncrypted`: true para incluir valores encriptados

### `POST /admin/settings`
Crear nueva configuración.

### `PUT /admin/settings`
Actualizar configuración existente.

### `DELETE /admin/settings`
Eliminar configuración.

---

## 📊 Monitoreo

### `GET /admin/performance`
Obtener métricas de performance en tiempo real.

### `GET /health`
Verificar estado del sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0.0",
    "uptime": 3600
  }
}
```

---

## 💾 Backups

### `GET /admin/backups`
Obtener historial de backups.

**Query Parameters:**
- `limit`: Número de backups a obtener
- `type`: Filtrar por tipo (manual, daily, weekly, monthly)

### `POST /admin/backups`
Crear nuevo backup.

**Request:**
```json
{
  "type": "manual"
}
```

### `PUT /admin/backups/config`
Actualizar configuración de backup.

**Request:**
```json
{
  "enabled": true,
  "schedule": {
    "daily": true,
    "weekly": true,
    "monthly": true
  },
  "retention": {
    "daily": 7,
    "weekly": 4,
    "monthly": 12
  },
  "compression": true,
  "encryption": false
}
```

### `PATCH /admin/backups/restore`
Restaurar backup.

**Request:**
```json
{
  "backupId": "daily_1704067200000"
}
```

---

## 🔔 Notificaciones

### `GET /notifications`
Obtener notificaciones del usuario.

**Query Parameters:**
- `limit`: Número de notificaciones
- `unreadOnly`: true para solo no leídas

### `POST /notifications`
Crear nueva notificación.

**Request:**
```json
{
  "userId": "user-1",
  "type": "PAYMENT_REMINDER",
  "title": "Recordatorio de Pago",
  "message": "Su pago de renta vence mañana",
  "data": { "contractId": "contract-1", "amount": 500000 }
}
```

### `PUT /notifications/:id`
Marcar notificación como leída.

---

## ✍️ Firmas Electrónicas

### `GET /signatures`
Obtener solicitudes de firma.

**Query Parameters:**
- `signatureId`: ID específico de firma
- `status`: Estado de la firma

### `POST /signatures`
Crear solicitud de firma electrónica.

**Request:**
```json
{
  "documentId": "doc-1",
  "documentName": "Contrato de Arriendo",
  "signers": [
    {
      "email": "inquilino@email.com",
      "name": "Juan Pérez",
      "role": "TENANT"
    },
    {
      "email": "propietario@email.com",
      "name": "María González",
      "role": "OWNER"
    }
  ],
  "expiresAt": "2024-12-31T23:59:59Z",
  "callbackUrl": "https://rent360.com/callback"
}
```

### `DELETE /signatures/:id/cancel`
Cancelar solicitud de firma.

### `GET /signatures/webhook`
Webhook para actualizaciones de firma.

---

## 🚨 Códigos de Error

### Errores Comunes
- `400`: Datos inválidos
- `401`: No autorizado
- `403`: Prohibido (sin permisos)
- `404`: Recurso no encontrado
- `409`: Conflicto (ej: usuario ya existe)
- `422`: Validación fallida
- `429`: Rate limit excedido
- `500`: Error interno del servidor

### Estructura de Error
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Los datos proporcionados no son válidos",
  "details": {
    "field": "email",
    "message": "El email ya está registrado"
  }
}
```

---

## 🔒 Rate Limiting

- **Auth endpoints**: 5 requests por minuto
- **API general**: 100 requests por minuto
- **Admin endpoints**: 200 requests por minuto
- **File uploads**: 10 requests por minuto

Headers incluidos en respuesta:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## 📝 Notas Importantes

1. **Paginación**: Todos los endpoints que retornan listas soportan paginación
2. **Filtros**: Los parámetros de consulta funcionan como filtros AND
3. **Autenticación**: El token JWT expira cada 24 horas
4. **Validación**: Todos los inputs son validados usando Zod
5. **Logs**: Todas las operaciones críticas son logueadas
6. **Cache**: Las consultas frecuentes son cacheadas por 5 minutos
7. **Backup**: Backups automáticos diarios, semanales y mensuales
8. **Monitoreo**: Métricas en tiempo real disponibles para administradores

---

## 🆘 Soporte

Para soporte técnico o preguntas sobre las APIs:
- Email: soporte@rent360.com
- Documentación: https://docs.rent360.com
- Status Page: https://status.rent360.com
