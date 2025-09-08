-- Migración de índices optimizados para producción
-- Ejecutar después de aplicar el schema principal

-- =====================================================
-- ÍNDICES DE USUARIOS Y AUTENTICACIÓN
-- =====================================================

-- Índice compuesto para búsquedas de usuarios por email y rol
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_role
ON "User" (email, role)
WHERE deleted_at IS NULL;

-- Índice para búsquedas por teléfono
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone
ON "User" (phone)
WHERE deleted_at IS NULL AND phone IS NOT NULL;

-- Índice para búsquedas por RUT
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_rut
ON "User" (rut)
WHERE deleted_at IS NULL AND rut IS NOT NULL;

-- Índice para usuarios activos recientemente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login
ON "User" (last_login_at DESC)
WHERE deleted_at IS NULL;

-- =====================================================
-- ÍNDICES DE PROPIEDADES
-- =====================================================

-- Índice compuesto para búsqueda por ubicación y precio
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_price
ON "Property" (city, region, price)
WHERE status = 'ACTIVE';

-- Índice para búsqueda por tipo de propiedad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_type_status
ON "Property" (property_type, status)
WHERE status IN ('ACTIVE', 'PENDING');

-- Índice geoespacial para propiedades (si usamos PostGIS)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_location_geom
-- ON "Property" USING GIST (ST_Point(longitude, latitude));

-- Índice para propiedades por propietario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_owner
ON "Property" (owner_id, status, created_at DESC);

-- =====================================================
-- ÍNDICES DE VISITAS Y RESERVAS
-- =====================================================

-- Índice compuesto para visitas por fecha y runner
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_date_runner
ON "Visit" (scheduled_date, runner_id)
WHERE status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS');

-- Índice para visitas por propiedad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_property
ON "Visit" (property_id, scheduled_date DESC);

-- Índice para visitas por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_status_date
ON "Visit" (status, scheduled_date DESC);

-- =====================================================
-- ÍNDICES DE PAGOS Y TRANSACCIONES
-- =====================================================

-- Índice compuesto para transacciones por usuario y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date
ON "Transaction" (user_id, created_at DESC);

-- Índice para transacciones por tipo y estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type_status
ON "Transaction" (transaction_type, status, created_at DESC);

-- Índice para transacciones por referencia externa
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_external_ref
ON "Transaction" (external_reference)
WHERE external_reference IS NOT NULL;

-- =====================================================
-- ÍNDICES DE CONTRATOS
-- =====================================================

-- Índice compuesto para contratos por estado y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status_date
ON "Contract" (status, created_at DESC);

-- Índice para contratos por propiedad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_property
ON "Contract" (property_id, status);

-- Índice para contratos por partes involucradas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_parties
ON "Contract" (landlord_id, tenant_id, status);

-- =====================================================
-- ÍNDICES DE CALIFICACIONES Y RESEÑAS
-- =====================================================

-- Índice compuesto para ratings por proveedor y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_provider_date
ON "ProviderRating" (provider_id, created_at DESC);

-- Índice para ratings por tipo de proveedor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_provider_type
ON "ProviderRating" (provider_type, created_at DESC);

-- Índice para ratings verificados
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_verified
ON "ProviderRating" (is_verified, created_at DESC)
WHERE is_verified = true;

-- =====================================================
-- ÍNDICES DE CHAT Y MENSAJES
-- =====================================================

-- Índice compuesto para conversaciones por usuario y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_date
ON "ChatConversation" (user_id, updated_at DESC);

-- Índice para mensajes por conversación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation
ON "ChatMessage" (conversation_id, created_at DESC);

-- Índice para mensajes no leídos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread
ON "ChatMessage" (conversation_id, is_read)
WHERE is_read = false;

-- =====================================================
-- ÍNDICES DE SERVICIOS RECURRENTES
-- =====================================================

-- Índice para servicios recurrentes por cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurring_services_client
ON "RecurringService" (client_id, status, next_scheduled_date);

-- Índice para servicios recurrentes por proveedor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_recurring_services_provider
ON "RecurringService" (provider_id, status, next_scheduled_date);

