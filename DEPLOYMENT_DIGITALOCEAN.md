# 🚀 Guía Completa de Despliegue - Rent360 en DigitalOcean App Platform

## 📋 Información General

**Proyecto**: Rent360 - Plataforma Integral de Gestión Inmobiliaria
**Plataforma de Despliegue**: DigitalOcean App Platform
**Framework**: Next.js 14 con App Router
**Base de Datos**: PostgreSQL 15
**Cache**: Redis (opcional)
**Fecha**: $(date)
**Versión**: 1.0.0

---

## 🎯 Resumen Ejecutivo

Esta guía proporciona un análisis completo y paso a paso para desplegar Rent360 en producción utilizando DigitalOcean App Platform. El sistema está optimizado para alta disponibilidad, seguridad y escalabilidad.

### ✅ Requisitos Previos Verificados

- ✅ **Arquitectura**: Next.js 14 con App Router
- ✅ **Base de Datos**: PostgreSQL con Prisma ORM
- ✅ **Autenticación**: JWT con NextAuth.js
- ✅ **Seguridad**: Headers de seguridad, rate limiting, CORS
- ✅ **Monitoreo**: Health checks avanzados, logging, métricas
- ✅ **Performance**: Optimización de imágenes, caching, CDN
- ✅ **Compliance**: Ley 19.799 (Firmas Electrónicas), SII, Chile

### 📊 Estimación de Costos (DigitalOcean)

