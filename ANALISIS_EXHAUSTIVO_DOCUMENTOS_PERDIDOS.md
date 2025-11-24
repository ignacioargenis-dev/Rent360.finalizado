# Análisis Exhaustivo: Documentos No Encontrados en Producción

**Fecha:** 24 de Noviembre, 2025  
**Estado:** 🔴 PROBLEMA CRÍTICO IDENTIFICADO

---

## 🔍 PROBLEMA REPORTADO

Los usuarios ADMIN y SUPPORT (y probablemente todos los usuarios) no pueden ver/descargar los documentos subidos. El error indica que el archivo físico no existe en el servidor.

### Error en Consola:

```
Failed to load resource: the server responded with a status of 404 ()
Error abriendo documento: Error: Error al acceder al documento
```

### Error en Logs del Servidor:

```
[2025-11-24T19:52:03.782Z] ERROR: Archivo no encontrado en ninguna ruta: {
  documentId: 'cmidjhi1p0007a4thaj8g3tks',
  fileName: '1764012481620_98k284y6psj.pdf',
  originalFilePath: '/uploads/documents/1764012481620_98k284y6psj.pdf',
  triedPaths: [
    '/workspace/public/uploads/documents/1764012481620_98k284y6psj.pdf',
    '/workspace/public/uploads/documents/1764012481620_98k284y6psj.pdf',
    '/workspace/uploads/documents/1764012481620_98k284y6psj.pdf'
  ],
  uploadedAt: 2025-11-24T19:28:01.624Z,
  uploadedBy: 'cmhcdwohn0003ha27s3mgjgdv'
}
```

---

## 📊 ANÁLISIS DEL FLUJO COMPLETO

### 1. **Proceso de Subida de Documentos** (`src/app/api/documents/upload/route.ts`)

**Líneas 146-167: Guardado del archivo**

```typescript
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);

// Generar nombre de archivo único
const timestamp = Date.now();
const randomId = Math.random().toString(36).substring(2, 15);
const fileExtension = path.extname(file.name);
const fileName = `${timestamp}_${randomId}${fileExtension}`;

// Determinar directorio según el tipo de archivo
const uploadDir = validationType === 'images' ? 'images' : 'documents';
const filePath = path.join(process.cwd(), 'public', 'uploads', uploadDir, fileName);

// Crear directorio si no existe
const fs = await import('fs');
const dir = path.dirname(filePath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// ❌ PROBLEMA: Solo guarda localmente, NO usa cloud storage
await writeFile(filePath, buffer);
```

**Líneas 204-213: Guardado en base de datos**

```typescript
const documentData = {
  name: title || file.name,
  type: normalizedType,
  fileName: fileName,
  filePath: `/uploads/${uploadDir}/${fileName}`, // ❌ Guarda path LOCAL
  fileSize: file.size,
  mimeType: file.type,
  uploadedById: user.id,
  propertyId: propertyId || null,
};

const document = await db.document.create({
  data: documentData,
});
```

**🚨 PROBLEMA #1:** El endpoint de subida **NO usa cloud storage (DigitalOcean Spaces)**, solo guarda archivos localmente.

---

### 2. **Proceso de Acceso a Documentos** (`src/app/api/documents/[id]/access/route.ts`)

**Líneas 104-174: Lógica de acceso**

```typescript
// Si el filePath empieza con /uploads/, es un archivo local
const isLocalFile =
  document.filePath.startsWith('/uploads/') || document.filePath.startsWith('uploads/');

// ❌ PROBLEMA: Como el path es /uploads/..., lo considera LOCAL
// y NO intenta buscar en cloud storage
if (
  !isLocalFile && // ❌ Esta condición nunca se cumple para /uploads/...
  process.env.DO_SPACES_ACCESS_KEY &&
  process.env.DO_SPACES_SECRET_KEY &&
  (document.filePath.startsWith('documents/') ||
    document.filePath.startsWith('properties/') ||
    document.filePath.includes('digitaloceanspaces.com'))
) {
  // Código para buscar en cloud storage (NUNCA SE EJECUTA)
}

// Intenta buscar localmente en /workspace/public/uploads/...
// ❌ PERO el archivo NO existe porque se perdió en el restart
```

**🚨 PROBLEMA #2:** El endpoint de acceso asume que si el path empieza con `/uploads/`, es un archivo local y NO busca en cloud storage.

---

### 3. **Contexto de Producción (DigitalOcean App Platform)**

**Características del entorno:**

- **Sistema de archivos efímero:** Los archivos guardados localmente se pierden con cada deploy o restart
- **Working directory:** `/workspace`
- **Sin almacenamiento persistente:** Los archivos en `/workspace/public/uploads/` NO persisten
- **Cloud Storage disponible:** DigitalOcean Spaces está configurado y disponible

**Línea de tiempo:**

```
1. Usuario sube documento (19:28:01)
   ✅ Archivo guardado en /workspace/public/uploads/documents/1764012481620_98k284y6psj.pdf
   ✅ Registro creado en base de datos con filePath: /uploads/documents/1764012481620_98k284y6psj.pdf

2. Aplicación reinicia (por deploy, escalar, o mantenimiento)
   ❌ Archivo local se PIERDE (almacenamiento efímero)
   ✅ Registro en BD persiste

3. Usuario intenta descargar (19:52:03)
   ❌ Archivo no existe en sistema de archivos
   ❌ Error 404
```

---

## 🐛 CAUSA RAÍZ DEL PROBLEMA

### **Causa Principal:**

El sistema está configurado con **DigitalOcean Spaces** (cloud storage) pero el endpoint de subida de documentos **NO lo está usando**. En su lugar:

