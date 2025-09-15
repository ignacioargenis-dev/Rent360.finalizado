@echo off
echo ============================================
echo   SUBIENDO CAMBIOS A GITHUB - RENT360
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Verificando estado del repositorio...
git status
echo.

echo [2/4] Agregando cambios...
git add src/app/admin/contracts/page.tsx
echo.

echo [3/4] Creando commit...
git commit -m "fix: corregir error de tipos en contratos - asegurar createdAt siempre sea string

- Agregar type annotation explicita para Contract
- Asegurar createdAt nunca sea undefined usando fallback
- Agregar id temporal para satisfacer el tipo Contract
- Prevenir errores de TypeScript en DigitalOcean App Platform
- Mejorar robustez del codigo de creacion de contratos"
echo.

echo [4/4] Subiendo a GitHub...
git push origin master
echo.

echo ============================================
echo   ¡CAMBIOS SUBIDOS EXITOSAMENTE!
echo ============================================
echo.
echo Los cambios han sido subidos a GitHub.
echo El build deberia funcionar correctamente ahora.
echo.
pause
