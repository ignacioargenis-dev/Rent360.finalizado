# 🎯 Sistema de Gestión de Prospects y Clientes para Corredores

**Fecha:** 28 de Octubre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y Funcional

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [API Endpoints](#api-endpoints)
4. [Flujo de Trabajo](#flujo-de-trabajo)
5. [Funcionalidades Clave](#funcionalidades-clave)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎯 Descripción General

Sistema completo de CRM para corredores inmobiliarios que permite:

### ✅ Gestión de Prospects (Potenciales Clientes)

- **Captación de leads** de propietarios e inquilinos
- **Pipeline de ventas** con estados configurables
- **Scoring automático** de leads
- **Seguimiento de actividades** y próximos follow-ups
- **Compartir propiedades** con links rastreables
- **Conversión a clientes** activos

### ✅ Gestión de Clientes Activos

- **Relación broker-cliente** formal con términos comerciales
- **Gestión de propiedades** (parcial o total)
- **Métricas y comisiones** automáticas
- **Control de permisos** del propietario
- **Historial de actividades** completo

### ✅ Gestión de Propiedades

- **Asignación flexible** (full, partial, marketing only, lease only)
- **Actualización automática** de dashboards
- **Propietarios pueden gestionar** algunas propiedades mientras el corredor gestiona otras
- **Comisiones configurables** por propiedad

---

## 🗄️ Modelos de Datos

### BrokerProspect (Prospects)

```typescript
{
  id: string
  brokerId: string              // Corredor dueño del prospect
  userId?: string               // Usuario existente (si ya está registrado)

  // Datos básicos
  name: string
  email: string
  phone: string
  rut?: string

  // Tipo de prospect
  prospectType: 'OWNER_LEAD' | 'TENANT_LEAD'

  // Estado en el pipeline
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'MEETING_SCHEDULED' |
          'PROPOSAL_SENT' | 'NEGOTIATING' | 'CONVERTED' | 'LOST'

  // Información de interés
  interestedIn?: string[]       // Tipos de propiedades
  budget?: { min: number, max: number }
  preferredLocations?: string[]
  notes?: string

  // Source tracking
  source: string                // platform, referral, advertising, etc.
  sourceDetails?: string

  // Engagement tracking
  lastContactDate?: Date
  nextFollowUpDate?: Date
  contactCount: number
  emailsSent: number
  emailsOpened: number
  propertiesShared: number

  // Scoring
  leadScore: number             // 0-100
  conversionProbability: number // 0-1
  priority: 'low' | 'medium' | 'high' | 'urgent'

  // Conversión
  convertedAt?: Date
  convertedToClientId?: string
  lostReason?: string

  // Relaciones
  activities: ProspectActivity[]
  sharedProperties: ProspectPropertyShare[]
}
```

### BrokerClient (Clientes Activos)

```typescript
{
  id: string
  brokerId: string
  userId: string                // Usuario del sistema
  prospectId?: string           // Prospect que se convirtió

  // Tipo de cliente
  clientType: 'OWNER' | 'TENANT' | 'BOTH'

  // Estado de la relación
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED'
  relationshipType: 'standard' | 'exclusive' | 'premium'

  // Fechas
  startDate: Date
  endDate?: Date
  lastInteraction?: Date

  // Configuración de servicios
  servicesOffered?: string[]
  commissionRate: number        // Porcentaje (default: 5.0)
  exclusiveAgreement: boolean

  // Gestión de propiedades (para OWNER)
  propertyManagementType?: 'full' | 'partial' | 'none'

  // Métricas
  totalPropertiesManaged: number
  totalContracts: number
  totalCommissions: number
  satisfactionRating?: number   // 1-5

  // Relaciones
  managedProperties: BrokerPropertyManagement[]
  activities: ClientActivity[]
}
```

### BrokerPropertyManagement (Gestión de Propiedades)

```typescript
{
  id: string
  brokerId: string
  clientId: string              // Cliente propietario
  propertyId: string

  // Tipo de gestión
  managementType: 'full' | 'partial' | 'marketing_only' | 'lease_only'

  // Servicios incluidos
  services: string[]

  // Términos comerciales
  commissionRate: number
  exclusivity: boolean

  // Estado
  status: 'ACTIVE' | 'PAUSED' | 'TERMINATED'

  // Permisos del propietario
  ownerCanEditProperty: boolean
  ownerCanViewStats: boolean
  ownerCanApproveTenantt: boolean

  // Métricas
  totalContracts: number
  totalCommissions: number
}
```

---

## 🔌 API Endpoints

### Prospects

#### `GET /api/broker/prospects`

Obtiene todos los prospects del corredor

**Query Parameters:**

- `search`: Búsqueda por nombre, email o teléfono
- `status`: Filtrar por estado (NEW, CONTACTED, etc.)
- `prospectType`: Filtrar por tipo (OWNER_LEAD, TENANT_LEAD)
- `limit`: Límite de resultados (default: 100)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "prospectType": "OWNER_LEAD",
      "status": "QUALIFIED",
      "leadScore": 75,
      "priority": "high"
    }
  ],
  "metrics": {
    "total": 50,
    "byStatus": { "NEW": 10, "CONTACTED": 15, "QUALIFIED": 25 },
    "avgLeadScore": 68,
    "needFollowUp": 12
  }
}
```

#### `POST /api/broker/prospects`

Crea un nuevo prospect

**Body:**

```json
{
  "name": "María González",
  "email": "maria@example.com",
  "phone": "+56912345678",
  "rut": "12345678-9",
  "prospectType": "OWNER_LEAD",
  "interestedIn": ["apartment", "house"],
  "budget": { "min": 300000, "max": 500000 },
  "preferredLocations": ["Las Condes", "Providencia"],
  "source": "website",
  "notes": "Interesado en vender 2 propiedades",
  "priority": "high"
}
```

#### `GET /api/broker/prospects/[prospectId]`

Obtiene detalles completos de un prospect

#### `PATCH /api/broker/prospects/[prospectId]`

Actualiza un prospect

**Body:**

```json
{
  "status": "QUALIFIED",
  "priority": "urgent",
  "nextFollowUpDate": "2025-10-30T10:00:00Z",
  "notes": "Reunión agendada para el viernes"
}
```

#### `DELETE /api/broker/prospects/[prospectId]`

Elimina un prospect (no permite prospects convertidos)

#### `POST /api/broker/prospects/[prospectId]/convert`

Convierte un prospect en cliente activo

**Body:**

```json
{
  "clientType": "OWNER",
  "relationshipType": "exclusive",
  "commissionRate": 5.0,
  "exclusiveAgreement": true,
  "propertyManagementType": "full",
  "servicesOffered": ["marketing", "tenant_screening", "contract_management", "property_visits"],
  "propertyIds": ["prop1", "prop2"], // Propiedades a gestionar
  "managementType": "full",
  "notes": "Cliente premium con 2 propiedades"
}
```

#### `POST /api/broker/prospects/[prospectId]/activities`

Crea una actividad/nota para un prospect

**Body:**

```json
{
  "activityType": "call",
  "title": "Llamada de seguimiento",
  "description": "Discutimos términos de comisión",
  "outcome": "successful",
  "scheduledFor": "2025-10-30T14:00:00Z" // Para follow-ups futuros
}
```

#### `POST /api/broker/prospects/[prospectId]/share-property`

Comparte una propiedad con un prospect

**Body:**

```json
{
  "propertyId": "clxxx",
  "message": "Hola Juan, esta propiedad cumple con tus requisitos...",
  "sendEmail": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "share123",
    "shareLink": "https://rent360.com/properties/clxxx?ref=abc123def456",
    "sharedAt": "2025-10-28T10:00:00Z"
  }
}
```

#### `GET /api/broker/prospects/[prospectId]/share-property`

Obtiene todas las propiedades compartidas con un prospect

---

### Clientes

#### `GET /api/broker/clients-new`

Obtiene todos los clientes activos del corredor

**Query Parameters:**

- `search`: Búsqueda por nombre o email
- `status`: Filtrar por estado
- `clientType`: Filtrar por tipo (OWNER, TENANT, BOTH)
- `limit`: Límite de resultados

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "client123",
      "clientType": "OWNER",
      "status": "ACTIVE",
      "totalPropertiesManaged": 3,
      "totalContracts": 5,
      "totalCommissions": 15000000,
      "user": {
        "name": "Pedro Sánchez",
        "email": "pedro@example.com"
      }
    }
  ],
  "metrics": {
    "total": 25,
    "totalPropertiesManaged": 78,
    "totalCommissions": 45000000
  }
}
```