1. ✅ Guarda archivos localmente en `/workspace/public/uploads/`
2. ❌ Los archivos se pierden cuando el contenedor reinicia (almacenamiento efímero)
3. ❌ El endpoint de acceso no puede encontrar los archivos
4. ❌ Los usuarios no pueden descargar sus documentos

### **Causas Secundarias:**

1. **Inconsistencia entre endpoints:**
   - Otros endpoints (imágenes de propiedades) SÍ usan cloud storage
   - El endpoint de documentos de usuarios NO lo usa

2. **Lógica de fallback incompleta:**
   - El endpoint de acceso PUEDE buscar en cloud storage
   - Pero la condición `!isLocalFile` impide que se ejecute para paths locales
   - No hay fallback para buscar en cloud si el archivo local no existe

---

## 🔧 SOLUCIÓN PROPUESTA

### **Opción 1: Migrar Subida de Documentos a Cloud Storage (RECOMENDADA)**

Modificar `src/app/api/documents/upload/route.ts` para usar cloud storage en producción:

```typescript
// Detectar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production' || process.env.DIGITALOCEAN_APP_ID;

// Verificar si cloud storage está configurado
const hasCloudStorage = process.env.DO_SPACES_ACCESS_KEY && process.env.DO_SPACES_SECRET_KEY;

if (isProduction && hasCloudStorage) {
  // ✅ Usar cloud storage en producción
  const cloudStorage = getCloudStorageService();
  const key = `documents/${fileName}`;
  const result = await cloudStorage.uploadFile(buffer, key, file.type, metadata);

  documentData.filePath = result.url; // URL de cloud storage
} else {
  // ✅ Usar almacenamiento local solo en desarrollo
  await writeFile(filePath, buffer);
  documentData.filePath = `/uploads/${uploadDir}/${fileName}`;
}
```

### **Opción 2: Mejorar Fallback en Endpoint de Acceso**

Modificar `src/app/api/documents/[id]/access/route.ts` para buscar en cloud storage si el archivo local no existe:

```typescript
// Primero intentar buscar localmente
const isLocalFile =
  document.filePath.startsWith('/uploads/') || document.filePath.startsWith('uploads/');

if (isLocalFile) {
  // Construir path local
  let filePath = path.join(process.cwd(), 'public', document.filePath);

  // Si NO existe localmente y tenemos cloud storage configurado
  if (!existsSync(filePath) && hasCloudStorage) {
    // ✅ Intentar buscar en cloud storage como fallback
    const key = document.filePath.replace('/uploads/', '');
    const existsInCloud = await cloudStorage.fileExists(key);

    if (existsInCloud) {
      const buffer = await cloudStorage.downloadFile(key);
      // Retornar archivo desde cloud
    }
  }
}
```

### **Opción 3: Migrar Documentos Existentes (Complementaria)**

Crear un script para migrar documentos existentes de local a cloud storage:

```typescript
// migrate-existing-documents.ts
async function migrateDocuments() {
  const documents = await db.document.findMany({
    where: {
      filePath: {
        startsWith: '/uploads/',
      },
    },
  });

  for (const doc of documents) {
    // Verificar si existe localmente
    const localPath = path.join(process.cwd(), 'public', doc.filePath);

    if (existsSync(localPath)) {
      // Subir a cloud storage
      const buffer = await readFile(localPath);
      const key = doc.filePath.replace('/uploads/', '');
      const result = await cloudStorage.uploadFile(buffer, key, doc.mimeType);

      // Actualizar BD con nueva URL
      await db.document.update({
        where: { id: doc.id },
        data: { filePath: result.url },
      });
    }
  }
}
```

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### **Fase 1: Solución Inmediata (Fallback)**

1. ✅ Implementar Opción 2 (mejorar fallback en endpoint de acceso)
2. ✅ Permite acceder a documentos futuros sin perder los existentes

### **Fase 2: Solución a Largo Plazo (Cloud Storage)**

1. ✅ Implementar Opción 1 (migrar subida a cloud storage)
2. ✅ Nuevos documentos se guardarán correctamente en cloud
3. ✅ No se perderán más documentos en reinicio

### **Fase 3: Recuperación de Documentos (Si es posible)**

1. ⚠️ Documentos subidos anteriormente probablemente están perdidos
2. ⚠️ Notificar a usuarios que deben volver a subir documentos
3. ✅ Implementar Opción 3 si hay backup disponible

---

## ✅ IMPACTO DE LA SOLUCIÓN

### **Beneficios:**

- ✅ Documentos persisten después de restarts/deploys
- ✅ Mejor rendimiento (CDN de DigitalOcean Spaces)
- ✅ Escalabilidad (no depende del filesystem local)
- ✅ Consistencia con otros componentes del sistema (imágenes)

### **Consideraciones:**

- ⚠️ Documentos existentes probablemente están perdidos
- ⚠️ Usuarios deberán volver a subir documentos
- ✅ Documentos futuros estarán seguros

---

## 📝 ARCHIVOS A MODIFICAR

### **Prioridad ALTA (Implementar inmediatamente):**

1. ✅ `src/app/api/documents/[id]/access/route.ts` (Mejorar fallback)
2. ✅ `src/app/api/documents/upload/route.ts` (Usar cloud storage)

### **Prioridad MEDIA:**

3. ✅ Crear script de migración (si hay backups disponibles)
4. ✅ Actualizar documentación para usuarios

---

## 🧪 PRUEBAS REQUERIDAS

1. ✅ Subir nuevo documento y verificar que se guarda en cloud storage
2. ✅ Reiniciar aplicación y verificar que documento sigue accesible
3. ✅ Descargar documento y verificar integridad
4. ✅ Probar con diferentes tipos de archivo (PDF, imágenes)
5. ✅ Verificar permisos de acceso (ADMIN, SUPPORT, OWNER, etc.)
