# 🚀 CONFIGURACIÓN DE PRODUCCIÓN - RENT360

## 📋 Guía Completa para Despliegue en Producción

### 📁 Archivos de Configuración Necesarios

#### 1. Variables de Entorno de Producción
Crear el archivo `.env.production.local` con la siguiente configuración:

```bash
# =============================================================================
# PRODUCCIÓN - RENT360 CONFIGURATION
# =============================================================================

# =============================================================================
# BASE DE DATOS
# =============================================================================
DATABASE_URL="postgresql://username:password@host:5432/rent360_prod"

# =============================================================================
# AUTENTICACIÓN Y SEGURIDAD
# =============================================================================
NEXTAUTH_SECRET="your-super-secure-random-secret-here-min-32-chars"
NEXTAUTH_URL="https://rent360.cl"

# JWT Configuration
JWT_SECRET="your-jwt-secret-here-min-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Bcrypt rounds (mayor = más seguro pero más lento)
BCRYPT_ROUNDS=12

# =============================================================================
# PAGOS Y PASARELAS
# =============================================================================

# Stripe Configuration
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# PayPal Configuration
PAYPAL_CLIENT_ID="your_paypal_client_id_here"
PAYPAL_CLIENT_SECRET="your_paypal_client_secret_here"
PAYPAL_ENVIRONMENT="live"

# WebPay Configuration (Chile)
WEBPAY_COMMERCE_CODE="your_webpay_commerce_code_here"
WEBPAY_API_KEY="your_webpay_api_key_here"
WEBPAY_ENVIRONMENT="production"

# Khipu Configuration
KHIPU_SECRET="your_khipu_secret_here"
KHIPU_RECEIVER_ID="your_khipu_receiver_id_here"

# =============================================================================
# FIRMAS ELECTRÓNICAS (Chile)
# =============================================================================

# TrustFactory
TRUSTFACTORY_API_KEY="your_trustfactory_api_key_here"
TRUSTFACTORY_API_SECRET="your_trustfactory_api_secret_here"
TRUSTFACTORY_BASE_URL="https://api.trustfactory.cl"
TRUSTFACTORY_CERTIFICATE_ID="your_certificate_id_here"

# FirmaPro
FIRMAPRO_API_KEY="your_firmapro_api_key_here"
FIRMAPRO_API_SECRET="your_firmapro_api_secret_here"
FIRMAPRO_BASE_URL="https://api.firmapro.cl"

# DigitalSign
DIGITALSIGN_API_KEY="your_digitalsign_api_key_here"
DIGITALSIGN_API_SECRET="your_digitalsign_api_secret_here"
DIGITALSIGN_BASE_URL="https://api.digitalsign.cl"

# =============================================================================
# SERVICIOS DE MAPAS Y UBICACIÓN
# =============================================================================

# Google Maps
GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# =============================================================================
# SERVICIOS DE NOTIFICACIONES
# =============================================================================

# Twilio (SMS)
TWILIO_ACCOUNT_SID="your_twilio_account_sid_here"
TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"
TWILIO_PHONE_NUMBER="+569XXXXXXX"

# SendGrid (Email)
SENDGRID_API_KEY="your_sendgrid_api_key_here"
SENDGRID_FROM_EMAIL="noreply@rent360.cl"
SENDGRID_FROM_NAME="Rent360"

# =============================================================================
# SERVICIOS DE ALMACENAMIENTO EN LA NUBE
# =============================================================================

# AWS S3
AWS_ACCESS_KEY_ID="your_aws_access_key_id_here"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key_here"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="rent360-production"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="your_gcp_project_id_here"
GOOGLE_CLOUD_KEY_FILENAME="path/to/service-account-key.json"
GOOGLE_CLOUD_STORAGE_BUCKET="rent360-production"

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT="your_storage_account_here"
AZURE_STORAGE_ACCESS_KEY="your_storage_access_key_here"
AZURE_STORAGE_CONTAINER="rent360-production"

# =============================================================================
# SERVICIOS DE ANALYTICS Y MONITORING
# =============================================================================

# Vercel Analytics
VERCEL_ANALYTICS_ID="your_vercel_analytics_id_here"

# Google Analytics
GOOGLE_ANALYTICS_ID="GA_MEASUREMENT_ID"

# Sentry (Error Monitoring)
SENTRY_DSN="https://your_sentry_dsn_here"
SENTRY_ENVIRONMENT="production"

# =============================================================================
# CONFIGURACIÓN DE REDIS (OPCIONAL)
# =============================================================================
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB=0

# =============================================================================
# CONFIGURACIÓN DE CORS Y SEGURIDAD
# =============================================================================
ALLOWED_ORIGINS="https://rent360.cl,https://www.rent360.cl"
CORS_MAX_AGE=86400

# =============================================================================
# CONFIGURACIÓN DE RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100  # requests por ventana
RATE_LIMIT_AUTH_STRICT_MAX=3 # máximo para auth en 15 min
RATE_LIMIT_FINANCIAL_MAX=10   # máximo para operaciones financieras
RATE_LIMIT_ADMIN_MAX=120     # máximo para admin

# =============================================================================
# CONFIGURACIÓN DE LOGGING
# =============================================================================
LOG_LEVEL="info"
LOG_MAX_SIZE="10m"
LOG_MAX_FILES="5"
LOG_FORMAT="json"

# =============================================================================
# CONFIGURACIÓN DE BACKUP
# =============================================================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE_DAILY="0 2 * * *"      # 2 AM todos los días
BACKUP_SCHEDULE_WEEKLY="0 3 * * 0"    # 3 AM domingos
BACKUP_SCHEDULE_MONTHLY="0 4 1 * *"   # 4 AM primer día del mes
BACKUP_RETENTION_DAILY=7
BACKUP_RETENTION_WEEKLY=4
BACKUP_RETENTION_MONTHLY=12
BACKUP_COMPRESSION=true
BACKUP_ENCRYPTION=true
BACKUP_ENCRYPTION_KEY="your_backup_encryption_key_here"

# =============================================================================
# CONFIGURACIÓN DE CACHE
# =============================================================================
CACHE_ENABLED=true
CACHE_MAX_SIZE=1000
CACHE_DEFAULT_TTL=300000    # 5 minutos
CACHE_CLEANUP_INTERVAL=60000 # 1 minuto
CACHE_PERSISTENCE_ENABLED=true
CACHE_PERSISTENCE_PATH="./cache"
CACHE_PERSISTENCE_INTERVAL=300000 # 5 minutos

# =============================================================================
# CONFIGURACIÓN DE MÁQUINA LEARNING
# =============================================================================
ML_ENABLED=true
ML_MODEL_UPDATE_INTERVAL=86400000 # 24 horas
ML_TRAINING_DATA_SIZE=10000
ML_PREDICTION_CONFIDENCE_THRESHOLD=0.7

# =============================================================================
# CONFIGURACIÓN DE WEBSOCKET
# =============================================================================
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001
WEBSOCKET_PATH="/socket.io"
WEBSOCKET_CORS_ORIGIN="https://rent360.cl"

# =============================================================================
# CONFIGURACIÓN DE PWA
# =============================================================================
PWA_ENABLED=true
PWA_CACHE_NAME="rent360-v1"
PWA_CACHE_MAX_SIZE="50MB"
PWA_OFFLINE_PAGE="/offline"

# =============================================================================
# CONFIGURACIÓN DE I18N
# =============================================================================
DEFAULT_LOCALE="es"
SUPPORTED_LOCALES="es,en"
I18N_DEBUG=false

# =============================================================================
# CONFIGURACIÓN DE HEALTH CHECKS
# =============================================================================
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DATABASE_TIMEOUT=5000
HEALTH_CHECK_EXTERNAL_TIMEOUT=10000
HEALTH_CHECK_MEMORY_THRESHOLD=0.9
HEALTH_CHECK_CPU_THRESHOLD=0.8

# =============================================================================
# CONFIGURACIÓN DE ALERTS
# =============================================================================
ALERTS_ENABLED=true
ALERTS_EMAIL_RECIPIENTS="admin@rent360.cl,support@rent360.cl"
ALERTS_SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
ALERTS_SMS_RECIPIENTS="+569XXXXXXXX"

# =============================================================================
# CONFIGURACIÓN DE MAINTENANCE
# =============================================================================
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE="El sistema está en mantenimiento. Volveremos pronto."
MAINTENANCE_ESTIMATED_TIME="2024-12-31T23:59:59Z"

# =============================================================================
# CONFIGURACIÓN DE EXPERIMENTAL FEATURES
# =============================================================================
EXPERIMENTAL_FEATURES=false
FEATURE_PROPERTY_COMPARISON=true
FEATURE_ADVANCED_SEARCH=true
FEATURE_AI_RECOMMENDATIONS=true
FEATURE_REAL_TIME_CHAT=true

# =============================================================================
# CONFIGURACIÓN DE THIRD-PARTY INTEGRATIONS
# =============================================================================
INTEGRATION_GOOGLE_ENABLED=true
INTEGRATION_FACEBOOK_ENABLED=false
INTEGRATION_LINKEDIN_ENABLED=false
INTEGRATION_TWITTER_ENABLED=false

# =============================================================================
# CONFIGURACIÓN DE DEBUGGING (DESACTIVAR EN PRODUCCIÓN)
# =============================================================================
DEBUG_MODE=false
DEBUG_DATABASE_QUERIES=false
DEBUG_API_REQUESTS=false
DEBUG_CACHE_OPERATIONS=false
DEBUG_WEBSOCKET_CONNECTIONS=false

# =============================================================================
# CONFIGURACIÓN DE PERFORMANCE MONITORING
# =============================================================================
PERFORMANCE_MONITORING_ENABLED=true
PERFORMANCE_SLOW_QUERY_THRESHOLD=1000 # ms
PERFORMANCE_MEMORY_ALERT_THRESHOLD=0.8
PERFORMANCE_CPU_ALERT_THRESHOLD=0.7

# =============================================================================
# CONFIGURACIÓN DE ERROR REPORTING
# =============================================================================
ERROR_REPORTING_ENABLED=true
ERROR_REPORTING_LEVEL="error"
ERROR_REPORTING_INCLUDE_STACK=true
ERROR_REPORTING_SANITIZE_DATA=true

# =============================================================================
# CONFIGURACIÓN DE API RATE LIMITING POR ENDPOINT
# =============================================================================
API_RATE_LIMIT_GLOBAL=1000
API_RATE_LIMIT_AUTH=10
API_RATE_LIMIT_ADMIN=500
API_RATE_LIMIT_PUBLIC=100
```