-- Índice para instancias de servicios por fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_instances_date
ON "ServiceInstance" (scheduled_date, status);

-- =====================================================
-- ÍNDICES DE CONFIGURACIÓN DEL SISTEMA
-- =====================================================

-- Índice para configuración por clave
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_key
ON "SystemSetting" (key);

-- Índice para configuración por categoría
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_category
ON "SystemSetting" (category, key);

-- =====================================================
-- ÍNDICES DE LOGS Y AUDITORÍA
-- =====================================================

-- Índice para logs por usuario y fecha
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_date
ON "AuditLog" (user_id, created_at DESC);

-- Índice para logs por acción
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action
ON "AuditLog" (action, created_at DESC);

-- Índice para logs por entidad
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity
ON "AuditLog" (entity_type, entity_id, created_at DESC);

-- =====================================================
-- ÍNDICES PARCIALES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice parcial para usuarios activos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
ON "User" (id, email, role)
WHERE deleted_at IS NULL AND is_active = true;

-- Índice parcial para propiedades disponibles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_available
ON "Property" (id, price, city, region)
WHERE status = 'ACTIVE' AND is_available = true;

-- Índice parcial para visitas pendientes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_pending
ON "Visit" (id, scheduled_date, property_id)
WHERE status IN ('SCHEDULED', 'CONFIRMED');

-- =====================================================
-- ÍNDICES DE TEXTO COMPLETO (FTS)
-- =====================================================

-- Índice FTS para búsqueda en propiedades
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_fts
ON "Property"
USING GIN (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(address, '')));

-- Índice FTS para búsqueda en usuarios (proveedores)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_provider_fts
ON "User"
USING GIN (to_tsvector('spanish', coalesce(name, '') || ' ' || coalesce(business_name, '') || ' ' || coalesce(description, '')))
WHERE role IN ('MAINTENANCE_PROVIDER', 'SERVICE_PROVIDER');

-- =====================================================
-- ÍNDICES DE JSON (PARA CAMPOS JSONB)
-- =====================================================

-- Índice GIN para metadatos JSON
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_metadata
ON "User" USING GIN (metadata);

-- Índice GIN para configuración JSON
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_settings_value
ON "SystemSetting" USING GIN (value);

-- =====================================================
-- CONFIGURACIÓN DE MANTENIMIENTO AUTOMÁTICO
-- =====================================================

-- Configurar autovacuum agresivo para tablas con alta actividad
ALTER TABLE "Transaction" SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_analyze_threshold = 500
);

ALTER TABLE "ChatMessage" SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.05,
  autovacuum_analyze_threshold = 500
);

-- Configurar fillfactor para tablas con muchas actualizaciones
ALTER TABLE "User" SET (fillfactor = 70);
ALTER TABLE "Property" SET (fillfactor = 75);
ALTER TABLE "Visit" SET (fillfactor = 75);
ALTER TABLE "Transaction" SET (fillfactor = 70);

-- =====================================================
-- VISTAS MATERIALIZADAS PARA REPORTES
-- =====================================================

-- Vista materializada para estadísticas de proveedores
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_provider_stats AS
SELECT
  p.id,
  p.business_name,
  p.specialty,
  p.city,
  p.region,
  COUNT(r.id) as total_ratings,
  COALESCE(AVG(r.overall_rating), 0) as avg_rating,
  COUNT(DISTINCT t.id) as total_jobs,
  COALESCE(SUM(t.amount), 0) as total_earnings,
  MAX(r.created_at) as last_rating_date
FROM "User" p
LEFT JOIN "ProviderRating" r ON p.id = r.provider_id
LEFT JOIN "Transaction" t ON p.id = t.user_id AND t.transaction_type = 'SERVICE_PAYMENT'
WHERE p.role IN ('MAINTENANCE_PROVIDER', 'SERVICE_PROVIDER')
  AND p.deleted_at IS NULL
GROUP BY p.id, p.business_name, p.specialty, p.city, p.region;

