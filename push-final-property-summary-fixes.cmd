@echo off
echo Subiendo correcciones finales para PropertySummary createdAt...
echo.

REM Agregar archivos modificados
git add "src/app/admin/reports/properties/page.tsx"
git add "src/app/admin/reports/users/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Quitar .toISOString() de PropertySummary.createdAt

- Remover .toISOString() en llamadas formatDate para PropertySummary
- Resolver error 'Property toISOString does not exist on type string'
- La interfaz PropertySummary ya tiene createdAt como string
- Archivos corregidos:
  - src/app/admin/reports/properties/page.tsx
  - src/app/admin/reports/users/page.tsx

PropertySummary.createdAt ya es string, no Date"
