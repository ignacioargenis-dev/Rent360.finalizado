# 🔧 Solución al Problema de Calificaciones

## 📋 Problema Identificado

1. **Migración no detectada**: Prisma no detectó la migración `20241119_add_rating_response_fields`
2. **Calificaciones no visibles**: El owner recibió una calificación pero no se muestra en su página

## ✅ Solución Paso a Paso

### Paso 1: Aplicar la Migración Manualmente

Ejecuta en la consola de Digital Ocean:

```bash
node scripts/apply-rating-response-migration.js
```

Este script:

- ✅ Verifica si los campos ya existen
- ✅ Los agrega solo si no existen
- ✅ Regenera el cliente de Prisma
- ✅ Es seguro ejecutarlo múltiples veces

**Alternativa SQL directo** (si el script no funciona):

```sql
ALTER TABLE "user_ratings"
ADD COLUMN IF NOT EXISTS "response" TEXT,
ADD COLUMN IF NOT EXISTS "responseDate" TIMESTAMP(3);
```

### Paso 2: Verificar los Datos

Ejecuta el script de verificación:

```bash
node scripts/verify-ratings-data.js
```

Este script mostrará:

- ✅ Estructura de la tabla
- ✅ Total de calificaciones
- ✅ Últimas 10 calificaciones con detalles
- ✅ Calificaciones por rol

### Paso 3: Verificar Calificaciones del Owner

Si el owner recibió una calificación pero no se muestra, verifica:

1. **Verificar que la calificación existe en la BD**:

   ```sql
   SELECT
     ur.id,
     ur."overallRating",
     ur."contextType",
     ur."fromUserId",
     u1.name as "fromUserName",
     ur."toUserId",
     u2.name as "toUserName",
     ur."createdAt"
   FROM "user_ratings" ur
   LEFT JOIN "users" u1 ON ur."fromUserId" = u1.id
   LEFT JOIN "users" u2 ON ur."toUserId" = u2.id
   WHERE ur."toUserId" = 'ID_DEL_OWNER'
   ORDER BY ur."createdAt" DESC;
   ```

2. **Verificar que la API devuelve las calificaciones**:
   - Abre la consola del navegador (F12)
   - Ve a la pestaña "Network"
   - Recarga la página de ratings del owner
   - Busca la petición a `/api/ratings`
   - Verifica la respuesta JSON

3. **Verificar logs del servidor**:
   - Los logs deberían mostrar:
     ```
     Calificaciones obtenidas para usuario: { targetUserId: '...', total: X, ratingsCount: Y }
     ```

### Paso 4: Debuggear el Problema

Si las calificaciones existen pero no se muestran:

1. **Verificar filtros en la API**:
   - La API `/api/ratings` debería devolver calificaciones donde `toUserId = user.id`
   - Por defecto, `given=false` busca calificaciones recibidas

2. **Verificar la página del owner**:
   - La página hace fetch a `/api/ratings?limit=100`
   - Debería mostrar todas las calificaciones recibidas
   - Verifica que `ratings.length > 0` en la consola del navegador

3. **Verificar contexto de la calificación**:
   - Las calificaciones pueden tener diferentes `contextType`:
     - `PROPERTY_VISIT` - Visitas a propiedades
     - `MAINTENANCE` - Servicios de mantenimiento
     - `SERVICE` - Servicios generales
     - `CONTRACT` - Contratos
   - La página del owner debería mostrar TODOS los contextos

## 🔍 Comandos de Verificación Rápida

```bash
# 1. Verificar estructura de la tabla
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_ratings' AND column_name IN ('response', 'responseDate');"

# 2. Contar calificaciones totales
psql $DATABASE_URL -c "SELECT COUNT(*) FROM user_ratings;"

# 3. Ver calificaciones recientes
psql $DATABASE_URL -c "SELECT id, \"overallRating\", \"contextType\", \"fromUserId\", \"toUserId\", \"createdAt\" FROM user_ratings ORDER BY \"createdAt\" DESC LIMIT 10;"

# 4. Ver calificaciones de un owner específico
psql $DATABASE_URL -c "SELECT id, \"overallRating\", \"contextType\", \"fromUserId\", \"toUserId\", \"createdAt\" FROM user_ratings WHERE \"toUserId\" = 'ID_DEL_OWNER' ORDER BY \"createdAt\" DESC;"
```

## 🐛 Problemas Comunes y Soluciones

### Problema 1: "No pending migrations to apply"

**Solución**: La migración no está registrada en `_prisma_migrations`. Usa el script manual o SQL directo.

### Problema 2: "Calificaciones existen pero no se muestran"

**Causas posibles**:

- Filtro incorrecto en la API (verificar `given` parameter)
- `toUserId` incorrecto en la calificación
- Problema de autenticación (el usuario no coincide)

**Solución**: Verificar con el script `verify-ratings-data.js`

### Problema 3: "Error al crear calificación"

**Causas posibles**:

- Campos requeridos faltantes
- Violación de constraint único
- Error de validación

**Solución**: Revisar logs del servidor para ver el error específico

## 📝 Checklist de Verificación

- [ ] Migración aplicada (campos `response` y `responseDate` existen)
- [ ] Cliente de Prisma regenerado
- [ ] Calificaciones existen en la BD (verificar con script)
- [ ] API devuelve calificaciones (verificar en Network tab)
- [ ] Página muestra calificaciones (verificar en UI)
- [ ] Logs no muestran errores

## 🚀 Próximos Pasos

1. Aplicar la migración usando el script
2. Verificar los datos con el script de verificación
3. Si el problema persiste, ejecutar los comandos SQL de verificación
4. Revisar los logs del servidor para más detalles

## 📞 Soporte

Si el problema persiste después de seguir estos pasos:

1. Ejecuta `node scripts/verify-ratings-data.js` y comparte la salida
2. Revisa los logs del servidor en Digital Ocean
3. Verifica la consola del navegador para errores de JavaScript
