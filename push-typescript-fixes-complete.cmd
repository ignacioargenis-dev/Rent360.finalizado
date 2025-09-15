@echo off
echo Subiendo correcciones completas de TypeScript...
echo.

REM Agregar archivos modificados
git add "src/app/admin/properties/page.tsx"
git add "src/app/admin/contracts/page.tsx"
git add "src/app/tenant/contracts/page.tsx"
git add "src/app/owner/properties/new/page.tsx"
git add "src/app/broker/properties/new/page.tsx"

REM Crear commit con mensaje descriptivo
git commit -m "fix: Corregir todos los errores de TypeScript en mock data

- Corregir tipos de arrays: [] as string[] para images y features
- Remover 'as const' restrictivos de status en properties y contracts
- Aplicar correcciones a todos los archivos con mock data problemáticos
- Resolver Type 'never[]' is not assignable to type 'string[]'
- Resolver conflictos de tipos literales restrictivos

Archivos corregidos:
- src/app/admin/properties/page.tsx
- src/app/admin/contracts/page.tsx
- src/app/tenant/contracts/page.tsx
- src/app/owner/properties/new/page.tsx
- src/app/broker/properties/new/page.tsx"

REM Subir cambios al repositorio remoto
git push origin master

echo.
echo ¡Cambios subidos exitosamente a GitHub!
echo.
