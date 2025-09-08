# 🛠️ Guía de Desarrollo - Rent360

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18.x o superior
- npm o yarn
- Git
- PostgreSQL (desarrollo local)
- Redis (opcional, para cache)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/rent360/rent360.git
   cd rent360
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```

   Editar `.env.local` con tus configuraciones locales:
   ```env
   # Base de datos
   DATABASE_URL="postgresql://user:password@localhost:5432/rent360_dev"

   # JWT
   JWT_SECRET="tu-jwt-secret-super-seguro"
   JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro"

   # Redis (opcional)
   REDIS_URL="redis://localhost:6379"

   # Email (opcional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="tu-email@gmail.com"
   SMTP_PASS="tu-app-password"
   ```

4. **Configurar base de datos**
   ```bash
   # Generar cliente Prisma
   npm run db:generate

   # Crear y migrar base de datos
   npm run db:push

   # (Opcional) Seed con datos de prueba
   npm run db:seed
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
rent360/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas de autenticación
│   │   ├── (dashboard)/       # Dashboard principal
│   │   ├── api/               # API Routes
│   │   └── layout.tsx         # Layout principal
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── forms/            # Formularios
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilidades y configuración
│   │   ├── auth.ts           # Autenticación
│   │   ├── db.ts             # Base de datos
│   │   ├── validations.ts    # Esquemas de validación
│   │   └── utils/            # Utilidades generales
│   ├── middleware.ts         # Middleware de Next.js
│   └── types/                # Definiciones de tipos
├── services/                 # Microservicios
│   └── api-gateway/          # API Gateway
├── tests/                    # Tests
│   ├── unit/                # Tests unitarios
│   ├── integration/         # Tests de integración
│   ├── e2e/                 # Tests end-to-end
│   └── setup.ts             # Configuración de tests
├── docs/                    # Documentación
├── prisma/                  # Schema de base de datos
├── .github/                 # CI/CD y GitHub config
└── public/                  # Assets estáticos
```

## 🏗️ Arquitectura de Desarrollo

### Patrón de Arquitectura
Seguimos una arquitectura de **microservicios** con **API Gateway**:

- **Frontend**: Next.js con App Router
- **API Gateway**: Express.js para enrutamiento y seguridad
- **Microservicios**: Servicios independientes por dominio
- **Base de datos**: PostgreSQL con Prisma ORM
- **Cache**: Redis para optimización

### Principios de Desarrollo

#### 1. Clean Code
- Nombres descriptivos y consistentes
- Funciones pequeñas y enfocadas
- Comentarios cuando sea necesario
- Evitar código duplicado

#### 2. TypeScript
- Usar tipos estrictos
- Evitar `any` siempre que sea posible
- Interfaces para contratos de datos
- Generics para reutilización

#### 3. Testing
- Tests unitarios para lógica pura
- Tests de integración para APIs
- Tests E2E para flujos críticos
- Cobertura mínima del 75%

#### 4. Git Flow
- `main`: Código de producción
- `develop`: Desarrollo activo
- `feature/*`: Nuevas funcionalidades
- `hotfix/*`: Corrección de bugs

## 🔧 Scripts Disponibles

### Desarrollo
```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run preview          # Preview del build
```

### Base de Datos
```bash
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Aplicar cambios al schema
npm run db:migrate       # Crear migraciones
npm run db:seed          # Seed con datos de prueba
npm run db:studio        # Prisma Studio
```

### Calidad de Código
```bash
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores automáticamente
npm run format           # Formatear código con Prettier
npm run format:check     # Verificar formato
npm run type-check       # Verificar tipos TypeScript
npm run quality          # Verificación completa
```

### Testing
```bash
npm run test             # Tests básicos
npm run test:unit        # Tests unitarios
npm run test:integration # Tests de integración
npm run test:e2e         # Tests E2E
npm run test:coverage    # Tests con cobertura
```

## 📝 Estándares de Código

### Naming Conventions

#### Archivos y Directorios
- **Componentes**: `PascalCase` (Ej: `UserProfile.tsx`)
- **Utilidades**: `camelCase` (Ej: `formatDate.ts`)
- **Tipos**: `PascalCase` (Ej: `User.ts`)
- **Constantes**: `SCREAMING_SNAKE_CASE` (Ej: `MAX_FILE_SIZE`)

#### Variables y Funciones
```typescript
// ✅ Correcto
const userName = 'john';
const getUserById = (id: string) => { ... };
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ❌ Incorrecto
const username = 'john';        // Inconsistente
const getuserbyid = (id) => {}; // Sin tipos
const maxFileSize = 10000000;   // Mágico número
```

### Estructura de Componentes

```typescript
// components/UserProfile.tsx
import { FC } from 'react';
import { User } from '@/types';

interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

export const UserProfile: FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Component logic here
  return (
    <div className="user-profile">
      {/* JSX here */}
    </div>
  );
};
```

### Estructura de API Routes

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { apiWrapper } from '@/lib/api-wrapper';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

async function getUsersHandler(request: NextRequest) {
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  return NextResponse.json({ data: users });
}

async function createUserHandler(request: NextRequest) {
  const body = await request.json();

  // Validation and creation logic
  const user = await db.user.create({
    data: body
  });

  logger.info('User created', { userId: user.id });

  return NextResponse.json({ data: user }, { status: 201 });
}

export const GET = apiWrapper({ GET: getUsersHandler });
export const POST = apiWrapper(
  { POST: createUserHandler },
  { requireAuth: true, requireRoles: ['ADMIN'] }
);
```

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/                    # Tests unitarios
│   ├── auth.test.ts        # Test de autenticación
│   ├── utils.test.ts       # Test de utilidades
│   └── components/         # Tests de componentes
├── integration/            # Tests de integración
│   ├── api.test.ts         # Tests de API
│   └── database.test.ts    # Tests de BD
├── e2e/                    # Tests end-to-end
│   ├── auth-flow.spec.ts   # Flujo de autenticación
│   └── property-flow.spec.ts # Flujo de propiedades
└── setup.ts               # Configuración global
```

### Ejemplo de Test Unitario

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from '@jest/globals';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format CLP currency correctly', () => {
    expect(formatCurrency(1000, 'CLP')).toBe('$1.000');
    expect(formatCurrency(1500000, 'CLP')).toBe('$1.500.000');
  });

  it('should handle zero values', () => {
    expect(formatCurrency(0, 'CLP')).toBe('$0');
  });

  it('should throw error for unsupported currencies', () => {
    expect(() => formatCurrency(1000, 'EUR')).toThrow('Unsupported currency');
  });
});
```

