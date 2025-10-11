# 🚀 Guía de Configuración para Producción - Rent360

## 📋 Configuración de Cookies y Autenticación

### Variables de Entorno Requeridas

```bash
# Base de datos
DATABASE_URL="postgresql://usuario:password@host:5432/rent360_prod"

# JWT (generar con: openssl rand -base64 32)
JWT_SECRET="tu_jwt_secret_muy_seguro_aqui"
JWT_REFRESH_SECRET="tu_refresh_secret_muy_seguro_aqui"

# Dominio para cookies
DOMAIN="tu-dominio.com"
FORCE_HTTPS="true"

# CORS
ALLOWED_ORIGINS="https://tu-dominio.com,https://www.tu-dominio.com"
```

### Configuración de Cookies Automática

El sistema detecta automáticamente el entorno y configura las cookies:

- **Producción**: `sameSite: 'strict'`, `secure: true`
- **Desarrollo**: `sameSite: 'lax'`, `secure: false`

### Variables Adicionales para Producción

```bash
# Email
SENDGRID_API_KEY="tu_sendgrid_api_key"

# Pagos
KHIPU_RECEIVER_ID="tu_khipu_receiver_id"
KHIPU_SECRET="tu_khipu_secret"

# Maps
GOOGLE_MAPS_API_KEY="tu_google_maps_api_key"

# Seguridad
RECAPTCHA_SITE_KEY="tu_recaptcha_site_key"
RECAPTCHA_SECRET_KEY="tu_recaptcha_secret_key"

# Almacenamiento
AWS_ACCESS_KEY_ID="tu_aws_access_key"
AWS_SECRET_ACCESS_KEY="tu_aws_secret_key"
AWS_S3_BUCKET="tu_bucket_s3"

# Monitoreo
SENTRY_DSN="tu_sentry_dsn"
SENTRY_ENVIRONMENT="production"
```

## 🔧 Configuración del Servidor

### Build de Producción

```bash
npm run build
npm start
```

### Variables de Entorno

Asegurarse de que todas las variables estén configuradas:

```bash
NODE_ENV=production
DOMAIN=tu-dominio.com
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
```

## 🌐 Configuración de Nginx (Recomendado)

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Configuración de Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Configuración de cookies seguras
    add_header Set-Cookie "Path=/; Secure; HttpOnly; SameSite=Strict" always;
}
```

## 🔒 Configuración de Seguridad

### Headers de Seguridad

El middleware incluye automáticamente:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### Rate Limiting

Configurado automáticamente:

- 100 requests por minuto por IP
- Configurable via variables de entorno

### CORS

Solo permite orígenes configurados en `ALLOWED_ORIGINS`.

## 📊 Monitoreo y Logs

### Logs Estructurados

```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

### Sentry para Errores

```bash
SENTRY_DSN=tu_sentry_dsn
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

## 🚀 Despliegue

### Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] Base de datos creada y migrada
- [ ] Certificado SSL válido
- [ ] Dominio configurado
- [ ] CORS configurado correctamente
- [ ] Cookies de autenticación probadas

### Comandos de Despliegue

```bash
# Construir
npm run build

# Migrar base de datos
npx prisma migrate deploy

# Iniciar
npm start
```

### Verificación Post-Despliegue

1. ✅ Sitio carga correctamente
2. ✅ Login funciona
3. ✅ Cookies se guardan
4. ✅ APIs responden
5. ✅ HTTPS funciona
6. ✅ Dominio resuelve correctamente

## 🐛 Troubleshooting

### Problemas Comunes

#### Cookies no se guardan

- Verificar `DOMAIN` configurado correctamente
- Verificar `FORCE_HTTPS=true` en producción
- Verificar que el navegador acepte cookies de terceros

#### APIs devuelven 401

- Verificar que las cookies se envíen con `credentials: 'include'`
- Verificar que el dominio esté en `ALLOWED_ORIGINS`
- Verificar que las cookies no estén expiradas

#### Errores de CORS

- Agregar dominio a `ALLOWED_ORIGINS`
- Verificar configuración de Nginx
- Verificar que no haya conflictos de puertos

### Logs Útiles

```bash
# Ver logs de la aplicación
tail -f logs/app.log

# Ver logs de errores
tail -f logs/error.log

# Ver logs de base de datos
tail -f logs/database.log
```

---

## 🎯 Resumen

La configuración está optimizada para:

- ✅ **Seguridad máxima** en producción
- ✅ **Compatibilidad** con desarrollo local
- ✅ **Autenticación robusta** con JWT + cookies HTTP-only
- ✅ **Rendimiento óptimo** con Next.js
- ✅ **Monitoreo completo** con Sentry

**El sistema está listo para producción con todas las correcciones aplicadas.** 🚀
