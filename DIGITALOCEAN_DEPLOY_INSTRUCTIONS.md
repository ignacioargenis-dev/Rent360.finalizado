# 🚨 Instrucciones URGENTES para Resolver Dashboard Crash

## ❌ Problema Identificado

Tus runtime logs muestran que **DigitalOcean está ejecutando código ANTIGUO** con rate limiting excesivo que bloquea todas las llamadas API.

### Evidencia del Problema:

- **Miles de requests bloqueadas**: `Rate limit exceeded` para `/api/properties/list`
- **Timestamp de logs**: `Oct 16 12:32-12:33`
- **Último commit con fixes**: `ac863fb` (ya pusheado a GitHub)
- **Conclusión**: DigitalOcean NO ha actualizado el código

## ✅ Solución INMEDIATA

### Paso 1: Redeploy en DigitalOcean

#### Opción A: Desde el Dashboard de DigitalOcean (MÁS FÁCIL)

1. Ve a [DigitalOcean Apps Dashboard](https://cloud.digitalocean.com/apps)
2. Selecciona tu app `Rent360`
3. Click en **"Settings"** (en el menú lateral)
4. Scroll hasta **"App-Level"**
5. Click en **"Force Rebuild and Deploy"** o **"Redeploy"**
6. Espera 5-10 minutos a que termine el build

#### Opción B: Desde la línea de comandos (SI TIENES ACCESO SSH)

```bash
# Si tienes acceso SSH al servidor
cd /app
git pull origin master
npm ci
npm run build
pm2 restart all  # o el comando que uses
```

### Paso 2: Verificar que el Deploy Funcionó

Después del redeploy, verifica:

1. **Check Runtime Logs** en DigitalOcean:
   - Deberías ver **MENOS** mensajes de "Rate limit exceeded"
   - Las APIs deberían responder correctamente

2. **Prueba el Dashboard**:
   - Inicia sesión en https://rent360management-2yxgz.ondigitalocean.app
   - El dashboard debería cargar SIN crashearse
   - Verifica que las propiedades se muestran

## 📋 Qué se Corrigió en el Último Commit

### Commit: `ac863fb`

#### 1. Rate Limiting Aumentado

```javascript
// ANTES: 1000 requests/minuto
MAX_REQUESTS_PER_MINUTE: 1000;

// AHORA: 5000 requests/minuto
MAX_REQUESTS_PER_MINUTE: 5000;
```

#### 2. Headers Corregidos

- Agregado `Accept: application/json` a TODAS las llamadas fetch
- Esto resuelve el warning: "Client does not accept JSON responses"

#### 3. URLs Corregidas

- URLs ahora usan rutas relativas con fallback inteligente
- Ya no apuntan a `localhost:3000` en producción

## 🔍 Cómo Verificar que el Problema Está Resuelto

### Logs Correctos (DESPUÉS del redeploy):

```
✅ Ya NO deberías ver miles de:
   "Rate limit exceeded"

✅ DEBERÍAS ver:
   "API response successful"
   "Properties loaded: X"
   "User authenticated successfully"
```

### Dashboard Funcional:

- ✅ Login exitoso SIN refresh manual
- ✅ Dashboard carga en 2-3 segundos
- ✅ Propiedades se muestran correctamente
- ✅ No más crashes al navegar

## ⚠️ Si AÚN No Funciona Después del Redeploy

Si después de hacer el redeploy el problema persiste:

1. **Verifica que DigitalOcean está usando la rama correcta**:
   - Ve a Settings → Source
   - Debe estar en `master` branch

2. **Revisa las Variables de Entorno**:
   - `DATABASE_URL` debe estar configurada
   - `JWT_SECRET` debe existir
   - `NEXT_PUBLIC_API_URL` debe estar vacía o apuntar a tu dominio

3. **Contacta al soporte** y envíame:
   - Nuevos runtime logs (DESPUÉS del redeploy)
   - Screenshot del error
   - Mensaje de error específico

## 📞 Soporte

Si necesitas ayuda adicional, proporciona:

- Timestamp de los nuevos logs
- Screenshot del dashboard
- Resultado del redeploy en DigitalOcean

---

**Última actualización**: Oct 16, 2025
**Commit con fixes**: `ac863fb`
**Estado**: ⏳ Esperando redeploy en DigitalOcean