### Ejemplo de Test de API

```typescript
// tests/integration/auth-api.test.ts
import { describe, it, expect } from '@jest/globals';
import { createTestClient } from '../setup';

describe('Auth API', () => {
  const client = createTestClient();

  it('should login successfully with valid credentials', async () => {
    const response = await client.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('user');
    expect(response.data).toHaveProperty('token');
  });

  it('should reject login with invalid credentials', async () => {
    const response = await client.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });

    expect(response.status).toBe(401);
    expect(response.data.error).toBe('Credenciales inválidas');
  });
});
```

## 🔒 Seguridad

### Validación de Entrada
- Usar **Zod** para validación de esquemas
- Sanitizar todos los inputs del usuario
- Validar tipos de archivos y tamaños
- Proteger contra ataques de inyección

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['TENANT', 'OWNER', 'BROKER'])
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = createUserSchema.parse(body);

  // Proceder con datos validados
}
```

### Autenticación y Autorización
- JWT tokens con refresh mechanism
- Roles y permisos granulares
- Middleware de autenticación
- Auditoría de acciones sensibles

### Headers de Seguridad
```typescript
// En middleware.ts
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Content-Security-Policy', "default-src 'self'");
```

## 🚀 Deployment

### Entornos

#### Development
- Variables de entorno locales
- Base de datos SQLite/PostgreSQL local
- Hot reload activado
- Logs detallados

#### Staging
- Base de datos separada
- Variables de entorno de staging
- Tests automatizados
- Monitoreo básico

#### Production
- Base de datos PostgreSQL en la nube
- Redis para cache
- CDN para assets
- Monitoreo completo
- Backups automáticos

### Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@host:5432/db"

# JWT
JWT_SECRET="production-secret-key"
JWT_REFRESH_SECRET="production-refresh-secret"

# Redis
REDIS_URL="redis://production-redis:6379"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_USER="apikey"
SMTP_PASS="sendgrid-api-key"

# Storage
AWS_S3_BUCKET="rent360-production"
AWS_ACCESS_KEY_ID="aws-key"
AWS_SECRET_ACCESS_KEY="aws-secret"

# Monitoring
SENTRY_DSN="sentry-dsn"
DATADOG_API_KEY="datadog-key"
```

## 📊 Monitoreo

### Métricas a Monitorear

#### Performance
- Response times por endpoint
- Throughput de requests
- CPU y memory usage
- Database query performance

#### Business
- Usuarios activos
- Conversion rates
- Error rates por funcionalidad
- Revenue metrics

#### System
- Uptime del servicio
- Database connections
- Cache hit rates
- Queue lengths

### Herramientas Recomendadas

#### Logging
- **Winston**: Logging estructurado
- **Sentry**: Error tracking
- **DataDog**: Log aggregation

#### Monitoring
- **Prometheus**: Métricas
- **Grafana**: Dashboards
- **DataDog**: Application monitoring

#### Alerting
- **Alert Manager**: Alertas automáticas
- **PagerDuty**: On-call management
- **Slack**: Notificaciones

## 🤝 Contribución

### Proceso de Contribución

1. **Fork** el repositorio
2. **Crear** rama feature (`git checkout -b feature/amazing-feature`)
3. **Commit** cambios (`git commit -m 'Add amazing feature'`)
4. **Push** rama (`git push origin feature/amazing-feature`)
5. **Crear** Pull Request

### Pull Request Guidelines

#### Título
- Usar formato imperativo: "Add feature" no "Added feature"
- Ser descriptivo pero conciso
- Incluir número de issue si aplica

#### Descripción
- Explicar qué cambios introduce
- Incluir screenshots si es UI
- Mencionar breaking changes
- Referenciar issues relacionados

#### Checklist
- [ ] Tests incluidos
- [ ] Documentación actualizada
- [ ] Linting aprobado
- [ ] Coverage mantenido
- [ ] Funciona en todos los browsers

### Code Review Process

#### Reviewer Checklist
- [ ] Código sigue estándares
- [ ] Tests adecuados
- [ ] Documentación actualizada
- [ ] Performance considerations
- [ ] Security implications

#### Approval Criteria
- ✅ 2 approvals mínimas
- ✅ Tests pasan
- ✅ No conflictos de merge
- ✅ CI/CD verde

## 📚 Recursos Adicionales

### Documentación
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Herramientas
- [VS Code](https://code.visualstudio.com/) - Editor recomendado
- [Postman](https://www.postman.com/) - Testing de APIs
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [React DevTools](https://reactjs.org/blog/2015/09/02/new-react-developer-tools.html)

### Comunidad
- [Discord Channel](https://discord.gg/rent360)
- [GitHub Discussions](https://github.com/rent360/rent360/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/rent360)

¡Feliz desarrollo! 🎉
