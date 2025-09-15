# Script PowerShell para subir cambios automáticamente
Write-Host "🔧 Aplicando corrección final y subiendo cambios a GitHub..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location $PSScriptRoot

# Agregar cambios
Write-Host "📝 Agregando cambios..." -ForegroundColor Yellow
git add src/app/admin/contracts/page.tsx

# Hacer commit
Write-Host "💾 Creando commit..." -ForegroundColor Yellow
$message = @"
fix: corregir error de tipos en contratos - asegurar createdAt siempre sea string

- Agregar type annotation explicita para Contract
- Asegurar createdAt nunca sea undefined usando fallback
- Agregar id temporal para satisfacer el tipo Contract
- Prevenir errores de TypeScript en DigitalOcean App Platform
- Mejorar robustez del codigo de creacion de contratos
"@

git commit -m $message

# Subir a GitHub
Write-Host "🚀 Subiendo a GitHub..." -ForegroundColor Yellow
git push origin master

Write-Host "✅ Cambios subidos exitosamente a GitHub!" -ForegroundColor Green
Write-Host "🎉 El build debería funcionar correctamente ahora" -ForegroundColor Cyan

Read-Host "Presiona Enter para continuar"