| Servicio | Plan | Costo Mensual | Notas |
|----------|------|---------------|-------|
| App Platform | Professional XS | $12 USD | 512MB RAM, 1 CPU |
| PostgreSQL | Professional XS | $15 USD | 1GB RAM, 10GB storage |
| Redis | Professional XS | $6 USD | Opcional |
| **Total** | | **$33 USD/mes** | Para desarrollo/pequeña producción |

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    DigitalOcean App Platform                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Next.js App   │  │  PostgreSQL DB  │  │    Redis    │  │
│  │   (Container)   │  │   (Managed)     │  │  (Managed)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Health Check  │  │   Monitoring    │  │  Backups   │  │
│  │   (/api/health) │  │   (Logs/Métricas│  │  (Auto)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Características Técnicas

- **Auto-scaling**: Automático basado en CPU/memoria
- **Load Balancing**: Integrado en App Platform
- **SSL/TLS**: Automático con Let's Encrypt
- **CDN**: CloudFlare integrado
- **Backups**: Automáticos para base de datos
- **Monitoring**: Logs centralizados, métricas

---

## 📋 Checklist Pre-Despliegue

### ✅ Código y Configuración

- [x] **Dockerfile optimizado** creado (`Dockerfile`)
- [x] **Configuración de App Platform** (`app.yaml`)
- [x] **Variables de entorno** configuradas (`config/production.env`)
- [x] **Script de setup** creado (`scripts/setup-digitalocean.sh`)
- [x] **Script de backup** creado (`scripts/backup-digitalocean.sh`)
- [x] **Health checks** implementados (`/api/health`)
- [x] **Seguridad** configurada (headers, rate limiting)
- [x] **Monitoreo** implementado (logs, métricas)

### ✅ Repositorio

- [ ] **Git repository** actualizado con todos los cambios
- [ ] **Branch principal** (`main`) listo para despliegue
- [ ] **GitHub/GitLab integration** configurada
- [ ] **Deploy on push** habilitado (opcional)

### ✅ Cuentas y Servicios Externos

- [ ] **Cuenta DigitalOcean** con App Platform habilitado
- [ ] **Stripe/PayPal** configurados para producción
- [ ] **SendGrid/Mailgun** configurado para emails
- [ ] **Cloudinary/S3** configurado para archivos
- [ ] **TrustFactory/FirmaPro** configurados para firmas
- [ ] **Firebase** configurado para notificaciones (opcional)

---

## 🚀 Proceso de Despliegue Paso a Paso

### Paso 1: Preparación del Código

```bash
# 1. Ejecutar script de configuración
./scripts/setup-digitalocean.sh

# 2. Verificar que todo esté correcto
npm run build
npm run test

# 3. Subir cambios al repositorio
git add .
git commit -m "feat: configurar despliegue DigitalOcean App Platform"
git push origin main
```

### Paso 2: Configuración en DigitalOcean

#### 2.1 Crear App Platform App

1. **Acceder a DigitalOcean**:
   - Ir a [https://cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
   - Click en "Create App"

2. **Seleccionar Repositorio**:
   - Elegir tu repositorio de GitHub/GitLab
   - Seleccionar branch `main`
   - **Importante**: Habilitar "Autodeploy" si deseas despliegues automáticos

3. **Configurar Recursos**:
   ```
   Resource Type: Web Service
   Source Directory: /
   Environment: Production
   Build Command: npm run build
   Run Command: npm start
   HTTP Port: 3000
   ```

4. **Configurar Instancias**:
   ```
   Instance Type: Professional XS ($12/month)
   Instance Count: 1 (para desarrollo)
   ```

#### 2.2 Configurar Base de Datos

1. **Agregar Componente de Base de Datos**:
   - Click en "Add Component" → "Database"
   - Seleccionar PostgreSQL 15
   - Plan: Professional XS ($15/month)

2. **Configurar Conexión**:
   - La `DATABASE_URL` se configura automáticamente
   - Tomar nota de las credenciales para respaldo

#### 2.3 Configurar Variables de Entorno

**Variables Críticas** (deben configurarse como "Secret"):

```bash
# Autenticación y Seguridad (CRÍTICAS)
JWT_SECRET=tu-jwt-secret-super-seguro-min-32-chars
JWT_REFRESH_SECRET=tu-refresh-secret-super-seguro-min-32-chars
NEXTAUTH_SECRET=tu-nextauth-secret-key
ENCRYPTION_KEY=tu-32-character-encryption-key

# Base de Datos (automática)
DATABASE_URL=${db.DATABASE_URL}

# Servicios Externos (producción)
STRIPE_SECRET_KEY=sk_live_tu-stripe-live-secret-key
SENDGRID_API_KEY=tu-sendgrid-production-api-key
CLOUDINARY_API_SECRET=tu-cloudinary-production-secret

# Firmas Electrónicas (Chile)
TRUSTFACTORY_API_KEY=tu-trustfactory-production-key
FIRMAPRO_API_KEY=tu-firmapro-production-key
```

**Variables Opcionales**:

```bash
# Redis (opcional)
REDIS_URL=${redis.REDIS_URL}

# Monitoring
SENTRY_DSN=tu-sentry-production-dsn

# Analytics
ANALYTICS_ID=tu-analytics-id

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
```

### Paso 3: Primer Despliegue

1. **Iniciar Despliegue**:
   - Click en "Create Resources"
   - Monitorear el proceso de build en tiempo real

2. **Verificar Despliegue**:
   ```bash
   # Ver logs del despliegue
   doctl apps logs <app-id> --follow
   ```

3. **Verificar Aplicación**:
   ```bash
   # Health check
   curl https://tu-app.ondigitalocean.app/api/health

   # Verificar aplicación
   curl https://tu-app.ondigitalocean.app
   ```

### Paso 4: Configuración Post-Despliegue

#### 4.1 Ejecutar Migraciones

```bash
# Las migraciones se ejecutan automáticamente en el build
# Verificar en los logs que se completaron exitosamente
```

#### 4.2 Configurar Dominio Personalizado (Opcional)

1. **Configurar Dominio**:
   ```
   App Settings → Domains
   Domain: rent360.cl
   Type: PRIMARY
   Wildcard: true
   ```

2. **Actualizar DNS**:
   - Agregar CNAME record apuntando a tu app
   - Esperar propagación DNS (puede tomar hasta 24 horas)

3. **Configurar SSL**:
   - Automático con Let's Encrypt
   - Se habilita automáticamente al agregar el dominio

#### 4.3 Configurar Backups

```bash
# Los backups de base de datos son automáticos en DigitalOcean
# Configuración adicional opcional:

# Ejecutar backup manual
./scripts/backup-digitalocean.sh

# Programar backups adicionales (opcional)
# Configurar en App Platform → Settings → Backups
```

---

## 🔧 Configuración Avanzada

### Auto-scaling

```yaml
# En app.yaml
services:
- name: rent360-app
  instance_count: 1
  scaling:
    min_instances: 1
    max_instances: 5
    metrics:
      cpu:
        percent: 70
      memory:
        percent: 80
```

### Health Checks Avanzados

```yaml
# En app.yaml
services:
- name: rent360-app
  health_check:
    http_path: /api/health
    initial_delay_seconds: 30
    period_seconds: 10
    timeout_seconds: 5
    failure_threshold: 3
```

### Custom Domains con CDN

```yaml
# En app.yaml
domains:
- domain: rent360.cl
  type: PRIMARY
  wildcard: true
  zone: rent360.cl
  certificate_name: rent360-tls
```

---

## 📊 Monitoreo y Observabilidad

### Health Checks

El endpoint `/api/health` proporciona información detallada:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "responseTime": 145,
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 23
    },
    "cache": {
      "status": "healthy",
      "memoryUsage": 15728640,
      "hitRate": 0.95
    }
  }
}
```

### Logs y Métricas

```bash
# Ver logs de la aplicación
doctl apps logs <app-id>

# Ver logs de la base de datos
doctl databases logs <database-id>

