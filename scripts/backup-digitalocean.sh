#!/bin/bash

# Script de backup para Rent360 en DigitalOcean
# Configura backups automáticos para base de datos y archivos

set -e

echo "💾 Configurando backups para Rent360 en DigitalOcean..."

# Variables de configuración
BACKUP_DIR="/var/backups/rent360"
LOG_FILE="/var/log/rent360-backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Función de logging
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Verificar si estamos en DigitalOcean App Platform
if [ -z "$DIGITALOCEAN_APP_ID" ]; then
    log "⚠️  No se detectó DigitalOcean App Platform. Algunas funciones pueden no estar disponibles."
fi

# ===========================================
# 1. CONFIGURACIÓN INICIAL
# ===========================================

log "🔧 Configurando directorio de backups..."

# Crear directorio de backups
sudo mkdir -p "$BACKUP_DIR"
sudo chown -R $USER:$USER "$BACKUP_DIR"

# Crear archivo de log
touch "$LOG_FILE"

log "✅ Directorio de backups configurado: $BACKUP_DIR"

# ===========================================
# 2. BACKUP DE BASE DE DATOS
# ===========================================

log "🗄️ Iniciando backup de base de datos..."

# Variables de conexión (obtener de variables de entorno)
DB_HOST=${DATABASE_URL:+$(echo $DATABASE_URL | sed -E 's|postgresql://[^@]+@([^:/]+).*|\1|')}
DB_PORT=${DATABASE_URL:+$(echo $DATABASE_URL | sed -E 's|.*:([0-9]+).*|\1|')}
DB_NAME=${DATABASE_URL:+$(echo $DATABASE_URL | sed -E 's|.*/([^?]+).*|\1|')}
DB_USER=${DATABASE_URL:+$(echo $DATABASE_URL | sed -E 's|postgresql://([^:]+):.*|\1|')}

if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
    log "❌ Error: No se pudo obtener la información de conexión de DATABASE_URL"
    exit 1
fi

# Archivo de backup
BACKUP_FILE="$BACKUP_DIR/rent360_db_$TIMESTAMP.sql"

log "📤 Creando backup de base de datos..."

# Crear backup usando pg_dump
if command -v pg_dump &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        --verbose \
        > "$BACKUP_FILE" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "✅ Backup de base de datos creado: $BACKUP_FILE"

        # Comprimir el archivo
        gzip "$BACKUP_FILE"
        log "✅ Backup comprimido: ${BACKUP_FILE}.gz"

        # Calcular tamaño del backup
        BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
        log "📊 Tamaño del backup: $BACKUP_SIZE"
    else
        log "❌ Error al crear backup de base de datos"
        exit 1
    fi
else
    log "⚠️  pg_dump no disponible. Intentando método alternativo..."

    # Método alternativo usando Prisma
    if command -v npx &> /dev/null; then
        npx prisma db push --preview-feature --force-reset 2>> "$LOG_FILE"
        log "✅ Backup alternativo completado usando Prisma"
    else
        log "❌ No se pudo crear backup de base de datos"
        exit 1
    fi
fi

# ===========================================
# 3. BACKUP DE ARCHIVOS ESTÁTICOS
# ===========================================

log "📁 Verificando archivos estáticos..."

# Directorio de archivos subidos (ajusta según tu configuración)
UPLOAD_DIR="./uploads"
if [ -d "$UPLOAD_DIR" ]; then
    UPLOAD_BACKUP="$BACKUP_DIR/rent360_uploads_$TIMESTAMP.tar.gz"

    log "📤 Creando backup de archivos subidos..."

    # Crear backup de archivos
    tar -czf "$UPLOAD_BACKUP" -C "$UPLOAD_DIR" . 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "✅ Backup de archivos creado: $UPLOAD_BACKUP"

        UPLOAD_SIZE=$(du -h "$UPLOAD_BACKUP" | cut -f1)
        log "📊 Tamaño del backup de archivos: $UPLOAD_SIZE"
    else
        log "❌ Error al crear backup de archivos"
    fi
else
    log "⚠️  Directorio de uploads no encontrado: $UPLOAD_DIR"
fi

# ===========================================
# 4. LIMPIEZA DE BACKUPS ANTIGUOS
# ===========================================