### 📊 Checklist de Configuración de Producción

#### ✅ BASE DE DATOS
- [ ] Configurar PostgreSQL/MySQL en producción
- [ ] Ejecutar migraciones de Prisma
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo de base de datos

#### ✅ AUTENTICACIÓN Y SEGURIDAD
- [ ] Generar secrets seguros para NextAuth y JWT
- [ ] Configurar HTTPS obligatorio
- [ ] Configurar CORS para dominios de producción
- [ ] Configurar Content Security Policy (CSP)

#### ✅ PAGOS Y PASARELAS
- [ ] Configurar credenciales de Stripe/PayPal/WebPay
- [ ] Configurar webhooks de pago
- [ ] Configurar certificados SSL para pagos
- [ ] Probar flujo de pagos completo

#### ✅ FIRMAS ELECTRÓNICAS
- [ ] Configurar credenciales de proveedores chilenos
- [ ] Configurar webhooks de firmas
- [ ] Probar flujo de firmas completo
- [ ] Configurar certificados digitales

#### ✅ SERVICIOS EXTERNOS
- [ ] Configurar Google Maps API
- [ ] Configurar servicios de email (SendGrid)
- [ ] Configurar servicios de SMS (Twilio)
- [ ] Configurar almacenamiento en nube (AWS S3/GCS)

