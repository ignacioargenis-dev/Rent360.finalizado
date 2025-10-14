# Análisis Detallado: Problemas con Permisos de Usuarios

## Fecha de Análisis

14 de Octubre, 2025

## Problema Reportado

Al iniciar sesión con las credenciales de admin (admin@sendspress.cl), se obtiene error de "Acceso Denegado" al intentar navegar entre las diferentes páginas del sistema.

---

## 🔍 ANÁLISIS DEL FLUJO DE AUTENTICACIÓN

### 1. Proceso de Login

**Archivo:** `src/app/api/auth/login/route.ts`

```typescript
// Línea 126 - El rol se convierte a MINÚSCULAS
const role = user.role.toLowerCase();

// Línea 130-135 - Genera tokens con rol en minúsculas
const { accessToken, refreshToken } = generateTokens(
  user.id,
  user.email,
  role,  // ← 'admin' en minúsculas
  user.name,
);

// Línea 144 - Devuelve usuario con rol en minúsculas
role: role,  // ← 'admin' en minúsculas
```

### 2. Base de Datos (Prisma Schema)

**Archivo:** `prisma/schema.prisma`

```prisma
enum UserRole {
  ADMIN      // ← En MAYÚSCULAS en el enum
  OWNER
  TENANT
  BROKER
  RUNNER
  SUPPORT
}

model User {
  role String @default("TENANT")  // ← Guardado como String en MAYÚSCULAS
}
```

### 3. Token JWT

**Archivo:** `src/lib/auth.ts`

```typescript
// Línea 142 - El token se crea con el rol tal como se pasa
const accessToken = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, {
  expiresIn: JWT_EXPIRES_IN,
});
```

**Contenido del Token:**

```json
{
  "id": "user-id",
  "email": "admin@sendspress.cl",
  "role": "admin", // ← En minúsculas (porque se convirtió en login)
  "name": "Admin User",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 4. Verificación de Autenticación (/api/auth/me)

**Archivo:** `src/app/api/auth/me/route.ts`

```typescript
// Línea 30 - Decodifica el token JWT
decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

