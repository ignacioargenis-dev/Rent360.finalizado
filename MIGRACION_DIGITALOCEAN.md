# Migración de Base de Datos - Campos de Respuesta en Calificaciones

## 📋 Cambios Realizados

Se agregaron dos nuevos campos a la tabla `user_ratings`:

- `response` (TEXT, nullable) - Respuesta del usuario calificado
- `responseDate` (TIMESTAMP, nullable) - Fecha de la respuesta

## 🚀 Opciones para Aplicar la Migración en Digital Ocean

### Opción 1: Script Automatizado (Más Fácil y Recomendado)

1. **Accede a tu App en Digital Ocean**
   - Ve a https://cloud.digitalocean.com/apps
   - Selecciona tu aplicación Rent360

2. **Ejecuta el script de migración**
   - Ve a la pestaña "Runtime Logs" o "Console"
   - O usa el terminal integrado si está disponible
   - Ejecuta:

   ```bash
   node scripts/apply-rating-response-migration.js
   ```

   Este script:
   - Verifica si los campos ya existen
   - Los agrega solo si no existen
   - Regenera el cliente de Prisma
   - Es seguro ejecutarlo múltiples veces

3. **Verifica los datos**
   ```bash
   node scripts/verify-ratings-data.js
   ```

### Opción 2: Desde la Consola de Digital Ocean

1. **Accede a tu App en Digital Ocean**
   - Ve a https://cloud.digitalocean.com/apps
   - Selecciona tu aplicación Rent360

2. **Ejecuta el comando de migración**
   - Ve a la pestaña "Runtime Logs" o "Console"
   - O usa el terminal integrado si está disponible
   - Ejecuta:

   ```bash
   npx prisma migrate deploy
   ```

3. **Alternativa: Usar el script de migración**
   ```bash
   node scripts/migrate-production.js
   ```

### Opción 2: Desde tu Máquina Local (con acceso a la BD)

Si tienes acceso a la base de datos desde tu máquina local:

1. **Configura la variable de entorno**

   ```bash
   export DATABASE_URL="tu_connection_string_de_digital_ocean"
   ```

2. **Ejecuta la migración**
   ```bash
   npx prisma migrate deploy
   ```

### Opción 3: SQL Directo en Digital Ocean

Si prefieres ejecutar el SQL directamente:

1. **Accede a tu base de datos PostgreSQL en Digital Ocean**
   - Ve a Databases > Tu base de datos
   - Haz clic en "Connection Details" o "Query"
   - O usa el cliente SQL integrado

2. **Ejecuta el siguiente SQL:**
   ```sql
   ALTER TABLE "user_ratings"
   ADD COLUMN "response" TEXT,
   ADD COLUMN "responseDate" TIMESTAMP(3);
   ```

### Opción 4: Usando Digital Ocean CLI (doctl)

Si tienes `doctl` instalado:

```bash
# Conectar a tu base de datos
doctl databases connection <database-id>

# O ejecutar SQL directamente
psql $DATABASE_URL -c "ALTER TABLE user_ratings ADD COLUMN response TEXT, ADD COLUMN responseDate TIMESTAMP(3);"
```

## ✅ Verificación

Después de aplicar la migración, verifica que los campos se agregaron correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_ratings'
AND column_name IN ('response', 'responseDate');
```

Deberías ver:

- `response` | `text` | `YES`
- `responseDate` | `timestamp without time zone` | `YES`

## 🔄 Regenerar Cliente de Prisma

Después de la migración, asegúrate de regenerar el cliente de Prisma en producción:

```bash
npx prisma generate
```

## ⚠️ Notas Importantes

1. **Backup**: Aunque esta migración solo agrega columnas (no destructiva), siempre es recomendable hacer un backup antes de migraciones en producción.

2. **Downtime**: Esta migración NO requiere downtime ya que solo agrega columnas opcionales.

3. **Rollback**: Si necesitas revertir la migración:

   ```sql
   ALTER TABLE "user_ratings"
   DROP COLUMN "response",
   DROP COLUMN "responseDate";
   ```

4. **App Platform**: Si estás usando Digital Ocean App Platform, la migración se puede ejecutar automáticamente durante el deployment si tienes configurado el script `migrate-production.js` en tu Dockerfile o build commands.

## 📝 Comandos Rápidos

```bash
# 1. Aplicar migración
npx prisma migrate deploy

# 2. Verificar estado
npx prisma migrate status

# 3. Regenerar cliente
npx prisma generate

# 4. Verificar schema
npx prisma db pull
```

## 🆘 Si algo sale mal

Si encuentras errores durante la migración:

1. Verifica que tienes permisos suficientes en la base de datos
2. Asegúrate de que la tabla `user_ratings` existe
3. Revisa los logs de Digital Ocean para más detalles
4. Si es necesario, ejecuta el SQL manualmente usando la Opción 3
