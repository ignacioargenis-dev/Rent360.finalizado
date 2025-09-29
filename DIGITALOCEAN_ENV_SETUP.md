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

**ANTES del deploy final**, edita `app.yaml` y reemplaza estos valores placeholder con tus propios secrets:

```yaml
- key: JWT_SECRET
  value: "REPLACE_WITH_YOUR_OWN_JWT_SECRET_MIN_32_CHARS"
- key: JWT_REFRESH_SECRET
  value: "REPLACE_WITH_YOUR_OWN_JWT_REFRESH_SECRET_MIN_32_CHARS"
- key: NEXTAUTH_SECRET
  value: "REPLACE_WITH_YOUR_OWN_NEXTAUTH_SECRET_MIN_32_CHARS"
```

**⚠️ CRÍTICO:** Genera valores únicos y seguros para cada secret (mínimo 32 caracteres hexadecimales).**

### 5. Configurar Base de Datos
La base de datos PostgreSQL ya está configurada en tu App. Usa la variable:
```
DATABASE_URL="${rent360-db.DATABASE_URL}"
```

### 6. Solución de Problemas Comunes

#### Error: "URL must start with postgresql://"
**Problema:** La variable `DATABASE_URL` no se está configurando correctamente.

**Solución paso a paso:**

1. **Verificar Base de Datos:**
   - Ve a https://cloud.digitalocean.com/
   - Selecciona tu App de Rent360
   - Ve a la sección "Databases"
   - Verifica que tengas una base de datos PostgreSQL llamada "rent360-db"

2. **Verificar Variables de Entorno:**
   - En tu App, ve a "Environment Variables"
   - Busca la variable `DATABASE_URL`
   - Debería mostrar: `${rent360-db.DATABASE_URL}`

3. **Obtener Información de la Base de Datos:**
   - Ve a https://cloud.digitalocean.com/
   - Selecciona "Databases" en el menú lateral
   - Selecciona tu base de datos "rent360-db"
   - Ve a la pestaña "Connection Details"
   - Copia la información:
     - Host/Endpoint
     - Port (generalmente 25060 para DigitalOcean)
     - Database name
     - Username
     - Password

4. **Configurar Manualmente:**
   Si la variable automática no funciona:
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database_name"
   ```
   Ejemplo real:
   ```bash
   DATABASE_URL="postgresql://rent360_user:secure_password@db-postgresql-nyc1-12345-do-user-123456-0.db.ondigitalocean.com:25060/rent360_prod"
   ```

#### Warnings de Metadata
**Problema:** Warnings sobre `themeColor` y `viewport` en archivos que no deberían tenerlos.

**Solución:** Estos warnings son normales y no afectan el funcionamiento. Puedes ignorarlos o:

1. En DigitalOcean, ve a App Settings → Advanced → Build Settings
2. Agrega esta variable de entorno:
   ```
   NEXT_DISABLE_METADATA_DEFAULTS=1
   ```

#### Error 500 en APIs
**Problema:** APIs devolviendo error 500.

**Solución:**
1. Verifica que todas las variables de entorno estén configuradas
2. Asegúrate de que la base de datos esté accesible
3. Revisa los logs en DigitalOcean para errores específicos
4. El endpoint `/api/health` debería funcionar correctamente

### 7. Inicializar Base de Datos (Opcional)
Si necesitas datos de prueba en producción:

1. **Conecta a tu contenedor:**
   ```bash
   doctl compute ssh <droplet-id> --ssh-key-path ~/.ssh/id_rsa
   ```

2. **Ejecuta el script de inicialización:**
   ```bash
   cd /workspace
   node init-production-db.js
   ```

3. **Verifica que se crearon los datos:**
   - Ve a tu aplicación
   - Intenta hacer login con: admin@rent360.cl / admin123456

### 8. Redeploy
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
