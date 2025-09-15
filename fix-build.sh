#!/bin/bash

# Script para corregir errores de build y subir cambios

echo "🔧 Corrigiendo errores de build..."

# Agregar cambios
git add src/app/admin/contracts/page.tsx

# Hacer commit
git commit -m "fix: corregir error de tipos en contratos - asegurar createdAt siempre sea string

- Agregar type annotation explícita para Contract
- Asegurar createdAt nunca sea undefined
- Mejorar robustez del código de creación de contratos
- Prevenir errores de TypeScript en DigitalOcean App Platform"

# Subir a GitHub
git push origin master

echo "✅ Cambios subidos exitosamente a GitHub"
echo "🚀 El build debería funcionar correctamente ahora"
