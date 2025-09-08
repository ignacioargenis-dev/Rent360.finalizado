# Rent360 - Plataforma Integral de Gestión Inmobiliaria

[![CI/CD](https://github.com/rent360/rent360/actions/workflows/ci.yml/badge.svg)](https://github.com/rent360/rent360/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/rent360/rent360/branch/main/graph/badge.svg)](https://codecov.io/gh/rent360/rent360)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Rent360 es una plataforma completa de gestión inmobiliaria que facilita el proceso de arrendamiento de propiedades, contratos digitales, pagos automáticos y gestión de mantenimientos.

## 🚀 Características Principales

### Gestión de Propiedades
- ✅ Catálogo completo de propiedades
- ✅ Sistema de búsqueda avanzada
- ✅ Gestión de disponibilidad y estados
- ✅ Galería de imágenes y características

### Contratos Digitales
- ✅ Creación y gestión de contratos
- ✅ Firmas electrónicas certificadas (Ley 19.799)
- ✅ Validación automática de documentos
- ✅ Historial completo de contratos

### Sistema de Pagos
- ✅ Integración con múltiples proveedores (Khipu, Stripe, PayPal)
- ✅ Pagos automáticos recurrentes
- ✅ Gestión de depósitos y garantías
- ✅ Reportes financieros detallados

### Gestión de Usuarios
- ✅ Roles diferenciados (Propietarios, Inquilinos, Corredores, Administradores)
- ✅ Sistema de autenticación seguro
- ✅ Perfiles verificados con RUT chileno
- ✅ Notificaciones inteligentes

### Mantenimiento y Servicios
- ✅ Sistema de tickets de mantenimiento
- ✅ Gestión de proveedores de servicios
- ✅ Programación de visitas
- ✅ Calificaciones y reseñas

### Sistema Legal
- ✅ Gestión de casos legales
- ✅ Notificaciones extrajudiciales
- ✅ Seguimiento de procedimientos judiciales
- ✅ Cumplimiento normativo chileno

## 🛠️ Tecnologías Utilizadas

### Backend
- **Framework**: Next.js 14 con App Router
- **Base de Datos**: SQLite con Prisma ORM
- **Autenticación**: JWT con refresh tokens
- **API**: RESTful con OpenAPI 3.0
- **Validación**: Zod schemas
- **Caching**: Redis/Memcached
- **Queue**: Background jobs con Redis

### Frontend
- **UI Framework**: React 18 con TypeScript
- **Styling**: Tailwind CSS
- **Componentes**: Radix UI
- **Estado**: React hooks + Context
- **Forms**: React Hook Form + Zod
- **Gráficos**: Recharts

### Microservicios
- **API Gateway**: Express.js con autenticación
- **Auth Service**: Gestión de usuarios y autenticación
- **Property Service**: Gestión de propiedades
- **Communication**: Socket.io para tiempo real

### Integraciones Externas
- **Firmas Electrónicas**: TrustFactory, FirmaPro (certificados SII)
- **Pagos**: Khipu, Stripe, PayPal, WebPay
- **Almacenamiento**: AWS S3, Google Cloud Storage
- **Email**: SMTP con templates
- **SMS**: Twilio, MessageBird
- **Mapas**: Google Maps API

### DevOps & Calidad
- **CI/CD**: GitHub Actions
- **Testing**: Jest + Playwright (Unit, Integration, E2E)
- **Linting**: ESLint + Prettier
- **Coverage**: Codecov
- **Monitoring**: Winston + custom metrics
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- SQLite (incluido) o PostgreSQL/MySQL
- Redis (opcional, para caching avanzado)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/rent360/rent360.git
cd rent360
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus configuraciones:
```env
# Base de datos
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="tu-jwt-secret-super-seguro"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"

# Integraciones de pago (opcional)
KHIPU_SECRET="tu-khipu-secret"
STRIPE_SECRET_KEY="tu-stripe-secret"

# Firmas electrónicas (opcional)
TRUSTFACTORY_API_KEY="tu-trustfactory-key"
FIRMAPRO_API_KEY="tu-firmapro-key"
```

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Crear migraciones
npm run db:push

# (Opcional) Seed con datos de prueba
npm run db:seed
```

### 5. Iniciar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Testing

### Ejecutar todos los tests
```bash
npm run test:all
```

### Tests por tipo
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Security tests
npm run test:security
```

### Coverage
```bash
npm run test:coverage
```

## 📚 Documentación de API

La documentación completa de la API está disponible en:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: `/docs/api-documentation.yml`
- **Postman Collection**: `/docs/rent360-api.postman_collection.json`

### Endpoints principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Información del usuario actual
- `POST /api/auth/logout` - Cerrar sesión

#### Propiedades
- `GET /api/properties` - Listar propiedades
- `POST /api/properties` - Crear propiedad
- `GET /api/properties/{id}` - Obtener propiedad
- `PUT /api/properties/{id}` - Actualizar propiedad
- `DELETE /api/properties/{id}` - Eliminar propiedad

#### Contratos
- `GET /api/contracts` - Listar contratos
- `POST /api/contracts` - Crear contrato
- `GET /api/contracts/{id}` - Obtener contrato
- `PUT /api/contracts/{id}` - Actualizar contrato

#### Pagos
- `GET /api/payments` - Listar pagos
- `POST /api/payments` - Crear pago
- `GET /api/payments/{id}` - Obtener pago

#### Firmas Electrónicas
- `GET /api/signatures` - Listar firmas
- `POST /api/signatures` - Crear solicitud de firma
- `POST /api/signatures/{id}/send` - Enviar firma
- `GET /api/signatures/{id}/download` - Descargar documento firmado

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Build de producción
npm run start            # Iniciar servidor de producción
npm run preview          # Preview del build

# Base de datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Aplicar cambios al schema
npm run db:migrate       # Crear migraciones
npm run db:seed          # Seed con datos de prueba
npm run db:studio        # Abrir Prisma Studio

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de linting automáticamente
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato del código
npm run type-check       # Verificar tipos TypeScript

# Testing
npm run test             # Ejecutar tests básicos
npm run test:watch       # Tests en modo watch
npm run test:unit        # Solo tests unitarios
npm run test:integration # Solo tests de integración
npm run test:e2e         # Tests end-to-end
npm run test:coverage    # Tests con reporte de cobertura

# Utilidades
npm run quality          # Verificar calidad completa (lint + format + test + types)
npm run clean            # Limpiar archivos generados
npm run docs             # Generar documentación
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Docker
```bash
# Build
docker build -t rent360 .

# Run
docker run -p 3000:3000 rent360
```

### Manual
```bash
# Build
npm run build

# Start
npm run start
```

## 🔒 Seguridad

### Características de Seguridad Implementadas
- ✅ **Autenticación JWT** con refresh tokens
- ✅ **Rate limiting** por IP y usuario
- ✅ **Validación de entrada** con Zod
- ✅ **Sanitización** de datos
- ✅ **Headers de seguridad** (CSP, HSTS, etc.)
- ✅ **Encriptación** de datos sensibles
- ✅ **Auditoría** completa de acciones
- ✅ **Protección CSRF**
- ✅ **Validación de archivos** subidos

### Configuración de Seguridad
```env
# JWT Secrets (requeridos)
JWT_SECRET="tu-jwt-secret-super-seguro-min-32-chars"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro-min-32-chars"

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# CORS
ALLOWED_ORIGINS="https://tu-dominio.com,https://app.tu-dominio.com"
```

## 📊 Monitoreo y Métricas

### Health Checks
- `GET /api/health` - Estado general del sistema
- `GET /api/health/database` - Estado de la base de datos
- `GET /api/health/cache` - Estado del cache

### Métricas Disponibles
- ✅ **Performance**: Response times, throughput
- ✅ **Errors**: Rate de errores, tipos de errores
- ✅ **Database**: Queries lentas, conexiones
- ✅ **Cache**: Hit rate, memory usage
- ✅ **System**: CPU, memory, disk usage

### Logs
```bash
# Ver logs en desarrollo
npm run dev

# Ver logs de producción
tail -f logs/app.log
```

## 🤝 Contribución

### Guía de Contribución
1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Estándares de Código
- ✅ **ESLint** configurado con reglas estrictas
- ✅ **Prettier** para formateo consistente
- ✅ **TypeScript** con strict mode
- ✅ **Tests** requeridos para nuevas funcionalidades
- ✅ **Coverage** mínimo del 75%

### Git Hooks
Los siguientes hooks están configurados automáticamente:
- `pre-commit`: Ejecuta linting y formateo
- `commit-msg`: Valida formato de mensajes de commit
- `pre-push`: Ejecuta tests completos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

- **Email**: support@rent360.cl
- **Documentación**: [docs.rent360.cl](https://docs.rent360.cl)
- **Issues**: [GitHub Issues](https://github.com/rent360/rent360/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/rent360/rent360/discussions)

## 🙏 Agradecimientos

- **Next.js** - Framework React
- **Prisma** - ORM moderno
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Componentes accesibles
- **TrustFactory & FirmaPro** - Proveedores de firmas electrónicas certificadas

---

**Rent360** - Simplificando la gestión inmobiliaria con tecnología de vanguardia.