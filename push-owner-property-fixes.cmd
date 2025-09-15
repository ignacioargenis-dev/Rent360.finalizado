@echo off
echo Subiendo correcciones para property.owner -> property.ownerId...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"
git add "src/app/runner/properties/page.tsx"
git add "src/app/admin/reports/users/page.tsx"
git add "src/app/admin/reports/properties/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir property.owner -> property.ownerId en filtros de busqueda

- Cambiar property.owner por property.ownerId en todos los filtros
- Resolver errores 'Property owner does not exist on type Property'
- Archivos corregidos:
  - src/app/admin/properties/page.tsx
  - src/app/runner/properties/page.tsx
  - src/app/admin/reports/users/page.tsx
  - src/app/admin/reports/properties/page.tsx

La interfaz Property solo tiene ownerId (string), no owner (objeto)"
