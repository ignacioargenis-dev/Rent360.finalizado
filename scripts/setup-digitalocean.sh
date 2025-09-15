#!/bin/bash

# Script de configuración inicial para Rent360 en DigitalOcean App Platform
# Este script prepara el proyecto para despliegue en producción

set -e

echo "🚀 Configurando Rent360 para DigitalOcean App Platform..."
echo "========================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto Rent360"
    exit 1
fi

# ===========================================
# 1. VERIFICACIÓN DE DEPENDENCIAS
# ===========================================

echo ""
echo "📦 Verificando dependencias..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js versión $NODE_VERSION detectada. Se requiere versión $REQUIRED_VERSION o superior"
    exit 1
fi

echo "✅ Node.js versión $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm versión $(npm --version)"

# ===========================================
# 2. INSTALACIÓN DE DEPENDENCIAS
# ===========================================

echo ""
echo "📥 Instalando dependencias..."

npm ci

echo "✅ Dependencias instaladas"

# ===========================================
# 3. VERIFICACIÓN DE ARCHIVOS DE CONFIGURACIÓN
# ===========================================

echo ""
echo "🔍 Verificando archivos de configuración..."

# Verificar Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile no encontrado"
    exit 1
fi
echo "✅ Dockerfile presente"

# Verificar configuración de producción
if [ ! -f "config/production.env" ]; then
    echo "❌ Archivo de configuración de producción no encontrado"
    exit 1
fi
echo "✅ Configuración de producción presente"

# Verificar app.yaml
if [ ! -f "app.yaml" ]; then
    echo "❌ Archivo app.yaml no encontrado"
    exit 1
fi
echo "✅ Configuración de App Platform presente"

# ===========================================
# 4. CONFIGURACIÓN DE PRISMA
# ===========================================

echo ""
echo "🗄️ Configurando Prisma..."

# Generar cliente de Prisma
npx prisma generate

echo "✅ Cliente Prisma generado"

# ===========================================
# 5. VERIFICACIÓN DE BUILDS
# ===========================================

echo ""
echo "🔨 Verificando build de producción..."

# Build de prueba
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build de producción exitoso"
else
    echo "❌ Error en el build de producción"
    exit 1
fi

# ===========================================
# 6. CREACIÓN DE ARCHIVOS DE DESPLIEGUE
# ===========================================

echo ""
echo "📝 Preparando archivos de despliegue..."

# Crear directorio de despliegue si no existe
mkdir -p deployment

# Copiar archivos necesarios
cp app.yaml deployment/
cp config/production.env deployment/.env.production
cp Dockerfile deployment/

# Crear archivo de instrucciones de despliegue
cat << 'EOF' > deployment/README.md
# 🚀 Guía de Despliegue - Rent360 en DigitalOcean

## 📋 Pre-requisitos

1. **Cuenta de DigitalOcean** con App Platform habilitado
2. **Repositorio Git** conectado a GitHub/GitLab
3. **Dominio personalizado** (opcional)

## 🚀 Proceso de Despliegue

### 1. Preparar el Repositorio

Asegúrate de que tu repositorio tenga:
- ✅ Dockerfile optimizado
- ✅ app.yaml configurado
- ✅ Variables de entorno configuradas

### 2. Crear App en DigitalOcean