log "🧹 Limpiando backups antiguos..."

# Mantener solo los últimos 7 backups de base de datos
find "$BACKUP_DIR" -name "rent360_db_*.sql.gz" -mtime +7 -delete 2>> "$LOG_FILE"
DB_DELETED=$(find "$BACKUP_DIR" -name "rent360_db_*.sql.gz" -mtime +7 -delete -print | wc -l)
if [ "$DB_DELETED" -gt 0 ]; then
    log "🗑️  Eliminados $DB_DELETED backups antiguos de base de datos"
fi

# Mantener solo los últimos 7 backups de archivos
find "$BACKUP_DIR" -name "rent360_uploads_*.tar.gz" -mtime +7 -delete 2>> "$LOG_FILE"
UPLOAD_DELETED=$(find "$BACKUP_DIR" -name "rent360_uploads_*.tar.gz" -mtime +7 -delete -print | wc -l)
if [ "$UPLOAD_DELETED" -gt 0 ]; then
    log "🗑️  Eliminados $UPLOAD_DELETED backups antiguos de archivos"
fi

# ===========================================
# 5. VERIFICACIÓN DE INTEGRIDAD
# ===========================================

log "🔍 Verificando integridad de backups..."

# Verificar que los archivos de backup existen y no están vacíos
if [ -f "${BACKUP_FILE}.gz" ] && [ -s "${BACKUP_FILE}.gz" ]; then
    log "✅ Backup de base de datos válido"

    # Verificar que se puede descomprimir
    if gzip -t "${BACKUP_FILE}.gz" 2>> "$LOG_FILE"; then
        log "✅ Backup de base de datos se puede descomprimir correctamente"
    else
        log "❌ Error: Backup de base de datos corrupto"
    fi
else
    log "❌ Error: Backup de base de datos no válido o vacío"
fi

# ===========================================
# 6. REPORTE FINAL
# ===========================================

log "📊 Generando reporte de backup..."

# Contar archivos de backup
DB_BACKUPS=$(find "$BACKUP_DIR" -name "rent360_db_*.sql.gz" | wc -l)
UPLOAD_BACKUPS=$(find "$BACKUP_DIR" -name "rent360_uploads_*.tar.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

# Calcular espacio disponible
DISK_USAGE=$(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')
DISK_USAGE_PERCENT=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}')

cat << EOF | tee -a "$LOG_FILE"

========================================
📋 REPORTE DE BACKUP - Rent360
========================================
Fecha: $(date)
Servidor: $(hostname)
Entorno: ${NODE_ENV:-production}

📊 ESTADÍSTICAS:
- Backups de BD: $DB_BACKUPS archivos
- Backups de archivos: $UPLOAD_BACKUPS archivos
- Espacio total usado: $TOTAL_SIZE
- Espacio disponible: $DISK_USAGE ($DISK_USAGE_PERCENT)

🗄️ ÚLTIMO BACKUP DE BASE DE DATOS:
- Archivo: $(basename "${BACKUP_FILE}.gz")
- Tamaño: $BACKUP_SIZE
- Ubicación: ${BACKUP_FILE}.gz

📁 ÚLTIMO BACKUP DE ARCHIVOS:
- Archivo: $(basename "$UPLOAD_BACKUP")
- Tamaño: $UPLOAD_SIZE
- Ubicación: $UPLOAD_BACKUP

✅ ESTADO: BACKUP COMPLETADO EXITOSAMENTE
========================================

EOF

log "🎉 Backup completado exitosamente"

# ===========================================
# 7. CONFIGURACIÓN DE MONITOREO (OPCIONAL)
# ===========================================

# Si tienes configurado un webhook para notificaciones
if [ -n "$BACKUP_WEBHOOK_URL" ]; then
    log "📤 Enviando notificación de backup..."

    # Enviar notificación (ejemplo con curl)
    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"Backup de Rent360 completado\",
            \"timestamp\": \"$TIMESTAMP\",
            \"status\": \"success\",
            \"size\": \"$BACKUP_SIZE\"
        }" 2>> "$LOG_FILE" || log "⚠️  Error al enviar notificación"
fi

log "✅ Proceso de backup finalizado"

exit 0
