#!/bin/bash

# Script de configuración para producción de Rent360
# Este script configura la base de datos y el entorno para producción

set -e

echo "🚀 Configurando Rent360 para producción..."

# Variables de entorno (configurar según el entorno)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"rent360_prod"}
DB_USER=${DB_USER:-"rent360_user"}
DB_PASSWORD=${DB_PASSWORD:-"secure_password"}

# =====================================================
# CONFIGURACIÓN DE LA BASE DE DATOS
# =====================================================

echo "📊 Configurando base de datos PostgreSQL..."

# Crear base de datos si no existe
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Base de datos ya existe"

# Configurar parámetros de PostgreSQL para producción
cat << EOF | psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME
-- Configuración de parámetros para alta performance
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,pg_buffercache';
ALTER SYSTEM SET track_activity_query_size = 4096;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_functions = all;

-- Configuración de memoria
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Configuración de WAL
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 64;

-- Configuración de autovacuum agresiva
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '1min';

-- Configuración de logging
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_statement = 'ddl';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

SELECT pg_reload_conf();
EOF

echo "✅ Parámetros de PostgreSQL configurados"

# =====================================================
# APLICAR MIGRACIONES DE PRISMA
# =====================================================

echo "🔄 Aplicando migraciones de Prisma..."

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

echo "✅ Migraciones aplicadas"

# =====================================================
# CREAR ÍNDICES OPTIMIZADOS
# =====================================================

echo "⚡ Creando índices optimizados..."

# Ejecutar script de índices
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f prisma/migrations/production_indexes.sql

echo "✅ Índices creados"

# =====================================================
# CONFIGURACIÓN DE USUARIOS Y PERMISOS
# =====================================================

echo "👥 Configurando usuarios y permisos..."

cat << EOF | psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME
-- Crear usuario de solo lectura para reportes
CREATE ROLE IF NOT EXISTS readonly_user WITH LOGIN PASSWORD 'secure_readonly_password' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
GRANT CONNECT ON DATABASE $DB_NAME TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;

-- Otorgar permisos de lectura en todas las tablas existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Configurar permisos por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;

-- Crear usuario para backups
CREATE ROLE IF NOT EXISTS backup_user WITH LOGIN PASSWORD 'secure_backup_password' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE REPLICATION;
GRANT CONNECT ON DATABASE $DB_NAME TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

-- Otorgar permisos específicos al usuario de la aplicación
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES FOR ROLE $DB_USER IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES FOR ROLE $DB_USER IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

echo "✅ Usuarios y permisos configurados"

# =====================================================
# CONFIGURACIÓN DE EXTENSIONES
# =====================================================

echo "🔧 Instalando extensiones PostgreSQL..."

