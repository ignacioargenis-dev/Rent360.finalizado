# 🔧 Fix: Error al Crear Propiedades - Debug Completo

**Fecha:** 27 de Octubre de 2025  
**Commit:** b4090032

---

## 🚨 **Problema Reportado**

### Error en Consola del Navegador:

```
/api/properties:1  Failed to load resource: net::ERR_FAILED
[2025-10-27T22:15:29.296Z] ERROR: Error creating property: Object
```

**Síntoma:** Al intentar crear una propiedad como usuario propietario, la petición falla completamente con `ERR_FAILED`.

**Impacto:** Los propietarios no pueden agregar nuevas propiedades al sistema.

---

## 🔍 **Análisis del Problema**

### Causas Potenciales del `ERR_FAILED`:

1. **Falta de `export const dynamic = 'force-dynamic'`**
   - El endpoint podría estar siendo pre-renderizado estáticamente
   - Sin autenticación en tiempo de build

2. **Error no capturado en el servidor**
   - El servidor arroja un error y la conexión se cierra abruptamente
   - No hay logs suficientes para diagnosticar

3. **Problema con autenticación/autorización**
   - El middleware o `requireAnyRole` falla sin retornar respuesta adecuada

4. **Error en el procesamiento de FormData**
   - Problema parseando archivos grandes
   - Timeout en la conexión

---

## ✅ **Soluciones Implementadas**

### 1. **Agregado `export const dynamic = 'force-dynamic'`**

```typescript
// Antes: Sin configuración
export async function POST(request: NextRequest) {
  ...
}

// Ahora: Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  ...
}
```

**Beneficio:** Garantiza que el endpoint se ejecute en tiempo de request, no en build time.

---

### 2. **Logs Exhaustivos de Debug**

He agregado logs completos con emojis para rastrear cada paso:

#### **A. Inicio y Autenticación:**

```typescript
console.log('🏠 [PROPERTIES] Iniciando POST /api/properties');

const decoded = await requireAnyRole(request, ['OWNER', 'ADMIN', 'BROKER']);

console.log('✅ [PROPERTIES] Usuario autenticado:', {
  id: decoded.id,
  email: decoded.email,
  role: decoded.role,
});
```

#### **B. Parsing de FormData:**

```typescript
console.log('📋 [PROPERTIES] Parseando FormData...');
const formData = await request.formData();
console.log('✅ [PROPERTIES] FormData parseado correctamente');
```

#### **C. Validación con Zod:**

```typescript
console.log('🔍 [PROPERTIES] Validando datos con Zod...');
console.log('📝 [PROPERTIES] Datos a validar:', {
  title,
  type,
  price,
  bedrooms,
  bathrooms,
  area,
  city,
  commune,
});

const validationResult = propertySchema.safeParse(propertyData);
if (!validationResult.success) {
  console.error('❌ [PROPERTIES] Error de validación:', errorMessages);
  return NextResponse.json({ error: errorMessages.join(', ') }, { status: 400 });
}

console.log('✅ [PROPERTIES] Validación exitosa');
```

#### **D. Creación en Base de Datos:**

```typescript
console.log('💾 [PROPERTIES] Creando propiedad en la base de datos...');
console.log('📊 [PROPERTIES] OwnerId:', ownerId, 'BrokerId:', brokerId);

const newProperty = await db.property.create({ ... });

console.log('✅ [PROPERTIES] Propiedad creada exitosamente:', {
  propertyId: newProperty.id,
  title: newProperty.title,
  status: newProperty.status,
});
```

#### **E. Errores Capturados:**

```typescript
catch (error) {
  console.error('❌ [PROPERTIES] Error crítico:', error);

  logger.error('Error creating property:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
```

---

### 3. **Mejor Error Handling**

**Antes:**

```typescript
return NextResponse.json(
  {
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
  },
  { status: 500 }
);
```

**Ahora:**

```typescript
return NextResponse.json(
  {
    success: false,
    error: 'Error interno del servidor',
    message: error instanceof Error ? error.message : String(error),
    details:
      process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
  },
  { status: 500 }
);
```

**Beneficios:**

- ✅ Siempre retorna el mensaje de error (no solo en development)
- ✅ Incluye stack trace en development para debugging
- ✅ Flag `success: false` para manejo en frontend

---

## 📊 **Flujo Completo con Logs**

Cuando un propietario intente crear una propiedad, ahora verás en la consola:

```
🏠 [PROPERTIES] Iniciando POST /api/properties
✅ [PROPERTIES] Usuario autenticado: {id: "...", email: "...", role: "OWNER"}
📋 [PROPERTIES] Parseando FormData...
✅ [PROPERTIES] FormData parseado correctamente
🔍 [PROPERTIES] Validando datos con Zod...
📝 [PROPERTIES] Datos a validar: {title: "...", type: "apartment", price: 500000, ...}
✅ [PROPERTIES] Validación exitosa
💾 [PROPERTIES] Creando propiedad en la base de datos...
📊 [PROPERTIES] OwnerId: "user-id-123" BrokerId: null
✅ [PROPERTIES] Propiedad creada exitosamente: {propertyId: "...", title: "...", status: "PENDING"}
```

