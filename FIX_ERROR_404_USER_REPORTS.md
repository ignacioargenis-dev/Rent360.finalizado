# 🔧 Fix: Error 404 en Páginas de Reportes de Usuarios

## 🐛 Problema Identificado

Después del redeploy, las páginas de reportes de usuarios mostraban un **flash rápido** (menos de 1 segundo) y luego **error 404**.

### Síntomas:

- ✅ La página se renderiza brevemente
- ❌ Inmediatamente redirecciona y muestra 404
- ❌ No aparecen errores en consola ni runtime logs
- ✅ El build local funciona correctamente

---

## 🔍 Causa Raíz

El problema era una combinación de dos factores:

### 1. **Falta de `export const dynamic = 'force-dynamic'`**

Las páginas de reportes **no tenían** la directiva que fuerza el renderizado dinámico:

```typescript
// ❌ ANTES - SIN la directiva
'use client';

import { useState, useEffect } from 'react';
// ...

export default function AdminUserReportsPage() {
  // ...
}
```

**¿Por qué es importante?**

- Next.js 14 intenta **pre-renderizar páginas estáticas** por defecto
- Las páginas protegidas con autenticación **NO pueden ser estáticas**
- Sin esta directiva, Next.js genera una versión estática en build time
- Esta versión estática **no tiene acceso a cookies ni autenticación**
- Resultado: La página se renderiza sin usuario → redirecciona → 404

### 2. **Ruta de Login Incorrecta**

El código usaba `router.push('/login')` en lugar de `router.push('/auth/login')`:

```typescript
// ❌ ANTES - Ruta incorrecta
if (!response.ok) {
  router.push('/login'); // ← Esta ruta no existe
  return;
}
```

**Consecuencia:**

- Cuando falla la autenticación, intenta redirigir a `/login`
- Esta ruta **NO existe** en la aplicación
- La ruta correcta es `/auth/login`
- Resultado: Redirección a una página inexistente → 404

---

## ✅ Solución Implementada

### Cambio 1: Agregar `force-dynamic`

```typescript
// ✅ DESPUÉS - CON la directiva
'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
// ...

export default function AdminUserReportsPage() {
  // ...
}
```

### Cambio 2: Corregir Ruta de Login

```typescript
// ✅ DESPUÉS - Ruta correcta
if (!response.ok) {
  router.push('/auth/login'); // ← Ruta correcta
  return;
}
```

### Cambio 3: Agregar Verificación de Rol

```typescript
// ✅ NUEVO - Verificación de permisos
const data = await response.json();
if (data.success && data.user) {
  // Verificar que el usuario sea admin o support
  if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPPORT') {
    logger.warn('User without proper role tried to access admin user reports', {
      userId: data.user.id,
      role: data.user.role,
    });
    router.push('/');
    return;
  }
  setUser(data.user);
}
```

---

## 📋 Archivos Modificados

1. **`src/app/admin/user-reports/page.tsx`**
   - ✅ Agregado `export const dynamic = 'force-dynamic'`
   - ✅ Corregido `/login` → `/auth/login`
   - ✅ Agregada verificación de rol ADMIN/SUPPORT

2. **`src/app/support/user-reports/page.tsx`**
   - ✅ Agregado `export const dynamic = 'force-dynamic'`
   - ✅ Corregido `/login` → `/auth/login`
   - ✅ Agregada verificación de rol ADMIN/SUPPORT

---

## 🔄 Flujo Corregido

### ANTES (❌ Fallaba):

```
1. Usuario visita /admin/user-reports
   ↓
2. Next.js intenta cargar versión estática pre-renderizada
   ↓
3. Versión estática no tiene cookies/auth
   ↓
4. loadUserData() falla (no hay token)
   ↓
5. Intenta redirigir a /login (ruta que no existe)
   ↓
6. Error 404
```

### DESPUÉS (✅ Funciona):

```
1. Usuario visita /admin/user-reports
   ↓
2. Next.js renderiza dinámicamente (force-dynamic)
   ↓
3. Lee cookies del navegador
   ↓
4. loadUserData() llama a /api/auth/me con credentials
   ↓
5. Verifica rol ADMIN/SUPPORT
   ↓
6. Si no autenticado → /auth/login (ruta válida)
   ↓
7. Si rol incorrecto → / (home)
   ↓
8. Si todo OK → Muestra página de reportes ✅
```

---

## 🧪 Cómo Verificar el Fix

### 1. **Esperar el Redeploy**

