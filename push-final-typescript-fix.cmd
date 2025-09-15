@echo off
echo Subiendo correcciones finales de arrays vacios en TypeScript...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"
git add "src/app/tenant/contracts/page.tsx"
git add "src/app/owner/properties/new/page.tsx"
git add "src/app/broker/properties/new/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Eliminar 'as string[]' de arrays vacios

- Remover 'as string[]' de arrays vacios en mock data
- Simplificar sintaxis de arrays vacios para compatibilidad
- Resolver error 'Type string[] is not assignable to type string'
- TypeScript ahora infiere correctamente los tipos de arrays

Archivos corregidos:
- src/app/admin/properties/page.tsx
- src/app/tenant/contracts/page.tsx
- src/app/owner/properties/new/page.tsx
- src/app/broker/properties/new/page.tsx"