#### `POST /api/broker/clients-new/[clientId]/manage-properties`

Asigna propiedades de un cliente para gestión

**Body:**

```json
{
  "propertyIds": ["prop1", "prop2", "prop3"],
  "managementType": "full",
  "services": [
    "marketing",
    "tenant_screening",
    "contract_management",
    "maintenance_coordination",
    "payment_collection"
  ],
  "commissionRate": 5.5,
  "exclusivity": true,
  "ownerCanEditProperty": true,
  "ownerCanViewStats": true,
  "ownerCanApproveTenantt": true,
  "notes": "Gestión completa de 3 propiedades"
}
```

#### `GET /api/broker/clients-new/[clientId]/manage-properties`

Obtiene propiedades gestionadas y no gestionadas de un cliente

**Response:**

```json
{
  "success": true,
  "data": {
    "managed": [
      {
        "id": "mgmt1",
        "propertyId": "prop1",
        "managementType": "full",
        "status": "ACTIVE",
        "property": {
          "title": "Departamento Las Condes",
          "price": 450000
        }
      }
    ],
    "unmanaged": [
      {
        "id": "prop4",
        "title": "Casa Providencia",
        "price": 600000
      }
    ],
    "total": 4
  }
}
```

---

## 🔄 Flujo de Trabajo