cat << EOF | psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME
-- Extensiones útiles para producción
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";
CREATE EXTENSION IF NOT EXISTS "pg_prewarm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Para búsqueda de texto completo en español
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Configurar búsqueda de texto en español
CREATE TEXT SEARCH CONFIGURATION spanish (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION spanish
  ALTER MAPPING FOR hword, hword_part, word WITH unaccent, spanish_stem;

-- Crear función para búsqueda normalizada
CREATE OR REPLACE FUNCTION normalize_text(text)
RETURNS text AS $$
  SELECT lower(unaccent($1));
$$ LANGUAGE sql IMMUTABLE;
EOF

echo "✅ Extensiones instaladas"

# =====================================================
# CONFIGURACIÓN DE MONITOREO
# =====================================================

echo "📈 Configurando monitoreo..."

cat << EOF | psql -h $DB_HOST -p $DB_PORT -U postgres -d $DB_NAME
-- Crear función para métricas de rendimiento
CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value TEXT,
  description TEXT
) AS \$\$
BEGIN
  RETURN QUERY
  SELECT
    'active_connections'::TEXT,
    count(*)::TEXT,
    'Conexiones activas'::TEXT
  FROM pg_stat_activity
  WHERE state = 'active'

  UNION ALL

  SELECT
    'database_size'::TEXT,
    pg_size_pretty(pg_database_size(current_database()))::TEXT,
    'Tamaño total de la base de datos'::TEXT

  UNION ALL

  SELECT
    'cache_hit_ratio'::TEXT,
    ROUND(
      (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::NUMERIC,
      2
    )::TEXT || '%',
    'Ratio de aciertos de caché'::TEXT
  FROM pg_stat_database

  UNION ALL

  SELECT
    'total_indexes'::TEXT,
    count(*)::TEXT,
    'Número total de índices'::TEXT
  FROM pg_indexes
  WHERE schemaname = 'public';
END;
\$\$ LANGUAGE plpgsql;

-- Crear vista para alertas de rendimiento
CREATE OR REPLACE VIEW performance_alerts AS
SELECT
  'high_connection_count' as alert_type,
  CASE
    WHEN count(*) > 50 THEN 'CRITICAL'
    WHEN count(*) > 30 THEN 'WARNING'
    ELSE 'OK'
  END as severity,
  'Conexiones activas: ' || count(*)::TEXT as message
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT
  'low_cache_hit_ratio' as alert_type,
  CASE
    WHEN (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read))) < 90 THEN 'WARNING'
    WHEN (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read))) < 80 THEN 'CRITICAL'
    ELSE 'OK'
  END as severity,
  'Cache hit ratio: ' || ROUND((sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::NUMERIC, 2)::TEXT || '%' as message
FROM pg_stat_database

UNION ALL

SELECT
  'unused_indexes' as alert_type,
  'INFO' as severity,
  'Índices sin uso encontrados: ' || count(*)::TEXT as message
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';
EOF

echo "✅ Monitoreo configurado"

# =====================================================
# CONFIGURACIÓN DE BACKUPS
# =====================================================

echo "💾 Configurando backups..."

# Crear directorio para backups
BACKUP_DIR="/var/backups/rent360"
sudo mkdir -p $BACKUP_DIR
sudo chown postgres:postgres $BACKUP_DIR

# Crear script de backup
cat << 'EOF' | sudo tee /usr/local/bin/rent360-backup.sh
#!/bin/bash

# Script de backup para Rent360
BACKUP_DIR="/var/backups/rent360"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/rent360_$TIMESTAMP.sql"

# Configuración de conexión
export PGHOST="localhost"
export PGPORT="5432"
export PGDATABASE="rent360_prod"
export PGUSER="rent360_user"

# Crear backup
pg_dump --no-owner --no-privileges --clean --if-exists --verbose > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"

# Mantener solo los últimos 7 backups
cd $BACKUP_DIR
ls -t rent360_*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup completado: ${BACKUP_FILE}.gz"
EOF

sudo chmod +x /usr/local/bin/rent360-backup.sh

# Configurar cron para backups diarios
echo "0 2 * * * postgres /usr/local/bin/rent360-backup.sh" | sudo tee -a /etc/cron.d/rent360-backup

echo "✅ Backups configurados"

# =====================================================
# OPTIMIZACIONES FINALES
# =====================================================

echo "🔧 Aplicando optimizaciones finales..."

cat << EOF | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
-- Analizar todas las tablas para actualizar estadísticas
ANALYZE;

-- Pre-cargar tablas importantes en memoria
SELECT pg_prewarm('pg_stat_user_tables');
SELECT pg_prewarm('pg_stat_user_indexes');

-- Configurar mantenimiento programado
CREATE OR REPLACE FUNCTION scheduled_maintenance()
RETURNS void AS \$\$
BEGIN
  -- Refrescar vistas materializadas
  PERFORM refresh_materialized_views();

  -- Reindexar tablas fragmentadas
  PERFORM reindex_fragmented_tables();

  -- Limpiar datos antiguos (logs de más de 2 años)
  PERFORM cleanup_old_data(730);
END;
\$\$ LANGUAGE plpgsql;

-- Actualizar comentario de la base de datos
COMMENT ON DATABASE $DB_NAME IS 'Rent360 Production Database - Optimized for high performance and scalability - Created on $(date)';
EOF

echo "✅ Optimizaciones aplicadas"

# =====================================================
# VERIFICACIÓN FINAL
# =====================================================

echo "🔍 Verificando configuración..."

# Ejecutar verificación
cat << EOF | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
-- Verificar configuración
SELECT
  'PostgreSQL Version' as setting,
  version() as value
UNION ALL
SELECT
  'Max Connections' as setting,
  setting as value
FROM pg_settings
WHERE name = 'max_connections'
UNION ALL
SELECT
  'Shared Buffers' as setting,
  setting as value
FROM pg_settings
WHERE name = 'shared_buffers'
UNION ALL
SELECT
  'Database Size' as setting,
  pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT
  'Total Indexes' as setting,
  count(*)::TEXT as value
FROM pg_indexes
WHERE schemaname = 'public';
EOF

echo ""
echo "🎉 ¡Configuración de producción completada!"
echo ""
echo "📋 Próximos pasos recomendados:"
echo "1. Configurar variables de entorno en .env.production"
echo "2. Configurar servicios de monitoreo (DataDog, New Relic, etc.)"
echo "3. Configurar CDN para archivos estáticos"
echo "4. Configurar Redis para cache y sesiones"
echo "5. Configurar load balancer y auto-scaling"
echo "6. Configurar monitoring de logs y alertas"
echo ""
echo "🔒 Recuerda:"
echo "- Cambiar todas las contraseñas por defecto"
echo "- Configurar SSL/TLS para todas las conexiones"
echo "- Configurar backups off-site"
echo "- Monitorear el rendimiento regularmente"
echo ""
echo "📞 Para soporte: contact@rent360.cl"
