# 🚀 Instrucciones para Deploy de la Solución de Documentos

**Fecha:** 24 de Noviembre, 2025  
**Prioridad:** 🔴 CRÍTICA

---

## 📋 SITUACIÓN ACTUAL

Has reportado que el documento no se puede acceder. El error muestra:

```
Archivo: 1764012481620_98k284y6psj.pdf
Path: /workspace/public/uploads/documents/1764012481620_98k284y6psj.pdf
Estado: ❌ NO ENCONTRADO
```

Este es un **documento antiguo** que se perdió porque:

1. Se guardó localmente en almacenamiento efímero
2. Se borró con un restart del contenedor
3. Fue subido **ANTES** de la solución que implementé

---

## ✅ SOLUCIÓN EN 3 PASOS

### **PASO 1: Hacer Deploy de los Cambios** 🚀

Los archivos modificados están listos en tu repositorio local. Necesitas hacer deploy a DigitalOcean:

#### **Opción A: Deploy Automático (DigitalOcean)**

Si tienes auto-deploy configurado en DigitalOcean:

```bash
# 1. Hacer commit de los cambios
git add .
git commit -m "fix: Implementar cloud storage para documentos de usuarios"

# 2. Push a la rama principal
git push origin main
```

DigitalOcean detectará el push y hará deploy automáticamente.

#### **Opción B: Deploy Manual**

Si prefieres hacer deploy manual:

```bash
# 1. Verificar archivos modificados
git status

# 2. Commit
git add src/app/api/documents/upload/route.ts
git add src/app/api/documents/[id]/access/route.ts
git add ANALISIS_EXHAUSTIVO_DOCUMENTOS_PERDIDOS.md
git add SOLUCION_IMPLEMENTADA_DOCUMENTOS.md
git commit -m "fix: Implementar cloud storage para documentos de usuarios

- Migrado subida de documentos a DigitalOcean Spaces en producción
- Implementado fallback inteligente para buscar en cloud storage
- Corregidos permisos SUPPORT para acceso a documentos
- Documentos ahora persisten después de restarts/deploys"

# 3. Push
git push origin main
```

#### **Verificar Deploy en DigitalOcean:**

1. Ve a tu App en DigitalOcean Dashboard
2. Verifica que el deploy se está ejecutando
3. Espera a que el deploy termine (status: "Active")
4. Verifica los logs para confirmar que no hay errores

---

### **PASO 2: Verificar Variables de Entorno** ⚙️

Asegúrate de que estas variables están configuradas en DigitalOcean:

```bash
# REQUERIDAS para cloud storage
DO_SPACES_ACCESS_KEY=tu_access_key
DO_SPACES_SECRET_KEY=tu_secret_key
DO_SPACES_BUCKET=tu_bucket_name
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Indicadores de producción
DIGITALOCEAN_APP_ID=(se configura automáticamente)
NODE_ENV=production
```

#### **Cómo verificar/agregar variables en DigitalOcean:**

1. Ve a tu App en DigitalOcean Dashboard
2. Click en "Settings" → "App-Level Environment Variables"
3. Verifica que todas las variables DO_SPACES están configuradas
4. Si faltan, agrégalas y redeploy

---

### **PASO 3: Re-subir el Documento** 📄

Una vez que el deploy esté completado:

1. ✅ **Inicia sesión** como ADMIN o SUPPORT
2. ✅ **Ve al perfil del usuario** donde intentaste subir el documento
3. ✅ **Sube el documento nuevamente**
4. ✅ **Verifica** que ahora puedes descargarlo

**Importante:** El documento anterior (`1764012481620_98k284y6psj.pdf`) ya se perdió y no se puede recuperar. Necesitas subir el archivo de nuevo.

---

## 🧪 VERIFICACIÓN POST-DEPLOY

Después de hacer deploy, ejecuta este script para verificar que todo funciona:

```bash
node verify-document-system.js
```

Este script verificará:

- ✅ Variables de entorno configuradas
- ✅ Conexión a cloud storage
- ✅ Estado de documentos en la base de datos
- ✅ Tipo de almacenamiento usado

---

## 📊 EXPECTATIVAS DESPUÉS DEL DEPLOY

### **Documentos Nuevos (después del deploy):**

```
✅ Se subirán a DigitalOcean Spaces
✅ Tendrán URL: https://bucket.digitaloceanspaces.com/documents/...
✅ Persistirán después de restarts
✅ Estarán accesibles siempre
```

### **Documentos Antiguos (antes del deploy):**

```
❌ Están perdidos (almacenamiento efímero)
❌ No se pueden recuperar
⚠️  Usuarios deben re-subirlos
```

---

## 📝 LOGS QUE DEBERÍAS VER DESPUÉS DEL DEPLOY

### **Al subir un documento:**

