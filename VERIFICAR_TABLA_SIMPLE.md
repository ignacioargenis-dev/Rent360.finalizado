# Verificar Tabla user_reports - Comando Simple

## ✅ Opción 1: SQL en una sola línea (Para Terminal Bash)

Ejecuta este comando en la terminal de DigitalOcean:

```bash
psql $DATABASE_URL -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_reports');"
```

**Si retorna `t` (true)**: ✅ La tabla existe  
**Si retorna `f` (false)**: ❌ La tabla no existe

## ✅ Opción 2: Crear archivo SQL y ejecutarlo

Si tienes acceso para crear archivos, crea un archivo temporal:

```bash
# Crear archivo
cat > /tmp/verificar_tabla.sql << 'EOF'
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'user_reports'
);
EOF

# Ejecutar
psql $DATABASE_URL -f /tmp/verificar_tabla.sql
```

## ✅ Opción 3: Usar Consola Web de DigitalOcean (Recomendado)

1. Ve a tu panel de DigitalOcean
2. Entra a **Databases** → Tu base de datos `rent360-db`
3. Click en **"Query"** o **"SQL Editor"**
4. Ahí puedes pegar el SQL completo sin problemas
5. Ejecuta el query

## ✅ Opción 4: Si la tabla no existe, crear con comando simple

Si la verificación retorna `false`, ejecuta este comando para crear la tabla:

```bash
psql $DATABASE_URL << 'EOF'
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
CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports"("reporterId");
CREATE INDEX IF NOT EXISTS "user_reports_reportedUserId_idx" ON "user_reports"("reportedUserId");
CREATE INDEX IF NOT EXISTS "user_reports_status_idx" ON "user_reports"("status");
CREATE INDEX IF NOT EXISTS "user_reports_createdAt_idx" ON "user_reports"("createdAt");
EOF
```
