# Servicios de Rent360

Este directorio contiene los servicios backend independientes de Rent360 que se ejecutan por separado de la aplicación Next.js principal.

## Estructura

```
services/
├── api-gateway/          # API Gateway principal
│   ├── src/
│   │   ├── index.ts      # Punto de entrada
│   │   ├── middleware/   # Middleware personalizado
│   │   └── routes/       # Definición de rutas
│   └── tsconfig.json     # Configuración TypeScript específica
└── README.md             # Esta documentación
```

## Compilación

Los servicios se compilan por separado de la aplicación Next.js principal:

```bash
# Compilar solo Next.js
npm run build

# Compilar todo (Next.js + servicios)
npm run build:all
```

## Despliegue

Los servicios pueden desplegarse de manera independiente:

```bash
# Compilar servicios
cd services/api-gateway
npx tsc --project tsconfig.json

# Ejecutar servicio
node dist/index.js
```

## Configuración

### Variables de Entorno

Los servicios usan las mismas variables de entorno que la aplicación principal. Consulta `config/production.env` para la configuración completa.

### Puerto por Defecto

- API Gateway: `3000` (configurable via `PORT`)

## Desarrollo

Para desarrollar servicios localmente:

```bash
# Instalar dependencias
npm install

# Desarrollar con hot-reload
cd services/api-gateway
npx ts-node-dev src/index.ts
```

## Notas Importantes

- Los servicios están excluidos del build de Next.js para evitar conflictos
- Cada servicio tiene su propia configuración TypeScript
- Los tipos personalizados están en `/types/express.d.ts`
- El ESLint ignora este directorio para evitar conflictos con Next.js

## Servicios Disponibles

### API Gateway
- **Puerto**: 3000
- **Propósito**: Proxy inverso y enrutamiento de API
- **Características**:
  - Rate limiting
  - Autenticación JWT
  - Logging estructurado
  - Health checks
  - Proxy a microservicios

## Monitoreo

Los servicios incluyen endpoints de health check:

```bash
# Health check del API Gateway
curl http://localhost:3000/health

# Estado de todos los servicios
curl http://localhost:3000/api/services/status
```

## Logs

Los logs se escriben tanto en consola como en archivo:

- **Archivo**: `api-gateway.log`
- **Formato**: JSON estructurado
- **Nivel**: Configurable via `LOG_LEVEL`

## Troubleshooting

### Error de Tipos Express

Si hay errores de tipos con Express:

```bash
# Verificar instalación de tipos
npm list @types/express

# Reinstalar si es necesario
npm install @types/express
```

### Puerto en Uso

```bash
# Cambiar puerto via variable de entorno
PORT=3001 npm run dev
```

### Problemas de Compilación

```bash
# Limpiar y recompilar
rm -rf node_modules/.cache
npm run build:all
```