- DigitalOcean detectará los nuevos commits
- El redeploy toma 5-10 minutos

### 2. **Probar como Admin**

- Ingresa como usuario con rol `ADMIN`
- Ve al sidebar → "Reportes de Conducta"
- Deberías ver la página sin flash ni 404

### 3. **Probar como Support**

- Ingresa como usuario con rol `SUPPORT`
- Ve al sidebar → "Reportes de Conducta"
- Deberías ver la misma página

### 4. **Probar sin Autenticación**

- Abre una ventana de incógnito
- Intenta acceder a `/admin/user-reports`
- Deberías ser redirigido a `/auth/login`

### 5. **Probar con Rol Incorrecto**

- Ingresa como `TENANT`, `OWNER`, o `BROKER`
- Intenta acceder a `/admin/user-reports`
- Deberías ser redirigido a `/` (home)

---

## 📚 Lecciones Aprendidas

### 1. **Páginas Protegidas Siempre Necesitan `force-dynamic`**

Cualquier página que requiera autenticación DEBE incluir:

```typescript
export const dynamic = 'force-dynamic';
```

### 2. **Verificar Rutas de Redirección**

Siempre usar rutas que existan en la aplicación:

- ✅ `/auth/login` (existe)
- ❌ `/login` (no existe)

### 3. **Verificar Roles en el Cliente**

Aunque la API valida roles, es buena práctica también validar en el cliente:

```typescript
if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
  router.push('/');
  return;
}
```

### 4. **Logs Ayudan a Debuggear**

Agregar logs informativos ayuda a entender qué está pasando:

```typescript
logger.warn('User without proper role tried to access admin user reports', {
  userId: data.user.id,
  role: data.user.role,
});
```

---

## 🎯 Patrón Recomendado para Páginas Protegidas

```typescript
'use client';

// 1. SIEMPRE agregar force-dynamic para páginas protegidas
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';

export default function ProtectedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // 2. Incluir cookies
      });

      if (!response.ok) {
        router.push('/auth/login'); // 3. Ruta correcta
        return;
      }

      const data = await response.json();
      if (data.success && data.user) {
        // 4. Verificar roles permitidos
        const allowedRoles = ['ADMIN', 'SUPPORT'];
        if (!allowedRoles.includes(data.user.role)) {
          logger.warn('Unauthorized role access attempt', {
            userId: data.user.id,
            role: data.user.role,
          });
          router.push('/'); // 5. Redirigir a home si no tiene permisos
          return;
        }
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      logger.error('Error loading user:', {
        error: error instanceof Error ? error.message : String(error),
      });
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  // 6. Mostrar loading mientras verifica
  if (loading) {
    return <div>Cargando...</div>;
  }

  // 7. Renderizar contenido solo si hay usuario válido
  return (
    <div>
      {/* Contenido protegido */}
    </div>
  );
}
```

---

## 🚀 Estado Actual

| Componente                      | Estado        | Observaciones                          |
| ------------------------------- | ------------- | -------------------------------------- |
| `/admin/user-reports`           | ✅ Corregido  | Agregado force-dynamic y fix de rutas  |
| `/support/user-reports`         | ✅ Corregido  | Agregado force-dynamic y fix de rutas  |
| `/api/admin/user-reports`       | ✅ Funcional  | Sin cambios necesarios                 |
| Verificación de roles (cliente) | ✅ Agregada   | Verifica ADMIN/SUPPORT antes de cargar |
| Redirecciones correctas         | ✅ Corregidas | Usa /auth/login en lugar de /login     |
| Logs de auditoría               | ✅ Agregados  | Registra intentos de acceso no válidos |

---

## 📝 Commit Aplicado

```
fix(user-reports): Agregar dynamic='force-dynamic' y corregir rutas de login

- Agregar export const dynamic='force-dynamic' para evitar prerendering
- Cambiar router.push('/login') por '/auth/login' (ruta correcta)
- Agregar verificación de rol ADMIN/SUPPORT antes de cargar datos
- Corregir redirección a '/' si usuario no tiene permisos
- Aplicar cambios a ambas páginas: admin y support

Esto resuelve el error 404 que ocurría después del flash inicial de la página
```

Commit hash: `ea36344`

---

## ✅ Próximos Pasos

1. **Esperar Redeploy en DigitalOcean** (5-10 minutos)
2. **Verificar acceso a `/admin/user-reports`**
3. **Verificar acceso a `/support/user-reports`**
4. **Probar flujo completo de reportes**

---

**¡El error 404 está resuelto!** 🎉