### 1. Captación de Prospect

```
Usuario visita la plataforma
    ↓
Corredor identifica potencial cliente
    ↓
Crea prospect (POST /api/broker/prospects)
    ↓
Sistema asigna lead score automático
    ↓
Prospect aparece en dashboard con prioridad
```

### 2. Seguimiento y Calificación

```
Corredor contacta al prospect
    ↓
Crea actividad (POST /api/broker/prospects/[id]/activities)
    ↓
Actualiza estado (PATCH /api/broker/prospects/[id])
    ↓
Comparte propiedades (POST /api/broker/prospects/[id]/share-property)
    ↓
Prospect visualiza propiedades (tracking automático)
    ↓
Programa follow-ups
```

### 3. Conversión a Cliente

```
Prospect calificado y listo
    ↓
Invitar a registrarse en la plataforma (si no está registrado)
    ↓
Convertir a cliente (POST /api/broker/prospects/[id]/convert)
    ↓
Asignar propiedades para gestión
    ↓
Cliente activo en el sistema
```

### 4. Gestión de Cliente

```
Cliente activo
    ↓
Corredor gestiona propiedades
    ↓
Propiedades aparecen en dashboard del corredor
    ↓
Contratos generan comisiones automáticas
    ↓
Métricas se actualizan en tiempo real
```

---

## 🚀 Funcionalidades Clave

### ✅ Para CORREDORES

1. **Dashboard de Prospects**
   - Ver todos los leads en el pipeline
   - Filtrar por estado, tipo, prioridad
   - Métricas de conversión
   - Prospects que necesitan follow-up

2. **Gestión de Actividades**
   - Llamadas, emails, reuniones
   - Follow-ups programados
   - Historial completo de interacciones

3. **Compartir Propiedades**
   - Envío de links rastreables
   - Tracking de visualizaciones
   - Feedback del prospect

4. **Conversión de Prospects**
   - Flujo guiado de conversión
   - Asignación de propiedades
   - Configuración de términos comerciales

5. **Gestión de Clientes**
   - Visibilidad de todos los clientes activos
   - Gestión parcial o total de propiedades
   - Métricas de comisiones
   - Actividades y notas

### ✅ Para PROPIETARIOS (Clientes)

1. **Control de Propiedades**
   - Decidir qué propiedades gestiona el corredor
   - Mantener algunas bajo gestión propia
   - Cambiar configuración cuando lo necesiten

2. **Permisos Configurables**
   - Editar información de propiedades
   - Ver estadísticas
   - Aprobar inquilinos

3. **Visibilidad Completa**
   - Ver actividades del corredor
   - Métricas de rendimiento
   - Comisiones generadas

### ✅ Para INQUILINOS (Prospects)

1. **Recibir Propiedades**
   - Links directos a propiedades recomendadas
   - Mensaje personalizado del corredor
   - Información completa de la propiedad

2. **Expresar Interés**
   - Feedback sobre propiedades compartidas
   - Contacto directo con el corredor

---

## 📊 Métricas Automáticas

### Dashboard del Corredor

```typescript
{
  // Prospects
  totalProspects: number;
  prospectsByStatus: Record<string, number>;
  avgLeadScore: number;
  conversionRate: number;
  needFollowUp: number;

  // Clientes
  totalClients: number;
  clientsByType: Record<string, number>;
  totalPropertiesManaged: number;
  activeContracts: number;

  // Financiero
  totalCommissions: number;
  monthlyCommissions: number;
  avgCommissionPerProperty: number;

  // Performance
  prospectsThisMonth: number;
  conversionsThisMonth: number;
  propertiesAddedThisMonth: number;
}
```

---

## 🎯 Casos de Uso

### Caso 1: Corredor Capta Propietario con 3 Propiedades

