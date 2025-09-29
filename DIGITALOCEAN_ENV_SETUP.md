# 🚀 Configuración de Variables de Entorno en DigitalOcean

## Variables de Entorno Requeridas

Para que la aplicación funcione correctamente en producción, necesitas configurar las siguientes variables de entorno en tu App de DigitalOcean:

### Base de Datos
```bash
DATABASE_URL="postgresql://rent360_user:your_secure_password@your-db-host:5432/rent360_prod"
```

### Autenticación JWT
```bash
JWT_SECRET="your-unique-jwt-secret-key-minimum-32-characters-long-for-security"
JWT_REFRESH_SECRET="your-unique-jwt-refresh-secret-key-minimum-32-characters-long-for-security"
NEXTAUTH_SECRET="your-unique-nextauth-secret-key-for-security"
```

### Configuración de Entorno
```bash
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
PORT="3000"
```

## 🔧 Pasos para Configurar en DigitalOcean

### 1. Acceder al Panel de Control
1. Ve a https://cloud.digitalocean.com/
2. Selecciona tu App de Rent360
3. Ve a la sección "Environment Variables"

### 2. Configurar Variables
Agrega las siguientes variables de entorno:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `${rent360-db.DATABASE_URL}` | URL de conexión a PostgreSQL |
| `JWT_SECRET` | `<genera-un-secreto-único>` | Clave para tokens JWT |
| `JWT_REFRESH_SECRET` | `<genera-un-secreto-diferente>` | Clave para refresh tokens |
| `NEXTAUTH_SECRET` | `<genera-un-secreto-nextauth>` | Clave para NextAuth |
| `NODE_ENV` | `production` | Entorno de producción |
| `NEXT_TELEMETRY_DISABLED` | `1` | Deshabilitar telemetría |

### 3. Generar Secrets Seguros

**⚠️ IMPORTANTE:** Los secrets en `app.yaml` son solo para testing inicial. Para producción, genera tus propios secrets únicos.

Para generar secrets seguros:

```bash
# Opción 1: OpenSSL (Linux/Mac)
openssl rand -hex 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Reemplazar Secrets en app.yaml

**ANTES del deploy final**, edita `app.yaml` y reemplaza estos valores de ejemplo con tus propios secrets:

```yaml
- key: JWT_SECRET
  value: "a8f5c2e4b7d9e1f3c6a5b8d2e7f9c4a1b3e6d8f2c5a7e9b4d1f3c6a8e2b5d7"
- key: JWT_REFRESH_SECRET
  value: "f2c8e5a1d4b7f9c3e6a2d5b8f1c4e7a9d2b5c8f3e1a4d7b9c2e5f8a3d6b1c4"
- key: NEXTAUTH_SECRET
  value: "b9e3f7c2a5d8b1e4c7f2a9d5b8e1c4f7a2d5b8e3f6c1a4d7b2e5c8f3a6d9b4"
```

**Reemplázalos con valores únicos que generes tú mismo.**

### 5. Configurar Base de Datos
La base de datos PostgreSQL ya está configurada en tu App. Usa la variable:
```
DATABASE_URL="${rent360-db.DATABASE_URL}"
```

### 5. Redeploy
Después de configurar las variables:
1. Guarda los cambios
2. DigitalOcean automáticamente hará un redeploy
3. Verifica que la aplicación inicie correctamente

## 🔍 Verificación

### Health Check
La aplicación incluye un endpoint de health check:
```
GET /api/health
```

### Logs
Revisa los logs de la aplicación en DigitalOcean para ver si hay errores de configuración.

### Variables de Entorno en Logs
Si ves errores como "JWT_SECRET es obligatorio", significa que las variables no se configuraron correctamente.

## ⚠️ Notas Importantes

1. **Secrets únicos**: Cada secret debe ser único y tener al menos 32 caracteres
2. **No compartir**: Nunca compartas estos secrets en código o repositorios públicos
3. **Cambiar en producción**: Usa secrets diferentes para producción que para desarrollo
4. **Backup**: Guarda estos valores en un lugar seguro

## 🚨 Solución de Problemas

### Error 500 en APIs
Si ves errores 500 en `/api/properties`, `/api/payments`, etc.:
1. Verifica que `DATABASE_URL` esté configurada correctamente
2. Asegúrate de que la base de datos PostgreSQL esté accesible
3. Revisa los logs para errores de conexión

### Error de Autenticación
Si ves errores 401 en `/api/auth/me`:
1. Verifica que los JWT secrets estén configurados
2. Asegúrate de que los secrets tengan al menos 32 caracteres

### Problemas de CSS/Estilos
Si los estilos no se cargan:
1. Verifica que el build se completó exitosamente
2. Asegúrate de que `_next/static/` archivos se estén sirviendo correctamente
