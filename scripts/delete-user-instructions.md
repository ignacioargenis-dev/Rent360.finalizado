# Instrucciones para eliminar usuario desde Digital Ocean

## Opción 1: SQL Editor en Digital Ocean

1. **Accede a tu base de datos en Digital Ocean:**
   - Ve a tu proyecto en Digital Ocean
   - Navega a "Databases" → Selecciona tu base de datos PostgreSQL
   - Haz clic en "SQL Editor" o "Query"

2. **Ejecuta esta consulta para verificar el usuario:**

   ```sql
   SELECT id, name, email, role
   FROM "User"
   WHERE email = 'servicio@gmail.com';
   ```

3. **Si el usuario existe, ejecuta este comando para eliminarlo:**

   ```sql
   DELETE FROM "User"
   WHERE email = 'servicio@gmail.com';
   ```

   **Nota:** Esto eliminará automáticamente todos los registros relacionados debido a `ON DELETE CASCADE`:
   - ServiceProvider (si existe)
   - MaintenanceProvider (si existe)
   - ServiceJob
   - Maintenance
   - Y otros registros relacionados

## Opción 2: Usando psql desde la terminal

Si tienes acceso SSH o conexión directa:

```bash
# Conectar a la base de datos
psql "postgresql://[usuario]:[contraseña]@[host]:[puerto]/[database]?sslmode=require"

# Una vez conectado, ejecutar:
DELETE FROM "User" WHERE email = 'servicio@gmail.com';
```

## Opción 3: Usando la API endpoint (requiere ser ADMIN)

Si eres administrador, puedes usar la API endpoint que creé:

```bash
# Desde el navegador o Postman
DELETE https://tu-dominio.com/api/admin/delete-user?email=servicio@gmail.com
```

**Headers necesarios:**

- Cookie con la sesión de administrador autenticada

## Verificación

Después de eliminar, verifica que se eliminó correctamente:

```sql
SELECT id, name, email, role
FROM "User"
WHERE email = 'servicio@gmail.com';
```

Si no devuelve resultados, el usuario fue eliminado exitosamente.
