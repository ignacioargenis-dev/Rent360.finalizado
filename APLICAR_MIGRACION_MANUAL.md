# Instrucciones para Aplicar Migración user_reports en Producción

## ⚠️ IMPORTANTE: Base de Datos ya tiene Esquema

El error P3005 indica que la base de datos ya tiene esquema. Necesitamos aplicar el SQL directamente.

## 📋 Pasos

### Opción 1: PostgreSQL SQL Directo (Más Seguro y Recomendado)

1. Conectarse a la consola de DigitalOcean Database (PostgreSQL)
2. Ejecutar este SQL de PostgreSQL completo:

```sql
-- Verificar si la tabla ya existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'user_reports'
);

-- Si no existe (retorna false), ejecutar este SQL:
CREATE TABLE IF NOT EXISTS "user_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- Crear índices (solo si no existen)
CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId");
CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status");
CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt");

-- Crear foreign keys (solo si no existen)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_reports_reporterId_fkey'
    ) THEN
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reporterId_fkey"
        FOREIGN KEY ("reporterId")
        REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_reports_reportedUserId_fkey'
    ) THEN
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reportedUserId_fkey"
        FOREIGN KEY ("reportedUserId")
        REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_reports_reviewedBy_fkey'
    ) THEN
        ALTER TABLE "user_reports"
        ADD CONSTRAINT "user_reports_reviewedBy_fkey"
        FOREIGN KEY ("reviewedBy")
        REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Verificar que se creó correctamente
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'user_reports'
ORDER BY ordinal_position;
```

### Opción 2: Marcar Migración como Aplicada (Si la tabla ya existe)

Si la tabla `user_reports` **ya existe** en la base de datos, puedes marcar la migración como aplicada usando:

```bash
# Opción A: Con npx (recomendado)
npx prisma migrate resolve --applied 20241022_add_user_reports

# Opción B: Con npm run (si tienes el script)
npm run db:migrate -- resolve --applied 20241022_add_user_reports
```

### Opción 3: Usar Prisma Migrate con Baseline

Si quieres configurar Prisma para que reconozca tu base de datos existente:

```bash
# Opción A: Con npx
npx prisma migrate resolve --applied 20241022_add_user_reports

# Opción B: Con npm
npm run db:migrate -- resolve --applied 20241022_add_user_reports

# Luego, para futuras migraciones:
npx prisma migrate deploy
# O
npm run db:migrate
```

## ✅ Verificación

Después de aplicar, verificar:

```sql
-- Verificar tabla
SELECT * FROM user_reports LIMIT 1;

-- Verificar índices
SELECT indexname FROM pg_indexes WHERE tablename = 'user_reports';

-- Verificar foreign keys
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'user_reports'::regclass;
```

## 📝 Nota sobre npx vs npm

- **`npx`**: Ejecuta comandos directamente (recomendado para Prisma)
- **`npm run`**: Ejecuta scripts definidos en `package.json`

Ambos funcionan, pero `npx` es más directo y no requiere scripts en package.json.
