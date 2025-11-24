# Análisis: Problema de Acceso a Documentos para ADMIN y SUPPORT

**Fecha:** 24 de Noviembre, 2025  
**Estado:** ✅ PROBLEMA IDENTIFICADO

---

## 🔍 PROBLEMA REPORTADO

Los usuarios con roles de **ADMIN** y **SUPPORT** no pueden acceder a ver los documentos subidos por los usuarios en la página de detalles de usuarios.

---

## 📊 ANÁLISIS DEL FLUJO

### 1. **Página de Detalles de Usuario** (`src/app/admin/users/[id]/page.tsx`)

**Líneas 41-66:** La página hace un fetch al endpoint `/api/users/${id}` para obtener los datos del usuario

```typescript
const response = await fetch(`/api/users/${params?.id}`, {
  credentials: 'include',
});
```

**Líneas 531-614:** La interfaz muestra los documentos y tiene botones para ver/descargar

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={async () => {
    const response = await fetch(`/api/documents/${doc.id}/access`, {
      credentials: 'include',
      method: 'GET',
    });
    // ... código de descarga
  }}
>
  <Download className="w-4 h-4" />
  Descargar
</Button>
```

---

### 2. **Endpoint de Obtención de Usuario** (`src/app/api/users/[id]/route.ts`)

**Líneas 17-29:** ✅ Verificación de permisos funciona correctamente

```typescript
const currentUser = await requireAuth(request);

