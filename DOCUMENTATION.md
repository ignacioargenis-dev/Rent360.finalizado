# Rent360 - Sistema de Gestión de Arriendos

## Overview

Rent360 es una plataforma integral de gestión de arriendos diseñada para el mercado chileno, que facilita la conexión entre propietarios, inquilinos, corredores y otros actores del ecosistema inmobiliario.

## Características Principales

### 🏠 Gestión de Propiedades
- Publicación y gestión de propiedades
- Búsqueda avanzada con filtros
- Fotografías y documentos digitales
- Estados de disponibilidad en tiempo real

### 📝 Contratos Digitales
- Contratos con firma electrónica
- Plantillas personalizables
- Gestión de renovaciones
- Historial de contratos

### 💳 Sistema de Pagos
- Integración con Khipu
- Recordatorios automáticos
- Historial de transacciones
- Múltiples métodos de pago

### 👥 Gestión de Usuarios
- Múltiples roles (Admin, Propietario, Inquilino, Corredor, Runner, Soporte)
- Perfiles completos con verificación
- Sistema de calificaciones
- Comunicación interna

### 📊 Reportes y Analíticas
- Dashboard en tiempo real
- Reportes financieros
- Análisis de ocupación
- Métricas de desempeño

## Arquitectura del Sistema

### Frontend
- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Estado**: Zustand + TanStack Query

### Backend
- **API**: Rutas API de Next.js
- **Base de Datos**: Prisma ORM con SQLite
- **Autenticación**: JWT con cookies seguras
- **Validación**: Zod schemas
- **Manejo de Errores**: Sistema centralizado

### Seguridad
- JWT con secretos de 32+ caracteres
- Cookies HTTP-only, Secure, SameSite=strict
- Validación de entrada y sanitización
- Rate limiting
- Middleware de autenticación

## Estructura del Proyecto

```
src/
├── app/                          # Rutas de Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación
│   ├── admin/                    # Panel de administrador
│   ├── broker/                   # Panel de corredores
│   ├── owner/                    # Panel de propietarios
│   ├── tenant/                   # Panel de inquilinos
│   ├── runner/                   # Panel de runners
│   ├── support/                  # Panel de soporte
│   ├── api/                      # Rutas API
│   └── globals.css               # Estilos globales
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes UI base
│   ├── dashboard/                # Componentes de dashboard
│   ├── forms/                    # Componentes de formularios
│   ├── documents/                # Componentes de documentos
│   ├── payments/                 # Componentes de pagos
│   └── notifications/            # Componentes de notificaciones
├── hooks/                        # Custom hooks
├── lib/                          # Utilidades y configuración
│   ├── db.ts                     # Configuración de base de datos
│   ├── auth.ts                   # Utilidades de autenticación
│   ├── errors.ts                 # Manejo de errores
│   ├── validations.ts            # Schemas de validación
│   └── utils.ts                  # Utilidades varias
├── types/                        # Tipos de TypeScript
└── middleware.ts                 # Middleware de Next.js
```

## Roles de Usuario

### Administrador (admin)
- Acceso completo al sistema
- Gestión de usuarios y permisos
- Reportes globales
- Configuración del sistema

### Propietario (owner)
- Gestión de propiedades
- Contratos y pagos
- Comunicación con inquilinos
- Reportes de ingresos

### Inquilino (tenant)
- Búsqueda de propiedades
- Gestión de contratos
- Pagos y calificaciones
- Solicitudes de mantenimiento

### Corredor (broker)
- Gestión de cartera de clientes
- Publicación de propiedades
- Coordinación de visitas
- Comisiones y analytics

### Runner (runner)
- Gestión de visitas programadas
- Reportes de propiedades
- Calificaciones y feedback
- Historial de actividades

### Soporte (support)
- Gestión de tickets
- Base de conocimiento
- Reportes de satisfacción
- Comunicación con usuarios

## Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Instalación Automática (Recomendada)
```bash
# Clonar el repositorio
git clone <repository-url>
cd rent360

# Configuración automática completa
npm run setup

# Iniciar servidor de desarrollo
npm run dev
```

### Instalación Manual
```bash
# Clonar el repositorio
git clone <repository-url>
cd rent360

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env.local

# Generar cliente de Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:push

# Crear datos de prueba
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno
```env
# Base de datos
DATABASE_URL="file:./dev.db"

# JWT Secrets (mínimo 32 caracteres)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-jwt-key-minimum-32-chars"

# Configuración de JWT
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Configuración de la aplicación
NODE_ENV="development"
DOMAIN="localhost"
```

## Desarrollo

### Scripts Disponibles
```bash
# Configuración
npm run setup            # Configuración automática completa

# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción

# Base de datos
npm run db:push          # Sincronizar schema con base de datos
npm run db:generate      # Generar cliente de Prisma
npm run db:studio        # Abrir Prisma Studio
npm run db:migrate       # Ejecutar migraciones
npm run db:reset         # Resetear base de datos
npm run seed             # Crear datos de prueba

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint
npm run type-check       # Verificar tipos de TypeScript
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato de código

# Utilidades
npm run clean            # Limpiar archivos generados
npm run test             # Ejecutar tests
```

### Convenciones de Código

#### TypeScript
- Usar tipos estrictos
- Interfaces para objetos complejos
- Tipos genéricos para componentes reutilizables
- Evitar `any` siempre que sea posible

#### Componentes
- Usar componentes funcionales
- Hooks personalizados para lógica reutilizable
- Props tipadas
- Manejo adecuado de estados y efectos

#### Estilos
- Usar Tailwind CSS
- Componentes de shadcn/ui
- Diseño responsive
- Tema consistente

#### API
- Rutas RESTful
- Validación con Zod
- Manejo de errores centralizado
- Respuestas consistentes

## Pruebas

### Estrategia de Pruebas
- **Unit Tests**: Lógica de negocio y utilidades
- **Integration Tests**: API y base de datos
- **E2E Tests**: Flujos de usuario completos

### Ejecutar Pruebas
```bash
npm run test           # Ejecutar todas las pruebas
npm run test:watch    # Modo watch para desarrollo
npm run test:coverage # Reporte de cobertura
```

## Despliegue

### Entornos
- **Development**: `npm run dev`
- **Staging**: Despliegue en Vercel branch
- **Production**: Despliegue en Vercel main

### Configuración de Producción
1. Configurar variables de entorno en Vercel
2. Ejecutar migraciones de base de datos
3. Construir y desplegar aplicación
4. Verificar funcionamiento de todas las features

## Seguridad

### Medidas Implementadas
- Autenticación con JWT seguro
- Cookies HTTP-only y Secure
- Validación de entrada sanitizada
- Rate limiting en endpoints críticos
- CORS configurado adecuadamente
- Headers de seguridad HTTP

### Buenas Prácticas
- Nunca exponer secrets en el frontend
- Validar todos los inputs del usuario
- Usar parámetros preparados para queries
- Implementar manejo de errores seguro
- Mantener dependencias actualizadas

## Contribución

### Flujo de Trabajo
1. Fork del repositorio
2. Crear rama feature/`nombre-feature`
3. Desarrollar cambios con tests
4. Hacer commit de cambios
5. Push a la rama
6. Crear Pull Request

### Estándares de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato/estilo
refactor: refactorización de código
test: adición/modificación de tests
chore: tareas de mantenimiento
```

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## Soporte

Para soporte técnico:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Revisar la documentación existente

---

**Rent360** - Transformando la experiencia de arriendo en Chile 🇨🇱