# Ver métricas de rendimiento
# Disponible en App Platform Dashboard
```

### Alertas

Configurar alertas para:
- ✅ CPU usage > 80%
- ✅ Memory usage > 85%
- ✅ Response time > 5s
- ✅ Error rate > 5%
- ✅ Database connections > 90%

---

## 🔒 Seguridad en Producción

### Configuraciones Implementadas

- ✅ **SSL/TLS**: Automático con Let's Encrypt
- ✅ **Rate Limiting**: 1000 requests/minute por defecto
- ✅ **CORS**: Configurado para dominios específicos
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options
- ✅ **Input Validation**: Zod schemas en todas las APIs
- ✅ **SQL Injection Protection**: Prisma ORM
- ✅ **XSS Protection**: Sanitización automática

### Mejores Prácticas

1. **Secrets Management**:
   ```bash
   # Nunca commits claves sensibles
   # Usa variables de entorno para todo
   # Rota claves regularmente
   ```

2. **Access Control**:
   ```bash
   # Configura firewalls restrictivos
   # Usa VPC para aislamiento
   # Implementa least privilege principle
   ```

3. **Monitoring Security**:
   ```bash
   # Monitorea intentos de acceso no autorizado
   # Configura alertas de seguridad
   # Revisa logs regularmente
   ```

---

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Build Fails

**Síntomas**: Error durante el proceso de build

**Solución**:
```bash
# Verificar logs de build
doctl apps logs <app-id> --follow

# Verificar dependencias
npm ci
npm run build

# Verificar variables de entorno críticas
echo $JWT_SECRET
echo $DATABASE_URL
```

#### 2. Database Connection Issues

**Síntomas**: Error al conectar con PostgreSQL

**Solución**:
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Probar conexión
psql $DATABASE_URL -c "SELECT 1;"

# Verificar configuración de red
# Asegurarse de que la app puede acceder a la DB
```

#### 3. High Memory Usage

**Síntomas**: Aplicación se reinicia por uso de memoria

**Solución**:
```bash
# Verificar uso de memoria
doctl apps logs <app-id> | grep memory

# Optimizar aplicación
# - Implementar caching
# - Optimizar imágenes
# - Revisar memory leaks
```

#### 4. Slow Response Times

**Síntomas**: Aplicación responde lentamente

**Solución**:
```bash
# Verificar métricas
curl https://tu-app.ondigitalocean.app/api/health

# Optimizar queries de base de datos
# Implementar caching
# Verificar configuración de Redis
```

### Comandos Útiles

```bash
# Reiniciar aplicación
doctl apps create-deployment <app-id>

# Ver estado de la aplicación
doctl apps list

# Ver configuración actual
doctl apps get <app-id>

# Actualizar variables de entorno
doctl apps update <app-id> --env JWT_SECRET=new-secret
```

---

## 📈 Optimización y Escalabilidad

### Performance Optimization

1. **Database Optimization**:
   ```sql
   -- Índices recomendados
   CREATE INDEX idx_properties_location ON properties USING GIST(location);
   CREATE INDEX idx_contracts_status ON contracts(status);
   CREATE INDEX idx_users_email ON users(email);
   ```

2. **Caching Strategy**:
   ```typescript
   // Implementar Redis para sesiones y datos frecuentes
   // Usar CDN para archivos estáticos
   // Implementar cache a nivel de aplicación
   ```

3. **CDN Configuration**:
   - Archivos estáticos servidos desde CDN
   - Imágenes optimizadas automáticamente
   - Cache headers configurados correctamente

### Escalabilidad Horizontal

1. **Auto-scaling**:
   - Configurar basado en CPU/memoria
   - Mínimo 1, máximo 5 instancias para desarrollo
   - Auto-scaling basado en métricas

2. **Database Scaling**:
   - Read replicas para consultas de lectura
   - Connection pooling
   - Query optimization

3. **Caching Layer**:
   - Redis para sesiones
   - CDN para archivos estáticos
   - In-memory cache para datos frecuentes

---

## 🔄 Estrategias de Backup y Recovery

### Backup Automático

DigitalOcean proporciona backups automáticos para:
- ✅ Base de datos PostgreSQL
- ✅ Configuración de la aplicación
- ✅ Variables de entorno (excepto secrets)

### Backup Adicional (Opcional)

```bash
# Ejecutar backup manual
./scripts/backup-digitalocean.sh

# Configurar backup programado (usando cron en otra instancia)
# 0 2 * * * /path/to/backup-digitalocean.sh
```

### Disaster Recovery

1. **Point-in-Time Recovery**:
   - Disponible para PostgreSQL
   - Restaurar a cualquier punto en el tiempo

2. **Failover**:
   - Configurar múltiples instancias
   - Load balancer automático
   - Zero-downtime deployments

---

## 📞 Soporte y Mantenimiento

### Monitoreo Continuo

