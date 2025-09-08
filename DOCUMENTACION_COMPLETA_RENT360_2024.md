# 📚 DOCUMENTACIÓN COMPLETA - SISTEMA RENT360 2024

## 📋 TABLA DE CONTENIDOS

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [API Reference](#api-reference)
6. [Componentes UI](#componentes-ui)
7. [Base de Datos](#base-de-datos)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Sistema de Notificaciones](#sistema-de-notificaciones)
10. [Monitoreo y Logging](#monitoreo-y-logging)
11. [Optimización de Rendimiento](#optimización-de-rendimiento)
12. [Testing](#testing)
13. [Despliegue](#despliegue)
14. [Mantenimiento](#mantenimiento)
15. [Troubleshooting](#troubleshooting)

---

## 🏗️ DESCRIPCIÓN GENERAL

Rent360 es una **plataforma integral de gestión inmobiliaria** desarrollada con tecnologías modernas que permite gestionar propiedades, contratos, pagos, mantenimiento y comunicación entre todos los actores del ecosistema inmobiliario.

### 🎯 Características Principales

- **Gestión Multi-rol**: Administradores, Propietarios, Inquilinos, Corredores, Runners, Soporte
- **Dashboard Inteligente**: Métricas en tiempo real y análisis predictivo
- **Sistema de Notificaciones Avanzado**: Notificaciones inteligentes y personalizadas
- **PWA (Progressive Web App)**: Instalable y funcional offline
- **Chatbot AI**: Asistente inteligente para usuarios
- **Motor de Recomendaciones**: Sugerencias personalizadas
- **Análisis Predictivo**: Predicciones de mercado y comportamiento

### 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14/15, React 18, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT con refresh tokens
- **Notificaciones**: Sistema personalizado con templates
- **PWA**: Service Workers, Manifest
- **Monitoreo**: Sistema personalizado con métricas
- **Testing**: Vitest, React Testing Library

---

## 🏛️ ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PWA           │    │   Auth          │    │   Prisma        │
│   (Service      │    │   (JWT)         │    │   (ORM)         │
│    Workers)     │    └─────────────────┘    └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   External      │
│   Services      │
│   (AI, Email)   │
└─────────────────┘
```

### Patrones de Diseño

1. **MVC (Model-View-Controller)**
   - Model: Prisma Schema y tipos TypeScript
   - View: Componentes React
   - Controller: API Routes

2. **Repository Pattern**
   - Abstracción de acceso a datos
   - Separación de lógica de negocio

3. **Observer Pattern**
   - Sistema de notificaciones
   - Eventos en tiempo real

4. **Factory Pattern**
   - Creación de componentes UI
   - Generación de templates

---

## ⚙️ INSTALACIÓN Y CONFIGURACIÓN

### Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/your-org/rent360.git
cd rent360

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local

# Configurar base de datos
npx prisma generate
npx prisma db push

# Ejecutar migraciones
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/rent360"

# JWT
JWT_SECRET="your-super-secret-jwt-key-32-chars-min"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-32-chars-min"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# AI Services (opcional)
OPENAI_API_KEY="your-openai-api-key"

# PWA
NEXT_PUBLIC_APP_NAME="Rent360"
NEXT_PUBLIC_APP_DESCRIPTION="Plataforma de gestión inmobiliaria"
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
rent360/
├── src/
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── api/               # API Routes
│   │   ├── admin/             # Panel de administración
│   │   ├── tenant/            # Panel de inquilinos
│   │   ├── owner/             # Panel de propietarios
│   │   ├── broker/            # Panel de corredores
│   │   ├── support/           # Panel de soporte
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base (Shadcn/ui)
│   │   ├── dashboard/        # Componentes de dashboard
│   │   ├── forms/            # Formularios
│   │   ├── ai/               # Componentes de IA
│   │   └── pwa/              # Componentes PWA
│   ├── lib/                  # Utilidades y servicios
│   │   ├── auth.ts           # Autenticación
│   │   ├── db.ts             # Conexión a base de datos
│   │   ├── notifications.ts  # Sistema de notificaciones
│   │   ├── performance.ts    # Optimización de rendimiento
│   │   ├── monitoring.ts     # Sistema de monitoreo
│   │   └── validations.ts    # Validaciones Zod
│   ├── types.ts              # Tipos TypeScript
│   └── middleware.ts         # Middleware de Next.js
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
├── public/                   # Archivos estáticos
│   ├── manifest.json         # PWA manifest
│   └── sw.js                # Service Worker
└── package.json
```

---

## 🔌 API REFERENCE

### Autenticación

#### POST /api/auth/login
Inicia sesión de usuario.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "ADMIN"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### POST /api/auth/refresh
Renueva el token de acceso.

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

### Propiedades

#### GET /api/properties
Obtiene lista de propiedades con filtros.

**Query Parameters:**
- `page`: Número de página
- `limit`: Elementos por página
- `status`: Estado de la propiedad
- `type`: Tipo de propiedad
- `city`: Ciudad

#### POST /api/properties
Crea una nueva propiedad.

**Request:**
```json
{
  "title": "Departamento Las Condes",
  "description": "Hermoso departamento...",
  "address": "Av. Las Condes 123",
  "city": "Santiago",
  "commune": "Las Condes",
  "region": "Metropolitana",
  "price": 350000,
  "deposit": 350000,
  "bedrooms": 2,
  "bathrooms": 1,
  "area": 65,
  "type": "APARTMENT",
  "ownerId": "owner-id"
}
```

### Usuarios

#### GET /api/users
Obtiene lista de usuarios (solo admin).

#### PUT /api/users/[id]
Actualiza un usuario.

#### DELETE /api/users/[id]
Elimina un usuario (soft delete).

### Notificaciones

#### GET /api/notifications
Obtiene notificaciones del usuario.

#### POST /api/notifications
Crea una nueva notificación.

#### PUT /api/notifications/[id]/read
Marca notificación como leída.

---

## 🎨 COMPONENTES UI

### Componentes Base

#### Button
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="sm">
  Click me
</Button>
```

**Variantes:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Tamaños:** `default`, `sm`, `lg`, `icon`

#### Card
```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
  <CardFooter>
    Footer
  </CardFooter>
</Card>
```

#### Form
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialData,
});
```

### Componentes Especializados

#### DashboardLayout
Layout principal para dashboards con sidebar y header.

#### LoadingStates
Componentes para estados de carga, error y vacío.

#### RecordForm
Formulario genérico para crear/editar registros.

---

## 🗄️ BASE DE DATOS

### Esquema Principal

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  role          UserRole
  phone         String?
  avatar        String?
  bio           String?
  isActive      Boolean  @default(true)
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  lastLogin     DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relaciones
  properties    Property[]
  contracts     Contract[]
  payments      Payment[]
  tickets       Ticket[]
  notifications Notification[]
}
```

#### Property
```prisma
model Property {
  id          String        @id @default(cuid())
  title       String
  description String?
  address     String
  city        String
  commune     String
  region      String
  price       Float
  deposit     Float         @default(0)
  bedrooms    Int
  bathrooms   Int
  area        Float
  type        PropertyType
  status      PropertyStatus @default(AVAILABLE)
  features    String[]
  images      String[]
  ownerId     String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relaciones
  owner       User          @relation(fields: [ownerId], references: [id])
  contracts   Contract[]
  visits      Visit[]
  maintenance Maintenance[]
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  OWNER
  TENANT
  BROKER
  RUNNER
  SUPPORT
  MAINTENANCE_PROVIDER
  SERVICE_PROVIDER
}

enum PropertyType {
  APARTMENT
  HOUSE
  STUDIO
  ROOM
  COMMERCIAL
}

enum PropertyStatus {
  AVAILABLE
  RENTED
  PENDING
  MAINTENANCE
}
```

---

## 🔐 AUTENTICACIÓN Y AUTORIZACIÓN

### JWT Implementation

```typescript
// Generar tokens
const tokens = generateTokens(userId, email, role, name);

// Verificar token
const payload = verifyToken(token);

// Renovar token
const newTokens = refreshTokens(refreshToken);
```

### Middleware de Autorización

```typescript
// Verificar autenticación
const user = requireAuth(request);

// Verificar rol
requireRole(request, 'ADMIN');

// Verificar permisos específicos
requirePermission(request, 'properties:write');
```

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| ADMIN | Todos los permisos |
| OWNER | Gestionar propiedades propias |
| TENANT | Ver contratos y pagos propios |
| BROKER | Gestionar propiedades asignadas |
| RUNNER | Ejecutar tareas asignadas |
| SUPPORT | Gestionar tickets y soporte |

---

## 🔔 SISTEMA DE NOTIFICACIONES

### Tipos de Notificación

```typescript
enum NotificationType {
  PAYMENT_DUE = 'payment_due',
  PAYMENT_OVERDUE = 'payment_overdue',
  MAINTENANCE_REQUEST = 'maintenance_request',
  MAINTENANCE_COMPLETED = 'maintenance_completed',
  CONTRACT_EXPIRING = 'contract_expiring',
  VISIT_SCHEDULED = 'visit_scheduled',
  SYSTEM_ALERT = 'system_alert'
}
```

### Crear Notificación

```typescript
// Notificación simple
await notificationService.createSmartNotification(
  userId,
  NotificationType.PAYMENT_DUE,
  { amount: 350000, dueDate: '2024-03-15' }
);

// Notificación desde template
await notificationService.createFromTemplate(
  'payment_reminder',
  userId,
  { amount: 350000, property: 'Depto Las Condes' }
);
```

### Templates

```typescript
const templates = {
  payment_reminder: {
    title: 'Recordatorio de Pago',
    message: 'Tu pago de ${amount} vence el ${dueDate}',
    channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH],
    priority: NotificationPriority.HIGH
  }
};
```

---

## 📊 MONITOREO Y LOGGING

### Sistema de Logging

```typescript
import { logger } from '@/lib/logger';

// Diferentes niveles
logger.info('Información general', { context: 'user-action' });
logger.warn('Advertencia', { userId: user.id });
logger.error('Error crítico', { error: error.message });
logger.debug('Información de debug', { data: response });
```

### Monitoreo de Rendimiento

```typescript
import { performanceMonitor } from '@/lib/performance';

// Medir operación
performanceMonitor.startTimer('database-query');
const result = await db.query();
performanceMonitor.endTimer('database-query');

// Obtener métricas
const metrics = performanceMonitor.getMetrics();
```

### Alertas del Sistema

```typescript
import { monitoringSystem } from '@/lib/monitoring';

// Crear alerta
monitoringSystem.createAlert(
  'high_memory',
  'Uso de memoria alto',
  80,
  currentMemoryUsage
);

// Verificar salud del sistema
const health = await monitoringSystem.checkSystemHealth();
```

---

## ⚡ OPTIMIZACIÓN DE RENDIMIENTO

### Optimización de Consultas

```typescript
// Consulta optimizada
const properties = await getPropertiesOptimized({
  where: { status: 'AVAILABLE' },
  take: 20,
  orderBy: { createdAt: 'desc' },
  cache: true,
  cacheTTL: 300000
});
```

### Caché Inteligente

```typescript
import { queryOptimization } from '@/lib/performance';

// Guardar en caché
queryOptimization.setCache('properties:available', data, 300000);

// Obtener de caché
const cached = queryOptimization.getCache('properties:available');
```

### Lazy Loading

```typescript
// Componente lazy
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// Preload de rutas
bundleOptimization.preloadRoute('/dashboard');
```

---

## 🧪 TESTING

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('Auth Functions', () => {
  it('should hash password correctly', async () => {
    const password = 'testPassword123';
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
  });
});
```

### Integration Tests

```typescript
import { testApi } from '@/lib/test-utils';

describe('Properties API', () => {
  it('should create property', async () => {
    const response = await testApi.post('/api/properties', {
      title: 'Test Property',
      // ... otros campos
    });
    expect(response.status).toBe(201);
  });
});
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 🚀 DESPLIEGUE

### Producción

```bash
# Build de producción
npm run build

# Iniciar servidor
npm start
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Variables de Entorno de Producción

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/rent360"
JWT_SECRET="production-secret-key"
JWT_REFRESH_SECRET="production-refresh-secret"
```

---

## 🔧 MANTENIMIENTO

### Tareas Programadas

```typescript
// Verificación de salud cada minuto
setInterval(async () => {
  await monitoringSystem.checkSystemHealth();
}, 60000);

// Limpieza de datos cada 24 horas
setInterval(() => {
  monitoringSystem.cleanup();
}, 24 * 60 * 60 * 1000);
```

### Backup de Base de Datos

```bash
# Backup automático
pg_dump rent360 > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql rent360 < backup_20240315_143022.sql
```

### Actualizaciones

```bash
# Actualizar dependencias
npm update

# Ejecutar migraciones
npx prisma migrate deploy

# Reiniciar servicios
pm2 restart rent360
```

---

## 🛠️ TROUBLESHOOTING

### Problemas Comunes

#### Error de Conexión a Base de Datos
```bash
# Verificar conexión
npx prisma db pull

# Resetear base de datos
npx prisma migrate reset
```

#### Error de JWT
```bash
# Verificar variables de entorno
echo $JWT_SECRET

# Regenerar secretos
openssl rand -base64 32
```

#### Problemas de Rendimiento
```bash
# Verificar métricas
curl http://localhost:3000/api/health

# Analizar logs
tail -f logs/app.log
```

### Logs y Debugging

```typescript
// Habilitar debug
DEBUG=* npm run dev

// Ver logs en tiempo real
tail -f logs/error.log
```

### Contacto y Soporte

- **Documentación**: `/docs`
- **Issues**: GitHub Issues
- **Email**: support@rent360.com
- **Slack**: #rent360-support

---

## 📝 CHANGELOG

### v2.0.0 (2024-03-15)
- ✅ Implementación completa de PWA
- ✅ Sistema de notificaciones avanzado
- ✅ Chatbot AI integrado
- ✅ Motor de recomendaciones
- ✅ Análisis predictivo
- ✅ Optimización de rendimiento
- ✅ Sistema de monitoreo completo
- ✅ Testing automatizado
- ✅ Documentación completa

### v1.0.0 (2024-01-01)
- ✅ Funcionalidades básicas de gestión
- ✅ Autenticación JWT
- ✅ Dashboard básico
- ✅ CRUD de propiedades y usuarios

---

## 📄 LICENCIA

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 AUTORES

- **Equipo Rent360** - Desarrollo inicial
- **Contribuidores** - Mejoras y correcciones

---

**Última actualización**: 15 de Marzo de 2024  
**Versión**: 2.0.0  
**Estado**: Producción
