# Librerías y Utilidades

Este directorio contiene utilidades reutilizables y configuraciones centrales de la aplicación.

## db.ts

Configuración de Prisma ORM para el acceso a la base de datos.

### Características
- Singleton pattern para evitar múltiples conexiones
- Logging condicional según entorno
- Configuración flexible de datasource

### Uso
```typescript
import { db } from '@/lib/db';

// Ejemplo de consulta
const users = await db.user.findMany({
  where: { active: true },
  include: { profile: true },
});
```

## auth.ts

Utilidades para autenticación y manejo de JWT.

### Características
- Generación y verificación de tokens JWT
- Manejo de refresh tokens
- Gestión segura de cookies
- Validación de roles y permisos

### Funciones Principales

#### generateTokens
```typescript
import { generateTokens } from '@/lib/auth';

const tokens = generateTokens(userId, email, role, name);
// { accessToken: string, refreshToken: string }
```

#### verifyToken
```typescript
import { verifyToken } from '@/lib/auth';

const decoded = verifyToken(request);
// DecodedToken | null
```

#### setAuthCookies
```typescript
import { setAuthCookies } from '@/lib/auth';

setAuthCookies(response, accessToken, refreshToken);
```

#### requireAuth
```typescript
import { requireAuth } from '@/lib/auth';

const user = requireAuth(request);
// Lanza error si no está autenticado
```

#### requireRole
```typescript
import { requireRole } from '@/lib/auth';

const user = requireRole(request, 'admin');
// Lanza error si no tiene el rol requerido
```

## errors.ts

Sistema centralizado de manejo de errores.

### Clases de Error

#### AppError
Clase base para errores de la aplicación.

```typescript
import { AppError } from '@/lib/errors';

throw new AppError('Mensaje de error', 400, 'ERROR_CODE');
```

#### ValidationError
Para errores de validación.

```typescript
import { ValidationError } from '@/lib/errors';

throw new ValidationError('Datos inválidos', details);
```

#### AuthenticationError
Para errores de autenticación.

```typescript
import { AuthenticationError } from '@/lib/errors';

throw new AuthenticationError('No autorizado');
```

#### AuthorizationError
Para errores de autorización.

```typescript
import { AuthorizationError } from '@/lib/errors';

throw new AuthorizationError('Permisos insuficientes');
```

#### NotFoundError
Para recursos no encontrados.

```typescript
import { NotFoundError } from '@/lib/errors';

throw new NotFoundError('Usuario no encontrado');
```

#### ConflictError
Para conflictos de estado.

```typescript
import { ConflictError } from '@/lib/errors';

throw new ConflictError('El recurso ya existe');
```

### Funciones Utilitarias

#### handleError
Formatea errores para respuestas API.

```typescript
import { handleError } from '@/lib/errors';

try {
  // Operación que puede fallar
} catch (error) {
  const response = handleError(error);
  // { error: string, statusCode: number, code?: string }
}
```

#### validateRequest
Valida datos con schemas Zod.

```typescript
import { validateRequest } from '@/lib/errors';
import { userSchema } from '@/lib/validations';

const validatedData = validateRequest(userSchema, rawData);
```

#### sanitizeInput
Limpia y sanitiza strings de entrada.

```typescript
import { sanitizeInput } from '@/lib/errors';

const cleanInput = sanitizeInput(userInput);
```

#### isValidEmail
Valida formato de email.

```typescript
import { isValidEmail } from '@/lib/errors';

const valid = isValidEmail('user@example.com');
```

#### isValidPassword
Valida fortaleza de contraseña.

```typescript
import { isValidPassword } from '@/lib/errors';

const validation = isValidPassword('MyPassword123!');
// { valid: boolean, errors: string[] }
```

#### rateLimit
Implementa rate limiting simple.

```typescript
import { rateLimit } from '@/lib/errors';

const allowed = rateLimit('user_123', 100, 60000);
// true si está dentro del límite
```

## validations.ts

Schemas de validación con Zod.

### Schemas Disponibles

#### loginSchema
```typescript
import { loginSchema } from '@/lib/validations';

const { email, password } = loginSchema.parse({
  email: 'user@example.com',
  password: 'Password123!',
});
```

#### registerSchema
```typescript
import { registerSchema } from '@/lib/validations';

const userData = registerSchema.parse({
  email: 'user@example.com',
  password: 'Password123!',
  name: 'Juan Pérez',
  role: 'tenant',
});
```