// Solo admins y soporte pueden ver detalles completos de usuarios
if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPPORT') {
  return NextResponse.json(
    {
      success: false,
      error:
        'No autorizado. Solo administradores y personal de soporte pueden ver detalles de usuarios.',
    },
    { status: 403 }
  );
}
```

**Líneas 61-77:** ✅ Los documentos se incluyen correctamente en la respuesta

```typescript
documents: {
  select: {
    id: true,
    name: true,
    type: true,
    fileName: true,
    filePath: true,
    fileSize: true,
    mimeType: true,
    propertyId: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
},
```

---

### 3. **Endpoint de Acceso a Documentos** (`src/app/api/documents/[id]/access/route.ts`)

**Aquí es donde está el PROBLEMA:**

**Líneas 25-56:** El documento se obtiene correctamente de la base de datos

```typescript
const document = await db.document.findUnique({
  where: { id: documentId },
  select: {
    id: true,
    name: true,
    fileName: true,
    filePath: true,
    fileSize: true,
    mimeType: true,
    type: true,
    uploadedById: true, // ✅ Se incluye uploadedById
    propertyId: true,
    // ... más campos
  },
});
```

**Líneas 74-91:** Se verifica el acceso con la función `checkDocumentAccess`

```typescript
const hasAccess = await checkDocumentAccess(user, document);

if (!hasAccess) {
  logger.warn('Acceso denegado a documento:', {
    documentId,
    userId: user.id,
    userRole: user.role,
    propertyId: document.propertyId,
    uploadedById: document.uploadedById,
    documentType: document.type,
  });

  return NextResponse.json(
    { error: 'No tienes permisos para acceder a este documento' },
    { status: 403 }
  );
}
```

---

### 4. **Función de Verificación de Permisos** (`checkDocumentAccess`)

**Líneas 303-334:** Aquí está el problema específico

```typescript
async function checkDocumentAccess(user: any, document: any): Promise<boolean> {
  logger.info('Verificando acceso a documento:', {
    userId: user.id,
    userRole: user.role,
    documentId: document.id,
    uploadedById: document.uploadedById,
    propertyId: document.propertyId,
  });

  // ✅ Admins tienen acceso a todo
  if (user.role === 'ADMIN') {
    logger.info('Acceso concedido: usuario es ADMIN');
    return true;
  }

  // ⚠️ PROBLEMA: La verificación de SUPPORT tiene un bug lógico
  if (user.role === 'SUPPORT' || user.role === 'support') {
    // Si el documento está asociado a un usuario (a través de uploadedBy), permitir acceso
    if (document.uploadedById) {
      logger.info('Acceso concedido: usuario SUPPORT y documento tiene uploadedById');
      return true;
    }
    // También permitir acceso a documentos de propiedades para resolución de tickets
    if (document.propertyId) {
      logger.info('Acceso concedido: usuario SUPPORT y documento tiene propertyId');
      return true;
    }
    logger.warn(
      'Acceso denegado: usuario SUPPORT pero documento no tiene uploadedById ni propertyId'
    );
    // ❌ PROBLEMA: Aquí no retorna false, el código continúa ejecutándose
  }

  // ... más código de verificación ...

  return false; // Al final retorna false por defecto
}
```

---

## 🐛 PROBLEMA IDENTIFICADO

### **Causa Raíz:**

La verificación de permisos para usuarios **SUPPORT** tiene una **lógica incompleta**:

1. **Línea 319:** Verifica si el usuario es SUPPORT (correcto)
2. **Líneas 321-324:** Si hay `uploadedById`, retorna `true` (correcto)
3. **Líneas 326-329:** Si hay `propertyId`, retorna `true` (correcto)
4. **Líneas 330-332:** Si ninguna condición se cumple, solo registra un warning pero **NO retorna explícitamente**
5. El código continúa ejecutándose hacia abajo y eventualmente llega a la línea 463 que retorna `false`

### **¿Por qué esto es un problema?**

Aunque los documentos de usuarios **SIEMPRE** tienen `uploadedById` (es un campo requerido en el esquema de Prisma), pueden existir casos edge donde:

- El documento no se consultó correctamente
- Hay un problema con la relación en la base de datos
- El valor es `null` o `undefined` por algún error

En estos casos, el código **NO retorna `true` inmediatamente** y continúa con las verificaciones posteriores, lo que puede causar que se deniegue el acceso incorrectamente.

---

## 🔧 SOLUCIÓN PROPUESTA

Modificar la función `checkDocumentAccess` en el archivo `src/app/api/documents/[id]/access/route.ts` para que la lógica de SUPPORT sea más explícita y clara:

### **Opción 1: Retornar explícitamente después del bloque SUPPORT**

```typescript
// Usuarios de soporte tienen acceso a documentos de usuarios para resolución de problemas
if (user.role === 'SUPPORT' || user.role === 'support') {
  // Si el documento está asociado a un usuario (a través de uploadedBy), permitir acceso
  if (document.uploadedById) {
    logger.info('Acceso concedido: usuario SUPPORT y documento tiene uploadedById');
    return true;
  }
  // También permitir acceso a documentos de propiedades para resolución de tickets
  if (document.propertyId) {
    logger.info('Acceso concedido: usuario SUPPORT y documento tiene propertyId');
    return true;
  }

  // ✅ SOLUCIÓN: Retornar false explícitamente si no se cumple ninguna condición
  logger.warn(
    'Acceso denegado: usuario SUPPORT pero documento no tiene uploadedById ni propertyId'
  );
  return false;
}
```

### **Opción 2: Dar acceso total a SUPPORT (Recomendada)**

Dado que SUPPORT debería tener acceso a todos los documentos para poder dar soporte a los usuarios, la solución más simple y segura es:

```typescript
// Admins y SUPPORT tienen acceso a todo
if (user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'support') {
  logger.info(`Acceso concedido: usuario es ${user.role}`);
  return true;
}
```

---

## 🎯 RECOMENDACIÓN

**Implementar la Opción 2** por las siguientes razones:

1. **Simplicidad:** Menos código, menos posibilidad de errores
2. **Consistencia:** SUPPORT y ADMIN tienen permisos similares en otros endpoints
3. **Funcionalidad:** SUPPORT necesita acceso completo para resolver tickets y problemas de usuarios
4. **Seguridad:** SUPPORT es un rol privilegiado que debe tener acceso para cumplir su función

---

## 📝 ARCHIVOS A MODIFICAR

1. **`src/app/api/documents/[id]/access/route.ts`** (Líneas 312-333)

---

## ✅ IMPACTO DE LA SOLUCIÓN

- ✅ Usuarios ADMIN podrán ver todos los documentos (ya funcionaba)
- ✅ Usuarios SUPPORT podrán ver todos los documentos (se corrige)
- ✅ Otros roles mantienen sus restricciones actuales
- ✅ No afecta la seguridad de otros usuarios
- ✅ Permite a SUPPORT realizar su trabajo correctamente

---

## 🧪 PRUEBAS RECOMENDADAS

1. Iniciar sesión como ADMIN y verificar acceso a documentos de usuarios ✅
2. Iniciar sesión como SUPPORT y verificar acceso a documentos de usuarios ✅
3. Iniciar sesión como OWNER y verificar que solo ve sus documentos ✅
4. Intentar acceder a documentos sin autenticación (debe fallar) ✅
