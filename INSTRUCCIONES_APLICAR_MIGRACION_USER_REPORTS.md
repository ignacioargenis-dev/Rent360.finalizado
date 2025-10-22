# Instrucciones para Aplicar Migración user_reports

## ⚠️ IMPORTANTE: Tabla user_reports Faltante

El sistema de reportes de usuarios requiere la tabla `user_reports` en la base de datos.
Actualmente la tabla **no existe** en producción, causando errores al intentar reportar usuarios.

## 📋 Pasos para Aplicar la Migración

### Opción 1: Usar Prisma Migrate (Recomendado)

```bash
# Conectarse a la consola de DigitalOcean
doctl apps list
doctl apps logs <APP_ID> --type run

# O desde tu máquina local con acceso a la base de datos
npx prisma migrate deploy
```

### Opción 2: Aplicar SQL Directamente

Si Prisma Migrate no funciona, aplica el SQL directamente en la base de datos de PostgreSQL:

```sql
-- CreateTable: user_reports para sistema de reportes de usuarios
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

-- CreateIndex
CREATE INDEX "user_reports_reporterId_idx" ON "user_reports"("reporterId");
CREATE INDEX "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
CREATE INDEX "user_reports_status_idx" ON "user_reports"("status");
CREATE INDEX "user_reports_createdAt_idx" ON "user_reports"("createdAt");

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reportedUserId_fkey"
    FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reviewedBy_fkey"
    FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Opción 3: Usar la Consola de DigitalOcean Database

1. Ve a tu proyecto en DigitalOcean
2. Navega a "Databases"
3. Selecciona tu base de datos PostgreSQL
4. Haz clic en "Connection Details"
5. Usa el botón "Connect" o copia la URL de conexión
6. Ejecuta el SQL de la Opción 2 en un cliente PostgreSQL (pgAdmin, DBeaver, etc.)

## ✅ Verificar que la Migración se Aplicó Correctamente

Ejecuta esta query para verificar:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'user_reports';
```

Si devuelve una fila, la tabla fue creada exitosamente.

## 🧪 Probar la Funcionalidad

Después de aplicar la migración:

1. Ve a Mensajes
2. Selecciona una conversación
3. Haz clic en "Reportar Usuario"
4. Completa el formulario:
   - Selecciona un motivo
   - Escribe una descripción (mínimo 10 caracteres)
5. Haz clic en "Enviar Reporte"
6. Deberías ver un mensaje de éxito

## 📊 Ver Reportes en la Base de Datos

```sql
-- Ver todos los reportes
SELECT * FROM user_reports ORDER BY "createdAt" DESC;

-- Ver reportes pendientes
SELECT ur.*,
       reporter.email as reporter_email,
       reported.email as reported_email
FROM user_reports ur
JOIN users reporter ON ur."reporterId" = reporter.id
JOIN users reported ON ur."reportedUserId" = reported.id
WHERE ur.status = 'PENDING'
ORDER BY ur."createdAt" DESC;
```

## 🔔 Sistema de Notificaciones

Cuando se crea un reporte:

- Se guarda en la tabla `user_reports`
- Se crean notificaciones para todos los usuarios con rol `ADMIN` o `SUPPORT`
- Las notificaciones aparecen en el panel de cada admin/support

## 📝 Notas Adicionales

- **Status**: PENDING, REVIEWED, RESOLVED, DISMISSED
- **Reasons**: spam, harassment, inappropriate_content, scam, fake_profile, other
- **Cascade**: Si se elimina un usuario, sus reportes también se eliminan
- **Reviewer**: Campo opcional para el admin que revisa el reporte