#### ✅ MONITOREO Y LOGGING
- [ ] Configurar Sentry para error tracking
- [ ] Configurar DataDog/New Relic para monitoreo
- [ ] Configurar logging centralizado
- [ ] Configurar alertas automáticas

#### ✅ PERFORMANCE Y CACHE
- [ ] Configurar Redis para cache distribuido
- [ ] Configurar CDN para assets estáticos
- [ ] Optimizar imágenes y assets
- [ ] Configurar compresión GZIP/Brotli

#### ✅ BACKUP Y RECUPERACIÓN
- [ ] Configurar backups automáticos
- [ ] Configurar disaster recovery
- [ ] Probar procedimientos de restauración
- [ ] Configurar backup off-site

### 🚀 Comandos para Despliegue

#### 1. Preparar el Entorno
```bash
# Instalar dependencias de producción
npm ci --production

# Generar build optimizado
npm run build

# Ejecutar migraciones de base de datos
npx prisma migrate deploy

# Ejecutar seeds de datos iniciales
npx prisma db seed
```

#### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración
cp .env.production.example .env.production.local

# Editar con valores reales de producción
nano .env.production.local
```

#### 3. Despliegue en Producción
```bash
# Para Vercel
vercel --prod

# Para Docker
docker build -t rent360 .
docker run -p 3000:3000 rent360