- ✅ **Health Checks**: Automáticos cada 30 segundos
- ✅ **Performance Monitoring**: CPU, memoria, response times
- ✅ **Error Tracking**: Logs centralizados
- ✅ **Database Monitoring**: Conexiones, queries lentas

### Mantenimiento Programado

```bash
# Actualizaciones de dependencias
npm audit fix
npm update

# Actualizaciones de sistema
# Manejado automáticamente por DigitalOcean

# Backups de verificación
# Ejecutar semanalmente
./scripts/backup-digitalocean.sh
```

### Contactos de Soporte

- **DigitalOcean Support**: [https://www.digitalocean.com/support/](https://www.digitalocean.com/support/)
- **Rent360 Support**: support@rent360.cl
- **Documentación**: [https://docs.digitalocean.com/products/app-platform/](https://docs.digitalocean.com/products/app-platform/)

---

## ✅ Checklist Post-Despliegue

### Verificaciones Iniciales

- [ ] **Aplicación responde**: `curl https://tu-app.ondigitalocean.app`
- [ ] **Health check funciona**: `curl https://tu-app.ondigitalocean.app/api/health`
- [ ] **Base de datos conectada**: Verificar en logs
- [ ] **SSL configurado**: Verificar certificado válido
- [ ] **Dominio configurado**: DNS propagado correctamente

### Verificaciones de Funcionalidad

- [ ] **Autenticación funciona**: Login/logout
- [ ] **Base de datos operativa**: CRUD operations
- [ ] **Emails se envían**: Verificar SendGrid
- [ ] **Pagos funcionan**: Verificar Stripe/PayPal
- [ ] **Firmas electrónicas**: Verificar integración

### Verificaciones de Seguridad

- [ ] **HTTPS forzado**: Solo HTTPS funciona
- [ ] **Rate limiting activo**: Verificar límites
- [ ] **CORS configurado**: Solo dominios permitidos
- [ ] **Headers de seguridad**: CSP, HSTS, etc.

### Verificaciones de Performance

- [ ] **Response time < 2s**: Para páginas principales
- [ ] **Database queries < 100ms**: Queries optimizadas
- [ ] **Memory usage < 80%**: Sin memory leaks
- [ ] **CPU usage < 70%**: Optimización adecuada

---

## 🎉 Conclusión

¡Felicitaciones! Has completado exitosamente el despliegue de Rent360 en DigitalOcean App Platform.

### Resumen de Beneficios

✅ **Escalabilidad automática** basada en demanda
✅ **Alta disponibilidad** con load balancing integrado
✅ **Seguridad enterprise-grade** con SSL automático
✅ **Monitoreo completo** con métricas y logs
✅ **Backups automáticos** para base de datos
✅ **CDN integrado** para archivos estáticos
✅ **Zero-downtime deployments** con blue-green
✅ **Compliance listo** para normativas chilenas

### Próximos Pasos Recomendados

1. **Monitoreo continuo** de métricas y logs
2. **Optimización de performance** basada en datos reales
3. **Configuración de alertas** para métricas críticas
4. **Implementación de CDN avanzado** si es necesario
5. **Configuración de multi-region** para mayor resiliencia

### Documentación Relacionada

- [README.md](./README.md) - Información general del proyecto
- [docs/deployment.md](./docs/deployment.md) - Guías de despliegue alternativas
- [config/production.env](./config/production.env) - Variables de entorno completas
- [scripts/setup-digitalocean.sh](./scripts/setup-digitalocean.sh) - Script de configuración

---

## 🔧 Solución de Problemas Comunes

### Error con DATABASE_URL

Si encuentras el error durante el build:
```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**Solución:**
1. Ve a tu App en Digital Ocean App Platform
2. Ve a "Settings" → "Environment Variables"
3. Verifica que `DATABASE_URL` empiece con `postgresql://` o `postgres://`
4. Si usas PostgreSQL managed de Digital Ocean, la URL debería verse así:
   ```
   postgresql://rent360_user:password@host.db.ondigitalocean.com:25060/rent360_db?sslmode=require
   ```

**Verificación:**
```bash
# Prueba la conexión
psql "$DATABASE_URL"
```

### Error de Prerendering en Páginas del Cliente

Si encuentras errores como:
```
ReferenceError: window is not defined
```

**Solución:** Las páginas que usan `'use client'` y hooks que acceden a `window` necesitan `export const dynamic = 'force-dynamic'` para evitar prerendering estático.

Ejemplo:
```typescript
'use client';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

import { usePWA } from '@/lib/pwa';
```

---

**🚀 Tu aplicación Rent360 está lista para producción en DigitalOcean**

Para soporte adicional, contacta a:
- **Email**: support@rent360.cl
- **Documentación**: deployment/README.md
- **DigitalOcean**: [https://docs.digitalocean.com/products/app-platform/](https://docs.digitalocean.com/products/app-platform/)

*Generado automáticamente para despliegue en producción*
