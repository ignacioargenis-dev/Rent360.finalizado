@echo off
echo Subiendo correcciones de tipos TypeScript para contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir tipos TypeScript en mock data de contratos

- Agregar 'as const' a literales de status para type inference
- Completar propiedades requeridas en objetos Property y User
- Agregar campos faltantes como images[], features[], phone
- Corregir estructura de objetos anidados property/owner/tenant"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