# Para PM2
pm2 start npm --name "rent360" -- start
pm2 save
pm2 startup
```

#### 4. Verificación Post-Despliegue
```bash
# Verificar que la aplicación está corriendo
curl https://rent360.cl/api/health

# Verificar que la base de datos está conectada
curl https://rent360.cl/api/admin/system-stats

# Verificar que los pagos funcionan
curl https://rent360.cl/api/payments/test

# Verificar que las firmas electrónicas funcionan
curl https://rent360.cl/api/signatures/test
```

### 📈 Monitoreo de Producción

#### Métricas Críticas a Monitorear
- **Response Time**: < 500ms promedio
- **Error Rate**: < 1%
- **Uptime**: > 99.9%
- **Database Connections**: < 80% del límite
- **Memory Usage**: < 85% del límite
- **CPU Usage**: < 70% promedio

#### Alertas Automáticas
- Error rate > 5%
- Response time > 2s
- Database connection errors
- Payment failures
- Signature service failures

### 🔧 Troubleshooting de Producción

#### Problemas Comunes
1. **Error de Conexión a BD**: Verificar DATABASE_URL
2. **Errores de CORS**: Verificar ALLOWED_ORIGINS
3. **Pagos no funcionan**: Verificar credenciales de Stripe/PayPal
4. **Firmas no funcionan**: Verificar credenciales de proveedores
5. **Archivos no se suben**: Verificar configuración de S3/GCS

#### Logs Importantes
```bash
# Ver logs de aplicación
pm2 logs rent360

# Ver logs de base de datos
tail -f /var/log/postgresql/postgresql.log

# Ver logs de nginx (si aplica)
tail -f /var/log/nginx/error.log
```

### 📞 Contactos de Emergencia

- **Administrador de Sistema**: admin@rent360.cl
- **Soporte Técnico**: support@rent360.cl
- **Equipo de Desarrollo**: dev@rent360.cl
- **Proveedor de Infraestructura**: [Proveedor específico]

### 🔄 Plan de Rollback

En caso de problemas críticos en producción:

1. **Revertir código**: `git revert <commit-hash>`
2. **Restaurar backup**: Usar último backup funcional
3. **Redirigir tráfico**: Usar CDN o load balancer
4. **Notificar usuarios**: Página de mantenimiento
5. **Investigar causa**: Análisis de logs y métricas

---

**⚠️ IMPORTANTE**: Este documento contiene configuraciones sensibles. Nunca commitear archivos `.env*` con valores reales a control de versiones. Usar siempre variables de entorno del servidor de producción.
