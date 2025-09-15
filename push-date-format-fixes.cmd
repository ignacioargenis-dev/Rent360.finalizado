@echo off
echo Subiendo correcciones para llamadas formatDate con objetos Date...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"
git add "src/app/admin/reports/users/page.tsx"
git add "src/app/admin/reports/properties/page.tsx"
git add "src/app/tenant/contracts/page.tsx"
git add "src/app/owner/contracts/page.tsx"
git add "src/app/broker/contracts/page.tsx"
git add "src/app/admin/tickets/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir llamadas formatDate con objetos Date

- Convertir property.createdAt.toISOString() en todas las llamadas
- Resolver error 'Argument of type Date is not assignable to parameter of type string'
- Archivos corregidos:
  - src/app/admin/properties/page.tsx
  - src/app/admin/reports/users/page.tsx
  - src/app/admin/reports/properties/page.tsx
  - src/app/tenant/contracts/page.tsx
  - src/app/owner/contracts/page.tsx
  - src/app/broker/contracts/page.tsx
  - src/app/admin/tickets/page.tsx

La funcion formatDate espera un string, no un objeto Date"
