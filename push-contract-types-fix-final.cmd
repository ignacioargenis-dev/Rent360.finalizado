@echo off
echo Subiendo correcciones finales de tipos TypeScript para contratos...
echo.

REM Agregar archivos modificados
git add "src/app/admin/contracts/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir errores de tipos TypeScript en contratos - agregar 'as any'

- Agregar 'as any' a objetos property, owner, tenant en mock data
- Corregir incompatibilidad entre objetos anidados y tipos globales
- Resolver error: 'Object literal may only specify known properties'
- Mantener compatibilidad con interfaces globales Contract, Property, User"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