```
[INFO] Producción detectada: usando cloud storage
[INFO] Archivo subido exitosamente a cloud storage:
  cloudKey: documents/1234567890_abc123.pdf
  url: https://your-bucket.nyc3.digitaloceanspaces.com/documents/1234567890_abc123.pdf
[INFO] Documento creado exitosamente:
  documentId: xxx
  filePath: https://your-bucket.nyc3.digitaloceanspaces.com/documents/1234567890_abc123.pdf
```

### **Al descargar un documento:**

```
[INFO] Documento está en cloud storage, redirigiendo:
  documentId: xxx
  filePath: https://your-bucket.nyc3.digitaloceanspaces.com/documents/1234567890_abc123.pdf
```

### **Si encuentras documentos antiguos:**

```
[INFO] Archivo no existe localmente, intentando cloud storage como fallback:
  originalFilePath: /uploads/documents/old_file.pdf
[INFO] Verificando existencia en cloud storage:
  key: documents/old_file.pdf
[WARN] Archivo no existe ni localmente ni en cloud storage
```

---

## ⚠️ PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: Sigue usando almacenamiento local**

**Síntoma:** Los logs dicen "Desarrollo o cloud storage no disponible: usando almacenamiento local"

**Causa:** Variables de entorno no configuradas

**Solución:**

1. Verifica que DO_SPACES_ACCESS_KEY y DO_SPACES_SECRET_KEY están configuradas
2. Verifica que DIGITALOCEAN_APP_ID existe (se configura automáticamente)
3. Redeploy después de agregar las variables

---

### **Problema 2: Error al subir a cloud storage**

**Síntoma:** Error: "Error al subir archivo a cloud storage"

**Causas posibles:**

- Credenciales incorrectas
- Bucket no existe
- Región incorrecta
- Permisos insuficientes en el bucket

**Solución:**

1. Verifica las credenciales en DigitalOcean Spaces
2. Verifica que el bucket existe y es accesible
3. Verifica que el bucket tiene permisos públicos de lectura
4. Verifica la región (debe ser 'nyc3' o la región de tu bucket)

---

### **Problema 3: Documentos antiguos no se pueden acceder**

**Síntoma:** Error 404 para documentos subidos antes del deploy

**Causa:** Documentos se perdieron con restart anterior

**Solución:**

- ⚠️ **Estos documentos NO se pueden recuperar**
- Los usuarios deben re-subir sus documentos
- Considera enviar un email masivo notificando a los usuarios

---

## 📧 MENSAJE SUGERIDO PARA USUARIOS

Si tienes muchos usuarios afectados, considera enviar este mensaje:

```
Asunto: Actualización del Sistema de Documentos

Estimado usuario,

Hemos mejorado nuestro sistema de almacenamiento de documentos para mayor
seguridad y confiabilidad.

Como parte de esta mejora, algunos documentos subidos antes del 24 de noviembre
de 2025 pueden haberse perdido.

Por favor, verifica tus documentos en tu perfil y vuelve a subirlos si es necesario.

A partir de ahora, tus documentos estarán completamente seguros y no se perderán
con actualizaciones del sistema.

Disculpa las molestias y gracias por tu comprensión.

Atentamente,
Equipo de Rent360
```

---

## ✅ CHECKLIST FINAL

Marca cada paso cuando lo completes:

- [ ] 1. Commit y push de los cambios a GitHub
- [ ] 2. Deploy completado en DigitalOcean
- [ ] 3. Variables de entorno verificadas
- [ ] 4. Script verify-document-system.js ejecutado
- [ ] 5. Documento de prueba subido y descargado exitosamente
- [ ] 6. Logs verificados (debe decir "usando cloud storage")
- [ ] 7. Usuarios notificados sobre re-subida de documentos
- [ ] 8. Documentación actualizada en el sistema

---

## 🆘 SI NECESITAS AYUDA

Si encuentras problemas durante el deploy:

1. **Revisa los logs** de DigitalOcean para errores específicos
2. **Ejecuta el script** verify-document-system.js para diagnóstico
3. **Verifica las variables** de entorno en DigitalOcean Dashboard
4. **Prueba localmente** primero si es posible

---

**Archivos Modificados en este Fix:**

- ✅ `src/app/api/documents/upload/route.ts`
- ✅ `src/app/api/documents/[id]/access/route.ts`

**Archivos de Documentación Creados:**

- 📄 `ANALISIS_EXHAUSTIVO_DOCUMENTOS_PERDIDOS.md`
- 📄 `SOLUCION_IMPLEMENTADA_DOCUMENTOS.md`
- 📄 `INSTRUCCIONES_DEPLOY_DOCUMENTOS.md` (este archivo)
- 🔧 `verify-document-system.js`

---

_Última actualización: 24 de Noviembre, 2025_