1. Ve a [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Selecciona tu repositorio
4. Configura el despliegue:
   - **Source Directory**: `/`
   - **Environment**: `Production`
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`

### 3. Configurar Base de Datos

1. En App Platform, agrega un componente de base de datos
2. Selecciona PostgreSQL
3. Configura:
   - **Engine**: PostgreSQL
   - **Version**: 15
   - **Size**: Professional XS (para desarrollo) o superior

### 4. Configurar Variables de Entorno

Copia las variables del archivo `.env.production` y pégales en:
**App Settings > Environment Variables**

Variables críticas:
- `DATABASE_URL` (se configura automáticamente)
- `JWT_SECRET` (genera uno seguro)
- `NEXTAUTH_SECRET` (genera uno seguro)
- `ENCRYPTION_KEY` (genera uno de 32 caracteres)

### 5. Configurar Dominio (Opcional)

1. Ve a **Settings > Domains**
2. Agrega tu dominio personalizado
3. Configura los DNS records según las instrucciones

### 6. Primer Despliegue

1. Click "Deploy"
2. Monitorea el proceso de build
3. Verifica que la aplicación esté funcionando

## 🔧 Post-Despliegue

### Ejecutar Migraciones de Base de Datos

Una vez desplegada la app, ejecuta las migraciones:

```bash
# Conectar por SSH al contenedor
doctl apps logs <app-id> --follow

# O usar Prisma Studio
npx prisma studio --port 5555
```

### Configurar Backups

1. Ve a **Databases** en tu panel de DigitalOcean
2. Configura backups automáticos
3. Programa backups diarios

## 📊 Monitoreo

### Health Checks
- URL: `https://tu-app.ondigitalocean.app/api/health`
- Verifica: Base de datos, Redis, servicios externos

### Logs
```bash
# Ver logs de la aplicación
doctl apps logs <app-id>

# Ver logs de la base de datos
doctl databases logs <database-id>
```

## 🔒 Seguridad

### Configuraciones Recomendadas

1. **SSL/TLS**: Automáticamente habilitado en App Platform
2. **Firewall**: Configurado por defecto
3. **Rate Limiting**: Implementado en el código
4. **Secrets**: Nunca commits claves sensibles

### Variables Sensibles

Asegúrate de configurar estas variables como "Secret":
- JWT_SECRET
- NEXTAUTH_SECRET
- ENCRYPTION_KEY
- STRIPE_SECRET_KEY
- SENDGRID_API_KEY

## 🚨 Troubleshooting

### Problemas Comunes

1. **Build Fails**
   - Verifica que todas las dependencias estén en package.json
   - Revisa los logs de build en App Platform

2. **Database Connection**
   - Verifica DATABASE_URL
   - Asegúrate de que la DB esté corriendo

3. **Environment Variables**
   - Verifica que todas las variables requeridas estén configuradas
   - Recuerda que las variables son case-sensitive

### Comandos Útiles

```bash
# Ver estado de la app
doctl apps list

# Ver logs en tiempo real
doctl apps logs <app-id> --follow

# Reiniciar app
doctl apps create-deployment <app-id>

# Ver métricas
doctl monitoring alert list
```

## 📞 Soporte

- **Documentación DigitalOcean**: https://docs.digitalocean.com/products/app-platform/
- **Rent360 Support**: support@rent360.cl

---
**¡Felicitaciones!** Tu aplicación Rent360 está lista para producción en DigitalOcean.
EOF

echo "✅ Archivos de despliegue preparados en directorio 'deployment/'"

# ===========================================
# 7. VALIDACIÓN FINAL
# ===========================================

echo ""
echo "🔍 Validación final..."

# Verificar que no hay errores de linting críticos
if command -v npm &> /dev/null; then
    echo "Ejecutando linting..."
    npm run lint 2>/dev/null || echo "⚠️  Hay warnings de linting, revisa antes de desplegar"
fi

# Verificar que no hay dependencias vulnerables
if command -v npm &> /dev/null; then
    echo "Verificando vulnerabilidades..."
    npm audit --audit-level moderate 2>/dev/null || echo "⚠️  Hay vulnerabilidades, considera actualizar dependencias"
fi

# ===========================================
# 8. INSTRUCCIONES FINALES
# ===========================================

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. 📤 Sube los cambios a tu repositorio Git:"
echo "   git add ."
echo "   git commit -m 'feat: configurar despliegue DigitalOcean'"
echo "   git push origin main"
echo ""
echo "2. 🌊 Ve a DigitalOcean App Platform:"
echo "   https://cloud.digitalocean.com/apps"
echo ""
echo "3. 🔧 Crea una nueva App conectando tu repositorio"
echo ""
echo "4. ⚙️ Configura las variables de entorno usando el archivo:"
echo "   deployment/.env.production"
echo ""
echo "5. 🚀 Despliega tu aplicación"
echo ""
echo "📖 Lee las instrucciones completas en:"
echo "   deployment/README.md"
echo ""
echo "🔗 URLs importantes:"
echo "   - App Platform: https://cloud.digitalocean.com/apps"
echo "   - Documentación: https://docs.digitalocean.com/products/app-platform/"
echo "   - Rent360 Docs: deployment/README.md"
echo ""
echo "💡 Recuerda:"
echo "   - Generar secrets seguros para JWT y encriptación"
echo "   - Configurar backups automáticos"
echo "   - Monitorear logs y métricas"
echo "   - Mantener dependencias actualizadas"
echo ""
echo "¡Tu aplicación Rent360 está lista para volar! 🚀"
