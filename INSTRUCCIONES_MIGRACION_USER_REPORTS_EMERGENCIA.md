# 🚨 EMERGENCIA: Aplicar Migración user_reports INMEDIATAMENTE

**Fecha:** 5 de noviembre de 2025
**Prioridad:** CRÍTICA - Sistema de mensajería no funciona sin esto

## ❌ PROBLEMA ACTUAL

El sistema de reportes de usuarios está completamente roto porque la tabla `user_reports` no existe en producción. Esto causa errores 500 en la API `/api/messages/report`.

## ✅ SOLUCIÓN: Aplicar SQL Directamente

### Opción 1: Consola de DigitalOcean Database (Más Fácil)

1. **Ir a DigitalOcean Console:**
   - Ve a https://cloud.digitalocean.com/
   - Navega a Databases
   - Selecciona tu base de datos PostgreSQL

2. **Abrir SQL Query Console:**
   - Click en "Actions" → "Open console" o "Query stats"
   - Ve a la pestaña "SQL" o "Query"

3. **Ejecutar el SQL completo:**

```sql
-- Crear tabla user_reports
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

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId");
CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status");
CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt");

-- Agregar claves foráneas
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey"
    FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL;
```

4. **Verificar la migración:**

```sql
-- Contar registros existentes
SELECT COUNT(*) FROM user_reports;

-- Ver algunos registros de ejemplo
SELECT id, reason, status, "createdAt" FROM user_reports ORDER BY "createdAt" DESC LIMIT 3;
```

### Opción 2: Usando psql/CLI (Si tienes acceso SSH)

Si tienes acceso directo a la base de datos:

```bash
# Conectar a PostgreSQL
psql "postgresql://usuario:password@host:port/database"

# Ejecutar el SQL de arriba
\i migration_user_reports.sql
```

### Opción 3: Prisma Migrate (Si tienes acceso al servidor)

```bash
# En el servidor de producción
npx prisma migrate deploy
```

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Después de aplicar la migración, verifica que funcione:

1. **En la aplicación:** Intenta reportar un usuario desde el chat
2. **En la consola:** Deberías ver el mensaje "Reporte enviado exitosamente"
3. **En la base de datos:**

```sql
SELECT * FROM user_reports WHERE "createdAt" > NOW() - INTERVAL '5 minutes';
```

## 🚨 IMPORTANTE

- **NO reiniciar la aplicación** hasta verificar que la migración funcionó
- Si hay errores en la migración, **NO continuar** con otras correcciones
- Una vez aplicada, el sistema de reportes funcionará completamente

## 📞 SIGUIENTE PASO

Después de aplicar esta migración, procederemos con las correcciones del middleware y sistema de archivos.

**¿Has aplicado la migración? Responde "SÍ" para continuar con las siguientes correcciones.**
