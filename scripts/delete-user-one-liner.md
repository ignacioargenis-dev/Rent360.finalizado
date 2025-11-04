# Comando de una línea para eliminar usuario

## Desde la consola de Digital Ocean

### Opción 1: Usando npx tsx (si tienes acceso al proyecto)

```bash
npx tsx scripts/delete-user.ts servicio@gmail.com
```

### Opción 2: Usando Node.js directamente

```bash
node -r dotenv/config -r ts-node/register scripts/delete-user.ts servicio@gmail.com
```

### Opción 3: Desde el contenedor de la aplicación

Si tienes acceso SSH al contenedor:

```bash
# Conectar al contenedor
cd /workspace && npx tsx scripts/delete-user.ts servicio@gmail.com
```

### Opción 4: Comando directo con DATABASE_URL

Si tienes la DATABASE_URL, puedes ejecutar:

```bash
DATABASE_URL="tu_connection_string" npx tsx scripts/delete-user.ts servicio@gmail.com
```

## Alternativa: Usando psql directamente

Si tienes psql instalado en Digital Ocean:

```bash
psql "$DATABASE_URL" -c "DELETE FROM \"User\" WHERE email = 'servicio@gmail.com';"
```

O con la connection string completa:

```bash
psql "postgresql://user:password@host:port/database" -c "DELETE FROM \"User\" WHERE email = 'servicio@gmail.com';"
```

## Verificación

Después de ejecutar, verifica que se eliminó:

```bash
npx tsx scripts/delete-user.ts servicio@gmail.com
```

Si no encuentra el usuario, significa que fue eliminado exitosamente.
