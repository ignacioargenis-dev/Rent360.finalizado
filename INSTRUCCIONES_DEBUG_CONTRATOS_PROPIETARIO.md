# 🔍 Instrucciones de Debug: Problema de Visualización de Contratos del Propietario

## 🎯 Situación Actual

**Síntoma:** El dashboard de contratos del propietario muestra "No hay contratos registrados" a pesar de que:

- ✅ El filtro está en "Todos los Estados"
- ✅ Los contratos existen en la base de datos
- ✅ El endpoint `/api/owner/contracts` debería devolverlos
- ❌ Al hacer clic en "Actualizar" redirige al login (sesión expirada)

---

## 📝 Cambios Implementados

Agregué **logs detallados** en la página de contratos del propietario que te dirán exactamente qué está fallando.

Los logs mostrarán:

- ✅ Si el usuario está autenticado correctamente
- ✅ La URL exacta de la petición
- ✅ El status HTTP de la respuesta
- ✅ Los datos recibidos del endpoint
- ❌ Detalles completos de cualquier error

---

## 🧪 Cómo Realizar el Debug

### Paso 1: Redeploy en DigitalOcean

1. Ve a tu dashboard de DigitalOcean
2. Selecciona tu aplicación Rent360
3. Haz clic en **"Create Deployment"** o **"Deploy"**
4. Espera 5-10 minutos a que termine el redeploy

### Paso 2: Abrir la Consola del Navegador

1. Ingresa como propietario (`ignacio.antonio.b@hotmail.com`)
2. **Abre DevTools** (F12 o clic derecho → Inspeccionar)
3. Ve a la pestaña **"Console"**
4. **Limpia la consola** (ícono de 🚫 o Ctrl+L)
5. Ve a `/owner/contracts` en la aplicación

### Paso 3: Revisar los Logs

Busca mensajes que empiecen con `[Owner Contracts]`:

#### Si todo funciona correctamente, verás:

```
🔍 [Owner Contracts] Iniciando carga de contratos...
🔍 [Owner Contracts] Usuario actual: {id: "...", email: "...", role: "OWNER"}
🔍 [Owner Contracts] URL de petición: /api/owner/contracts
🔍 [Owner Contracts] Respuesta recibida: {status: 200, statusText: "OK", ok: true}
✅ [Owner Contracts] Datos recibidos: {totalContracts: 1, contractsLength: 1, contracts: [...]}
```

#### Si hay error de autenticación (401/403):

```
🔍 [Owner Contracts] Iniciando carga de contratos...
🔍 [Owner Contracts] Usuario actual: {id: "...", email: "...", role: "OWNER"}
🔍 [Owner Contracts] URL de petición: /api/owner/contracts
🔍 [Owner Contracts] Respuesta recibida: {status: 401, statusText: "Unauthorized", ok: false}
❌ [Owner Contracts] Error en la petición: {status: 401, error: "..."}
❌ [Owner Contracts] Sesión inválida o expirada
```

Y verás un **alert** diciendo: "Tu sesión ha expirado. Serás redirigido al login."

#### Si hay otro tipo de error:

```
❌ [Owner Contracts] Error en la petición: {status: XXX, statusText: "...", error: "..."}
```

O:

```
❌ [Owner Contracts] Error de red o excepción: Error: ...
```

---

## 📊 Posibles Causas y Soluciones

### Causa 1: Sesión Expirada (MÁS PROBABLE)

**Síntoma:** Status 401 o 403, redirige al login

**Solución:**

1. Cierra sesión completamente
2. Vuelve a iniciar sesión
3. Intenta nuevamente

**Verificación adicional:**

- Abre DevTools → Application → Cookies
- Busca la cookie `auth-token`
- Si no existe o está expirada, la sesión no es válida

---

### Causa 2: Problema en el Endpoint

**Síntoma:** Status 500 o error en el servidor

**Solución:**

1. Revisar los **runtime logs** de DigitalOcean
2. Buscar errores relacionados con `/api/owner/contracts`
3. Compartir los logs para análisis más profundo

---

### Causa 3: Problema de Red

**Síntoma:** Error de tipo "Failed to fetch" o timeout

**Solución:**

1. Verificar conexión a internet
2. Revisar si DigitalOcean está funcionando (status page)
3. Intentar desde otro navegador o red

---

### Causa 4: Usuario No es Propietario

**Síntoma:** Status 403 (Forbidden)

**Solución:**

1. Verificar que el rol del usuario sea `OWNER`
2. En la consola, buscar el log: `🔍 [Owner Contracts] Usuario actual:`
3. Verificar que `role: "OWNER"`

---

## 🔍 Información a Compartir

Si después de revisar los logs el problema persiste, comparte:

### 1. Logs de la Consola del Navegador

Copia TODOS los mensajes que aparecen, especialmente los que empiezan con:

- `[Owner Contracts]`
- Cualquier mensaje de error en rojo

### 2. Network Tab

1. Ve a la pestaña **"Network"** en DevTools
2. Filtra por "owner/contracts"
3. Haz clic en la petición
4. Copia:
   - **Status Code**
   - **Response Headers**
   - **Response Body** (pestaña "Response")
   - **Request Headers** (pestaña "Headers")

### 3. Runtime Logs de DigitalOcean

1. Ve a tu app en DigitalOcean
2. Ve a la pestaña "Runtime Logs"
3. Busca logs relacionados con:
   - `/api/owner/contracts`
   - Errores de autenticación
   - Errores de base de datos

---

## 📋 Checklist de Verificación

Antes de compartir información, verifica:

- [ ] El redeploy se completó exitosamente
- [ ] Abriste la consola del navegador (F12 → Console)
- [ ] Limpiaste la consola antes de cargar la página
- [ ] Capturaste TODOS los logs de `[Owner Contracts]`
- [ ] Verificaste si hay cookie `auth-token` en Application → Cookies
- [ ] Probaste cerrar sesión y volver a iniciar sesión
- [ ] Verificaste el Network tab para ver la respuesta del endpoint

---

## 🎯 Diagnóstico Rápido

### Test 1: Verificar Autenticación

```javascript
// Pegar en la consola del navegador:
fetch('/api/auth/me', {
  credentials: 'include',
})
  .then(r => r.json())
  .then(console.log);
```

**Resultado esperado:**

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "ignacio.antonio.b@hotmail.com",
    "role": "OWNER"
  }
}
```

Si devuelve error, la sesión no es válida.

---

### Test 2: Verificar Endpoint de Contratos

```javascript
// Pegar en la consola del navegador:
fetch('/api/owner/contracts', {
  credentials: 'include',
})
  .then(r => r.json())
  .then(console.log);
```

**Resultado esperado:**

```json
{
  "contracts": [...],
  "total": 1
}
```

---

## 🚀 Próximos Pasos

1. **Redeploy** la aplicación en DigitalOcean
2. **Abre la consola** del navegador (F12)
3. **Carga** la página `/owner/contracts`
4. **Copia** todos los logs que aparecen
5. **Comparte** los logs para diagnóstico final

---

## 📞 Soporte

Si necesitas ayuda adicional, comparte:

1. ✅ Screenshot de la consola del navegador con los logs
2. ✅ Screenshot de Network tab mostrando la petición a `/api/owner/contracts`
3. ✅ Runtime logs de DigitalOcean (si hay errores)

**¡Con esta información podremos identificar el problema exacto!** 🎯
