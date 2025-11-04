# Verificar Tabla user_reports en PostgreSQL

## ✅ Verificación Rápida

Ejecuta este SQL en la consola de PostgreSQL de DigitalOcean:

```sql
-- Verificar si la tabla existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'user_reports'
);
```

**Si retorna `true`**: ✅ La tabla existe, todo está bien.

**Si retorna `false`**: ❌ La tabla no existe, necesitas crearla ejecutando el SQL de `APLICAR_MIGRACION_MANUAL.md` (Opción 1).

## Verificación Completa

Si la tabla existe, verifica su estructura:

```sql
-- Ver estructura de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_reports'
ORDER BY ordinal_position;

-- Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_reports';

-- Verificar foreign keys
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_reports'::regclass;
```

## Esperado

Si todo está correcto, deberías ver:

- **Tabla**: `user_reports` con 11 columnas
- **Índices**: 4 índices (reporterId, reportedUserId, status, createdAt)
- **Foreign Keys**: 3 foreign keys (reporterId, reportedUserId, reviewedBy)