**Si hay un error:**

```
🏠 [PROPERTIES] Iniciando POST /api/properties
✅ [PROPERTIES] Usuario autenticado: {id: "...", email: "...", role: "OWNER"}
📋 [PROPERTIES] Parseando FormData...
❌ [PROPERTIES] Error crítico: Error: Database connection failed
```

---

## 🧪 **Cómo Probar el Fix**

### 1. **Esperar Deploy en DigitalOcean**

### 2. **Intentar Crear una Propiedad:**

1. Ir a `/owner/properties/new`
2. Llenar el formulario
3. Click en "Crear Propiedad"

### 3. **Abrir DevTools (F12):**

1. Tab "Console"
2. Ver los logs con emojis 🏠📋✅

### 4. **Escenarios Esperados:**

#### ✅ **Caso Exitoso:**

```
🏠 [PROPERTIES] Iniciando POST /api/properties
✅ [PROPERTIES] Usuario autenticado
📋 [PROPERTIES] Parseando FormData...
✅ [PROPERTIES] FormData parseado
🔍 [PROPERTIES] Validando datos...
✅ [PROPERTIES] Validación exitosa
💾 [PROPERTIES] Creando propiedad...
✅ [PROPERTIES] Propiedad creada exitosamente
```

**Resultado:** Propiedad creada, redirección a lista de propiedades.

#### ❌ **Caso Error de Validación:**

```
🏠 [PROPERTIES] Iniciando POST /api/properties
✅ [PROPERTIES] Usuario autenticado
📋 [PROPERTIES] Parseando FormData...
✅ [PROPERTIES] FormData parseado
🔍 [PROPERTIES] Validando datos...
❌ [PROPERTIES] Error de validación: ["El título debe tener al menos 1 caracter"]
```

**Resultado:** Mensaje de error en el frontend con validación específica.

#### ❌ **Caso Error de Base de Datos:**

```
🏠 [PROPERTIES] Iniciando POST /api/properties
✅ [PROPERTIES] Usuario autenticado
📋 [PROPERTIES] Parseando FormData...
✅ [PROPERTIES] FormData parseado
🔍 [PROPERTIES] Validando datos...
✅ [PROPERTIES] Validación exitosa
💾 [PROPERTIES] Creando propiedad...
❌ [PROPERTIES] Error crítico: PrismaClientKnownRequestError: ...
```

**Resultado:** Mensaje de error con detalles para debugging.

#### ❌ **Caso Error de Autenticación:**

```
🏠 [PROPERTIES] Iniciando POST /api/properties
(No aparece log de usuario autenticado)
```

**Resultado:** Error 401 Unauthorized.

---

## 📝 **Archivos Modificados**

| Archivo                           | Cambios                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/properties/route.ts` | • `export const dynamic = 'force-dynamic'`<br>• Logs exhaustivos con emojis<br>• Error handling mejorado<br>• Stack traces en development |

---

## 🎯 **Resultado Esperado**

### Antes:

```
❌ ERR_FAILED
❌ Sin información del error
❌ Imposible debuggear
```

### Ahora:

```
✅ Logs completos con emojis
✅ Trazabilidad paso a paso
✅ Error messages específicos
✅ Stack traces en development
✅ Identificación rápida del problema
```

---

## 🔍 **Diagnóstico con los Logs**

Con los nuevos logs, podrás identificar EXACTAMENTE dónde falla:

| Log Visible      | Problema Identificado    | Acción                        |
| ---------------- | ------------------------ | ----------------------------- |
| Solo 🏠          | Error en autenticación   | Verificar sesión/token        |
| 🏠✅📋❌         | Error parseando FormData | Verificar tamaño de archivos  |
| 🏠✅📋✅🔍❌     | Error de validación      | Ver mensaje específico de Zod |
| 🏠✅📋✅🔍✅💾❌ | Error en base de datos   | Ver error de Prisma en logs   |

---

## 📌 **Resumen Ejecutivo**

✅ **`export const dynamic = 'force-dynamic'` agregado**  
✅ **Logs exhaustivos con emojis implementados**  
✅ **Error handling mejorado con detalles**  
✅ **Stack traces en development**  
✅ **Trazabilidad completa del flujo**

**Estado:** ✅ Completado y pushed a GitHub  
**Commit:** `b4090032`  
**Branch:** `master`

---

**Los logs te dirán EXACTAMENTE en qué paso falla la creación de propiedades. Una vez deployed, intenta crear una propiedad y comparte los logs de la consola para diagnóstico preciso.** 🔍