// Línea 53 - Devuelve el rol TAL COMO ESTÁ en el token
role: decoded.role,  // ← 'admin' en minúsculas
```

### 5. Carga del Usuario en el Layout

**Archivo:** `src/components/layout/UnifiedDashboardLayout.tsx`

```typescript
// Línea 67-73 - Llama a /api/auth/me
const response = await fetch('/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Línea 78 - Establece el usuario con los datos recibidos
setUser(data.user); // ← user.role = 'admin' (minúsculas)
```

### 6. Verificación de Permisos en las Páginas

**Archivo:** `src/app/admin/users/page.tsx`

```typescript
// Línea 43 - Obtiene el usuario del contexto
const user = useDashboardUser();

// Línea 378 - Verifica si el usuario tiene rol de admin
if (user.role !== 'admin') {  // ← Compara con 'admin' en minúsculas
  return (
    <UnifiedDashboardLayout title="Gestión de Usuarios" subtitle="Acceso restringido">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
```

---

## 🐛 PROBLEMAS IDENTIFICADOS

### Problema #1: Inconsistencia en el Formato del Rol

**UBICACIÓN:** Base de datos vs. Token JWT vs. Validaciones

**DESCRIPCIÓN:**

- En la base de datos (Prisma): El rol está en MAYÚSCULAS (`ADMIN`, `OWNER`, `TENANT`)
- En el token JWT: El rol se convierte a minúsculas (`admin`, `owner`, `tenant`)
- En las validaciones: Se compara con minúsculas (`user.role !== 'admin'`)

**IMPACTO:**

- ✅ Las comparaciones en las páginas deberían funcionar (ambas son minúsculas)
- ⚠️ PERO hay inconsistencia que puede causar problemas en otros lugares del código

### Problema #2: Falta de Sincronización entre AuthProvider y DashboardLayout

**UBICACIÓN:** `src/components/auth/AuthProviderSimple.tsx` vs `src/components/layout/UnifiedDashboardLayout.tsx`

**DESCRIPCIÓN:**

- El `AuthProvider` NO hace un `checkAuth()` automático al cargar (líneas 77-134 están comentadas)
- El `UnifiedDashboardLayout` SÍ hace su propio `checkAuth()` (línea 62-97)
- Esto crea DOBLE fuente de verdad para el usuario autenticado

**CÓDIGO PROBLEMÁTICO en AuthProviderSimple.tsx:**

```typescript
// DESACTIVADO: Auth check automático que causa problemas de sesiones automáticas
// Solo verificar auth cuando sea necesario (login, registro, etc.)
// useEffect(() => {
//   checkAuth();
// }, []);
```

**IMPACTO:**

- El `useAuth()` hook devuelve `user: null` porque nunca se llama `checkAuth()`
- Las páginas que usan `useAuth()` NO tienen acceso al usuario
- Solo las páginas que usan `useDashboardUser()` tienen acceso (si están dentro del layout)

### Problema #3: Usuario no se Carga desde localStorage

**UBICACIÓN:** `src/components/auth/AuthProviderSimple.tsx`

**DESCRIPCIÓN:**

- En el login (línea 183-185) se GUARDA el usuario en localStorage
- Pero en el AuthProvider NO se CARGA desde localStorage al iniciar

**CÓDIGO:**

```typescript
// EN LOGIN - Se guarda
if (typeof window !== 'undefined') {
  localStorage.setItem('user', JSON.stringify(completeUserData));
}

// EN AUTHPROVIDER - NO se carga al iniciar
// El useEffect que haría checkAuth está desactivado
```

**IMPACTO:**

- Al recargar la página, el AuthProvider pierde el usuario
- Las páginas dependen solo de las cookies JWT
- Si las cookies fallan o expiran, no hay fallback a localStorage

### Problema #4: Middleware.ts Completamente Deshabilitado

**UBICACIÓN:** `middleware.ts` (raíz del proyecto)

**DESCRIPCIÓN:**
El middleware NO hace ninguna validación de autenticación:

```typescript
export default function middleware() {
  return NextResponse.next(); // ← Solo pasa sin hacer nada
}
```

**IMPACTO:**

- No hay protección de rutas a nivel de middleware
- Todas las validaciones dependen del lado del cliente
- Vulnerabilidad de seguridad potencial

### Problema #5: RoleGuard No Bloquea el Renderizado

**UBICACIÓN:** `src/components/auth/RoleGuard.tsx`

**DESCRIPCIÓN:**
El componente `RoleGuard` SIEMPRE renderiza los children:

```typescript
// Línea 58-59
// Siempre renderizar children - el manejo de permisos se hace en el componente padre
return <>{children}</>;
```

**IMPACTO:**

- El RoleGuard NO protege realmente nada
- Es solo un componente decorativo sin funcionalidad real
- Las páginas deben manejar su propia protección

---

## 🎯 CAUSA RAÍZ DEL PROBLEMA

### Causa Principal

**El usuario NO se está cargando correctamente en el contexto de autenticación porque:**

1. **AuthProvider NO inicializa el usuario automáticamente** (useEffect desactivado)
2. **Las páginas de admin usan `useDashboardUser()`**, que depende del `UnifiedDashboardLayout`
3. **UnifiedDashboardLayout hace su propio fetch a `/api/auth/me`**
4. **Si ese fetch falla o tarda, el usuario es `null`**

### Síntomas Observados

Cuando el usuario ve "Acceso Denegado":

1. El usuario inició sesión correctamente ✅
2. Las cookies JWT se establecieron ✅
3. Pero al navegar a una página de admin:
   - El `UnifiedDashboardLayout` hace fetch a `/api/auth/me`
   - Si ese fetch falla por cualquier razón (red, timeout, cookie expirada):
     - `user` se establece como `null`
     - La página detecta `user === null`
     - Muestra "Acceso Denegado"

---

## 💡 SOLUCIÓN PROPUESTA

### Solución Integral (Recomendada)

#### 1. Activar AuthProvider para Carga Automática del Usuario

**Modificar:** `src/components/auth/AuthProviderSimple.tsx`

- ✅ Activar el useEffect para hacer checkAuth automático
- ✅ Cargar usuario desde localStorage como fallback
- ✅ Sincronizar con el token JWT

#### 2. Unificar la Fuente de Verdad del Usuario

**Modificar:** `src/components/layout/UnifiedDashboardLayout.tsx`

- ✅ Usar `useAuth()` en lugar de hacer su propio fetch
- ✅ Eliminar duplicación de lógica de autenticación

#### 3. Normalizar el Formato de Roles

**Modificar:** `src/app/api/auth/login/route.ts` y otros archivos relacionados

- ✅ Decidir un formato estándar (minúsculas o MAYÚSCULAS)
- ✅ Aplicarlo consistentemente en todo el sistema
- ✅ Actualizar todas las comparaciones

#### 4. Implementar Middleware de Protección de Rutas

**Modificar:** `middleware.ts`

- ✅ Activar validación de autenticación
- ✅ Proteger rutas `/admin/*`, `/owner/*`, etc.
- ✅ Redirigir a login si no autenticado

#### 5. Mejorar RoleGuard para Bloqueo Real

**Modificar:** `src/components/auth/RoleGuard.tsx`

- ✅ Verificar roles y bloquear renderizado si no autorizado
- ✅ Mostrar mensaje de acceso denegado
- ✅ Redirigir a página apropiada

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Fase 1: Corrección Inmediata (Crítico)

1. ✅ Activar useEffect en AuthProvider para cargar usuario automáticamente
2. ✅ Modificar UnifiedDashboardLayout para usar useAuth() en lugar de fetch propio
3. ✅ Agregar carga desde localStorage como fallback

### Fase 2: Normalización de Roles

4. ✅ Decidir formato estándar para roles (MAYÚSCULAS recomendado)
5. ✅ Actualizar login y register para NO convertir a minúsculas
6. ✅ Actualizar todas las comparaciones de roles en el código

### Fase 3: Seguridad y Protección

7. ✅ Implementar middleware de protección de rutas
8. ✅ Mejorar RoleGuard para bloqueo real
9. ✅ Agregar manejo de errores robusto

---

## 🔧 ARCHIVOS QUE NECESITAN MODIFICACIÓN

1. `src/components/auth/AuthProviderSimple.tsx` - **CRÍTICO**
2. `src/components/layout/UnifiedDashboardLayout.tsx` - **CRÍTICO**
3. `src/app/api/auth/login/route.ts` - **IMPORTANTE**
4. `src/app/api/auth/register/route.ts` - **IMPORTANTE**
5. `src/app/api/auth/refresh/route.ts` - **IMPORTANTE**
6. `middleware.ts` - **IMPORTANTE**
7. `src/components/auth/RoleGuard.tsx` - **OPCIONAL**
8. Todas las páginas de admin que verifican roles - **IMPORTANTE**

---

## 📊 RIESGOS Y CONSIDERACIONES

### Riesgos de la Implementación

- ⚠️ Cambiar formato de roles puede romper funcionalidad existente
- ⚠️ Activar AuthProvider automático puede causar loops infinitos si no se hace bien
- ⚠️ Middleware muy restrictivo puede bloquear usuarios legítimos

### Consideraciones de Seguridad

- 🔒 Nunca confiar solo en validaciones del lado del cliente
- 🔒 Siempre validar permisos en el backend (API routes)
- 🔒 Implementar rate limiting para prevenir ataques
- 🔒 Registrar intentos de acceso no autorizados

---

## 🎓 RECOMENDACIONES ADICIONALES

1. **Sistema de Permisos Granular:**
   - Implementar permisos específicos por recurso
   - No depender solo de roles

2. **Logs y Monitoreo:**
   - Registrar todos los accesos denegados
   - Alertar sobre patrones sospechosos

3. **Testing:**
   - Crear tests E2E para flujos de autenticación
   - Verificar todos los casos de edge (token expirado, sin permisos, etc.)

4. **Documentación:**
   - Documentar claramente el flujo de autenticación
   - Crear guía para desarrolladores sobre manejo de roles

---

## ✅ CONCLUSIÓN

El problema de "Acceso Denegado" NO es un problema de formato de roles, sino de **carga del usuario**.
El `AuthProvider` no está cargando el usuario automáticamente, causando que el contexto devuelva `null`.

La solución es **activar la carga automática del usuario** en el AuthProvider y **unificar la fuente de verdad**
para evitar duplicación de lógica entre AuthProvider y UnifiedDashboardLayout.

---

**Generado por:** Cursor AI Assistant  
**Fecha:** 14 de Octubre, 2025  
**Versión:** 1.0
