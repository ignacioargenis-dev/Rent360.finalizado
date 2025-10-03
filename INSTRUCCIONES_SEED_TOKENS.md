# Instrucciones para Usar Tokens JWT de Usuarios Seed

## Resumen

Se han generado tokens JWT válidos para todos los usuarios insertados por seed. Estos tokens permiten que los usuarios puedan acceder al sistema sin problemas de autenticación.

## Usuarios Disponibles

Los siguientes usuarios tienen tokens JWT válidos generados:

1. **Administrador** (`admin@rent360.cl`)
2. **Propietario** (`propietario@rent360.cl`)
3. **Inquilino** (`inquilino@rent360.cl`)
4. **Corredor** (`corredor@rent360.cl`)
5. **Runner** (`runner@rent360.cl`)
6. **Soporte** (`soporte@rent360.cl`)
7. **Proveedor de Servicios** (`proveedor@rent360.cl`)
8. **Servicio de Mantenimiento** (`mantenimiento@rent360.cl`)

## Cómo Usar los Tokens

### Método 1: Configuración Manual en el Navegador

1. Abre tu navegador y ve a la aplicación Rent360
2. Presiona `F12` para abrir las DevTools
3. Ve a la pestaña **Application** > **Cookies** > **localhost** (o tu dominio)
4. Crea dos cookies nuevas:
   - **Nombre**: `auth-token`
   - **Valor**: Copia el `accessToken` del usuario deseado del archivo `seed-tokens.json`
   - **Nombre**: `refresh-token`
   - **Valor**: Copia el `refreshToken` del usuario deseado del archivo `seed-tokens.json`
5. Recarga la página

### Método 2: Usar el Script de Configuración

También puedes crear un script de bookmarklet para configurar automáticamente los tokens:

```javascript
javascript: (function () {
  const tokens = {
    admin: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZzZ0dXQxbzAwMDB2ZWhibmRkdHI1YXAiLCJlbWFpbCI6ImFkbWluQHJlbnQzNjAuY2wiLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiQWRtaW5pc3RyYWRvciIsImlhdCI6MTc1OTUyOTU3MiwiZXhwIjoxNzU5NTMzMTcyfQ.jzgtMka3bCfWigI99HOfZBIYZxs1YtETOmWwzRVePIE',
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZzZ0dXQxbzAwMDB2ZWhibmRkdHI1YXAiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTc1OTUyOTU3MiwiZXhwIjoxNzYwMTM0MzcyfQ.-_EWElR4w4dmuJA6EDVES7G5SD1zPyivr-Zg244L4Bk',
    },
    // Agregar otros usuarios según sea necesario
  };

  const user = prompt(
    'Usuario: admin, propietario, inquilino, corredor, runner, soporte, proveedor, mantenimiento'
  );
  if (tokens[user]) {
    document.cookie = `auth-token=${tokens[user].accessToken}; path=/; max-age=3600`;
    document.cookie = `refresh-token=${tokens[user].refreshToken}; path=/; max-age=604800`;
    alert(`Tokens configurados para ${user}. Recarga la página.`);
    location.reload();
  } else {
    alert('Usuario no encontrado');
  }
})();
```

## Tokens Generados

Los tokens están guardados en el archivo `seed-tokens.json` en la raíz del proyecto. Cada usuario tiene:

- **accessToken**: Token de acceso (válido por 1 hora)
- **refreshToken**: Token de refresco (válido por 7 días)

## Notas Importantes

1. **Seguridad**: Estos tokens son para desarrollo/testing únicamente. En producción, los usuarios deben autenticarse normalmente.

2. **Expiración**: Los access tokens expiran en 1 hora. Si necesitas extenderlos, modifica la configuración JWT en `src/lib/auth.ts`.

3. **Roles**: Cada usuario tiene un rol específico que determina qué funcionalidades puede acceder:
   - `ADMIN`: Acceso completo al panel administrativo
   - `OWNER`: Acceso como propietario
   - `TENANT`: Acceso como inquilino
   - `BROKER`: Acceso como corredor
   - `RUNNER`: Acceso como runner
   - `SUPPORT`: Acceso al soporte técnico
   - `PROVIDER`: Acceso como proveedor de servicios
   - `MAINTENANCE`: Acceso como servicio de mantenimiento

4. **Regeneración**: Si necesitas regenerar los tokens, ejecuta:
   ```bash
   npx tsx scripts/generate-seed-tokens.ts
   ```

## Problemas Resueltos

Con estos tokens, se han resuelto los siguientes problemas:

1. ✅ Las métricas del sistema ya no muestran errores para usuarios admin
2. ✅ Los usuarios de seed ahora tienen sesiones válidas
3. ✅ El sistema de autenticación funciona correctamente con usuarios reales
4. ✅ Los endpoints protegidos ahora pueden ser accedidos por usuarios autenticados

## Testing

Para probar que todo funciona correctamente:

1. Configura un token de admin usando el método 1 o 2
2. Ve a `/admin/system-metrics`
3. Deberías ver las métricas del sistema sin errores
4. Prueba crear tickets en `/admin/tickets/new`
5. Verifica la vista de tablero en `/admin/tickets/board`