#### propertySchema
```typescript
import { propertySchema } from '@/lib/validations';

const propertyData = propertySchema.parse({
  title: 'Departamento en Las Condes',
  description: 'Hermoso departamento...',
  address: 'Av. Apoquindo 3400',
  city: 'Santiago',
  commune: 'Las Condes',
  region: 'Metropolitana',
  price: 500000,
  deposit: 250000,
  bedrooms: 2,
  bathrooms: 1,
  area: 80,
  type: 'APARTMENT',
});
```

#### contractSchema
```typescript
import { contractSchema } from '@/lib/validations';

const contractData = contractSchema.parse({
  propertyId: 'clx123...',
  tenantId: 'clx456...',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  monthlyRent: 500000,
  deposit: 250000,
});
```

#### paymentSchema
```typescript
import { paymentSchema } from '@/lib/validations';

const paymentData = paymentSchema.parse({
  contractId: 'clx789...',
  amount: 500000,
  dueDate: '2024-01-01',
  paymentMethod: 'BANK_TRANSFER',
});
```

## utils.ts

Utilidades generales de la aplicación.

### Funciones Disponibles

#### cn
Combina clases CSS con clsx y tailwind-merge.

```typescript
import { cn } from '@/lib/utils';

const className = cn('base-class', condition && 'conditional-class');
```

#### formatCurrency
Formatea números como moneda chilena.

```typescript
import { formatCurrency } from '@/lib/utils';

const formatted = formatCurrency(500000);
// '$500.000'
```

#### formatDate
Formatea fechas en formato chileno.

```typescript
import { formatDate } from '@/lib/utils';

const formatted = formatDate(new Date());
// '15/01/2024'
```

#### formatDateTime
Formatea fecha y hora.

```typescript
import { formatDateTime } from '@/lib/utils';

const formatted = formatDateTime(new Date());
// '15/01/2024 14:30'
```

#### formatRelativeTime
Formatea tiempo relativo.

```typescript
import { formatRelativeTime } from '@/lib/utils';

const formatted = formatRelativeTime(new Date(Date.now() - 3600000));
// 'Hace 1 hora'
```

#### generateId
Genera IDs únicos.

```typescript
import { generateId } from '@/lib/utils';

const id = generateId();
// 'clx123abc456...'
```

#### debounce
Función debounce para optimizar eventos.

```typescript
import { debounce } from '@/lib/utils';

const debouncedSearch = debounce((query: string) => {
  // Lógica de búsqueda
}, 300);
```

#### throttle
Función throttle para limitar ejecuciones.

```typescript
import { throttle } from '@/lib/utils';

const throttledScroll = throttle(() => {
  // Lógica de scroll
}, 100);
```

#### deepClone
Clona objetos profundamente.

```typescript
import { deepClone } from '@/lib/utils';

const cloned = deepClone(originalObject);
```

#### isValidUrl
Valida URLs.

```typescript
import { isValidUrl } from '@/lib/utils';

const valid = isValidUrl('https://example.com');
```

#### truncateText
Trunca texto con elipsis.

```typescript
import { truncateText } from '@/lib/utils';

const truncated = truncateText('Texto largo...', 20);
// 'Texto largo...'
```

## access-control.ts

Control de acceso y permisos.

### Funciones Principales

#### canAccess
Verifica si un usuario puede acceder a un recurso.

```typescript
import { canAccess } from '@/lib/access-control';

const canView = canAccess(user, 'properties', 'read');
```

#### hasPermission
Verifica permisos específicos.

```typescript
import { hasPermission } from '@/lib/access-control';

const canEdit = hasPermission(user, 'edit_properties');
```

#### checkRoleAccess
Verifica acceso basado en rol.

```typescript
import { checkRoleAccess } from '@/lib/access-control';

const allowed = checkRoleAccess(user.role, '/admin/dashboard');
```

## socket.ts

Configuración de Socket.io para comunicación en tiempo real.

### Características
- Conexión automática
- Manejo de reconexión
- Eventos personalizados
- Salas por usuario

### Eventos Disponibles

#### Servidor → Cliente
- `notification`: Nueva notificación
- `message_update`: Actualización de mensaje
- `property_update`: Actualización de propiedad
- `payment_status`: Cambio de estado de pago

#### Cliente → Servidor
- `join_room`: Unirse a sala
- `leave_room`: Dejar sala
- `send_message`: Enviar mensaje
- `mark_notification_read`: Marcar notificación como leída

### Uso en Componentes
```typescript
import { useSocket } from '@/hooks/useSocket';

const MyComponent = () => {
  const socket = useSocket();

  useEffect(() => {
    if (socket.connected) {
      socket.on('notification', (data) => {
        // Manejar notificación
      });
    }
  }, [socket]);

  return <div>Componente con WebSocket</div>;
};
```