# Dockerfile para Rent360 - Optimizado para DigitalOcean App Platform

# Etapa 1: Base
FROM node:18-alpine AS base

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    libc6-compat \
    postgresql-client \
    redis \
    && rm -rf /var/cache/apk/*

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Etapa 2: Dependencias de producción
FROM base AS deps

# Instalar dependencias de producción
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Etapa 3: Build
FROM base AS builder

# Copiar dependencias de producción
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Configurar entorno de build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generar cliente Prisma
RUN npx prisma generate

# Build de la aplicación
RUN npm run build

# Etapa 4: Runner (producción)
FROM base AS runner

# Configurar usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public

# Copiar build optimizado (sin standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copiar archivos de configuración y servidor personalizado
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/src ./src/
COPY --from=builder /app/node_modules ./node_modules/

# Ejecutar migraciones antes de cambiar usuario (necesita permisos root)
RUN npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "Migration may have failed, continuing..."

# Configurar permisos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Configurar puerto
EXPOSE 3000

# Configurar variables de entorno
ENV PORT 3000
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Comando de inicio
CMD ["node", "server.js"]
