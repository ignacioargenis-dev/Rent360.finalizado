@echo off
echo Subiendo correcciones para PropertySummary.owner vs ownerId...
echo.

REM Agregar archivos modificados
git add "src/app/admin/reports/properties/page.tsx"
git add "src/app/admin/reports/users/page.tsx"
git add "src/app/runner/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir property.ownerId -> property.owner en PropertySummary

- Cambiar property.ownerId por property.owner en filtros de búsqueda
- Resolver error 'Property ownerId does not exist on type PropertySummary'
- Archivos corregidos:
  - src/app/admin/reports/properties/page.tsx
  - src/app/admin/reports/users/page.tsx
  - src/app/runner/properties/page.tsx

La interfaz PropertySummary tiene owner (string), no ownerId"
