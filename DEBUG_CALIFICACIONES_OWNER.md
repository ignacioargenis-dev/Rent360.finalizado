# 🔍 Debug: Calificaciones del Owner No Se Muestran

## 📋 Problema

- **Síntoma**: El owner "Ignacio Argenis" tiene 2 calificaciones en la BD pero la página muestra 0
- **Datos verificados**: El script `verify-ratings-data.js` confirma que existen 2 calificaciones para este owner

## 🔍 Pasos para Debuggear

### Paso 1: Verificar Logs del Servidor

En Digital Ocean, revisa los Runtime Logs cuando el owner carga la página de ratings. Deberías ver:

```
🔍 [UserRatingService] getUserRatings query: { userId: '...', filters: {...}, where: {...} }
🔍 [UserRatingService] getUserRatings results: { userId: '...', total: X, ratingsCount: Y, ... }
Calificaciones obtenidas para usuario: { targetUserId: '...', filters: {...}, total: X, ... }
```

**Qué buscar:**

- ¿El `userId` en el query coincide con el `toUserId` de las calificaciones en la BD?
- ¿El `where` contiene `{ toUserId: 'ID_DEL_OWNER' }`?
- ¿El `total` es mayor que 0?

### Paso 2: Verificar en el Navegador

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Recarga la página de ratings del owner
4. Busca la petición a `/api/ratings?limit=100`
5. Revisa la respuesta JSON

**Qué buscar:**

- ¿La respuesta tiene `success: true`?
- ¿`data.total` es mayor que 0?
- ¿`data.ratings` tiene elementos?

También deberías ver en la consola:

```
🔍 [Owner Ratings Page] API Response: { success: true, total: X, ratingsCount: Y, ... }
```

### Paso 3: Verificar Autenticación

El problema podría ser que el `user.id` del usuario autenticado no coincide con el `toUserId` de las calificaciones.

**Verificar en la BD:**

```sql
-- Obtener el ID del owner "Ignacio Argenis"
SELECT id, name, role, email FROM users WHERE name LIKE '%Ignacio Argenis%' AND role = 'OWNER';

-- Verificar calificaciones para ese owner
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
WHERE ur."toUserId" = 'ID_DEL_OWNER_OBTENIDO_ARRIBA'
ORDER BY ur."createdAt" DESC;
```

### Paso 4: Verificar Filtros

El problema podría estar en los filtros aplicados. Verifica:

1. **Filtro `isPublic`**:
   - Si las calificaciones tienen `isPublic: false`, no se mostrarán a menos que se pase `isPublic=false` en la URL
   - **Solución**: La página debería pasar `isPublic=false` o no filtrar por `isPublic` (que es lo que hace actualmente)

2. **Filtro `given`**:
   - Si se pasa `given=true`, buscará calificaciones dadas por el usuario, no recibidas
   - **Solución**: Asegúrate de que NO se pase `given=true` en la URL

3. **Filtros avanzados**:
   - Si hay filtros de fecha o rating, podrían estar excluyendo las calificaciones
   - **Solución**: Verifica que no haya filtros activos

### Paso 5: Verificar Query de Prisma

Si los logs muestran que el `where` está correcto pero no devuelve resultados, podría haber un problema con el query de Prisma.

**Verificar directamente en la BD:**

```sql
-- Ejecutar el mismo query que Prisma debería ejecutar
SELECT
  ur.*,
  u1.name as "fromUserName",
  u2.name as "toUserName"
FROM "user_ratings" ur
LEFT JOIN "users" u1 ON ur."fromUserId" = u1.id
LEFT JOIN "users" u2 ON ur."toUserId" = u2.id
WHERE ur."toUserId" = 'ID_DEL_OWNER'
ORDER BY ur."createdAt" DESC
LIMIT 100;
```

## 🐛 Problemas Comunes y Soluciones

### Problema 1: `user.id` no coincide con `toUserId`

**Síntoma**: Los logs muestran que el `userId` en el query es diferente al `toUserId` de las calificaciones

**Solución**:

- Verificar que el usuario esté autenticado correctamente
- Verificar que el token JWT contenga el `id` correcto
- Verificar que no haya múltiples usuarios con el mismo nombre

### Problema 2: Filtro `isPublic` está excluyendo calificaciones

**Síntoma**: Las calificaciones tienen `isPublic: false` pero la API no las devuelve

**Solución**:

- Modificar la página para pasar `isPublic=false` en la URL, o
- Modificar la API para que por defecto no filtre por `isPublic` cuando el usuario es el dueño de las calificaciones

### Problema 3: Query de Prisma no devuelve resultados

**Síntoma**: El `where` está correcto pero Prisma no devuelve resultados

**Solución**:

- Verificar que no haya problemas de conexión a la BD
- Verificar que la tabla `user_ratings` tenga los índices correctos
- Verificar que no haya problemas de permisos en la BD

## 🔧 Solución Temporal

Si necesitas una solución rápida mientras se debuggea, puedes modificar temporalmente la página para que muestre todas las calificaciones sin filtros:

```typescript
// En src/app/owner/ratings/page.tsx, línea 185
const response = await fetch('/api/ratings?limit=100&isPublic=false', {
  // ... resto del código
});
```

O mejor aún, modificar la API para que cuando el usuario es el dueño de las calificaciones, no filtre por `isPublic`:

```typescript
// En src/app/api/ratings/route.ts, después de línea 170
// Si el usuario es el dueño de las calificaciones, no filtrar por isPublic
const isOwnerViewingOwnRatings = !userId || userId === user.id;
if (isOwnerViewingOwnRatings && isPublicParam === null) {
  // No aplicar filtro isPublic para que el usuario vea todas sus calificaciones
} else if (isPublicParam !== null) {
  filters.isPublic = isPublicParam === 'true';
}
```

## 📝 Checklist de Verificación

- [ ] Logs del servidor muestran el query correcto
- [ ] Logs del servidor muestran `total > 0`
- [ ] Respuesta de la API en Network tab tiene `data.ratings.length > 0`
- [ ] `user.id` coincide con `toUserId` de las calificaciones
- [ ] No hay filtros activos que excluyan las calificaciones
- [ ] Query SQL directo devuelve las calificaciones
- [ ] Autenticación funciona correctamente

## 🚀 Próximos Pasos

1. Revisar los logs del servidor en Digital Ocean
2. Revisar la consola del navegador
3. Ejecutar el query SQL directo para verificar
4. Si el problema persiste, aplicar la solución temporal
