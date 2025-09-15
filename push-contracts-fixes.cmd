@echo off
echo Subiendo correcciones de TypeScript para contracts/page.tsx a GitHub...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir conflictos de TypeScript en contracts/page.tsx"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
