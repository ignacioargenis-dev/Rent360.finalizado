#!/bin/bash

echo "🚀 Configuración completa de desarrollo para Rent360"

# Generar cliente Prisma
echo "📊 Generando cliente Prisma..."
npm run db:generate

# Inicializar base de datos con datos de prueba
echo "🗄️ Inicializando base de datos..."
npm run db:init

echo "✅ Configuración completa!"
echo ""
echo "📋 Comandos útiles:"
echo "  npm run dev        - Iniciar servidor de desarrollo"
echo "  npm run build      - Construir para producción"
echo "  npm run start      - Iniciar servidor de producción"
echo ""
echo "🔗 URLs de prueba:"
echo "  http://localhost:3000           - Página principal"
echo "  http://localhost:3000/auth/login  - Login"
echo "  http://localhost:3000/auth/register - Registro"
echo ""
echo "👤 Usuarios de prueba:"
echo "  Admin: admin@rent360.cl / admin123"
echo "  Owner: owner@rent360.cl / owner123"
echo "  Tenant: tenant@rent360.cl / tenant123"
