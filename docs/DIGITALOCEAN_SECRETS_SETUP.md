# 🔐 Configuración de Secrets para Despliegue Automático en DigitalOcean

## Requisitos Previos

Antes de configurar el despliegue automático, necesitas:

1. ✅ **Cuenta de DigitalOcean** con App Platform habilitado
2. ✅ **Aplicación creada** en DigitalOcean App Platform
3. ✅ **Base de datos PostgreSQL** configurada en DigitalOcean
4. ✅ **Cuenta de GitHub** con permisos para configurar secrets

## 📋 Secrets Requeridos

### 1. DIGITALOCEAN_ACCESS_TOKEN

**Dónde obtenerlo:**

1. Ve a [DigitalOcean Dashboard](https://cloud.digitalocean.com/)
2. Ve a "API" en el menú lateral
3. Click en "Generate New Token"
4. Dale un nombre descriptivo (ej: "rent360-github-actions")
5. Selecciona permisos: `read` y `write`
6. **IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)

**Valor del secret:**

```
tu_token_personal_de_digitalocean_aquí
```

### 2. DIGITALOCEAN_APP_ID

**Dónde obtenerlo:**

1. Ve a [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Selecciona tu aplicación Rent360
3. Copia el ID de la URL o del dashboard

**Valor del secret:**

```
tu_app_id_de_digitalocean_aquí
```

### 3. DATABASE_URL

**Dónde obtenerlo:**

1. Ve a [DigitalOcean Databases](https://cloud.digitalocean.com/databases)
2. Selecciona tu base de datos PostgreSQL de Rent360
3. Ve a "Connection Details"
4. Copia la "Connection String"

**Formato esperado:**

```
postgresql://rent360_user:tu_password_seguro@db-postgresql-nyc1-XXXXX-do-user-XXXXXX-0.db.ondigitalocean.com:25060/rent360_prod?sslmode=require
```

### 4. JWT_SECRET

**Cómo generarlo:**

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Requisitos:**

- Mínimo 32 caracteres
- Solo caracteres hexadecimales
- **NUNCA** uses valores predecibles

### 5. JWT_REFRESH_SECRET

**Cómo generarlo:**
Usa el mismo método que JWT_SECRET, pero genera un valor **DIFERENTE**.

**Requisitos:**

- Mínimo 32 caracteres
- **DIFERENTE** al JWT_SECRET
- Solo caracteres hexadecimales

### 6. NEXTAUTH_SECRET

**Cómo generarlo:**
Usa el mismo método que JWT_SECRET, genera un tercer valor único.

**Requisitos:**

- Mínimo 32 caracteres
- **DIFERENTE** a JWT_SECRET y JWT_REFRESH_SECRET
- Solo caracteres hexadecimales

## 🔧 Configuración en GitHub

### Paso 1: Acceder a los Secrets del Repositorio

1. Ve a tu repositorio en GitHub
2. Click en "Settings" (en la barra superior)
3. En el menú lateral, click en "Secrets and variables"
4. Click en "Actions"

### Paso 2: Agregar Secrets

Click en "New repository secret" y agrega cada uno:

| Secret Name                 | Valor             | Descripción                                |
| --------------------------- | ----------------- | ------------------------------------------ |
| `DIGITALOCEAN_ACCESS_TOKEN` | Tu token de DO    | Para autenticar con DigitalOcean API       |
| `DIGITALOCEAN_APP_ID`       | ID de tu app      | Para identificar la aplicación a desplegar |
| `DATABASE_URL`              | URL de PostgreSQL | Conexión a base de datos de producción     |
| `JWT_SECRET`                | Secret generado   | Para firmar tokens JWT                     |
| `JWT_REFRESH_SECRET`        | Secret generado   | Para refresh tokens                        |
| `NEXTAUTH_SECRET`           | Secret generado   | Para NextAuth.js                           |

### Paso 3: Secrets Opcionales

Si usas estas funcionalidades, agrega también:

| Secret Name         | Valor               | Descripción                       |
| ------------------- | ------------------- | --------------------------------- |
| `SLACK_WEBHOOK_URL` | URL de Slack        | Para notificaciones de despliegue |
| `SENTRY_DSN`        | DSN de Sentry       | Para monitoreo de errores         |
| `STRIPE_SECRET_KEY` | Clave de Stripe     | Para procesar pagos               |
| `SENDGRID_API_KEY`  | API Key de SendGrid | Para envío de emails              |

## 🧪 Verificación de Configuración

### Verificar Secrets en GitHub

1. Ve a Settings → Secrets and variables → Actions
2. Verifica que todos los secrets requeridos estén presentes
3. **IMPORTANTE**: Los valores están ocultos por seguridad

### Verificar DigitalOcean Token

```bash
# Probar el token (desde tu máquina local)
curl -X GET \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  "https://api.digitalocean.com/v2/account"
```

Deberías recibir una respuesta JSON con información de tu cuenta.

### Verificar App ID

```bash
# Listar tus apps
curl -X GET \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  "https://api.digitalocean.com/v2/apps"
```

Busca tu aplicación Rent360 en la lista.

## 🚀 Probar el Despliegue

### Despliegue Manual

1. Ve a tu repositorio en GitHub
2. Click en "Actions"
3. Selecciona "DigitalOcean App Platform Deployment"
4. Click en "Run workflow"
5. Selecciona branch `main` y ejecuta

### Despliegue Automático

1. Haz un commit a la branch `main`
2. Ve a "Actions" para ver el progreso
3. El despliegue se activa automáticamente

## 🔍 Troubleshooting

### Error: "Bad credentials"

**Problema:** Token de DigitalOcean inválido o expirado
**Solución:**

1. Genera un nuevo token en DigitalOcean
2. Actualiza el secret `DIGITALOCEAN_ACCESS_TOKEN` en GitHub
3. Re-ejecuta el workflow

### Error: "App not found"

**Problema:** App ID incorrecto
**Solución:**

1. Verifica el App ID en DigitalOcean
2. Actualiza el secret `DIGITALOCEAN_APP_ID` en GitHub
3. Re-ejecuta el workflow

### Error: "Database connection failed"

**Problema:** DATABASE_URL incorrecta
**Solución:**

1. Verifica la URL en DigitalOcean Databases
2. Asegúrate de que incluya `?sslmode=require`
3. Actualiza el secret `DATABASE_URL` en GitHub

### Error: "JWT secret too short"

**Problema:** Secrets JWT menores a 32 caracteres
**Solución:**

1. Genera nuevos secrets con al menos 32 caracteres
2. Actualiza los secrets en GitHub
3. Re-ejecuta el workflow

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Revisa los logs** del workflow en GitHub Actions
2. **Verifica los secrets** en la configuración del repositorio
3. **Contacta soporte**:
   - DigitalOcean: [support.digitalocean.com](https://support.digitalocean.com)
   - Rent360: support@rent360.cl

## 🔒 Mejores Prácticas de Seguridad

### Gestión de Secrets

- ✅ **Nunca commits** claves sensibles en código
- ✅ **Rota regularmente** los secrets (cada 90 días)
- ✅ **Usa diferentes secrets** para desarrollo y producción
- ✅ **Limita permisos** de los tokens al mínimo necesario
- ✅ **Monitorea uso** de los secrets

### Secrets en Producción

- ✅ **Genera valores únicos** para cada secret
- ✅ **Usa generadores criptográficos** seguros
- ✅ **Almacena backups** de los secrets en lugar seguro
- ✅ **Documenta rotación** de secrets
- ✅ **Configura alertas** para uso inusual

---

**⚠️ IMPORTANTE:** Los secrets configurados aquí tienen acceso completo a tu infraestructura de DigitalOcean. Manéjalos con extremo cuidado y nunca los compartas públicamente.
