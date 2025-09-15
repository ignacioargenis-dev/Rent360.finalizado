# Script de PowerShell para subir corrección crítica
Set-Location "C:\Users\Perrita\Documents\GitHub\Rent360.finalizado"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "URGENTE: SUBIENDO CORRECCIÓN A GITHUB" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Verificar cambios
Write-Host "[1/4] Verificando cambios..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Agregar cambios
Write-Host "[2/4] Agregando cambios..." -ForegroundColor Yellow
git add .
Write-Host ""

# Crear commit
Write-Host "[3/4] Creando commit..." -ForegroundColor Yellow
$commitMessage = @"
fix: correccion definitiva error TypeScript createdAt

- Resolver error 'string | undefined' en contracts page
- Cambiar split('T')[0] por substring(0, 10) para mayor seguridad
- Garantizar formato YYYY-MM-DD valido
- Fix DigitalOcean App Platform build error
- Preparar despliegue exitoso
"@

git commit -m $commitMessage
Write-Host ""

# Subir a GitHub
Write-Host "[4/4] Subiendo a GitHub..." -ForegroundColor Yellow
git push origin master
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "¡CORRECCIÓN SUBIDA EXITOSAMENTE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "El build de DigitalOcean debería funcionar correctamente ahora." -ForegroundColor Cyan
Write-Host ""

Read-Host "Presiona Enter para continuar"