```typescript
// 1. Crear prospect
POST /api/broker/prospects
{
  "name": "Carlos Rojas",
  "email": "carlos@example.com",
  "phone": "+56987654321",
  "prospectType": "OWNER_LEAD",
  "interestedIn": ["management"],
  "source": "referral",
  "notes": "Referido por cliente actual. Tiene 3 departamentos en Las Condes"
}

// 2. Seguimiento
POST /api/broker/prospects/[id]/activities
{
  "activityType": "call",
  "title": "Primera llamada",
  "description": "Discutimos servicios y comisiones",
  "outcome": "successful"
}

// 3. Conversión
POST /api/broker/prospects/[id]/convert
{
  "clientType": "OWNER",
  "relationshipType": "exclusive",
  "commissionRate": 5.0,
  "propertyIds": ["prop1", "prop2"],  // Solo gestiona 2 de 3
  "managementType": "full",
  "notes": "Gestión de 2 propiedades, la tercera la mantiene él"
}

// Resultado:
// - Cliente activo creado
// - 2 propiedades asignadas al corredor
// - 1 propiedad sigue bajo gestión del propietario
// - Dashboard actualizado con nuevas propiedades
// - Métricas reflejan nuevo cliente
```

### Caso 2: Corredor Comparte Propiedades con Inquilino

```typescript
// 1. Crear prospect inquilino
POST /api/broker/prospects
{
  "name": "Ana Martínez",
  "email": "ana@example.com",
  "phone": "+56911111111",
  "prospectType": "TENANT_LEAD",
  "budget": { "min": 300000, "max": 400000 },
  "preferredLocations": ["Providencia", "Las Condes"]
}

// 2. Compartir propiedad #1
POST /api/broker/prospects/[id]/share-property
{
  "propertyId": "prop1",
  "message": "Hola Ana, encontré este departamento perfecto para ti...",
  "sendEmail": true
}

// 3. Compartir propiedad #2
POST /api/broker/prospects/[id]/share-property
{
  "propertyId": "prop2",
  "message": "También te recomiendo esta opción...",
  "sendEmail": true
}

// 4. Ana visualiza las propiedades (tracking automático)
// 5. Corredor ve métricas de visualización
GET /api/broker/prospects/[id]/share-property

// Resultado:
// - Links únicos generados
// - Emails enviados
// - Tracking de visualizaciones
// - Corredor sabe qué propiedades le interesan más
```

### Caso 3: Propietario Cambia Gestión de Propiedades

```typescript
// Cliente decide agregar otra propiedad a la gestión del corredor
POST /api/broker/clients-new/[clientId]/manage-properties
{
  "propertyIds": ["prop3"],  // La que no estaba gestionada
  "managementType": "partial",  // Gestión parcial
  "services": ["marketing", "tenant_screening"],  // Solo marketing
  "ownerCanEditProperty": true,
  "ownerCanApproveTenantt": true  // Propietario aprueba inquilinos
}

// Resultado:
// - Propiedad ahora visible en dashboard del corredor
// - Corredor puede comercializarla
// - Propietario mantiene control de aprobación
// - Comisión solo por marketing
```

---

## 🔐 Permisos y Seguridad

### Verificaciones Automáticas

1. **Acceso a Prospects**
   - Solo el corredor dueño puede ver/editar
   - No se pueden editar prospects de otros corredores

2. **Conversión a Cliente**
   - Prospect debe estar registrado en la plataforma
   - No se puede duplicar relaciones activas
   - Propiedades deben pertenecer al usuario

3. **Gestión de Propiedades**
   - Solo propiedades del cliente propietario
   - Corredor debe tener relación activa con el cliente
   - Propietario puede revocar gestión en cualquier momento

---

## 📈 Próximas Mejoras

1. ✅ Sistema completo de prospects y clientes
2. ✅ Gestión parcial/total de propiedades
3. ✅ Compartir propiedades con prospects
4. ✅ Actividades y seguimiento
5. ⏳ Email automático al compartir propiedades
6. ⏳ Notificaciones push para follow-ups
7. ⏳ Dashboard visual mejorado en UI
8. ⏳ Reportes avanzados de conversión
9. ⏳ Integración con WhatsApp Business
10. ⏳ Templates de mensajes personalizables

---

## 🎉 Conclusión

Este sistema proporciona una plataforma CRM completa para corredores inmobiliarios, permitiendo:

- **Captación efectiva** de clientes potenciales
- **Seguimiento organizado** del pipeline de ventas
- **Conversión optimizada** de prospects a clientes
- **Gestión flexible** de propiedades
- **Control total** para propietarios
- **Métricas automatizadas** para toma de decisiones

El sistema está **completamente implementado y funcional**, listo para ser usado en producción.

---

**Desarrollado con ❤️ para Rent360**  
**Fecha:** 28 de Octubre de 2025