-- Crear índices en la vista materializada
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_provider_stats_rating
ON mv_provider_stats (avg_rating DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_provider_stats_jobs
ON mv_provider_stats (total_jobs DESC);

-- Vista materializada para estadísticas de propiedades
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_stats AS
SELECT
  pr.id,
  pr.title,
  pr.city,
  pr.region,
  pr.price,
  pr.property_type,
  COUNT(v.id) as total_visits,
  COUNT(DISTINCT v.runner_id) as unique_runners,
  AVG(v.earnings) as avg_visit_earnings,
  MAX(v.scheduled_date) as last_visit_date
FROM "Property" pr
LEFT JOIN "Visit" v ON pr.id = v.property_id
WHERE pr.status = 'ACTIVE'
GROUP BY pr.id, pr.title, pr.city, pr.region, pr.price, pr.property_type;

-- Crear índices en la vista materializada
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_property_stats_visits
ON mv_property_stats (total_visits DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_property_stats_price
ON mv_property_stats (price, property_type);

-- Función para refrescar vistas materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_provider_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIONES DE MANTENIMIENTO
-- =====================================================

-- Función para limpiar datos antiguos (soft delete)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 365)
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  cutoff_date TIMESTAMP;
BEGIN
  cutoff_date := NOW() - INTERVAL '1 day' * days_old;

  -- Marcar logs antiguos como eliminados (si hay campo deleted_at)
  -- UPDATE "AuditLog" SET deleted_at = NOW()
  -- WHERE created_at < cutoff_date AND deleted_at IS NULL;

  -- En producción, considerar archivar en lugar de eliminar
  RETURN QUERY SELECT 0::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Función para reindexar tablas con fragmentación alta
CREATE OR REPLACE FUNCTION reindex_fragmented_tables()
RETURNS TABLE(table_name TEXT, fragmentation_percent NUMERIC) AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT
      schemaname || '.' || tablename as full_table_name,
      n_dead_tup,
      n_live_tup,
      CASE
        WHEN n_live_tup > 0 THEN
          ROUND((n_dead_tup::NUMERIC / (n_live_tup + n_dead_tup)) * 100, 2)
        ELSE 0
      END as fragmentation
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 1000
    ORDER BY fragmentation DESC
  LOOP
    -- Reindexar tablas con alta fragmentación
    IF rec.fragmentation > 20 THEN
      EXECUTE 'REINDEX TABLE CONCURRENTLY ' || rec.full_table_name;
    END IF;

    table_name := rec.full_table_name;
    fragmentation_percent := rec.fragmentation;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MONITOREO Y ALERTAS
-- =====================================================

-- Vista para monitoreo de rendimiento de índices
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  CASE
    WHEN idx_scan > 0 THEN
      ROUND((idx_tup_fetch::NUMERIC / idx_scan) * 100, 2)
    ELSE 0
  END as avg_tuples_per_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Vista para monitoreo de tamaño de tablas
CREATE OR REPLACE VIEW table_size_stats AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename || '_pkey')) as index_size,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- =====================================================
-- CONFIGURACIÓN DE REPLICACIÓN (PARA PRODUCCIÓN)
-- =====================================================

-- Configuración para logical replication (si se usa)
-- ALTER TABLE "User" REPLICA IDENTITY FULL;
-- ALTER TABLE "Property" REPLICA IDENTITY FULL;
-- ALTER TABLE "Transaction" REPLICA IDENTITY FULL;

-- =====================================================
-- OPTIMIZACIONES DE CONEXIÓN
-- =====================================================

-- Configurar pool de conexiones
-- ALTER SYSTEM SET max_connections = 200;
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET track_activity_query_size = 4096;

-- Crear usuario de solo lectura para reportes
-- CREATE ROLE readonly_user WITH LOGIN PASSWORD 'secure_password' NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;
-- GRANT CONNECT ON DATABASE rent360_prod TO readonly_user;
-- GRANT USAGE ON SCHEMA public TO readonly_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

COMMENT ON DATABASE CURRENT_DATABASE IS 'Rent360 Production Database - Optimized for high performance and scalability';
